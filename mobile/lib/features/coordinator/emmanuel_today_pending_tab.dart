import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/coordinator/coordinator_providers.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_widgets.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';

/// Emmanuel Today — pending data copy only (same actions as Data copy tab).
class EmmanuelTodayPendingTab extends ConsumerWidget {
  const EmmanuelTodayPendingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(coordinatorDataCopyTasksProvider);
    final openCount = tasks.maybeWhen(
      data: (list) => list.where((t) => t.status != 'COMPLETED').length,
      orElse: () => 0,
    );

    return RefreshIndicator(
      color: LaxmanPalette.black,
      backgroundColor: LaxmanPalette.white,
      onRefresh: () async => invalidateProductionCaches(ref),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TODAY', style: LaxmanType.sectionHead('')),
                  const SizedBox(height: 8),
                  Text('Hard drives', style: LaxmanType.display('Hard drives', size: 36)),
                  const SizedBox(height: 8),
                  Text(
                    openCount == 0
                        ? 'All hard drives tasks are complete.'
                        : '$openCount pending — due 60 days after each event.',
                    style: LaxmanType.body('', size: 15),
                  ),
                ],
              ),
            ),
          ),
          tasks.when(
            loading: () => const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(child: CircularProgressIndicator(color: LaxmanPalette.black)),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text('$e', style: LaxmanType.body('$e')),
              ),
            ),
            data: (list) {
              final pending = list.where((t) => t.status != 'COMPLETED').toList();
              if (pending.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text('Nothing pending today.', style: LaxmanType.body('', size: 17)),
                  ),
                );
              }
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    if (i.isOdd) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20),
                        child: Divider(height: 1, color: LaxmanPalette.black),
                      );
                    }
                    final taskIndex = i ~/ 2;
                    return Padding(
                      padding: EdgeInsets.fromLTRB(20, taskIndex == 0 ? 8 : 0, 20, 0),
                      child: _PendingDataCopyRow(task: pending[taskIndex]),
                    );
                  },
                  childCount: pending.isEmpty ? 0 : pending.length * 2 - 1,
                ),
              );
            },
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}

class _PendingDataCopyRow extends ConsumerStatefulWidget {
  const _PendingDataCopyRow({required this.task});

  final Task task;

  @override
  ConsumerState<_PendingDataCopyRow> createState() => _PendingDataCopyRowState();
}

class _PendingDataCopyRowState extends ConsumerState<_PendingDataCopyRow> {
  bool _busy = false;
  Task? _local;

  Task get _task => _local ?? widget.task;

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      final updated = await ref.read(tasksRepositoryProvider).updateStatus(widget.task.id, status);
      if (mounted) setState(() => _local = updated);
      invalidateProductionCaches(ref);
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
    final t = _task;
    final hint = deadlineHint(t.deadline);
    return LaxmanTaskRow(
      clientName: t.clientName ?? 'Wedding',
      label: 'Hard drives',
      meta: '${hint.date} · ${hint.hint}',
      status: t.status,
      trailing: laxmanTaskAction(
        showActions: true,
        busy: _busy,
        status: t.status,
        onStart: () => _update(TaskStatusUpdate.inProgress),
        onComplete: () => _update(TaskStatusUpdate.completed),
      ),
    );
  }
}
