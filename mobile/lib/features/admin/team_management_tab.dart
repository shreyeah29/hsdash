import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/app_brand.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/users/users_providers.dart';
import 'package:hsdash_mobile/models/studio_team.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/models/user_form.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/reset_password_sheet.dart';
import 'package:hsdash_mobile/widgets/user_form_sheet.dart';

/// Visual tokens for team roster — admin premium or default app chrome.
class _TeamUi {
  const _TeamUi({required this.admin});

  final bool admin;

  Color get bg => admin ? Colors.transparent : AppColors.surface;
  Color get surface => admin ? AdminHomePalette.surface : AppColors.surface;
  Color get card => admin ? AdminHomePalette.elevated : Colors.white;
  Color get accent => admin ? AdminHomePalette.accent : AppColors.violet;
  Color get onAccent => admin ? AdminHomePalette.onAccent : Colors.white;
  Color get text => admin ? AdminHomePalette.text : AppColors.textPrimary;
  Color get textMuted => admin ? AdminHomePalette.textMuted : AppColors.textMuted;
  Color get border => admin ? AdminHomePalette.cardBorder : AppColors.border;
  Color get divider => admin ? AdminHomePalette.divider : AppColors.border;
  Color get danger => admin ? AdminHomePalette.error : AppColors.rose;

  double get radius => admin ? AdminHomePalette.radiusCard : 16;

  TextStyle get pageTitle => admin
      ? AdminHomePalette.pageTitle.copyWith(fontSize: 28)
      : const TextStyle(fontWeight: FontWeight.w800, fontSize: 24, letterSpacing: -0.6);

  TextStyle get sectionTitle => admin
      ? AdminHomePalette.editorialTitle.copyWith(fontSize: 17)
      : const TextStyle(fontWeight: FontWeight.w700, fontSize: 16);

  TextStyle get sectionMeta => admin
      ? AdminHomePalette.editorialMeta.copyWith(fontSize: 12)
      : const TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.3);

  TextStyle get memberName => admin
      ? AdminHomePalette.editorialTitle.copyWith(fontSize: 16, fontWeight: FontWeight.w700)
      : const TextStyle(fontWeight: FontWeight.w600, fontSize: 16);

  TextStyle get memberMeta => admin
      ? AdminHomePalette.editorialMeta.copyWith(fontSize: 13)
      : const TextStyle(fontSize: 13, color: AppColors.textMuted);

  Color teamAccent(String? teamKey, {required bool isAdmin}) {
    if (!admin) {
      return isAdmin ? AppColors.violet : StudioTeam.accentFor(teamKey);
    }
    if (isAdmin) return AdminHomePalette.accent;
    if (AdminHomePalette.isStudio) return AdminHomePalette.heroGradientEnd;
    return AdminHomePalette.ivory;
  }
}

/// Admin team roster — users CRUD (admin only).
class TeamManagementTab extends ConsumerStatefulWidget {
  const TeamManagementTab({super.key, this.adminThemed = false});

  final bool adminThemed;

  @override
  ConsumerState<TeamManagementTab> createState() => _TeamManagementTabState();
}

class _TeamManagementTabState extends ConsumerState<TeamManagementTab> {
  String _query = '';

  _TeamUi get _ui => _TeamUi(admin: widget.adminThemed);

