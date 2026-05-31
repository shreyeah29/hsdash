import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';
import 'package:intl/intl.dart';

class StaffShell extends ConsumerStatefulWidget {
  const StaffShell({super.key, required this.user});

  final User user;

  @override
  ConsumerState<StaffShell> createState() => _StaffShellState();
}

class _StaffShellState extends ConsumerState<StaffShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(unreadCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_tab == 0 ? 'My tasks' : 'Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: IndexedStack(
        index: _tab,
        children: [
          _TasksTab(user: widget.user),
          _NotificationsTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.checklist_outlined), selectedIcon: Icon(Icons.checklist), label: 'Tasks'),
          NavigationDestination(
            icon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.notifications_outlined)),
            selectedIcon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.notifications)),
            label: 'Alerts',
          ),
        ],
      ),
    );
  }
}

class _TasksTab extends ConsumerWidget {
  const _TasksTab({required this.user});
  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(taskFilterProvider);
    final tasks = ref.watch(filteredTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Hello, ${user.name}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              Text(user.roleLabel, style: const TextStyle(color: AppColors.textMuted)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SegmentedButton<TaskFilter>(
            segments: const [
              ButtonSegment(value: TaskFilter.open, label: Text('Open')),
              ButtonSegment(value: TaskFilter.done, label: Text('Done')),
              ButtonSegment(value: TaskFilter.all, label: Text('All')),
            ],
            selected: {filter},
            onSelectionChanged: (s) => ref.read(taskFilterProvider.notifier).setFilter(s.first),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(tasksProvider),
            child: tasks.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Could not load tasks', style: TextStyle(fontWeight: FontWeight.w600)),
                            Text('$e', style: const TextStyle(color: AppColors.rose, fontSize: 13)),
                            TextButton(onPressed: () => ref.invalidate(tasksProvider), child: const Text('Retry')),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              data: (list) {
                if (list.isEmpty) {
                  return ListView(
                    children: const [
                      SizedBox(height: 80),
                      Center(child: Text('No tasks in this view.', style: TextStyle(color: AppColors.textMuted))),
                    ],
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: list.length,
                  itemBuilder: (context, i) => _TaskRow(task: list[i]),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _TaskRow extends ConsumerStatefulWidget {
  const _TaskRow({required this.task});
  final Task task;

  @override
  ConsumerState<_TaskRow> createState() => _TaskRowState();
}

class _TaskRowState extends ConsumerState<_TaskRow> {
  bool _busy = false;

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(appRepositoryProvider).updateTaskStatus(widget.task.id, status);
      ref.invalidate(tasksProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.task;
    final deadline = DateFormat('d MMM yyyy').format(DateTime.parse(t.deadline).toLocal());

    Widget? action;
    if (!_busy && t.status != 'COMPLETED') {
      if (t.status == 'PENDING' || t.status == 'DELAYED') {
        action = TextButton(onPressed: () => _update('IN_PROGRESS'), child: const Text('Start'));
      } else if (t.status == 'IN_PROGRESS') {
        action = TextButton(onPressed: () => _update('COMPLETED'), child: const Text('Mark done'));
      }
    } else if (_busy) {
      action = const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2));
    }

    return TaskCard(
      clientName: t.clientName ?? 'Wedding',
      label: t.label,
      status: t.status,
      subtitle: 'Due $deadline',
      trailing: action,
    );
  }
}

class _NotificationsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = ref.watch(notificationsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(notificationsProvider),
      child: notes.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ListView(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text('$e', style: const TextStyle(color: AppColors.rose)),
            ),
          ],
        ),
        data: (list) {
          if (list.isEmpty) {
            return ListView(
              children: const [
                SizedBox(height: 80),
                Center(child: Text('No notifications yet.', style: TextStyle(color: AppColors.textMuted))),
              ],
            );
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
                  color: n.read ? Colors.white : AppColors.violetLight,
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
