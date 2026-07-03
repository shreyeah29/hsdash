import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/splash/splash_video_screen.dart';
import 'package:hsdash_mobile/home_screen.dart';

/// Boots auth during the splash video, then swaps to the main app instantly.
class AppRoot extends ConsumerStatefulWidget {
  const AppRoot({super.key});

  @override
  ConsumerState<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends ConsumerState<AppRoot> {
  bool _splashComplete = false;

  @override
  void initState() {
    super.initState();
    ref.read(authControllerProvider.notifier).ensureBootstrapped();
  }

  void _onSplashComplete() {
    if (!mounted || _splashComplete) return;
    setState(() => _splashComplete = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_splashComplete) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: SplashVideoScreen(onComplete: _onSplashComplete),
      );
    }
    return const HomeScreen();
  }
}
