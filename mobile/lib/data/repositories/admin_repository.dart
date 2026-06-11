import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/admin_overview.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/task_activity.dart';
import 'package:hsdash_mobile/models/attendance_alert.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';

/// Admin APIs — see `API.md` → Admin section.
class AdminRepository {
  AdminRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  /// `GET /admin/overview`
  Future<AdminOverview> fetchOverview() async {
    final data = await _api.getJson('/admin/overview');
    final statsJson = data['stats'] as Map<String, dynamic>? ?? {};
    final tasksJson = data['tasks'] as List<dynamic>? ?? [];
    final entriesJson = data['entries'] as List<dynamic>? ?? [];
    return AdminOverview(
      stats: OverviewStats.fromJson(statsJson),
      tasks: tasksJson.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList(),
      entries: entriesJson.map((e) => ShootCalendarEntry.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  /// `GET /admin/task-activity?limit=`
  Future<List<TaskActivity>> fetchTaskActivity({int limit = 200}) async {
    final data = await _api.getJson('/admin/task-activity', query: {'limit': limit.clamp(1, 200)});
    final list = data['activities'] as List<dynamic>? ?? [];
    return list.map((e) => TaskActivity.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `GET /admin/attendance-alerts?limit=`
  Future<List<AttendanceAlert>> fetchAttendanceAlerts({int limit = 80}) async {
    final data = await _api.getJson('/admin/attendance-alerts', query: {'limit': limit.clamp(1, 200)});
    final list = data['alerts'] as List<dynamic>? ?? [];
    return list.map((e) => AttendanceAlert.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `POST /admin/clear-production-data`
  Future<void> clearProductionData() async {
    await _api.postJson('/admin/clear-production-data', body: {'confirm': 'DELETE_ALL_SHOOTS'});
  }
}
