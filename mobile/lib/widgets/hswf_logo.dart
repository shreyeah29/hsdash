import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/app_brand.dart';

enum HswfLogoVariant { white, dark }

/// HSWF wordmark from bundled logo assets.
class HswfLogo extends StatelessWidget {
  const HswfLogo({
    super.key,
    this.height = 36,
    this.variant = HswfLogoVariant.white,
    this.framed = false,
  });

  final double height;
  final HswfLogoVariant variant;

  /// Subtle border + shadow so the black logo tile reads on dark screens.
  final bool framed;

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      variant == HswfLogoVariant.white ? AppBrand.logoWhite : AppBrand.logoDark,
      height: height,
      width: height,
      fit: BoxFit.cover,
      filterQuality: FilterQuality.high,
      gaplessPlayback: true,
      errorBuilder: (_, __, ___) => _FallbackWordmark(height: height, variant: variant),
    );

    if (!framed) return image;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(height * 0.22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(height * 0.22),
        child: image,
      ),
    );
  }
}

class _FallbackWordmark extends StatelessWidget {
  const _FallbackWordmark({required this.height, required this.variant});

  final double height;
  final HswfLogoVariant variant;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: height * 2.2,
      child: Center(
        child: Text(
          AppBrand.name,
          style: TextStyle(
            fontSize: height * 0.42,
            fontWeight: FontWeight.w700,
            letterSpacing: 3,
            color: variant == HswfLogoVariant.white ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }
}
