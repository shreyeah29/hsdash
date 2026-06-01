import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/core/token_storage.dart';
import 'package:hsdash_mobile/data/repositories/admin_repository.dart';
import 'package:hsdash_mobile/data/repositories/production_calendar_repository.dart';
import 'package:hsdash_mobile/data/repositories/tasks_repository.dart';
import 'package:hsdash_mobile/data/repositories/users_repository.dart';
import 'package:hsdash_mobile/models/admin_overview.dart';
import 'package:hsdash_mobile/models/notification.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/task_activity.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/team_member.dart';
import 'package:hsdash_mobile/models/user.dart';

class AppRepository {
  AppRepository({
    ApiClient? api,
    TokenStorage? tokenStorage,
    AdminRepository? admin,
    TasksRepository? tasks,
    ProductionCalendarRepository? productionCalendar,
    UsersRepository? users,
  })  : _api = api ?? ApiClient(),
        _tokenStorage = tokenStorage ?? TokenStorage(),
        _admin = admin ?? AdminRepository(api: api),
        _tasks = tasks ?? TasksRepository(api: api),
        _productionCalendar = productionCalendar ?? ProductionCalendarRepository(api: api),
        _users = users ?? UsersRepository(api: api);

  final ApiClient _api;
  final TokenStorage _tokenStorage;
  final AdminRepository _admin;
  final TasksRepository _tasks;
  final ProductionCalendarRepository _productionCalendar;
  final UsersRepository _users;

  Future<User> login({required String email, required String password}) async {
    final data = await _api.postJson('/auth/login', body: {
      'email': email.trim(),
      'password': password,
    });

    final token = data['accessToken'] as String?;
    if (token != null && token.isNotEmpty) await _tokenStorage.write(token);

    final userJson = data['user'] as Map<String, dynamic>?;
    if (userJson == null) throw ApiException('Login response missing user');
    return User.fromJson(userJson);
  }

  Future<User?> restoreSession() async {
    final token = await _tokenStorage.read();
    if (token == null || token.isEmpty) return null;
    try {
      final data = await _api.getJson('/auth/me');
      final userJson = data['user'] as Map<String, dynamic>?;
      if (userJson == null) return null;
      return User.fromJson(userJson);
    } catch (_) {
      await _tokenStorage.clear();
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _api.postJson('/auth/logout');
    } catch (_) {}
    await _tokenStorage.clear();
  }

  Future<AdminOverview> fetchAdminOverview() => _admin.fetchOverview();

  Future<List<TaskActivity>> fetchAdminTaskActivity({int limit = 100}) =>
      _admin.fetchTaskActivity(limit: limit);

  Future<void> clearProductionData() => _admin.clearProductionData();

  Future<List<Task>> fetchTasks({TasksQuery? query}) => _tasks.fetchTasks(query: query);

  Future<Task> updateTaskStatus(String id, String status) => _tasks.updateStatus(id, status);

  Future<List<AppNotification>> fetchNotifications() async {
    final data = await _api.getJson('/notifications');
    final list = data['notifications'] as List<dynamic>? ?? [];
    return list.map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markNotificationRead(String id) async {
    await _api.patchJson('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _api.postJson('/notifications/read-all');
  }

  Future<List<TeamMember>> fetchTeamMembers() => _productionCalendar.fetchTeamMembers();

  Future<List<ShootCalendarEntry>> fetchCalendarEntries({required String from, required String to}) =>
      _productionCalendar.fetchEntries(from: from, to: to);

  Future<List<User>> fetchUsers() => _users.fetchUsers();

  Future<Task> updateTaskAssignee(String id, String? assignedToId) =>
      _tasks.updateAssignee(id, assignedToId);
}
