import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_controller.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_profile.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/auth/workspace_profile_menu_button.dart';
import 'package:hsdash_mobile/models/admin_overview.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/task.dart' show OverviewStats, Task;
import 'package:hsdash_mobile/widgets/change_password_sheet.dart';
import 'package:hsdash_mobile/widgets/change_username_sheet.dart';

/// Admin dashboard home — premium cinematic visual layer only.
class AdminHomeTab extends ConsumerWidget {
  const AdminHomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overview = ref.watch(adminOverviewProvider);
    final profile = ref.watch(adminWorkspaceProvider);
    final todayKey = localDayKey(DateTime.now());
    final friendlyToday = formatFriendlyDay(todayKey);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ColoredBox(
        color: AdminHomePalette.background,
        child: RefreshIndicator(
          color: AdminHomePalette.accent,
          backgroundColor: AdminHomePalette.card,
          onRefresh: () async => ref.invalidate(adminOverviewProvider),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Stack(
                  children: [
                    const _CinematicBackdrop(),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(22, 12, 22, 28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _EditorialHeader(
                            profile: profile,
                            friendlyToday: friendlyToday,
                            onSwitchProfile: profile == null
                                ? null
                                : () async {
                                    await ref.read(adminWorkspaceProvider.notifier).clear();
                                    if (context.mounted) context.go('/admin/profiles');
                                  },
                            onChangePassword: profile == null
                                ? null
                                : () => _openChangePassword(context, ref),
                            onChangeUsername: profile == null
                                ? null
                                : () => _openChangeUsername(context, ref),
                            onLogout: () => ref.read(authControllerProvider.notifier).logout(),
                          ),
                          const SizedBox(height: 28),
                          overview.when(
                            loading: () => const Padding(
                              padding: EdgeInsets.symmetric(vertical: 48),
                              child: Center(
                                child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2),
                              ),
                            ),
                            error: (e, _) => _HomeError(
                              message: '$e',
                              onRetry: () => ref.invalidate(adminOverviewProvider),
                            ),
                            data: (data) => _HomeBody(data: data, todayKey: todayKey, friendlyToday: friendlyToday),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _openChangePassword(BuildContext context, WidgetRef ref) async {
  final ok = await showAppBottomSheet<bool>(
    context,
    builder: (ctx) => ChangePasswordSheet(
      onSubmit: (current, newPassword) => ref.read(appRepositoryProvider).changePassword(
            currentPassword: current,
            newPassword: newPassword,
          ),
    ),
  );
  if (ok == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Password updated — use it on your next sign-in')),
    );
  }
}

Future<void> _openChangeUsername(BuildContext context, WidgetRef ref) async {
  final currentUser = ref.read(authControllerProvider).user;
  if (currentUser == null) return;

  final ok = await showAppBottomSheet<bool>(
    context,
    builder: (ctx) => ChangeUsernameSheet(
      currentUsername: currentUser.username,
      onSubmit: (currentPassword, username) async {
        final updated = await ref.read(appRepositoryProvider).changeUsername(
              currentPassword: currentPassword,
              username: username,
            );
        ref.read(authControllerProvider.notifier).updateSessionUser(updated);
      },
    ),
  );
  if (ok == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Username updated — use it on your next sign-in')),
    );
  }
}

class _CinematicBackdrop extends StatelessWidget {
  const _CinematicBackdrop();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 480,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -120,
            left: -80,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AdminHomePalette.accent.withValues(alpha: 0.35),
                    AdminHomePalette.accent.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 40,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF4C1D95).withValues(alpha: 0.25),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 120,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AdminHomePalette.background.withValues(alpha: 0),
                    AdminHomePalette.background,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EditorialHeader extends StatelessWidget {
  const _EditorialHeader({
    required this.friendlyToday,
    this.profile,
    this.onSwitchProfile,
    this.onChangePassword,
    this.onChangeUsername,
    this.onLogout,
  });

  final AdminWorkspaceProfile? profile;
  final String friendlyToday;
  final VoidCallback? onSwitchProfile;
  final VoidCallback? onChangePassword;
  final VoidCallback? onChangeUsername;
  final VoidCallback? onLogout;

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final name = profile?.label ?? 'Admin';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_greeting, style: AdminHomePalette.editorialLabel.copyWith(letterSpacing: 1.6)),
                  const SizedBox(height: 4),
                  Text(
                    name,
                    style: AdminHomePalette.editorialTitle.copyWith(fontSize: 22),
                  ),
                ],
              ),
            ),
            if (profile != null && onSwitchProfile != null && onLogout != null)
              WorkspaceProfileMenuButton(
                profile: profile!,
                size: 48,
                borderColor: AdminHomePalette.accent.withValues(alpha: 0.4),
                menuSurfaceColor: AdminHomePalette.card,
                onSwitchProfile: onSwitchProfile!,
                onChangePassword: onChangePassword,
                onChangeUsername: onChangeUsername,
                onLogout: onLogout!,
              ),
          ],
        ),
        const SizedBox(height: 28),
        ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [AdminHomePalette.text, Color(0xFFC4B5FD)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ).createShader(bounds),
          blendMode: BlendMode.srcIn,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('This is your', style: AdminHomePalette.runwayHeroEmphasis.copyWith(fontSize: 34)),
              Text('production runway', style: AdminHomePalette.runwayHeroEmphasis.copyWith(fontSize: 34)),
              const SizedBox(height: 6),
              Text('for today', style: AdminHomePalette.runwayHeroEmphasis.copyWith(fontSize: 34)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          friendlyToday,
          style: AdminHomePalette.runwayHeroEmphasis.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AdminHomePalette.accent,
          ),
        ),
      ],
    );
  }
}

