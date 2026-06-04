import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Inter-based type for admin premium screens (home, deadlines).
abstract final class AdminHomeTypography {
  static TextStyle inter({
    required double fontSize,
    FontWeight fontWeight = FontWeight.w500,
    Color? color,
    double? height,
    double? letterSpacing,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color ?? AdminHomePalette.text,
        height: height,
        letterSpacing: letterSpacing,
      );
}

/// Premium visual tokens for the admin home tab only.
abstract final class AdminHomePalette {
  static const background = Color(0xFF0B0D11);
  static const surface = Color(0xFF131720);
  static const card = Color(0xFF181D28);
  static const accent = Color(0xFF8B5CF6);
  static const text = Color(0xFFF4F4F5);
  static const textSecondary = Color(0xFF9EA3B0);

  static const radiusLg = 28.0;
  static const radiusMd = 20.0;
  static const radiusSm = 14.0;

  static List<BoxShadow> get elevationDeep => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.55),
          blurRadius: 40,
          offset: const Offset(0, 18),
        ),
        BoxShadow(
          color: accent.withValues(alpha: 0.08),
          blurRadius: 48,
          offset: const Offset(0, 8),
        ),
      ];

  static TextStyle get editorialLabel => const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 2.2,
        color: textSecondary,
        height: 1.3,
      );

  static TextStyle get editorialTitle => const TextStyle(
        fontSize: 26,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: text,
        height: 1.15,
      );

  /// Hero statement — production runway for today.
  static TextStyle get runwayHero => const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
        color: textSecondary,
        height: 1.35,
      );

  static TextStyle get runwayHeroEmphasis => const TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
        color: text,
        height: 1.08,
      );

  static TextStyle get editorialMeta => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.6,
        color: textSecondary,
        height: 1.4,
      );

  static TextStyle get statValue => const TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -1,
        color: text,
        height: 1,
      );

  static TextStyle get statLabel => const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.4,
        color: textSecondary,
        height: 1.2,
      );

  static TextStyle get scheduleTime => const TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: text,
        height: 1.1,
      );

  static TextStyle get sectionTitle => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.8,
        color: textSecondary,
      );
}

/// Frosted elevated surface — no hard borders.
class AdminHomeSurface extends StatelessWidget {
  const AdminHomeSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.radius = AdminHomePalette.radiusMd,
    this.blur = false,
    this.color,
  });

  final Widget child;
  final EdgeInsets padding;
  final double radius;
  final bool blur;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final fill = color ?? AdminHomePalette.card.withValues(alpha: blur ? 0.65 : 0.92);

    Widget body = Container(
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: fill,
        boxShadow: AdminHomePalette.elevationDeep,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            fill,
            AdminHomePalette.surface.withValues(alpha: 0.95),
          ],
        ),
      ),
      child: child,
    );

    if (blur) {
      body = ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: body,
        ),
      );
    } else {
      body = ClipRRect(borderRadius: BorderRadius.circular(radius), child: body);
    }

    return body;
  }
}
