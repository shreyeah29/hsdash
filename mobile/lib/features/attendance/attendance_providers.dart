import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/attendance_repository.dart';
import 'package:hsdash_mobile/models/attendance_alert.dart';
import 'package:hsdash_mobile/models/work_shift.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) => AttendanceRepository());

final workShiftTodayProvider = FutureProvider.autoDispose<WorkShiftToday>((ref) async {
  return ref.read(attendanceRepositoryProvider).fetchToday();
});

final attendanceAlertsProvider = FutureProvider.autoDispose<List<AttendanceAlert>>((ref) async {
  return ref.read(adminRepositoryProvider).fetchAttendanceAlerts();
});