class _HomeError extends StatelessWidget {
  const _HomeError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return AdminHomeSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Could not load runway', style: AdminHomePalette.sectionTitle),
          const SizedBox(height: 10),
          Text(message, style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text)),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(foregroundColor: AdminHomePalette.accent),
            child: const Text('Retry', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _HomeBody extends StatelessWidget {
  const _HomeBody({
    required this.data,
    required this.todayKey,
    required this.friendlyToday,
  });

  final AdminOverview data;
  final String todayKey;
  final String friendlyToday;

  @override
  Widget build(BuildContext context) {
    final stats = data.stats;
    final open = data.tasks.where((t) => t.status != 'COMPLETED').toList();
    final duesByDay = groupOpenTasksByDeadlineDay(open, (t) => t.deadline, (t) => t.status);
    final todayTasks = duesByDay[todayKey] ?? [];
    final nextKey = [...duesByDay.keys.where((k) => k.compareTo(todayKey) > 0)]..sort();
    final nextDay = nextKey.isEmpty ? null : nextKey.first;
    final nextTasks = nextDay != null ? (duesByDay[nextDay] ?? []) : <Task>[];
    final upcomingShoots = data.entries.take(6).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _MetricsStrip(stats: stats),
        Text('DUE TODAY', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 14),
        if (todayTasks.isNotEmpty)
          ...todayTasks.map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _TaskRow(task: t),
            ),
          )
        else
          Text(
            'Nothing due today — you\'re clear for $friendlyToday.',
            style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.85)),
          ),
        if (nextDay != null && nextTasks.isNotEmpty) ...[
          const SizedBox(height: 28),
          Text(
            'NEXT · ${formatFriendlyDay(nextDay, includeYear: true).toUpperCase()}',
            style: AdminHomePalette.sectionTitle,
          ),
          const SizedBox(height: 14),
          ...nextTasks.map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _TaskRow(task: t),
            ),
          ),
        ],
        if (upcomingShoots.isNotEmpty) ...[
          const SizedBox(height: 32),
          Text('UPCOMING SHOOTS', style: AdminHomePalette.sectionTitle),
          const SizedBox(height: 14),
          ...upcomingShoots.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _ShootRow(entry: e),
              )),
        ],
        const SizedBox(height: 8),
      ],
    );
  }
}

class _MetricsStrip extends StatelessWidget {
  const _MetricsStrip({required this.stats});

  final OverviewStats stats;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Weddings', '${stats.weddings}'),
      ('Shoots', '${stats.shootCount}'),
      ('Due today', '${stats.dueToday}'),
      ('Overdue', '${stats.overdue}'),
      ('Open', '${stats.open}'),
      ('Done', '${stats.completionRate}%'),
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Wrap(
        spacing: 20,
        runSpacing: 16,
        children: items.map((e) => _MetricItem(label: e.$1, value: e.$2)).toList(),
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  const _MetricItem({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 96,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: AdminHomePalette.statValue.copyWith(fontSize: 26)),
          const SizedBox(height: 4),
          Text(label.toUpperCase(), style: AdminHomePalette.statLabel),
        ],
      ),
    );
  }
}

class _ShootRow extends StatelessWidget {
  const _ShootRow({required this.entry});

  final ShootCalendarEntry entry;

  @override
  Widget build(BuildContext context) {
    final parts = entry.day.split('-');
    final dayNum = parts.length == 3 ? parts[2] : '';
    final month = parts.length == 3 ? _shortMonth(int.tryParse(parts[1]) ?? 1) : '';
    final location = [
      if (entry.city != null && entry.city!.isNotEmpty) entry.city,
      if (entry.venue != null && entry.venue!.isNotEmpty) entry.venue,
    ].whereType<String>().join(' · ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.18)),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 52,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(dayNum, style: AdminHomePalette.scheduleTime.copyWith(fontSize: 20)),
                    Text(month.toUpperCase(), style: AdminHomePalette.statLabel),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.clientName, style: AdminHomePalette.editorialTitle.copyWith(fontSize: 17)),
                    if (location.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(location, style: AdminHomePalette.editorialMeta),
                    ],
                  ],
                ),
              ),
              _StatusPill(active: entry.hasPostProduction),
            ],
          ),
        ),
      ),
    );
  }

  String _shortMonth(int m) {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[(m - 1).clamp(0, 11)];
  }
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.18)),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.clientName ?? 'Wedding',
                      style: AdminHomePalette.editorialTitle.copyWith(fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      task.label,
                      style: AdminHomePalette.editorialMeta,
                    ),
                    if (task.assigneeName != null) ...[
                      const SizedBox(height: 2),
                      Text(task.assigneeName!, style: AdminHomePalette.statLabel),
                    ],
                  ],
                ),
              ),
              _StatusPill(active: task.status == 'COMPLETED', label: task.status),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.active, this.label});

  final bool active;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final text = label ?? (active ? 'Active' : 'Pipeline');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AdminHomePalette.accent.withValues(alpha: active ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          color: AdminHomePalette.text.withValues(alpha: active ? 1 : 0.75),
        ),
      ),
    );
  }
}
