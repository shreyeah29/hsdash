import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/data/repositories/tasks_repository.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';

final tasksRepositoryProvider = Provider<TasksRepository>((ref) => TasksRepository());

/// Server-side filters for `GET /tasks` (admin/coordinator).
class TasksQueryNotifier extends Notifier<TasksQuery> {
  @override
  TasksQuery build() => TasksQuery.empty;

  void setTeam(String? team) => state = state.copyWith(team: team, clearTeam: team == null);
  void setStatus(String? status) => state = state.copyWith(status: status, clearStatus: status == null);
  void setPriority(String? priority) => state = state.copyWith(priority: priority, clearPriority: priority == null);
  void clearAll() => state = TasksQuery.empty;
}

final tasksQueryProvider = NotifierProvider<TasksQueryNotifier, TasksQuery>(TasksQueryNotifier.new);

/// Client search (wedding / deliverable name).
class TaskSearchNotifier extends Notifier<String> {
  @override
  String build() => '';

  void set(String value) => state = value;
}

final taskSearchProvider = NotifierProvider<TaskSearchNotifier, String>(TaskSearchNotifier.new);

final tasksProvider = FutureProvider.autoDispose<List<Task>>((ref) async {
  final query = ref.watch(tasksQueryProvider);
  return ref.read(tasksRepositoryProvider).fetchTasks(query: query.isEmpty ? null : query);
});

enum TaskFilter { open, done, all }

class TaskFilterNotifier extends Notifier<TaskFilter> {
  @override
  TaskFilter build() => TaskFilter.open;

  void setFilter(TaskFilter value) => state = value;
}

final taskFilterProvider = NotifierProvider<TaskFilterNotifier, TaskFilter>(TaskFilterNotifier.new);

final filteredTasksProvider = Provider.autoDispose<AsyncValue<List<Task>>>((ref) {
  final filter = ref.watch(taskFilterProvider);
  final search = ref.watch(taskSearchProvider).trim().toLowerCase();
  final tasks = ref.watch(tasksProvider);

  return tasks.whenData((list) {
    Iterable<Task> result = list;
    switch (filter) {
      case TaskFilter.open:
        result = result.where((t) => t.status != 'COMPLETED');
      case TaskFilter.done:
        result = result.where((t) => t.status == 'COMPLETED');
      case TaskFilter.all:
        break;
    }
    if (search.isNotEmpty) {
      result = result.where((t) {
        final client = (t.clientName ?? '').toLowerCase();
        final label = t.label.toLowerCase();
        final type = t.taskType.toLowerCase();
        return client.contains(search) || label.contains(search) || type.contains(search);
      });
    }
    return sortTasksByDeadline(result.toList());
  });
});

/// Invalidate task-related caches after mutations (mirrors web query invalidation).
void invalidateTaskCaches(WidgetRef ref) {
  ref.invalidate(tasksProvider);
  ref.invalidate(adminOverviewProvider);
  ref.invalidate(adminTaskActivityProvider);
}
