import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';

/// Cream & gold editorial theme — matches web QuotationBuilderPage.
abstract final class QuotationBuilderPalette {
  static const background = Color(0xFFFAF7F2);
  static const text = Color(0xFF2C2C2C);
  static const textMuted = Color(0xFF888888);
  static const accent = Color(0xFFB8965A);
  static const border = Color(0xFFE8DFD0);
  static const borderInput = Color(0xFFD4C4A8);
  static const surface = Color(0xFFFFFFFF);
  static const buttonDark = Color(0xFF2C2C2C);
  static const danger = Color(0xFFDC2626);

  static const pagePaddingH = 24.0;

  static TextStyle get serifTitle => GoogleFonts.cormorantGaramond(
        fontSize: 32,
        fontWeight: FontWeight.w300,
        color: text,
        height: 1.15,
        letterSpacing: -0.3,
      );

  static TextStyle get serifTitleMd => GoogleFonts.cormorantGaramond(
        fontSize: 28,
        fontWeight: FontWeight.w300,
        color: text,
        height: 1.2,
      );

  static TextStyle get serifValue => GoogleFonts.cormorantGaramond(
        fontSize: 20,
        fontWeight: FontWeight.w400,
        color: text,
        height: 1.25,
      );

  static TextStyle get eyebrow => AdminHomeTypography.inter(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 2.5,
        color: accent,
      );

  static TextStyle get fieldLabel => AdminHomeTypography.inter(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        letterSpacing: 2.0,
        color: textMuted,
      );

  static TextStyle get body => AdminHomeTypography.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: text,
        height: 1.45,
      );

  static TextStyle get meta => AdminHomeTypography.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: textMuted,
        height: 1.4,
      );

  static TextStyle get stepLabel => AdminHomeTypography.inter(
        fontSize: 9,
        fontWeight: FontWeight.w500,
        letterSpacing: 1.2,
        color: textMuted,
      );

  static TextStyle get stepLabelActive => stepLabel.copyWith(
        color: text,
        fontWeight: FontWeight.w600,
      );

  /// Step nav — larger than footer labels for readability on small screens.
  static TextStyle get stepNavLabel => AdminHomeTypography.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.4,
        color: textMuted,
        height: 1.2,
      );

  static TextStyle get stepNavLabelActive => stepNavLabel.copyWith(
        color: text,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.5,
      );

  static InputDecoration underlineField({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: body.copyWith(color: textMuted.withValues(alpha: 0.75)),
      filled: false,
      contentPadding: const EdgeInsets.symmetric(vertical: 10),
      border: const UnderlineInputBorder(borderSide: BorderSide(color: borderInput)),
      enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: borderInput)),
      focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: accent, width: 1.5)),
      disabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: borderInput.withValues(alpha: 0.6))),
    );
  }

  static ThemeData get datePickerTheme => ThemeData.light().copyWith(
        colorScheme: const ColorScheme.light(
          primary: accent,
          onPrimary: Colors.white,
          surface: surface,
          onSurface: text,
        ),
      );
}

class QuotationBuilderSurface extends StatelessWidget {
  const QuotationBuilderSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: QuotationBuilderPalette.surface.withValues(alpha: 0.65),
        border: Border.all(color: QuotationBuilderPalette.border),
        borderRadius: BorderRadius.circular(12),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: QuotationBuilderPalette.accent.withValues(alpha: 0.08),
        border: Border.all(color: QuotationBuilderPalette.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.copy_all_rounded, size: 16, color: QuotationBuilderPalette.accent),
          const SizedBox(width: 12),
          Expanded(child: Text(message, style: QuotationBuilderPalette.meta.copyWith(color: QuotationBuilderPalette.text))),
        ],
      ),
    );
  }
}
