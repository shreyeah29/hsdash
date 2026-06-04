import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/app_brand.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/users/users_providers.dart';
import 'package:hsdash_mobile/models/studio_team.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/models/user_form.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/reset_password_sheet.dart';
import 'package:hsdash_mobile/widgets/user_form_sheet.dart';

/// Admin team roster — users CRUD (admin only).
class TeamManagementTab extends ConsumerStatefulWidget {
  const TeamManagementTab({super.key});

  @override
  ConsumerState<TeamManagementTab> createState() => _TeamManagementTabState();
}

class _TeamManagementTabState extends ConsumerState<TeamManagementTab> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final users = ref.watch(usersProvider);
    final canManage = ref.watch(canManageTeamProvider);

    return RefreshIndicator(
      color: AppColors.violet,
      onRefresh: () async => invalidateUsersCaches(ref),
      child: users.when(
        loading: () => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.sizeOf(context).height * 0.32),
            const Center(child: CircularProgressIndicator(color: AppColors.violet)),
          ],
        ),
        error: (e, _) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
            ErrorPanel(message: '$e', onRetry: () => invalidateUsersCaches(ref)),
          ],
        ),
        data: (list) {
          final filtered = _filterUsers(list);
          final sections = groupUsersByStudioTeam(filtered);

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            children: [
              _TeamHeader(
                onAdd: canManage ? () => _openCreate(context, ref) : null,
              ),
              const SizedBox(height: 16),
              TextField(
                onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Search by name or email',
                  prefixIcon: const Icon(Icons.search, size: 22),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.violet, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (list.isEmpty)
                _TeamEmptyState(onAdd: canManage ? () => _openCreate(context, ref) : null)
              else if (filtered.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(
                    child: Text('No members match your search.', style: TextStyle(color: AppColors.textMuted)),
                  ),
                )
              else
                ...sections.expand((section) => [
                      _TeamSectionHeader(section: section),
                      const SizedBox(height: 8),
                      _TeamMemberList(users: section.members),
                      const SizedBox(height: 20),
                    ]),
            ],
          );
        },
      ),
    );
  }

  List<User> _filterUsers(List<User> list) {
    if (_query.isEmpty) return list;
    return list
        .where((u) => u.name.toLowerCase().contains(_query) || u.email.toLowerCase().contains(_query))
        .toList();
  }

  Future<void> _openCreate(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(usersRepositoryProvider);
    final ok = await showAppBottomSheet<bool>(
      context,
      builder: (ctx) => UserFormSheet(
        isEdit: false,
        forCreate: true,
        initial: const UserFormData(
          name: '',
          email: '',
          role: UserRoleApi.editor,
          team: StudioTeam.photo,
        ),
        onSave: (form) => repo.createUser(form),
      ),
    );
    if (ok == true && context.mounted) {
      invalidateUsersCaches(ref);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Team member added — roster updated everywhere')),
      );
    }
  }
}

class _TeamHeader extends StatelessWidget {
  const _TeamHeader({this.onAdd});

  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Text(
            'Team members',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                ),
          ),
        ),
        if (onAdd != null)
          FilledButton.icon(
            onPressed: onAdd,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.violet,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
            label: const Text('Add member', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
      ],
    );
  }
}

class _TeamSectionHeader extends StatelessWidget {
  const _TeamSectionHeader({required this.section});

  final TeamMemberSection section;

  @override
  Widget build(BuildContext context) {
    final accent = section.id == 'admin'
        ? AppColors.violet
        : StudioTeam.accentFor(section.id == 'unassigned' ? null : section.id);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          section.id == 'admin' ? Icons.shield_outlined : StudioTeam.iconFor(section.id),
          size: 20,
          color: accent,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                section.title,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
              if (section.subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  section.subtitle!,
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.3),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _TeamEmptyState extends StatelessWidget {
  const _TeamEmptyState({this.onAdd});

  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(Icons.people_outline, size: 48, color: AppColors.violet.withValues(alpha: 0.45)),
          const SizedBox(height: 12),
          const Text('No team members yet', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 8),
          const Text(
            'Add editors and coordinators by production team — Photo, Cinematic, Album, and more.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.4),
          ),
          if (onAdd != null) ...[
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onAdd,
              style: FilledButton.styleFrom(backgroundColor: AppColors.violet),
              icon: const Icon(Icons.person_add_alt_1_rounded),
              label: const Text('Add first member'),
            ),
          ],
        ],
      ),
    );
  }
}

class _TeamMemberList extends StatelessWidget {
  const _TeamMemberList({required this.users});

  final List<User> users;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            for (var i = 0; i < users.length; i++) ...[
              if (i > 0) const Divider(height: 1, indent: 72, color: AppColors.border),
              _TeamMemberTile(user: users[i]),
            ],
          ],
        ),
      ),
    );
  }
}

