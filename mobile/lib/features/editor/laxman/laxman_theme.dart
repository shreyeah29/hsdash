import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Strict monochrome — pure white canvas, pure black ink.
abstract final class LaxmanPalette {
  static const white = Color(0xFFFFFFFF);
  static const black = Color(0xFF000000);

  static const hairline = DividerThemeData(
    color: black,
    thickness: 1,
    space: 1,
  );
}

abstract final class LaxmanType {
  static TextStyle display(String text, {double size = 52}) => GoogleFonts.inter(
        fontSize: size,
        fontWeight: FontWeight.w900,
        height: 0.95,
        letterSpacing: -2,
        color: LaxmanPalette.black,
      );

  static TextStyle label(String text) => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 3.2,
        color: LaxmanPalette.black,
      );

  static TextStyle metricValue(String text, {double size = 44}) => GoogleFonts.inter(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1,
        letterSpacing: -1.5,
        color: LaxmanPalette.black,
      );

  static TextStyle metricCaption(String text) => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.2,
        color: LaxmanPalette.black,
        height: 1.35,
      );

  static TextStyle body(String text, {double size = 16, FontWeight w = FontWeight.w500}) =>
      GoogleFonts.inter(fontSize: size, fontWeight: w, height: 1.4, color: LaxmanPalette.black);

  static TextStyle bodyLarge(String text) => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.25,
        letterSpacing: -0.3,
        color: LaxmanPalette.black,
      );

  static TextStyle inverseDisplay(String text) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        height: 1.35,
        color: LaxmanPalette.white,
      );

  static TextStyle sectionHead(String text) => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        letterSpacing: 2.4,
        color: LaxmanPalette.black,
      );
}
