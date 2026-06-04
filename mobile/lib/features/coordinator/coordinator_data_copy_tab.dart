import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/coordinator/coordinator_providers.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';

/// Coordinator (Emmanuel): update **data copy** only — due 1 day after the event.
class CoordinatorDataCopyTab extends ConsumerWidget {
  const CoordinatorDataCopyTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(coordinatorDataCopyTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Data copy', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              Text(
                'Your SPOC task — due 1 day after each shoot. Mark progress here; admins see it on the dashboard.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => invalidateTaskCaches(ref),
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
                      Center(
                        child: Text(
                          'No data copy tasks assigned to you yet.',
                          style: TextStyle(color: AppColors.textMuted),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: list.length,
                  itemBuilder: (context, i) => _DataCopyRow(task: list[i]),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _DataCopyRow extends ConsumerStatefulWidget {
  const _DataCopyRow({required this.task});

  final Task task;

  @override
  ConsumerState<_DataCopyRow> createState() => _DataCopyRowState();
}

class _DataCopyRowState extends ConsumerState<_DataCopyRow> {
  bool _busy = false;
  Task? _localTask;

  Task get _task => _localTask ?? widget.task;

  @override
  void didUpdateWidget(covariant _DataCopyRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.task.id != widget.task.id || oldWidget.task.status != widget.task.status) {
      _localTask = null;
    }
  }

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      final updated = await ref.read(tasksRepositoryProvider).updateStatus(widget.task.id, status);
      if (!mounted) return;
      setState(() => _localTask = updated);
      invalidateTaskCaches(ref);
      if (status == TaskStatusUpdate.inProgress && updated.status != 'IN_PROGRESS') {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Server returned ${updated.status} instead of IN PROGRESS — deploy the latest backend to Render.',
            ),
            duration: const Duration(seconds: 5),
          ),
        );
        return;
      }
      final label = updated.status == 'COMPLETED'
          ? 'Marked complete'
          : updated.status == 'IN_PROGRESS'
              ? 'Started — now in progress'
              : 'Updated';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(label)));
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
    final t = _task;
    final hint = deadlineHint(t.deadline);

    final action = buildTaskStatusAction(
      showActions: true,
      busy: _busy,
      status: t.status,
      onStart: () => _update(TaskStatusUpdate.inProgress),
      onComplete: () => _update(TaskStatusUpdate.completed),
    );

    final statusLabel = t.status == 'DELAYED' ? 'DELAYED (overdue)' : t.status;

    return TaskCard(
      clientName: t.clientName ?? 'Wedding',
      label: 'Data copy',
      status: statusLabel,
      subtitle: 'Due ${hint.date} · ${hint.hint}',
      trailing: action,
    );
  }
}
