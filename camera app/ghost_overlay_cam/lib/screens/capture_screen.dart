import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/hero_shot.dart';
import '../widgets/ghost_overlay.dart';
import '../widgets/alignment_indicator.dart';
import '../widgets/shot_checklist.dart';
import 'review_screen.dart';

/// Main capture screen with live camera + ghost overlay stack.
///
/// Screen Stack (bottom to top):
/// 1. Live Camera Preview
/// 2. Ghost wireframe at 30% opacity
/// 3. Dynamic UI (instructions, alignment score, capture button)
class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  bool _isInitialized = false;
  bool _hasPermission = false;
  bool _isCapturing = false;

  // Hero shot management
  late List<HeroShot> _heroShots;
  int _currentShotIndex = 0;
  HeroShot get _currentShot => _heroShots[_currentShotIndex];

  // Alignment state (Phase 1: manual, Phase 2: ML-driven)
  double _alignmentScore = 0.0;
  String _instruction = 'Align the vehicle with the overlay';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _heroShots = HeroShotTemplates.getStandardSet();
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Handle app lifecycle for camera resource management
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    // Request camera permission
    final status = await Permission.camera.request();
    if (!status.isGranted) {
      setState(() => _hasPermission = false);
      return;
    }
    setState(() => _hasPermission = true);

    // Get available cameras
    _cameras = await availableCameras();
    if (_cameras.isEmpty) return;

    // Initialize with the rear camera
    final rearCamera = _cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => _cameras.first,
    );

    _cameraController = CameraController(
      rearCamera,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    try {
      await _cameraController!.initialize();
      if (mounted) {
        setState(() => _isInitialized = true);
      }
    } catch (e) {
      debugPrint('Camera initialization error: $e');
    }
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null ||
        !_cameraController!.value.isInitialized ||
        _isCapturing) {
      return;
    }

    setState(() => _isCapturing = true);

    try {
      final XFile photo = await _cameraController!.takePicture();

      String savedPath = photo.path;

      // On native platforms, save to app documents
      if (!kIsWeb) {
        final dir = await getApplicationDocumentsDirectory();
        savedPath = '${dir.path}/captures/${_currentShot.id}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      }

      // Mark shot as captured
      setState(() {
        _currentShot.isCaptured = true;
        _currentShot.capturedImagePath = savedPath;
        _isCapturing = false;
      });

      // Show success feedback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ ${_currentShot.name} captured!'),
            backgroundColor: Colors.green.shade700,
            duration: const Duration(seconds: 2),
          ),
        );
      }

      // Auto-advance to next uncaptured shot
      _advanceToNextShot();
    } catch (e) {
      debugPrint('Capture error: $e');
      setState(() => _isCapturing = false);
    }
  }

  void _advanceToNextShot() {
    // Find the next uncaptured shot
    for (int i = 0; i < _heroShots.length; i++) {
      final nextIndex = (_currentShotIndex + 1 + i) % _heroShots.length;
      if (!_heroShots[nextIndex].isCaptured) {
        setState(() {
          _currentShotIndex = nextIndex;
          _instruction = 'Align for: ${_currentShot.name}';
        });
        return;
      }
    }

    // All shots captured — navigate to review
    _navigateToReview();
  }

  void _navigateToReview() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ReviewScreen(heroShots: _heroShots),
      ),
    );
  }

  void _selectShot(int index) {
    setState(() {
      _currentShotIndex = index;
      _instruction = 'Align for: ${_currentShot.name}';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (!_hasPermission) {
      return _buildPermissionDenied();
    }
    if (!_isInitialized || _cameraController == null) {
      return _buildLoading();
    }
    return _buildCaptureStack();
  }

  /// The main 3-layer stack: Camera → Ghost Overlay → UI
  Widget _buildCaptureStack() {
    return Stack(
      fit: StackFit.expand,
      children: [
        // === LAYER 1: Live Camera Preview ===
        Positioned.fill(
          child: CameraPreview(_cameraController!),
        ),

        // === LAYER 2: Ghost Wireframe Overlay (30% opacity) ===
        Positioned.fill(
          child: GhostOverlay(
            templateAsset: _currentShot.templateAsset,
            alignmentScore: _alignmentScore,
          ),
        ),

        // === LAYER 3: Dynamic UI ===
        Positioned.fill(
          child: SafeArea(
            child: Column(
              children: [
                // Top bar: shot name + progress
                _buildTopBar(),

                // Instruction text
                _buildInstructionBanner(),

                const Spacer(),

                // Bottom: alignment indicator + capture button + checklist
                _buildBottomControls(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopBar() {
    final capturedCount = _heroShots.where((s) => s.isCaptured).length;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Current shot indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${_currentShotIndex + 1}/${_heroShots.length}  ${_currentShot.name}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Spacer(),
          // Progress
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: capturedCount == _heroShots.length
                  ? Colors.green.shade700.withOpacity(0.8)
                  : Colors.black54,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '$capturedCount/${_heroShots.length} done',
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _alignmentScore >= 0.9
                ? Icons.check_circle
                : Icons.info_outline,
            color: _alignmentScore >= 0.9 ? Colors.green : Colors.white70,
            size: 20,
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              _instruction,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Alignment score indicator
        AlignmentIndicator(score: _alignmentScore),

        const SizedBox(height: 16),

        // Capture button + navigation
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Previous shot
            IconButton(
              onPressed: _currentShotIndex > 0
                  ? () => _selectShot(_currentShotIndex - 1)
                  : null,
              icon: const Icon(Icons.arrow_back_ios),
              color: Colors.white,
              iconSize: 28,
            ),

            // Capture button
            GestureDetector(
              onTap: _isCapturing ? null : _capturePhoto,
              child: Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _currentShot.isCaptured
                        ? Colors.green
                        : Colors.white,
                    width: 4,
                  ),
                ),
                child: Container(
                  margin: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isCapturing
                        ? Colors.grey
                        : _currentShot.isCaptured
                            ? Colors.green
                            : Colors.white,
                  ),
                  child: _isCapturing
                      ? const Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                        )
                      : _currentShot.isCaptured
                          ? const Icon(Icons.check, color: Colors.white, size: 32)
                          : null,
                ),
              ),
            ),

            // Next shot
            IconButton(
              onPressed: _currentShotIndex < _heroShots.length - 1
                  ? () => _selectShot(_currentShotIndex + 1)
                  : null,
              icon: const Icon(Icons.arrow_forward_ios),
              color: Colors.white,
              iconSize: 28,
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Shot checklist
        ShotChecklist(
          heroShots: _heroShots,
          currentIndex: _currentShotIndex,
          onShotSelected: _selectShot,
        ),

        const SizedBox(height: 16),

        // Review button (when all captured)
        if (_heroShots.every((s) => s.isCaptured))
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ElevatedButton.icon(
              onPressed: _navigateToReview,
              icon: const Icon(Icons.preview),
              label: const Text('Review All Shots'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade700,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPermissionDenied() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.camera_alt_outlined, size: 64, color: Colors.white54),
          const SizedBox(height: 16),
          const Text(
            'Camera permission required',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => openAppSettings(),
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: Colors.white),
          SizedBox(height: 16),
          Text(
            'Initializing camera...',
            style: TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}
