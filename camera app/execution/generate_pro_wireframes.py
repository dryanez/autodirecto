#!/usr/bin/env python3
"""
generate_pro_wireframes.py
==========================
Generates PROFESSIONAL vehicle wireframe overlays using:
1. Clean geometric car silhouettes with proper proportions
2. Smooth Bezier curves (not jagged polygons)
3. Subtle gradient glow effect on lines
4. Proper automotive proportions based on real sedan dimensions
5. Corner guide brackets (like a camera viewfinder)
6. Anchor crosshairs instead of ugly red dots

Output: High-quality PNG wireframes with alpha transparency
"""

import os
import sys
import math
import numpy as np

try:
    import cv2
except ImportError:
    print("ERROR: opencv-python not installed. Run: pip install opencv-python-headless")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)


# === Configuration ===
PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "ghost_overlay_cam", "assets", "templates")
WIDTH = 1080
HEIGHT = 1920

# Professional color scheme
LINE_COLOR = (255, 255, 255)        # Clean white
GLOW_COLOR = (100, 180, 255)        # Subtle blue glow
ANCHOR_COLOR = (0, 220, 120)        # Green crosshairs
BRACKET_COLOR = (255, 255, 255)     # White corner brackets
DIM_COLOR = (255, 255, 255, 40)     # Very subtle grid/guides