class _TeamMemberTile extends ConsumerWidget {
  const _TeamMemberTile({required this.user});

  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdmin = user.role == UserRole.admin;
    final canManage = ref.watch(canManageTeamProvider);
    final teamKey = StudioTeam.normalize(user.team);
    final accent = isAdmin ? AppColors.violet : StudioTeam.accentFor(teamKey);

    return Material(
      color: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Icon(
                isAdmin ? Icons.shield_outlined : StudioTeam.iconFor(teamKey),
                color: accent,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user.email,
                    style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      _Tag(label: user.roleLabel, bg: accent.withValues(alpha: 0.12), fg: accent),
                      if (teamKey != null)
                        _Tag(
                          label: StudioTeam.displayLabel(teamKey),
                          bg: AppColors.surface,
                          fg: AppColors.textMuted,
                        ),
                      if (user.designation != null && user.designation!.isNotEmpty)
                        _Tag(label: user.designation!, bg: AppColors.surface, fg: AppColors.textMuted),
                    ],
                  ),
                ],
              ),
            ),
            if (!isAdmin && canManage)
              _MemberActionsMenu(
                onEdit: () => _editUser(context, ref),
                onResetPassword: () => _resetPassword(context, ref),
                onDelete: () => _deleteUser(context, ref),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _editUser(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(usersRepositoryProvider);
    final ok = await showAppBottomSheet<bool>(
      context,
      builder: (ctx) => UserFormSheet(
        isEdit: true,
        initial: UserFormData.fromUser(user),
        onSave: (form) => repo.updateUser(user.id, form),
      ),
    );
    if (ok == true && context.mounted) {
      invalidateUsersCaches(ref);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Member updated — changes synced across the app')),
      );
    }
  }

  Future<void> _resetPassword(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(usersRepositoryProvider);
    final ok = await showAppBottomSheet<bool>(
      context,
      builder: (ctx) => ResetPasswordSheet(
        memberName: user.name,
        onSubmit: (password) => repo.resetPassword(user.id, password),
      ),
    );
    if (ok == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Password updated for ${user.name}')),
      );
    }
  }

  Future<void> _deleteUser(BuildContext context, WidgetRef ref) async {
    final confirm = await showAppConfirmDialog(
      context,
      title: 'Remove team member?',
      message: '${user.name} will lose access to ${AppBrand.name}. This cannot be undone.',
      confirmLabel: 'Remove',
      confirmColor: AppColors.rose,
    );
    if (confirm != true) return;
    try {
      await ref.read(usersRepositoryProvider).deleteUser(user.id);
      invalidateUsersCaches(ref);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${user.name} removed')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}

class _MemberActionsMenu extends StatelessWidget {
  const _MemberActionsMenu({
    required this.onEdit,
    required this.onResetPassword,
    required this.onDelete,
  });

  final VoidCallback onEdit;
  final VoidCallback onResetPassword;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => _show(context),
        child: Container(
          width: 36,
          height: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Icon(Icons.more_horiz_rounded, size: 20, color: AppColors.textMuted.withValues(alpha: 0.9)),
        ),
      ),
    );
  }

  Future<void> _show(BuildContext context) async {
    HapticFeedback.selectionClick();
    final box = context.findRenderObject()! as RenderBox;
    final origin = box.localToGlobal(Offset.zero);
    const menuWidth = 212.0;
    final overlayBox = Navigator.of(context).overlay!.context.findRenderObject()! as RenderBox;
    final left = (origin.dx + box.size.width - menuWidth).clamp(12.0, overlayBox.size.width - menuWidth - 12);

    final selected = await showMenu<String>(
      context: context,
      position: RelativeRect.fromRect(
        Rect.fromLTWH(left, origin.dy + box.size.height + 6, menuWidth, 0),
        Offset.zero & overlayBox.size,
      ),
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 12,
      shadowColor: Colors.black.withValues(alpha: 0.12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      constraints: const BoxConstraints(minWidth: 200),
      items: [
        _menuItem('edit', Icons.edit_outlined, 'Edit profile & team', AppColors.violet),
        _menuItem('password', Icons.lock_reset_rounded, 'Reset password', AppColors.textPrimary),
        const PopupMenuDivider(height: 1),
        _menuItem('delete', Icons.person_remove_outlined, 'Remove member', AppColors.rose),
      ],
    );

    if (!context.mounted || selected == null) return;
    switch (selected) {
      case 'edit':
        onEdit();
      case 'password':
        onResetPassword();
      case 'delete':
        onDelete();
    }
  }

  PopupMenuItem<String> _menuItem(String value, IconData icon, String label, Color color) {
    return PopupMenuItem<String>(
      value: value,
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color.withValues(alpha: value == 'delete' ? 1 : 0.85)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.bg, required this.fg});

  final String label;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
    );
  }
}
