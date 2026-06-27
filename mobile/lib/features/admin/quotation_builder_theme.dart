import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';

/// Warm editorial quotation builder — aligned with premium light system.
abstract final class QuotationBuilderPalette {
  static const background = PremiumLight.background;
  static const text = PremiumLight.textPrimary;
  static const textMuted = PremiumLight.textMuted;
  static const accent = PremiumLight.accent;
  static const border = PremiumLight.border;
  static const borderInput = PremiumLight.borderInput;
  static const surface = PremiumLight.card;
  static const buttonDark = PremiumLight.textPrimary;
  static const danger = PremiumLight.error;

  static const pagePaddingH = 24.0;

  static TextStyle get serifTitle => GoogleFonts.cormorantGaramond(
        fontSize: 32,
        fontWeight: FontWeight.w400,
        color: text,
        height: 1.15,
        letterSpacing: -0.3,
      );

  static TextStyle get serifTitleMd => GoogleFonts.cormorantGaramond(
        fontSize: 28,
        fontWeight: FontWeight.w400,
        color: text,
        height: 1.2,
      );

  static TextStyle get serifValue => GoogleFonts.cormorantGaramond(
        fontSize: 20,
        fontWeight: FontWeight.w500,
        color: text,
        height: 1.25,
      );

  static TextStyle get eyebrow => PremiumLight.label.copyWith(color: accent);

  static TextStyle get fieldLabel => PremiumLight.label.copyWith(
        fontSize: 11,
        letterSpacing: 1.4,
        color: textMuted,
      );

  static TextStyle get body => PremiumLight.body.copyWith(fontWeight: FontWeight.w400);

  static TextStyle get meta => PremiumLight.bodySecondary;

  static TextStyle get stepLabel => PremiumLight.caption.copyWith(
        fontSize: 11,
        letterSpacing: 1.0,
      );

  static TextStyle get stepLabelActive => stepLabel.copyWith(
        color: text,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get stepNavLabel => PremiumLight.caption.copyWith(
        fontSize: 12,
        letterSpacing: 0.3,
        height: 1.2,
      );

  static TextStyle get stepNavLabelActive => stepNavLabel.copyWith(
        color: text,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.4,
      );

  static InputDecoration underlineField({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: body.copyWith(color: textMuted.withValues(alpha: 0.75)),
      filled: false,
      contentPadding: const EdgeInsets.symmetric(vertical: 12),
      border: const UnderlineInputBorder(borderSide: BorderSide(color: borderInput)),
      enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: borderInput)),
      focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: accent, width: 1.5)),
      disabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: borderInput.withValues(alpha: 0.6))),
    );
  }

  static ThemeData get datePickerTheme => ThemeData.light().copyWith(
        colorScheme: const ColorScheme.light(
          primary: accent,
          onPrimary: PremiumLight.onAccent,
          surface: surface,
          onSurface: text,
        ),
      );
}

class QuotationBuilderSurface extends StatelessWidget {
  const QuotationBuilderSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(22),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: QuotationBuilderPalette.surface,
        border: Border.all(color: QuotationBuilderPalette.border),
        borderRadius: BorderRadius.circular(PremiumLight.radiusCard),
        boxShadow: PremiumLight.cardShadow,
      ),
      child: child,
    );
  }
}

class QuotationBuilderBanner extends StatelessWidget {
  const QuotationBuilderBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: PremiumLight.secondaryButton,
        border: Border.all(color: QuotationBuilderPalette.border),
        borderRadius: BorderRadius.circular(PremiumLight.radiusButton),
      ),
      child: Row(
        children: [
          Icon(Icons.copy_all_rounded, size: 18, color: QuotationBuilderPalette.accent),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: QuotationBuilderPalette.meta.copyWith(color: QuotationBuilderPalette.text),
            ),
          ),
        ],
      ),
    );
  }
}