  @override
  Widget build(BuildContext context) {
    if (widget.adminThemed) watchAdminPalette(ref);
    final users = ref.watch(usersProvider);
    final canManage = ref.watch(canManageTeamProvider);
    final ui = _ui;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: widget.adminThemed
          ? (AdminHomePalette.lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark)
          : SystemUiOverlayStyle.dark,
      child: users.when(
        loading: () => _scrollable(
          ui: ui,
          onRefresh: () async => invalidateUsersCaches(ref),
          children: [
            SizedBox(height: MediaQuery.sizeOf(context).height * 0.35),
            Center(child: CircularProgressIndicator(color: ui.accent, strokeWidth: 2)),
          ],
        ),
        error: (e, _) => _scrollable(
          ui: ui,
          onRefresh: () async => invalidateUsersCaches(ref),
          children: [
            Padding(
              padding: const EdgeInsets.all(22),
              child: ErrorPanel(message: '$e', onRetry: () => invalidateUsersCaches(ref)),
            ),
          ],
        ),
        data: (list) => _scrollable(
          ui: ui,
          onRefresh: () async => invalidateUsersCaches(ref),
          children: _buildContent(context, ref, list, ui, canManage),
        ),
      ),
    );
  }

  Widget _scrollable({
    required _TeamUi ui,
    required Future<void> Function() onRefresh,
    required List<Widget> children,
  }) {
    return RefreshIndicator(
      color: ui.accent,
      backgroundColor: ui.card,
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(22, 16, 22, 32),
        children: children,
      ),
    );
  }

  List<Widget> _buildContent(
    BuildContext context,
    WidgetRef ref,
    List<User> list,
    _TeamUi ui,
    bool canManage,
  ) {
    final filtered = _filterUsers(list);
    final sections = groupUsersByStudioTeam(filtered);

    final widgets = <Widget>[
      _TeamHeader(ui: ui, onAdd: canManage ? () => _openCreate(context, ref) : null),
      const SizedBox(height: 20),
      TextField(
        onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
        style: TextStyle(color: ui.text, fontWeight: FontWeight.w500),
        cursorColor: ui.accent,
        decoration: InputDecoration(
          hintText: 'Search by name or username',
          hintStyle: TextStyle(color: ui.textMuted, fontWeight: FontWeight.w500),
          prefixIcon: Icon(Icons.search_rounded, size: 22, color: ui.textMuted),
          filled: true,
          fillColor: ui.surface,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(ui.radius),
            borderSide: BorderSide(color: ui.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(ui.radius),
            borderSide: BorderSide(color: ui.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(ui.radius),
            borderSide: BorderSide(color: ui.accent, width: 1.5),
          ),
        ),
      ),
      const SizedBox(height: 24),
    ];

    if (list.isEmpty) {
      widgets.add(_TeamEmptyState(ui: ui, onAdd: canManage ? () => _openCreate(context, ref) : null));
    } else if (filtered.isEmpty) {
      widgets.add(
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: Text(
            'No members match your search.',
            style: ui.memberMeta,
            textAlign: TextAlign.center,
          ),
        ),
      );
    } else {
      for (final section in sections) {
        widgets.addAll([
          _TeamSectionHeader(ui: ui, section: section),
          const SizedBox(height: 10),
          _TeamMemberList(ui: ui, users: section.members),
          const SizedBox(height: 22),
        ]);
      }
    }

    return widgets;
  }

  List<User> _filterUsers(List<User> list) {
    if (_query.isEmpty) return list;
    return list
        .where((u) =>
            u.name.toLowerCase().contains(_query) ||
            u.username.toLowerCase().contains(_query))
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
          username: '',
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

class _TeamCard extends StatelessWidget {
  const _TeamCard({required this.ui, required this.child, this.padding});

  final _TeamUi ui;
  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    if (!ui.admin) {
      return Container(
        padding: padding ?? const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: ui.card,
          borderRadius: BorderRadius.circular(ui.radius),
          border: Border.all(color: ui.border),
        ),
        child: child,
      );
    }

    return Container(
      padding: padding ?? AdminHomePalette.cardPadding,
      decoration: BoxDecoration(
        color: AdminHomePalette.card,
        borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
        border: Border.all(color: AdminHomePalette.cardBorder),
        boxShadow: AdminHomePalette.elevationDeep,
      ),
      child: child,
    );
  }
}

class _TeamHeader extends StatelessWidget {
  const _TeamHeader({required this.ui, this.onAdd});

  final _TeamUi ui;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Team members', style: ui.pageTitle),
        if (onAdd != null) ...[
          const SizedBox(height: 14),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.icon(
              onPressed: onAdd,
              style: FilledButton.styleFrom(
                backgroundColor: ui.accent,
                foregroundColor: ui.onAccent,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
              label: const Text('Add member', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ],
    );
  }
}

class _TeamSectionHeader extends StatelessWidget {
  const _TeamSectionHeader({required this.ui, required this.section});

  final _TeamUi ui;
  final TeamMemberSection section;

