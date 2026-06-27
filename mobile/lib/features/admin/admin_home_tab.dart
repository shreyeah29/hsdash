import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_section_page.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_controller.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_profile.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/auth/workspace_profile_menu_button.dart';
import 'package:hsdash_mobile/models/admin_overview.dart';
import 'package:hsdash_mobile/models/task.dart' show Task;
import 'package:hsdash_mobile/widgets/change_password_sheet.dart';
import 'package:hsdash_mobile/widgets/change_username_sheet.dart';

/// Admin dashboard home — premium cinematic visual layer only.
class AdminHomeTab extends ConsumerWidget {
  const AdminHomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    watchAdminPalette(ref);
    final overview = ref.watch(adminOverviewProvider);
    final profile = ref.watch(adminWorkspaceProvider);
    final todayKey = localDayKey(DateTime.now());
    final friendlyToday = formatFriendlyDay(todayKey);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AdminHomePalette.lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: RefreshIndicator(
          color: AdminHomePalette.accent,
          backgroundColor: AdminHomePalette.card,
          onRefresh: () async => ref.invalidate(adminOverviewProvider),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _HeroSection(
                      profile: profile,
                      friendlyToday: friendlyToday,
                      onSwitchProfile: profile == null
                          ? null
                          : () async {
                              await ref.read(adminWorkspaceProvider.notifier).clear();
                              if (context.mounted) context.go('/admin/profiles');
                            },
                      onChangePassword: profile == null ? null : () => _openChangePassword(context, ref),
                      onChangeUsername: profile == null ? null : () => _openChangeUsername(context, ref),
                      onLogout: () => ref.read(authControllerProvider.notifier).logout(),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(22, 8, 22, 28),
                      child: overview.when(
                        loading: () => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 48),
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
                    ),
                  ],
                ),
              ),
            ],
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

class _HeroSection extends StatelessWidget {
  const _HeroSection({
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

  @override
  Widget build(BuildContext context) {
    final studio = AdminHomePalette.isStudio;

    return ClipRect(
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          Positioned(
            top: -100,
            left: -70,
            child: _HeroGlow(
              size: studio ? 240 : 260,
              color: studio ? const Color(0xFF8B5CF6) : AdminHomePalette.backdropAccent,
              opacity: studio ? 0.32 : 0.24,
            ),
          ),
          if (studio)
            Positioned(
              top: 30,
              right: -50,
              child: _HeroGlow(
                size: 180,
                color: const Color(0xFF4C1D95),
                opacity: 0.2,
              ),
            )
          else
            Positioned(
              top: 10,
              right: -30,
              child: _HeroGlow(
                size: 200,
                color: AdminHomePalette.accent,
                opacity: 0.16,
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 20),
            child: _EditorialHeader(
              profile: profile,
              friendlyToday: friendlyToday,
              onSwitchProfile: onSwitchProfile,
              onChangePassword: onChangePassword,
              onChangeUsername: onChangeUsername,
              onLogout: onLogout,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroGlow extends StatelessWidget {
  const _HeroGlow({
    required this.size,
    required this.color,
    required this.opacity,
  });

  final double size;
  final Color color;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color.withValues(alpha: opacity),
            color.withValues(alpha: 0),
          ],
        ),
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
            const SizedBox(width: 8),
            const AdminThemeToggle(),
          ],
        ),
        const SizedBox(height: 28),
        if (AdminHomePalette.isStudio)
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: [AdminHomePalette.text, AdminHomePalette.heroGradientEnd],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            blendMode: BlendMode.srcIn,
            child: const _RunwayHeroLines(),
          )
        else
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: [AdminHomePalette.ivory, AdminHomePalette.accent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            blendMode: BlendMode.srcIn,
            child: const _RunwayHeroLines(),
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

class _RunwayHeroLines extends StatelessWidget {
  const _RunwayHeroLines();

  @override
  Widget build(BuildContext context) {
    final style = AdminHomePalette.runwayHeroEmphasis.copyWith(fontSize: 34, color: AdminHomePalette.text);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('This is your', style: style),
        Text('production runway', style: style),
        const SizedBox(height: 6),
        Text('for today', style: style),
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
    final open = data.tasks.where((t) => t.status != 'COMPLETED').toList();
    final duesByDay = groupOpenTasksByDeadlineDay(open, (t) => t.deadline, (t) => t.status);
    final todayTasks = duesByDay[todayKey] ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('QUICK ACCESS', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 16),
        Row(
          children: [
            AdminHomeShortcut(
              icon: Icons.folder_outlined,
              label: 'Weddings',
              onTap: () => AdminSectionPage.openWeddings(context),
            ),
            const SizedBox(width: 12),
            AdminHomeShortcut(
              icon: Icons.timeline_outlined,
              label: 'Activity',
              onTap: () => AdminSectionPage.openActivity(context),
            ),
            const SizedBox(width: 12),
            AdminHomeShortcut(
              icon: Icons.people_outline,
              label: 'Team',
              onTap: () => AdminSectionPage.openTeam(context),
            ),
          ],
        ),
        const SizedBox(height: 36),
        Text('DUE TODAY', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 16),
        if (todayTasks.isNotEmpty)
          ...todayTasks.map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: AdminHomeSurface(
                padding: const EdgeInsets.all(16),
                child: _TaskRow(task: t),
              ),
            ),
          )
        else
          Text(
            'Nothing due today — you\'re clear for $friendlyToday.',
            style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.85)),
          ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.clientName ?? 'Wedding',
                  style: AdminHomePalette.editorialTitle.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 6),
                Text(
                  task.label,
                  style: AdminHomePalette.editorialMeta.copyWith(fontSize: 14),
                ),
                if (task.assigneeName != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    task.assigneeName!,
                    style: AdminHomePalette.statLabel.copyWith(fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
          _StatusPill(active: task.status == 'COMPLETED', label: task.status),
        ],
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
    final chipColor = label != null ? AdminHomePalette.statusColor(label!) : AdminHomePalette.bronze;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: chipColor.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: chipColor.withValues(alpha: 0.35)),
      ),
      child: Text(
        text.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          color: chipColor,
        ),
      ),
    );
  }
}
