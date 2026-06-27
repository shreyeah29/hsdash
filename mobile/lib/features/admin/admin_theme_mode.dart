import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';

enum AdminThemeMode { dark, light }

/// Admin visual tokens — Studio (purple cinematic) vs Wedding (espresso luxury).
class AdminPaletteTokens {
  const AdminPaletteTokens({
    required this.background,
    required this.surface,
    required this.card,
    required this.lightSurface,
    required this.accent,
    required this.bronze,
    required this.ivory,
    required this.text,
    required this.textSecondary,
    required this.navBar,
    required this.navIndicator,
    required this.border,
    required this.success,
    required this.warning,
    required this.error,
    required this.delayed,
    required this.onAccent,
    required this.isStudio,
    required this.lightStatusBar,
    required this.heroGradientEnd,
    required this.backdropAccent,
  });

  final Color background;
  final Color surface;
  final Color card;
  final Color lightSurface;
  final Color accent;
  final Color bronze;
  final Color ivory;
  final Color text;
  final Color textSecondary;
  final Color navBar;
  final Color navIndicator;
  final Color border;
  final Color success;
  final Color warning;
  final Color error;
  final Color delayed;
  final Color onAccent;
  /// Purple cinematic studio theme (dark mode toggle).
  final bool isStudio;
  final bool lightStatusBar;
  final Color heroGradientEnd;
  final Color backdropAccent;

  /// Legacy alias — true when purple studio theme is active.
  bool get isDark => isStudio;

  static const studio = AdminPaletteTokens(
    background: Color(0xFF0B0D11),
    surface: Color(0xFF131720),
    card: Color(0xFF181D28),
    lightSurface: Color(0xFF1E2430),
    accent: Color(0xFF8B5CF6),
    bronze: Color(0xFF9EA3B0),
    ivory: Color(0xFFF4F4F5),
    text: Color(0xFFF4F4F5),
    textSecondary: Color(0xFF9EA3B0),
    navBar: Color(0xFF06080C),
    navIndicator: Color(0x528B5CF6),
    border: Color(0xFF2A3140),
    success: Color(0xFF34C759),
    warning: Color(0xFFFF9500),
    error: Color(0xFFFF453A),
    delayed: Color(0xFFBC7E87),
    onAccent: Color(0xFFF4F4F5),
    isStudio: true,
    lightStatusBar: true,
    heroGradientEnd: Color(0xFFC4B5FD),
    backdropAccent: Color(0xFF8B5CF6),
  );

  /// Premium light wedding production CRM.
  static const wedding = AdminPaletteTokens(
    background: Color(0xFFF7F5F2),
    surface: Color(0xFFF1ECE6),
    card: Color(0xFFFFFFFF),
    lightSurface: Color(0xFFFCFBF9),
    accent: Color(0xFF8B6A45),
    bronze: Color(0xFF8B847D),
    ivory: Color(0xFFB89268),
    text: Color(0xFF1F1B18),
    textSecondary: Color(0xFF5E5750),
    navBar: Color(0xFFF7F5F2),
    navIndicator: Color(0x248B6A45),
    border: Color(0xFFE8E0D8),
    success: Color(0xFF4F7F5A),
    warning: Color(0xFFD59B3A),
    error: Color(0xFFC45B52),
    delayed: Color(0xFFC45B52),
    onAccent: Color(0xFFFFFFFF),
    isStudio: false,
    lightStatusBar: false,
    heroGradientEnd: Color(0xFFB89268),
    backdropAccent: Color(0xFF8B6A45),
  );
}

class AdminThemeModeNotifier extends Notifier<AdminThemeMode> {
  @override
  AdminThemeMode build() {
    AdminHomePalette.apply(AdminPaletteTokens.wedding);
    return AdminThemeMode.light;
  }

  void toggle() {
    state = state == AdminThemeMode.dark ? AdminThemeMode.light : AdminThemeMode.dark;
    AdminHomePalette.apply(
      state == AdminThemeMode.dark ? AdminPaletteTokens.studio : AdminPaletteTokens.wedding,
    );
  }

  void set(AdminThemeMode mode) => state = mode;
}

final adminThemeModeProvider = NotifierProvider<AdminThemeModeNotifier, AdminThemeMode>(
  AdminThemeModeNotifier.new,
);

final adminPaletteProvider = Provider<AdminPaletteTokens>((ref) {
  final mode = ref.watch(adminThemeModeProvider);
  return mode == AdminThemeMode.dark ? AdminPaletteTokens.studio : AdminPaletteTokens.wedding;
});

/// Subscribe to theme changes and sync [AdminHomePalette] — call at the top of admin screens.
AdminPaletteTokens watchAdminPalette(WidgetRef ref) {
  final palette = ref.watch(adminPaletteProvider);
  AdminHomePalette.apply(palette);
  return palette;
}
