"""
FB Marketplace Auto-Poster
──────────────────────────
Automates posting cars to Facebook Marketplace and 42 V-Region groups.
Uses Playwright with your real Chrome profile (headful browser).

Architecture:
  - Flask web UI (dashboard to manage which cars to post)
  - Supabase integration (pulls cars from your CRM)
  - Playwright automation (posts to Marketplace + groups)

IMPORTANT: This runs on YOUR Mac with Chrome. Cannot run on a server.
           Close Chrome before starting.
"""
import asyncio
import json
import os
import re
import time
import tempfile
import requests
import threading
from pathlib import Path
from datetime import datetime, timezone
from flask import Flask, jsonify, request, render_template_string
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# ─── Config ─────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kqympdxeszdyppbhtzbm.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

CHROME_USER_DATA = Path.home() / "Library" / "Application Support" / "Google" / "Chrome"

# Marketplace location
FB_LOCATION = os.getenv("FB_LOCATION_NAME", "Bosques de Miramar, Viña del Mar")
FB_LAT = float(os.getenv("FB_LATITUDE", "-33.0245"))
FB_LNG = float(os.getenv("FB_LONGITUDE", "-71.5518"))

# ─── Facebook Groups ────────────────────────────────────────────────────────────
FB_GROUPS = [
    {"name": "CHILE AUTOS - Sin Telefono Se Borra la publicacion", "url": "https://www.facebook.com/groups/repuestosdeautos.cl/"},
    {"name": "MUNDO TUERCA VALPO, VIÑA", "url": "https://www.facebook.com/groups/1721514511403756/"},
    {"name": "Autos Viña del mar - Valparaiso", "url": "https://www.facebook.com/groups/chileautosvinadelmar/"},
    {"name": "venta de autos y repuestos V región", "url": "https://www.facebook.com/groups/367129786996327/"},
    {"name": "Autos Valparaiso - Viña del mar", "url": "https://www.facebook.com/groups/chileautosvalparaiso/"},
    {"name": "Todo Tuercas Quilpue - Villa Alemana - Limache - Olmue - Quillota", "url": "https://www.facebook.com/groups/todotuercas/"},
    {"name": "venta de autos y motos V region", "url": "https://www.facebook.com/groups/651487044978775/"},
    {"name": "Vende tu auto VRegion", "url": "https://www.facebook.com/groups/617218648426911/"},
    {"name": "Autos en Venta Quinta Región Chile", "url": "https://www.facebook.com/groups/autos.en.venta.quinta.region.chile/"},
    {"name": "VENTA DE VEHÍCULOS DE OCASIÓN 🤝 Autos Chile 🇨🇱", "url": "https://www.facebook.com/groups/701541853761323/"},
    {"name": "compra y permutas de autos quinta region", "url": "https://www.facebook.com/groups/819445958235019/"},
    {"name": "Venta de Autos Usado en Chile", "url": "https://www.facebook.com/groups/467592933360081/"},
    {"name": "Gran feria del auto usado V Region", "url": "https://www.facebook.com/groups/236187406570255/"},
    {"name": "Venta de Autos 5ta Region (1)", "url": "https://www.facebook.com/groups/3089228341220930/"},
    {"name": "Venta de Autos 5ta Region (2)", "url": "https://www.facebook.com/groups/1537403170317369/"},
    {"name": "Compraventa autos v región", "url": "https://www.facebook.com/groups/639650642724240/"},
    {"name": "COMPROVEHICULOS.CL", "url": "https://www.facebook.com/groups/506547946136436/"},
    {"name": "Compra, venta y permutas camionetas, Autos, Suv chile", "url": "https://www.facebook.com/groups/671270960818458/"},
    {"name": "AUTOS USADOS CHILE . CL", "url": "https://www.facebook.com/groups/669775896446268/"},
    {"name": "VEHICULOS USADOS DE TODO CHILE ✅", "url": "https://www.facebook.com/groups/1094829247361002/"},
    {"name": "Yapo concon", "url": "https://www.facebook.com/groups/231458073867654/"},
    {"name": "COMPRA Y VENTA DE AUTOS NUEVOS Y USADOS CHILE", "url": "https://www.facebook.com/groups/330969950788171/"},
    {"name": "Compra Venta - Autos CHILE", "url": "https://www.facebook.com/groups/1401391943432509/"},
    {"name": "Venta de Autos 0KM, Seminuevos y Usados en Chile", "url": "https://www.facebook.com/groups/autos0kmseminuevosyusados/"},
    {"name": "Autos y motos V REGIÓN", "url": "https://www.facebook.com/groups/481371528705498/"},
    {"name": "Autos Usados Chile", "url": "https://www.facebook.com/groups/autosbaratostemucoyalrededores/"},
    {"name": "Autos Usados Viña del Mar", "url": "https://www.facebook.com/groups/548654176561779/"},
    {"name": "Vendo Mi Auto Viña Del Mar", "url": "https://www.facebook.com/groups/1156515334359895/"},
    {"name": "Compra-Venta AUTOS USADOS. Chile", "url": "https://www.facebook.com/groups/754676712758575/"},
    {"name": "autos V region chile 🔰", "url": "https://www.facebook.com/groups/750188968678503/"},
    {"name": "Feria tuerca quinta region", "url": "https://www.facebook.com/groups/470520613089491/"},
    {"name": "Venta de Autos V region", "url": "https://www.facebook.com/groups/375455562659988/"},
    {"name": "MULTI AUTOS V REGIÓN", "url": "https://www.facebook.com/groups/590614651103274/"},
    {"name": "COMPRA Y VENTA DE AUTOS QUILPUE Y ALREDEDORES", "url": "https://www.facebook.com/groups/1237843139611306/"},
    {"name": "BUSCO AUTO V REGION", "url": "https://www.facebook.com/groups/AUTOSQUINTAREGION/"},
    {"name": "COMPRA, VENDE O PERMUTA UN AUTO", "url": "https://www.facebook.com/groups/229097777240972/"},
    {"name": "Todo autos quinta region", "url": "https://www.facebook.com/groups/809445329202354/"},
    {"name": "COMPRA VENTA DE AUTOS Y MOTOS QUINTA REGION", "url": "https://www.facebook.com/groups/340277276445153/"},
    {"name": "venta vehiculo quillota y alrededores", "url": "https://www.facebook.com/groups/2872527959681039/"},
    {"name": "Autos Clasificados Quinta Región", "url": "https://www.facebook.com/groups/192003684626534/"},
    {"name": "Venta de autos quinta región", "url": "https://www.facebook.com/groups/938149021504442/"},
    {"name": "Marketplace Valpo-Viña", "url": "https://www.facebook.com/groups/1246293805815497/"},
]

