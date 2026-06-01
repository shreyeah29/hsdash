import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';

/// Editor deliverables only — for assignment grid and pipeline stats (no data copy).
final coordinatorDeliverableTasksProvider = Provider.autoDispose<AsyncValue<List<Task>>>((ref) {
  return ref.watch(tasksProvider).whenData(
        (list) => list.where((t) => !t.isDataCopy).toList(),
      );
});

/// Emmanuel's data-copy tasks only (`DATA_COPY`, assigned to logged-in coordinator).
final coordinatorDataCopyTasksProvider = Provider.autoDispose<AsyncValue<List<Task>>>((ref) {
  final userId = ref.watch(authControllerProvider).user?.id;
  return ref.watch(tasksProvider).whenData((list) {
    final mine = list.where((t) => t.isDataCopy && t.assignedToId == userId).toList();
    return sortTasksByDeadline(mine);
  });
});
