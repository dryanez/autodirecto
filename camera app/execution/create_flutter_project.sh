#!/bin/bash
# ============================================================
# create_flutter_project.sh
# Scaffolds the Ghost Overlay Camera Flutter project
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FLUTTER_DIR="$PROJECT_DIR/ghost_overlay_cam"

echo "=== Ghost Overlay Camera — Flutter Project Setup ==="

# 1. Check Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "ERROR: Flutter not found. Install from https://flutter.dev/docs/get-started/install"
    exit 1
fi

echo "Flutter found: $(flutter --version | head -1)"

# 2. Create Flutter project
if [ -d "$FLUTTER_DIR" ]; then
    echo "Project directory already exists at $FLUTTER_DIR — skipping creation."
else
    echo "Creating Flutter project..."
    flutter create --org com.wiackowska --project-name ghost_overlay_cam "$FLUTTER_DIR"
fi

# 3. Navigate to project
cd "$FLUTTER_DIR"

# 4. Add dependencies
echo "Adding dependencies..."
flutter pub add camera
flutter pub add google_mlkit_object_detection
flutter pub add image
flutter pub add path_provider
flutter pub add permission_handler

# 5. Create asset directories
echo "Creating asset directories..."
mkdir -p assets/templates
mkdir -p assets/models

# 6. Update pubspec.yaml to include assets
if ! grep -q "assets/templates/" pubspec.yaml; then
    echo "Adding asset declarations to pubspec.yaml..."
    # We'll add assets section — the Flutter app code handles this
    cat >> pubspec.yaml << 'EOF'

  # Ghost Overlay Camera assets
  assets:
    - assets/templates/
    - assets/models/
EOF
fi

echo ""
echo "=== Setup Complete ==="
echo "Project created at: $FLUTTER_DIR"
echo ""
echo "Next steps:"
echo "  1. Generate wireframe templates: python execution/generate_wireframes.py"
echo "  2. Run the app: cd ghost_overlay_cam && flutter run"
echo ""
