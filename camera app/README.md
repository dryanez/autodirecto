# Ghost Overlay Cam 📸

**Guided Image Capture** — A mobile camera app that overlays semi-transparent vehicle wireframes ("ghosts") on the live camera feed to ensure standardized, perfectly-aligned vehicle photography.

## How It Works

1. **Open the app** → Camera preview with a ghost wireframe overlay
2. **Align the vehicle** → Match the real car to the template outline
3. **Capture** → Tap the shutter (Phase 2: auto-capture when alignment > 90%)
4. **Next shot** → App advances to the next angle automatically
5. **Review** → See all captured shots in a grid

## Architecture

```
┌─────────────────────────────────┐
│  Layer 3: Dynamic UI            │  ← Instructions, score, buttons
├─────────────────────────────────┤
│  Layer 2: Ghost Wireframe (30%) │  ← Semi-transparent PNG template
├─────────────────────────────────┤
│  Layer 1: Live Camera Preview   │  ← Device camera feed
└─────────────────────────────────┘
```

## Project Structure

```
camera app/
├── agent.md                    # Agent operating instructions
├── directives/                 # SOPs (what to do)
│   ├── ghost_overlay_camera.md # Main project directive
│   └── hero_shots.md           # Shot definitions & keypoints
├── execution/                  # Deterministic scripts (doing the work)
│   ├── create_flutter_project.sh
│   ├── generate_wireframes.py
│   └── validate_alignment.py
├── ghost_overlay_cam/          # Flutter app
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart
│   │   ├── models/
│   │   │   ├── hero_shot.dart
│   │   │   └── alignment_result.dart
│   │   ├── screens/
│   │   │   ├── capture_screen.dart
│   │   │   └── review_screen.dart
│   │   └── widgets/
│   │       ├── ghost_overlay.dart
│   │       ├── alignment_indicator.dart
│   │       └── shot_checklist.dart
│   ├── assets/templates/       # Ghost wireframe PNGs
│   └── pubspec.yaml
└── .tmp/                       # Temporary processing files
```

## Setup

### Prerequisites
- **Flutter SDK** ≥ 3.0 — [Install Flutter](https://flutter.dev/docs/get-started/install)
- **Xcode** (for iOS) or **Android Studio** (for Android)
- **Python 3.8+** with Pillow (for wireframe generation)

### Quick Start

```bash
# 1. Install Flutter (if not installed)
# Follow: https://flutter.dev/docs/get-started/install

# 2. Generate wireframe templates
pip install Pillow
python execution/generate_wireframes.py

# 3. Set up the Flutter project
cd ghost_overlay_cam
flutter pub get

# 4. iOS: Add camera permissions to Info.plist
# Add the keys from ios/Runner/Info.plist.permissions to your Info.plist

# 5. Run!
flutter run
```

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Camera + ghost overlay + manual capture | ✅ Built |
| 1 | Hero shot checklist | ✅ Built |
| 1 | Review screen | ✅ Built |
| 2 | ML object detection (car in frame) | 🔜 |
| 2 | Real-time keypoint alignment scoring | 🔜 |
| 2 | Auto-capture on >90% alignment | 🔜 |
| 2 | Dynamic instructions ("Move left") | 🔜 |
| 3 | AR 3D bounding box on ground | 🔜 |
| 3 | Cloud export | 🔜 |

## Industry Use Cases
- **Insurance**: Standardized damage photo claims (GEICO, Allianz style)
- **Car Sales**: Consistent listing photos (Carvana, Auto1 style)
- **Fleet/Logistics**: Vehicle condition documentation
