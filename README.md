# Apex-Calculator

Personal tool to check my Apex Legends account level and calculate how many Apex Packs I have left until level 500.

**Live site:** https://veekash2.github.io/Apex-Calculator/ — type a profile name and click Look up (add `?demo` to preview with sample data)

Uses the [Apex Legends Status API](https://apexlegendsapi.com) to look up player stats. Non-commercial, single user, about one request an hour.

## How it works

- `.github/workflows/update-stats.yml` runs hourly (or on demand from the Actions tab). It calls the API with the `APEX_API_KEY` **repository secret** and commits the result to `stats.json`.
- `index.html` (GitHub Pages) reads `stats.json`. The API key never reaches the website.
- **Packs opened** isn't available from the API, so the site has a counter you update yourself; it's saved in your browser.

## Setup

In **Settings → Secrets and variables → Actions**:

| Type     | Name            | Value                                   |
|----------|-----------------|-----------------------------------------|
| Secret   | `APEX_API_KEY`  | your key from apexlegendsapi.com        |
| Variable | `APEX_PLAYER`   | your in-game name                       |
| Variable | `APEX_PLATFORM` | `PC`, `PS4` or `X1` (defaults to `PC`)  |

Then run **Actions → Update stats → Run workflow**.

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
