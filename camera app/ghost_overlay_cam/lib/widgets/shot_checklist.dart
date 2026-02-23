import 'package:flutter/material.dart';
import '../models/hero_shot.dart';

/// Horizontal scrollable checklist of all hero shots.
/// Shows which shots have been captured and allows quick navigation.
class ShotChecklist extends StatelessWidget {
  final List<HeroShot> heroShots;
  final int currentIndex;
  final ValueChanged<int> onShotSelected;

  const ShotChecklist({
    super.key,
    required this.heroShots,
    required this.currentIndex,
    required this.onShotSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: heroShots.length,
        itemBuilder: (context, index) {
          final shot = heroShots[index];
          final isActive = index == currentIndex;

          return GestureDetector(
            onTap: () => onShotSelected(index),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isActive
                    ? Colors.blueAccent.withOpacity(0.3)
                    : Colors.black45,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isActive
                      ? Colors.blueAccent
                      : shot.isCaptured
                          ? Colors.green
                          : Colors.grey.shade700,
                  width: isActive ? 2 : 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    shot.isCaptured
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: shot.isCaptured ? Colors.green : Colors.grey,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    shot.name,
                    style: TextStyle(
                      color: isActive ? Colors.white : Colors.white70,
                      fontSize: 12,
                      fontWeight:
                          isActive ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
