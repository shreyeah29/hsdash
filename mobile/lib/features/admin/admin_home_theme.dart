import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/admin/pixel_snow_background.dart';

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

/// Premium visual tokens for admin screens — studio or wedding (light).
abstract final class AdminHomePalette {
  static AdminPaletteTokens _tokens = AdminPaletteTokens.wedding;

  static void apply(AdminPaletteTokens tokens) => _tokens = tokens;

  static Color get background => _tokens.background;
  static Color get surface => _tokens.surface;
  static Color get card => _tokens.card;
  static Color get lightSurface => _tokens.lightSurface;
  static Color get elevated => _tokens.lightSurface;
  static Color get accent => _tokens.accent;
  static Color get bronze => _tokens.bronze;
  static Color get ivory => _tokens.ivory;
  static Color get text => _tokens.text;
  static Color get textSecondary => _tokens.textSecondary;
  static Color get textMuted => isStudio ? _tokens.textSecondary : _tokens.bronze;
  static Color get border => _tokens.border;
  static Color get onAccent => _tokens.onAccent;
  static Color get success => _tokens.success;
  static Color get warning => _tokens.warning;
  static Color get error => _tokens.error;
  static Color get delayed => _tokens.delayed;
  static Color get info => PremiumLight.info;
  static bool get isDark => _tokens.isStudio;
  static bool get isStudio => _tokens.isStudio;
  static bool get lightStatusBar => _tokens.lightStatusBar;
  static Color get heroGradientEnd => _tokens.heroGradientEnd;
  static Color get backdropAccent => _tokens.backdropAccent;

  static Color get divider => isStudio ? border.withValues(alpha: 0.22) : PremiumLight.divider;

  static Color get cardBorder => isStudio ? border.withValues(alpha: 0.22) : PremiumLight.border;

  static const radiusLg = 28.0;
  static double get radiusMd => isStudio ? 20.0 : PremiumLight.radiusCard;
  static double get radiusCard => isStudio ? 20.0 : PremiumLight.radiusCard;
  static const radiusSm = 14.0;

  static EdgeInsets get cardPadding =>
      isStudio ? const EdgeInsets.all(20) : PremiumLight.cardPadding;

  static List<BoxShadow> get elevationDeep {
    if (isStudio) {
      return [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.35),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ];
    }
    return PremiumLight.cardShadow;
  }

  static TextStyle get editorialLabel => isStudio
      ? TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 2.2,
          color: textSecondary,
          height: 1.3,
        )
      : PremiumLight.label.copyWith(letterSpacing: 1.2);

  static TextStyle get editorialTitle => isStudio
      ? TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
          color: text,
          height: 1.15,
        )
      : PremiumLight.cardTitle;

  static TextStyle get sectionHeading => isStudio
      ? editorialTitle.copyWith(fontSize: 22)
      : PremiumLight.sectionHeading;

  static TextStyle get runwayHero => isStudio
      ? TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
          color: textSecondary,
          height: 1.35,
        )
      : PremiumLight.bodySecondary;

  static TextStyle get runwayHeroEmphasis => isStudio
      ? TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.8,
          color: text,
          height: 1.08,
        )
      : PremiumLight.pageTitle.copyWith(fontSize: 28, letterSpacing: -0.6);

  static TextStyle get editorialMeta => isStudio
      ? TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.4,
          color: textSecondary,
          height: 1.4,
        )
      : PremiumLight.bodySecondary;

  static TextStyle get statValue => TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -1,
        color: text,
        height: 1,
      );

  static TextStyle get statLabel => isStudio
      ? TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.4,
          color: textSecondary,
          height: 1.2,
        )
      : PremiumLight.caption.copyWith(fontSize: 12, letterSpacing: 1.2);

  static TextStyle get scheduleTime => TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: text,
        height: 1.1,
      );

  static TextStyle get sectionTitle => isStudio
      ? TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          letterSpacing: 2.4,
          color: accent,
        )
      : PremiumLight.label.copyWith(color: accent, letterSpacing: 1.2);

  static TextStyle get pageTitle => isStudio
      ? TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.8,
          color: text,
          height: 1.08,
        )
      : PremiumLight.pageTitle;

  static TextStyle get body => isStudio
      ? AdminHomeTypography.inter(fontSize: 15, fontWeight: FontWeight.w500)
      : PremiumLight.body;

  static Color statusColor(String status) {
    final s = status.toUpperCase();
    if (s == 'COMPLETED') return success;
    if (s == 'DELAYED') return delayed;
    if (s == 'IN_PROGRESS') return accent;
    return textMuted;
  }

  /// Warm editorial fade — wedding light only; studio stays flat cinematic.
  static LinearGradient get pageGradient {
    if (isStudio) {
      return LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [background, surface],
      );
    }
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFFF5EDE4),
        Color(0xFFF7F5F2),
        Color(0xFFF1ECE6),
        Color(0xFFEDE6DC),
      ],
      stops: [0.0, 0.32, 0.68, 1.0],
    );
  }
}

