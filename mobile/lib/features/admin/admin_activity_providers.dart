import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/attendance/attendance_providers.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/attendance_alert.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/task_activity.dart';

class ActivityFeedData {
  const ActivityFeedData({
    required this.activities,
    required this.tasks,
    required this.attendanceAlerts,
  });

  final List<TaskActivity> activities;
  final List<Task> tasks;
  final List<AttendanceAlert> attendanceAlerts;
}

final adminActivityFeedProvider = FutureProvider.autoDispose<ActivityFeedData>((ref) async {
  final activities = await ref.watch(adminTaskActivityProvider.future);
  final tasks = await ref.watch(tasksProvider.future);
  final attendanceAlerts = await ref.watch(attendanceAlertsProvider.future);
  return ActivityFeedData(activities: activities, tasks: tasks, attendanceAlerts: attendanceAlerts);
});
