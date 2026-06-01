import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/users/users_providers.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/models/user_form.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';
import 'package:hsdash_mobile/widgets/user_form_sheet.dart';

/// Admin team management — full `API.md` Users CRUD.
class TeamManagementTab extends ConsumerWidget {
  const TeamManagementTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(usersProvider);

    return RefreshIndicator(
      onRefresh: () async => invalidateUsersCaches(ref),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              const Expanded(
                child: DashboardHero(
                  badge: 'People & access',
                  title: 'Studio roster',
                  subtitle: 'GET/POST/PUT/DELETE /users — manage coordinators and editors.',
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                style: IconButton.styleFrom(backgroundColor: AppColors.violet),
                onPressed: () => _openCreate(context, ref),
                icon: const Icon(Icons.person_add, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 20),
          users.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => invalidateUsersCaches(ref)),
            data: (list) {
              if (list.isEmpty) return const EmptyPanel(message: 'No team members yet. Tap + to add someone.');
              final active = list.where((u) => u.isActive).length;
              final coordinators = list.where((u) => u.role == UserRole.coordinator).length;
              final editors = list.where((u) => u.role == UserRole.editor).length;
              final admins = list.where((u) => u.role == UserRole.admin).length;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      StatChip(label: 'Total', value: '${list.length}'),
                      StatChip(label: 'Active', value: '$active', accent: AppColors.emerald),
                      StatChip(label: 'Coordinators', value: '$coordinators', accent: AppColors.amber),
                      StatChip(label: 'Editors', value: '$editors', accent: AppColors.cyan),
                      if (admins > 0) StatChip(label: 'Admins', value: '$admins', accent: AppColors.violet),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...list.map((u) => _UserCard(user: u)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _openCreate(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(usersRepositoryProvider);
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => UserFormSheet(
        isEdit: false,
        initial: const UserFormData(name: '', email: '', role: UserRoleApi.editor),
        onSave: (form) => repo.createUser(form),
      ),
    );
    if (ok == true) invalidateUsersCaches(ref);
  }
}

class _UserCard extends ConsumerWidget {
  const _UserCard({required this.user});

  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.read(usersRepositoryProvider);
    final isAdmin = user.role == UserRole.admin;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.violetLight,
                  child: Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : '?', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(user.email, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: user.isActive ? AppColors.emerald.withValues(alpha: 0.1) : AppColors.rose.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(user.isActive ? 'Active' : 'Paused', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: user.isActive ? AppColors.emerald : AppColors.rose)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _RoleChip(label: user.roleLabel),
                if (user.team != null) _RoleChip(label: user.team!.replaceAll('_TEAM', '').replaceAll('_', ' ')),
                if (user.designation != null && user.designation!.isNotEmpty) Text(user.designation!, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
            ),
            if (!isAdmin) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                children: [
                  OutlinedButton(
                    onPressed: () async {
                      final ok = await showModalBottomSheet<bool>(
                        context: context,
                        isScrollControlled: true,
                        builder: (ctx) => UserFormSheet(
                          isEdit: true,
                          initial: UserFormData.fromUser(user),
                          onSave: (form) => repo.updateUser(user.id, form),
                        ),
                      );
                      if (ok == true) invalidateUsersCaches(ref);
                    },
                    child: const Text('Edit'),
                  ),
                  OutlinedButton(
                    onPressed: () => _resetPassword(context, ref, user),
                    child: const Text('Reset password'),
                  ),
                  TextButton(
                    style: TextButton.styleFrom(foregroundColor: AppColors.rose),
                    onPressed: () => _deleteUser(context, ref, user),
                    child: const Text('Delete'),
                  ),
                ],
              ),
            ] else
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text('Admin accounts cannot be deleted from mobile.', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _resetPassword(BuildContext context, WidgetRef ref, User user) async {
    final controller = TextEditingController();
    final password = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reset password for ${user.name}'),
        content: TextField(
          controller: controller,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'New password', hintText: 'Min 8 characters'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Reset')),
        ],
      ),
    );
    controller.dispose();
    if (password == null || password.length < 8) return;
    try {
      await ref.read(usersRepositoryProvider).resetPassword(user.id, password);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _deleteUser(BuildContext context, WidgetRef ref, User user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete user?'),
        content: Text('Remove ${user.name} (${user.email})? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ref.read(usersRepositoryProvider).deleteUser(user.id);
      invalidateUsersCaches(ref);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: AppColors.violetLight, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.violet)),
    );
  }
}
