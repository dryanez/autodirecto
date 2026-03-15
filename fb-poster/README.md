# 🚗 FB Auto-Poster — AutoDirecto

Automatically posts cars from your CRM to **Facebook Marketplace** and shares them across **42 V-Region car groups**.

## Architecture

```
┌─────────────────────────┐
│  Your Mac (Chrome)      │
│                         │
│  ┌───────────────────┐  │
│  │ Flask Web UI      │  │    ┌──────────────┐
│  │ localhost:5050     │──────│ Supabase CRM │
│  └───────┬───────────┘  │    │ (car data +  │
│          │              │    │  images)      │
│  ┌───────▼───────────┐  │    └──────────────┘
│  │ Playwright        │  │
│  │ (your Chrome      │  │    ┌──────────────┐
│  │  profile + FB     │──────│ FB Marketplace│
│  │  session)         │  │    │ + 42 Groups  │
│  └───────────────────┘  │    └──────────────┘
└─────────────────────────┘
```

## How it works

1. **Pulls cars** from your CRM (Supabase `consignaciones` table where `en_venta=true`)
2. **Shows web dashboard** at `http://localhost:5050` with car selector, preview, and group picker
3. **Opens Chrome** with your real Facebook session (Playwright + persistent Chrome profile)
4. **Posts to Marketplace** — fills in all vehicle details, uploads photos, sets location to "Bosques de Miramar, Viña del Mar"
5. **Shares to groups** — posts the Marketplace listing URL to all selected groups with random delays (15-45s between each)

## Setup

```bash
cd fb-poster

# Create virtual env
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run
python app.py
```

## Usage

1. **Close Google Chrome** completely (Playwright needs exclusive access to your Chrome profile)
2. Run `python app.py`
3. Open `http://localhost:5050`
4. Select a car → preview the listing → select groups → click "Publicar"
5. Watch Chrome open and automate everything
6. **Don't touch the browser** while it's posting

## ⚠️ Important Warnings

- **This is browser automation** — Facebook can detect and ban automated accounts
- Random delays between group posts (15-45 seconds) to reduce detection risk
- If Facebook shows a checkpoint/captcha, the posting stops
- Run during reasonable hours, not 3am
- Don't post the same car to the same groups repeatedly in short periods
- If banned, wait 24-48 hours before retrying

## Location

Default posting location: **Bosques de Miramar, Avenida Bosques, Viña del Mar**

Edit `.env` to change:
```
FB_LOCATION_NAME=Bosques de Miramar, Viña del Mar
FB_LATITUDE=-33.0245
FB_LONGITUDE=-71.5518
```

## Groups (42 configured)

All V-Region and Chile-wide car buying/selling groups. Full list in `app.py`.
