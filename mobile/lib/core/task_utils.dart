import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/task.dart';

String greetingForHour(int hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

({String date, String hint, String tone}) deadlineHint(String iso) {
  final due = DateTime.parse(iso).toLocal();
  final now = DateTime.now();
  final days = due.difference(DateTime(now.year, now.month, now.day)).inDays;
  final date = formatFriendlyDay(iso, includeYear: true);
  if (days < 0) return (date: date, hint: '${days.abs()}d overdue', tone: 'rose');
  if (days == 0) return (date: date, hint: 'Due today', tone: 'amber');
  if (days == 1) return (date: date, hint: 'Due tomorrow', tone: 'amber');
  return (date: date, hint: 'In $days days', tone: 'zinc');
}

/// Runway label for deadline calendar rows.
String runwayStatusLabel(Task task) {
  final delay = taskDelayDays(task.deadline);
  if (delay > 0 && task.status != 'COMPLETED') {
    return 'DELAYED · ${delay}d';
  }
  return switch (task.status) {
    'IN_PROGRESS' => 'IN PROGRESS',
    'PENDING' => 'PENDING',
    'DELAYED' => 'DELAYED',
    'COMPLETED' => 'DONE',
    _ => task.status,
  };
}

bool runwayStatusIsDelayed(Task task) =>
    task.status != 'COMPLETED' && taskDelayDays(task.deadline) > 0;

Map<String, List<Task>> groupTasksByWedding(List<Task> tasks) {
  final map = <String, List<Task>>{};
  for (final t in tasks) {
    final key = t.clientName ?? 'Unknown wedding';
    map.putIfAbsent(key, () => []).add(t);
  }
  for (final list in map.values) {
    list.sort((a, b) => a.deadline.compareTo(b.deadline));
  }
  return map;
}

List<Task> sortTasksByDeadline(List<Task> tasks) {
  return [...tasks]..sort((a, b) {
      final aDone = a.status == 'COMPLETED' ? 1 : 0;
      final bDone = b.status == 'COMPLETED' ? 1 : 0;
      if (aDone != bDone) return aDone - bDone;
      return a.deadline.compareTo(b.deadline);
    });
}

class EditorStats {
  const EditorStats({
    required this.urgent,
    required this.dueThisWeek,
    required this.overdue,
    required this.progress,
    required this.open,
    required this.total,
  });

  final int urgent;
  final int dueThisWeek;
  final int overdue;
  final int progress;
  final int open;
  final int total;
}

EditorStats computeEditorStats(List<Task> tasks) {
  final now = DateTime.now();
  final open = tasks.where((t) => t.status != 'COMPLETED').toList();
  var overdue = 0;
  var dueThisWeek = 0;
  var urgent = 0;
  for (final t in open) {
    final due = DateTime.parse(t.deadline).toLocal();
    final diffDays = due.difference(DateTime(now.year, now.month, now.day)).inDays;
    if (diffDays < 0) overdue++;
    if (diffDays >= 0 && diffDays <= 7) dueThisWeek++;
    if (diffDays <= 1) urgent++;
  }
  final completed = tasks.where((t) => t.status == 'COMPLETED').length;
  final progress = tasks.isEmpty ? 0 : ((completed / tasks.length) * 100).round();
  return EditorStats(
    urgent: urgent,
    dueThisWeek: dueThisWeek,
    overdue: overdue,
    progress: progress,
    open: open.length,
    total: tasks.length,
  );
}

String teamLabel(String? team) {
  if (team == null || team.isEmpty) return 'Unassigned';
  return team.replaceAll('_TEAM', '').replaceAll('_', ' ').toLowerCase().split(' ').map((w) {
    if (w.isEmpty) return w;
    return '${w[0].toUpperCase()}${w.substring(1)}';
  }).join(' ');
}

Map<String, String> monthRangeIso(DateTime date) {
  final last = DateTime(date.year, date.month + 1, 0);
  return {
    'from': '${date.year}-${pad2(date.month)}-01',
    'to': '${date.year}-${pad2(date.month)}-${pad2(last.day)}',
  };
}