# ─── In-memory job tracker ──────────────────────────────────────────────────────
jobs = {}   # job_id → { status, log, result, car, started_at, finished_at }


# ─── Supabase helpers ───────────────────────────────────────────────────────────
def _supa_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def supa_get(table, params=None):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_supa_headers(),
        params=params or {},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def supa_insert(table, data):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_supa_headers(),
        json=data,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def supa_update(table, data, match):
    params = {f"{k}": f"eq.{v}" for k, v in match.items()}
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_supa_headers(),
        json=data,
        params=params,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


# ─── Fetch cars from CRM ────────────────────────────────────────────────────────
def fetch_available_cars():
    """
    Get all consignaciones that are en_venta=true with their images.
    Returns enriched car dicts with images attached.
    """
    # Get consignaciones en venta
    cars = supa_get("consignaciones", {
        "select": "*",
        "en_venta": "eq.true",
        "order": "updated_at.desc",
    })

    # For each car, fetch its vehicle_images
    for car in cars:
        appraisal_id = car.get("appraisal_supabase_id")
        if appraisal_id:
            images = supa_get("vehicle_images", {
                "select": "url,label,photo_type",
                "appraisal_id": f"eq.{appraisal_id}",
                "order": "created_at.asc",
            })
            car["_images"] = [img["url"] for img in images if img.get("url")]
        else:
            car["_images"] = []

        # Also check if listing exists with image_urls
        listing_id = car.get("listing_id")
        if listing_id and not car["_images"]:
            listings = supa_get("listings", {
                "select": "image_urls",
                "id": f"eq.{listing_id}",
            })
            if listings and listings[0].get("image_urls"):
                urls = listings[0]["image_urls"]
                if isinstance(urls, str):
                    urls = json.loads(urls)
                car["_images"] = [u["url"] if isinstance(u, dict) else u for u in urls]

    return cars


def build_car_caption(car):
    """Build a rich Facebook Marketplace-style caption for a car."""
    brand = car.get("car_make", "").strip()
    model = car.get("car_model", "").strip()
    year = car.get("car_year", "")
    version = car.get("version", "").strip()
    mileage = car.get("mileage") or car.get("km_verified")
    color = car.get("color", "").strip()
    price = car.get("selling_price") or car.get("owner_price") or 0

    title = f"{brand} {model} {year}".strip()
    if version:
        title += f" {version}"

    lines = [
        f"🚗 {title}",
        "",
    ]

    if year:
        lines.append(f"📅 Año: {year}")
    if mileage:
        lines.append(f"📏 Kilómetros: {mileage:,} km".replace(",", "."))
    if color:
        lines.append(f"🎨 Color: {color}")
    if version:
        lines.append(f"⚙️ Versión: {version}")

    lines.append("")

    if price:
        lines.append(f"💰 Precio: ${price:,} CLP".replace(",", "."))
    else:
        lines.append("💰 Precio: Consultar")

    lines.extend([
        "",
        f"📍 {FB_LOCATION}",
        "",
        "✅ Revisión mecánica disponible",
        "✅ Documentación al día",
        "✅ Financiamiento disponible",
        "",
        "📲 Escríbenos por Messenger o WhatsApp",
        "🌐 autodirecto.cl",
        "",
        "#AutoDirecto #AutosUsados #ViñaDelMar #QuintaRegión #AutosEnVenta"
    ])

    return "\n".join(lines), title, price


# ─── Playwright automation ──────────────────────────────────────────────────────

