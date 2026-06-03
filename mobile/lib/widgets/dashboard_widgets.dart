import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/models/user.dart';

class DashboardShell extends StatelessWidget {
  const DashboardShell({
    super.key,
    required this.user,
    required this.tabIndex,
    required this.onTabChanged,
    required this.destinations,
    required this.titles,
    required this.accent,
    required this.onLogout,
    required this.children,
  });

  final User user;
  final int tabIndex;
  final ValueChanged<int> onTabChanged;
  final List<NavigationDestination> destinations;
  final List<String> titles;
  final Color accent;
  final VoidCallback onLogout;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: appLightChromeOverlayStyle,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          centerTitle: false,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(titles[tabIndex], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              Text(
                '${user.roleLabel} · ${user.name}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w400),
              ),
            ],
          ),
          actions: [
            IconButton(icon: const Icon(Icons.logout), onPressed: onLogout),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(3),
            child: Container(height: 3, color: accent.withValues(alpha: 0.85)),
          ),
        ),
        body: IndexedStack(index: tabIndex, children: children),
        bottomNavigationBar: NavigationBar(
          selectedIndex: tabIndex,
          onDestinationSelected: onTabChanged,
          destinations: destinations,
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
    required this.subtitle,
    this.accent = AppColors.violet,
    this.background = AppColors.violetLight,
  });

  final String badge;
  final String title;
  final String subtitle;
  final Color accent;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            badge.toUpperCase(),
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: accent),
          ),
          const SizedBox(height: 8),
          Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: AppColors.textMuted, height: 1.4)),
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
