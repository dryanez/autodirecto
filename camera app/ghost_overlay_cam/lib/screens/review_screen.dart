import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import '../models/hero_shot.dart';

/// Review screen — shows all captured photos in a grid.
class ReviewScreen extends StatelessWidget {
  final List<HeroShot> heroShots;

  const ReviewScreen({super.key, required this.heroShots});

  @override
  Widget build(BuildContext context) {
    final captured = heroShots.where((s) => s.isCaptured).toList();

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('Review (${captured.length}/${heroShots.length})'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          if (captured.length == heroShots.length)
            TextButton.icon(
              onPressed: () => _exportAll(context),
              icon: const Icon(Icons.upload, color: Colors.green),
              label: const Text('Export', style: TextStyle(color: Colors.green)),
            ),
        ],
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(8),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 3 / 4,
        ),
        itemCount: heroShots.length,
        itemBuilder: (context, index) {
          final shot = heroShots[index];
          return _buildShotCard(context, shot, index);
        },
      ),
    );
  }

  Widget _buildShotCard(BuildContext context, HeroShot shot, int index) {
    return GestureDetector(
      onTap: shot.isCaptured
          ? () => _viewFullscreen(context, shot)
          : null,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey.shade900,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: shot.isCaptured ? Colors.green : Colors.grey.shade700,
            width: 2,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Image or placeholder
              if (shot.isCaptured && shot.capturedImagePath != null)
                kIsWeb
                    ? Image.network(
                        shot.capturedImagePath!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _capturedPlaceholder(),
                      )
                    : Image.network(
                        shot.capturedImagePath!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _capturedPlaceholder(),
                      )
              else
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.camera_alt_outlined,
                        color: Colors.grey.shade600,
                        size: 40,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Not captured',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),

              // Label overlay
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withOpacity(0.8),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shot.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(
                            shot.isCaptured
                                ? Icons.check_circle
                                : Icons.radio_button_unchecked,
                            color: shot.isCaptured
                                ? Colors.green
                                : Colors.grey,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            shot.isCaptured ? 'Done' : 'Pending',
                            style: TextStyle(
                              color: shot.isCaptured
                                  ? Colors.green
                                  : Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _viewFullscreen(BuildContext context, HeroShot shot) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            title: Text(shot.name),
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
          ),
          body: Center(
            child: InteractiveViewer(
              child: Image.network(
                shot.capturedImagePath!,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => _capturedPlaceholder(),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _exportAll(BuildContext context) {
    // Phase 1: Simple notification
    // Phase 2: Upload to cloud storage / API
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📤 Export functionality coming in Phase 2!'),
        backgroundColor: Colors.blueAccent,
      ),
    );
  }

  Widget _capturedPlaceholder() {
    return Container(
      color: Colors.green.shade900,
      child: const Center(
        child: Icon(Icons.check_circle, color: Colors.green, size: 48),
      ),
    );
  }
}
