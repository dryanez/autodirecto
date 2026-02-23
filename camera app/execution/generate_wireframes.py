#!/usr/bin/env python3
"""
generate_wireframes.py
======================
Generates placeholder wireframe PNG templates for each hero shot.
These are semi-transparent vehicle outlines used as "ghost overlays"
on the live camera feed.

Uses PIL/Pillow to draw simple vehicle silhouettes with keypoint markers.
Replace these with professional wireframes for production.
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)


# === Configuration ===
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "ghost_overlay_cam", "assets", "templates")
WIDTH = 1080
HEIGHT = 1920
LINE_COLOR = (255, 255, 255, 200)  # White, semi-transparent
ANCHOR_COLOR = (255, 50, 50, 255)  # Red dots for keypoints
LINE_WIDTH = 3
ANCHOR_RADIUS = 8


def ensure_output_dir():
    """Create output directory if it doesn't exist."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")


def draw_front_left_45(draw, w, h):
    """Draw a sedan from front-left 45-degree angle."""
    # Car body outline (simplified polygon)
    body = [
        (w * 0.12, h * 0.58),   # front bumper bottom-left
        (w * 0.15, h * 0.50),   # hood front
        (w * 0.30, h * 0.42),   # hood-windshield junction
        (w * 0.38, h * 0.32),   # A-pillar top
        (w * 0.55, h * 0.28),   # roof peak
        (w * 0.78, h * 0.32),   # C-pillar top
        (w * 0.85, h * 0.42),   # rear window base
        (w * 0.88, h * 0.50),   # trunk
        (w * 0.90, h * 0.58),   # rear bumper
        (w * 0.88, h * 0.72),   # rear wheel arch bottom
        (w * 0.80, h * 0.75),   # undercarriage rear
        (w * 0.68, h * 0.72),   # between wheels
        (w * 0.55, h * 0.75),   # undercarriage mid
        (w * 0.40, h * 0.75),   # undercarriage front
        (w * 0.25, h * 0.72),   # front wheel arch bottom
        (w * 0.15, h * 0.68),   # front bumper bottom
        (w * 0.12, h * 0.58),   # close
    ]
    draw.line(body, fill=LINE_COLOR, width=LINE_WIDTH)

    # Windows
    windshield = [
        (w * 0.32, h * 0.42),
        (w * 0.40, h * 0.34),
        (w * 0.55, h * 0.31),
        (w * 0.50, h * 0.42),
    ]
    draw.line(windshield, fill=LINE_COLOR, width=2)

    rear_window = [
        (w * 0.55, h * 0.42),
        (w * 0.58, h * 0.31),
        (w * 0.76, h * 0.34),
        (w * 0.78, h * 0.42),
    ]
    draw.line(rear_window, fill=LINE_COLOR, width=2)

    # Wheels (ellipses)
    draw.ellipse(
        [w * 0.22, h * 0.66, w * 0.38, h * 0.78],
        outline=LINE_COLOR, width=LINE_WIDTH
    )
    draw.ellipse(
        [w * 0.72, h * 0.66, w * 0.88, h * 0.78],
        outline=LINE_COLOR, width=LINE_WIDTH
    )

    # Keypoint anchors
    anchors = {
        "front_wheel": (w * 0.30, h * 0.72),
        "rear_wheel": (w * 0.80, h * 0.72),
        "a_pillar": (w * 0.38, h * 0.32),
        "c_pillar": (w * 0.78, h * 0.32),
        "headlight": (w * 0.15, h * 0.52),
        "roof_peak": (w * 0.55, h * 0.28),
    }
    for name, (x, y) in anchors.items():
        draw.ellipse(
            [x - ANCHOR_RADIUS, y - ANCHOR_RADIUS, x + ANCHOR_RADIUS, y + ANCHOR_RADIUS],
            fill=ANCHOR_COLOR
        )

    return anchors


def draw_side_profile(draw, w, h):
    """Draw a sedan from direct side view."""
    body = [
        (w * 0.08, h * 0.55),
        (w * 0.10, h * 0.45),
        (w * 0.25, h * 0.42),
        (w * 0.30, h * 0.32),
        (w * 0.70, h * 0.30),
        (w * 0.78, h * 0.40),
        (w * 0.90, h * 0.42),
        (w * 0.92, h * 0.55),
        (w * 0.92, h * 0.65),
        (w * 0.85, h * 0.72),
        (w * 0.75, h * 0.75),
        (w * 0.65, h * 0.72),
        (w * 0.35, h * 0.72),
        (w * 0.25, h * 0.75),
        (w * 0.15, h * 0.72),
        (w * 0.08, h * 0.65),
        (w * 0.08, h * 0.55),
    ]
    draw.line(body, fill=LINE_COLOR, width=LINE_WIDTH)

    # Wheels
    draw.ellipse([w * 0.15, h * 0.66, w * 0.30, h * 0.78], outline=LINE_COLOR, width=LINE_WIDTH)
    draw.ellipse([w * 0.70, h * 0.66, w * 0.85, h * 0.78], outline=LINE_COLOR, width=LINE_WIDTH)

    # Windows
    draw.line([
        (w * 0.32, h * 0.42), (w * 0.35, h * 0.33),
        (w * 0.50, h * 0.31), (w * 0.50, h * 0.42)
    ], fill=LINE_COLOR, width=2)
    draw.line([
        (w * 0.52, h * 0.42), (w * 0.52, h * 0.31),
        (w * 0.68, h * 0.33), (w * 0.72, h * 0.42)
    ], fill=LINE_COLOR, width=2)

    anchors = {
        "front_wheel": (w * 0.225, h * 0.72),
        "rear_wheel": (w * 0.775, h * 0.72),
        "a_pillar": (w * 0.30, h * 0.32),
        "c_pillar": (w * 0.78, h * 0.40),
        "headlight": (w * 0.10, h * 0.50),
        "taillight": (w * 0.92, h * 0.50),
    }
    for name, (x, y) in anchors.items():
        draw.ellipse(
            [x - ANCHOR_RADIUS, y - ANCHOR_RADIUS, x + ANCHOR_RADIUS, y + ANCHOR_RADIUS],
            fill=ANCHOR_COLOR
        )

    return anchors


