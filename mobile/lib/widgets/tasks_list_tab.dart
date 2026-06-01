import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';

/// Shared tasks list — `GET /tasks` + optional filters + status actions.
class TasksListTab extends ConsumerWidget {
  const TasksListTab({
    super.key,
    this.title,
    this.subtitle,
    this.showStatusActions = false,
    this.showServerFilters = false,
  });

  final String? title;
  final String? subtitle;
  final bool showStatusActions;
  final bool showServerFilters;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(taskFilterProvider);
    final tasks = ref.watch(filteredTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title!, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                if (subtitle != null) Text(subtitle!, style: const TextStyle(color: AppColors.textMuted)),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'Search wedding or deliverable…',
              prefixIcon: Icon(Icons.search, size: 20),
              isDense: true,
            ),
            onChanged: (v) => ref.read(taskSearchProvider.notifier).set(v),
          ),
        ),
        if (showServerFilters) ...[
          const SizedBox(height: 10),
          const _ServerFiltersRow(),
        ],
        const SizedBox(height: 10),
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
            onRefresh: () async {
              invalidateTaskCaches(ref);
            },
            child: tasks.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: ErrorPanel(message: '$e', onRetry: () => invalidateTaskCaches(ref)),
                  ),
                ],
              ),
              data: (list) {
                if (list.isEmpty) {
                  return ListView(
                    children: const [
                      SizedBox(height: 80),
                      Center(child: Text('No tasks match this view.', style: TextStyle(color: AppColors.textMuted))),
                    ],
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: list.length,
                  itemBuilder: (context, i) => _TaskRow(
                    task: list[i],
                    showStatusActions: showStatusActions,
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _ServerFiltersRow extends ConsumerWidget {
  const _ServerFiltersRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(tasksQueryProvider);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _FilterChip(
            label: 'All teams',
            selected: query.team == null,
            onTap: () => ref.read(tasksQueryProvider.notifier).setTeam(null),
          ),
          ...TaskTeam.values.map((v) => _FilterChip(
                label: TaskTeam.labels[v]!,
                selected: query.team == v,
                onTap: () => ref.read(tasksQueryProvider.notifier).setTeam(v),
              )),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'All statuses',
            selected: query.status == null,
            onTap: () => ref.read(tasksQueryProvider.notifier).setStatus(null),
          ),
          ...TaskStatusFilter.values.map((v) => _FilterChip(
                label: TaskStatusFilter.labels[v]!,
                selected: query.status == v,
                onTap: () => ref.read(tasksQueryProvider.notifier).setStatus(v),
              )),
          if (!query.isEmpty) ...[
            const SizedBox(width: 8),
            ActionChip(
              label: const Text('Clear filters'),
              onPressed: () => ref.read(tasksQueryProvider.notifier).clearAll(),
            ),
          ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.violetLight,
        checkmarkColor: AppColors.violet,
      ),
    );
  }
}

class _TaskRow extends ConsumerStatefulWidget {
  const _TaskRow({required this.task, required this.showStatusActions});

  final Task task;
  final bool showStatusActions;

  @override
  ConsumerState<_TaskRow> createState() => _TaskRowState();
}

class _TaskRowState extends ConsumerState<_TaskRow> {
  bool _busy = false;

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(tasksRepositoryProvider).updateStatus(widget.task.id, status);
      invalidateTaskCaches(ref);
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
    final hint = deadlineHint(t.deadline);

    Widget? action;
    if (widget.showStatusActions && !_busy && t.status != 'COMPLETED') {
      if (t.status == 'PENDING' || t.status == 'DELAYED') {
        action = TextButton(onPressed: () => _update(TaskStatusUpdate.inProgress), child: const Text('Start'));
      } else if (t.status == 'IN_PROGRESS') {
        action = TextButton(onPressed: () => _update(TaskStatusUpdate.completed), child: const Text('Mark done'));
      }
    } else if (_busy) {
      action = const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2));
    }

    return TaskCard(
      clientName: t.clientName ?? 'Wedding',
      label: t.label,
      status: t.status,
      subtitle: '${hint.date} · ${hint.hint}${t.assigneeName != null ? ' · ${t.assigneeName}' : ''}',
      trailing: action,
    );
  }
}
