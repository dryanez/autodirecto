"""
Facebook Marketplace - GraphQL Scraper (structure confirmed)
Uses Playwright to intercept /api/graphql/ responses from FB Marketplace
and parse the confirmed structure:
  data.marketplace_search.feed_units.edges[].node.listing

Fields:
  - marketplace_listing_title
  - listing_price.formatted_amount / .amount
  - location.reverse_geocode.city
  - custom_sub_titles_with_rendering_flags[0].subtitle  (km)
  - id (listing ID)
  - marketplace_listing_seller.name

REQUIREMENT: Close Google Chrome before running (profile must not be locked).
"""

import asyncio
import csv
import json
import shutil
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright

# ─── Config ─────────────────────────────────────────────────────────────────────
TARGET_URL = (
    "https://www.facebook.com/marketplace/106647439372422/search/"
    "?minPrice=8000000&query=Vehicles&exact=false&radius=20"
)
OUTPUT_FILE  = Path(__file__).parent / "facebook_graphql_vehicles.csv"
SCROLL_STEPS = 40
SCROLL_PX    = 1200
SCROLL_DELAY = 2.5
CHROME_USER_DATA = Path.home() / "Library/Application Support/Google/Chrome"

# ─── Global store ───────────────────────────────────────────────────────────────
vehicles: dict[str, dict] = {}
graphql_count = 0

# ─── Parser — confirmed structure ───────────────────────────────────────────────
def parse_feed_units(data: dict):
    try:
        edges = data["data"]["marketplace_search"]["feed_units"]["edges"]
    except (KeyError, TypeError):
        return

    for edge in edges:
        try:
            listing = edge["node"]["listing"]
            lid = str(listing.get("id", ""))
            title = listing.get("marketplace_listing_title") or listing.get("custom_title", "")
            price = (listing.get("listing_price") or {}).get("formatted_amount", "")
            city = (
                (listing.get("location") or {})
                .get("reverse_geocode", {})
                .get("city", "")
            )
            km_list = listing.get("custom_sub_titles_with_rendering_flags") or []
            km = km_list[0].get("subtitle", "") if km_list else ""
            seller = (listing.get("marketplace_listing_seller") or {}).get("name", "")
            listing_url = f"https://www.facebook.com/marketplace/item/{lid}/"

            if lid and title and lid not in vehicles:
                vehicles[lid] = {
                    "id": lid,
                    "title": title,
                    "price": price,
                    "city": city,
                    "km": km,
                    "seller": seller,
                    "url": listing_url,
                }
                print(f"  ✅ [{len(vehicles):>3}] {title[:50]:<50} | {price:<18} | {city} | {km}")
        except Exception:
            continue


# ─── Response handler ────────────────────────────────────────────────────────────
async def handle_response(response):
    global graphql_count
    if "/api/graphql" not in response.url:
        return
    graphql_count += 1
    try:
        text = await response.text()
        data = json.loads(text)
        parse_feed_units(data)
    except Exception:
        pass


# ─── Main ────────────────────────────────────────────────────────────────────────
async def main():
    if not CHROME_USER_DATA.exists():
        print("❌ Chrome user data directory not found!")
        return

    print("📂 Copying Chrome profile to temp directory…")
    tmp_dir = Path(tempfile.mkdtemp(prefix="fb_chrome_"))
    default_src = CHROME_USER_DATA / "Default"
    default_dst = tmp_dir / "Default"
    shutil.copytree(default_src, default_dst, ignore=shutil.ignore_patterns(
        'Cache', 'Code Cache', 'GPUCache', 'Service Worker',
        'blob_storage', 'IndexedDB', 'File System',
        'GCM Store', 'BudgetDatabase', 'optimization_guide*',
        'heavy_ad*', 'AutofillStrikeDatabase',
        'databases', 'Platform Notifications', 'shared_proto_db',
    ), dirs_exist_ok=True)
    local_state = CHROME_USER_DATA / "Local State"
    if local_state.exists():
        shutil.copy2(local_state, tmp_dir / "Local State")
    print(f"✅ Profile ready at: {tmp_dir}")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=str(tmp_dir),
            headless=False,
            channel="chromium",
            args=["--disable-blink-features=AutomationControlled"],
            viewport={"width": 1280, "height": 900},
        )
        page = context.pages[0] if context.pages else await context.new_page()
        page.on("response", handle_response)

        print("🌐 Opening Facebook…")
        await page.goto("https://www.facebook.com", wait_until="domcontentloaded", timeout=30_000)
        await asyncio.sleep(3)

        if "login" in page.url or "checkpoint" in page.url:
            print("\n⚠️  Not logged in. Log in manually — waiting 90s…\n")
            for _ in range(90):
                await asyncio.sleep(1)
                if "login" not in page.url and "checkpoint" not in page.url:
                    print("✅ Logged in!")
                    break
        else:
            print("✅ Already logged in!")

        print(f"\n🌐 Navigating to marketplace…")
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=60_000)
        await asyncio.sleep(5)

        print(f"\n🔄 Scrolling {SCROLL_STEPS} times…\n")
        for i in range(1, SCROLL_STEPS + 1):
            await page.evaluate(f"window.scrollBy(0, {SCROLL_PX})")
            print(f"  Scroll {i:>2}/{SCROLL_STEPS} — {len(vehicles)} vehicles | {graphql_count} GraphQL hits")
            await asyncio.sleep(SCROLL_DELAY)

        await asyncio.sleep(3)

        print(f"\n💾 Saving {len(vehicles)} vehicles → {OUTPUT_FILE}")
        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["id", "title", "price", "city", "km", "seller", "url"])
            writer.writeheader()
            writer.writerows(vehicles.values())

        print(f"\n✅ Done! {len(vehicles)} vehicles → {OUTPUT_FILE}")
        print(f"   GraphQL responses intercepted: {graphql_count}")
        await context.close()

    shutil.rmtree(tmp_dir, ignore_errors=True)
    print("🗑️  Temp profile cleaned up.")


if __name__ == "__main__":
    asyncio.run(main())
