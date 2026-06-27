import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';

/// App-wide color aliases — mapped to the premium light palette.
class AppColors {
  static const background = PremiumLight.background;
  static const surface = PremiumLight.surface;
  static const card = PremiumLight.card;
  static const elevated = PremiumLight.elevated;
  static const border = PremiumLight.border;
  static const divider = PremiumLight.divider;
  static const textPrimary = PremiumLight.textPrimary;
  static const textSecondary = PremiumLight.textSecondary;
  static const textMuted = PremiumLight.textMuted;

  /// Primary accent (warm bronze) — replaces legacy violet.
  static const violet = PremiumLight.accent;
  static const violetLight = PremiumLight.secondaryButton;
  static const cyan = PremiumLight.info;
  static const rose = PremiumLight.error;
  static const amber = PremiumLight.warning;
  static const orange = PremiumLight.warning;
  static const emerald = PremiumLight.success;
}

ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    platform: TargetPlatform.iOS,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: PremiumLight.accent,
      onPrimary: PremiumLight.onAccent,
      secondary: PremiumLight.accentSecondary,
      surface: PremiumLight.background,
      onSurface: PremiumLight.textPrimary,
      error: PremiumLight.error,
    ),
    scaffoldBackgroundColor: PremiumLight.background,
    dividerColor: PremiumLight.divider,
    textTheme: PremiumLight.textTheme,
  );

  return base.copyWith(
    appBarTheme: AppBarTheme(
      toolbarHeight: 48,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      backgroundColor: PremiumLight.background,
      foregroundColor: PremiumLight.textPrimary,
      centerTitle: false,
      titleTextStyle: PremiumLight.inter(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: PremiumLight.textPrimary,
      ),
      iconTheme: const IconThemeData(color: PremiumLight.textPrimary, size: 24),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 68,
      backgroundColor: PremiumLight.background,
      surfaceTintColor: Colors.transparent,
      indicatorColor: PremiumLight.accent.withValues(alpha: 0.12),
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return PremiumLight.inter(
          fontSize: 11,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
          color: selected ? PremiumLight.accent : PremiumLight.textSecondary,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          size: 24,
          color: selected ? PremiumLight.accent : PremiumLight.textPrimary.withValues(alpha: 0.72),
        );
      }),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: PremiumLight.card,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PremiumLight.radiusCard),
        side: const BorderSide(color: PremiumLight.border),
      ),
      titleTextStyle: PremiumLight.sectionHeading.copyWith(fontSize: 20),
      contentTextStyle: PremiumLight.bodySecondary,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: PremiumLight.card,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(PremiumLight.radiusCard)),
      ),
    ),
    popupMenuTheme: PopupMenuThemeData(
      color: PremiumLight.card,
      surfaceTintColor: Colors.transparent,
      elevation: 8,
      shadowColor: PremiumLight.textPrimary.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PremiumLight.radiusCard),
        side: const BorderSide(color: PremiumLight.border),
      ),
    ),
    inputDecorationTheme: PremiumLight.inputTheme,
    filledButtonTheme: FilledButtonThemeData(style: PremiumLight.filledButton),
    elevatedButtonTheme: ElevatedButtonThemeData(style: PremiumLight.filledButton),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: PremiumLight.accent,
        backgroundColor: PremiumLight.secondaryButton,
        minimumSize: const Size.fromHeight(52),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PremiumLight.radiusButton)),
        textStyle: PremiumLight.inter(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: PremiumLight.accent,
        textStyle: PremiumLight.inter(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    cardTheme: CardThemeData(
      color: PremiumLight.card,
      elevation: 0,
      shadowColor: PremiumLight.textPrimary.withValues(alpha: 0.04),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PremiumLight.radiusCard),
        side: const BorderSide(color: PremiumLight.border),
      ),
    ),
    dividerTheme: const DividerThemeData(color: PremiumLight.divider, thickness: 1),
    iconTheme: const IconThemeData(color: PremiumLight.textSecondary, size: 24),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: PremiumLight.textPrimary,
      contentTextStyle: PremiumLight.inter(fontSize: 14, fontWeight: FontWeight.w500, color: PremiumLight.card),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: PremiumLight.accent),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: PremiumLight.accent,
      foregroundColor: PremiumLight.onAccent,
      elevation: 0,
    ),
  );
}
