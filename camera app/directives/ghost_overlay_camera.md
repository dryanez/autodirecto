# Ghost Overlay Camera App — Guided Image Capture

## Directive: Build a "Digital Template" Camera App

### Goal
Build a mobile camera app that overlays semi-transparent "ghost" wireframes on a live camera feed to guide users into taking standardized, perfectly-aligned photos of vehicles. When the real car aligns with the template (>90% alignment score), the app auto-captures.

### Target Industries
- Automotive insurance (photo claims)
- Car sales / merchandising (standardized listings)
- Logistics (fleet documentation)

---

### Inputs
- **Hero Shot Templates**: PNG wireframes for each required angle (defined in `directives/hero_shots.md`)
- **Live Camera Feed**: Device camera preview
- **ML Model**: On-device object detection (YOLO/SSD via CoreML or ML Kit)

### Outputs
- **Captured Images**: Auto-snapped photos when alignment score > 90%
- **Alignment Score**: Real-time percentage shown to user
- **Shot Checklist**: Tracks which hero shots have been completed

---

### Architecture (3-Layer Stack)

| Layer | Component | Details |
|-------|-----------|---------|
| **UI** | Flutter app | Camera preview + ghost overlay stack |
| **Vision** | CoreML (iOS) / ML Kit (Android) | On-device car detection |
| **Alignment** | OpenCV via Python backend or on-device | Contour matching, keypoint alignment |

### Screen Stack (Bottom to Top)
1. **Bottom**: Live Camera Preview
2. **Middle**: PNG wireframe at 30% opacity (the "ghost")
3. **Top**: Dynamic UI — instructions ("Move closer", "Tilt up"), alignment score, green/red border

### Smart Validation — Anchor Points
The alignment engine checks these keypoints on the detected car:
- Center of both wheels
- A-pillar and C-pillar
- Headlights / taillights
- Roofline contour

When anchor points match template coordinates → alignment score > 90% → border turns green → auto-capture.

---

### Tech Stack Decision

**Chosen: Flutter** (cross-platform, fast UI for overlay stack)

| Component | Tool | Rationale |
|-----------|------|-----------|
| Mobile Engine | Flutter | Single codebase iOS+Android, fast Stack widget for overlays |
| Vision | `google_mlkit_object_detection` | On-device, low latency |
| Camera | `camera` package | Native camera access |
| Alignment | OpenCV via `opencv_dart` or custom Dart logic | Contour comparison |
| AR (Phase 2) | ARKit/ARCore via `ar_flutter_plugin` | 3D bounding box on floor |

---

### Phases

#### Phase 1 — MVP (Current)
- [ ] Flutter project scaffold
- [ ] Live camera preview with ghost overlay
- [ ] Basic car detection (bounding box)
- [ ] Manual capture button
- [ ] Hero shot checklist UI

#### Phase 2 — Smart Alignment
- [ ] Keypoint detection for anchor points
- [ ] Real-time alignment score calculation
- [ ] Auto-capture on >90% alignment
- [ ] Dynamic instructions ("Move left", "Step back")

#### Phase 3 — AR Box
- [ ] 3D AR bounding box placed on ground plane
- [ ] User "fills the box" with the car
- [ ] Multi-angle guided walkthrough

---

### Edge Cases & Learnings
- *Add learnings here as the system self-anneals*
- Low light: May need to lower confidence threshold
- Multiple cars in frame: Use largest bounding box
- Partial car visibility: Show "Step back" instruction

---

### Scripts
| Script | Purpose |
|--------|---------|
| `execution/create_flutter_project.sh` | Scaffolds the Flutter project |
| `execution/generate_wireframes.py` | Generates template wireframe PNGs |
| `execution/validate_alignment.py` | Prototype alignment scoring logic |
