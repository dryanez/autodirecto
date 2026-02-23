import 'package:flutter/material.dart';

/// Visual alignment score indicator — shows how close the car
/// is to matching the template.
class AlignmentIndicator extends StatelessWidget {
  final double score;

  const AlignmentIndicator({super.key, required this.score});

  @override
  Widget build(BuildContext context) {
    final color = _getColor();
    final percentage = (score * 100).toInt();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Score text
          Text(
            '$percentage%',
            style: TextStyle(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: score,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.15),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            score >= 0.90
                ? 'ALIGNED — READY'
                : score >= 0.50
                    ? 'ADJUSTING...'
                    : 'ALIGN VEHICLE',
            style: TextStyle(
              color: color.withOpacity(0.8),
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColor() {
    if (score >= 0.90) return Colors.green;
    if (score >= 0.50) return Colors.amber;
    return Colors.redAccent;
  }
}