def draw_rear_view(draw, w, h):
    """Draw a sedan from direct rear view."""
    body = [
        (w * 0.20, h * 0.65),
        (w * 0.20, h * 0.45),
        (w * 0.25, h * 0.38),
        (w * 0.32, h * 0.30),
        (w * 0.68, h * 0.30),
        (w * 0.75, h * 0.38),
        (w * 0.80, h * 0.45),
        (w * 0.80, h * 0.65),
        (w * 0.78, h * 0.72),
        (w * 0.22, h * 0.72),
        (w * 0.20, h * 0.65),
    ]
    draw.line(body, fill=LINE_COLOR, width=LINE_WIDTH)

    # Rear window
    draw.line([
        (w * 0.33, h * 0.38), (w * 0.35, h * 0.32),
        (w * 0.65, h * 0.32), (w * 0.67, h * 0.38)
    ], fill=LINE_COLOR, width=2)

    # Taillights
    draw.rectangle([w * 0.22, h * 0.48, w * 0.30, h * 0.55], outline=LINE_COLOR, width=2)
    draw.rectangle([w * 0.70, h * 0.48, w * 0.78, h * 0.55], outline=LINE_COLOR, width=2)

    # License plate area
    draw.rectangle([w * 0.38, h * 0.58, w * 0.62, h * 0.64], outline=LINE_COLOR, width=2)

    # Wheels (partial, seen from rear)
    draw.ellipse([w * 0.18, h * 0.66, w * 0.30, h * 0.76], outline=LINE_COLOR, width=LINE_WIDTH)
    draw.ellipse([w * 0.70, h * 0.66, w * 0.82, h * 0.76], outline=LINE_COLOR, width=LINE_WIDTH)

    anchors = {
        "left_wheel": (w * 0.24, h * 0.71),
        "right_wheel": (w * 0.76, h * 0.71),
        "left_taillight": (w * 0.26, h * 0.51),
        "right_taillight": (w * 0.74, h * 0.51),
        "roof_center": (w * 0.50, h * 0.30),
    }
    for name, (x, y) in anchors.items():
        draw.ellipse(
            [x - ANCHOR_RADIUS, y - ANCHOR_RADIUS, x + ANCHOR_RADIUS, y + ANCHOR_RADIUS],
            fill=ANCHOR_COLOR
        )

    return anchors


# === Template Definitions ===
TEMPLATES = {
    "front_left_45": {
        "draw_func": draw_front_left_45,
        "label": "Front Left 45°",
    },
    "side_driver": {
        "draw_func": draw_side_profile,
        "label": "Side (Driver)",
    },
    "rear_center": {
        "draw_func": draw_rear_view,
        "label": "Rear Center",
    },
}


def generate_template(name, config):
    """Generate a single wireframe template PNG."""
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw the vehicle wireframe
    anchors = config["draw_func"](draw, WIDTH, HEIGHT)

    # Add label text at top
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
    except (OSError, IOError):
        font = ImageFont.load_default()

    draw.text(
        (WIDTH // 2, 60),
        config["label"],
        fill=(255, 255, 255, 180),
        font=font,
        anchor="mm"
    )

    # Save
    filepath = os.path.join(OUTPUT_DIR, f"{name}.png")
    img.save(filepath, "PNG")
    print(f"  ✓ Generated: {filepath}")

    return anchors


def main():
    print("=== Generating Ghost Overlay Wireframe Templates ===\n")
    ensure_output_dir()

    all_anchors = {}
    for name, config in TEMPLATES.items():
        anchors = generate_template(name, config)
        all_anchors[name] = anchors

    print(f"\n=== Done! Generated {len(TEMPLATES)} templates ===")
    print(f"Output: {OUTPUT_DIR}")

    # Print anchor coordinates for reference
    print("\n--- Anchor Coordinates (normalized) ---")
    for template_name, anchors in all_anchors.items():
        print(f"\n{template_name}:")
        for anchor_name, (x, y) in anchors.items():
            print(f"  {anchor_name}: [{x/WIDTH:.3f}, {y/HEIGHT:.3f}]")


if __name__ == "__main__":
    main()