async def _download_images_to_temp(image_urls, max_images=20):
    """Download images from URLs to temp directory for file upload."""
    tmpdir = tempfile.mkdtemp(prefix="fb_poster_")
    paths = []
    for i, url in enumerate(image_urls[:max_images]):
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            # Determine extension
            ct = r.headers.get("content-type", "image/jpeg")
            ext = ".jpg" if "jpeg" in ct or "jpg" in ct else ".png" if "png" in ct else ".webp" if "webp" in ct else ".jpg"
            fpath = os.path.join(tmpdir, f"car_{i:02d}{ext}")
            with open(fpath, "wb") as f:
                f.write(r.content)
            paths.append(fpath)
        except Exception as e:
            print(f"  ⚠️ Failed to download image {i}: {e}")
    return paths, tmpdir


async def post_to_marketplace(page, car, image_paths, caption, title, price, log_fn):
    """
    Post a vehicle to Facebook Marketplace using browser automation.
    This navigates through the Marketplace listing creation flow.
    """
    log_fn("🏪 Navigating to Marketplace create listing...")
    await page.goto("https://www.facebook.com/marketplace/create/vehicle", wait_until="domcontentloaded", timeout=30000)
    await asyncio.sleep(3)

    # Check if we're on the right page
    if "login" in page.url.lower() or "checkpoint" in page.url.lower():
        log_fn("❌ Not logged in to Facebook!")
        return None

    log_fn("📷 Uploading photos...")

    # Look for the file input for photos
    # Facebook's Marketplace vehicle form has a file input for photos
    file_inputs = await page.query_selector_all('input[type="file"]')
    if file_inputs:
        # Upload all images at once
        await file_inputs[0].set_input_files(image_paths)
        log_fn(f"  ✅ Uploaded {len(image_paths)} photos")
        await asyncio.sleep(3)
    else:
        log_fn("  ⚠️ No file input found, trying drag-drop area...")
        # Try clicking the "Add photos" area first
        add_photo_btn = await page.query_selector('[aria-label="Add photos"], [aria-label="Agregar fotos"]')
        if add_photo_btn:
            await add_photo_btn.click()
            await asyncio.sleep(1)
            file_inputs = await page.query_selector_all('input[type="file"]')
            if file_inputs:
                await file_inputs[0].set_input_files(image_paths)
                log_fn(f"  ✅ Uploaded {len(image_paths)} photos")
                await asyncio.sleep(3)

    # ── Fill Vehicle Details ──
    log_fn("📝 Filling vehicle details...")

    # Helper to fill a field by various selectors
    async def fill_field(selectors, value, field_name=""):
        if not value:
            return False
        for sel in selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    await asyncio.sleep(0.3)
                    await el.fill("")
                    await el.type(str(value), delay=50)
                    await asyncio.sleep(0.5)
                    log_fn(f"  ✅ {field_name}: {value}")
                    return True
            except Exception:
                continue
        log_fn(f"  ⚠️ Could not fill {field_name}")
        return False

    # Price
    await fill_field(
        ['[aria-label="Price"], [aria-label="Precio"]', 'input[name="price"]'],
        str(price) if price else "",
        "Precio"
    )

    # Year
    year = car.get("car_year")
    if year:
        # Year is usually a dropdown
        year_sel = await page.query_selector('[aria-label="Year"], [aria-label="Año"]')
        if year_sel:
            await year_sel.click()
            await asyncio.sleep(0.5)
            # Type year to filter dropdown
            await page.keyboard.type(str(year), delay=50)
            await asyncio.sleep(0.5)
            # Click the matching option
            option = await page.query_selector(f'[role="option"]:has-text("{year}")')
            if option:
                await option.click()
                log_fn(f"  ✅ Año: {year}")
            else:
                await page.keyboard.press("Enter")
            await asyncio.sleep(0.3)

    # Brand / Make
    brand = car.get("car_make", "")
    if brand:
        make_sel = await page.query_selector('[aria-label="Make"], [aria-label="Marca"]')
        if make_sel:
            await make_sel.click()
            await asyncio.sleep(0.5)
            await page.keyboard.type(brand, delay=50)
            await asyncio.sleep(1)
            option = await page.query_selector(f'[role="option"]:has-text("{brand}")')
            if option:
                await option.click()
                log_fn(f"  ✅ Marca: {brand}")
            else:
                await page.keyboard.press("Enter")
            await asyncio.sleep(0.3)

    # Model
    model = car.get("car_model", "")
    if model:
        await asyncio.sleep(1)  # Wait for model dropdown to populate
        model_sel = await page.query_selector('[aria-label="Model"], [aria-label="Modelo"]')
        if model_sel:
            await model_sel.click()
            await asyncio.sleep(0.5)
            await page.keyboard.type(model, delay=50)
            await asyncio.sleep(1)
            option = await page.query_selector(f'[role="option"]:has-text("{model}")')
            if option:
                await option.click()
                log_fn(f"  ✅ Modelo: {model}")
            else:
                await page.keyboard.press("Enter")
            await asyncio.sleep(0.3)

    # Mileage
    mileage = car.get("mileage") or car.get("km_verified")
    if mileage:
        await fill_field(
            ['[aria-label="Mileage"], [aria-label="Kilometraje"]', 'input[name="mileage"]'],
            str(mileage),
            "Kilometraje"
        )

    # Transmission
    transmission = car.get("transmission", "")
    if transmission:
        trans_sel = await page.query_selector('[aria-label="Transmission"], [aria-label="Transmisión"]')
        if trans_sel:
            await trans_sel.click()
            await asyncio.sleep(0.5)
            trans_map = {"manual": "Manual", "automatica": "Automatic", "automática": "Automatic"}
            trans_value = trans_map.get(transmission.lower(), transmission)
            option = await page.query_selector(f'[role="option"]:has-text("{trans_value}")')
            if option:
                await option.click()
                log_fn(f"  ✅ Transmisión: {trans_value}")
            await asyncio.sleep(0.3)

    # Fuel type
    fuel = car.get("fuel_type", "")
    if fuel:
        fuel_sel = await page.query_selector('[aria-label="Fuel type"], [aria-label="Tipo de combustible"]')
        if fuel_sel:
            await fuel_sel.click()
            await asyncio.sleep(0.5)
            fuel_map = {"bencina": "Gasoline", "gasolina": "Gasoline", "diesel": "Diesel", "diésel": "Diesel",
                        "eléctrico": "Electric", "electrico": "Electric", "híbrido": "Hybrid", "hibrido": "Hybrid"}
            fuel_value = fuel_map.get(fuel.lower(), fuel)
            option = await page.query_selector(f'[role="option"]:has-text("{fuel_value}")')
            if option:
                await option.click()
                log_fn(f"  ✅ Combustible: {fuel_value}")
            await asyncio.sleep(0.3)

    # Description
    log_fn("📄 Writing description...")
    desc_sel = await page.query_selector('[aria-label="Description"], [aria-label="Descripción"]')
    if desc_sel:
        await desc_sel.click()
        await asyncio.sleep(0.3)
        await desc_sel.type(caption, delay=10)
        log_fn("  ✅ Descripción escrita")
    await asyncio.sleep(1)

    # Location
    log_fn(f"📍 Setting location to {FB_LOCATION}...")
    location_sel = await page.query_selector('[aria-label="Location"], [aria-label="Ubicación"]')
    if location_sel:
        await location_sel.click()
        await asyncio.sleep(0.5)
        await location_sel.fill("")
        await location_sel.type(FB_LOCATION, delay=30)
        await asyncio.sleep(2)
        # Select first location suggestion
        suggestion = await page.query_selector('[role="listbox"] [role="option"]:first-child')
        if suggestion:
            await suggestion.click()
            log_fn(f"  ✅ Ubicación: {FB_LOCATION}")
        else:
            await page.keyboard.press("Enter")
        await asyncio.sleep(0.5)

    # Take screenshot before publishing for debug
    log_fn("📸 Taking pre-publish screenshot...")
    await page.screenshot(path="/tmp/fb_marketplace_preview.png")

    # Click "Next" or "Publish" button
    log_fn("🚀 Publishing listing...")

    # Try to find and click Next/Publish button
    for btn_text in ["Next", "Siguiente", "Publish", "Publicar"]:
        btn = await page.query_selector(f'[aria-label="{btn_text}"], button:has-text("{btn_text}")')
        if btn:
            await btn.click()
            log_fn(f"  ✅ Clicked '{btn_text}'")
            await asyncio.sleep(3)

    # If there's a second "Publish" after "Next"
    for btn_text in ["Publish", "Publicar"]:
        btn = await page.query_selector(f'[aria-label="{btn_text}"], button:has-text("{btn_text}")')
        if btn:
            await btn.click()
            log_fn(f"  ✅ Clicked '{btn_text}'")
            await asyncio.sleep(5)

    # Get the marketplace listing URL
    await asyncio.sleep(3)
    listing_url = page.url
    log_fn(f"✅ Marketplace listing created! URL: {listing_url}")

    return listing_url


