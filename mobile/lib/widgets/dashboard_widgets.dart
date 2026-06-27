import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/models/user.dart';

class DashboardShell extends ConsumerWidget {
  const DashboardShell({
    super.key,
    required this.tabIndex,
    required this.onTabChanged,
    required this.destinations,
    required this.children,
    this.accent = AppColors.violet,
    this.user,
    this.titles,
    this.onLogout,
    this.showHeader = false,
    this.premiumDarkTabIndices,
    this.adminPalette,
    this.useAdminTheme = false,
  });

  final int tabIndex;
  final ValueChanged<int> onTabChanged;
  final List<NavigationDestination> destinations;
  final Color accent;
  final List<Widget> children;
  final User? user;
  final List<String>? titles;
  final VoidCallback? onLogout;
  final bool showHeader;
  final Set<int>? premiumDarkTabIndices;
  final AdminPaletteTokens? adminPalette;
  final bool useAdminTheme;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final palette = useAdminTheme ? ref.watch(adminPaletteProvider) : adminPalette;
    final adminThemed = palette != null && (premiumDarkTabIndices?.contains(tabIndex) ?? false);
    final shellBg = adminThemed
        ? Colors.transparent
        : (premiumDarkTabIndices?.contains(tabIndex) ?? false)
            ? const Color(0xFF0B0D11)
            : AppColors.surface;
    final shellAccent = adminThemed ? palette.accent : accent;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: adminThemed
          ? (palette.lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark)
          : appLightChromeOverlayStyle,
      child: Scaffold(
        backgroundColor: shellBg,
        appBar: showHeader && user != null && titles != null && onLogout != null
            ? AppBar(
                backgroundColor: AppColors.card,
                surfaceTintColor: Colors.transparent,
                centerTitle: false,
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(titles![tabIndex], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                    Text(
                      '${user!.roleLabel} · ${user!.name}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w400),
                    ),
                  ],
                ),
                actions: [
                  IconButton(icon: const Icon(Icons.logout), onPressed: onLogout),
                ],
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(3),
                  child: Container(height: 3, color: shellAccent.withValues(alpha: 0.85)),
                ),
              )
            : null,
        body: SafeArea(
          bottom: false,
          child: Stack(
            children: [
              IndexedStack(index: tabIndex, children: children),
              if (!showHeader && onLogout != null)
                Positioned(
                  top: 4,
                  right: 4,
                  child: IconButton(
                    tooltip: 'Log out',
                    onPressed: onLogout,
                    icon: Icon(
                      Icons.logout_rounded,
                      color: adminThemed ? palette.textSecondary : AppColors.textMuted,
                    ),
                  ),
                ),
            ],
          ),
        ),
        bottomNavigationBar: Theme(
          data: adminThemed
              ? Theme.of(context).copyWith(
                  navigationBarTheme: NavigationBarThemeData(
                    backgroundColor: palette.navBar,
                    indicatorColor: palette.isStudio
                        ? palette.navIndicator
                        : palette.accent.withValues(alpha: 0.14),
                    surfaceTintColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    elevation: 0,
                    height: 64,
                    labelTextStyle: WidgetStateProperty.resolveWith((states) {
                      final selected = states.contains(WidgetState.selected);
                      if (palette.isStudio) {
                        return TextStyle(
                          fontSize: 11,
                          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                          color: selected ? palette.text : palette.textSecondary,
                        );
                      }
                      return TextStyle(
                        fontSize: 11,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                        color: selected ? palette.text : palette.textSecondary,
                      );
                    }),
                    iconTheme: WidgetStateProperty.resolveWith((states) {
                      final selected = states.contains(WidgetState.selected);
                      return IconThemeData(
                        color: selected
                            ? palette.accent
                            : (palette.isStudio ? palette.textSecondary : palette.text.withValues(alpha: 0.72)),
                        size: 24,
                      );
                    }),
                  ),
                )
              : Theme.of(context),
          child: adminThemed
              ? DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: palette.isStudio
                            ? palette.border.withValues(alpha: 0.45)
                            : palette.border,
                      ),
                    ),
                  ),
                  child: NavigationBar(
                    selectedIndex: tabIndex,
                    onDestinationSelected: onTabChanged,
                    destinations: destinations,
                  ),
                )
              : NavigationBar(
                  selectedIndex: tabIndex,
                  onDestinationSelected: onTabChanged,
                  destinations: destinations,
                ),
        ),
      ),
    );
  }
}

class DashboardHero extends StatelessWidget {
  const DashboardHero({
    super.key,
    required this.badge,
    required this.title,
    this.subtitle,
    this.accent = AppColors.violet,
    this.background = AppColors.violetLight,
    this.leading,
  });

  final String badge;
  final String title;
  final String? subtitle;
  final Color accent;
  final Color background;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (leading != null) ...[
            leading!,
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge.toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: accent),
                ),
                const SizedBox(height: 8),
                Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(subtitle!, style: const TextStyle(color: AppColors.textMuted, height: 1.4)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DashboardStatCard extends StatelessWidget {
  const DashboardStatCard({
    super.key,
    required this.label,
    required this.value,
    this.hint,
    this.accent,
  });

  final String label;
  final String value;
  final String? hint;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.textMuted,
                letterSpacing: 0.8,
                height: 1.2,
              ),
            ),
            const Spacer(),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  height: 1,
                  color: accent ?? AppColors.textPrimary,
                ),
              ),
            ),
            if (hint != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  hint!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.2),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class ErrorPanel extends StatelessWidget {
  const ErrorPanel({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Could not load data', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: AppColors.rose, fontSize: 13)),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class EmptyPanel extends StatelessWidget {
  const EmptyPanel({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(child: Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted))),
      ),
    );
  }
}
