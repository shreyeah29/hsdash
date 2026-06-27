import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';

/// Visual tokens for the weddings archive tab.
abstract final class WeddingsArchiveStyle {
  static bool isPremiumDark(Color accent) => accent != LaxmanPalette.black;

  static Color background(Color accent) =>
      isPremiumDark(accent) ? AdminHomePalette.background : PremiumLight.background;

  static Color textPrimary(Color accent) =>
      isPremiumDark(accent) ? AdminHomePalette.text : AppColors.textPrimary;

  static Color textMuted(Color accent) =>
      isPremiumDark(accent) ? AdminHomePalette.textSecondary : AppColors.textMuted;

  static TextStyle sectionLabel(Color accent) => AdminHomeTypography.inter(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 2.2,
        color: textMuted(accent),
      );

  static TextStyle title(Color accent) => AdminHomeTypography.inter(
        fontSize: 26,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        height: 1.12,
        color: textPrimary(accent),
      );

  static TextStyle subtitle(Color accent) => AdminHomeTypography.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textMuted(accent),
        height: 1.35,
      );

  static TextStyle rowTitle(Color accent) => AdminHomeTypography.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textPrimary(accent),
      );

  static TextStyle rowMeta(Color accent) => AdminHomeTypography.inter(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: textMuted(accent),
      );

  /// Month name on grid tiles — editorial serif, separate from body Inter.
  static TextStyle monthTileLabel(Color accent) {
    final color = textPrimary(accent);
    return GoogleFonts.playfairDisplay(
      fontSize: isPremiumDark(accent) ? 26 : 22,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.3,
      height: 1.05,
      color: color,
    );
  }

  static TextStyle monthMeta(Color accent) => AdminHomeTypography.inter(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: textMuted(accent),
      );

  static Color divider(Color accent) =>
      isPremiumDark(accent)
          ? AdminHomePalette.textSecondary.withValues(alpha: 0.14)
          : AppColors.border.withValues(alpha: 0.45);

  /// Elevated slate panel — matches admin home surfaces.
  static BoxDecoration panelDecoration(Color accent) {
    if (!isPremiumDark(accent)) {
      return BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      );
    }
    return BoxDecoration(
      borderRadius: BorderRadius.circular(AdminHomePalette.radiusSm),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          const Color(0xFF222838),
          AdminHomePalette.card,
          AdminHomePalette.surface.withValues(alpha: 0.92),
        ],
      ),
      border: Border.all(color: accent.withValues(alpha: 0.22)),
      boxShadow: [
        BoxShadow(
          color: accent.withValues(alpha: 0.12),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
        ...AdminHomePalette.elevationDeep,
      ],
    );
  }

  /// Compact month tile — subtle accent wash, no heavy glow.
  static BoxDecoration monthTileDecoration(Color accent) {
    if (!isPremiumDark(accent)) {
      return BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      );
    }
    return BoxDecoration(
      borderRadius: BorderRadius.circular(14),
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomRight,
        colors: [
          accent.withValues(alpha: 0.14),
          AdminHomePalette.card,
          const Color(0xFF141820),
        ],
        stops: const [0.0, 0.35, 1.0],
      ),
      border: Border.all(color: accent.withValues(alpha: 0.28)),
    );
  }

  /// Small year badge on list rows.
  static BoxDecoration yearBadgeDecoration(Color accent) => BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accent.withValues(alpha: 0.85),
            accent.withValues(alpha: 0.45),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.35),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      );
}
