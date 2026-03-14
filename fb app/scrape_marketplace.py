"""
Facebook Marketplace - GraphQL Scraper (smart V-Region filtering)
Uses Playwright to intercept /api/graphql/ responses from FB Marketplace
and parse the confirmed structure:
  data.marketplace_search.feed_units.edges[].node.listing

SMART STOP: Stops when 500 qualifying V-Region leads (≥4M CLP) are found,
            or after 2000 scrolls (safety limit).

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
    "?minPrice=4000000&query=Vehicles&exact=false&radius=20"
)
OUTPUT_FILE  = Path(__file__).parent / "facebook_graphql_vehicles.csv"
MAX_SCROLLS  = 2000          # safety cap — never scroll more than this
TARGET_LEADS = 500           # stop early when we reach this many qualifying leads
MIN_PRICE    = 4_000_000     # 4 million CLP minimum
SCROLL_PX    = 1200
SCROLL_DELAY = 2.5
CHROME_USER_DATA = Path.home() / "Library/Application Support/Google/Chrome"

# ─── V Region communes (lowercase) ─────────────────────────────────────────────
V_REGION_COMMUNES = {
    "viña del mar", "vina del mar", "concón", "concon",
    "valparaíso", "valparaiso", "quilpué", "quilpue",
    "villa alemana", "quintero", "limache", "olmué", "olmue",
    "casablanca", "quillota", "la cruz", "puchuncaví", "puchuncavi",
    "calera", "nogales", "hijuelas", "algarrobo",
    "el quisco", "el tabo", "san antonio", "cartagena", "santo domingo",
}

# ─── Global store ───────────────────────────────────────────────────────────────
vehicles: dict[str, dict] = {}
qualifying_count = 0          # V-Region + ≥4M CLP
graphql_count = 0

# ─── Helpers ────────────────────────────────────────────────────────────────────
def _is_v_region(city: str) -> bool:
    """Check if the city belongs to V Region."""
    if not city:
        return False
    loc = city.lower().strip()
    return any(commune in loc for commune in V_REGION_COMMUNES)


def _parse_price_clp(formatted: str) -> int:
    """Extract numeric CLP value from strings like 'CLP 5.500.000' or '$5.500.000'."""
    if not formatted:
        return 0
    digits = "".join(ch for ch in formatted if ch.isdigit())
    return int(digits) if digits else 0


# ─── Parser — confirmed structure ───────────────────────────────────────────────
def parse_feed_units(data: dict):
    global qualifying_count
    try:
        edges = data["data"]["marketplace_search"]["feed_units"]["edges"]
    except (KeyError, TypeError):
        return

    for edge in edges:
        try:
            listing = edge["node"]["listing"]
            lid = str(listing.get("id", ""))
            title = listing.get("marketplace_listing_title") or listing.get("custom_title", "")
            price_fmt = (listing.get("listing_price") or {}).get("formatted_amount", "")
            price_raw = int((listing.get("listing_price") or {}).get("amount", "0") or "0")
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
                # Determine price (prefer raw amount, fallback to parsing formatted)
                price_num = price_raw if price_raw > 0 else _parse_price_clp(price_fmt)
                is_v = _is_v_region(city)
                qualifies = is_v and price_num >= MIN_PRICE

                vehicles[lid] = {
                    "id": lid,
                    "title": title,
                    "price": price_fmt,
                    "price_clp": price_num,
                    "city": city,
                    "km": km,
                    "seller": seller,
                    "url": listing_url,
                    "v_region": is_v,
                    "qualifies": qualifies,
                }

                if qualifies:
                    qualifying_count += 1
                    tag = f"🟢 Q{qualifying_count:>3}/{TARGET_LEADS}"
                else:
                    tag = "⚪ skip"

                print(f"  {tag} [{len(vehicles):>4}] {title[:45]:<45} | {price_fmt:<18} | {city:<20} | {km}")
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

        print(f"\n🔄 Smart scraping: target {TARGET_LEADS} qualifying V-Region leads (max {MAX_SCROLLS} scrolls)…\n")
        for i in range(1, MAX_SCROLLS + 1):
            await page.evaluate(f"window.scrollBy(0, {SCROLL_PX})")
            print(f"  Scroll {i:>4}/{MAX_SCROLLS} — {qualifying_count}/{TARGET_LEADS} qualifying | {len(vehicles)} total | {graphql_count} GraphQL")
            await asyncio.sleep(SCROLL_DELAY)

            # ── Smart stop: we have enough qualifying leads ──
            if qualifying_count >= TARGET_LEADS:
                print(f"\n🎯 Reached {qualifying_count} qualifying V-Region leads! Stopping early.")
                break

        await asyncio.sleep(3)

        # ── Save ALL vehicles (full CSV) ──
        print(f"\n💾 Saving {len(vehicles)} total vehicles → {OUTPUT_FILE}")
        fieldnames = ["id", "title", "price", "price_clp", "city", "km", "seller", "url", "v_region", "qualifies"]
        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(vehicles.values())

        # ── Also save QUALIFYING only ──
        qualified_file = OUTPUT_FILE.with_name("facebook_qualified_v_region.csv")
        qualified = [v for v in vehicles.values() if v["qualifies"]]
        with open(qualified_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(qualified)

        print(f"\n✅ Done!")
        print(f"   Total vehicles scraped:    {len(vehicles)}")
        print(f"   Qualifying V-Region leads: {qualifying_count}")
        print(f"   All vehicles →             {OUTPUT_FILE}")
        print(f"   Qualified only →           {qualified_file}")
        print(f"   GraphQL responses:         {graphql_count}")
        await context.close()

    shutil.rmtree(tmp_dir, ignore_errors=True)
    print("🗑️  Temp profile cleaned up.")


if __name__ == "__main__":
    asyncio.run(main())
