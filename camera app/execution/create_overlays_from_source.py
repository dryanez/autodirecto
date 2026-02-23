#!/usr/bin/env python3
"""
create_overlays_from_source.py
==============================
Takes the vectorink car image and transforms it into professional
ghost overlay templates for the camera app.

Process:
1. Load source image (transparent background car vector)
2. Extract clean edges using Canny edge detection
3. Convert to white-on-transparent overlay
4. Apply glow effect
5. Add UI elements (corner brackets, crosshairs, labels)
6. Generate 3 hero shot templates by transforming the source
"""

import os
import sys
import math
import numpy as np

try:
    import cv2
except ImportError:
    print("ERROR: opencv-python not installed"); sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
except ImportError:
    print("ERROR: Pillow not installed"); sys.exit(1)


# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_IMG = os.path.join(SCRIPT_DIR, "vectorink-background-removed.png")
PROJECT_DIR = os.path.join(SCRIPT_DIR, "..")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "ghost_overlay_cam", "assets", "templates")

# Output dimensions (portrait phone)
OUT_W = 1080
OUT_H = 1920


def ensure_dirs():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_source():
    """Load and return source image as PIL RGBA."""
    if not os.path.exists(SOURCE_IMG):
        print(f"ERROR: Source image not found: {SOURCE_IMG}")
        sys.exit(1)
    img = Image.open(SOURCE_IMG).convert("RGBA")
    print(f"  Source: {img.size}, mode={img.mode}")
    return img


