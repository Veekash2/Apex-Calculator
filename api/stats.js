// Serverless function (Vercel): GET /api/stats?player=<name>&platform=PC|PS4|X1|SWITCH
// Calls the Apex Legends Status API with the key from the APEX_API_KEY environment
// variable, so the key never reaches the browser.
//
// Lookup order:
//   1. /bridge?player=<name>      (search by name)
//   2. /nametouid?player=<name>   (name -> account UID), then /bridge?uid=<uid>
//
// Every upstream call is logged (Vercel → Project → Logs). Add &debug=1 to get the
// same diagnostics in the JSON response. The API key is never logged or returned.

const PLATFORMS = new Set(["PC", "PS4", "X1", "SWITCH"]);
const ALLOWED_ORIGINS = ["https://veekash2.github.io"];
const BASE = "https://api.mozambiquehe.re";

function allowOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".vercel.app") || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function log(event, data) {
  console.log(JSON.stringify({ event, ...data }));
}

// ---- rate limiting ----
// The API key allows 1 request per second. Calls from this instance are queued so they
// start at least GAP_MS apart, and a throttled (429) call is retried once.
const GAP_MS = 1100;
let nextSlot = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitTurn() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + GAP_MS;
  if (at > now) await sleep(at - now);
}
const isThrottle = (status, json) => status === 429 || (json && /throttl|slow down/i.test(json.Error || ""));

// Short in-memory cache (per warm instance) so repeat lookups don't spend the rate limit.
const CACHE_MS = 60 * 1000;
const cache = new Map();

// One upstream call, with timing and a trimmed copy of the body for diagnostics.
async function call(path, key, trace, attempt = 1) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    trace.push({ path, status: 200, ms: 0, error: null, body: "(cached)" });
    return hit.json;
  }
  await waitTurn();
  const started = Date.now();
  const entry = { path, status: null, ms: null, error: null, body: null, attempt };
  let json = null;
  try {
    const r = await fetch(BASE + path, { headers: { Authorization: key } });
    entry.status = r.status;
    const text = await r.text();
    entry.body = text.length > 600 ? text.slice(0, 600) + "…" : text;
    try { json = JSON.parse(text); } catch { entry.error = "Response was not JSON"; }
    if (json && json.Error) entry.error = json.Error;
  } catch (e) {
    entry.error = "Network error: " + (e && e.message);
  }
  entry.ms = Date.now() - started;
  trace.push(entry);
  log("upstream", { path, status: entry.status, ms: entry.ms, attempt, error: entry.error, body: entry.body && entry.body.slice(0, 300) });

  if (isThrottle(entry.status, json) && attempt < 3) {
    nextSlot = Math.max(nextSlot, Date.now() + GAP_MS); // back off before the retry
    return call(path, key, trace, attempt + 1);
  }
  if (json && !json.Error && json.global) cache.set(path, { at: Date.now(), json });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return json;
}

// Keep per-legend trackers and icons; drop the large unused fields.
function trimLegends(all) {
  if (!all || typeof all !== "object") return null;
  const out = {};
  for (const [name, l] of Object.entries(all)) {
    if (!l || typeof l !== "object") continue;
    out[name] = {
      data: Array.isArray(l.data) ? l.data.map(t => ({ name: t.name, value: t.value, key: t.key, global: t.global ? true : undefined })) : [],
      icon: l.ImgAssets && l.ImgAssets.icon,
    };
  }
  return out;
}

const isPlayer = d => d && !d.Error && d.global && typeof d.global === "object";

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (allowOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const player = String(req.query.player || "").trim();
  const platform = String(req.query.platform || "PC").toUpperCase();
  const debug = req.query.debug === "1";
  if (!player || player.length > 64) return res.status(400).json({ error: "Enter your EA ID (PC) or console name." });
  if (!PLATFORMS.has(platform)) return res.status(400).json({ error: "Unknown platform." });

  const key = process.env.APEX_API_KEY;
  if (!key) {
    log("config", { error: "APEX_API_KEY missing" });
    return res.status(500).json({ error: "Server is missing the APEX_API_KEY environment variable." });
  }

  log("lookup", { player, platform, debug });
  const trace = [];
  const name = encodeURIComponent(player);

  let data, method, uid = null;
  if (/^\d{6,20}$/.test(player)) {
    // 0. A numeric account ID (UID) was entered: look it up directly.
    uid = player;
    data = await call(`/bridge?uid=${name}&platform=${platform}`, key, trace);
    method = "uid";
  } else {
    // 1. Search by name.
    data = await call(`/bridge?player=${name}&platform=${platform}`, key, trace);
    method = "name";
  }

  // 2. Fall back to name -> UID -> stats.
  if (!isPlayer(data) && method === "name" && !isThrottle(trace[trace.length - 1].status, data)) {
    const lookup = await call(`/nametouid?player=${name}&platform=${platform}`, key, trace);
    uid = (lookup && !lookup.Error && (lookup.uid || (lookup.result && lookup.result.uid))) || null;
    if (uid) {
      data = await call(`/bridge?uid=${encodeURIComponent(uid)}&platform=${platform}`, key, trace);
      method = "uid";
    }
  }

  const diagnostics = debug ? { diagnostics: { player, platform, uid, steps: trace } } : {};

  if (!isPlayer(data)) {
    const last = trace[trace.length - 1] || {};
    const msg = (data && data.Error) || last.error || "Lookup failed";
    const throttled = isThrottle(last.status, data);
    const status = throttled ? 429 : /not found/i.test(msg) ? 404 : 502;
    log("result", { player, platform, ok: false, status, msg, uid });
    if (throttled) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Retry-After", "2");
      return res.status(429).json({ error: "The stats API is busy (limit: 1 lookup per second). Try again in a couple of seconds.", ...diagnostics });
    }
    if (!debug) res.setHeader("Cache-Control", "s-maxage=60");
    return res.status(status).json({ error: msg, ...diagnostics });
  }

  log("result", { player, platform, ok: true, method, uid, name: data.global.name, level: data.global.level });
  if (!debug) res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  return res.status(200).json({
    updated: new Date().toISOString(),
    method,
    global: data.global,
    realtime: data.realtime,
    legends: { selected: data.legends && data.legends.selected, all: trimLegends(data.legends && data.legends.all) },
    total: data.total || null,
    ...diagnostics,
  });
};
