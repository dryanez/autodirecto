import 'package:flutter/material.dart';

/// The ghost wireframe overlay — Layer 2 of the capture stack.
///
/// Displays a semi-transparent PNG wireframe on top of the camera preview.
/// Border color changes based on alignment score:
/// - Red: Poor alignment (< 50%)
/// - Yellow: Getting closer (50-89%)
/// - Green: Ready to capture (>= 90%)
class GhostOverlay extends StatelessWidget {
  final String templateAsset;
  final double alignmentScore;
  final double opacity;

  const GhostOverlay({
    super.key,
    required this.templateAsset,
    this.alignmentScore = 0.0,
    this.opacity = 0.30,
  });

  @override
  Widget build(BuildContext context) {
    // Determine border color based on alignment
    final borderColor = _getBorderColor();

    return IgnorePointer(
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: borderColor.withOpacity(0.6),
            width: 3,
          ),
        ),
        child: Opacity(
          opacity: opacity,
          child: Image.asset(
            templateAsset,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
              // Fallback if template image not found
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.broken_image_outlined,
                      color: Colors.white.withOpacity(0.3),
                      size: 48,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Template not loaded',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.3),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Color _getBorderColor() {
    if (alignmentScore >= 0.90) return Colors.green;
    if (alignmentScore >= 0.50) return Colors.yellow;
    return Colors.red;
  }
}
