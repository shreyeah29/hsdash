import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_widgets.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';

class LaxmanTasksTab extends ConsumerStatefulWidget {
  const LaxmanTasksTab({super.key});

  @override
  ConsumerState<LaxmanTasksTab> createState() => _LaxmanTasksTabState();
}

class _LaxmanTasksTabState extends ConsumerState<LaxmanTasksTab> {
  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(taskFilterProvider);
    final tasks = ref.watch(filteredTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 20, 28, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('WORK', style: LaxmanType.sectionHead('')),
              const SizedBox(height: 8),
              Text('Cuts', style: LaxmanType.display('Cuts', size: 44)),
              const SizedBox(height: 28),
              TextField(
                style: LaxmanType.body('', size: 18),
                cursorColor: LaxmanPalette.black,
                decoration: InputDecoration(
                  hintText: 'Search wedding or deliverable',
                  hintStyle: LaxmanType.body('', size: 16).copyWith(
                    fontWeight: FontWeight.w400,
                    color: LaxmanPalette.black.withValues(alpha: 0.45),
                  ),
                  border: const UnderlineInputBorder(borderSide: BorderSide(color: LaxmanPalette.black, width: 2)),
                  enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: LaxmanPalette.black, width: 1)),
                  focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: LaxmanPalette.black, width: 2.5)),
                  contentPadding: const EdgeInsets.only(bottom: 12),
                ),
                onChanged: (v) => ref.read(taskSearchProvider.notifier).set(v),
              ),
              const SizedBox(height: 24),
              LaxmanFilterRail(
                selected: filter,
                onChanged: (f) => ref.read(taskFilterProvider.notifier).setFilter(f),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: RefreshIndicator(
            color: LaxmanPalette.black,
            backgroundColor: LaxmanPalette.white,
            onRefresh: () async => invalidateTaskCaches(ref),
            child: tasks.when(
              loading: () => const Center(child: CircularProgressIndicator(color: LaxmanPalette.black)),
              error: (e, _) => ListView(
                children: [
                  Padding(padding: const EdgeInsets.all(28), child: Text('$e', style: LaxmanType.body('$e'))),
                ],
              ),
              data: (list) {
                if (list.isEmpty) {
                  return ListView(
                    children: [
                      const SizedBox(height: 80),
                      Center(child: Text('No tasks in this view.', style: LaxmanType.body('', size: 18))),
                    ],
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(28, 8, 28, 32),
                  itemCount: list.length,
                  itemBuilder: (context, i) {
                    return Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (i > 0) const Divider(height: 1, color: LaxmanPalette.black),
                        _LaxmanEditableTaskRow(task: list[i]),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _LaxmanEditableTaskRow extends ConsumerStatefulWidget {
  const _LaxmanEditableTaskRow({required this.task});

  final Task task;

  @override
  ConsumerState<_LaxmanEditableTaskRow> createState() => _LaxmanEditableTaskRowState();
}

class _LaxmanEditableTaskRowState extends ConsumerState<_LaxmanEditableTaskRow> {
  bool _busy = false;

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(tasksRepositoryProvider).updateStatus(widget.task.id, status);
      invalidateTaskCaches(ref);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$e', style: const TextStyle(color: LaxmanPalette.white)),
            backgroundColor: LaxmanPalette.black,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.task;
    final hint = deadlineHint(t.deadline);
    final action = laxmanTaskAction(
      showActions: true,
      busy: _busy,
      status: t.status,
      onStart: () => _update(TaskStatusUpdate.inProgress),
      onComplete: () => _update(TaskStatusUpdate.completed),
    );

    return LaxmanTaskRow(
      clientName: t.clientName ?? 'Wedding',
      label: t.label,
      meta: '${hint.date} · ${hint.hint}',
      status: t.status,
      trailing: action,
    );
  }
}
