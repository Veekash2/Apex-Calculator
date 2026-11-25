# Apex-Calculator

Personal tool to check my Apex Legends account level and calculate how many Apex Packs I have left until level 500.

Uses the [Apex Legends Status API](https://apexlegendsapi.com) to look up player stats (account level and progress). Non-commercial, single user, only a few requests a day.

## Setup

Set your API key as an environment variable (never commit it):

```powershell
$env:APEX_API_KEY = "your-key-here"
```

## Usage

```powershell
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
