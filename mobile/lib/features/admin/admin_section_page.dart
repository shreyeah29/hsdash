import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/admin/admin_activity_tab.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/admin/team_management_tab.dart';
import 'package:hsdash_mobile/features/weddings_archive/weddings_archive_tab.dart';

/// Full-screen admin section opened from home shortcuts.
class AdminSectionPage extends ConsumerWidget {
  const AdminSectionPage({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  static void openWeddings(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AdminSectionPage(
          title: 'Weddings',
          child: WeddingsArchiveTab(
            accent: AdminHomePalette.accent,
            canEdit: true,
            canActivate: false,
          ),
        ),
      ),
    );
  }

  static void openActivity(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AdminSectionPage(
          title: 'Activity',
          child: AdminActivityTab(
            accent: AdminHomePalette.accent,
            premiumDark: AdminHomePalette.isStudio,
          ),
        ),
      ),
    );
  }

  static void openTeam(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => const AdminSectionPage(
          title: 'Team',
          child: TeamManagementTab(adminThemed: true),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final palette = watchAdminPalette(ref);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: palette.lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: AdminPageBackground(
        child: Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            foregroundColor: palette.text,
            elevation: 0,
            scrolledUnderElevation: 0,
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(height: 1, color: palette.isStudio ? palette.border.withValues(alpha: 0.22) : palette.border),
            ),
            title: Text(
              title,
              style: AdminHomePalette.pageTitle.copyWith(fontSize: 22),
            ),
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: palette.text),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
          body: child,
        ),
      ),
    );
  }
}

/// Theme toggle for admin header.
class AdminThemeToggle extends ConsumerWidget {
  const AdminThemeToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(adminThemeModeProvider);
    final isDark = mode == AdminThemeMode.dark;
    final studio = AdminHomePalette.isStudio;

    return Material(
      color: studio ? AdminHomePalette.surface.withValues(alpha: 0.9) : AdminHomePalette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: AdminHomePalette.cardBorder),
      ),
      child: InkWell(
        onTap: () => ref.read(adminThemeModeProvider.notifier).toggle(),
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isDark ? Icons.movie_filter_rounded : Icons.diamond_outlined,
                size: 18,
                color: AdminHomePalette.accent,
              ),
              const SizedBox(width: 6),
              Text(
                isDark ? 'Studio' : 'Wedding',
                style: AdminHomePalette.editorialLabel.copyWith(
                  letterSpacing: 1.2,
                  fontSize: 10,
                  color: AdminHomePalette.accent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Home shortcut tile — Weddings, Activity, Team.
class AdminHomeShortcut extends StatelessWidget {
  const AdminHomeShortcut({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final studio = AdminHomePalette.isStudio;

    return Expanded(
      child: Material(
        color: studio ? AdminHomePalette.surface : AdminHomePalette.elevated,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
          side: BorderSide(color: AdminHomePalette.cardBorder),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 10),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AdminHomePalette.accent.withValues(alpha: studio ? 0.16 : 0.14),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: AdminHomePalette.accent.withValues(alpha: studio ? 0.3 : 0.28),
                    ),
                  ),
                  child: Icon(icon, color: AdminHomePalette.accent, size: 22),
                ),
                const SizedBox(height: 11),
                Text(
                  label.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: AdminHomePalette.statLabel.copyWith(
                    fontSize: 9,
                    letterSpacing: 1.5,
                    color: AdminHomePalette.text,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
