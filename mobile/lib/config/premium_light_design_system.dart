import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Premium warm light design system — Apple / Linear / luxury wedding studio.
abstract final class PremiumLight {
  static const background = Color(0xFFF7F5F2);
  static const surface = Color(0xFFF1ECE6);
  static const card = Color(0xFFFFFFFF);
  static const elevated = Color(0xFFFCFBF9);
  static const textPrimary = Color(0xFF1F1B18);
  static const textSecondary = Color(0xFF5E5750);
  static const textMuted = Color(0xFF8B847D);
  static const border = Color(0xFFE8E0D8);
  static const divider = Color(0xFFECE6E1);
  static const borderInput = Color(0xFFE5DED8);
  static const accent = Color(0xFF8B6A45);
  static const accentSecondary = Color(0xFFB89268);
  static const onAccent = Color(0xFFFFFFFF);
  static const secondaryButton = Color(0xFFEFE7DE);
  static const success = Color(0xFF4F7F5A);
  static const warning = Color(0xFFD59B3A);
  static const error = Color(0xFFC45B52);
  static const info = Color(0xFF7D8FA8);

  static const radiusCard = 22.0;
  static const radiusButton = 16.0;
  static const radiusInput = 16.0;

  static const sectionGap = 28.0;
  static const cardPadding = EdgeInsets.all(22);

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: textPrimary.withValues(alpha: 0.04),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ];

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
        color: color ?? textPrimary,
        height: height,
        letterSpacing: letterSpacing,
      );

  static TextStyle get pageTitle => inter(
        fontSize: 30,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        height: 1.12,
      );

  static TextStyle get sectionHeading => inter(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        height: 1.2,
      );

  static TextStyle get cardTitle => inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        height: 1.25,
      );

  static TextStyle get body => inter(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.45,
      );

  static TextStyle get bodySecondary => inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: textSecondary,
        height: 1.45,
      );

  static TextStyle get caption => inter(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: textMuted,
        height: 1.35,
      );

  static TextStyle get label => inter(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.2,
        color: textMuted,
      );

  static TextTheme get textTheme => TextTheme(
        displayLarge: pageTitle,
        displayMedium: sectionHeading,
        titleLarge: sectionHeading,
        titleMedium: cardTitle,
        titleSmall: cardTitle.copyWith(fontSize: 17),
        bodyLarge: body,
        bodyMedium: bodySecondary,
        bodySmall: caption,
        labelLarge: caption,
        labelMedium: label,
        labelSmall: label,
      );

  static ButtonStyle get filledButton => FilledButton.styleFrom(
        backgroundColor: accent,
        foregroundColor: onAccent,
        minimumSize: const Size.fromHeight(52),
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusButton)),
        textStyle: inter(fontSize: 16, fontWeight: FontWeight.w600),
      );

  static ButtonStyle get secondaryButtonStyle => FilledButton.styleFrom(
        backgroundColor: secondaryButton,
        foregroundColor: accent,
        minimumSize: const Size.fromHeight(52),
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusButton)),
        textStyle: inter(fontSize: 16, fontWeight: FontWeight.w600),
      );

  static InputDecorationTheme get inputTheme => InputDecorationTheme(
        filled: true,
        fillColor: card,
        hintStyle: bodySecondary.copyWith(color: textMuted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusInput),
          borderSide: const BorderSide(color: borderInput),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusInput),
          borderSide: const BorderSide(color: borderInput),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusInput),
          borderSide: const BorderSide(color: accent, width: 1.5),
        ),
      );
}
