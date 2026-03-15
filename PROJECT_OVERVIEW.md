# Autodirecto — Project Overview

> **Read this first.** This file explains the entire architecture, every folder, every system, every internal API, and how they connect. It exists so you (human or AI) can understand the full picture without reading every file.

---

## What Is Autodirecto?

**Autodirecto** is a car consignment platform for Chile. People who want to sell their car come to [autodirecto.cl](https://autodirecto.cl), schedule an appointment, get an AI-powered valuation, sign a consignment contract, and we sell the car for them.

The platform has **5 main systems** that work together:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             AUTODIRECTO                                 │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  Autodirecto  │    │   SimplyAPI   │    │    Mrcar     │               │
│  │  (Next.js)    │───▶│  (Flask API)  │◀───│  (Flask App) │               │
│  │  Public Site  │    │  THE BRAIN    │    │  AI Pricing  │               │
│  └──────────────┘    └──────┬───────┘    └──────────────┘               │
│                             │                                            │
│  ┌──────────────┐    ┌──────┴───────┐    ┌──────────────────────┐       │
│  │  Camera PWA   │───▶│   Supabase   │    │  ChileAutos API      │       │
│  │  (Vite/JS)    │    │ (PostgreSQL) │◀───│  (Global Inventory)  │       │
│  └──────────────┘    └──────────────┘    └──────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Live URLs

| System | URL | Repo |
|--------|-----|------|
| Public Site (Next.js) | [autodirecto.vercel.app](https://autodirecto.vercel.app) | `dryanez/autodirecto` |
| CRM Dashboard (Flask) | [autodirectocrm.vercel.app](https://autodirectocrm.vercel.app) | `dryanez/autodirectocrm` |
| Camera PWA | [cameracar.vercel.app](https://cameracar.vercel.app) | `dryanez/cameracar` |
| MrCar AI Pricing | [mrcar-cotizacion.vercel.app](https://mrcar-cotizacion.vercel.app) | — |
| Supabase | `kqympdxeszdyppbhtzbm.supabase.co` | — |

---

## Folder Structure

```
Autodirecto/                        ← Root (Next.js frontend repo: dryanez/autodirecto)
├── src/app/
│   ├── page.js                     ← Landing page (autodirecto.cl)
│   ├── consignacion/page.js        ← Multi-step consignment wizard
│   ├── agendarFotos/page.js        ← Photo scheduling
│   ├── catalogo/
│   │   ├── page.js                 ← Public car catalog (grid + filters)
│   │   └── [id]/page.js            ← Vehicle detail page (gallery, specs, credit sim)
│   ├── blog/, faq/, nosotros/, contacto/  ← Static pages
│   ├── components/
│   │   ├── AgendarWizard.js        ← Multi-step consignation wizard
│   │   ├── VehicleCard.js          ← Car card for catalog
│   │   ├── Navbar.js               ← Site navigation
│   │   └── Footer.js               ← Site footer
│   ├── robots.js                   ← SEO robots.txt
│   ├── sitemap.js                  ← SEO sitemap
│   └── api/                        ← Next.js API routes (proxies)
│       ├── mrcar/[...path]/        ← Proxy → MrCar API
│       ├── listings/route.js       ← Proxy → Supabase listings (normalizeRow)
│       ├── appointments/           ← Proxy → Supabase appointments
│       └── bridge/match/           ← Bridge: match buyer to car
├── src/lib/
│   ├── supabase.js                 ← Supabase client (anon + service role)
│   └── mockData.js                 ← Seed/mock data for dev
├── public/                         ← Static assets
│
├── SimplyAPI/                      ← THE BRAIN — Flask backend (separate repo: dryanez/autodirectocrm)
│   ├── app.py                      ← Main Flask app — ALL API routes (~5,500 lines)
│   ├── db.py                       ← Supabase adapter (SQL-like → REST API)
│   ├── templates/index.html        ← CRM Dashboard UI (~6,000 lines, Alpine.js)
│   ├── setup_chileautos.sql        ← DB migration: ChileAutos integration tables
│   ├── setup_storage.sql           ← DB migration: Storage buckets
│   ├── setup_crm.sql               ← DB migration: CRM tables
│   ├── setup_listings.sql          ← DB migration: Listings table
│   ├── setup_modules.sql           ← DB migration: Modules system
│   ├── Funnels/                    ← Facebook Marketplace lead scraping
│   ├── directives/                 ← SOP documents for AI agents
│   ├── execution/                  ← Deterministic scripts (DTE, inventory)
│   ├── credentials/                ← Digital certs (.pfx), CAF files (gitignored)
│   └── requirements.txt
│
├── Mrcar/                          ← MrCar — AI pricing engine
│
├── camera app/                     ← Camera PWA source (separate repo: dryanez/cameracar)
│   ├── web-deploy/                 ← Deployed Vite build
│   ├── ghost_overlay_cam/          ← Flutter app (Phase 2)
│   ├── OVERLAYS/                   ← Ghost wireframe PNG templates
│   ├── directives/                 ← SOPs for camera features
│   └── execution/                  ← Wireframe generation scripts
│
├── .env.local                      ← Next.js env vars
├── agent.md                        ← AI agent instructions
├── PROJECT_OVERVIEW.md             ← THIS FILE
└── README.md
```

---

## System 1: SimplyAPI (The Brain)

**Path:** `SimplyAPI/` (repo: `dryanez/autodirectocrm`)  
**Tech:** Python / Flask + Alpine.js frontend  
**Deployed on:** Vercel → `autodirectocrm.vercel.app`  
**Local dev:** `python app.py` → http://localhost:8080

SimplyAPI is the central backend AND the CRM dashboard. `app.py` (~5,500 lines) serves both the REST API and the single-page CRM UI (`templates/index.html`, ~6,000 lines built with Alpine.js + Tailwind CSS).

### Key Files

| File | Purpose |
|------|---------|
| `app.py` | Main Flask app — ALL API routes (~5,500 lines) |
| `templates/index.html` | CRM Dashboard — full SPA (~6,000 lines, Alpine.js + Tailwind) |
| `db.py` | Supabase adapter — translates SQL-like calls to REST API |
| `setup_chileautos.sql` | Migration: ChileAutos integration + settings + new columns |
| `setup_storage.sql` | Migration: Supabase storage buckets for photos |
| `setup_crm.sql` | Migration: CRM tables |
| `setup_listings.sql` | Migration: Listings table |
| `requirements.txt` | Python dependencies |
| `.env` | Environment vars (Supabase, Resend, Apify, etc.) |
| `Funnels/` | Facebook Marketplace lead scraping system |
| `directives/` | SOP documents for AI agents |
| `execution/` | Deterministic scripts (DTE, inventory) |
| `credentials/` | Digital certs (.pfx), CAF files (gitignored) |

### CRM Dashboard Views (index.html)

The CRM is a single-page app with these main views:

| View | Description |
|------|-------------|
| **📊 Dashboard** | Stats overview — total consignaciones, by status, recent activity |
| **📋 Consignaciones** | Kanban board — all consigned vehicles by status pipeline |
| **🚗 Inventario** | Vehicle detail management — ficha, inspección, docs, propietario, interesados tabs |
| **👥 Compradores** | Buyer Kanban — manage potential buyers, match to cars, credit sim |
| **📅 Calendario** | Appointment calendar with date navigation |
| **🔍 CRM Leads** | Lead pipeline — funnels import, lead stages, activity log |
| **⚙️ Ajustes** | Settings — WhatsApp number, ChileAutos credentials, connection test |

### API Routes (app.py)

#### Auth
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Login (returns session token) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user info |

#### Users
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/users` | List / create users |
| PATCH/DELETE | `/api/users/<id>` | Update / delete user |

#### Consignaciones (Core Business)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/consignaciones` | **Create consignación** (wizard → here) |
| GET | `/api/consignaciones` | List all consignaciones |
| GET | `/api/consignaciones/<id>` | Get single consignación |
| PATCH | `/api/consignaciones/<id>` | Update (status, fields, body_type, doors, etc.) |
| GET | `/api/consignaciones/<id>/photos` | Get consignación photos |
| POST | `/api/consignaciones/<id>/fotos` | Upload photos |
| POST | `/api/consignaciones/<id>/publicar` | Publish car to catalog (creates listing) |
| POST | `/api/consignaciones/<id>/promote` | Promote to inventory |
| GET | `/api/consignaciones/<id>/contrato` | Generate contract PDF |
| POST | `/api/consignaciones/<id>/contrato/firmar` | Client signs contract digitally |
| GET | `/api/consignaciones/<id>/contrato/descargar` | Download signed contract |
| POST | `/api/consignaciones/<id>/appraisal` | Link inspection to consignación |
| POST | `/api/consignaciones/<id>/publicar-chileautos` | **Publish to ChileAutos** |
| POST | `/api/consignaciones/<id>/despublicar-chileautos` | **Unpublish from ChileAutos** |

#### Inspecciones (Vehicle Inspections)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/inspecciones` | Create inspection report (saves to Supabase appraisals) |
| POST | `/api/inspecciones/fotos` | Upload inspection photos to Supabase Storage |
| GET | `/api/inspecciones/<id>` | Get inspection details |
| PATCH | `/api/inspecciones/<id>` | Update inspection |
| GET | `/api/inspecciones/<id>/pdf` | Generate inspection PDF (ReportLab) |
| POST | `/api/inspecciones/<id>/email` | Email inspection report to client (Resend) |

#### Calendar
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/calendar` | Get appointments (date range filter) |
| POST | `/api/calendar/assign` | Assign user to appointment |

#### CRM Leads
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/crm/leads` | List / create leads |
| GET/PATCH/DELETE | `/api/crm/leads/<id>` | Get / update / delete lead |
| GET/POST | `/api/crm/leads/<id>/activities` | Lead activity log |
| GET | `/api/crm/stats` | CRM pipeline stats |
| POST | `/api/crm/sync` | Sync CRM ↔ Supabase |
| POST | `/api/crm/import-funnels` | Import leads from Funnels |

#### Compradores (Buyers)
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/compradores` | List / create buyers |
| GET/PATCH/DELETE | `/api/compradores/<id>` | Get / update / delete |
| POST | `/api/compradores/<id>/simular-credito` | Simulate credit (CLP) |
| POST | `/api/compradores/<id>/match` | Match buyer to consigned car |
| GET | `/api/compradores/<id>/nota-compra` | Generate purchase order PDF |
| GET | `/api/compradores/<id>/nota-compra/descargar` | Download purchase order |

#### Listings
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/listings/<id>` | Get listing details |
| PATCH | `/api/listings/<id>` | Update listing |

#### Camera Jobs (Photo Sessions)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/camera-job` | Create camera job (generates token for PWA) |
| GET | `/api/camera-job/latest` | Get latest job for a consignación |
| GET | `/api/camera-job/<token>` | Get job by token |
| POST | `/api/camera-job/<token>/increment` | Increment photo count |
| DELETE | `/api/camera-job/<token>` | Delete job |
| DELETE | `/api/camera-job/purge` | Purge old jobs |

#### AI
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ai/generate-description` | Generate AI listing description (OpenAI) |

#### Modules & Companies (Multi-tenant)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/modules` | List available modules |
| PATCH | `/api/modules/<id>` | Update module |
| GET/POST | `/api/companies` | List / create companies |
| GET | `/api/companies/<id>/modules` | Get company modules |
| PATCH | `/api/companies/<id>/modules/<mid>` | Toggle module for company |

#### Settings
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/settings` | Get all CRM settings (key-value from `crm_settings`) |
| POST | `/api/settings` | Save settings (WhatsApp number, ChileAutos creds, etc.) |

#### ChileAutos Integration
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/chileautos/status` | Test connection + get active inventory count |
| POST | `/api/webhooks/chileautos-lead` | **Webhook**: receive buyer leads from ChileAutos |

#### Cars / Inventory (Legacy)
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/cars` | List / add cars |
| GET/PATCH/DELETE | `/api/cars/<id>` | Manage cars |
| POST | `/api/calculate` | Commission calculation |

#### DTE (Tax Documents)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/dte/generate/<id>` | Generate DTE JSON |
| POST | `/api/dte/simulate_send/<id>` | Send to SimpleAPI.cl |

#### Stats
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/stats` | Dashboard stats summary |

#### Funnels (mounted as Blueprint at `/funnels`)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/funnels/` | Funnels dashboard UI |
| GET | `/funnels/api/leads` | Get FB Marketplace leads |
| POST | `/funnels/api/reload` | Reload leads from JSON files |
| POST | `/funnels/api/scrape` | Trigger new Apify scrape |
| POST | `/funnels/api/leads/status` | Update lead status |
| POST | `/funnels/api/valuation` | **AI price valuation** (calls MrCar, saves to crm_leads) |

---

## System 2: Camera PWA

**Path:** `camera app/web-deploy/` (repo: `dryanez/cameracar`)  
**Tech:** Vite + vanilla JS (PWA)  
**Deployed on:** Vercel → [cameracar.vercel.app](https://cameracar.vercel.app)

A mobile-first Progressive Web App for standardized vehicle photography. Opens on the inspector's phone via a unique token URL, guides them through capturing photos with ghost wireframe overlays.

### How It Works
1. CRM creates a **camera job** → generates a unique token URL
2. Inspector opens `cameracar.vercel.app/?token=xxx` on phone
3. Camera opens with ghost wireframe overlay (semi-transparent car template)
4. Inspector aligns real car to template, captures each angle
5. Photos upload directly to **Supabase Storage** under the consignación's folder
6. CRM sees photos in real-time in the Inspección tab

### Architecture
```
┌─────────────────────────────────┐
│  Layer 3: Dynamic UI            │  ← Instructions, progress, buttons
├─────────────────────────────────┤
│  Layer 2: Ghost Wireframe (30%) │  ← Semi-transparent PNG template
├─────────────────────────────────┤
│  Layer 1: Live Camera Preview   │  ← Device camera feed
└─────────────────────────────────┘
```

---

## System 3: Mrcar (AI Pricing Engine)

**Path:** `Mrcar/`  
**Tech:** Python / Flask  
**Deployed on:** Vercel → [mrcar-cotizacion.vercel.app](https://mrcar-cotizacion.vercel.app)  
**Local dev:** `python app.py` → http://localhost:5000

Standalone app that calculates AI-powered car valuations for the Chilean market. Also has its own landing page (mrcar.cl).

### Key API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/vehicle/<plate>` | Look up vehicle by license plate |
| GET | `/api/market-price` | **Calculate AI market price** (make, model, year, km) |
| POST | `/api/submit-lead` | Submit a lead (from mrcar.cl form) |
| POST | `/api/schedule-appointment` | Schedule appointment from mrcar.cl |

### AI Price Response (from `/api/market-price`)
```json
{
  "success": true,
  "pricing": {
    "market_price": 19774000,
    "consignment_liquidation": 18715102,
    "immediate_offer": 10300000
  }
}
```

---

## System 4: Funnels (Facebook Lead Scraping)

**Path:** `SimplyAPI/Funnels/`  
**Tech:** Python, Apify (web scraping), JSON data files

Scrapes Facebook Marketplace listings in Chile, normalizes data, and presents it in a dashboard for lead review and AI valuation.

### How It Works
1. **Apify** scrapes FB Marketplace → saves JSON files to `Funnels/`
2. `Funnels/dashboard/app.py` loads and normalizes JSON files
3. Dashboard shows leads in a table with status tracking
4. Clicking **"Tasar con IA"** calls MrCar API → saves `ai_consignacion_price` to `crm_leads`
5. Leads can be imported into the CRM pipeline

---

## System 5: ChileAutos Integration

**Tech:** ChileAutos Global Inventory REST API (OAuth2)  
**Status:** Built, using staging credentials (production requires contacting `soporte@chileautos.cl`)

Publishes vehicles from the CRM directly to [ChileAutos.cl](https://www.chileautos.cl), Chile's largest car marketplace, and receives buyer leads back into the CRM.

### How It Works

```
CRM (SimplyAPI)                    ChileAutos API
    │                                    │
    ├── Publish ──────────────────────▶  PUT /v1/vehicles/{GUID}
    │   (builds payload: photos,         │
    │    specs, price, attributes)       │
    │                                    │
    ├── Unpublish ────────────────────▶  DELETE /v1/vehicles/{GUID}
    │   (auto on sold/cancelled)         │
    │                                    │
    ◀── Receive Leads ◀──────────────── POST /api/webhooks/chileautos-lead
        (auto-creates Comprador,         │
         matches to inventory,           │
         color-coded source badge)       │
```

### Key Details
- **OAuth2 Token Flow**: `POST https://id.s.core.csnglobal.net/connect/token` (client_credentials)
- **Staging Base**: `http://globalinventory-publicapi.stg.core.csnglobal.net/v1/`
- **Production Base**: `https://globalinventory-publicapi.core.csnglobal.net/v1/`
- **Token caching** with 60-second expiry buffer
- **Payload builder** maps CRM data to ChileAutos format:
  - Vehicle specs → `Specification.Attributes` (body type, doors, fuel, transmission, motor)
  - CRM features → `Equipamiento` group attributes (`aireAcondicionado` → `"SI"`)
  - Photos → `Media.Photos` array
  - WhatsApp → `ExtendedProperties`
- **Auto-unpublish**: When consignación status → `vendida` or `cancelada`, automatically DELETEs from ChileAutos
- **Lead webhook**: Creates Comprador with `source='chileautos'`, orange badge in Kanban, auto-matches to inventory by plate/chileautos_id

### CRM Settings Panel (⚙️ Ajustes)
- WhatsApp business number (configurable)
- ChileAutos client_id, client_secret, seller_id
- Environment toggle (staging / production)
- Connection test button
- Webhook URL display with copy button

### Staging Test Credentials
| Setting | Value |
|---------|-------|
| Client ID | `464f4235-8052-4832-a5ea-6738021263fe` |
| Client Secret | `Cen/5ic8fYtGbHMD4lU8VYHZ5/sJsU/N4qrl9V2DIzU=` |
| Seller ID | `4AA0C7A3-DE66-4F21-91E8-84CA5CD8C6F4` |
| Environment | `staging` |

---

## Database

All data lives in **Supabase (PostgreSQL)** at `kqympdxeszdyppbhtzbm.supabase.co`. `db.py` is a compatibility layer that takes SQL-like `.execute()` calls and translates them into Supabase REST API requests.

### Key Tables
| Table | Purpose |
|-------|---------|
| `consignaciones` | Consigned cars — the core entity. Includes `body_type`, `doors`, `fuel_type`, `transmission`, `motor`, `chileautos_id` |
| `listings` | Published catalog listings. Includes `body_type`, `doors`, `chileautos_id`, `chileautos_status` |
| `crm_leads` | All leads (funnels, manual, website) |
| `crm_lead_activities` | Activity log per lead |
| `compradores` | Potential buyers. Includes `source` (manual / chileautos) |
| `appointments` | Calendar appointments |
| `appraisals` | Vehicle inspection reports. Includes `vehicle_body_type`, `vehicle_doors` |
| `cars` | Legacy car inventory |
| `users` | Admin users |
| `crm_settings` | Key-value settings (WhatsApp, ChileAutos creds, etc.) |
| `camera_jobs` | Photo session tokens linking CRM to Camera PWA |
| `modules` | Available system modules |
| `companies` | Multi-tenant companies |
| `company_modules` | Module assignments per company |

### Important CRM Lead Columns
| Column | Purpose |
|--------|---------|
| `ai_consignacion_price` | AI-calculated consignment price |
| `ai_instant_buy_price` | AI-calculated instant buy price |
| `estimated_value` | Market value estimate |
| `listing_price` | Original FB listing price |
| `source` | Origin: `funnels`, `manual`, `website` |

### SQL Migrations
Run these in Supabase SQL Editor in order:
1. `setup_crm.sql` — CRM tables, leads, activities
2. `setup_listings.sql` — Listings table
3. `setup_storage.sql` — Storage buckets for photos
4. `setup_modules.sql` — Modules system
5. `setup_chileautos.sql` — ChileAutos integration: `crm_settings` table, new columns on `consignaciones`, `listings`, `compradores`, `appraisals`

---

## The Main Business Flow

```
1. LEAD ACQUISITION
   ├── Facebook Marketplace → Apify scraper → Funnels dashboard
   ├── mrcar.cl direct submission
   ├── autodirecto.cl wizard (manual entry)
   └── ChileAutos buyer leads → webhook → auto-created Compradores

2. AI VALUATION (Funnels Dashboard)
   └── Click "Tasar con IA" → calls MrCar /api/market-price
       → saves ai_consignacion_price + ai_instant_buy_price to crm_leads

3. CONSIGNATION WIZARD (autodirecto.cl/consignacion)
   ├── User enters car info (plate → auto-fills make/model/year)
   ├── Backend tries to match with existing funnels lead (by make+model+year, plate, RUT, phone)
   │   ├── MATCH FOUND + has AI price → uses saved price (NO recalculation!)
   │   │   └── Updates CRM lead to stage=agendado + fills all owner fields
   │   └── NO MATCH → creates brand new CRM lead (source=web_wizard), no AI price
   ├── User fills personal info (name, RUT, phone, address)
   └── Consignación created in DB

4. BIDIRECTIONAL SYNC (automatic, always on)
   ├── Edit owner info in Consignación → auto-pushes to matching CRM lead
   └── Edit owner info in CRM lead → auto-pushes to matching consignación

5. INSPECTION & CONTRACT
   ├── Inspector opens Camera PWA via token link → guided photo capture
   ├── Vehicle inspection form (body type, doors, fuel, transmission, features, etc.)
   ├── Inspection PDF generated (ReportLab) → emailed to client (Resend)
   ├── Contract PDF generated with AI price as selling_price
   ├── Client signs digitally (touch signature)
   └── Car published to catalog

6. PUBLISHING
   ├── "Publicar en Web" → creates listing in Supabase → visible on autodirecto.cl/catalogo
   ├── After web publish → popup: "¿Publicar también en ChileAutos?"
   ├── "Publicar en ChileAutos" → OAuth2 token → PUT to ChileAutos Global Inventory API
   └── Auto-unpublish from ChileAutos when sold/cancelled

7. SALE
   ├── Buyer found (manual or ChileAutos lead) → credit simulation → purchase order
   ├── Buyer matched to consigned car
   └── DTE (electronic tax document) generated via SimpleAPI.cl
```

---

## Environment Variables

### Next.js (`.env.local`)
| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (server-side) |
| `SIMPLYAPI_URL` | URL to SimplyAPI backend |

### SimplyAPI (`.env`)
| Var | Purpose |
|-----|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SIMPLEAPI_TOKEN` | SimpleAPI.cl DTE token |
| `RESEND_API_KEY` | Email sending (Resend) |
| `APIFY_TOKEN` | Apify scraping token |
| `MRCAR_API_URL` | MrCar API base URL |
| `OPENAI_API_KEY` | OpenAI for AI description generation |

*Note: ChileAutos credentials are stored in the `crm_settings` table, not env vars, so they can be changed from the CRM UI.*

---

## How to Run Locally

```bash
# 1. SimplyAPI (the brain) — Terminal 1
cd SimplyAPI
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py   # → http://localhost:8080

# 2. Next.js frontend — Terminal 2
npm install
npm run dev     # → http://localhost:3000

# 3. MrCar (optional, usually use deployed version)
cd Mrcar
python app.py   # → http://localhost:5000

# 4. Camera PWA (optional, usually use deployed version)
cd "camera app/web-deploy"
npm run dev     # → http://localhost:5173
```

---

## Deployment

| System | Platform | URL |
|--------|----------|-----|
| Public Site (Next.js) | Vercel | autodirecto.vercel.app / autodirecto.cl |
| **CRM (SimplyAPI + Flask)** | **Vercel** | **autodirectocrm.vercel.app** |
| Camera PWA | Vercel | cameracar.vercel.app |
| MrCar (Flask) | Vercel | mrcar-cotizacion.vercel.app |
| Database | Supabase | kqympdxeszdyppbhtzbm.supabase.co |
| Funnels Scraper (Playwright) | Railway | autodirecto-production.up.railway.app |
| CAV Worker (Playwright) | Railway | cav-worker-production.up.railway.app |

> **IMPORTANT:** The CRM backend (SimplyAPI) is deployed on **Vercel** via `vercel.json`.
> Railway is used **only** for long-running Playwright workers (Funnels scraper, CAV Worker)
> that need a persistent container. When running on Vercel, SimplyAPI proxies scrape requests
> to the Railway Funnels worker via `RAILWAY_URL` env var.

---

## Key Design Decisions

1. **db.py adapter**: We use Supabase but `app.py` writes SQL-like queries. `db.py` translates them to Supabase REST calls. This avoids a full rewrite.

2. **AI price is saved, not recalculated**: When "Tasar con IA" is clicked in Funnels, the price is saved to `crm_leads.ai_consignacion_price`. When the wizard matches a lead, it uses the saved price. No redundant MrCar API calls.

3. **Bidirectional sync between CRM leads and consignaciones**: Any change to owner info (name, phone, email, RUT, address) in either the CRM lead or the consignación is automatically pushed to the other. Matching is done by: Supabase ID → plate → RUT → phone. Functions: `_sync_crm_lead_owner_details()` (consig→CRM) and `_sync_consignacion_from_crm_lead()` (CRM→consig).

4. **Next.js API routes are proxies**: The frontend API routes (`/api/mrcar/*`, `/api/listings`) just proxy requests. No business logic in Next.js — `normalizeRow()` in listings is the only transformation.

5. **3-layer architecture**: Directives (SOPs) → Orchestration (AI) → Execution (Python scripts). See `agent.md`.

6. **Contract PDF**: Generated server-side in `app.py` using ReportLab, digitally signed with `.pfx` certificate, stored in Supabase Storage.

7. **Camera PWA uses token-based auth**: No login needed. CRM generates a unique token → inspector opens URL with token → photos go straight to Supabase Storage under the correct consignación folder.

8. **ChileAutos creds in DB, not env vars**: Stored in `crm_settings` table so they can be changed from the CRM Ajustes panel without redeploying.

9. **CRM is a single HTML file**: `templates/index.html` (~6,000 lines) is the entire CRM dashboard — Alpine.js for reactivity, Tailwind CSS via CDN, Phosphor icons. No build step needed.

10. **WhatsApp integration**: Every vehicle detail page and buyer contact uses WhatsApp deep links. The business number is configurable in Settings.

---

*Last updated: 24 February 2026*
