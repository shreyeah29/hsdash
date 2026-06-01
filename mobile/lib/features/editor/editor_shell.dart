import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/tasks_list_tab.dart';
import 'package:hsdash_mobile/widgets/wedding_deliverables.dart';

class EditorShell extends ConsumerStatefulWidget {
  const EditorShell({super.key, required this.user});

  final User user;

  @override
  ConsumerState<EditorShell> createState() => _EditorShellState();
}

class _EditorShellState extends ConsumerState<EditorShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(unreadCountProvider);

    return DashboardShell(
      user: widget.user,
      tabIndex: _tab,
      onTabChanged: (i) => setState(() => _tab = i),
      accent: AppColors.emerald,
      onLogout: () => ref.read(authControllerProvider.notifier).logout(),
      titles: const ['Today', 'My tasks', 'Alerts'],
      destinations: [
        const NavigationDestination(icon: Icon(Icons.wb_sunny_outlined), selectedIcon: Icon(Icons.wb_sunny), label: 'Today'),
        const NavigationDestination(icon: Icon(Icons.checklist_outlined), selectedIcon: Icon(Icons.checklist), label: 'Tasks'),
        NavigationDestination(
          icon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.notifications_outlined)),
          selectedIcon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.notifications)),
          label: 'Alerts',
        ),
      ],
      children: [
        _TodayTab(user: widget.user),
        TasksListTab(
          title: 'My tasks',
          subtitle: widget.user.roleLabel,
          showStatusActions: true,
        ),
        _NotificationsTab(onOpenTasks: () => setState(() => _tab = 1)),
      ],
    );
  }
}

class _TodayTab extends ConsumerWidget {
  const _TodayTab({required this.user});
  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(tasksProvider);
    final notes = ref.watch(notificationsProvider);
    final hour = DateTime.now().hour;
    final firstName = user.name.split(' ').first;

    return RefreshIndicator(
      onRefresh: () async {
        invalidateTaskCaches(ref);
        ref.invalidate(notificationsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          DashboardHero(
            badge: greetingForHour(hour),
            title: 'Hey $firstName',
            subtitle: tasks.maybeWhen(
              data: (list) {
                final stats = computeEditorStats(list);
                return stats.open > 0
                    ? '${stats.open} cuts need your signature. ${stats.dueThisWeek} due this week.'
                    : 'No assignments yet — admin routes work to you here.';
              },
              orElse: () => 'Loading your edit bay…',
            ),
            accent: AppColors.emerald,
            background: const Color(0xFFECFDF5),
          ),
          const SizedBox(height: 20),
          tasks.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => invalidateTaskCaches(ref)),
            data: (list) {
              final stats = computeEditorStats(list);
              final nextUp = sortTasksByDeadline(list.where((t) => t.status != 'COMPLETED').toList()).take(6).toList();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.5,
                    children: [
                      DashboardStatCard(label: 'Urgent', value: '${stats.urgent}', hint: '≤ 24 hours', accent: AppColors.amber),
                      DashboardStatCard(label: 'This week', value: '${stats.dueThisWeek}', hint: 'Stay ahead', accent: AppColors.cyan),
                      DashboardStatCard(label: 'Overdue', value: '${stats.overdue}', hint: 'Recover gracefully', accent: AppColors.rose),
                      DashboardStatCard(label: 'Completion', value: '${stats.progress}%', hint: 'Personal throughput', accent: AppColors.emerald),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text('Signal inbox', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  notes.when(
                    loading: () => const LinearProgressIndicator(),
                    error: (_, __) => const EmptyPanel(message: 'Could not load notifications.'),
                    data: (notifications) {
                      if (notifications.isEmpty) return const EmptyPanel(message: 'Quiet channel — new assignments appear here.');
                      return Column(
                        children: notifications.take(5).map((n) => Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              color: n.read ? Colors.white : const Color(0xFFECFDF5),
                              child: ListTile(
                                title: Text(n.title, style: TextStyle(fontWeight: n.read ? FontWeight.w500 : FontWeight.w700)),
                                subtitle: n.body.isNotEmpty ? Text(n.body) : null,
                              ),
                            )).toList(),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  Text('Incoming countdowns', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  if (nextUp.isEmpty)
                    const EmptyPanel(message: 'No tasks assigned to you yet.')
                  else
                    ...nextUp.map((t) => PriorityTaskCard(task: t)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _NotificationsTab extends ConsumerWidget {
  const _NotificationsTab({required this.onOpenTasks});
  final VoidCallback onOpenTasks;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = ref.watch(notificationsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(notificationsProvider),
      child: notes.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ListView(children: [Padding(padding: const EdgeInsets.all(20), child: Text('$e', style: const TextStyle(color: AppColors.rose)))]),
        data: (list) {
          if (list.isEmpty) {
            return ListView(children: const [SizedBox(height: 80), Center(child: Text('No notifications yet.', style: TextStyle(color: AppColors.textMuted)))]);
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (list.any((n) => !n.read))
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () async {
                      await ref.read(appRepositoryProvider).markAllNotificationsRead();
                      ref.invalidate(notificationsProvider);
                    },
                    child: const Text('Mark all read'),
                  ),
                ),
              ...list.map((n) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  color: n.read ? Colors.white : const Color(0xFFECFDF5),
                  child: ListTile(
                    title: Text(n.title, style: TextStyle(fontWeight: n.read ? FontWeight.w500 : FontWeight.w700)),
                    subtitle: n.body.isNotEmpty ? Text(n.body) : null,
                    trailing: n.read
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.check, size: 20),
                            onPressed: () async {
                              await ref.read(appRepositoryProvider).markNotificationRead(n.id);
                              ref.invalidate(notificationsProvider);
                            },
                          ),
                    onTap: onOpenTasks,
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
