import 'dart:math';

/// Result of an alignment check between detected and template keypoints.
class AlignmentResult {
  final double score; // 0.0 - 1.0
  final String instruction;
  final Map<String, KeypointAlignment> details;
  final bool shouldCapture;

  AlignmentResult({
    required this.score,
    required this.instruction,
    required this.details,
    required this.shouldCapture,
  });
}

/// Alignment info for a single keypoint.
class KeypointAlignment {
  final List<double>? templatePos;
  final List<double>? detectedPos;
  final double? distance;
  final double score;
  final bool isAligned;

  KeypointAlignment({
    this.templatePos,
    this.detectedPos,
    this.distance,
    required this.score,
    required this.isAligned,
  });
}

/// Calculates alignment between detected vehicle keypoints and a template.
///
/// This is the Dart implementation of the logic prototyped in
/// `execution/validate_alignment.py`.
class AlignmentEngine {
  /// Max normalized distance for a keypoint to be considered "aligned"
  static const double maxKeypointDistance = 0.08;

  /// Minimum alignment score to trigger auto-capture
  static const double captureThreshold = 0.90;

  /// Calculate alignment score between detected and template keypoints.
  static AlignmentResult calculate({
    required Map<String, List<double>> templateKeypoints,
    required Map<String, List<double>> detectedKeypoints,
  }) {
    double totalScore = 0.0;
    final details = <String, KeypointAlignment>{};

    for (final entry in templateKeypoints.entries) {
      final kpName = entry.key;
      final templatePos = entry.value;

      if (detectedKeypoints.containsKey(kpName)) {
        final detectedPos = detectedKeypoints[kpName]!;
        final distance = _euclideanDistance(templatePos, detectedPos);
        final kpScore = (1.0 - (distance / maxKeypointDistance)).clamp(0.0, 1.0);

        totalScore += kpScore;
        details[kpName] = KeypointAlignment(
          templatePos: templatePos,
          detectedPos: detectedPos,
          distance: distance,
          score: kpScore,
          isAligned: kpScore > 0.8,
        );
      } else {
        details[kpName] = KeypointAlignment(
          templatePos: templatePos,
          detectedPos: null,
          distance: null,
          score: 0.0,
          isAligned: false,
        );
      }
    }

    final score = templateKeypoints.isNotEmpty
        ? totalScore / templateKeypoints.length
        : 0.0;

    final instruction = _generateInstruction(score, details);
    final shouldCapture = score >= captureThreshold;

    return AlignmentResult(
      score: score,
      instruction: instruction,
      details: details,
      shouldCapture: shouldCapture,
    );
  }

  static double _euclideanDistance(List<double> p1, List<double> p2) {
    return sqrt(pow(p1[0] - p2[0], 2) + pow(p1[1] - p2[1], 2));
  }

  static String _generateInstruction(
      double score, Map<String, KeypointAlignment> details) {
    if (score >= 0.90) {
      return '✅ Perfect! Hold still...';
    }
    if (score >= 0.75) {
      return 'Almost there! Fine-tune your position.';
    }

    // Find worst-aligned keypoint to suggest correction
    String? worstKp;
    double worstScore = 1.0;
    for (final entry in details.entries) {
      if (entry.value.score < worstScore && entry.value.detectedPos != null) {
        worstScore = entry.value.score;
        worstKp = entry.key;
      }
    }

    if (worstKp != null && details[worstKp]!.detectedPos != null) {
      final tPos = details[worstKp]!.templatePos!;
      final dPos = details[worstKp]!.detectedPos!;
      final dx = tPos[0] - dPos[0];
      final dy = tPos[1] - dPos[1];
      final label = worstKp.replaceAll('_', ' ');

      if (dx.abs() > dy.abs()) {
        final direction = dx > 0 ? 'right' : 'left';
        return 'Move $direction — align the $label';
      } else {
        final direction = dy > 0 ? 'back' : 'closer';
        return 'Step $direction — align the $label';
      }
    }

    // Missing keypoints
    final missing = details.entries
        .where((e) => e.value.detectedPos == null)
        .map((e) => e.key.replaceAll('_', ' '))
        .toList();
    if (missing.isNotEmpty) {
      return "Can't see: ${missing.join(', ')}. Adjust your angle.";
    }

    return 'Align the vehicle with the overlay.';
  }
}
