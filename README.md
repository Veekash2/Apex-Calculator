# Apex-Calculator

Personal tool to check my Apex Legends account level and calculate how many Apex Packs I have left until level 500.

**Live site:** https://veekash2.github.io/Apex-Calculator/ — type a profile name and click Look up (add `?demo` to preview with sample data)

Uses the [Apex Legends Status API](https://apexlegendsapi.com) to look up player stats. Non-commercial, single user, about one request an hour.

## How it works

- Anyone can type a profile name on the site and click **Look up** to get live stats.
- The page calls `api/stats.js`, a Vercel serverless function that reads the key from the `APEX_API_KEY` **environment variable** and calls the API. The key never reaches the browser. Identical lookups are cached for 2 minutes to stay within API limits.
- The site works on Vercel directly, and the GitHub Pages copy calls the Vercel function (https://apex-calculator-veekash.vercel.app).

## Deploy (Vercel)

1. Sign in at https://vercel.com with GitHub and **Import** this repository (no build settings needed).
2. Under **Environment Variables**, add `APEX_API_KEY` = your key, then **Deploy**.
- **Packs opened** isn't available from the API, so the site has a counter you update yourself; it's saved in your browser.

## Command line

```powershell
$env:APEX_API_KEY = "your-key-here"
.\apex-packs.ps1 -Player "YourName" -Platform PC   # PC, PS4 (PlayStation) or X1 (Xbox)
.\apex-packs.ps1 -Level 137                        # no API needed
```

## Pack schedule

| Levels   | Packs                 |
|----------|-----------------------|
| 2–20     | 1 every level (19)    |
| 22–300   | 1 every 2 levels (140)|
| 305–500  | 1 every 5 levels (40) |
| **Total**| **199**               |
