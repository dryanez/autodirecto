import 'package:flutter/material.dart';
import 'screens/capture_screen.dart';

class GhostOverlayApp extends StatelessWidget {
  const GhostOverlayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ghost Overlay Cam',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueAccent,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const CaptureScreen(),
    );
  }
}