async def share_to_group(page, group, marketplace_url, caption, log_fn):
    """Share a Marketplace listing URL to a Facebook group."""
    group_name = group["name"]
    group_url = group["url"]

    try:
        log_fn(f"📤 Sharing to: {group_name}...")

        # Navigate to group
        await page.goto(group_url, wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(3)

        # Check if we're actually in the group
        if "login" in page.url.lower():
            log_fn(f"  ❌ Not logged in")
            return False

        # Look for "Write something..." or create post area
        write_selectors = [
            '[aria-label="Write something..."]',
            '[aria-label="Escribe algo..."]',
            '[aria-label="Create a public post…"]',
            '[aria-label="Crea una publicación pública…"]',
            '[role="button"]:has-text("Write something")',
            '[role="button"]:has-text("Escribe algo")',
        ]

        post_area = None
        for sel in write_selectors:
            post_area = await page.query_selector(sel)
            if post_area:
                break

        if not post_area:
            log_fn(f"  ⚠️ Could not find post input in {group_name}")
            return False

        await post_area.click()
        await asyncio.sleep(2)

        # Type the caption + marketplace link
        post_text = f"{caption}\n\n🔗 {marketplace_url}"

        # Look for the textbox in the modal
        textbox = await page.query_selector('[role="textbox"][contenteditable="true"]')
        if textbox:
            await textbox.type(post_text, delay=10)
            await asyncio.sleep(1)
        else:
            log_fn(f"  ⚠️ Could not find textbox in {group_name}")
            return False

        # Click "Post" / "Publicar"
        await asyncio.sleep(1)
        for btn_text in ["Post", "Publicar"]:
            btn = await page.query_selector(f'[aria-label="{btn_text}"], button:has-text("{btn_text}")')
            if btn:
                await btn.click()
                log_fn(f"  ✅ Posted to {group_name}")
                await asyncio.sleep(3)
                return True

        log_fn(f"  ⚠️ Could not find Post button in {group_name}")
        return False

    except Exception as e:
        log_fn(f"  ❌ Error in {group_name}: {str(e)[:100]}")
        return False


async def run_full_post_job(car, selected_groups, job_id):
    """
    Full pipeline: Download images → Post to Marketplace → Share to groups.
    Runs in background thread with its own event loop.
    """
    job = jobs[job_id]
    log = []

    def log_fn(msg):
        ts = datetime.now().strftime("%H:%M:%S")
        entry = f"[{ts}] {msg}"
        log.append(entry)
        job["log"] = log
        print(entry)

    try:
        job["status"] = "running"

        # Use caption override from CRM if available, otherwise build it
        if car.get("_caption_override"):
            caption = car["_caption_override"]
            # Still build title + price for marketplace form fields
            _, title, price = build_car_caption(car)
        else:
            caption, title, price = build_car_caption(car)

        image_urls = car.get("_images", [])

        if not image_urls:
            log_fn("❌ No images for this car!")
            job["status"] = "error"
            job["finished_at"] = datetime.now().isoformat()
            return

        # 1. Download images
        log_fn(f"⬇️ Downloading {len(image_urls)} images...")
        image_paths, tmpdir = await _download_images_to_temp(image_urls)
        log_fn(f"  ✅ Downloaded {len(image_paths)} images to temp dir")

        if not image_paths:
            log_fn("❌ No images downloaded successfully!")
            job["status"] = "error"
            job["finished_at"] = datetime.now().isoformat()
            return

        # 2. Launch browser
        log_fn("🌐 Launching Chrome with your profile...")

        # Check Chrome is closed
        singleton = CHROME_USER_DATA / "SingletonLock"
        if singleton.exists():
            log_fn("⚠️ Chrome might be open. Attempting anyway...")

        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch_persistent_context(
                user_data_dir=str(CHROME_USER_DATA),
                headless=False,
                channel="chrome",
                slow_mo=500,  # Slow down to look more human
                args=[
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-extensions",
                    "--disable-sync",
                    "--disable-blink-features=AutomationControlled",
                ],
                viewport={"width": 1280, "height": 900},
            )

            page = browser.pages[0] if browser.pages else await browser.new_page()

            # 3. Verify Facebook login
            log_fn("🔐 Verifying Facebook login...")
            await page.goto("https://www.facebook.com", wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(3)

            if "login" in page.url.lower() or "checkpoint" in page.url.lower():
                log_fn("❌ Not logged in to Facebook! Login manually and try again.")
                job["status"] = "error"
                job["finished_at"] = datetime.now().isoformat()
                await browser.close()
                return

            log_fn("✅ Facebook session active!")

            # 4. Post to Marketplace
            marketplace_url = await post_to_marketplace(
                page, car, image_paths, caption, title, price, log_fn
            )

            if not marketplace_url or "marketplace/create" in marketplace_url:
                log_fn("⚠️ Marketplace posting may have failed. Check browser.")
                marketplace_url = marketplace_url or "https://www.facebook.com/marketplace"

            job["result"] = {"marketplace_url": marketplace_url, "groups_posted": [], "groups_failed": []}

            # 5. Share to selected groups
            if selected_groups:
                log_fn(f"\n📢 Sharing to {len(selected_groups)} groups...")
                # Add random delays between group posts to avoid detection
                import random
                for i, group in enumerate(selected_groups):
                    log_fn(f"\n── Group {i+1}/{len(selected_groups)} ──")
                    success = await share_to_group(page, group, marketplace_url, caption, log_fn)
                    if success:
                        job["result"]["groups_posted"].append(group["name"])
                    else:
                        job["result"]["groups_failed"].append(group["name"])

                    # Random delay between groups (15-45 seconds)
                    if i < len(selected_groups) - 1:
                        delay = random.randint(15, 45)
                        log_fn(f"  ⏳ Waiting {delay}s before next group...")
                        await asyncio.sleep(delay)

            posted = len(job["result"]["groups_posted"])
            failed = len(job["result"]["groups_failed"])
            log_fn(f"\n{'='*50}")
            log_fn(f"✅ DONE! Marketplace + {posted} groups posted, {failed} failed")

            await browser.close()

        # Cleanup temp images
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

        job["status"] = "completed"
        job["finished_at"] = datetime.now().isoformat()

    except Exception as e:
        log_fn(f"💥 Error: {str(e)}")
        job["status"] = "error"
        job["finished_at"] = datetime.now().isoformat()


def start_post_job(car, selected_groups):
    """Start a posting job in a background thread."""
    import uuid
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "queued",
        "log": [],
        "result": None,
        "car": f"{car.get('car_make', '')} {car.get('car_model', '')} {car.get('car_year', '')}",
        "started_at": datetime.now().isoformat(),
        "finished_at": None,
    }

    def run_in_thread():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run_full_post_job(car, selected_groups, job_id))
        loop.close()

    t = threading.Thread(target=run_in_thread, daemon=True)
    t.start()
    return job_id


