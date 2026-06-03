import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';

/// Full-screen photo background with blur + tint for auth screens.
class AuthScreenBackground extends StatelessWidget {
  const AuthScreenBackground({
    super.key,
    required this.imageAsset,
    required this.child,
    this.tintTop = const Color(0x99000000),
    this.tintBottom = const Color(0xCC000000),
    this.blurSigma = 10,
    this.imageAlignment = Alignment.center,
  });

  final String imageAsset;
  final Widget child;
  final Color tintTop;
  final Color tintBottom;
  final double blurSigma;
  final Alignment imageAlignment;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ImageFiltered(
          imageFilter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: Image.asset(
            imageAsset,
            fit: BoxFit.cover,
            alignment: imageAlignment,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF1E1B4B)),
          ),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [tintTop, tintBottom],
              stops: const [0.2, 1.0],
            ),
          ),
        ),
        child,
      ],
    );
  }
}

/// Frosted card for forms on top of [AuthScreenBackground].
class AuthGlassCard extends StatelessWidget {
  const AuthGlassCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return FrostedGlass(
      borderRadius: 22,
      blurSigma: 20,
      tint: const Color(0x61000000),
      padding: const EdgeInsets.fromLTRB(24, 26, 24, 24),
      child: child,
    );
  }
}
