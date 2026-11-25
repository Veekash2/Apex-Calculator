// Serverless function (Vercel): GET /api/stats?player=<name>&platform=PC|PS4|X1|SWITCH
// Calls the Apex Legends Status API with the key from the APEX_API_KEY environment
// variable, so the key never reaches the browser.

const PLATFORMS = new Set(["PC", "PS4", "X1", "SWITCH"]);
const ALLOWED_ORIGINS = ["https://veekash2.github.io"];

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
  if (!player || player.length > 64) return res.status(400).json({ error: "Enter your EA ID (PC) or console name." });
  if (!PLATFORMS.has(platform)) return res.status(400).json({ error: "Unknown platform." });

  const key = process.env.APEX_API_KEY;
  if (!key) return res.status(500).json({ error: "Server is missing the APEX_API_KEY environment variable." });

  let data;
  try {
    const r = await fetch(
      `https://api.mozambiquehe.re/bridge?player=${encodeURIComponent(player)}&platform=${platform}`,
      { headers: { Authorization: key } }
    );
    data = await r.json().catch(() => null);
    if (!data || data.Error || !data.global) {
      const msg = (data && data.Error) || `Apex API returned ${r.status}`;
      const status = /not found/i.test(msg) ? 404 : r.status === 429 ? 429 : 502;
      // Short cache on misses too, so repeated bad lookups don't hit the API.
      res.setHeader("Cache-Control", "s-maxage=60");
      return res.status(status).json({ error: msg });
    }
  } catch {
    return res.status(502).json({ error: "Could not reach the Apex API. Try again shortly." });
  }

  // Cache identical lookups at Vercel's edge for 2 minutes to stay within API limits.
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  return res.status(200).json({
    updated: new Date().toISOString(),
    global: data.global,
    realtime: data.realtime,
    legends: { selected: data.legends && data.legends.selected },
  });
};
