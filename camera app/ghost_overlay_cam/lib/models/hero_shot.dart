/// Represents a single hero shot template with its wireframe overlay
/// and expected keypoint positions for alignment validation.
class HeroShot {
  final String id;
  final String name;
  final String description;
  final String templateAsset; // Path to the PNG wireframe
  final Map<String, List<double>> keypoints; // Normalized anchor coords
  bool isCaptured;
  String? capturedImagePath;

  HeroShot({
    required this.id,
    required this.name,
    required this.description,
    required this.templateAsset,
    required this.keypoints,
    this.isCaptured = false,
    this.capturedImagePath,
  });
}

/// Predefined hero shots for vehicle photography
class HeroShotTemplates {
  static List<HeroShot> getStandardSet() {
    return [
      HeroShot(
        id: 'front_left_45',
        name: 'Front Left 45°',
        description: 'Classic hero angle — front-left diagonal view',
        templateAsset: 'assets/templates/front_left_45.png',
        keypoints: {
          'front_wheel': [0.300, 0.720],
          'rear_wheel': [0.800, 0.720],
          'a_pillar': [0.380, 0.320],
          'c_pillar': [0.780, 0.320],
          'headlight': [0.150, 0.520],
          'roof_peak': [0.550, 0.280],
        },
      ),
      HeroShot(
        id: 'side_driver',
        name: 'Side (Driver)',
        description: 'Full profile from driver side, both wheels visible',
        templateAsset: 'assets/templates/side_driver.png',
        keypoints: {
          'front_wheel': [0.225, 0.720],
          'rear_wheel': [0.775, 0.720],
          'a_pillar': [0.300, 0.320],
          'c_pillar': [0.780, 0.400],
          'headlight': [0.100, 0.500],
          'taillight': [0.920, 0.500],
        },
      ),
      HeroShot(
        id: 'rear_center',
        name: 'Rear Center',
        description: 'Direct rear view — trunk, taillights, plate area',
        templateAsset: 'assets/templates/rear_center.png',
        keypoints: {
          'left_wheel': [0.240, 0.710],
          'right_wheel': [0.760, 0.710],
          'left_taillight': [0.260, 0.510],
          'right_taillight': [0.740, 0.510],
          'roof_center': [0.500, 0.300],
        },
      ),
    ];
  }
}
