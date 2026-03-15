'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ── Helpers ──────────────────────────────────────────────────
function formatPrice(n) {
  if (!n) return '';
  return '$' + Number(n).toLocaleString('es-CL');
}
function formatKm(n) {
  if (!n && n !== 0) return '';
  return Number(n).toLocaleString('es-CL') + ' km';
}

const LOGO_KEY = 'overlay_pro_logo';
const OVERLAY_SETTINGS_KEY = 'overlay_pro_settings';

// ── Default overlay settings ─────────────────────────────────
const DEFAULT_SETTINGS = {
  showPrice: true,
  showKm: true,
  showYear: true,
  gradientColor1: '#0a0e1a',
  gradientColor2: '#1d4ed8',
  gradientOpacity: 0.85,
  logoScale: 0.18,        // % of canvas width
  logoPosition: 'top-left', // top-left | top-right | bottom-left | bottom-right
  textPosition: 'bottom',  // bottom | top
  fontFamily: 'Outfit',
};

// ── Car selector ─────────────────────────────────────────────
function CarSelector({ listings, selected, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = listings.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.brand?.toLowerCase().includes(s) ||
      l.model?.toLowerCase().includes(s) ||
      String(l.year).includes(s) ||
      l.plate?.toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#4b5563' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar vehículo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '0.5rem 0.75rem 0.5rem 2rem',
              color: '#e5e7eb', fontSize: '0.8rem', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
            Sin vehículos
          </div>
        ) : (
          filtered.map(l => (
            <button
              key={l.id}
              onClick={() => onSelect(l)}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 0.85rem',
                background: selected?.id === l.id ? 'rgba(37,99,235,0.18)' : 'transparent',
                borderLeft: selected?.id === l.id ? '3px solid #3b82f6' : '3px solid transparent',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'background 0.15s',
                display: 'flex', gap: '0.65rem', alignItems: 'center',
                color: '#e5e7eb',
              }}
              onMouseEnter={e => { if (selected?.id !== l.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (selected?.id !== l.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Thumb */}
              <div style={{
                width: '48px', height: '36px', borderRadius: '6px', overflow: 'hidden',
                flexShrink: 0, background: '#1a1f35',
              }}>
                {l.image_urls?.[0] && (
                  <img src={l.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8rem', fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {l.brand} {l.model}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6b7280', display: 'flex', gap: '0.5rem' }}>
                  <span>{l.year}</span>
                  <span>•</span>
                  <span>{formatKm(l.mileage_km)}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', flexShrink: 0 }}>
                {formatPrice(l.price)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Photo picker (social/vertical photos) ────────────────────
function PhotoPicker({ photos, selected, onSelect }) {
  if (!photos || photos.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        color: '#4b5563', padding: '2rem',
      }}>
        <div style={{ fontSize: '2.5rem' }}>📷</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
          Sin fotos verticales (Social)
        </div>
        <div style={{ fontSize: '0.72rem', color: '#4b5563', textAlign: 'center', lineHeight: 1.5 }}>
          Sube fotos en formato vertical (portrait) desde el inventario.<br />
          Se etiquetan automáticamente como &quot;social&quot;.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '0.6rem', padding: '0.75rem',
      overflowY: 'auto',
    }}>
      {photos.map((p, i) => (
        <button
          key={p.id || i}
          onClick={() => onSelect(p)}
          style={{
            border: selected?.url === p.url
              ? '2px solid #3b82f6'
              : '2px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
            background: '#0d1220', padding: 0,
            aspectRatio: '9/16',
            position: 'relative',
            transition: 'border 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <img
            src={p.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {selected?.url === p.url && (
            <div style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#3b82f6', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.7rem', color: '#fff',
            }}>
              ✓
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Logo setup modal ─────────────────────────────────────────
function LogoSetup({ onSave, onClose, currentLogo }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(currentLogo || null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#111827', borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '2rem', width: '380px', maxWidth: '90vw',
      }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
          📸 Configurar Logo
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Sube el logo de tu empresa. Se guardará localmente y se usará en todos los overlays.
          Ideal: PNG transparente, cuadrado.
        </p>

        {/* Preview */}
        <div style={{
          width: '120px', height: '120px', margin: '0 auto 1rem',
          borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer',
        }}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '2rem' }}>🖼️</span>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (preview) onSave(preview); }}
            disabled={!preview}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
              background: preview ? '#3b82f6' : '#1e293b', color: '#fff',
              fontSize: '0.8rem', fontWeight: 600, cursor: preview ? 'pointer' : 'not-allowed',
              opacity: preview ? 1 : 0.5,
            }}
          >
            Guardar Logo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Canvas Overlay Editor ────────────────────────────────────
function OverlayEditor({ photo, listing, logo, settings, onBack }) {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;

    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw photo full bleed
      const imgAspect = img.width / img.height;
      const canvasAspect = W / H;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgAspect > canvasAspect) {
        sw = img.height * canvasAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasAspect;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      // ── Bottom gradient strip ──
      const gradH = H * 0.32;
      const gradY = settings.textPosition === 'top' ? 0 : H - gradH;
      const grad = ctx.createLinearGradient(0, settings.textPosition === 'top' ? 0 : H, 0, settings.textPosition === 'top' ? gradH : H - gradH);
      grad.addColorStop(0, hexToRgba(settings.gradientColor1, settings.gradientOpacity));
      grad.addColorStop(1, hexToRgba(settings.gradientColor1, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, gradY, W, gradH);

      // ── Car info text ──
      const textBaseY = settings.textPosition === 'top' ? 160 : H - 140;
      const textDir = settings.textPosition === 'top' ? 1 : -1;

      // Title: Brand Model
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 54px ${settings.fontFamily}, sans-serif`;
      ctx.textAlign = 'left';
      const title = `${listing.brand || ''} ${listing.model || ''}`.trim();
      ctx.fillText(title, 60, textBaseY);

      // Subtitle line: Year • Km • Fuel
      const parts = [];
      if (settings.showYear && listing.year) parts.push(String(listing.year));
      if (settings.showKm && listing.mileage_km) parts.push(formatKm(listing.mileage_km));
      if (listing.fuel_type) parts.push(listing.fuel_type);
      if (listing.transmission) parts.push(listing.transmission);

      if (parts.length) {
        ctx.font = `500 32px ${settings.fontFamily}, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(parts.join('  •  '), 60, textBaseY + 50 * textDir);
      }

      // Price
      if (settings.showPrice && listing.price) {
        ctx.font = `800 48px ${settings.fontFamily}, sans-serif`;
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(formatPrice(listing.price), 60, textBaseY + 110 * textDir);
      }

      // ── Logo ──
      if (logo) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const logoW = W * settings.logoScale;
          const logoH = (logoImg.height / logoImg.width) * logoW;
          let lx = 0, ly = 0;

          switch (settings.logoPosition) {
            case 'top-left':     lx = 40; ly = 40; break;
            case 'top-right':    lx = W - logoW - 40; ly = 40; break;
            case 'bottom-left':  lx = 40; ly = H - logoH - 40; break;
            case 'bottom-right': lx = W - logoW - 40; ly = H - logoH - 40; break;
            default:             lx = 40; ly = 40;
          }

          ctx.drawImage(logoImg, lx, ly, logoW, logoH);
        };
        logoImg.src = logo;
      }
    };
    img.src = photo.url;
  }, [photo, listing, logo, settings]);

  useEffect(() => { draw(); }, [draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    setTimeout(() => {
      const link = document.createElement('a');
      const name = `${listing.brand}_${listing.model}_${listing.year}_social`.replace(/\s+/g, '_');
      link.download = `${name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setRendering(false);
    }, 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        padding: '0.6rem 1rem',
        background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.3rem 0.7rem', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Volver
        </button>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', flex: 1 }}>
          {listing.brand} {listing.model} {listing.year}
        </span>
        <button
          onClick={handleDownload}
          disabled={rendering}
          style={{
            padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #e1306c, #c13584)',
            color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            opacity: rendering ? 0.6 : 1,
          }}
        >
          📥 Descargar 1080×1920
        </button>
      </div>

      {/* Canvas preview */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'auto', padding: '1rem',
        background: 'repeating-conic-gradient(#1a1f35 0% 25%, #0d1220 0% 50%) 50% / 20px 20px',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            maxHeight: '100%', maxWidth: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        />
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Main Dashboard ───────────────────────────────────────────
export default function InstagramOverlayDashboard() {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [socialPhotos, setSocialPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [logo, setLogo] = useState(null);
  const [showLogoSetup, setShowLogoSetup] = useState(false);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  // Load logo & settings from localStorage
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem(LOGO_KEY);
      if (savedLogo) setLogo(savedLogo);
      else setShowLogoSetup(true); // First time → show logo setup

      const savedSettings = localStorage.getItem(OVERLAY_SETTINGS_KEY);
      if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    } catch {}
  }, []);

  // Load listings
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, brand, model, year, price, mileage_km, fuel_type, transmission, color, plate, body_type, image_urls, appraisal_id, status')
          .eq('status', 'disponible')
          .order('created_at', { ascending: false });

        if (error) console.error('listings error:', error);
        setListings(data || []);
      } catch (e) {
        console.error('listings fetch error:', e);
      }
      setLoading(false);
    })();
  }, []);

  // Load social photos when a listing is selected
  const loadSocialPhotos = useCallback(async (listing) => {
    if (!listing?.appraisal_id) {
      setSocialPhotos([]);
      return;
    }
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_images')
        .select('id, url, photo_type, created_at')
        .eq('appraisal_id', listing.appraisal_id)
        .eq('photo_type', 'social')
        .order('created_at', { ascending: true });

      if (error) console.error('social photos error:', error);
      setSocialPhotos(data || []);
    } catch (e) {
      console.error('photos fetch error:', e);
    }
    setLoadingPhotos(false);
  }, []);

  const handleSelectListing = (l) => {
    setSelectedListing(l);
    setSelectedPhoto(null);
    setEditing(false);
    loadSocialPhotos(l);
  };

  const handleSaveLogo = (dataUrl) => {
    localStorage.setItem(LOGO_KEY, dataUrl);
    setLogo(dataUrl);
    setShowLogoSetup(false);
  };

  const handleStartEditing = () => {
    if (selectedPhoto && selectedListing) {
      setEditing(true);
    }
  };

  const handleUpdateSetting = (key, val) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem(OVERLAY_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Render ──
  const sidebarW = '280px';

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      background: '#0a0e1a', fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#e5e7eb', minHeight: 0,
    }}>

      {/* Logo setup modal */}
      {showLogoSetup && (
        <LogoSetup
          currentLogo={logo}
          onSave={handleSaveLogo}
          onClose={() => { if (logo) setShowLogoSetup(false); }}
        />
      )}

      {/* ══ LEFT SIDEBAR — Car list ══════════════════════════════ */}
      <div style={{
        width: sidebarW, minWidth: sidebarW, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        background: '#0d1220',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(225,48,108,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #e1306c, #c13584, #833ab4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>
              📸
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Overlay Pro</div>
              <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Marketing · Instagram</div>
            </div>
          </div>

          {/* Logo & Settings buttons */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setShowLogoSetup(true)}
              style={{
                flex: 1, padding: '0.3rem 0.5rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: logo ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.12)',
                color: logo ? '#60a5fa' : '#fca5a5',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center',
              }}
            >
              {logo ? '✓ Logo' : '⚠ Logo'}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                flex: 1, padding: '0.3rem 0.5rem', borderRadius: '8px',
                border: `1px solid ${showSettings ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                background: showSettings ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                color: showSettings ? '#60a5fa' : '#9ca3af',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              ⚙ Ajustes
            </button>
          </div>
        </div>

        {/* Settings panel (collapsible) */}
        {showSettings && (
          <div style={{
            padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)', fontSize: '0.72rem', color: '#9ca3af',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
          }}>
            {/* Show price */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.showPrice}
                onChange={e => handleUpdateSetting('showPrice', e.target.checked)}
                style={{ accentColor: '#3b82f6' }}
              />
              Mostrar precio
            </label>
            {/* Show km */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.showKm}
                onChange={e => handleUpdateSetting('showKm', e.target.checked)}
                style={{ accentColor: '#3b82f6' }}
              />
              Mostrar kilómetros
            </label>
            {/* Show year */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.showYear}
                onChange={e => handleUpdateSetting('showYear', e.target.checked)}
                style={{ accentColor: '#3b82f6' }}
              />
              Mostrar año
            </label>
            {/* Gradient color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Color gradiente</span>
              <input type="color" value={settings.gradientColor1}
                onChange={e => handleUpdateSetting('gradientColor1', e.target.value)}
                style={{ width: '28px', height: '22px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              />
            </div>
            {/* Logo position */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span>Posición logo</span>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                  <button
                    key={pos}
                    onClick={() => handleUpdateSetting('logoPosition', pos)}
                    style={{
                      padding: '0.2rem 0.45rem', borderRadius: '6px',
                      border: `1px solid ${settings.logoPosition === pos ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                      background: settings.logoPosition === pos ? 'rgba(59,130,246,0.2)' : 'transparent',
                      color: settings.logoPosition === pos ? '#60a5fa' : '#6b7280',
                      fontSize: '0.62rem', cursor: 'pointer',
                    }}
                  >
                    {pos === 'top-left' ? '↖ Arriba Izq' :
                     pos === 'top-right' ? '↗ Arriba Der' :
                     pos === 'bottom-left' ? '↙ Abajo Izq' : '↘ Abajo Der'}
                  </button>
                ))}
              </div>
            </div>
            {/* Text position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Texto en</span>
              <select
                value={settings.textPosition}
                onChange={e => handleUpdateSetting('textPosition', e.target.value)}
                style={{
                  background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px', padding: '0.2rem 0.4rem', color: '#e5e7eb',
                  fontSize: '0.7rem', outline: 'none',
                }}
              >
                <option value="bottom">Abajo</option>
                <option value="top">Arriba</option>
              </select>
            </div>
            {/* Logo scale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Tamaño logo</span>
              <input
                type="range" min="0.08" max="0.35" step="0.01"
                value={settings.logoScale}
                onChange={e => handleUpdateSetting('logoScale', parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>
                {Math.round(settings.logoScale * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{
          padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: '0.5rem',
        }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
            padding: '0.3rem 0.4rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa' }}>{listings.length}</div>
            <div style={{ fontSize: '0.58rem', color: '#6b7280', textTransform: 'uppercase' }}>Vehículos</div>
          </div>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
            padding: '0.3rem 0.4rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e1306c' }}>{socialPhotos.length}</div>
            <div style={{ fontSize: '0.58rem', color: '#6b7280', textTransform: 'uppercase' }}>Fotos Social</div>
          </div>
        </div>

        {/* Car list */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
            Cargando inventario…
          </div>
        ) : (
          <CarSelector
            listings={listings}
            selected={selectedListing}
            onSelect={handleSelectListing}
          />
        )}
      </div>

      {/* ══ MAIN AREA ════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {editing && selectedPhoto && selectedListing ? (
          /* ── Overlay Editor ── */
          <OverlayEditor
            photo={selectedPhoto}
            listing={selectedListing}
            logo={logo}
            settings={settings}
            onBack={() => setEditing(false)}
          />
        ) : !selectedListing ? (
          /* ── Empty state ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#4b5563',
          }}>
            <div style={{ fontSize: '3.5rem' }}>📸</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6b7280' }}>
              Overlay Pro
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4b5563', textAlign: 'center', maxWidth: '340px', lineHeight: 1.6 }}>
              Selecciona un vehículo de la lista para ver sus fotos verticales (social)
              y crear overlays profesionales para Instagram.
            </div>
            <div style={{
              marginTop: '0.5rem', padding: '0.6rem 1rem',
              background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)',
              borderRadius: '12px', fontSize: '0.75rem', color: '#e1306c',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>💡</span> Las fotos verticales se etiquetan automáticamente como &quot;social&quot;
            </div>
          </div>
        ) : (
          /* ── Photo picker + action bar ── */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header bar */}
            <div style={{
              height: '52px', minHeight: '52px', padding: '0 1.25rem',
              background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedListing.image_urls?.[0] && (
                  <div style={{
                    width: '36px', height: '28px', borderRadius: '6px', overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <img src={selectedListing.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                    {selectedListing.brand} {selectedListing.model} {selectedListing.year}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    {formatPrice(selectedListing.price)} · {formatKm(selectedListing.mileage_km)} · {selectedListing.fuel_type}
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartEditing}
                disabled={!selectedPhoto}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                  background: selectedPhoto
                    ? 'linear-gradient(135deg, #e1306c, #c13584)'
                    : '#1e293b',
                  color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                  cursor: selectedPhoto ? 'pointer' : 'not-allowed',
                  opacity: selectedPhoto ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                🎨 Crear Overlay
              </button>
            </div>

            {/* Photos grid */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingPhotos ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
                  Cargando fotos social…
                </div>
              ) : (
                <PhotoPicker
                  photos={socialPhotos}
                  selected={selectedPhoto}
                  onSelect={setSelectedPhoto}
                />
              )}
            </div>

            {/* Bottom info */}
            <div style={{
              padding: '0.5rem 1rem',
              background: '#0d1220', borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                📸 Selecciona una foto vertical → crea overlay → descarga para Instagram
              </span>
              <span style={{
                fontSize: '0.65rem', color: '#4b5563', marginLeft: 'auto',
              }}>
                {socialPhotos.length} foto{socialPhotos.length !== 1 ? 's' : ''} social
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
