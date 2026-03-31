
## ...existing code...

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

# Persistent Playwright profile dir — survives restarts, keeps FB session alive.
# First run: Chrome opens → you log into Facebook manually → session is saved here.
# All subsequent runs reuse this directory (no more temp copies).
PLAYWRIGHT_PROFILE_DIR = Path.home() / ".fb_poster_chrome_profile"

# Marketplace location
FB_LOCATION = os.getenv("FB_LOCATION_NAME", "Viña del Mar")
FB_LAT = float(os.getenv("FB_LATITUDE", "-33.0245"))
FB_LNG = float(os.getenv("FB_LONGITUDE", "-71.5518"))

# ─── Facebook Groups ────────────────────────────────────────────────────────────
FB_GROUPS = [
    {"name": "CHILE AUTOS - Sin Telefono Se Borra la publicacion", "url": "https://www.facebook.com/groups/repuestosdeautos.cl/", "search": "Chile Autos Sin Telefono"},
    {"name": "MUNDO TUERCA VALPO, VIÑA", "url": "https://www.facebook.com/groups/1721514511403756/", "search": "Mundo Tuerca Valpo"},
    {"name": "Autos Viña del mar - Valparaiso", "url": "https://www.facebook.com/groups/chileautosvinadelmar/", "search": "Autos Viña del mar Valparaiso"},
    {"name": "venta de autos y repuestos V región", "url": "https://www.facebook.com/groups/367129786996327/", "search": "venta autos repuestos V region"},
    {"name": "Autos Valparaiso - Viña del mar", "url": "https://www.facebook.com/groups/chileautosvalparaiso/", "search": "Autos Valparaiso Viña"},
    {"name": "Todo Tuercas Quilpue - Villa Alemana - Limache - Olmue - Quillota", "url": "https://www.facebook.com/groups/todotuercas/", "search": "Todo Tuercas Quilpue"},
    {"name": "venta de autos y motos V region", "url": "https://www.facebook.com/groups/651487044978775/", "search": "venta autos motos V region"},
    {"name": "Vende tu auto VRegion", "url": "https://www.facebook.com/groups/617218648426911/", "search": "Vende tu auto VRegion"},
    {"name": "Autos en Venta Quinta Región Chile", "url": "https://www.facebook.com/groups/autos.en.venta.quinta.region.chile/", "search": "Autos Venta Quinta Region"},
    {"name": "VENTA DE VEHÍCULOS DE OCASIÓN 🤝 Autos Chile 🇨🇱", "url": "https://www.facebook.com/groups/701541853761323/", "search": "Venta Vehiculos Ocasion"},
    {"name": "compra y permutas de autos quinta region", "url": "https://www.facebook.com/groups/819445958235019/", "search": "compra permutas autos quinta"},
    {"name": "Venta de Autos Usado en Chile", "url": "https://www.facebook.com/groups/467592933360081/", "search": "Venta Autos Usado Chile"},
    {"name": "Gran feria del auto usado V Region", "url": "https://www.facebook.com/groups/236187406570255/", "search": "Gran feria auto usado"},
    {"name": "Venta de Autos 5ta Region (1)", "url": "https://www.facebook.com/groups/3089228341220930/", "search": "Venta Autos 5ta Region"},
    {"name": "Venta de Autos 5ta Region (2)", "url": "https://www.facebook.com/groups/1537403170317369/", "search": "Venta Autos 5ta Region"},
    {"name": "Compraventa autos v región", "url": "https://www.facebook.com/groups/639650642724240/", "search": "Compraventa autos region"},
    {"name": "COMPROVEHICULOS.CL", "url": "https://www.facebook.com/groups/506547946136436/", "search": "Comprovehiculos"},
    {"name": "Compra, venta y permutas camionetas, Autos, Suv chile", "url": "https://www.facebook.com/groups/671270960818458/", "search": "Compra venta permutas camionetas"},
    {"name": "AUTOS USADOS CHILE . CL", "url": "https://www.facebook.com/groups/669775896446268/", "search": "Autos Usados Chile CL"},
    {"name": "VEHICULOS USADOS DE TODO CHILE ✅", "url": "https://www.facebook.com/groups/1094829247361002/", "search": "Vehiculos Usados Todo Chile"},
    {"name": "Yapo concon", "url": "https://www.facebook.com/groups/231458073867654/", "search": "Yapo concon"},
    {"name": "COMPRA Y VENTA DE AUTOS NUEVOS Y USADOS CHILE", "url": "https://www.facebook.com/groups/330969950788171/", "search": "Compra Venta Autos Nuevos Usados"},
    {"name": "Compra Venta - Autos CHILE", "url": "https://www.facebook.com/groups/1401391943432509/", "search": "Compra Venta Autos Chile"},
    {"name": "Venta de Autos 0KM, Seminuevos y Usados en Chile", "url": "https://www.facebook.com/groups/autos0kmseminuevosyusados/", "search": "Autos 0KM Seminuevos"},
    {"name": "Autos y motos V REGIÓN", "url": "https://www.facebook.com/groups/481371528705498/", "search": "Autos motos V Region"},
    {"name": "Autos Usados Chile", "url": "https://www.facebook.com/groups/autosbaratostemucoyalrededores/", "search": "Autos Usados Chile"},
    {"name": "Autos Usados Viña del Mar", "url": "https://www.facebook.com/groups/548654176561779/", "search": "Autos Usados Viña del Mar"},
    {"name": "Vendo Mi Auto Viña Del Mar", "url": "https://www.facebook.com/groups/1156515334359895/", "search": "Vendo Mi Auto Viña"},
    {"name": "Compra-Venta AUTOS USADOS. Chile", "url": "https://www.facebook.com/groups/754676712758575/", "search": "Compra Venta Autos Usados Chile"},
    {"name": "autos V region chile 🔰", "url": "https://www.facebook.com/groups/750188968678503/", "search": "autos V region chile"},
    {"name": "Feria tuerca quinta region", "url": "https://www.facebook.com/groups/470520613089491/", "search": "Feria tuerca quinta"},
    {"name": "Venta de Autos V region", "url": "https://www.facebook.com/groups/375455562659988/", "search": "Venta Autos V region"},
    {"name": "MULTI AUTOS V REGIÓN", "url": "https://www.facebook.com/groups/590614651103274/", "search": "Multi Autos V Region"},
    {"name": "COMPRA Y VENTA DE AUTOS QUILPUE Y ALREDEDORES", "url": "https://www.facebook.com/groups/1237843139611306/", "search": "Compra Venta Autos Quilpue"},
    {"name": "BUSCO AUTO V REGION", "url": "https://www.facebook.com/groups/AUTOSQUINTAREGION/", "search": "Busco Auto V Region"},
    {"name": "COMPRA, VENDE O PERMUTA UN AUTO", "url": "https://www.facebook.com/groups/229097777240972/", "search": "Compra Vende Permuta Auto"},
    {"name": "Todo autos quinta region", "url": "https://www.facebook.com/groups/809445329202354/", "search": "Todo autos quinta"},
    {"name": "COMPRA VENTA DE AUTOS Y MOTOS QUINTA REGION", "url": "https://www.facebook.com/groups/340277276445153/", "search": "Compra Venta Autos Motos Quinta"},
    {"name": "venta vehiculo quillota y alrededores", "url": "https://www.facebook.com/groups/2872527959681039/", "search": "venta vehiculo quillota"},
    {"name": "Autos Clasificados Quinta Región", "url": "https://www.facebook.com/groups/192003684626534/", "search": "Autos Clasificados Quinta"},
    {"name": "Venta de autos quinta región", "url": "https://www.facebook.com/groups/938149021504442/", "search": "Venta autos quinta region"},
    {"name": "Marketplace Valpo-Viña", "url": "https://www.facebook.com/groups/1246293805815497/", "search": "Marketplace Valpo"},
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
    Get all consignaciones that are en_venta with their images.
    Matches either en_venta boolean=true OR status='en_venta'.
    Returns enriched car dicts with images attached.
    """
    # Get consignaciones en venta (boolean flag OR status string)
    cars = supa_get("consignaciones", {
        "select": "*",
        "or": "(en_venta.eq.true,status.eq.en_venta)",
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
    brand = (car.get("car_make") or "").strip()
    model = (car.get("car_model") or "").strip()
    year = car.get("car_year") or ""
    version = (car.get("version") or "").strip()
    mileage = car.get("mileage") or car.get("km_verified")
    color = (car.get("color") or "").strip()
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


async def _dump_page_debug(page, log_fn, label=""):
    """Save screenshot + DOM summary for debugging FB selectors."""
    ts = datetime.now().strftime("%H%M%S")
    path = f"/tmp/fb_debug_{label}_{ts}.png"
    try:
        await page.screenshot(path=path, full_page=False)
        log_fn(f"  📸 Debug screenshot: {path}")
    except Exception:
        pass
    # Dump key elements for debugging
    try:
        info = await page.evaluate("""() => {
            const inputs = [...document.querySelectorAll('input')].map(e => ({
                type: e.type, name: e.name, accept: e.accept,
                ariaLabel: e.ariaLabel || e.getAttribute('aria-label'),
                placeholder: e.placeholder, hidden: e.hidden,
                display: getComputedStyle(e).display
            }));
            const labels = [...document.querySelectorAll('label span')].map(e => e.textContent).filter(t => t.trim());
            const buttons = [...document.querySelectorAll('[role="button"]')].map(e => e.textContent?.slice(0,60));
            return { inputs: inputs.slice(0, 30), labels: labels.slice(0, 30), buttons: buttons.slice(0, 30) };
        }""")
        log_fn(f"  🔍 Inputs: {json.dumps(info.get('inputs',[]), ensure_ascii=False)[:500]}")
        log_fn(f"  🔍 Labels: {json.dumps(info.get('labels',[]), ensure_ascii=False)[:500]}")
    except Exception as e:
        log_fn(f"  🔍 Debug eval failed: {e}")


async def post_to_marketplace(page, car, image_paths, caption, title, price, log_fn):
    """
    Post a vehicle to Facebook Marketplace using browser automation.
    This navigates through the Marketplace listing creation flow.
    Resilient against Facebook DOM changes by trying multiple selector strategies.
    """
    log_fn("🏪 Navigating to Marketplace create listing...")
    await page.goto("https://www.facebook.com/marketplace/create/vehicle", wait_until="domcontentloaded", timeout=30000)
    await asyncio.sleep(5)

    # Check if we're on the right page (URL redirect to login)
    if "login" in page.url.lower() or "checkpoint" in page.url.lower():
        log_fn("❌ Redirected to login page! Cookies may be expired.")
        return None

    # Facebook often shows a login modal/overlay even when you have cookies.
    # Dismiss it by clicking close/X buttons or pressing Escape.
    for attempt in range(3):
        has_login_form = await page.evaluate("""() => {
            const inputs = [...document.querySelectorAll('input')];
            return inputs.some(i => i.name === 'email' || i.name === 'pass');
        }""")
        if not has_login_form:
            break
        log_fn(f"  ⚠️ Login overlay detected (attempt {attempt+1}), dismissing...")
        # Try closing the overlay
        for close_sel in [
            '[aria-label="Close"]', '[aria-label="Cerrar"]',
            '[aria-label="Schließen"]',
            'div[role="dialog"] [aria-label="Close"]',
            'div[role="dialog"] [aria-label="Cerrar"]',
        ]:
            try:
                btn = await page.query_selector(close_sel)
                if btn:
                    await btn.click()
                    await asyncio.sleep(1)
                    break
            except Exception:
                continue
        # Also try pressing Escape
        await page.keyboard.press("Escape")
        await asyncio.sleep(2)
        # Try reloading
        if attempt == 1:
            log_fn("  🔄 Reloading page...")
            await page.reload(wait_until="domcontentloaded")
            await asyncio.sleep(5)

    # Final check — are we on the create vehicle form?
    has_login_form = await page.evaluate("""() => {
        const inputs = [...document.querySelectorAll('input')];
        return inputs.some(i => i.name === 'email' || i.name === 'pass');
    }""")
    if has_login_form:
        log_fn("❌ Still showing login form after dismissal attempts. Cookies might be expired.")
        await _dump_page_debug(page, log_fn, "login_stuck")
        return None

    # ── Dump page debug info so we can see what FB is showing ──
    await _dump_page_debug(page, log_fn, "marketplace_form")

    # ── PHOTOS ──
    log_fn("📷 Uploading photos...")
    uploaded = False

    # Strategy 1: find any file input (may be hidden)
    file_inputs = await page.query_selector_all('input[type="file"]')
    if not file_inputs:
        # Strategy 2: look for file input with accept attribute
        file_inputs = await page.query_selector_all('input[accept*="image"]')
    if not file_inputs:
        # Strategy 3: click photo area to reveal hidden input
        for photo_sel in [
            '[aria-label="Add photos"]', '[aria-label="Agregar fotos"]',
            '[aria-label="Add Photos"]', 'text="Add photos"', 'text="Agregar fotos"',
            'div:has-text("Add photos") >> nth=0',
        ]:
            try:
                el = await page.query_selector(photo_sel)
                if el:
                    await el.click()
                    await asyncio.sleep(1.5)
                    file_inputs = await page.query_selector_all('input[type="file"]')
                    if file_inputs:
                        break
            except Exception:
                continue

    if file_inputs:
        try:
            await file_inputs[0].set_input_files(image_paths)
            uploaded = True
            log_fn(f"  ✅ Uploaded {len(image_paths)} photos")
            await asyncio.sleep(4)
        except Exception as e:
            log_fn(f"  ⚠️ File input found but upload failed: {e}")

    if not uploaded:
        log_fn("  ⚠️ Could not upload photos - no file input found")
        await _dump_page_debug(page, log_fn, "no_file_input")

    # ── Helper: find and fill a text field ──
    async def fill_field(label_texts, value, field_name=""):
        """Try to fill a field by label text, aria-label, placeholder, or name."""
        if not value:
            return False
        value_str = str(value)

        # Strategy 1: aria-label on input
        for lbl in label_texts:
            for sel in [f'input[aria-label="{lbl}"]', f'[aria-label="{lbl}"]',
                        f'input[placeholder="{lbl}"]', f'input[name="{lbl.lower()}"]']:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        await el.click()
                        await asyncio.sleep(0.3)
                        await page.keyboard.press("Meta+A")
                        await page.keyboard.press("Control+A")
                        await page.keyboard.press("Backspace")
                        await el.type(value_str, delay=50)
                        await asyncio.sleep(0.5)
                        log_fn(f"  ✅ {field_name}: {value_str}")
                        return True
                except Exception:
                    continue

        # Strategy 2: Playwright label locator (looks for associated <label>)
        for lbl in label_texts:
            try:
                loc = page.get_by_label(lbl, exact=False)
                if await loc.count() > 0:
                    await loc.first.click()
                    await asyncio.sleep(0.3)
                    await page.keyboard.press("Meta+A")
                    await page.keyboard.press("Control+A")
                    await page.keyboard.press("Backspace")
                    await loc.first.type(value_str, delay=50)
                    await asyncio.sleep(0.5)
                    log_fn(f"  ✅ {field_name}: {value_str}")
                    return True
            except Exception:
                continue

        # Strategy 3: Playwright placeholder locator
        for lbl in label_texts:
            try:
                loc = page.get_by_placeholder(lbl, exact=False)
                if await loc.count() > 0:
                    await loc.first.click()
                    await asyncio.sleep(0.3)
                    await page.keyboard.press("Meta+A")
                    await page.keyboard.press("Control+A")
                    await page.keyboard.press("Backspace")
                    await loc.first.type(value_str, delay=50)
                    await asyncio.sleep(0.5)
                    log_fn(f"  ✅ {field_name}: {value_str}")
                    return True
            except Exception:
                continue

        log_fn(f"  ⚠️ Could not fill {field_name}")
        return False

    # ── Helper: select a dropdown option ──
    async def select_dropdown(label_texts, value, field_name=""):
        """Click a dropdown identified by label, type to search, pick option."""
        if not value:
            return False
        value_str = str(value)

        # Find the dropdown trigger
        trigger = None
        for lbl in label_texts:
            for sel in [f'[aria-label="{lbl}"]', f'label:has-text("{lbl}")',
                        f'span:has-text("{lbl}")']:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        trigger = el
                        break
                except Exception:
                    continue
            if trigger:
                break

        # Also try Playwright's label locator
        if not trigger:
            for lbl in label_texts:
                try:
                    loc = page.get_by_label(lbl, exact=False)
                    if await loc.count() > 0:
                        trigger = await loc.first.element_handle()
                        break
                except Exception:
                    continue

        if not trigger:
            log_fn(f"  ⚠️ Could not find dropdown: {field_name}")
            return False

        await trigger.click()
        await asyncio.sleep(0.7)
        await page.keyboard.press("Meta+A")
        await page.keyboard.press("Control+A")
        await page.keyboard.press("Backspace")
        await page.keyboard.type(value_str, delay=60)
        await asyncio.sleep(1)

        # Try to pick the matching option — ONLY match by text, never by :first-child
        # (first-child fallback caused wrong brands like Alfa Romeo to be selected)
        option = None
        for opt_sel in [
            f'[role="option"]:has-text("{value_str}")',
            f'li[role="option"]:has-text("{value_str}")',
        ]:
            try:
                option = await page.query_selector(opt_sel)
                if option:
                    break
            except Exception:
                continue

        # Playwright broad text search as last resort
        if not option:
            try:
                loc = page.get_by_role("option", name=value_str, exact=False)
                if await loc.count() > 0:
                    option = await loc.first.element_handle()
            except Exception:
                pass

        if option:
            await option.click()
            log_fn(f"  ✅ {field_name}: {value_str}")
        else:
            # Close any open listbox and warn — don't blindly pick first option
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
            log_fn(f"  ⚠️ {field_name}: could not find option '{value_str}' — field left blank")
        await asyncio.sleep(0.5)
        return True

    # ── Helper: select a Facebook toggle/radio-style selector ──
    async def select_fb_toggle(field_label_texts, option_texts, field_name=""):
        """
        Facebook form fields like 'Vehicle type', 'Body style', 'Vehicle condition'
        use a click-to-expand pattern (not a standard <select>).
        This helper clicks the field, waits for options to appear, then picks one.
        Works for role="listbox" dropdowns, radio groups, and toggle menus.
        """
        trigger = None

        # 1. Find trigger by aria-label
        for lbl in field_label_texts:
            for sel in [
                f'[aria-label="{lbl}"]',
                f'label:has-text("{lbl}")',
                f'span:has-text("{lbl}")',
            ]:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        trigger = el
                        break
                except Exception:
                    continue
            if trigger:
                break

        # 2. Playwright label locator
        if not trigger:
            for lbl in field_label_texts:
                try:
                    loc = page.get_by_label(lbl, exact=False)
                    if await loc.count() > 0:
                        trigger = await loc.first.element_handle()
                        break
                except Exception:
                    continue

        if not trigger:
            log_fn(f"  ⚠️ Could not find toggle field: {field_name}")
            return False

        await trigger.click()
        await asyncio.sleep(1)

        # 3. Try picking the option from various FB containers
        for opt_text in option_texts:
            # role="option" inside role="listbox"
            for opt_sel in [
                f'[role="option"]:has-text("{opt_text}")',
                f'[role="listbox"] [role="option"]:has-text("{opt_text}")',
                f'[role="menuitemradio"]:has-text("{opt_text}")',
                f'[role="radio"]:has-text("{opt_text}")',
                f'div[role="button"]:has-text("{opt_text}")',
            ]:
                try:
                    opt = await page.query_selector(opt_sel)
                    if opt:
                        await opt.click()
                        log_fn(f"  ✅ {field_name}: {opt_text}")
                        await asyncio.sleep(0.5)
                        return True
                except Exception:
                    continue

            # Playwright text locator (broader)
            try:
                opt_loc = page.get_by_text(opt_text, exact=True)
                if await opt_loc.count() > 0:
                    await opt_loc.first.click()
                    log_fn(f"  ✅ {field_name}: {opt_text}")
                    await asyncio.sleep(0.5)
                    return True
            except Exception:
                pass

            # Looser match
            try:
                opt_loc = page.get_by_text(opt_text, exact=False)
                if await opt_loc.count() > 0:
                    await opt_loc.first.click()
                    log_fn(f"  ✅ {field_name}: {opt_text} (loose match)")
                    await asyncio.sleep(0.5)
                    return True
            except Exception:
                pass

        # 4. Last resort: pick first option in any visible listbox
        try:
            first_opt = await page.query_selector('[role="listbox"] [role="option"]:first-child')
            if first_opt:
                text = await first_opt.text_content()
                await first_opt.click()
                log_fn(f"  ✅ {field_name}: {text} (first option)")
                await asyncio.sleep(0.5)
                return True
        except Exception:
            pass

        # Dismiss any open menu by pressing Escape
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.3)
        log_fn(f"  ⚠️ Could not select {field_name} option")
        return False

    # ── Fill Vehicle Details ──
    log_fn("📝 Filling vehicle details...")

    # VEHICLE TYPE — must be selected FIRST (it's a toggle/dropdown at the top)
    # Facebook shows: Car/Truck, Motorcycle, Powersport, RV/Camper, etc.
    log_fn("  🚗 Selecting vehicle type...")
    await select_fb_toggle(
        ["Vehicle type", "Tipo de vehículo"],
        ["Car/Truck", "Auto/Camioneta", "Car", "Auto"],
        "Tipo de vehículo"
    )
    # Wait longer so FB renders Make/Model dropdowns before we try to fill them
    await asyncio.sleep(3)

    # Price (text input)
    # If price is 0 or None, default to "0" so FB form still receives a digit
    await fill_field(
        ["Price", "Precio", "price"],
        str(price) if price is not None and str(price).strip() != "" else "0",
        "Precio"
    )

    # Year (dropdown)
    year = car.get("car_year")
    if year:
        await select_dropdown(["Year", "Año", "year"], str(year), "Año")

    # Brand / Make (dropdown)
    brand = (car.get("car_make") or "")
    if brand:
        await select_dropdown(["Make", "Marca", "Vehicle make", "make"], brand, "Marca")

    # Model (dropdown — wait for FB to populate it after brand selection)
    model = (car.get("car_model") or "")
    if model:
        await asyncio.sleep(2.5)  # FB needs time to load models for the selected make
        await select_dropdown(["Model", "Modelo", "Vehicle model", "model"], model, "Modelo")

    # Mileage (text input)
    mileage = car.get("mileage") or car.get("km_verified")
    if mileage:
        await fill_field(
            ["Mileage", "Kilometraje", "mileage"],
            str(mileage),
            "Kilometraje"
        )

    # Transmission (dropdown)
    transmission = (car.get("transmission") or "")
    if transmission:
        trans_map = {
            "manual": "Manual", "automatica": "Automatic", "automática": "Automatic",
            "automático": "Automatic", "automatico": "Automatic",
        }
        trans_value = trans_map.get(transmission.lower(), transmission)
        await select_dropdown(
            ["Transmission", "Transmisión", "transmission"],
            trans_value, "Transmisión"
        )

    # Fuel type (dropdown)
    fuel = (car.get("fuel_type") or "")
    if fuel:
        fuel_map = {
            "bencina": "Gasoline", "gasolina": "Gasoline",
            "diesel": "Diesel", "diésel": "Diesel",
            "eléctrico": "Electric", "electrico": "Electric",
            "híbrido": "Hybrid", "hibrido": "Hybrid",
        }
        fuel_value = fuel_map.get(fuel.lower(), fuel)
        await select_dropdown(
            ["Fuel type", "Tipo de combustible", "fuel_type"],
            fuel_value, "Combustible"
        )

    # Body style (dropdown/toggle) — e.g., Sedan, SUV, Hatchback, Convertible, Coupe, etc.
    body_style = (car.get("body_type") or car.get("body_style") or "")
    if body_style:
        body_map = {
            "sedan": "Sedan", "sedán": "Sedan",
            "suv": "SUV", "hatchback": "Hatchback",
            "convertible": "Convertible", "coupe": "Coupe", "coupé": "Coupe",
            "van": "Van", "minivan": "Minivan", "wagon": "Wagon",
            "truck": "Truck", "camioneta": "Truck", "pickup": "Truck",
        }
        body_value = body_map.get(body_style.lower(), body_style.capitalize())
        await select_fb_toggle(
            ["Body style", "Estilo de carrocería", "body_style"],
            [body_value, "Sedan", "Other"],
            "Carrocería"
        )
    else:
        # Default to Sedan if no body style is available
        log_fn("  ℹ️ No body style in data, selecting Sedan as default...")
        await select_fb_toggle(
            ["Body style", "Estilo de carrocería", "body_style"],
            ["Sedan", "Other"],
            "Carrocería"
        )

    # Vehicle condition (dropdown/toggle) — e.g., New, Used, Certified pre-owned
    condition = (car.get("condition") or car.get("vehicle_condition") or "")
    if condition:
        cond_map = {
            "nuevo": "New", "new": "New",
            "usado": "Used - Good", "used": "Used - Good",
            "excelente": "Used - Fair", "fair": "Used - Fair",
        }
        cond_value = cond_map.get(condition.lower(), condition)
        await select_fb_toggle(
            ["Vehicle condition", "Condición del vehículo", "condition"],
            [cond_value, "Used - Good", "Good"],
            "Condición"
        )
    else:
        # Default to "Used - Good" for consignment vehicles
        log_fn("  ℹ️ No condition in data, selecting Used - Good as default...")
        await select_fb_toggle(
            ["Vehicle condition", "Condición del vehículo", "condition"],
            ["Used - Good", "Good", "Used - Fair", "Fair"],
            "Condición"
        )

    # Exterior colour (dropdown) — optional, fill if data available
    ext_color = (car.get("exterior_color") or car.get("color") or "")
    if ext_color:
        color_map = {
            "blanco": "White", "negro": "Black", "gris": "Grey", "plata": "Silver",
            "rojo": "Red", "azul": "Blue", "verde": "Green", "amarillo": "Yellow",
            "beige": "Beige", "café": "Brown", "marrón": "Brown", "naranja": "Orange",
            "dorado": "Gold", "celeste": "Blue",
        }
        ext_value = color_map.get(ext_color.lower(), ext_color.capitalize())
        await select_dropdown(
            ["Exterior colour", "Exterior color", "Color exterior"],
            ext_value, "Color exterior"
        )

    # Interior colour (dropdown) — optional, fill if data available
    int_color = (car.get("interior_color") or "")
    if int_color:
        color_map = {
            "blanco": "White", "negro": "Black", "gris": "Grey",
            "beige": "Beige", "café": "Brown", "marrón": "Brown",
        }
        int_value = color_map.get(int_color.lower(), int_color.capitalize())
        await select_dropdown(
            ["Interior colour", "Interior color", "Color interior"],
            int_value, "Color interior"
        )

    await asyncio.sleep(1)

    # ── Description (textbox) ──
    log_fn("📄 Writing description...")
    desc_filled = False
    for desc_sel in ['[aria-label="Description"]', '[aria-label="Descripción"]']:
        try:
            el = await page.query_selector(desc_sel)
            if el:
                await el.click()
                await asyncio.sleep(0.3)
                await el.type(caption, delay=10)
                desc_filled = True
                log_fn("  ✅ Descripción escrita")
                break
        except Exception:
            continue
    if not desc_filled:
        # Try Playwright locator
        try:
            loc = page.get_by_label("Description", exact=False)
            if await loc.count() == 0:
                loc = page.get_by_label("Descripción", exact=False)
            if await loc.count() > 0:
                await loc.first.click()
                await asyncio.sleep(0.3)
                await loc.first.type(caption, delay=10)
                desc_filled = True
                log_fn("  ✅ Descripción escrita")
        except Exception:
            pass
    if not desc_filled:
        # Last resort: find a large textarea or contenteditable
        try:
            ta = await page.query_selector('textarea, [contenteditable="true"][role="textbox"]')
            if ta:
                await ta.click()
                await asyncio.sleep(0.3)
                await ta.type(caption, delay=10)
                desc_filled = True
                log_fn("  ✅ Descripción escrita (fallback)")
        except Exception:
            log_fn("  ⚠️ Could not fill description")
    await asyncio.sleep(1)

    # ── Location ──
    log_fn(f"📍 Setting location to {FB_LOCATION}...")
    loc_filled = False
    for loc_lbl in ["Location", "Ubicación"]:
        try:
            el = await page.query_selector(f'[aria-label="{loc_lbl}"]')
            if not el:
                loc2 = page.get_by_label(loc_lbl, exact=False)
                if await loc2.count() > 0:
                    el = await loc2.first.element_handle()
            if el:
                await el.click()
                await asyncio.sleep(0.5)
                await page.keyboard.press("Meta+A")
                await page.keyboard.press("Control+A")
                await page.keyboard.press("Backspace")
                await el.type(FB_LOCATION, delay=50)
                # Wait for suggestions and pick the best one (prefer exact city match)
                for wait_i in range(6):
                    await asyncio.sleep(1)
                    options = await page.query_selector_all('[role="listbox"] [role="option"]')
                    if not options:
                        options = await page.query_selector_all('ul[role="listbox"] li')
                    if options:
                        # Try to find an option that starts with our location name
                        # (skip suburbs like "Bosques de Miramar, Viña del Mar")
                        best = None
                        for opt in options:
                            text = (await opt.inner_text()).strip()
                            # Prefer "Viña del Mar" over "Bosques de Miramar, Viña del Mar"
                            if text.lower().startswith(FB_LOCATION.lower()):
                                best = opt
                                break
                        # If no exact start-match, just pick the first one
                        if not best:
                            best = options[0]
                        chosen_text = (await best.inner_text()).strip()
                        await best.click()
                        log_fn(f"  ✅ Ubicación: {chosen_text}")
                        loc_filled = True
                        break
                if not loc_filled:
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(1)
                    loc_filled = True
                    log_fn(f"  ⚠️ Location: typed '{FB_LOCATION}' (no suggestion found, pressed Enter)")
                break
        except Exception:
            continue
    if not loc_filled:
        log_fn("  ⚠️ Could not set location")
    await asyncio.sleep(0.5)

    # Take screenshot before publishing for debug
    log_fn("📸 Taking pre-publish screenshot...")
    await page.screenshot(path="/tmp/fb_marketplace_preview.png")

    # ── Publish ──
    log_fn("🚀 Publishing listing...")

    # Try to find and click Next/Publish button
    for btn_text in ["Next", "Siguiente", "Publish", "Publicar"]:
        try:
            btn = await page.query_selector(f'[aria-label="{btn_text}"]')
            if not btn:
                btn = await page.query_selector(f'button:has-text("{btn_text}")')
            if not btn:
                loc = page.get_by_role("button", name=btn_text)
                if await loc.count() > 0:
                    btn = await loc.first.element_handle()
            if btn:
                await btn.click()
                log_fn(f"  ✅ Clicked '{btn_text}'")
                await asyncio.sleep(3)
        except Exception:
            continue

    # If there's a second "Publish" after "Next"
    for btn_text in ["Publish", "Publicar"]:
        try:
            btn = await page.query_selector(f'[aria-label="{btn_text}"]')
            if not btn:
                btn = await page.query_selector(f'button:has-text("{btn_text}")')
            if not btn:
                loc = page.get_by_role("button", name=btn_text)
                if await loc.count() > 0:
                    btn = await loc.first.element_handle()
            if btn:
                await btn.click()
                log_fn(f"  ✅ Clicked '{btn_text}'")
                await asyncio.sleep(5)
        except Exception:
            continue

    # Get the marketplace listing URL
    await asyncio.sleep(3)
    listing_url = page.url
    log_fn(f"✅ Marketplace listing created! URL: {listing_url}")

    await _dump_page_debug(page, log_fn, "after_publish")
    return listing_url


async def _find_listing_url(page, log_fn):
    """After publishing, find the actual listing URL from 'Your Listings' page.
    Strategy: go to selling page, click first listing card, grab the item URL."""
    try:
        await page.goto("https://www.facebook.com/marketplace/you/selling", wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(6)

        # Strategy 1: Search page HTML for marketplace/item/ URLs
        content = await page.content()
        import re
        matches = re.findall(r'marketplace/item/(\d+)', content)
        if matches:
            url = f"https://www.facebook.com/marketplace/item/{matches[0]}/"
            log_fn(f"  🔗 Found listing URL (regex): {url}")
            return url

        # Strategy 2: Look for <a> tags with /marketplace/item/ href
        for sel in ['a[href*="/marketplace/item/"]', 'a[href*="/item/"]']:
            links = await page.query_selector_all(sel)
            for link in links:
                href = await link.get_attribute("href")
                if href and "item" in href:
                    if not href.startswith("http"):
                        href = "https://www.facebook.com" + href
                    log_fn(f"  🔗 Found listing URL (selector): {href}")
                    return href

        # Strategy 3: CLICK the first listing card on the selling page
        # The selling page shows your listings as image cards. Click one to navigate to it.
        log_fn(f"  🔍 No direct item links found — clicking first listing card...")
        
        # First, dump all visible images to understand page structure
        card_info = await page.evaluate("""() => {
            const results = [];
            
            // Find all images on the page — listing cards have product images
            const allImgs = document.querySelectorAll('img');
            for (const img of allImgs) {
                if (img.offsetParent === null) continue;
                const r = img.getBoundingClientRect();
                // Skip tiny icons, avatars, nav images
                if (r.width < 60 || r.height < 60) continue;
                // Skip images in the top nav area
                if (r.y < 100) continue;
                
                const src = img.src || '';
                // FB listing images are typically from scontent or fbcdn
                const isProductImg = src.includes('scontent') || src.includes('fbcdn') || 
                                     src.includes('marketplace') || r.width >= 100;
                if (!isProductImg) continue;
                
                results.push({
                    x: Math.round(r.x + r.width / 2),
                    y: Math.round(r.y + r.height / 2),
                    w: Math.round(r.width),
                    h: Math.round(r.height),
                    src: src.substring(0, 80)
                });
            }
            return results.slice(0, 10);
        }""")
        
        log_fn(f"  🔍 Found {len(card_info)} candidate images")
        
        if card_info:
            # Click the first product-looking image
            img = card_info[0]
            log_fn(f"  🎯 Clicking image at ({img['x']}, {img['y']}) size={img['w']}x{img['h']}")
            await page.mouse.click(img["x"], img["y"])
            await asyncio.sleep(5)
            
            # Check if URL changed to an item page
            current = page.url
            log_fn(f"  🔗 Current URL after click: {current}")
            if "marketplace/item" in current:
                return current
            
            # Maybe it opened a side panel — check HTML for item URLs
            content2 = await page.content()
            matches2 = re.findall(r'marketplace/item/(\d+)', content2)
            if matches2:
                url = f"https://www.facebook.com/marketplace/item/{matches2[0]}/"
                log_fn(f"  🔗 Found listing URL in page after click: {url}")
                return url
            
            # Maybe FB opened a modal/overlay with the listing
            # Try to find a "View listing" or direct item link in the new content
            item_links = await page.evaluate("""() => {
                const links = [];
                document.querySelectorAll('a').forEach(a => {
                    const href = a.href || '';
                    if (href.includes('/item/') || href.includes('marketplace/item')) {
                        links.push(href);
                    }
                });
                return links.slice(0, 5);
            }""")
            if item_links:
                url = item_links[0]
                if not url.startswith("http"):
                    url = "https://www.facebook.com" + url
                log_fn(f"  🔗 Found item link after click: {url}")
                return url

        log_fn(f"  ⚠️ Could not extract listing URL from page")
        await _dump_page_debug(page, log_fn, "your_listings_page")
    except Exception as e:
        log_fn(f"  ⚠️ Could not find listing URL: {str(e)[:80]}")
    return None


async def _click_by_text_js(page, texts, container_sel="body", tag="*"):
    """Helper: find visible element by exact or partial text and click it via JS."""
    for txt in texts:
        try:
            clicked = await page.evaluate("""({txt, containerSel, tag}) => {
                const container = document.querySelector(containerSel) || document.body;
                const els = container.querySelectorAll(tag);
                for (const el of els) {
                    if (el.offsetParent === null) continue;
                    const t = el.textContent.trim();
                    if (t === txt || t.toLowerCase() === txt.toLowerCase()) {
                        const target = el.closest('[role="button"]') || el.closest('a') || el.parentElement || el;
                        target.click();
                        return true;
                    }
                }
                return false;
            }""", {"txt": txt, "containerSel": container_sel, "tag": tag})
            if clicked:
                return True
        except Exception:
            continue
    return False


async def _debug_dialog_contents(page, log_fn, label):
    """Dump ALL visible text, buttons, inputs, and roles inside dialogs for debugging."""
    try:
        info = await page.evaluate("""() => {
            const dialogs = [...document.querySelectorAll('[role="dialog"]')];
            const target = dialogs.length > 0 ? dialogs[dialogs.length - 1] : document.body;
            
            const buttons = [];
            target.querySelectorAll('[role="button"], button').forEach(el => {
                if (el.offsetParent !== null) {
                    const r = el.getBoundingClientRect();
                    buttons.push({t: el.textContent.trim().substring(0, 80), w: Math.round(r.width), h: Math.round(r.height), role: el.getAttribute('role'), tag: el.tagName});
                }
            });
            
            const inputs = [];
            target.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(el => {
                if (el.offsetParent !== null) {
                    inputs.push({tag: el.tagName, type: el.type||'', ph: (el.placeholder||el.getAttribute('aria-placeholder')||'').substring(0, 50), aria: (el.getAttribute('aria-label')||'').substring(0, 50)});
                }
            });
            
            const spans = [];
            target.querySelectorAll('span').forEach(el => {
                if (el.offsetParent !== null && el.children.length === 0) {
                    const t = el.textContent.trim();
                    if (t.length > 0 && t.length < 100) spans.push(t);
                }
            });
            
            // Deduplicate spans
            const uniqueSpans = [...new Set(spans)].slice(0, 40);
            
            return {buttons: buttons.slice(0, 25), inputs: inputs.slice(0, 10), spans: uniqueSpans, dialogCount: dialogs.length};
        }""")
        log_fn(f"  🔍 [{label}] Dialogs: {info.get('dialogCount', 0)}")
        log_fn(f"  🔍 [{label}] Buttons: {json.dumps(info.get('buttons',[]), ensure_ascii=False)[:600]}")
        log_fn(f"  🔍 [{label}] Inputs: {json.dumps(info.get('inputs',[]), ensure_ascii=False)[:400]}")
        log_fn(f"  🔍 [{label}] Spans: {json.dumps(info.get('spans',[]), ensure_ascii=False)[:600]}")
    except Exception as e:
        log_fn(f"  🔍 [{label}] Debug failed: {str(e)[:80]}")


async def share_to_group(page, group, listing_url, caption, log_fn):
    """
    Share a Marketplace listing to a FB group.
    
    Flow:
    1. Go to listing page → click "Share"
    2. Share dialog → click "Group" / "Grupo" icon
    3. "Share to a group" → search group → CLICK the group row
    4. New form: optional text + "Post"/"Publicar" button → click it
    5. Done! Repeat for next group.
    """
    group_name = group["name"]
    # Build multiple search terms from the ACTUAL group name (progressively shorter)
    import re as _re
    clean = _re.sub(r'[^\w\s]', ' ', group_name)
    words = [w for w in clean.split() if len(w) > 1]
    # Try: first 2 words, then first word, then the "search" override if different
    search_attempts = []
    if len(words) >= 2:
        search_attempts.append(' '.join(words[:2]))
    if words:
        search_attempts.append(words[0])
    override = group.get("search", "").strip()
    if override:
        # Also add the first 2 words of the override
        ow = override.split()
        if len(ow) >= 2:
            search_attempts.insert(0, ' '.join(ow[:2]))
        if ow:
            search_attempts.append(ow[0])
    # Deduplicate while keeping order
    seen = set()
    unique_searches = []
    for s in search_attempts:
        s = s[:30].strip()
        if s.lower() not in seen and len(s) > 1:
            seen.add(s.lower())
            unique_searches.append(s)

    try:
        log_fn(f"📤 Sharing to: {group_name}...")

        # ── Step 1: Go to listing page ──
        await page.goto(listing_url, wait_until="domcontentloaded", timeout=25000)
        await asyncio.sleep(5)

        # Capture listing title for later verification in the group feed
        try:
            listing_title = (await page.title()) or ''
            listing_title = listing_title.strip()[:200]
            log_fn(f"  🔖 Listing title: {listing_title[:80]}")
        except Exception:
            listing_title = ''

        # Pre-check: verify the bot account is a member of the target group
        if group.get('url'):
            try:
                log_fn(f"  🔎 Checking membership for group URL: {group.get('url')}")
                await page.goto(group.get('url'), wait_until='domcontentloaded', timeout=20000)
                await asyncio.sleep(3)
                is_member = await page.evaluate("""() => {
                    const t = document.body.innerText.toLowerCase();
                    if (t.includes('join group') || t.includes('unirse al grupo') || t.includes('solicitar unirse') || t.includes('solicitar unirse al grupo')) return false;
                    // If there's a 'Write something' or 'Crear publicación' box, assume member
                    if (t.includes('write something') || t.includes('escribe algo') || t.includes('crear publicación') || t.includes('escribe una publicación')) return true;
                    return true;
                }""")
                if not is_member:
                    log_fn(f"  ❌ Bot account does not appear to be a member of the group; skipping share")
                    # Try to return to the listing page for cleanliness
                    try:
                        await page.goto(listing_url, wait_until='domcontentloaded', timeout=10000)
                        await asyncio.sleep(2)
                    except Exception:
                        pass
                    return False
                else:
                    log_fn(f"  ✅ Bot account appears to be a member of the group")
                # After check, go back to the listing
                try:
                    await page.goto(listing_url, wait_until='domcontentloaded', timeout=10000)
                    await asyncio.sleep(2)
                except Exception:
                    pass
            except Exception as e:
                log_fn(f"  ⚠️ Membership check failed: {str(e)[:120]}")

        if "login" in page.url.lower():
            log_fn(f"  ❌ Not logged in")
            return False

        # ── Step 2: Click Share button ──
        share_clicked = False
        
        # Strategy A: aria-label based (most reliable)
        for label in ["Share", "Compartir", "Send this to friends or post it on your profile",
                       "Enviar esto a amigos o publicarlo en tu perfil"]:
            try:
                el = await page.query_selector(f'[aria-label="{label}"]')
                if el and await el.is_visible():
                    await el.click()
                    share_clicked = True
                    log_fn(f"  ✅ Clicked Share (aria-label)")
                    break
            except Exception:
                continue

        # Strategy B: role=button with text
        if not share_clicked:
            for label in ["Share", "Compartir"]:
                try:
                    loc = page.get_by_role("button", name=label)
                    if await loc.count() > 0:
                        await loc.first.click()
                        share_clicked = True
                        log_fn(f"  ✅ Clicked Share (role)")
                        break
                except Exception:
                    continue

        # Strategy C: JS scan for share icon/button
        if not share_clicked:
            try:
                share_clicked = await page.evaluate("""() => {
                    // Look for a share icon button - typically has an SVG with a share arrow
                    const btns = document.querySelectorAll('[role="button"], button');
                    for (const btn of btns) {
                        if (btn.offsetParent === null) continue;
                        const al = (btn.getAttribute('aria-label') || '').toLowerCase();
                        const txt = btn.textContent.trim().toLowerCase();
                        if (al.includes('share') || al.includes('compartir') ||
                            txt === 'share' || txt === 'compartir') {
                            btn.click();
                            return true;
                        }
                    }
                    return false;
                }""")
            except Exception:
                pass

        if not share_clicked:
            log_fn(f"  ⚠️ No Share button found")
            await _debug_dialog_contents(page, log_fn, "no_share")
            await _dump_page_debug(page, log_fn, "no_share_btn")
            return False

        if not share_clicked:
            pass  # already logged above
        await asyncio.sleep(3)

        # ── Step 3: Click "Group"/"Grupo" in the share popup ──
        # IMPORTANT: JS .click() does NOT work on FB React elements!
        # We MUST use Playwright's native click (dispatches real mouse events).
        group_icon_clicked = False

        await _debug_dialog_contents(page, log_fn, "share_dialog")

        # First, scroll the share dialog down so the "Share to" section with Group is fully visible
        try:
            await page.evaluate("""() => {
                const dialogs = [...document.querySelectorAll('[role="dialog"]')];
                const dlg = dialogs.length > 0 ? dialogs[dialogs.length - 1] : null;
                if (dlg) {
                    const scrollables = dlg.querySelectorAll('div');
                    for (const div of scrollables) {
                        if (div.scrollHeight > div.clientHeight + 10) {
                            div.scrollTop = div.scrollHeight;
                            return true;
                        }
                    }
                    dlg.scrollTop = dlg.scrollHeight;
                }
                return false;
            }""")
            await asyncio.sleep(1)
        except Exception:
            pass

        # Strategy A: Use Playwright locator for Group/Grupo text (most reliable)
        for txt in ["Group", "Grupo"]:
            if group_icon_clicked:
                break
            try:
                loc = page.get_by_text(txt, exact=True)
                cnt = await loc.count()
                for i in range(cnt):
                    el = loc.nth(i)
                    if await el.is_visible():
                        await el.scroll_into_view_if_needed()
                        await asyncio.sleep(0.5)
                        bb = await el.bounding_box()
                        if bb:
                            log_fn(f"  🎯 Found Group icon via locator at ({bb['x']:.0f}, {bb['y']:.0f}) size={bb['width']:.0f}x{bb['height']:.0f}")
                            # Click the PARENT container (the icon+label area) not just the text
                            # Walk up to find the clickable parent with cursor:pointer
                            parent_box = await page.evaluate("""(el) => {
                                let node = el;
                                for (let i = 0; i < 6; i++) {
                                    if (!node.parentElement) break;
                                    node = node.parentElement;
                                    const cursor = window.getComputedStyle(node).cursor;
                                    const role = node.getAttribute('role');
                                    if (role === 'button' || cursor === 'pointer') {
                                        const r = node.getBoundingClientRect();
                                        if (r.width > 20 && r.height > 20) {
                                            return {x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height};
                                        }
                                    }
                                }
                                return null;
                            }""", await el.element_handle())
                            
                            if parent_box:
                                log_fn(f"  🎯 Clicking parent container at ({parent_box['x']:.0f}, {parent_box['y']:.0f}) {parent_box['w']:.0f}x{parent_box['h']:.0f}")
                                await page.mouse.click(parent_box['x'], parent_box['y'])
                            else:
                                await page.mouse.click(bb["x"] + bb["width"]/2, bb["y"] + bb["height"]/2)
                            group_icon_clicked = True
                            break
            except Exception as e:
                log_fn(f"  ⚠️ Locator '{txt}' failed: {str(e)[:60]}")

        # Strategy B: Find span with text "Group"/"Grupo" inside dialog via JS
        if not group_icon_clicked:
            try:
                coords = await page.evaluate("""() => {
                    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
                    const dlg = dialogs.length > 0 ? dialogs[dialogs.length - 1] : document.body;
                    const targets = ['group', 'grupo'];
                    const spans = dlg.querySelectorAll('span');
                    for (const span of spans) {
                        if (span.offsetParent === null) continue;
                        if (span.children.length > 0) continue;
                        const t = span.textContent.trim().toLowerCase();
                        if (targets.includes(t)) {
                            span.scrollIntoView({block: 'center', behavior: 'instant'});
                            let clickTarget = span;
                            let parent = span.parentElement;
                            for (let i = 0; i < 5; i++) {
                                if (!parent) break;
                                const role = parent.getAttribute('role');
                                const cursor = window.getComputedStyle(parent).cursor;
                                if (role === 'button' || cursor === 'pointer') {
                                    clickTarget = parent;
                                    break;
                                }
                                parent = parent.parentElement;
                            }
                            const r = clickTarget.getBoundingClientRect();
                            return {x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), found: true,
                                    w: Math.round(r.width), h: Math.round(r.height)};
                        }
                    }
                    return {found: false};
                }""")
                if coords.get("found"):
                    log_fn(f"  🎯 Found Group via JS at ({coords['x']}, {coords['y']}) size={coords.get('w')}x{coords.get('h')}")
                    await asyncio.sleep(0.5)
                    await page.mouse.click(coords["x"], coords["y"])
                    group_icon_clicked = True
            except Exception as e:
                log_fn(f"  ⚠️ Group JS strategy failed: {str(e)[:60]}")

        if not group_icon_clicked:
            log_fn(f"  ⚠️ No 'Group' option in Share dialog")
            await _dump_page_debug(page, log_fn, "no_group_icon")
            await page.keyboard.press("Escape")
            await asyncio.sleep(1)
            return False

        log_fn(f"  ✅ Clicked Group icon")
        await asyncio.sleep(4)
        
        # Verify we're now in the group picker (should have "Search for groups" input)
        group_picker_ok = await page.evaluate("""() => {
            const inputs = document.querySelectorAll('input[type="search"]');
            for (const inp of inputs) {
                const ph = (inp.placeholder || '').toLowerCase();
                const al = (inp.getAttribute('aria-label') || '').toLowerCase();
                if (ph.includes('group') || al.includes('group') || ph.includes('grupo') || al.includes('grupo')) return true;
            }
            // Also check if "Share to a group" text exists
            const spans = document.querySelectorAll('span');
            for (const s of spans) {
                const t = s.textContent.trim().toLowerCase();
                if (t.includes('share to a group') || t.includes('compartir en un grupo')) return true;
            }
            return false;
        }""")
        
        if not group_picker_ok:
            log_fn(f"  ⚠️ Group picker not found after clicking Group — dialog may have closed")
            # Try to recover: go back to the listing and start over
            await _dump_page_debug(page, log_fn, "no_group_picker")
            for _ in range(3):
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.5)
            return False

        await _debug_dialog_contents(page, log_fn, "after_group_click")

        # ── Step 4 + 5: Find the group in the list and click it ──
        # The "Share to a group" dialog shows ALL your groups.
        # Strategy: First try to find & click the group from the VISIBLE list (no search needed).
        # If not visible, use the search input with progressively shorter terms.
        
        # Helper JS to find a group row by partial name match and return coordinates
        FIND_GROUP_ROW_JS = """(targetName) => {
            const dialogs = [...document.querySelectorAll('[role="dialog"]')];
            const dlg = dialogs.length > 0 ? dialogs[dialogs.length - 1] : document.body;
            const target = targetName.toLowerCase();
            
            // Skip these texts — they're UI elements, not groups
            const skipTexts = ['close', 'cerrar', 'back', 'atrás', 'search', 'buscar',
                              'share to a group', 'compartir en un grupo', 'all groups',
                              'todos los grupos', 'share', 'compartir',
                              'no groups match', 'no hay grupos'];
            
            // Strategy 1: Find role="button" rows that contain "Public group"/"Private group" text
            const buttons = dlg.querySelectorAll('[role="button"]');
            for (const btn of buttons) {
                if (btn.offsetParent === null) continue;
                const r = btn.getBoundingClientRect();
                if (r.height < 35 || r.height > 200 || r.width < 150) continue;
                
                const txt = btn.textContent.trim();
                const txtLower = txt.toLowerCase();
                
                // Skip UI elements
                if (skipTexts.some(s => txtLower.includes(s))) continue;
                if (btn.querySelector('input')) continue;
                
                // Must contain a group-type indicator
                const hasGroupHint = txtLower.includes('public group') || txtLower.includes('grupo público') ||
                                     txtLower.includes('private group') || txtLower.includes('grupo privado');
                if (!hasGroupHint) continue;
                
                // Check if this row matches the target group name
                if (txtLower.includes(target) || target.includes(txtLower.substring(0, 20))) {
                    return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2),
                            name: txt.substring(0, 80), match: 'exact'};
                }
            }
            
            // Strategy 2: Find ANY group-row button (first available result)
            for (const btn of buttons) {
                if (btn.offsetParent === null) continue;
                const r = btn.getBoundingClientRect();
                if (r.height < 35 || r.height > 200 || r.width < 150) continue;
                
                const txt = btn.textContent.trim();
                const txtLower = txt.toLowerCase();
                if (skipTexts.some(s => txtLower.includes(s))) continue;
                if (btn.querySelector('input')) continue;
                
                const hasGroupHint = txtLower.includes('public group') || txtLower.includes('grupo público') ||
                                     txtLower.includes('private group') || txtLower.includes('grupo privado');
                if (hasGroupHint) {
                    return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2),
                            name: txt.substring(0, 80), match: 'first_available'};
                }
            }
            
            return null;
        }"""

        # Find search input coordinates (we'll need it for searching)
        search_coords = await page.evaluate("""() => {
            const dialogs = [...document.querySelectorAll('[role="dialog"]')];
            const dlg = dialogs.length > 0 ? dialogs[dialogs.length - 1] : document.body;
            const inputs = dlg.querySelectorAll('input[type="search"], input[placeholder*="roup"], input[placeholder*="rupo"], input[aria-label*="roup"]');
            for (const inp of inputs) {
                if (inp.offsetParent === null) continue;
                const r = inp.getBoundingClientRect();
                if (r.width > 50) return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)};
            }
            const allInputs = dlg.querySelectorAll('input');
            for (const inp of allInputs) {
                if (inp.offsetParent === null || inp.type === 'hidden') continue;
                const r = inp.getBoundingClientRect();
                if (r.width > 50) return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)};
            }
            return null;
        }""")
        
        if not search_coords:
            log_fn(f"  ⚠️ No search input — Group click may have failed")
            await _dump_page_debug(page, log_fn, "no_search_input")
            await page.keyboard.press("Escape")
            await asyncio.sleep(1)
            return False

        log_fn(f"  🔍 Search input at ({search_coords['x']}, {search_coords['y']})")

        # Prefer searching the exact group name first (reduces false positives).
        row_clicked = False

        try:
            # Click search input and type the full group name (exact search)
            await page.mouse.click(search_coords["x"], search_coords["y"])
            await asyncio.sleep(0.3)
            await page.keyboard.press("Meta+a")
            await page.keyboard.press("Backspace")
            await asyncio.sleep(0.3)
            # Type the full name more slowly to avoid missing characters
            for ch in group_name:
                await page.keyboard.type(ch, delay=60)
            log_fn(f"  🔎 Exact search: '{group_name[:60]}'")
            await asyncio.sleep(3)
            row_info = await page.evaluate(FIND_GROUP_ROW_JS, group_name.lower()[:120])
            if row_info:
                log_fn(f"  🎯 Found by exact search: {row_info['name'][:50]} ({row_info['match']})")
                await page.mouse.click(row_info["x"], row_info["y"])
                row_clicked = True
                log_fn(f"  ✅ Clicked group row (exact search)")
        except Exception as e:
            log_fn(f"  ⚠️ Exact search error: {str(e)[:60]}")

        # --- Attempt B: Try the VISIBLE list (no typing) ---
        if not row_clicked:
            try:
                row_info = await page.evaluate(FIND_GROUP_ROW_JS, group_name.lower()[:30])
                if row_info:
                    log_fn(f"  🎯 Found in visible list: {row_info['name'][:50]} ({row_info['match']})")
                    await page.mouse.click(row_info["x"], row_info["y"])
                    row_clicked = True
                    log_fn(f"  ✅ Clicked group row (no search needed)")
            except Exception as e:
                log_fn(f"  ⚠️ Visible list scan: {str(e)[:60]}")

        # --- Attempt C: Search with progressively shorter terms ---
        if not row_clicked:
            for search_idx, search_term in enumerate(unique_searches):
                if row_clicked:
                    break

                # Click search input, clear it, type new term
                await page.mouse.click(search_coords["x"], search_coords["y"])
                await asyncio.sleep(0.3)
                await page.keyboard.press("Meta+a")
                await page.keyboard.press("Backspace")
                await asyncio.sleep(0.3)
                for ch in search_term:
                    await page.keyboard.type(ch, delay=40)
                log_fn(f"  🔍 Search [{search_idx+1}/{len(unique_searches)}]: '{search_term}'")
                await asyncio.sleep(3)

                # Check if there are results (not "No groups match")
                try:
                    row_info = await page.evaluate(FIND_GROUP_ROW_JS, group_name.lower()[:30])
                    if row_info:
                        log_fn(f"  🎯 Found: {row_info['name'][:50]} ({row_info['match']})")
                        await page.mouse.click(row_info["x"], row_info["y"])
                        row_clicked = True
                        log_fn(f"  ✅ Clicked group row")
                    else:
                        log_fn(f"  ⚠️ No results for '{search_term}'")
                except Exception as e:
                    log_fn(f"  ⚠️ Search attempt error: {str(e)[:60]}")

        # --- Attempt C: Clear search and scroll through the full list ---
        if not row_clicked:
            log_fn(f"  🔄 Clearing search, trying scroll through full list...")
            await page.mouse.click(search_coords["x"], search_coords["y"])
            await asyncio.sleep(0.3)
            await page.keyboard.press("Meta+a")
            await page.keyboard.press("Backspace")
            await asyncio.sleep(2)
            
            # Scroll down in the dialog to find more groups
            for scroll_attempt in range(5):
                try:
                    row_info = await page.evaluate(FIND_GROUP_ROW_JS, group_name.lower()[:30])
                    if row_info:
                        log_fn(f"  🎯 Found after scroll: {row_info['name'][:50]}")
                        await page.mouse.click(row_info["x"], row_info["y"])
                        row_clicked = True
                        log_fn(f"  ✅ Clicked group row")
                        break
                except Exception:
                    pass
                # Scroll down inside the dialog
                await page.mouse.move(search_coords["x"], search_coords["y"] + 200)
                await page.mouse.wheel(0, 300)
                await asyncio.sleep(1.5)

        if not row_clicked:
            log_fn(f"  ⚠️ Could not find group '{group_name[:30]}' — skipping")
            for _ in range(3):
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.5)
            return False

        # ── Step 6: Click "Post" / "Publicar" button ──
        # After clicking a group, FB opens a "Create post" dialog.
        # Wait for dialog to FULLY render (the linked content preview needs to load).
        await asyncio.sleep(4)

        # Check if the "Create post" dialog actually appeared
        has_create_post = await page.evaluate("""() => {
            const dialogs = [...document.querySelectorAll('[role="dialog"]')];
            for (const d of dialogs) {
                const al = (d.getAttribute('aria-label') || '').toLowerCase();
                if (al.includes('post') || al.includes('publicar') || al.includes('crear')) return true;
                const txt = d.textContent.substring(0, 200).toLowerCase();
                if (txt.includes('create post') || txt.includes('crear publicación')) return true;
            }
            return false;
        }""")
        
        if not has_create_post:
            log_fn(f"  ⚠️ 'Create post' dialog not found — group click may have navigated away")
            await _dump_page_debug(page, log_fn, "no_create_post_dialog")
            for _ in range(3):
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.5)
            return False

        # Wait for Post button to become enabled (link preview may be loading)
        for i in range(8):
            preview_ready = await page.evaluate("""() => {
                const dialogs = [...document.querySelectorAll('[role="dialog"]')];
                const dlg = dialogs.length > 0 ? dialogs[dialogs.length - 1] : null;
                if (!dlg) return false;
                // Check if there's content in the dialog (image preview or link text)
                const imgs = dlg.querySelectorAll('img');
                if (imgs.length > 1) return true;  // Has preview image
                // Check if Post button is NOT disabled
                const btns = dlg.querySelectorAll('[role="button"]');
                for (const btn of btns) {
                    const al = (btn.getAttribute('aria-label') || '').toLowerCase();
                    if (al === 'post' || al === 'publicar') {
                        const disabled = btn.getAttribute('aria-disabled');
                        return disabled !== 'true';
                    }
                }
                return true;  // No Post button found to check, proceed anyway
            }""")
            if preview_ready:
                break
            log_fn(f"  ⏳ Waiting for dialog to load ({i+1})...")
            await asyncio.sleep(2)

        post_clicked = False
        for wait_round in range(6):
            if post_clicked:
                break

            # Find the REAL Post submit button (not the dialog header "Create post")
            try:
                btn_info = await page.evaluate("""() => {
                    const postTexts = ['post', 'publicar'];
                    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
                    
                    for (let di = dialogs.length - 1; di >= 0; di--) {
                        const dlg = dialogs[di];
                        const btns = dlg.querySelectorAll('[role="button"], button');
                        for (const btn of btns) {
                            if (btn.offsetParent === null) continue;
                            const r = btn.getBoundingClientRect();
                            if (r.width < 40 || r.height < 20) continue;
                            const al = (btn.getAttribute('aria-label') || '').trim().toLowerCase();
                            const txt = btn.textContent.trim().toLowerCase();
                            if ((al === 'post' || al === 'publicar' || txt === 'post' || txt === 'publicar') &&
                                !txt.includes('create') && !txt.includes('crear') && !txt.includes('add')) {
                                return {
                                    x: Math.round(r.x + r.width/2), 
                                    y: Math.round(r.y + r.height/2),
                                    w: Math.round(r.width), h: Math.round(r.height)
                                };
                            }
                        }
                    }
                    return null;
                }""")
                if btn_info:
                    if btn_info.get('disabled'):
                        log_fn(f"  ⚠️ Post button found but DISABLED — waiting...")
                        await asyncio.sleep(3)
                        continue
                    
                    log_fn(f"  🎯 Post btn ({btn_info['x']},{btn_info['y']}) {btn_info['w']}x{btn_info['h']}")
                    
                    # Use Playwright's locator click (force=True) — this works with React
                    try:
                        loc = page.locator('[role="button"][aria-label="Post"], [role="button"][aria-label="Publicar"]')
                        count = await loc.count()
                        if count > 0:
                            btn = loc.last
                            await btn.click(force=True, timeout=5000)
                            log_fn(f"  📨 Clicked Post — waiting for FB to finish posting...")
                            post_clicked = True
                            
                            # *** CRITICAL: DO NOTHING. Just wait for FB to finish. ***
                            # Facebook shows a loading animation while posting.
                            # Any page.evaluate() or interaction will interrupt it.
                            # Wait until the "Create post" dialog disappears (means FB is done).
                            for wait_i in range(30):  # Up to 60 seconds
                                await asyncio.sleep(2)
                                try:
                                    dialog_gone = await page.evaluate("""() => {
                                        const dialogs = document.querySelectorAll('[role="dialog"]');
                                        for (const d of dialogs) {
                                            const al = (d.getAttribute('aria-label') || '').toLowerCase();
                                            if (al.includes('create post') || al.includes('crear publicación') || al.includes('post') || al.includes('publicar')) return false;
                                        }
                                        return true;
                                    }""")
                                    if dialog_gone:
                                        log_fn(f"  ✅ Posted to {group_name} (dialog closed after {(wait_i+1)*2}s)")
                                        break
                                except Exception:
                                    # Page might be navigating — that's fine, means post went through
                                    log_fn(f"  ✅ Posted to {group_name} (page navigated)")
                                    break
                            else:
                                # Timed out waiting but we still clicked — might have worked
                                log_fn(f"  ⚠️ Posted to {group_name} (dialog didn't close in 60s, may still have worked)")
                            break
                    except Exception as e:
                        log_fn(f"  ⚠️ Playwright click failed: {str(e)[:80]}")
                    
                    # Fallback: mouse click if locator failed
                    if not post_clicked:
                        try:
                            await page.mouse.click(btn_info["x"], btn_info["y"])
                            log_fn(f"  📨 Mouse-clicked Post — waiting for FB to finish...")
                            post_clicked = True
                            # Same wait logic — wait for dialog to close
                            for wait_i in range(30):
                                await asyncio.sleep(2)
                                try:
                                    dialog_gone = await page.evaluate("""() => {
                                        const dialogs = document.querySelectorAll('[role="dialog"]');
                                        for (const d of dialogs) {
                                            const al = (d.getAttribute('aria-label') || '').toLowerCase();
                                            if (al.includes('post') || al.includes('publicar')) return false;
                                        }
                                        return true;
                                    }""")
                                    if dialog_gone:
                                        log_fn(f"  ✅ Posted to {group_name} (dialog closed)")
                                        break
                                except Exception:
                                    log_fn(f"  ✅ Posted to {group_name}")
                                    break
                            break
                        except Exception as e:
                            log_fn(f"  ⚠️ mouse click failed: {str(e)[:60]}")
                    
                    break  # Don't loop — we tried
            except Exception as e:
                log_fn(f"  ⚠️ Post button error: {str(e)[:60]}")

            await asyncio.sleep(2)

        if post_clicked:
            # After Post, attempt to verify the post is visible in the group feed.
            try:
                # Try to extract marketplace item id from the listing URL
                item_id = None
                try:
                    m = _re.search(r'marketplace/item/(\d+)', listing_url)
                    if m:
                        item_id = m.group(1)
                except Exception:
                    item_id = None

                log_fn("  🔎 Verifying post visibility in group feed...")
                # Open the group page
                try:
                    await page.goto(group.get('url'), wait_until='domcontentloaded', timeout=20000)
                except Exception:
                    # If navigation fails, just continue with the current page
                    pass
                await asyncio.sleep(4)

                found = False
                for vi in range(15):  # ~30s total
                    try:
                        if item_id:
                            selector = f'a[href*="marketplace/item/{item_id}"]'
                            exists = await page.evaluate(f"() => !!document.querySelector('{selector}')")
                            if exists:
                                found = True
                                log_fn(f"  ✅ Found marketplace link in group (item id={item_id})")
                                break

                        if listing_title:
                            # Look for the listing title text somewhere in the feed
                            found_title = await page.evaluate("(t) => {"
                                                           "const nodes = [...document.querySelectorAll('div')];"
                                                           "for (const n of nodes) { if ((n.textContent||'').toLowerCase().includes(t.toLowerCase())) return true; }"
                                                           "return false; }", listing_title[:80])
                            if found_title:
                                found = True
                                log_fn("  ✅ Found post text/title in group feed")
                                break
                    except Exception as e:
                        log_fn(f"  ⚠️ Verification eval error: {str(e)[:80]}")
                    await asyncio.sleep(2)

                if not found:
                    log_fn("  ⚠️ Post NOT found in group feed (may be pending/moderated or delayed)")
                # Continue regardless — treat click as success but note verification result
            except Exception as e:
                log_fn(f"  ⚠️ Verification failed: {str(e)[:80]}")

            return True
        else:
            log_fn(f"  ⚠️ Could not find Post button")
            await _debug_dialog_contents(page, log_fn, "no_post_btn")
            await _dump_page_debug(page, log_fn, "no_post_btn")
            for _ in range(3):
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.5)
            return False

    except Exception as e:
        log_fn(f"  ❌ Error: {str(e)[:120]}")
        for _ in range(3):
            try:
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.5)
            except Exception:
                break
        return False


async def run_full_post_job(car, selected_groups, job_id, mode="legacy"):
    """
    Full pipeline: Download images → Post to Marketplace → Share to groups.
    mode='marketplace': stops after Marketplace posting.
    mode='groups': natively posts to groups without touching Marketplace.
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

        # 2. Launch browser + inject cookies from fb_cookies.json
        log_fn("🌐 Launching browser...")

        # Load FB cookies from the same file the scraper uses
        FB_COOKIES_FILE = Path(__file__).resolve().parent.parent / "SimplyAPI" / "Funnels" / "fb_cookies.json"
        if not FB_COOKIES_FILE.exists():
            log_fn(f"❌ No Facebook cookies found at {FB_COOKIES_FILE}")
            log_fn("   Go to your CRM → Funnels → extract FB cookies first.")
            job["status"] = "error"
            job["finished_at"] = datetime.now().isoformat()
            return

        fb_cookies = json.loads(FB_COOKIES_FILE.read_text())
        cookie_names = [c.get("name") for c in fb_cookies]
        if "c_user" not in cookie_names or "xs" not in cookie_names:
            log_fn(f"❌ FB cookies file missing c_user/xs. Found: {cookie_names}")
            job["status"] = "error"
            job["finished_at"] = datetime.now().isoformat()
            return
        log_fn(f"  🍪 Loaded {len(fb_cookies)} FB cookies (c_user ✓, xs ✓)")

        from playwright.async_api import async_playwright
        import random as _rand
        async with async_playwright() as p:
            # Use persistent context with real Chrome — FB trusts this more
            context = await p.chromium.launch_persistent_context(
                str(PLAYWRIGHT_PROFILE_DIR),
                headless=False,
                channel="chrome",
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--no-first-run",
                    "--no-default-browser-check",
                ],
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 900},
                locale="es-CL",
                timezone_id="America/Santiago",
            )

            # Inject the saved FB cookies
            await context.add_cookies(fb_cookies)
            log_fn("  🍪 Cookies injected into browser context")

            page = context.pages[0] if context.pages else await context.new_page()

            # 3. Verify Facebook login
            log_fn("🔐 Verifying Facebook login...")
            await page.goto("https://www.facebook.com", wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(4)

            # Check URL-based redirect to login
            if "login" in page.url.lower() or "checkpoint" in page.url.lower():
                log_fn("❌ Facebook cookies are expired! Re-extract them in the CRM.")
                job["status"] = "error"
                job["finished_at"] = datetime.now().isoformat()
                await context.close()
                return

            # Also check if there's a login form on the page (login overlay)
            has_login = await page.evaluate("""() => {
                const inputs = [...document.querySelectorAll('input')];
                return inputs.some(i => i.name === 'email' || i.name === 'pass');
            }""")
            if has_login:
                log_fn("⚠️ Login overlay detected on facebook.com, trying to dismiss...")
                await page.keyboard.press("Escape")
                await asyncio.sleep(1)
                # Reload and check again
                await page.reload(wait_until="domcontentloaded")
                await asyncio.sleep(3)
                has_login = await page.evaluate("""() => {
                    const inputs = [...document.querySelectorAll('input')];
                    return inputs.some(i => i.name === 'email' || i.name === 'pass');
                }""")
                if has_login:
                    log_fn("❌ Cookies not working — login form still showing. Re-extract cookies.")
                    job["status"] = "error"
                    job["finished_at"] = datetime.now().isoformat()
                    await context.close()
                    return

            log_fn("✅ Facebook session active!")

            # Warmup: visit Marketplace main page first to establish session there
            log_fn("🔄 Warming up Marketplace session...")
            await page.goto("https://www.facebook.com/marketplace/", wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(3)

            # Save cookies back (merge new tokens with existing, don't overwrite)
            try:
                updated = await context.cookies(["https://www.facebook.com"])
                if updated:
                    # Merge: keep existing cookies, update with any new/refreshed ones
                    existing = json.loads(FB_COOKIES_FILE.read_text()) if FB_COOKIES_FILE.exists() else []
                    merged = {c["name"]: c for c in existing}
                    for c in updated:
                        merged[c["name"]] = c
                    FB_COOKIES_FILE.write_text(json.dumps(list(merged.values()), indent=2))
                    log_fn(f"  🍪 Merged {len(merged)} cookies back to file")
            except Exception:
                pass

            # 4. Post to Marketplace (only for marketplace or legacy mode)
            marketplace_url = "https://www.facebook.com/marketplace"
            if mode in ("marketplace", "legacy"):
                log_fn("🚗 Posting to Facebook Marketplace...")
                marketplace_url = await post_to_marketplace(page, car, image_paths, caption, title, price, log_fn) or marketplace_url

            job["result"] = {"marketplace_url": marketplace_url, "groups_posted": [], "groups_failed": []}

            # 5. Route by mode
            if mode == "marketplace":
                log_fn("\n✅ Marketplace-only mode — done! No group sharing.")
                await asyncio.sleep(5)

            elif mode == "groups" and selected_groups:
                # Groups-only: post directly to each group (no marketplace listing needed)
                log_fn(f"\n📢 Groups-only mode — posting to {len(selected_groups)} groups with photos...")
                import random
                for i, group in enumerate(selected_groups):
                    if job.get("cancelled"):
                        break
                    log_fn(f"\n── Group {i+1}/{len(selected_groups)} ──")
                    success = await post_to_group_native(page, group, car, image_paths, caption, log_fn)
                    if success:
                        job["result"]["groups_posted"].append(group["name"])
                    else:
                        job["result"]["groups_failed"].append(group["name"])
                    if i < len(selected_groups) - 1:
                        if job.get("cancelled"):
                            break
                        delay = random.randint(15, 45)
                        log_fn(f"  ⏳ Waiting {delay}s before next group...")
                        # Wait in 1-second chunks so we can cancel during the long sleep
                        for _ in range(delay):
                            if job.get("cancelled"):
                                break
                            await asyncio.sleep(1)

            elif selected_groups and mode == "legacy":
                # Legacy: posted to marketplace above, now share that listing URL to groups
                listing_url = await _find_listing_url(page, log_fn)
                if not listing_url:
                    log_fn("⚠️ Could not find individual listing URL, using fallback method for groups")
                    listing_url = marketplace_url

                job["result"]["listing_url"] = listing_url
                log_fn(f"\n📢 Sharing listing to {len(selected_groups)} groups...")
                log_fn(f"   🔗 Listing: {listing_url}")
                # Add random delays between group posts to avoid detection
                import random
                for i, group in enumerate(selected_groups):
                    log_fn(f"\n── Group {i+1}/{len(selected_groups)} ──")
                    success = await share_to_group(page, group, listing_url, caption, log_fn)
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

            # Wait before closing so last post's network request completes
            await asyncio.sleep(5)
            await context.close()

        # Cleanup temp images (keep the persistent profile!)
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

        job["status"] = "completed"
        job["finished_at"] = datetime.now().isoformat()

    except Exception as e:
        log_fn(f"💥 Error: {str(e)}")
        job["status"] = "error"
        job["finished_at"] = datetime.now().isoformat()


async def _fill_create_post_modal(page, image_paths, caption, log_fn):
    """Fill and submit an already-open 'Create post' dialog.
    Used when FB opens the composer automatically on group load.
    Steps: click photo icon → upload → type caption → click Post.
    """
    # Step 1: Click the photo/image icon in "Add to your post"
    log_fn("  📷 Adding photos via 'Add to your post'...")
    photo_added = False
    for photo_lbl in ["Photo/video", "Foto/vídeo", "Foto/video", "Photo", "Foto"]:
        try:
            btn = await page.query_selector(f'[aria-label="{photo_lbl}"]')
            if btn:
                await btn.click()
                await asyncio.sleep(1.5)
                photo_added = True
                break
        except Exception:
            pass

    # After clicking photo button, look for file input
    file_inputs = await page.query_selector_all('input[type="file"]')
    if file_inputs:
        uploaded = False
        for fi in file_inputs:
            try:
                multiple = await fi.get_attribute("multiple")
                if multiple is not None:
                    await fi.set_input_files(image_paths)
                    log_fn(f"  ✅ Uploaded {len(image_paths)} photos")
                    uploaded = True
                    break
            except Exception:
                continue
        if not uploaded:
            try:
                await file_inputs[0].set_input_files(image_paths[:1])
                log_fn("  ✅ Uploaded 1 photo (single-file fallback)")
                uploaded = True
            except Exception as e:
                log_fn(f"  ⚠️ Photo upload failed: {e}")
        if uploaded:
            await asyncio.sleep(3)
    else:
        log_fn("  ⚠️ No file input found — skipping photos")

    # Step 2: Type caption in the textbox
    log_fn("  📝 Writing caption...")
    try:
        # Find the main textbox inside the modal instead of the group wall
        # We look inside the dialog to avoid selecting a "Write a comment" box on someone else's post
        textbox = None
        dialog_textboxes = await page.query_selector_all('div[role="dialog"] [role="textbox"]')
        for tb in dialog_textboxes:
            if await tb.is_visible():
                textbox = tb
                break
                
        if not textbox:
            textbox = await page.query_selector('[aria-label="Create a public post..."]')
        if not textbox:
            textbox = await page.query_selector('[aria-label="Crea una publicación pública..."]')
        if textbox:
            await textbox.scroll_into_view_if_needed()
            await asyncio.sleep(0.3)
            try:
                await textbox.click()
            except Exception:
                await page.evaluate("el => el.click()", textbox)
            await asyncio.sleep(0.5)
            await textbox.type(caption, delay=10)
            log_fn("  ✅ Caption entered")
        else:
            log_fn("  ⚠️ Could not find textbox in modal")
    except Exception as e:
        log_fn(f"  ⚠️ Failed to write caption: {e}")

    await asyncio.sleep(2)

    # Step 3: Click Post button
    log_fn("  🚀 Submitting post...")
    for lbl in ["Post", "Publicar"]:
        try:
            post_btn = await page.query_selector(f'div[aria-label="{lbl}"][role="button"]')
            if not post_btn:
                post_btn = await page.query_selector(f'[aria-label="{lbl}"]')
            if not post_btn:
                loc = page.get_by_role("button", name=lbl)
                if await loc.count() > 0:
                    post_btn = await loc.first.element_handle()
            if post_btn:
                disabled_attr = await post_btn.get_attribute("aria-disabled")
                iters = 0
                while disabled_attr == "true" and iters < 15:
                    await asyncio.sleep(1)
                    disabled_attr = await post_btn.get_attribute("aria-disabled")
                    iters += 1
                await post_btn.click()
                log_fn("  ✅ Posted!")
                await asyncio.sleep(5)
                return True
        except Exception:
            pass

    log_fn("  ⚠️ Could not click Post button")
    return False


async def post_to_group_native(page, group, car, image_paths, caption, log_fn):
    """Post directly to a Facebook group.
    Handles THREE states the page can be in after loading:
      1. 'Create post' modal already open → type caption + add photos directly
      2. 'Sell Something' button visible (Buy & Sell group) → Vehicle listing flow
      3. 'Write something...' button visible (regular group) → open composer + photos
    """
    group_url = group["url"]
    log_fn(f"🚀 Navigating to group: {group['name']}...")
    # Check page is still alive before navigating — context can die after Buy & Sell submissions
    try:
        await page.evaluate("() => true")
    except Exception:
        log_fn("  ❌ Browser context closed — cannot continue")
        return False
    try:
        await page.goto(group_url, wait_until="domcontentloaded", timeout=25000)
        await asyncio.sleep(5)
    except Exception as e:
        log_fn(f"  ❌ Failed to load group: {e}")
        return False

    # ── State 1: 'Create post' modal is already open (check this FIRST) ──────
    create_post_open = await page.evaluate("""() => {
        // Check for an open dialog with 'Create post' title or 'Create a public post' placeholder
        const dialogs = document.querySelectorAll('[role="dialog"]');
        for (const d of dialogs) {
            const t = d.innerText || '';
            if (t.includes('Create post') || t.includes('Crear publicación') ||
                t.includes('Create a public post') || t.includes('Crea una publicación')) {
                return true;
            }
        }
        // Or check for visible textbox with that placeholder
        const boxes = document.querySelectorAll('[role="textbox"]');
        for (const b of boxes) {
            const ph = b.getAttribute('aria-placeholder') || b.getAttribute('placeholder') || b.innerText || '';
            if (ph.includes('public post') || ph.includes('publicación pública') ||
                ph.includes('Create a') || ph.includes('Crea una')) {
                return true;
            }
        }
        return false;
    }""")

    if create_post_open:
        log_fn("  📝 'Create post' modal already open — posting directly...")
        return await _fill_create_post_modal(page, image_paths, caption, log_fn)

    # ── State 2: 'Sell Something' button visible (Buy & Sell group) ───────────
    # Wait extra for page to fully render before scanning for the button
    await asyncio.sleep(2)

    sell_btn = None
    # Most reliable: get_by_role("button") with regex name match
    try:
        sell_loc = page.get_by_role("button", name=re.compile(r"Sell [Ss]omething|Vender algo", re.IGNORECASE))
        if await sell_loc.count() > 0:
            sell_btn = await sell_loc.first.element_handle()
    except Exception:
        pass

    if not sell_btn:
        for lbl in ["Sell Something", "Vender algo", "Sell something"]:
            try:
                sell_btn = await page.query_selector(f'[aria-label="{lbl}"]')
                if not sell_btn:
                    sell_btn = await page.query_selector(f'div[role="button"]:has-text("{lbl}")')
                if not sell_btn:
                    loc = page.get_by_text(lbl, exact=True)
                    if await loc.count() > 0:
                        sell_btn = await loc.first.element_handle()
                if sell_btn:
                    break
            except Exception:
                pass

    # ── BUY & SELL GROUP FLOW ───────────────────────────────────────────
    if sell_btn:
        log_fn("  🛒 Buy & Sell group — using 'Sell Something' flow...")
        await sell_btn.click()
        await asyncio.sleep(4)

        # 1. Select Vehicle category — FB shows "What are you selling?" cards
        log_fn("  🚗 Selecting Vehicle category...")
        vehicle_clicked = False

        vehicle_texts = [
            "Vehicle for sale", "Vehículo en venta",
            "Vehicles", "Vehículos", "Vehicle", "Vehículo",
            "Autos", "Auto",
        ]

        # get_by_text is the most flexible — checks visibility and partial match
        for cat_text in vehicle_texts:
            if vehicle_clicked:
                break
            try:
                loc = page.get_by_text(cat_text, exact=False)
                cnt = await loc.count()
                for i in range(min(cnt, 5)):
                    try:
                        el = loc.nth(i)
                        if await el.is_visible():
                            await el.click()
                            log_fn(f"  ✅ Vehicle category: '{cat_text}'")
                            vehicle_clicked = True
                            await asyncio.sleep(2)
                            break
                    except Exception:
                        continue
            except Exception:
                pass

        if not vehicle_clicked:
            # Fallback: try role-based selectors (radio/button/option/listitem)
            for role_name in ["radio", "button", "option", "listitem"]:
                if vehicle_clicked:
                    break
                for cat_text in vehicle_texts[:4]:
                    try:
                        loc = page.get_by_role(role_name, name=re.compile(cat_text, re.IGNORECASE))
                        if await loc.count() > 0:
                            await loc.first.click()
                            log_fn(f"  ✅ Vehicle category ({role_name}): '{cat_text}'")
                            vehicle_clicked = True
                            await asyncio.sleep(2)
                            break
                    except Exception:
                        pass

        if not vehicle_clicked:
            log_fn("  ❌ Could not select Vehicle category — marking group as FAILED")
            try:
                await page.keyboard.press("Escape")
            except Exception:
                pass
            return False

        # 1b. Select Vehicle Type toggle (Car/Truck) — shown at top of form right after
        #     "Vehicle for sale" is selected, before the Year/Make/Model fields appear.
        #     Quick search only — not all groups show this toggle, so don't block on it.
        log_fn("  🚙 Selecting Vehicle Type (Car/Truck)...")
        vtype_selected = False
        for vtype in ["Car/Truck", "Auto/Camioneta", "Car", "Auto"]:
            if vtype_selected:
                break
            try:
                loc = page.get_by_text(vtype, exact=True)
                if await loc.count() > 0:
                    for i in range(min(await loc.count(), 3)):
                        try:
                            el = loc.nth(i)
                            if await el.is_visible():
                                await el.click()
                                log_fn(f"  ✅ Vehicle Type: '{vtype}'")
                                vtype_selected = True
                                await asyncio.sleep(1.5)
                                break
                        except Exception:
                            continue
            except Exception:
                pass
        if not vtype_selected:
            # Try role-based (radio buttons)
            for vtype in ["Car/Truck", "Auto/Camioneta"]:
                try:
                    loc = page.get_by_role("radio", name=re.compile(vtype, re.IGNORECASE))
                    if await loc.count() > 0:
                        await loc.first.click()
                        log_fn(f"  ✅ Vehicle Type (radio): '{vtype}'")
                        vtype_selected = True
                        await asyncio.sleep(1.5)
                        break
                except Exception:
                    pass
        if not vtype_selected:
            log_fn("  ⚠️ Vehicle Type toggle not found on this group — continuing")

        # 2. Upload photos
        log_fn("  📷 Uploading photos...")
        file_inputs = await page.query_selector_all('input[type="file"]')
        if not file_inputs:
            for photo_lbl in ["Add photos", "Agregar fotos", "Add Photos", "Add Photo", "Agregar foto"]:
                try:
                    btn = await page.query_selector(f'[aria-label="{photo_lbl}"]')
                    if btn:
                        await btn.click()
                        await asyncio.sleep(1.5)
                        file_inputs = await page.query_selector_all('input[type="file"]')
                        if file_inputs:
                            break
                except Exception:
                    pass
        if file_inputs:
            uploaded = False
            for fi in file_inputs:
                try:
                    multiple = await fi.get_attribute("multiple")
                    if multiple is not None:
                        await fi.set_input_files(image_paths)
                        log_fn(f"  ✅ Uploaded {len(image_paths)} photos")
                        uploaded = True
                        break
                except Exception:
                    continue
            if not uploaded:
                for fi in file_inputs:
                    try:
                        await fi.set_input_files(image_paths[:1])
                        log_fn("  ✅ Uploaded 1 photo (single-file fallback)")
                        uploaded = True
                        break
                    except Exception:
                        continue
            if uploaded:
                await asyncio.sleep(3)
            else:
                log_fn("  ⚠️ Could not upload photos to any file input")

        # 3. Fill Vehicle Specifics (Year, Make, Model, Price)
        # Uses get_by_label() as primary strategy — FB forms associate fields via
        # <label> elements, not aria-label, so query_selector('[aria-label="Year"]') fails.
        car_year = str(car.get("car_year", ""))
        car_make = car.get("car_make", "")
        car_model = car.get("car_model", "")
        car_price = str(car.get("selling_price", ""))

        if not car_price:
            price_match = re.search(r'\$[\d\.]+', caption)
            car_price = price_match.group(0).replace('$', '').replace('.', '') if price_match else ""

        async def _fill_and_pick(label_texts, value, field_name, wait_after=0.5, pick_option=True):
            """Fill a field by label, then select from autocomplete if applicable."""
            if not value:
                return False
            val = str(value)
            trigger = None
            # 1. get_by_label (finds inputs associated via <label> elements)
            for lbl in label_texts:
                try:
                    loc = page.get_by_label(lbl, exact=False)
                    if await loc.count() > 0:
                        trigger = await loc.first.element_handle()
                        break
                except Exception:
                    pass
            # 2. aria-label fallback
            if not trigger:
                for lbl in label_texts:
                    try:
                        el = await page.query_selector(f'[aria-label="{lbl}"]')
                        if el:
                            trigger = el
                            break
                    except Exception:
                        pass
            # 3. placeholder fallback
            if not trigger:
                for lbl in label_texts:
                    try:
                        loc = page.get_by_placeholder(lbl, exact=False)
                        if await loc.count() > 0:
                            trigger = await loc.first.element_handle()
                            break
                    except Exception:
                        pass
            if not trigger:
                log_fn(f"  ⚠️ {field_name} field not found")
                return False
            try:
                await trigger.click(force=True)
                await asyncio.sleep(0.3)
                await page.keyboard.press("Meta+A")
                await page.keyboard.press("Control+A")
                await page.keyboard.press("Backspace")
                await trigger.type(val, delay=50)
                if pick_option:
                    await asyncio.sleep(1.5)
                    # Try to click the matching option from the autocomplete list
                    opt = page.get_by_role("option", name=re.compile(re.escape(val), re.IGNORECASE))
                    if await opt.count() > 0:
                        await opt.first.click()
                        log_fn(f"  ✅ {field_name}: '{val}' (dropdown)")
                    else:
                        # Fallback: keyboard nav
                        await page.keyboard.press("ArrowDown")
                        await asyncio.sleep(0.2)
                        await page.keyboard.press("Enter")
                        log_fn(f"  ✅ {field_name}: '{val}' (keyboard nav)")
                else:
                    log_fn(f"  ✅ {field_name}: '{val}'")
                await asyncio.sleep(wait_after)
                return True
            except Exception as e:
                log_fn(f"  ⚠️ Could not fill {field_name}: {e}")
                return False

        if car_year:
            log_fn(f"  📝 Filling Year: {car_year}...")
            await _fill_and_pick(["Year", "Año", "year", "año"], car_year, "Year", wait_after=0.5)

        if car_make:
            log_fn(f"  📝 Filling Make: {car_make}...")
            await _fill_and_pick(["Make", "Marca", "Vehicle make", "make", "marca"], car_make, "Make", wait_after=2.0)

        if car_model:
            log_fn(f"  📝 Filling Model: {car_model}...")
            await _fill_and_pick(["Model", "Modelo", "Vehicle model", "model", "modelo"], car_model, "Model", wait_after=0.5)

        if car_price:
            log_fn(f"  📝 Filling Price: {car_price}...")
            await _fill_and_pick(
                ["Price", "Precio", "Listing price", "Precio de publicación", "price", "precio"],
                car_price, "Price", pick_option=False
            )

        # 4. Fill description (avoid re-filling structured fields)
        log_fn("  📝 Writing description...")
        await asyncio.sleep(1)
        desc_filled = False
        for desc_sel in ['[aria-label="Description"]', '[aria-label="Descripción"]',
                         '[aria-label="Describe your vehicle"]', '[aria-label="Describe tu vehículo"]',
                         'textarea[placeholder*="escription"]', 'textarea[placeholder*="escripci"]']:
            try:
                el = await page.query_selector(desc_sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.3)
                    await el.type(caption[:500], delay=8)
                    log_fn("  ✅ Description written")
                    desc_filled = True
                    break
            except Exception:
                pass
        if not desc_filled:
            # Fallback: use the last visible textarea/textbox (description is usually last)
            try:
                all_inputs = await page.query_selector_all('textarea, [role="textbox"]')
                for inp in reversed(all_inputs):
                    try:
                        if await inp.is_visible():
                            await inp.click()
                            await asyncio.sleep(0.3)
                            await inp.type(caption[:500], delay=8)
                            log_fn("  ✅ Description written (fallback textbox)")
                            desc_filled = True
                            break
                    except Exception:
                        continue
            except Exception:
                pass

        # 5. Click Next (if present) → then Publish/List
        await asyncio.sleep(1)
        log_fn("  🚀 Submitting vehicle listing...")

        for btn_text in ["Next", "Siguiente"]:
            try:
                btn_loc = page.get_by_role("button", name=btn_text)
                if await btn_loc.count() > 0:
                    btn_el = await btn_loc.first.element_handle()
                    if await btn_el.get_attribute("aria-disabled") != "true":
                        await btn_el.click()
                        log_fn(f"  ✅ Clicked '{btn_text}'")
                        await asyncio.sleep(4)
                        break
            except Exception:
                pass

        published = False
        for btn_text in ["Publish", "Publicar", "List", "Listar"]:
            try:
                btn_loc = page.get_by_role("button", name=btn_text)
                if await btn_loc.count() > 0:
                    btn_el = await btn_loc.first.element_handle()
                    disabled = await btn_el.get_attribute("aria-disabled")
                    iters = 0
                    while disabled == "true" and iters < 10:
                        await asyncio.sleep(1)
                        disabled = await btn_el.get_attribute("aria-disabled")
                        iters += 1
                    await btn_el.click()
                    log_fn(f"  ✅ Clicked '{btn_text}'")
                    await asyncio.sleep(6)
                    published = True
                    break
            except Exception:
                pass

        # 6. Verify the listing was actually published
        if published:
            confirmed = False
            for phrase in ["Your listing", "Tu publicación", "published", "publicada",
                           "listing has been", "Listing published", "Your post", "Post shared"]:
                try:
                    if await page.get_by_text(phrase, exact=False).count() > 0:
                        log_fn(f"  ✅ CONFIRMED published ('{phrase}' found)")
                        confirmed = True
                        break
                except Exception:
                    pass
            if not confirmed:
                log_fn("  ⚠️ Publish clicked — could not find confirmation text, assuming success")
            # Navigate away from the listing confirmation page before returning.
            # This prevents FB's JS on the confirmation page from invalidating the
            # Playwright page context during the inter-group delay (browser crash fix).
            try:
                await page.goto("https://www.facebook.com/", wait_until="domcontentloaded", timeout=15000)
                await asyncio.sleep(2)
            except Exception:
                pass
            return True

        log_fn("  ❌ Could not click Publish/List — Buy & Sell post FAILED")
        return False

    # ── REGULAR GROUP FLOW ───────────────────────────────────────────────────
    log_fn("  💬 Regular group — using standard post composer...")

    write_btn = None
    for label in ["Write something...", "Write something", "Escribe algo...", "Escribe algo"]:
        try:
            write_btn = await page.query_selector(f'[aria-label="{label}"]')
            if not write_btn:
                write_btn = await page.query_selector(f'div[role="button"]:has-text("{label}")')
            if write_btn:
                break
        except Exception:
            pass

    if not write_btn:
        for tab in ["Discussion", "Conversación"]:
            try:
                tab_btn = await page.query_selector(f'[role="tab"]:has-text("{tab}")')
                if tab_btn:
                    await tab_btn.click()
                    await asyncio.sleep(3)
                    for label in ["Write something...", "Write something", "Escribe algo..."]:
                        write_btn = await page.query_selector(f'div[role="button"]:has-text("{label}")')
                        if write_btn:
                            break
                if write_btn:
                    break
            except Exception:
                pass

    if not write_btn:
        log_fn("  ⚠️ Could not find post composer (group may be restricted).")
        return False

    await write_btn.click()
    await asyncio.sleep(2)

    log_fn("  📷 Uploading photos...")
    file_inputs = await page.query_selector_all('input[type="file"]')
    if not file_inputs:
        for lbl in ["Photo/video", "Foto/vídeo", "Foto/video", "Add to your post"]:
            try:
                btn = await page.query_selector(f'[aria-label="{lbl}"]')
                if btn:
                    await btn.click()
                    await asyncio.sleep(1.5)
                    file_inputs = await page.query_selector_all('input[type="file"]')
                    if file_inputs:
                        break
            except Exception:
                pass

    if file_inputs:
        # Try to upload to a file input that accepts multiple files.
        # Fall back to single-file input if needed.
        uploaded = False
        for fi in file_inputs:
            try:
                multiple = await fi.get_attribute("multiple")
                if multiple is not None:
                    await fi.set_input_files(image_paths)
                    log_fn(f"  ✅ Uploaded {len(image_paths)} photos (multi-input)")
                    uploaded = True
                    break
            except Exception:
                continue
        if not uploaded:
            for fi in file_inputs:
                try:
                    await fi.set_input_files(image_paths[:1])  # single-file fallback
                    log_fn("  ✅ Uploaded 1 photo (single-file input fallback)")
                    uploaded = True
                    break
                except Exception:
                    continue
        if uploaded:
            await asyncio.sleep(3)
        else:
            log_fn("  ⚠️ Could not upload photos to any file input")

    log_fn("  📝 Writing caption...")
    try:
        textbox = None
        dialog_textboxes = await page.query_selector_all('div[role="dialog"] [role="textbox"]')
        for tb in dialog_textboxes:
            if await tb.is_visible():
                textbox = tb
                break
                
        if not textbox:
            textbox = await page.query_selector('[role="textbox"]')
            
        if textbox:
            # Scroll into view and use JS click to bypass overlay interception
            await textbox.scroll_into_view_if_needed()
            await asyncio.sleep(0.3)
            try:
                await textbox.click()
            except Exception:
                # Overlay is intercepting — use JS click
                await page.evaluate("el => el.click()", textbox)
            await asyncio.sleep(0.5)
            await textbox.type(caption, delay=10)
            log_fn("  ✅ Caption entered")
    except Exception as e:
        log_fn(f"  ⚠️ Failed to enter caption: {e}")

    await asyncio.sleep(2)

    log_fn("  🚀 Submitting group post...")
    for lbl in ["Post", "Publicar"]:
        try:
            post_btn = await page.query_selector(f'div[aria-label="{lbl}"][role="button"]')
            if not post_btn:
                post_btn = await page.query_selector(f'[aria-label="{lbl}"]')
            if post_btn:
                disabled_attr = await post_btn.get_attribute("aria-disabled")
                iters = 0
                while disabled_attr == "true" and iters < 15:
                    await asyncio.sleep(1)
                    disabled_attr = await post_btn.get_attribute("aria-disabled")
                    iters += 1
                await post_btn.click()
                log_fn("  ✅ Clicked Post")
                await asyncio.sleep(5)
                return True
        except Exception:
            pass

    return False


def start_post_job(car, selected_groups, mode="legacy"):
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
        loop.run_until_complete(run_full_post_job(car, selected_groups, job_id, mode=mode))
        loop.close()

    t = threading.Thread(target=run_in_thread, daemon=True)
    t.start()
    return job_id


# ─── Flask App ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/health")
def health():
    cookies_file = Path(__file__).resolve().parent.parent / "SimplyAPI" / "Funnels" / "fb_cookies.json"
    cookies_ok = False
    if cookies_file.exists():
        try:
            c = json.loads(cookies_file.read_text())
            names = [x.get("name") for x in c]
            cookies_ok = "c_user" in names and "xs" in names
        except Exception:
            pass
    return jsonify({"ok": True, "status": "running", "cookies_ready": cookies_ok})


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
        mode = data.get("mode", "legacy")

        # Override caption if provided
        if caption_override:
            car["_caption_override"] = caption_override
        if location_override:
            global FB_LOCATION
            FB_LOCATION = location_override

        job_id = start_post_job(car, selected_groups, mode=mode)

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
        mode = data.get("mode", "legacy")

        job_id = start_post_job(car, selected_groups, mode=mode)
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


@app.route("/api/job/<job_id>/cancel", methods=["POST"])
def api_cancel_job(job_id):
    """Cancel a running job."""
    job = jobs.get(job_id)
    if not job:
        return jsonify({"ok": False, "error": "Job not found"}), 404
    
    if job["status"] not in ["completed", "error", "cancelled"]:
        job["cancelled"] = True
        job["status"] = "cancelled"
        job["log"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 🛑 Job cancelled by user")
    
    return jsonify({"ok": True})


@app.route("/api/groups")
def api_groups():
    """Return list of configured groups."""
    return jsonify({"ok": True, "groups": FB_GROUPS})


@app.route("/api/test-share", methods=["POST"])
def api_test_share():
    """
    Test share-to-groups only (skip marketplace posting).
    Body: { "listing_url": "https://...", "groups": [0,1,2], "auto_find": true }
    groups = list of indices into FB_GROUPS (default: [0] = first group only)
    If auto_find=true, will navigate to your selling page and find the latest listing.
    """
    try:
        data = request.json or {}
        listing_url = data.get("listing_url", "")
        group_indices = data.get("groups", [0])
        auto_find = data.get("auto_find", False)
        
        if not listing_url and not auto_find:
            return jsonify({"ok": False, "error": "listing_url required (or set auto_find: true)"}), 400

        selected = [FB_GROUPS[i] for i in group_indices if i < len(FB_GROUPS)]
        if not selected:
            selected = [FB_GROUPS[0]]

        # If a listing_url is provided and it's not a Facebook URL, warn the caller
        note = None
        try:
            from urllib.parse import urlparse
            if listing_url:
                host = urlparse(listing_url).netloc or ''
                if 'facebook.com' not in host.lower():
                    note = f"Warning: provided listing_url is external ({host}). The bot will open it in the browser. To avoid this, set auto_find: true or provide a facebook.com listing URL."
        except Exception:
            note = None

        import uuid
        job_id = "tst-" + str(uuid.uuid4())[:6]
        jobs[job_id] = {
            "status": "queued",
            "log": [],
            "result": None,
            "car": f"TEST share → {len(selected)} groups",
            "started_at": datetime.now().isoformat(),
            "finished_at": None,
        }

        def run_test_share():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(_run_test_share(listing_url, selected, job_id))
            loop.close()

        t = threading.Thread(target=run_test_share, daemon=True)
        t.start()

        resp = {"ok": True, "job_id": job_id, "groups": [g["name"] for g in selected]}
        if note:
            resp["note"] = note
        return jsonify(resp)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


async def _run_test_share(listing_url, selected_groups, job_id):
    """Test share flow: open browser, inject cookies, share listing to groups."""
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

        FB_COOKIES_FILE = Path(__file__).resolve().parent.parent / "SimplyAPI" / "Funnels" / "fb_cookies.json"
        if not FB_COOKIES_FILE.exists():
            log_fn("❌ No FB cookies file!")
            job["status"] = "error"
            job["finished_at"] = datetime.now().isoformat()
            return

        fb_cookies = json.loads(FB_COOKIES_FILE.read_text())
        log_fn(f"🍪 Loaded {len(fb_cookies)} cookies")

        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            # Use persistent context with real Chrome — FB trusts this more than bare Chromium
            context = await p.chromium.launch_persistent_context(
                str(PLAYWRIGHT_PROFILE_DIR),
                headless=False,
                channel="chrome",
                args=["--disable-blink-features=AutomationControlled",
                      "--no-sandbox", "--no-first-run", "--no-default-browser-check"],
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 900},
                locale="es-CL",
                timezone_id="America/Santiago",
            )
            await context.add_cookies(fb_cookies)
            page = context.pages[0] if context.pages else await context.new_page()

            # Verify login
            await page.goto("https://www.facebook.com", wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)
            if "login" in page.url.lower():
                log_fn("❌ Not logged in!")
                job["status"] = "error"
                job["finished_at"] = datetime.now().isoformat()
                await context.close()
                return
            log_fn("✅ Facebook session active!")

            # Auto-find listing URL if not provided
            if not listing_url:
                log_fn("🔍 Auto-finding latest listing URL...")
                listing_url = await _find_listing_url(page, log_fn)
                if not listing_url:
                    log_fn("❌ Could not auto-find a listing URL")
                    job["status"] = "error"
                    job["finished_at"] = datetime.now().isoformat()
                    await context.close()
                    return
                log_fn(f"✅ Found listing: {listing_url}")

            caption = "🚗 Auto en venta"
            job["result"] = {"listing_url": listing_url, "groups_posted": [], "groups_failed": []}

            import random
            for i, group in enumerate(selected_groups):
                log_fn(f"\n── Group {i+1}/{len(selected_groups)} ──")
                success = await share_to_group(page, group, listing_url, caption, log_fn)
                if success:
                    job["result"]["groups_posted"].append(group["name"])
                else:
                    job["result"]["groups_failed"].append(group["name"])
                if i < len(selected_groups) - 1:
                    delay = random.randint(10, 25)
                    log_fn(f"  ⏳ Waiting {delay}s...")
                    await asyncio.sleep(delay)

            posted = len(job["result"]["groups_posted"])
            failed = len(job["result"]["groups_failed"])
            log_fn(f"\n✅ DONE! {posted} posted, {failed} failed")
            
            # Wait a bit before closing browser so the last post's network request completes
            await asyncio.sleep(5)
            await context.close()

        job["status"] = "completed"
        job["finished_at"] = datetime.now().isoformat()
    except Exception as e:
        log_fn(f"💥 Error: {str(e)}")
        job["status"] = "error"
        job["finished_at"] = datetime.now().isoformat()


@app.route("/api/login", methods=["POST"])
def api_login():
    """
    Open a Playwright browser so the user can log into Facebook manually.
    Saves cookies to fb_cookies.json for future use.
    """
    cookies_file = Path(__file__).resolve().parent.parent / "SimplyAPI" / "Funnels" / "fb_cookies.json"

    def _run_login():
        import asyncio as _aio
        loop = _aio.new_event_loop()
        _aio.set_event_loop(loop)
        loop.run_until_complete(_do_login())

    async def _do_login():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,
                args=["--disable-blink-features=AutomationControlled",
                      "--no-sandbox", "--no-first-run", "--no-default-browser-check"],
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 900},
                locale="es-CL",
                timezone_id="America/Santiago",
            )
            # Load existing cookies if any (might help skip some steps)
            if cookies_file.exists():
                try:
                    existing = json.loads(cookies_file.read_text())
                    if existing:
                        await context.add_cookies(existing)
                except Exception:
                    pass

            page = await context.new_page()
            await page.goto("https://www.facebook.com", wait_until="domcontentloaded")
            print("🔐 Login browser opened. Log into Facebook (dr.felipeyanez@gmail.com)...")
            print("   Waiting up to 180 seconds...")

            # Wait for user to log in (up to 180s)
            import asyncio
            logged_in = False
            for _ in range(90):
                await asyncio.sleep(2)
                url = page.url.lower()
                if "login" not in url and "checkpoint" not in url and "facebook.com" in url:
                    # Verify there's no login form on the page
                    has_login = await page.evaluate("""() => {
                        const inputs = [...document.querySelectorAll('input')];
                        return inputs.some(i => i.name === 'email' || i.name === 'pass');
                    }""")
                    if not has_login:
                        logged_in = True
                        break

            if logged_in:
                print("✅ Facebook login detected! Saving cookies...")
                cookies = await context.cookies(["https://www.facebook.com"])
                # Merge with existing to keep any extra cookies
                existing = []
                if cookies_file.exists():
                    try:
                        existing = json.loads(cookies_file.read_text())
                    except Exception:
                        pass
                merged = {c["name"]: c for c in existing}
                for c in cookies:
                    merged[c["name"]] = c
                cookies_file.write_text(json.dumps(list(merged.values()), indent=2))
                c_user = next((c["value"] for c in cookies if c["name"] == "c_user"), "?")
                print(f"✅ Saved {len(merged)} cookies (c_user={c_user})")
            else:
                print("⏰ Timed out waiting for login.")

            await context.close()

    t = threading.Thread(target=_run_login, daemon=True)
    t.start()
    return jsonify({"ok": True, "message": "🔐 Browser opened! Log into Facebook with dr.felipeyanez@gmail.com. Cookies will be saved automatically."})


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
            <span>Viña del Mar</span>
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
          lines.push('', '📍 Viña del Mar');
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
    app.run(host="0.0.0.0", port=5050, debug=False)
