# Hero Shot Definitions

## Standard Vehicle Photo Set

Each vehicle capture session requires the following standardized angles. Templates are stored as PNG wireframes in `assets/templates/`.

### Required Shots (Phase 1 — MVP)

| # | Shot Name | Angle | Template File | Notes |
|---|-----------|-------|---------------|-------|
| 1 | Front Left 45° | 45° from front-left | `front_left_45.png` | The classic "hero" angle for listings |
| 2 | Direct Side (Driver) | 90° driver side | `side_driver.png` | Full profile, wheels visible |
| 3 | Rear Right 45° | 45° from rear-right | `rear_right_45.png` | Opposite diagonal of shot 1 |
| 4 | Direct Rear | 180° dead center | `rear_center.png` | Trunk/hatch, license plate area |
| 5 | Direct Front | 0° dead center | `front_center.png` | Grille, headlights, bumper |

### Extended Shots (Phase 2)

| # | Shot Name | Angle | Template File | Notes |
|---|-----------|-------|---------------|-------|
| 6 | Front Right 45° | 45° from front-right | `front_right_45.png` | |
| 7 | Direct Side (Passenger) | 90° passenger side | `side_passenger.png` | |
| 8 | Rear Left 45° | 45° from rear-left | `rear_left_45.png` | |

### Interior Shots (Phase 3)

| # | Shot Name | Template File | Notes |
|---|-----------|---------------|-------|
| 9 | Dashboard | `interior_dash.png` | Steering wheel, instrument cluster |
| 10 | Rear Seats | `interior_rear.png` | |
| 11 | Trunk / Cargo | `interior_trunk.png` | |

---

### Wireframe Specs
- **Resolution**: 1080 x 1920 (portrait) or 1920 x 1080 (landscape)
- **Color**: White lines on transparent background
- **Line weight**: 3px
- **Anchor markers**: Red dots at keypoints (wheels, pillars, lights)
- **Format**: PNG with alpha channel

### Keypoint Anchors Per Template
Each wireframe must include these anchor coordinates (normalized 0–1):

```
front_left_45:
  - front_wheel_center: [0.30, 0.72]
  - rear_wheel_center: [0.75, 0.72]
  - a_pillar_top: [0.38, 0.35]
  - c_pillar_top: [0.78, 0.38]
  - headlight_center: [0.18, 0.52]
  - roofline_peak: [0.55, 0.28]
```

*Additional keypoint definitions will be added as templates are created.*
