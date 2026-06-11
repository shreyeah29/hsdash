String pad2(int n) => n.toString().padLeft(2, '0');

String localDayKey(DateTime date) =>
    '${date.year}-${pad2(date.month)}-${pad2(date.day)}';

/// Stable `YYYY-MM-DD` for calendar grouping (matches backend `parseDayUtc`).
String shootDayKey(String value) {
  final s = value.trim();
  if (RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(s)) return s;
  final d = DateTime.parse(s).toUtc();
  return '${d.year}-${pad2(d.month)}-${pad2(d.day)}';
}

/// UTC calendar day from an ISO timestamp (task deadlines, etc.).
String calendarDayKeyFromIso(String iso) => shootDayKey(iso);

String formatFriendlyDay(String isoOrKey, {bool includeYear = false}) {
  final key = isoOrKey.contains('T') ? calendarDayKeyFromIso(isoOrKey) : isoOrKey;
  final parts = key.split('-').map(int.parse).toList();
  final date = DateTime(parts[0], parts[1], parts[2]);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  final base = '${date.day} ${months[date.month - 1]}';
  return includeYear ? '$base ${date.year}' : base;
}

int daysBetweenKeys(String fromKey, String toKey) {
  DateTime parse(String k) {
    final p = k.split('-').map(int.parse).toList();
    return DateTime(p[0], p[1], p[2]);
  }
  return parse(toKey).difference(parse(fromKey)).inDays;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/// Sunday-start week containing [date].
DateTime startOfWeek(DateTime date) {
  final local = DateTime(date.year, date.month, date.day);
  return local.subtract(Duration(days: local.weekday % 7));
}

List<DateTime> weekDaysFrom(DateTime weekStart) {
  return List.generate(7, (i) => weekStart.add(Duration(days: i)));
}

const deliverableDeadlineRules = [
  ('Hard drives', 60),
  ('Sneak peak', 7),
  ('Full set photos', 20),
  ('Cinematic video', 20),
  ('Reels', 20),
  ('Traditional video', 45),
  ('Album design', 45),
  ('Album print', 60),
];

Map<String, List<T>> groupOpenTasksByDeadlineDay<T>(
  Iterable<T> tasks,
  String Function(T) deadlineOf,
  String Function(T) statusOf,
) {
  final map = <String, List<T>>{};
  for (final t in tasks) {
    if (statusOf(t) == 'COMPLETED') continue;
    final key = runwayCalendarDayKey(
      deadlineIso: deadlineOf(t),
      status: statusOf(t),
    );
    map.putIfAbsent(key, () => []).add(t);
  }
  return map;
}

/// Calendar day an open deliverable appears on — overdue tasks roll forward to today.
String runwayCalendarDayKey({required String deadlineIso, required String status}) {
  if (status == 'COMPLETED') return calendarDayKeyFromIso(deadlineIso);
  if (taskDelayDays(deadlineIso) > 0) return localDayKey(DateTime.now());
  return calendarDayKeyFromIso(deadlineIso);
}

/// Whole days past the original deadline (0 if not overdue).
int taskDelayDays(String deadlineIso) {
  final dueKey = calendarDayKeyFromIso(deadlineIso);
  final todayKey = localDayKey(DateTime.now());
  final days = daysBetweenKeys(dueKey, todayKey);
  return days > 0 ? days : 0;
}

bool isTaskOverdue(String deadlineIso, {String? status}) {
  if (status == 'COMPLETED') return false;
  return taskDelayDays(deadlineIso) > 0;
}
