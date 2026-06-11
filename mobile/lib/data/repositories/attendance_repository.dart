import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/work_shift.dart';

class AttendanceRepository {
  AttendanceRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<WorkShiftToday> fetchToday() async {
    final data = await _api.getJson('/attendance/today');
    return WorkShiftToday.fromJson(data);
  }

  Future<WorkShiftSession> clockIn() async {
    final data = await _api.postJson('/attendance/clock-in');
    return WorkShiftSession.fromJson(data['session'] as Map<String, dynamic>);
  }

  Future<WorkShiftSession> clockOut() async {
    final data = await _api.postJson('/attendance/clock-out');
    return WorkShiftSession.fromJson(data['session'] as Map<String, dynamic>);
  }
}