# ─── Flask App ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE, groups=FB_GROUPS)


@app.route("/api/cars")
def api_cars():
    """Fetch available cars from CRM."""
    try:
        cars = fetch_available_cars()
        return jsonify({"ok": True, "cars": cars})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/post", methods=["POST"])
def api_post():
    """
    Start a posting job for a car.
    Accepts two modes:
      A) From standalone UI: { car_id, groups: [indices] }
      B) From CRM: { car, caption, image_urls, groups: [{name, url}], job_id, location }
    """
    data = request.json or {}

    # Mode B: CRM sends full car data directly
    if data.get("car") and data.get("image_urls"):
        car = data["car"]
        car["_images"] = data.get("image_urls", [])
        caption_override = data.get("caption", "")
        selected_groups = data.get("groups", [])
        location_override = data.get("location", "")
        crm_job_id = data.get("job_id", "")

        # Override caption if provided
        if caption_override:
            car["_caption_override"] = caption_override
        if location_override:
            global FB_LOCATION
            FB_LOCATION = location_override

        job_id = start_post_job(car, selected_groups)

        # Map CRM job_id to local job_id for polling
        if crm_job_id:
            jobs[crm_job_id] = jobs[job_id]  # Alias so CRM can poll by its own ID

        return jsonify({"ok": True, "job_id": job_id})

    # Mode A: Standalone UI sends car_id
    car_id = data.get("car_id")
    group_indices = data.get("groups", [])

    if not car_id:
        return jsonify({"ok": False, "error": "No car_id"}), 400

    try:
        cars = supa_get("consignaciones", {
            "select": "*",
            "id": f"eq.{car_id}",
        })
        if not cars:
            return jsonify({"ok": False, "error": "Car not found"}), 404

        car = cars[0]

        appraisal_id = car.get("appraisal_supabase_id")
        if appraisal_id:
            images = supa_get("vehicle_images", {
                "select": "url,label,photo_type",
                "appraisal_id": f"eq.{appraisal_id}",
                "order": "created_at.asc",
            })
            car["_images"] = [img["url"] for img in images if img.get("url")]
        else:
            car["_images"] = []

        selected_groups = [FB_GROUPS[i] for i in group_indices if 0 <= i < len(FB_GROUPS)]

        job_id = start_post_job(car, selected_groups)
        return jsonify({"ok": True, "job_id": job_id})

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/job/<job_id>")
def api_job(job_id):
    """Get job status and logs."""
    job = jobs.get(job_id)
    if not job:
        return jsonify({"ok": False, "error": "Job not found"}), 404
    return jsonify({"ok": True, "job": job})


