import 'package:flutter/material.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';

/// Black & white [ThemeData] — same widgets, no purple/amber accents.
ThemeData buildMonochromeAppTheme(ThemeData base) {
  const black = LaxmanPalette.black;
  const white = LaxmanPalette.white;

  return base.copyWith(
    scaffoldBackgroundColor: white,
    colorScheme: base.colorScheme.copyWith(
      primary: black,
      onPrimary: white,
      surface: white,
      onSurface: black,
      secondary: black,
      onSecondary: white,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: white,
      foregroundColor: black,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
    ),
    cardTheme: const CardThemeData(
      color: white,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: black, width: 1),
      ),
    ),
    dividerTheme: const DividerThemeData(color: black, thickness: 1),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: white,
      indicatorColor: black.withValues(alpha: 0.1),
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 11,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: black,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? black : black.withValues(alpha: 0.45),
          size: 24,
        );
      }),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: white,
      hintStyle: TextStyle(color: black.withValues(alpha: 0.45)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: black),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: black.withValues(alpha: 0.35)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: black, width: 1.5),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: black,
        foregroundColor: white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: black),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: black),
  );
}
