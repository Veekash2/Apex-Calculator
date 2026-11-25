# Apex-Calculator

Personal tool to check my Apex Legends account level and calculate how many Apex Packs I have left until level 500.

**Live site:** https://veekash2.github.io/Apex-Calculator/ — type a profile name and click Look up (add `?demo` to preview with sample data)

Uses the [Apex Legends Status API](https://apexlegendsapi.com) to look up player stats. Non-commercial, single user, about one request an hour.

## How it works

- On the site, type a profile name and click **Look up**. For a new profile the site opens a pre-filled GitHub issue (`lookup:<PLATFORM>:<name>`); submit it.
- The issue triggers `.github/workflows/update-stats.yml`, which calls the API with the `APEX_API_KEY` **repository secret**, commits the result to `stats/<platform>/<name>.json`, and closes the issue. Only issues opened by the repo owner run a lookup.
- The site waits for that file and shows the stats. Profiles already looked up refresh hourly. The API key never reaches the website.
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