@app.route("/api/groups")
def api_groups():
    """Return list of configured groups."""
    return jsonify({"ok": True, "groups": FB_GROUPS})


# ─── HTML Template ──────────────────────────────────────────────────────────────
HTML_TEMPLATE = r"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🚗 FB Auto-Poster — AutoDirecto</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.0.3/src/regular/style.css">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
    .card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; }
    .btn-primary { background: linear-gradient(135deg, #1877f2, #42a5f5); }
    .btn-primary:hover { background: linear-gradient(135deg, #1565c0, #1877f2); }
    .log-container { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .group-item:hover { background: #334155; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
  </style>
</head>
<body x-data="fbPoster()" x-init="loadCars()">

  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-900 to-indigo-900 border-b border-blue-800 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl">🚗</div>
        <div>
          <h1 class="text-xl font-bold text-white">FB Auto-Poster</h1>
          <p class="text-xs text-blue-300">Marketplace + 42 Grupos · V Región</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs" 
              :class="connected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'">
          <span x-text="connected ? '● Chrome Ready' : '● Desconectado'"></span>
        </span>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto p-6 space-y-6">

    <!-- Step 1: Select Car -->
    <div class="card p-5">
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span class="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</span>
        Seleccionar Vehículo
      </h2>

      <div x-show="loading" class="text-center py-8 text-slate-400">
        <div class="animate-spin inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="mt-2">Cargando vehículos del CRM...</p>
      </div>

      <div x-show="!loading && cars.length === 0" class="text-center py-8 text-slate-400">
        <p>No hay vehículos en venta disponibles.</p>
      </div>

      <div x-show="!loading && cars.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <template x-for="car in cars" :key="car.id">
          <div class="border rounded-lg p-3 cursor-pointer transition-all duration-200"
               :class="selectedCar?.id === car.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'"
               @click="selectCar(car)">
            <div class="flex gap-3">
              <!-- Thumbnail -->
              <div class="w-20 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                <img x-show="car._images?.length" 
                     :src="car._images?.[0]" 
                     class="w-full h-full object-cover"
                     alt="">
                <div x-show="!car._images?.length" class="w-full h-full flex items-center justify-center text-slate-500 text-2xl">🚗</div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm truncate" x-text="`${car.car_make || ''} ${car.car_model || ''} ${car.car_year || ''}`"></p>
                <p class="text-xs text-slate-400" x-text="car.plate || 'Sin patente'"></p>
                <p class="text-xs text-green-400 font-medium" 
                   x-text="car.selling_price ? `$${Number(car.selling_price).toLocaleString('es-CL')}` : 'Sin precio'"></p>
                <p class="text-xs text-slate-500" x-text="`${car._images?.length || 0} fotos`"></p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Step 2: Preview -->
    <div x-show="selectedCar" class="card p-5" x-transition>
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span class="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">2</span>
        Vista Previa del Anuncio
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Images preview -->
        <div>
          <div class="aspect-video rounded-lg overflow-hidden bg-slate-700">
            <img x-show="selectedCar?._images?.length" 
                 :src="selectedCar?._images?.[previewIdx]"
                 class="w-full h-full object-contain bg-black">
          </div>
          <div class="flex gap-1 mt-2 overflow-x-auto py-1">
            <template x-for="(img, i) in (selectedCar?._images || [])" :key="i">
              <img :src="img" 
                   class="w-12 h-12 rounded object-cover cursor-pointer border-2 flex-shrink-0"
                   :class="previewIdx === i ? 'border-blue-500' : 'border-transparent'"
                   @click="previewIdx = i">
            </template>
          </div>
        </div>
        <!-- Caption preview -->
        <div>
          <h3 class="text-sm font-semibold text-slate-300 mb-2">Descripción que se publicará:</h3>
          <pre class="text-xs text-slate-400 whitespace-pre-wrap bg-slate-800 rounded-lg p-3 max-h-80 overflow-y-auto"
               x-text="buildCaption(selectedCar)"></pre>
          <div class="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span>📍</span>
            <span>Bosques de Miramar, Viña del Mar</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: Select Groups -->
    <div x-show="selectedCar" class="card p-5" x-transition>
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span class="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">3</span>
        Seleccionar Grupos
        <span class="text-xs text-slate-400 font-normal ml-2" x-text="`(${selectedGroups.length}/${groups.length} seleccionados)`"></span>
      </h2>

      <div class="flex gap-2 mb-3">
        <button @click="selectAllGroups()" class="px-3 py-1.5 text-xs rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
          ✅ Seleccionar Todos
        </button>
        <button @click="deselectAllGroups()" class="px-3 py-1.5 text-xs rounded-lg bg-slate-600/20 text-slate-400 hover:bg-slate-600/30">
          ❌ Deseleccionar Todos
        </button>
        <input type="text" x-model="groupSearch" placeholder="Buscar grupo..."
               class="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none">
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-72 overflow-y-auto pr-1">
        <template x-for="(group, i) in filteredGroups" :key="i">
          <label class="group-item flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs">
            <input type="checkbox" :value="group._idx" x-model="selectedGroups"
                   class="rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500">
            <span class="truncate" x-text="group.name"></span>
          </label>
        </template>
      </div>
    </div>

    <!-- Step 4: Launch -->
    <div x-show="selectedCar" class="card p-5" x-transition>
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span class="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">4</span>
        Publicar
      </h2>

      <div class="flex items-center gap-4">
        <button @click="startPosting()" 
                :disabled="posting"
                class="btn-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span x-show="!posting">🚀 Publicar en Marketplace + <span x-text="selectedGroups.length"></span> Grupos</span>
          <span x-show="posting" class="flex items-center gap-2">
            <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            Publicando...
          </span>
        </button>

        <div x-show="posting || currentJobId" class="text-xs text-slate-400">
          <span x-show="posting">Job ID: <span x-text="currentJobId" class="font-mono text-blue-400"></span></span>
        </div>
      </div>

      <!-- Live Log -->
      <div x-show="jobLog.length > 0" class="mt-4">
        <h3 class="text-sm font-semibold text-slate-300 mb-2">📋 Log en Vivo</h3>
        <div class="log-container bg-slate-900 rounded-lg p-3 max-h-96 overflow-y-auto border border-slate-700"
             x-ref="logContainer">
          <template x-for="(line, i) in jobLog" :key="i">
            <div class="py-0.5" 
                 :class="{
                   'text-green-400': line.includes('✅'),
                   'text-red-400': line.includes('❌') || line.includes('💥'),
                   'text-yellow-400': line.includes('⚠️'),
                   'text-blue-400': line.includes('🚀') || line.includes('📤'),
                   'text-slate-400': !line.includes('✅') && !line.includes('❌') && !line.includes('⚠️') && !line.includes('🚀') && !line.includes('📤') && !line.includes('💥'),
                 }"
                 x-text="line"></div>
          </template>
        </div>
      </div>

      <!-- Results -->
      <div x-show="jobResult" class="mt-4 card p-4 bg-slate-800/50">
        <h3 class="text-sm font-semibold text-green-400 mb-2">📊 Resultados</h3>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-blue-400">1</p>
            <p class="text-xs text-slate-400">Marketplace</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-400" x-text="jobResult?.groups_posted?.length || 0"></p>
            <p class="text-xs text-slate-400">Grupos OK</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-400" x-text="jobResult?.groups_failed?.length || 0"></p>
            <p class="text-xs text-slate-400">Grupos Failed</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Warning -->
    <div class="card p-4 border-yellow-600/30 bg-yellow-900/10">
      <div class="flex items-start gap-3">
        <span class="text-xl">⚠️</span>
        <div class="text-xs text-yellow-400/80">
          <p class="font-semibold mb-1">Importante:</p>
          <ul class="list-disc list-inside space-y-0.5">
            <li><strong>Cierra Google Chrome</strong> antes de iniciar (Playwright necesita tu perfil)</li>
            <li>Se abrirá Chrome automáticamente con tu sesión de Facebook</li>
            <li>No toques el navegador mientras publica</li>
            <li>Delays aleatorios (15-45s) entre grupos para evitar detección</li>
            <li>Si Facebook bloquea, para y espera unas horas</li>
          </ul>
        </div>
      </div>
    </div>

  </div>

  <script>
    function fbPoster() {
      return {
        // State
        cars: [],
        loading: true,
        connected: true,
        selectedCar: null,
        previewIdx: 0,
        groups: [],
        selectedGroups: [],
        groupSearch: '',
        posting: false,
        currentJobId: null,
        jobLog: [],
        jobResult: null,
        pollInterval: null,

        // Init
        async loadCars() {
          this.loading = true;
          // Build groups with index
          this.groups = {{ groups | tojson }}.map((g, i) => ({...g, _idx: i}));
          this.selectAllGroups();

          try {
            const r = await fetch('/api/cars');
            const data = await r.json();
            if (data.ok) this.cars = data.cars;
          } catch(e) {
            console.error('Failed to load cars:', e);
          }
          this.loading = false;
        },

        selectCar(car) {
          this.selectedCar = car;
          this.previewIdx = 0;
        },

        get filteredGroups() {
          if (!this.groupSearch) return this.groups;
          const q = this.groupSearch.toLowerCase();
          return this.groups.filter(g => g.name.toLowerCase().includes(q));
        },

        selectAllGroups() {
          this.selectedGroups = this.groups.map(g => g._idx);
        },

        deselectAllGroups() {
          this.selectedGroups = [];
        },

        buildCaption(car) {
          if (!car) return '';
          const brand = car.car_make || '';
          const model = car.car_model || '';
          const year = car.car_year || '';
          const version = car.version || '';
          const mileage = car.mileage || car.km_verified;
          const color = car.color || '';
          const price = car.selling_price || car.owner_price || 0;
          const title = `${brand} ${model} ${year} ${version}`.trim();

          let lines = [`🚗 ${title}`, ''];
          if (year) lines.push(`📅 Año: ${year}`);
          if (mileage) lines.push(`📏 Kilómetros: ${Number(mileage).toLocaleString('es-CL')} km`);
          if (color) lines.push(`🎨 Color: ${color}`);
          if (version) lines.push(`⚙️ Versión: ${version}`);
          lines.push('');
          lines.push(price ? `💰 Precio: $${Number(price).toLocaleString('es-CL')} CLP` : '💰 Precio: Consultar');
          lines.push('', '📍 Bosques de Miramar, Viña del Mar');
          lines.push('', '✅ Revisión mecánica disponible', '✅ Documentación al día', '✅ Financiamiento disponible');
          lines.push('', '📲 Escríbenos por Messenger o WhatsApp', '🌐 autodirecto.cl');
          lines.push('', '#AutoDirecto #AutosUsados #ViñaDelMar #QuintaRegión #AutosEnVenta');
          return lines.join('\n');
        },

        async startPosting() {
          if (!this.selectedCar || this.posting) return;
          this.posting = true;
          this.jobLog = [];
          this.jobResult = null;

          try {
            const r = await fetch('/api/post', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                car_id: this.selectedCar.id,
                groups: this.selectedGroups.map(Number),
              })
            });
            const data = await r.json();
            if (!data.ok) {
              this.jobLog.push(`❌ Error: ${data.error}`);
              this.posting = false;
              return;
            }

            this.currentJobId = data.job_id;
            this.startPolling();
          } catch(e) {
            this.jobLog.push(`❌ Error: ${e.message}`);
            this.posting = false;
          }
        },

        startPolling() {
          if (this.pollInterval) clearInterval(this.pollInterval);
          this.pollInterval = setInterval(async () => {
            if (!this.currentJobId) return;
            try {
              const r = await fetch(`/api/job/${this.currentJobId}`);
              const data = await r.json();
              if (data.ok && data.job) {
                this.jobLog = data.job.log || [];
                // Auto-scroll log
                this.$nextTick(() => {
                  const el = this.$refs.logContainer;
                  if (el) el.scrollTop = el.scrollHeight;
                });

                if (data.job.status === 'completed' || data.job.status === 'error') {
                  this.posting = false;
                  this.jobResult = data.job.result;
                  clearInterval(this.pollInterval);
                }
              }
            } catch(e) { /* ignore polling errors */ }
          }, 2000);
        }
      };
    }
  </script>

</body>
</html>
"""


if __name__ == "__main__":
    print("=" * 60)
    print("🚗 FB Auto-Poster — AutoDirecto")
    print("=" * 60)
    print(f"📍 Location: {FB_LOCATION}")
    print(f"📢 Groups configured: {len(FB_GROUPS)}")
    print(f"🌐 Open http://localhost:5050")
    print()
    print("⚠️  IMPORTANT: Close Google Chrome before posting!")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5050, debug=True)