LINE_WIDTH = 2
GLOW_WIDTH = 6
ANCHOR_SIZE = 12
BRACKET_SIZE = 60
BRACKET_THICKNESS = 2


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def smooth_bezier_points(control_points, num_points=200):
    """Generate smooth curve through control points using cubic Bezier interpolation."""
    from functools import reduce
    
    if len(control_points) < 2:
        return control_points
    
    # Use Catmull-Rom spline for smooth curves through all points
    result = []
    points = list(control_points)
    
    # Duplicate first and last for Catmull-Rom
    points = [points[0]] + points + [points[-1]]
    
    for i in range(1, len(points) - 2):
        p0, p1, p2, p3 = points[i-1], points[i], points[i+1], points[i+2]
        
        segments = num_points // (len(control_points) - 1)
        for t_idx in range(segments):
            t = t_idx / segments
            t2 = t * t
            t3 = t2 * t
            
            # Catmull-Rom matrix
            x = 0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*t + 
                       (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + 
                       (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y = 0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*t + 
                       (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + 
                       (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            
            result.append((int(x), int(y)))
    
    result.append(control_points[-1])
    return result


def draw_glow_line(img_np, points, color, thickness, glow_radius=8):
    """Draw a line with a subtle outer glow effect using OpenCV."""
    # Draw glow layers (increasingly transparent, wider)
    for i in range(glow_radius, 0, -1):
        alpha = int(40 * (1 - i / glow_radius))
        glow_color = (color[0], color[1], color[2])
        overlay = img_np.copy()
        pts = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(overlay, [pts], False, (*glow_color, alpha), thickness + i * 2, cv2.LINE_AA)
        # Blend
        mask = np.any(overlay != img_np, axis=2)
        img_np[mask] = cv2.addWeighted(img_np, 0.7, overlay, 0.3, 0)[mask]
    
    # Draw main line
    pts = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
    cv2.polylines(img_np, [pts], False, (*color, 255), thickness, cv2.LINE_AA)
    
    return img_np


def draw_crosshair(draw, center, size, color, thickness=2):
    """Draw a professional crosshair marker at anchor point."""
    x, y = center
    gap = size // 3
    
    # Horizontal lines with gap
    draw.line([(x - size, y), (x - gap, y)], fill=color, width=thickness)
    draw.line([(x + gap, y), (x + size, y)], fill=color, width=thickness)
    
    # Vertical lines with gap
    draw.line([(x, y - size), (x, y - gap)], fill=color, width=thickness)
    draw.line([(x, y + gap), (x, y + size)], fill=color, width=thickness)
    
    # Small center dot
    r = 2
    draw.ellipse([(x-r, y-r), (x+r, y+r)], fill=color)


def draw_corner_brackets(draw, bbox, size, color, thickness=2):
    """Draw viewfinder-style corner brackets around the target area."""
    x1, y1, x2, y2 = bbox
    
    # Top-left
    draw.line([(x1, y1), (x1 + size, y1)], fill=color, width=thickness)
    draw.line([(x1, y1), (x1, y1 + size)], fill=color, width=thickness)
    
    # Top-right
    draw.line([(x2, y1), (x2 - size, y1)], fill=color, width=thickness)
    draw.line([(x2, y1), (x2, y1 + size)], fill=color, width=thickness)
    
    # Bottom-left
    draw.line([(x1, y2), (x1 + size, y2)], fill=color, width=thickness)
    draw.line([(x1, y2), (x1, y2 - size)], fill=color, width=thickness)
    
    # Bottom-right
    draw.line([(x2, y2), (x2 - size, y2)], fill=color, width=thickness)
    draw.line([(x2, y2), (x2, y2 - size)], fill=color, width=thickness)


def draw_guide_text(draw, text, position, size=28):
    """Draw instruction text with background."""
    try:
        font = ImageFont.truetype("/System/Library/Fonts/SFCompact.ttf", size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
        except (OSError, IOError):
            font = ImageFont.load_default()
    
    bbox = draw.textbbox(position, text, font=font, anchor="mm")
    padding = 8
    draw.rounded_rectangle(
        [bbox[0]-padding, bbox[1]-padding, bbox[2]+padding, bbox[3]+padding],
        radius=6,
        fill=(0, 0, 0, 120)
    )
    draw.text(position, text, fill=(255, 255, 255, 220), font=font, anchor="mm")


# ================================================================
# VEHICLE SILHOUETTES — Professional proportions
# ================================================================

def get_front_left_45_points(w, h):
    """Sedan from front-left 45° — the hero angle."""
    # Vertical center offset (car sits in middle-lower portion of portrait frame)
    cy = h * 0.52
    
    # --- Lower body / rocker panel ---
    lower_body = [
        (w * 0.06, cy + h * 0.08),    # front bumper bottom
        (w * 0.08, cy + h * 0.10),    # front wheel arch start
        (w * 0.14, cy + h * 0.13),    # front wheel arch peak
        (w * 0.22, cy + h * 0.14),    # front wheel arch end
        (w * 0.28, cy + h * 0.13),    # front wheel arch end
        (w * 0.32, cy + h * 0.12),    # rocker panel
        (w * 0.50, cy + h * 0.12),    # rocker panel mid
        (w * 0.65, cy + h * 0.12),    # rocker panel
        (w * 0.70, cy + h * 0.13),    # rear wheel arch start
        (w * 0.76, cy + h * 0.14),    # rear wheel arch peak
        (w * 0.84, cy + h * 0.13),    # rear wheel arch end
        (w * 0.90, cy + h * 0.10),    # rear bumper
        (w * 0.92, cy + h * 0.07),    # rear bumper corner
    ]
    
    # --- Upper body / greenhouse ---
    upper_body = [
        (w * 0.92, cy + h * 0.07),    # rear bumper top
        (w * 0.93, cy + h * 0.02),    # trunk lid
        (w * 0.92, cy - h * 0.01),    # trunk/rear glass junction
        (w * 0.88, cy - h * 0.04),    # C-pillar base
        (w * 0.82, cy - h * 0.09),    # C-pillar top
        (w * 0.72, cy - h * 0.12),    # roof rear
        (w * 0.55, cy - h * 0.13),    # roof peak
        (w * 0.42, cy - h * 0.12),    # roof front
        (w * 0.35, cy - h * 0.09),    # A-pillar top
        (w * 0.30, cy - h * 0.04),    # A-pillar base / windshield bottom
        (w * 0.25, cy - h * 0.01),    # hood rear
        (w * 0.15, cy + h * 0.01),    # hood mid
        (w * 0.08, cy + h * 0.03),    # hood front
        (w * 0.06, cy + h * 0.05),    # front bumper top
        (w * 0.06, cy + h * 0.08),    # close to start
    ]
    
    # --- Windows ---
    windshield = [
        (w * 0.31, cy - h * 0.035),
        (w * 0.36, cy - h * 0.085),
        (w * 0.50, cy - h * 0.11),
        (w * 0.50, cy - h * 0.03),
    ]
    
    rear_window = [
        (w * 0.54, cy - h * 0.03),
        (w * 0.54, cy - h * 0.11),
        (w * 0.72, cy - h * 0.10),
        (w * 0.80, cy - h * 0.07),
        (w * 0.83, cy - h * 0.035),
    ]
    
    # --- Wheel circles ---
    front_wheel_center = (int(w * 0.21), int(cy + h * 0.11))
    front_wheel_radius = int(h * 0.04)
    rear_wheel_center = (int(w * 0.78), int(cy + h * 0.11))
    rear_wheel_radius = int(h * 0.04)
    
    # --- Headlight ---
    headlight = [
        (w * 0.07, cy + h * 0.03),
        (w * 0.12, cy + h * 0.01),
        (w * 0.18, cy + h * 0.02),
        (w * 0.14, cy + h * 0.05),
        (w * 0.07, cy + h * 0.05),
    ]
    
    # --- Anchors ---
    anchors = {
        "front_wheel": front_wheel_center,
        "rear_wheel": rear_wheel_center,
        "a_pillar": (int(w * 0.35), int(cy - h * 0.09)),
        "c_pillar": (int(w * 0.82), int(cy - h * 0.09)),
        "headlight": (int(w * 0.12), int(cy + h * 0.03)),
        "roof_peak": (int(w * 0.55), int(cy - h * 0.13)),
    }
    
    return {
        "lower_body": lower_body,
        "upper_body": upper_body,
        "windshield": windshield,
        "rear_window": rear_window,
        "front_wheel": (front_wheel_center, front_wheel_radius),
        "rear_wheel": (rear_wheel_center, rear_wheel_radius),
        "headlight": headlight,
        "anchors": anchors,
        "bbox": (int(w*0.04), int(cy - h*0.16), int(w*0.96), int(cy + h*0.17)),
    }


def get_side_driver_points(w, h):
    """Sedan from direct side — driver's side profile."""
    cy = h * 0.52
    
    lower_body = [
        (w * 0.04, cy + h * 0.06),
        (w * 0.06, cy + h * 0.08),
        (w * 0.08, cy + h * 0.11),
        (w * 0.12, cy + h * 0.13),
        (w * 0.18, cy + h * 0.14),
        (w * 0.24, cy + h * 0.13),
        (w * 0.28, cy + h * 0.11),
        (w * 0.35, cy + h * 0.10),
        (w * 0.50, cy + h * 0.10),
        (w * 0.65, cy + h * 0.10),
        (w * 0.72, cy + h * 0.11),
        (w * 0.76, cy + h * 0.13),
        (w * 0.82, cy + h * 0.14),
        (w * 0.88, cy + h * 0.13),
        (w * 0.92, cy + h * 0.11),
        (w * 0.94, cy + h * 0.08),
        (w * 0.96, cy + h * 0.06),
    ]
    
    upper_body = [
        (w * 0.96, cy + h * 0.06),
        (w * 0.96, cy + h * 0.02),
        (w * 0.95, cy - h * 0.01),
        (w * 0.92, cy - h * 0.04),
        (w * 0.85, cy - h * 0.06),
        (w * 0.78, cy - h * 0.10),
        (w * 0.70, cy - h * 0.12),
        (w * 0.55, cy - h * 0.13),
        (w * 0.40, cy - h * 0.12),
        (w * 0.30, cy - h * 0.10),
        (w * 0.22, cy - h * 0.06),
        (w * 0.18, cy - h * 0.04),
        (w * 0.12, cy - h * 0.01),
        (w * 0.08, cy + h * 0.01),
        (w * 0.05, cy + h * 0.03),
        (w * 0.04, cy + h * 0.06),
    ]
    
    # Windows — front
    front_window = [
        (w * 0.24, cy - h * 0.04),
        (w * 0.32, cy - h * 0.09),
        (w * 0.46, cy - h * 0.11),
        (w * 0.46, cy - h * 0.03),
    ]
    
    # Windows — rear
    rear_window = [
        (w * 0.50, cy - h * 0.03),
        (w * 0.50, cy - h * 0.11),
        (w * 0.68, cy - h * 0.10),
        (w * 0.76, cy - h * 0.08),
        (w * 0.82, cy - h * 0.04),
    ]
    
    # Door line
    door_line = [
        (w * 0.48, cy - h * 0.03),
        (w * 0.48, cy + h * 0.10),
    ]
    
    front_wheel_center = (int(w * 0.18), int(cy + h * 0.10))
    front_wheel_radius = int(h * 0.045)
    rear_wheel_center = (int(w * 0.82), int(cy + h * 0.10))
    rear_wheel_radius = int(h * 0.045)
    
    anchors = {
        "front_wheel": front_wheel_center,
        "rear_wheel": rear_wheel_center,
        "a_pillar": (int(w * 0.30), int(cy - h * 0.10)),
        "c_pillar": (int(w * 0.78), int(cy - h * 0.10)),
        "headlight": (int(w * 0.05), int(cy + h * 0.02)),
        "taillight": (int(w * 0.96), int(cy + h * 0.02)),
    }
    
    return {
        "lower_body": lower_body,
        "upper_body": upper_body,
        "front_window": front_window,
        "rear_window": rear_window,
        "door_line": door_line,
        "front_wheel": (front_wheel_center, front_wheel_radius),
        "rear_wheel": (rear_wheel_center, rear_wheel_radius),
        "anchors": anchors,
        "bbox": (int(w*0.02), int(cy - h*0.16), int(w*0.98), int(cy + h*0.17)),
    }


def get_rear_center_points(w, h):
    """Sedan from direct rear view."""
    cy = h * 0.52
    
    body = [
        (w * 0.18, cy + h * 0.12),    # bottom left
        (w * 0.18, cy + h * 0.06),    # left side
        (w * 0.19, cy + h * 0.02),    # left side upper
        (w * 0.20, cy - h * 0.02),    # left shoulder
        (w * 0.24, cy - h * 0.06),    # C-pillar left base
        (w * 0.30, cy - h * 0.10),    # C-pillar left top
        (w * 0.38, cy - h * 0.13),    # roof left
        (w * 0.50, cy - h * 0.14),    # roof center
        (w * 0.62, cy - h * 0.13),    # roof right
        (w * 0.70, cy - h * 0.10),    # C-pillar right top
        (w * 0.76, cy - h * 0.06),    # C-pillar right base
        (w * 0.80, cy - h * 0.02),    # right shoulder
        (w * 0.81, cy + h * 0.02),    # right side upper
        (w * 0.82, cy + h * 0.06),    # right side
        (w * 0.82, cy + h * 0.12),    # bottom right
    ]
    
    # Bottom edge
    bottom = [
        (w * 0.82, cy + h * 0.12),
        (w * 0.78, cy + h * 0.13),
        (w * 0.22, cy + h * 0.13),
        (w * 0.18, cy + h * 0.12),
    ]
    
    # Rear window
    rear_window = [
        (w * 0.28, cy - h * 0.05),
        (w * 0.33, cy - h * 0.10),
        (w * 0.50, cy - h * 0.12),
        (w * 0.67, cy - h * 0.10),
        (w * 0.72, cy - h * 0.05),
    ]
    
    # Taillights
    taillight_left = [
        (w * 0.20, cy + h * 0.00),
        (w * 0.28, cy - h * 0.01),
        (w * 0.28, cy + h * 0.03),
        (w * 0.20, cy + h * 0.04),
        (w * 0.20, cy + h * 0.00),
    ]
    taillight_right = [
        (w * 0.72, cy - h * 0.01),
        (w * 0.80, cy + h * 0.00),
        (w * 0.80, cy + h * 0.04),
        (w * 0.72, cy + h * 0.03),
        (w * 0.72, cy - h * 0.01),
    ]
    
    # License plate
    plate = [
        (w * 0.38, cy + h * 0.05),
        (w * 0.62, cy + h * 0.05),
        (w * 0.62, cy + h * 0.09),
        (w * 0.38, cy + h * 0.09),
        (w * 0.38, cy + h * 0.05),
    ]
    
    # Wheels (partial)
    left_wheel_center = (int(w * 0.22), int(cy + h * 0.10))
    left_wheel_radius = int(h * 0.035)
    right_wheel_center = (int(w * 0.78), int(cy + h * 0.10))
    right_wheel_radius = int(h * 0.035)
    
    anchors = {
        "left_wheel": left_wheel_center,
        "right_wheel": right_wheel_center,
        "left_taillight": (int(w * 0.24), int(cy + h * 0.015)),
        "right_taillight": (int(w * 0.76), int(cy + h * 0.015)),
        "roof_center": (int(w * 0.50), int(cy - h * 0.14)),
    }
    
    return {
        "body": body,
        "bottom": bottom,
        "rear_window": rear_window,
        "taillight_left": taillight_left,
        "taillight_right": taillight_right,
        "plate": plate,
        "left_wheel": (left_wheel_center, left_wheel_radius),
        "right_wheel": (right_wheel_center, right_wheel_radius),
        "anchors": anchors,
        "bbox": (int(w*0.14), int(cy - h*0.17), int(w*0.86), int(cy + h*0.16)),
    }


# ================================================================
# RENDERING ENGINE
# ================================================================

def render_template(name, label, get_points_func):
    """Render a professional wireframe template."""
    print(f"  Rendering: {name}...")
    
    # Create RGBA image
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Get vehicle geometry
    data = get_points_func(WIDTH, HEIGHT)
    
    # --- Draw subtle center grid lines ---
    cx, cy_grid = WIDTH // 2, HEIGHT // 2
    draw.line([(cx, 0), (cx, HEIGHT)], fill=(255, 255, 255, 15), width=1)
    draw.line([(0, cy_grid), (WIDTH, cy_grid)], fill=(255, 255, 255, 15), width=1)
    
    # --- Convert to numpy for OpenCV glow rendering ---
    img_np = np.array(img)
    
    # --- Draw body lines with glow ---
    line_sets = []
    if "lower_body" in data:
        line_sets.append(data["lower_body"])
    if "upper_body" in data:
        line_sets.append(data["upper_body"])
    if "body" in data:
        line_sets.append(data["body"])
    if "bottom" in data:
        line_sets.append(data["bottom"])
    
    for points in line_sets:
        smooth = smooth_bezier_points([(int(x), int(y)) for x, y in points])
        pts = np.array(smooth, dtype=np.int32).reshape((-1, 1, 2))
        
        # Glow layer
        for i in range(4, 0, -1):
            alpha = int(30 * (1 - i / 5))
            overlay = img_np.copy()
            cv2.polylines(overlay, [pts], False, (GLOW_COLOR[0], GLOW_COLOR[1], GLOW_COLOR[2], alpha), LINE_WIDTH + i * 3, cv2.LINE_AA)
            mask = np.any(overlay != img_np, axis=2)
            img_np[mask] = overlay[mask]
        
        # Main line
        cv2.polylines(img_np, [pts], False, (*LINE_COLOR, 200), LINE_WIDTH, cv2.LINE_AA)
    
    # --- Draw windows (thinner, more subtle) ---
    window_sets = []
    for key in ["windshield", "front_window", "rear_window"]:
        if key in data:
            window_sets.append(data[key])
    
    for points in window_sets:
        smooth = smooth_bezier_points([(int(x), int(y)) for x, y in points])
        pts = np.array(smooth, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(img_np, [pts], False, (*LINE_COLOR, 120), 1, cv2.LINE_AA)
    
    # --- Draw detail lines (door, taillights, plate, headlight) ---
    detail_keys = ["door_line", "taillight_left", "taillight_right", "plate", "headlight"]
    for key in detail_keys:
        if key in data:
            points = [(int(x), int(y)) for x, y in data[key]]
            pts = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
            cv2.polylines(img_np, [pts], False, (*LINE_COLOR, 140), 1, cv2.LINE_AA)
    
    # --- Draw wheels ---
    for key in ["front_wheel", "rear_wheel", "left_wheel", "right_wheel"]:
        if key in data and isinstance(data[key], tuple) and len(data[key]) == 2:
            center, radius = data[key]
            if isinstance(center, tuple):
                # Outer ring
                cv2.circle(img_np, center, radius, (*LINE_COLOR, 180), LINE_WIDTH, cv2.LINE_AA)
                # Inner ring (hub)
                cv2.circle(img_np, center, radius // 3, (*LINE_COLOR, 100), 1, cv2.LINE_AA)
                # Rim spokes (5 spokes)
                for angle_deg in range(0, 360, 72):
                    angle = math.radians(angle_deg)
                    inner = (int(center[0] + radius * 0.3 * math.cos(angle)),
                            int(center[1] + radius * 0.3 * math.sin(angle)))
                    outer = (int(center[0] + radius * 0.85 * math.cos(angle)),
                            int(center[1] + radius * 0.85 * math.sin(angle)))
                    cv2.line(img_np, inner, outer, (*LINE_COLOR, 70), 1, cv2.LINE_AA)
    
    # Convert back to PIL
    img = Image.fromarray(img_np)
    draw = ImageDraw.Draw(img)
    
    # --- Draw corner brackets ---
    if "bbox" in data:
        draw_corner_brackets(draw, data["bbox"], BRACKET_SIZE, (*BRACKET_COLOR, 160), BRACKET_THICKNESS)
    
    # --- Draw anchor crosshairs ---
    if "anchors" in data:
        for anchor_name, pos in data["anchors"].items():
            draw_crosshair(draw, pos, ANCHOR_SIZE, (*ANCHOR_COLOR, 180), 1)
    
    # --- Label ---
    draw_guide_text(draw, label, (WIDTH // 2, HEIGHT * 0.12), size=32)
    
    # --- Shot instruction at bottom ---
    draw_guide_text(draw, "Align vehicle with outline", (WIDTH // 2, HEIGHT * 0.88), size=24)
    
    # Save
    filepath = os.path.join(OUTPUT_DIR, f"{name}.png")
    img.save(filepath, "PNG")
    print(f"    ✓ Saved: {filepath}")
    
    return data.get("anchors", {})


def main():
    print("=" * 60)
    print("  PROFESSIONAL WIREFRAME GENERATOR")
    print("  Ghost Overlay Camera — Vehicle Templates")
    print("=" * 60)
    print()
    
    ensure_output_dir()
    
    templates = [
        ("front_left_45", "Front Left 45°", get_front_left_45_points),
        ("side_driver", "Side Profile — Driver", get_side_driver_points),
        ("rear_center", "Rear Center", get_rear_center_points),
    ]
    
    all_anchors = {}
    for name, label, func in templates:
        anchors = render_template(name, label, func)
        all_anchors[name] = anchors
    
    print()
    print(f"✅ Generated {len(templates)} professional wireframe templates")
    print(f"   Output: {OUTPUT_DIR}")
    print()
    
    # Print normalized anchor coordinates
    print("--- Anchor Coordinates (normalized) ---")
    for tname, anchors in all_anchors.items():
        print(f"\n  {tname}:")
        for aname, (x, y) in anchors.items():
            print(f"    {aname}: [{x/WIDTH:.3f}, {y/HEIGHT:.3f}]")


if __name__ == "__main__":
    main()
