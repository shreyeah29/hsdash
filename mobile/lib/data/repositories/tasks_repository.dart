import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';

/// Tasks APIs — see `API.md` → Tasks section.
class TasksRepository {
  TasksRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  /// `GET /tasks` — editors receive only their assigned tasks (server-side).
  Future<List<Task>> fetchTasks({TasksQuery? query}) async {
    final params = query?.isEmpty == false ? query!.toQueryParams() : null;
    final data = await _api.getJson('/tasks', query: params);
    final list = data['tasks'] as List<dynamic>? ?? [];
    return list.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `PUT /tasks/:id/status` — EDITOR (own) or COORDINATOR. Admin cannot.
  Future<Task> updateStatus(String id, String status) async {
    final data = await _api.putJson('/tasks/$id/status', body: {'status': status});
    final taskJson = data['task'] as Map<String, dynamic>?;
    if (taskJson == null) throw ApiException('Missing task in response');
    return Task.fromJson(taskJson);
  }

  /// `PUT /tasks/:id/assignee` — COORDINATOR or ADMIN.
  Future<Task> updateAssignee(String id, String? assignedToId) async {
    final data = await _api.putJson('/tasks/$id/assignee', body: {'assignedToId': assignedToId});
    final taskJson = data['task'] as Map<String, dynamic>?;
    if (taskJson == null) throw ApiException('Missing task in response');
    return Task.fromJson(taskJson);
  }
}
