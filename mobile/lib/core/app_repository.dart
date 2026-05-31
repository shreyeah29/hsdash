import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/core/token_storage.dart';
import 'package:hsdash_mobile/models/notification.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/user.dart';

class AppRepository {
  AppRepository({ApiClient? api, TokenStorage? tokenStorage})
      : _api = api ?? ApiClient(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  final ApiClient _api;
  final TokenStorage _tokenStorage;

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

  Future<({OverviewStats stats, List<Task> tasks})> fetchAdminOverview() async {
    final data = await _api.getJson('/admin/overview');
    final statsJson = data['stats'] as Map<String, dynamic>? ?? {};
    final tasksJson = data['tasks'] as List<dynamic>? ?? [];
    return (
      stats: OverviewStats.fromJson(statsJson),
      tasks: tasksJson.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Future<List<Task>> fetchTasks() async {
    final data = await _api.getJson('/tasks');
    final list = data['tasks'] as List<dynamic>? ?? [];
    return list.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Task> updateTaskStatus(String id, String status) async {
    final data = await _api.putJson('/tasks/$id/status', body: {'status': status});
    final taskJson = data['task'] as Map<String, dynamic>?;
    if (taskJson == null) throw ApiException('Missing task in response');
    return Task.fromJson(taskJson);
  }

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
}