  @override
  Widget build(BuildContext context) {
    final isAdmin = section.id == 'admin';
    final accent = ui.teamAccent(section.id == 'unassigned' ? null : section.id, isAdmin: isAdmin);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: accent.withValues(alpha: ui.admin ? 0.14 : 0.12),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: accent.withValues(alpha: ui.admin ? 0.28 : 0.2)),
          ),
          alignment: Alignment.center,
          child: Icon(
            isAdmin ? Icons.shield_outlined : StudioTeam.iconFor(section.id),
            size: 18,
            color: accent,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(section.title, style: ui.sectionTitle.copyWith(color: ui.text)),
              if (section.subtitle != null) ...[
                const SizedBox(height: 3),
                Text(section.subtitle!, style: ui.sectionMeta.copyWith(color: ui.textMuted)),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _TeamEmptyState extends StatelessWidget {
  const _TeamEmptyState({required this.ui, this.onAdd});

  final _TeamUi ui;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return _TeamCard(
      ui: ui,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.people_outline_rounded, size: 48, color: ui.accent.withValues(alpha: 0.55)),
          const SizedBox(height: 14),
          Text('No team members yet', style: ui.sectionTitle.copyWith(color: ui.text)),
          const SizedBox(height: 8),
          Text(
            'Add editors and coordinators by production team — Photo, Cinematic, Album, and more.',
            textAlign: TextAlign.center,
            style: ui.memberMeta,
          ),
          if (onAdd != null) ...[
            const SizedBox(height: 22),
            FilledButton.icon(
              onPressed: onAdd,
              style: FilledButton.styleFrom(
                backgroundColor: ui.accent,
                foregroundColor: ui.onAccent,
                elevation: 0,
              ),
              icon: const Icon(Icons.person_add_alt_1_rounded),
              label: const Text('Add first member', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ],
      ),
    );
  }
}

class _TeamMemberList extends StatelessWidget {
  const _TeamMemberList({required this.ui, required this.users});

  final _TeamUi ui;
  final List<User> users;

  @override
  Widget build(BuildContext context) {
    return _TeamCard(
      ui: ui,
      padding: EdgeInsets.zero,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < users.length; i++) ...[
            if (i > 0) Divider(height: 1, indent: 72, color: ui.divider),
            _TeamMemberTile(ui: ui, user: users[i]),
          ],
        ],
      ),
    );
  }
}

class _TeamMemberTile extends ConsumerWidget {
  const _TeamMemberTile({required this.ui, required this.user});

  final _TeamUi ui;
  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdmin = user.role == UserRole.admin;
    final canManage = ref.watch(canManageTeamProvider);
    final teamKey = StudioTeam.normalize(user.team);
    final accent = ui.teamAccent(teamKey, isAdmin: isAdmin);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: ui.admin ? 0.14 : 0.12),
              borderRadius: BorderRadius.circular(12),
              border: ui.admin ? Border.all(color: accent.withValues(alpha: 0.22)) : null,
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
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: ui.memberName.copyWith(color: ui.text),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  user.username,
                  style: ui.memberMeta,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _Tag(
                      label: user.roleLabel,
                      bg: accent.withValues(alpha: ui.admin ? 0.16 : 0.12),
                      fg: accent,
                    ),
                    if (teamKey != null)
                      _Tag(
                        label: StudioTeam.displayLabel(teamKey),
                        bg: ui.admin ? ui.surface : AppColors.surface,
                        fg: ui.textMuted,
                      ),
                    if (user.designation != null && user.designation!.isNotEmpty)
                      _Tag(
                        label: user.designation!,
                        bg: ui.admin ? ui.surface : AppColors.surface,
                        fg: ui.textMuted,
                      ),
                  ],
                ),
              ],
            ),
          ),
          if (!isAdmin && canManage)
            _MemberActionsMenu(
              ui: ui,
              onEdit: () => _editUser(context, ref),
              onResetPassword: () => _resetPassword(context, ref),
              onDelete: () => _deleteUser(context, ref),
            ),
        ],
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
      confirmColor: ui.danger,
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
    required this.ui,
    required this.onEdit,
    required this.onResetPassword,
    required this.onDelete,
  });

  final _TeamUi ui;
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
            color: ui.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ui.border),
          ),
          child: Icon(Icons.more_horiz_rounded, size: 20, color: ui.textMuted),
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
      color: ui.card,
      surfaceTintColor: Colors.transparent,
      elevation: ui.admin ? 0 : 12,
      shadowColor: Colors.black.withValues(alpha: 0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: ui.border),
      ),
      constraints: const BoxConstraints(minWidth: 200),
      items: [
        _menuItem('edit', Icons.edit_outlined, 'Edit profile & team', ui.accent),
        _menuItem('password', Icons.lock_reset_rounded, 'Reset password', ui.text),
        const PopupMenuDivider(height: 1),
        _menuItem('delete', Icons.person_remove_outlined, 'Remove member', ui.danger),
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
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: color.withValues(alpha: value == 'delete' ? 1 : 0.9)),
          const SizedBox(width: 12),
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: color,
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
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: fg.withValues(alpha: 0.15)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}
