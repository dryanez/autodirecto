#!/usr/bin/env python3
"""
generate_svg_wireframes.py
==========================
Creates professional vehicle wireframe overlays using actual SVG path data
rendered through Pillow. Uses precise automotive proportions.

The approach: Define the car outlines as SVG path data, parse them,
and render as clean white-on-transparent PNGs with proper anti-aliasing.
"""

import os
import sys
import math
import numpy as np

try:
    import cv2
except ImportError:
    print("ERROR: opencv-python not installed")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("ERROR: Pillow not installed")
    sys.exit(1)


PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "ghost_overlay_cam", "assets", "templates")
WIDTH = 1080
HEIGHT = 1920


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def draw_smooth_curve(img_np, points, color, thickness, closed=False):
    """Draw anti-aliased smooth curve through points."""
    pts = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
    if closed:
        cv2.polylines(img_np, [pts], True, color, thickness, cv2.LINE_AA)
    else:
        cv2.polylines(img_np, [pts], False, color, thickness, cv2.LINE_AA)


def draw_ellipse(img_np, center, axes, color, thickness, angle=0):
    """Draw anti-aliased ellipse."""
    cv2.ellipse(img_np, center, axes, angle, 0, 360, color, thickness, cv2.LINE_AA)


def catmull_rom(p0, p1, p2, p3, n_points=20):
    """Generate smooth curve segment using Catmull-Rom interpolation."""
    points = []
    for i in range(n_points):
        t = i / n_points
        t2 = t * t
        t3 = t2 * t
        x = 0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*t +
                   (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 +
                   (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
        y = 0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*t +
                   (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 +
                   (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
        points.append((int(x), int(y)))
    return points


def smooth_through_points(control_points, n_per_segment=30):
    """Generate smooth curve through all control points."""
    if len(control_points) < 3:
        return [(int(x), int(y)) for x, y in control_points]
    
    pts = list(control_points)
    pts = [pts[0]] + pts + [pts[-1]]
    
    result = []
    for i in range(1, len(pts) - 2):
        segment = catmull_rom(pts[i-1], pts[i], pts[i+1], pts[i+2], n_per_segment)
        result.extend(segment)
    result.append((int(control_points[-1][0]), int(control_points[-1][1])))
    return result


def add_glow(img_np, radius=3, intensity=0.4):
    """Add subtle glow effect to existing lines by blurring and compositing."""
    # Extract the alpha channel
    if img_np.shape[2] == 4:
        # Create glow from existing content
        gray = cv2.cvtColor(img_np[:,:,:3], cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (radius*2+1, radius*2+1), radius)
        
        # Tint the glow blue
        glow_layer = np.zeros_like(img_np)
        glow_layer[:,:,0] = (blurred * 0.4).astype(np.uint8)  # B
        glow_layer[:,:,1] = (blurred * 0.7).astype(np.uint8)  # G
        glow_layer[:,:,2] = (blurred * 1.0).astype(np.uint8)  # R
        glow_layer[:,:,3] = (blurred * intensity).astype(np.uint8)  # A
        
        # Composite glow under original
        mask = img_np[:,:,3] == 0
        combined = img_np.copy()
        combined[mask] = glow_layer[mask]
        return combined
    return img_np


# ============================================================
# SEDAN SIDE VIEW — Realistic proportions
# ============================================================
def render_side_view(w, h):
    """Render realistic sedan side profile."""
    img = np.zeros((h, w, 4), dtype=np.uint8)
    
    # Car positioned in center of portrait frame
    # Car occupies roughly 85% width, centered vertically at 52%
    cx, cy = w * 0.50, h * 0.52
    car_w = w * 0.88
    car_h = h * 0.18
    
    left = cx - car_w/2
    right = cx + car_w/2
    
    white = (255, 255, 255, 200)
    dim = (255, 255, 255, 80)
    accent = (100, 200, 255, 160)
    
    # --- BODY OUTLINE (smooth sedan profile) ---
    body_control = [
        # Front bumper
        (left + car_w*0.00, cy + car_h*0.15),
        (left + car_w*0.01, cy + car_h*0.05),
        (left + car_w*0.02, cy - car_h*0.05),
        # Hood
        (left + car_w*0.05, cy - car_h*0.15),
        (left + car_w*0.10, cy - car_h*0.20),
        (left + car_w*0.18, cy - car_h*0.22),
        # Windshield
        (left + car_w*0.22, cy - car_h*0.25),
        (left + car_w*0.28, cy - car_h*0.55),
        (left + car_w*0.32, cy - car_h*0.70),
        # Roof
        (left + car_w*0.38, cy - car_h*0.78),
        (left + car_w*0.45, cy - car_h*0.82),
        (left + car_w*0.52, cy - car_h*0.83),
        (left + car_w*0.60, cy - car_h*0.82),
        (left + car_w*0.67, cy - car_h*0.78),
        # Rear window
        (left + car_w*0.72, cy - car_h*0.70),
        (left + car_w*0.78, cy - car_h*0.50),
        (left + car_w*0.82, cy - car_h*0.35),
        # Trunk
        (left + car_w*0.85, cy - car_h*0.25),
        (left + car_w*0.90, cy - car_h*0.20),
        (left + car_w*0.95, cy - car_h*0.15),
        # Rear bumper
        (left + car_w*0.98, cy - car_h*0.05),
        (left + car_w*0.99, cy + car_h*0.05),
        (left + car_w*1.00, cy + car_h*0.15),
    ]
    
    # Lower body line (connects front to rear under wheels)
    lower_control = [
        (left + car_w*1.00, cy + car_h*0.15),
        (left + car_w*0.98, cy + car_h*0.25),
        # Rear wheel arch
        (left + car_w*0.92, cy + car_h*0.35),
        (left + car_w*0.88, cy + car_h*0.55),
        (left + car_w*0.84, cy + car_h*0.65),
        (left + car_w*0.80, cy + car_h*0.55),
        (left + car_w*0.76, cy + car_h*0.35),
        # Sill
        (left + car_w*0.65, cy + car_h*0.30),
        (left + car_w*0.50, cy + car_h*0.30),
        (left + car_w*0.35, cy + car_h*0.30),
        # Front wheel arch
        (left + car_w*0.24, cy + car_h*0.35),
        (left + car_w*0.20, cy + car_h*0.55),
        (left + car_w*0.16, cy + car_h*0.65),
        (left + car_w*0.12, cy + car_h*0.55),
        (left + car_w*0.08, cy + car_h*0.35),
        (left + car_w*0.04, cy + car_h*0.25),
        (left + car_w*0.00, cy + car_h*0.15),
    ]
    
    body_smooth = smooth_through_points(body_control, 40)
    lower_smooth = smooth_through_points(lower_control, 40)
    
    draw_smooth_curve(img, body_smooth, white, 2)
    draw_smooth_curve(img, lower_smooth, white, 2)
    
    # --- WINDOWS ---
    # Windshield
    ws = smooth_through_points([
        (left + car_w*0.24, cy - car_h*0.25),
        (left + car_w*0.30, cy - car_h*0.60),
        (left + car_w*0.34, cy - car_h*0.72),
        (left + car_w*0.40, cy - car_h*0.76),
        (left + car_w*0.40, cy - car_h*0.22),
        (left + car_w*0.24, cy - car_h*0.22),
    ], 25)
    draw_smooth_curve(img, ws, dim, 1, closed=True)
    
    # Side windows (front door)
    sw1 = smooth_through_points([
        (left + car_w*0.42, cy - car_h*0.22),
        (left + car_w*0.42, cy - car_h*0.76),
        (left + car_w*0.52, cy - car_h*0.80),
        (left + car_w*0.55, cy - car_h*0.22),
    ], 20)
    draw_smooth_curve(img, sw1, dim, 1, closed=True)
    
    # Side windows (rear door)
    sw2 = smooth_through_points([
        (left + car_w*0.57, cy - car_h*0.22),
        (left + car_w*0.57, cy - car_h*0.80),
        (left + car_w*0.66, cy - car_h*0.76),
        (left + car_w*0.72, cy - car_h*0.60),
        (left + car_w*0.75, cy - car_h*0.40),
        (left + car_w*0.75, cy - car_h*0.22),
    ], 20)
    draw_smooth_curve(img, sw2, dim, 1, closed=True)
    
    # --- DOOR LINE ---
    door = smooth_through_points([
        (left + car_w*0.55, cy - car_h*0.22),
        (left + car_w*0.55, cy + car_h*0.28),
    ], 10)
    draw_smooth_curve(img, door, dim, 1)
    
    # --- WHEELS ---
    fw_cx = int(left + car_w*0.16)
    fw_cy = int(cy + car_h*0.50)
    rw_cx = int(left + car_w*0.84)
    rw_cy = int(cy + car_h*0.50)
    wheel_r = int(car_h * 0.22)
    
    # Outer tire
    draw_ellipse(img, (fw_cx, fw_cy), (wheel_r, wheel_r), white, 2)
    draw_ellipse(img, (rw_cx, rw_cy), (wheel_r, wheel_r), white, 2)
    
    # Inner rim
    rim_r = int(wheel_r * 0.65)
    draw_ellipse(img, (fw_cx, fw_cy), (rim_r, rim_r), dim, 1)
    draw_ellipse(img, (rw_cx, rw_cy), (rim_r, rim_r), dim, 1)
    
    # Hub
    hub_r = int(wheel_r * 0.15)
    draw_ellipse(img, (fw_cx, fw_cy), (hub_r, hub_r), dim, 1)
    draw_ellipse(img, (rw_cx, rw_cy), (hub_r, hub_r), dim, 1)
    
    # Spokes (5)
    for angle in range(0, 360, 72):
        rad = math.radians(angle)
        for cx_w, cy_w in [(fw_cx, fw_cy), (rw_cx, rw_cy)]:
            x1 = int(cx_w + hub_r * math.cos(rad))
            y1 = int(cy_w + hub_r * math.sin(rad))
            x2 = int(cx_w + rim_r * 0.9 * math.cos(rad))
            y2 = int(cy_w + rim_r * 0.9 * math.sin(rad))
            cv2.line(img, (x1, y1), (x2, y2), dim, 1, cv2.LINE_AA)
    
    # --- HEADLIGHT ---
    hl = smooth_through_points([
        (left + car_w*0.02, cy - car_h*0.02),
        (left + car_w*0.06, cy - car_h*0.12),
        (left + car_w*0.12, cy - car_h*0.15),
        (left + car_w*0.12, cy - car_h*0.02),
    ], 15)
    draw_smooth_curve(img, hl, dim, 1, closed=True)
    
    # --- TAILLIGHT ---
    tl = smooth_through_points([
        (left + car_w*0.95, cy - car_h*0.12),
        (left + car_w*0.98, cy - car_h*0.02),
        (left + car_w*0.98, cy + car_h*0.08),
        (left + car_w*0.92, cy + car_h*0.05),
    ], 15)
    draw_smooth_curve(img, tl, dim, 1, closed=True)
    
    # --- BELTLINE (character line) ---
    belt = smooth_through_points([
        (left + car_w*0.06, cy - car_h*0.10),
        (left + car_w*0.20, cy - car_h*0.20),
        (left + car_w*0.40, cy - car_h*0.22),
        (left + car_w*0.60, cy - car_h*0.22),
        (left + car_w*0.80, cy - car_h*0.22),
        (left + car_w*0.95, cy - car_h*0.15),
    ], 30)
    draw_smooth_curve(img, belt, (255, 255, 255, 50), 1)
    
    # Add glow
    img = add_glow(img, radius=5, intensity=0.3)
    
    anchors = {
        "front_wheel": (fw_cx, fw_cy),
        "rear_wheel": (rw_cx, rw_cy),
        "a_pillar": (int(left + car_w*0.30), int(cy - car_h*0.65)),
        "c_pillar": (int(left + car_w*0.75), int(cy - car_h*0.45)),
        "headlight": (int(left + car_w*0.06), int(cy - car_h*0.08)),
        "taillight": (int(left + car_w*0.96), int(cy - car_h*0.05)),
    }
    bbox = (int(left - 20), int(cy - car_h*0.95), int(right + 20), int(cy + car_h*0.80))
    
    return img, anchors, bbox


# ============================================================
# SEDAN FRONT-LEFT 45° VIEW
# ============================================================
def render_front_left_45(w, h):
    """Render sedan from front-left 45 degree angle."""
    img = np.zeros((h, w, 4), dtype=np.uint8)
    
    cx, cy = w * 0.50, h * 0.52
    car_w = w * 0.82
    car_h = h * 0.20
    
    left = cx - car_w/2
    right = cx + car_w/2
    
    white = (255, 255, 255, 200)
    dim = (255, 255, 255, 80)
    
    # 45° perspective: front is closer (larger), rear recedes
    # Upper body
    body_upper = [
        # Front bumper (closer, wider)
        (left + car_w*0.00, cy + car_h*0.10),
        (left + car_w*0.02, cy - car_h*0.00),
        (left + car_w*0.04, cy - car_h*0.12),
        # Front fender / hood
        (left + car_w*0.08, cy - car_h*0.22),
        (left + car_w*0.15, cy - car_h*0.28),
        (left + car_w*0.22, cy - car_h*0.30),
        # A-pillar / windshield
        (left + car_w*0.26, cy - car_h*0.35),
        (left + car_w*0.30, cy - car_h*0.55),
        (left + car_w*0.35, cy - car_h*0.72),
        # Roof
        (left + car_w*0.42, cy - car_h*0.80),
        (left + car_w*0.52, cy - car_h*0.84),
        (left + car_w*0.62, cy - car_h*0.82),
        (left + car_w*0.70, cy - car_h*0.76),
        # C-pillar / rear window
        (left + car_w*0.76, cy - car_h*0.65),
        (left + car_w*0.82, cy - car_h*0.48),
        (left + car_w*0.86, cy - car_h*0.35),
        # Trunk
        (left + car_w*0.90, cy - car_h*0.28),
        (left + car_w*0.94, cy - car_h*0.22),
        (left + car_w*0.97, cy - car_h*0.15),
        # Rear bumper (receding, narrower)
        (left + car_w*0.99, cy - car_h*0.05),
        (left + car_w*1.00, cy + car_h*0.05),
    ]
    
    body_lower = [
        (left + car_w*1.00, cy + car_h*0.05),
        (left + car_w*0.99, cy + car_h*0.18),
        # Rear wheel
        (left + car_w*0.94, cy + car_h*0.30),
        (left + car_w*0.90, cy + car_h*0.50),
        (left + car_w*0.86, cy + car_h*0.60),
        (left + car_w*0.82, cy + car_h*0.50),
        (left + car_w*0.78, cy + car_h*0.30),
        # Sill
        (left + car_w*0.65, cy + car_h*0.25),
        (left + car_w*0.45, cy + car_h*0.25),
        (left + car_w*0.30, cy + car_h*0.28),
        # Front wheel (larger, closer)
        (left + car_w*0.24, cy + car_h*0.35),
        (left + car_w*0.18, cy + car_h*0.58),
        (left + car_w*0.14, cy + car_h*0.68),
        (left + car_w*0.10, cy + car_h*0.58),
        (left + car_w*0.06, cy + car_h*0.35),
        # Front bumper bottom
        (left + car_w*0.02, cy + car_h*0.22),
        (left + car_w*0.00, cy + car_h*0.10),
    ]
    
    draw_smooth_curve(img, smooth_through_points(body_upper, 35), white, 2)
    draw_smooth_curve(img, smooth_through_points(body_lower, 35), white, 2)
    
    # Windows
    ws = smooth_through_points([
        (left + car_w*0.28, cy - car_h*0.35),
        (left + car_w*0.33, cy - car_h*0.62),
        (left + car_w*0.38, cy - car_h*0.75),
        (left + car_w*0.44, cy - car_h*0.78),
        (left + car_w*0.44, cy - car_h*0.30),
    ], 20)
    draw_smooth_curve(img, ws, dim, 1, closed=True)
    
    rw = smooth_through_points([
        (left + car_w*0.47, cy - car_h*0.30),
        (left + car_w*0.47, cy - car_h*0.78),
        (left + car_w*0.62, cy - car_h*0.78),
        (left + car_w*0.70, cy - car_h*0.70),
        (left + car_w*0.78, cy - car_h*0.52),
        (left + car_w*0.82, cy - car_h*0.38),
        (left + car_w*0.82, cy - car_h*0.30),
    ], 20)
    draw_smooth_curve(img, rw, dim, 1, closed=True)
    
    # Front face (visible at 45°) — headlight, grille
    front_face = smooth_through_points([
        (left + car_w*0.00, cy + car_h*0.10),
        (left - car_w*0.04, cy - car_h*0.05),
        (left - car_w*0.02, cy - car_h*0.25),
        (left + car_w*0.04, cy - car_h*0.32),
        (left + car_w*0.08, cy - car_h*0.22),
    ], 20)
    draw_smooth_curve(img, front_face, dim, 1)
    
    # Headlight shape
    hl = smooth_through_points([
        (left - car_w*0.02, cy - car_h*0.10),
        (left + car_w*0.04, cy - car_h*0.18),
        (left + car_w*0.10, cy - car_h*0.22),
        (left + car_w*0.10, cy - car_h*0.10),
        (left - car_w*0.02, cy - car_h*0.05),
    ], 15)
    draw_smooth_curve(img, hl, dim, 1, closed=True)
    
    # Grille lines
    for frac in [0.3, 0.5, 0.7]:
        y = cy - car_h * 0.05 + car_h * 0.15 * frac
        cv2.line(img, 
                (int(left - car_w*0.01), int(y)),
                (int(left + car_w*0.06), int(y - car_h*0.02)),
                dim, 1, cv2.LINE_AA)
    
    # Wheels
    fw_cx = int(left + car_w*0.14)
    fw_cy = int(cy + car_h*0.52)
    fw_rx, fw_ry = int(car_h*0.22), int(car_h*0.22)
    
    rw_cx = int(left + car_w*0.86)
    rw_cy = int(cy + car_h*0.45)
    rw_rx, rw_ry = int(car_h*0.18), int(car_h*0.18)
    
    draw_ellipse(img, (fw_cx, fw_cy), (fw_rx, fw_ry), white, 2)
    draw_ellipse(img, (fw_cx, fw_cy), (int(fw_rx*0.65), int(fw_ry*0.65)), dim, 1)
    draw_ellipse(img, (fw_cx, fw_cy), (int(fw_rx*0.15), int(fw_ry*0.15)), dim, 1)
    
    draw_ellipse(img, (rw_cx, rw_cy), (rw_rx, rw_ry), white, 2)
    draw_ellipse(img, (rw_cx, rw_cy), (int(rw_rx*0.65), int(rw_ry*0.65)), dim, 1)
    draw_ellipse(img, (rw_cx, rw_cy), (int(rw_rx*0.15), int(rw_ry*0.15)), dim, 1)
    
    # Spokes
    for angle in range(0, 360, 72):
        rad = math.radians(angle)
        for c, r in [((fw_cx, fw_cy), fw_rx), ((rw_cx, rw_cy), rw_rx)]:
            x1 = int(c[0] + r*0.15*math.cos(rad))
            y1 = int(c[1] + r*0.15*math.sin(rad))
            x2 = int(c[0] + r*0.58*math.cos(rad))
            y2 = int(c[1] + r*0.58*math.sin(rad))
            cv2.line(img, (x1,y1), (x2,y2), dim, 1, cv2.LINE_AA)
    
    img = add_glow(img, radius=5, intensity=0.3)
    
    anchors = {
        "front_wheel": (fw_cx, fw_cy),
        "rear_wheel": (rw_cx, rw_cy),
        "a_pillar": (int(left + car_w*0.33), int(cy - car_h*0.65)),
        "c_pillar": (int(left + car_w*0.80), int(cy - car_h*0.50)),
        "headlight": (int(left + car_w*0.04), int(cy - car_h*0.12)),
        "roof_peak": (int(left + car_w*0.52), int(cy - car_h*0.84)),
    }
    bbox = (int(left - car_w*0.06), int(cy - car_h), int(right + 15), int(cy + car_h*0.82))
    
    return img, anchors, bbox


# ============================================================
# SEDAN REAR VIEW
# ============================================================
def render_rear_view(w, h):
    """Render sedan from direct rear view."""
    img = np.zeros((h, w, 4), dtype=np.uint8)
    
    cx, cy = w * 0.50, h * 0.52
    car_w = w * 0.58
    car_h = h * 0.22
    
    left = cx - car_w/2
    right = cx + car_w/2
    
    white = (255, 255, 255, 200)
    dim = (255, 255, 255, 80)
    
    # Body (symmetric from rear)
    body = [
        # Bottom left
        (left + car_w*0.05, cy + car_h*0.50),
        (left + car_w*0.05, cy + car_h*0.15),
        (left + car_w*0.06, cy - car_h*0.05),
        (left + car_w*0.08, cy - car_h*0.15),
        # Left shoulder
        (left + car_w*0.12, cy - car_h*0.30),
        (left + car_w*0.18, cy - car_h*0.45),
        # C-pillar left
        (left + car_w*0.24, cy - car_h*0.60),
        (left + car_w*0.30, cy - car_h*0.72),
        # Roof
        (left + car_w*0.38, cy - car_h*0.82),
        (left + car_w*0.50, cy - car_h*0.85),
        (left + car_w*0.62, cy - car_h*0.82),
        # C-pillar right
        (left + car_w*0.70, cy - car_h*0.72),
        (left + car_w*0.76, cy - car_h*0.60),
        # Right shoulder
        (left + car_w*0.82, cy - car_h*0.45),
        (left + car_w*0.88, cy - car_h*0.30),
        (left + car_w*0.92, cy - car_h*0.15),
        (left + car_w*0.94, cy - car_h*0.05),
        (left + car_w*0.95, cy + car_h*0.15),
        (left + car_w*0.95, cy + car_h*0.50),
    ]
    
    draw_smooth_curve(img, smooth_through_points(body, 35), white, 2)
    
    # Bottom edge
    bottom = [
        (left + car_w*0.05, cy + car_h*0.50),
        (left + car_w*0.15, cy + car_h*0.55),
        (left + car_w*0.50, cy + car_h*0.55),
        (left + car_w*0.85, cy + car_h*0.55),
        (left + car_w*0.95, cy + car_h*0.50),
    ]
    draw_smooth_curve(img, smooth_through_points(bottom, 20), white, 2)
    
    # Rear window
    rw = smooth_through_points([
        (left + car_w*0.20, cy - car_h*0.30),
        (left + car_w*0.28, cy - car_h*0.58),
        (left + car_w*0.36, cy - car_h*0.72),
        (left + car_w*0.50, cy - car_h*0.76),
        (left + car_w*0.64, cy - car_h*0.72),
        (left + car_w*0.72, cy - car_h*0.58),
        (left + car_w*0.80, cy - car_h*0.30),
    ], 25)
    draw_smooth_curve(img, rw, dim, 1)
    
    # Taillights (left)
    tl_l = smooth_through_points([
        (left + car_w*0.08, cy - car_h*0.08),
        (left + car_w*0.22, cy - car_h*0.15),
        (left + car_w*0.22, cy + car_h*0.05),
        (left + car_w*0.08, cy + car_h*0.10),
    ], 15)
    draw_smooth_curve(img, tl_l, dim, 1, closed=True)
    
    # Taillights (right)
    tl_r = smooth_through_points([
        (left + car_w*0.78, cy - car_h*0.15),
        (left + car_w*0.92, cy - car_h*0.08),
        (left + car_w*0.92, cy + car_h*0.10),
        (left + car_w*0.78, cy + car_h*0.05),
    ], 15)
    draw_smooth_curve(img, tl_r, dim, 1, closed=True)
    
    # License plate
    plate = [
        (int(left + car_w*0.35), int(cy + car_h*0.12)),
        (int(left + car_w*0.65), int(cy + car_h*0.12)),
        (int(left + car_w*0.65), int(cy + car_h*0.30)),
        (int(left + car_w*0.35), int(cy + car_h*0.30)),
    ]
    draw_smooth_curve(img, plate, dim, 1, closed=True)
    
    # Bumper line
    bumper = smooth_through_points([
        (left + car_w*0.08, cy + car_h*0.35),
        (left + car_w*0.30, cy + car_h*0.38),
        (left + car_w*0.50, cy + car_h*0.40),
        (left + car_w*0.70, cy + car_h*0.38),
        (left + car_w*0.92, cy + car_h*0.35),
    ], 20)
    draw_smooth_curve(img, bumper, (255, 255, 255, 50), 1)
    
    # Wheels (partial, seen from rear)
    lw_cx = int(left + car_w*0.10)
    lw_cy = int(cy + car_h*0.42)
    rw_cx = int(left + car_w*0.90)
    rw_cy = int(cy + car_h*0.42)
    w_rx, w_ry = int(car_h*0.14), int(car_h*0.16)
    
    draw_ellipse(img, (lw_cx, lw_cy), (w_rx, w_ry), white, 2)
    draw_ellipse(img, (rw_cx, rw_cy), (w_rx, w_ry), white, 2)
    draw_ellipse(img, (lw_cx, lw_cy), (int(w_rx*0.5), int(w_ry*0.5)), dim, 1)
    draw_ellipse(img, (rw_cx, rw_cy), (int(w_rx*0.5), int(w_ry*0.5)), dim, 1)
    
    # Exhaust tips
    cv2.ellipse(img, (int(left+car_w*0.25), int(cy+car_h*0.50)), 
                (int(car_h*0.04), int(car_h*0.03)), 0, 0, 360, dim, 1, cv2.LINE_AA)
    cv2.ellipse(img, (int(left+car_w*0.75), int(cy+car_h*0.50)),
                (int(car_h*0.04), int(car_h*0.03)), 0, 0, 360, dim, 1, cv2.LINE_AA)
    
    img = add_glow(img, radius=5, intensity=0.3)
    
    anchors = {
        "left_wheel": (lw_cx, lw_cy),
        "right_wheel": (rw_cx, rw_cy),
        "left_taillight": (int(left + car_w*0.15), int(cy - car_h*0.02)),
        "right_taillight": (int(left + car_w*0.85), int(cy - car_h*0.02)),
        "roof_center": (int(cx), int(cy - car_h*0.85)),
    }
    bbox = (int(left - 15), int(cy - car_h), int(right + 15), int(cy + car_h*0.70))
    
    return img, anchors, bbox


# ============================================================
# COMMON OVERLAY ELEMENTS
# ============================================================

def add_ui_elements(img, anchors, bbox, label):
    """Add crosshairs, corner brackets, and labels."""
    pil_img = Image.fromarray(img)
    draw = ImageDraw.Draw(pil_img)
    
    # Corner brackets
    x1, y1, x2, y2 = bbox
    bracket = 50
    bc = (255, 255, 255, 130)
    bw = 2
    
    for corner_x, corner_y, dx, dy in [
        (x1, y1, 1, 1), (x2, y1, -1, 1),
        (x1, y2, 1, -1), (x2, y2, -1, -1)
    ]:
        draw.line([(corner_x, corner_y), (corner_x + bracket*dx, corner_y)], fill=bc, width=bw)
        draw.line([(corner_x, corner_y), (corner_x, corner_y + bracket*dy)], fill=bc, width=bw)
    
    # Crosshairs at anchor points
    for name, (ax, ay) in anchors.items():
        size = 14
        gap = 5
        ac = (0, 220, 140, 200)
        
        draw.line([(ax-size, ay), (ax-gap, ay)], fill=ac, width=1)
        draw.line([(ax+gap, ay), (ax+size, ay)], fill=ac, width=1)
        draw.line([(ax, ay-size), (ax, ay-gap)], fill=ac, width=1)
        draw.line([(ax, ay+gap), (ax, ay+size)], fill=ac, width=1)
        
        r = 2
        draw.ellipse([(ax-r, ay-r), (ax+r, ay+r)], fill=ac)
    
    # Label
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
        font_sm = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        font = ImageFont.load_default()
        font_sm = font
    
    # Top label
    label_pos = (WIDTH // 2, int(HEIGHT * 0.10))
    tb = draw.textbbox(label_pos, label, font=font, anchor="mm")
    p = 10
    draw.rounded_rectangle([tb[0]-p, tb[1]-p, tb[2]+p, tb[3]+p], 
                           radius=8, fill=(0, 0, 0, 140))
    draw.text(label_pos, label, fill=(255, 255, 255, 220), font=font, anchor="mm")
    
    # Bottom instruction
    inst_pos = (WIDTH // 2, int(HEIGHT * 0.90))
    inst = "Align vehicle with outline"
    ib = draw.textbbox(inst_pos, inst, font=font_sm, anchor="mm")
    draw.rounded_rectangle([ib[0]-p, ib[1]-p, ib[2]+p, ib[3]+p],
                           radius=6, fill=(0, 0, 0, 120))
    draw.text(inst_pos, inst, fill=(255, 255, 255, 180), font=font_sm, anchor="mm")
    
    # Subtle center crosshair
    ch_color = (255, 255, 255, 20)
    draw.line([(WIDTH//2, 0), (WIDTH//2, HEIGHT)], fill=ch_color, width=1)
    draw.line([(0, HEIGHT//2), (WIDTH, HEIGHT//2)], fill=ch_color, width=1)
    
    return np.array(pil_img)


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  PROFESSIONAL WIREFRAME GENERATOR v2")
    print("  Smooth curves • Glow effect • Clean design")
    print("=" * 60)
    print()
    
    ensure_output_dir()
    
    templates = [
        ("front_left_45", "Front Left 45°", render_front_left_45),
        ("side_driver", "Side Profile", render_side_view),
        ("rear_center", "Rear View", render_rear_view),
    ]
    
    for name, label, render_func in templates:
        print(f"  Rendering: {name}...")
        img, anchors, bbox = render_func(WIDTH, HEIGHT)
        img = add_ui_elements(img, anchors, bbox, label)
        
        # Convert BGRA to RGBA for PIL save
        pil_img = Image.fromarray(img)
        filepath = os.path.join(OUTPUT_DIR, f"{name}.png")
        pil_img.save(filepath, "PNG")
        print(f"    ✓ {filepath}")
    
    print(f"\n✅ Generated {len(templates)} professional templates")
    print(f"   Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
