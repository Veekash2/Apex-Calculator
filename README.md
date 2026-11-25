# Apex-Calculator

Personal tool to check my Apex Legends account level and calculate how many Apex Packs I have left until level 500.

Uses the [Apex Legends Status API](https://apexlegendsapi.com) to look up player stats (account level and progress). Non-commercial, single user, only a few requests a day.

## Setup

Set your API key as an environment variable (never commit it):

```powershell
$env:APEX_API_KEY = "your-key-here"
```
