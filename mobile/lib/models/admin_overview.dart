import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';

class AdminOverview {
  const AdminOverview({
    required this.stats,
    required this.tasks,
    required this.entries,
  });

  final OverviewStats stats;
  final List<Task> tasks;
  final List<ShootCalendarEntry> entries;
}