def extract_silhouette(pil_img):
    """
    Extract the car silhouette/outline from the source image.
    Returns a white-on-transparent RGBA image.
    """
    # Convert to numpy
    np_img = np.array(pil_img)
    
    # Use the alpha channel to get the shape
    alpha = np_img[:, :, 3]
    
    # Also get the RGB content for edge detection
    gray = cv2.cvtColor(np_img[:, :, :3], cv2.COLOR_RGB2GRAY)
    
    # Mask out transparent areas
    gray[alpha < 20] = 255  # Set transparent areas to white (no edges)
    
    # Edge detection on the content
    edges_content = cv2.Canny(gray, 30, 100)
    
    # Edge detection on the alpha mask (gets the outline)
    alpha_blurred = cv2.GaussianBlur(alpha, (3, 3), 0)
    edges_alpha = cv2.Canny(alpha_blurred, 50, 150)
    
    # Combine both edge sources
    edges = cv2.bitwise_or(edges_content, edges_alpha)
    
    # Dilate slightly for visibility
    kernel = np.ones((2, 2), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    
    # Create white-on-transparent result
    result = np.zeros((edges.shape[0], edges.shape[1], 4), dtype=np.uint8)
    result[edges > 0] = [255, 255, 255, 220]
    
    return Image.fromarray(result)


def extract_filled_silhouette(pil_img, opacity=25):
    """
    Extract a faint filled silhouette (the full shape, not just edges).
    This goes UNDER the edge outline for a nicer look.
    """
    np_img = np.array(pil_img)
    alpha = np_img[:, :, 3]
    
    # Create faint white fill where the car is
    result = np.zeros((alpha.shape[0], alpha.shape[1], 4), dtype=np.uint8)
    mask = alpha > 20
    result[mask, 0] = 255  # R
    result[mask, 1] = 255  # G
    result[mask, 2] = 255  # B
    result[mask, 3] = opacity  # Very faint
    
    return Image.fromarray(result)


def apply_glow(pil_img, radius=4, color=(100, 200, 255), intensity=0.5):
    """Add a subtle blue glow around edges."""
    # Extract visible pixels
    np_img = np.array(pil_img)
    
    # Create glow from alpha
    alpha = np_img[:, :, 3].astype(np.float32)
    
    # Blur to create glow
    glow = cv2.GaussianBlur(alpha, (radius*4+1, radius*4+1), radius*2)
    glow = (glow * intensity).clip(0, 255).astype(np.uint8)
    
    # Remove glow where original exists
    glow[alpha > 0] = 0
    
    # Create glow layer
    glow_layer = np.zeros_like(np_img)
    glow_layer[:, :, 0] = color[0]  # R
    glow_layer[:, :, 1] = color[1]  # G  
    glow_layer[:, :, 2] = color[2]  # B
    glow_layer[:, :, 3] = glow
    
    glow_pil = Image.fromarray(glow_layer)
    
    # Composite: glow under original
    result = Image.alpha_composite(glow_pil, pil_img)
    return result


def place_on_canvas(silhouette, fill, canvas_w, canvas_h,
                    scale=1.0, offset_x=0, offset_y=0, flip_h=False,
                    perspective_skew=0):
    """
    Place the car silhouette onto a portrait canvas at the right position and scale.
    """
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    # Scale the images
    src_w, src_h = silhouette.size
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    
    sil_scaled = silhouette.resize((new_w, new_h), Image.LANCZOS)
    fill_scaled = fill.resize((new_w, new_h), Image.LANCZOS)
    
    if flip_h:
        sil_scaled = sil_scaled.transpose(Image.FLIP_LEFT_RIGHT)
        fill_scaled = fill_scaled.transpose(Image.FLIP_LEFT_RIGHT)
    
    # Apply perspective if requested (for 3/4 views)
    if perspective_skew != 0:
        coeffs = find_perspective_coeffs(new_w, new_h, perspective_skew)
        sil_scaled = sil_scaled.transform((new_w, new_h), Image.PERSPECTIVE, 
                                          coeffs, Image.BICUBIC)
        fill_scaled = fill_scaled.transform((new_w, new_h), Image.PERSPECTIVE,
                                            coeffs, Image.BICUBIC)
    
    # Center position + offsets
    paste_x = (canvas_w - new_w) // 2 + offset_x
    paste_y = (canvas_h - new_h) // 2 + offset_y
    
    # Paste fill first (under), then outline
    canvas.paste(fill_scaled, (paste_x, paste_y), fill_scaled)
    canvas.paste(sil_scaled, (paste_x, paste_y), sil_scaled)
    
    # Return canvas and bounding box
    bbox = (paste_x, paste_y, paste_x + new_w, paste_y + new_h)
    return canvas, bbox


def find_perspective_coeffs(w, h, skew):
    """
    Simple perspective transform coefficients.
    skew > 0: left side recedes (front-right view)
    skew < 0: right side recedes (front-left view)
    """
    # Source corners
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    
    # Destination corners with perspective
    squeeze = abs(skew)
    if skew > 0:
        # Right side recedes
        dst = [(0, 0), (w, int(h*squeeze*0.15)), 
               (w, h - int(h*squeeze*0.15)), (0, h)]
    else:
        # Left side recedes
        dst = [(0, int(h*squeeze*0.15)), (w, 0),
               (w, h), (0, h - int(h*squeeze*0.15))]
    
    # Solve for perspective coefficients
    matrix = []
    for s, d in zip(src, dst):
        matrix.append([s[0], s[1], 1, 0, 0, 0, -d[0]*s[0], -d[0]*s[1]])
        matrix.append([0, 0, 0, s[0], s[1], 1, -d[1]*s[0], -d[1]*s[1]])
    
    A = np.matrix(matrix, dtype=np.float64)
    B = np.array([d for pair in zip([d[0] for d in dst], [d[1] for d in dst]) 
                  for d in [pair]]).flatten()
    B = np.array([coord for d in dst for coord in d], dtype=np.float64)
    
    res = np.linalg.solve(A, B)
    return tuple(np.array(res).flatten())


def add_overlay_ui(canvas, bbox, label, sublabel="Align vehicle with outline"):
    """Add corner brackets, label, and subtle guidelines."""
    draw = ImageDraw.Draw(canvas)
    
    x1, y1, x2, y2 = bbox
    
    # Pad bbox
    pad = 40
    x1 -= pad; y1 -= pad; x2 += pad; y2 += pad
    
    # Corner brackets
    bracket_len = 60
    bc = (255, 255, 255, 150)
    bw = 2
    
    corners = [
        (x1, y1, 1, 1),   # top-left
        (x2, y1, -1, 1),  # top-right
        (x1, y2, 1, -1),  # bottom-left
        (x2, y2, -1, -1), # bottom-right
    ]
    
    for cx, cy, dx, dy in corners:
        draw.line([(cx, cy), (cx + bracket_len*dx, cy)], fill=bc, width=bw)
        draw.line([(cx, cy), (cx, cy + bracket_len*dy)], fill=bc, width=bw)
    
    # Center crosshairs (very subtle)
    mid_x = (x1 + x2) // 2
    mid_y = (y1 + y2) // 2
    ch_c = (255, 255, 255, 25)
    draw.line([(mid_x, y1 + bracket_len), (mid_x, y2 - bracket_len)], fill=ch_c, width=1)
    draw.line([(x1 + bracket_len, mid_y), (x2 - bracket_len, mid_y)], fill=ch_c, width=1)
    
    # Fonts
    try:
        font_lg = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        font_sm = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        font_lg = ImageFont.load_default()
        font_sm = font_lg
    
    # Top label
    lx, ly = OUT_W // 2, int(OUT_H * 0.08)
    tb = draw.textbbox((lx, ly), label, font=font_lg, anchor="mm")
    p = 14
    draw.rounded_rectangle([tb[0]-p, tb[1]-p, tb[2]+p, tb[3]+p],
                           radius=10, fill=(0, 0, 0, 160))
    draw.text((lx, ly), label, fill=(255, 255, 255, 230), font=font_lg, anchor="mm")
    
    # Bottom instruction
    ix, iy = OUT_W // 2, int(OUT_H * 0.92)
    ib = draw.textbbox((ix, iy), sublabel, font=font_sm, anchor="mm")
    draw.rounded_rectangle([ib[0]-p, ib[1]-p, ib[2]+p, ib[3]+p],
                           radius=8, fill=(0, 0, 0, 130))
    draw.text((ix, iy), sublabel, fill=(255, 255, 255, 200), font=font_sm, anchor="mm")
    
    return canvas


def main():
    print("=" * 60)
    print("  OVERLAY GENERATOR — from vectorink source")
    print("=" * 60)
    print()
    
    ensure_dirs()
    
    # 1. Load source
    print("Loading source image...")
    source = load_source()
    
    # 2. Extract edges and fill
    print("Extracting silhouette edges...")
    edges = extract_silhouette(source)
    print(f"  Edges: {edges.size}")
    
    print("Extracting filled silhouette...")
    fill = extract_filled_silhouette(source, opacity=20)
    
    # 3. Apply glow to edges
    print("Applying glow effect...")
    edges_glow = apply_glow(edges, radius=4, color=(100, 200, 255), intensity=0.4)
    
    # ============================================================
    # Template 1: SIDE VIEW (direct side profile)
    # The source image appears to be a side/3-quarter view
    # ============================================================
    print("\n  [1/3] Side Profile...")
    
    # Scale to fit ~80% of canvas width
    src_w, src_h = edges_glow.size
    target_w = int(OUT_W * 0.88)
    side_scale = target_w / src_w
    
    side_canvas, side_bbox = place_on_canvas(
        edges_glow, fill, OUT_W, OUT_H,
        scale=side_scale, offset_x=0, offset_y=int(OUT_H * 0.02)
    )
    side_canvas = add_overlay_ui(side_canvas, side_bbox, "SIDE PROFILE")
    
    side_path = os.path.join(OUTPUT_DIR, "side_driver.png")
    side_canvas.save(side_path, "PNG")
    print(f"    ✓ {side_path}")
    
    # ============================================================
    # Template 2: FRONT LEFT 45° (slight perspective)
    # ============================================================
    print("  [2/3] Front Left 45°...")
    
    fl_scale = target_w / src_w * 0.95
    
    fl_canvas, fl_bbox = place_on_canvas(
        edges_glow, fill, OUT_W, OUT_H,
        scale=fl_scale, offset_x=-int(OUT_W * 0.03), offset_y=int(OUT_H * 0.02),
        perspective_skew=-0.6
    )
    fl_canvas = add_overlay_ui(fl_canvas, fl_bbox, "FRONT LEFT 45°")
    
    fl_path = os.path.join(OUTPUT_DIR, "front_left_45.png")
    fl_canvas.save(fl_path, "PNG")
    print(f"    ✓ {fl_path}")
    
    # ============================================================
    # Template 3: REAR VIEW (flipped + different perspective)
    # ============================================================
    print("  [3/3] Rear View...")
    
    rear_scale = target_w / src_w * 0.95
    
    rear_canvas, rear_bbox = place_on_canvas(
        edges_glow, fill, OUT_W, OUT_H,
        scale=rear_scale, offset_x=int(OUT_W * 0.03), offset_y=int(OUT_H * 0.02),
        flip_h=True, perspective_skew=0.6
    )
    rear_canvas = add_overlay_ui(rear_canvas, rear_bbox, "REAR VIEW")
    
    rear_path = os.path.join(OUTPUT_DIR, "rear_center.png")
    rear_canvas.save(rear_path, "PNG")
    print(f"    ✓ {rear_path}")
    
    print(f"\n✅ Generated 3 templates from vectorink source")
    print(f"   Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
