import 'package:flutter/material.dart';
import 'package:hsdash_mobile/home_screen.dart';
import 'package:video_player/video_player.dart';

class SplashVideoScreen extends StatefulWidget {
  const SplashVideoScreen({super.key});

  @override
  State<SplashVideoScreen> createState() => _SplashVideoScreenState();
}

class _SplashVideoScreenState extends State<SplashVideoScreen> {
  static const _assetPath = 'assets/videos/intro.mp4';

  VideoPlayerController? _controller;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    final controller = VideoPlayerController.asset(_assetPath);
    _controller = controller;

    try {
      await controller.initialize();
      if (!mounted) return;

      await controller.setVolume(1.0);
      controller.setLooping(false);
      controller.addListener(_onPlaybackUpdate);
      await controller.play();
      setState(() {});
    } catch (_) {
      await _handleLoadFailure();
    }
  }

  void _onPlaybackUpdate() {
    final controller = _controller;
    if (controller == null || _navigated || !controller.value.isInitialized) {
      return;
    }

    final duration = controller.value.duration;
    final position = controller.value.position;
    if (duration.inMilliseconds > 0 &&
        position.inMilliseconds >= duration.inMilliseconds - 100) {
      _goHome();
    }
  }

  Future<void> _handleLoadFailure() async {
    if (_navigated || !mounted) return;
    await Future<void>.delayed(const Duration(seconds: 2));
    if (mounted) _goHome();
  }

  void _goHome() {
    if (_navigated || !mounted) return;
    _navigated = true;
    _controller?.removeListener(_onPlaybackUpdate);

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const HomeScreen()),
    );
  }

  @override
  void dispose() {
    _controller?.removeListener(_onPlaybackUpdate);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;

    return Scaffold(
      backgroundColor: Colors.black,
      body: controller != null && controller.value.isInitialized
          ? SizedBox.expand(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: controller.value.size.width,
                  height: controller.value.size.height,
                  child: VideoPlayer(controller),
                ),
              ),
            )
          : const SizedBox.shrink(),
    );
  }
}
