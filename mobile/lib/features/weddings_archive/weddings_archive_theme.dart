import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class WeddingsArchiveStyle {
  static TextStyle title(double size, {Color? color}) => GoogleFonts.inter(
        fontSize: size,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
        height: 1.05,
        color: color ?? const Color(0xFF18181B),
      );

  static TextStyle label(Color accent) => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 2,
        color: accent.withValues(alpha: 0.85),
      );

  static TextStyle bodyMuted() => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: const Color(0xFF71717A),
        height: 1.35,
      );

  static BoxDecoration heroDecoration(Color accent) => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accent.withValues(alpha: 0.14),
            const Color(0xFFF8F9FC),
            Colors.white,
          ],
        ),
        border: Border(bottom: BorderSide(color: accent.withValues(alpha: 0.12))),
      );

  static BoxDecoration cardDecoration(Color accent, {bool elevated = true}) => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: accent.withValues(alpha: 0.1)),
        boxShadow: elevated
            ? [
                BoxShadow(
                  color: accent.withValues(alpha: 0.08),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      );
}