/// Full-screen warm gradient behind admin content (wedding mode).
class AdminPageBackground extends StatelessWidget {
  const AdminPageBackground({
    super.key,
    required this.child,
    this.layerBackdrop = true,
  });

  final Widget child;

  /// When false, studio mode skips the shared snow layer (shell provides it).
  final bool layerBackdrop;

  @override
  Widget build(BuildContext context) {
    if (AdminHomePalette.isStudio) {
      if (!layerBackdrop) {
        return child;
      }
      return Stack(
        fit: StackFit.expand,
        children: [
          AdminStudioBackdrop(backgroundColor: AdminHomePalette.background),
          Positioned.fill(child: child),
        ],
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(gradient: AdminHomePalette.pageGradient),
          child: const SizedBox.expand(),
        ),
        Positioned(
          top: -100,
          right: -70,
          child: _WarmGlow(
            size: 300,
            color: AdminHomePalette.ivory.withValues(alpha: 0.16),
          ),
        ),
        Positioned(
          bottom: -80,
          left: -50,
          child: _WarmGlow(
            size: 260,
            color: AdminHomePalette.accent.withValues(alpha: 0.10),
          ),
        ),
        Positioned(
          top: MediaQuery.sizeOf(context).height * 0.42,
          left: -90,
          child: _WarmGlow(
            size: 220,
            color: const Color(0xFFD4C4B0).withValues(alpha: 0.14),
          ),
        ),
        Positioned.fill(child: child),
      ],
    );
  }
}

class _WarmGlow extends StatelessWidget {
  const _WarmGlow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [
            BoxShadow(color: color, blurRadius: 80, spreadRadius: 20),
          ],
        ),
      ),
    );
  }
}

/// Frosted elevated surface — premium card for light, cinematic for studio.
class AdminHomeSurface extends StatelessWidget {
  const AdminHomeSurface({
    super.key,
    required this.child,
    this.padding,
    this.radius,
    this.blur = false,
    this.color,
    this.elevated = false,
  });

  final Widget child;
  final EdgeInsets? padding;
  final double? radius;
  final bool blur;
  final Color? color;
  final bool elevated;

  @override
  Widget build(BuildContext context) {
    final studio = AdminHomePalette.isStudio;
    final fill = color ?? (elevated && !studio ? AdminHomePalette.elevated : AdminHomePalette.card);
    final corner = radius ?? AdminHomePalette.radiusCard;
    final inset = padding ?? AdminHomePalette.cardPadding;

    Widget body = Container(
      padding: inset,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(corner),
        color: fill,
        boxShadow: AdminHomePalette.elevationDeep,
        border: Border.all(color: AdminHomePalette.cardBorder, width: 1),
      ),
      child: child,
    );

    if (blur) {
      body = ClipRRect(
        borderRadius: BorderRadius.circular(corner),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: body,
        ),
      );
    }

    return body;
  }
}
