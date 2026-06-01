import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/task_activity.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';

enum ActivityDayFilter { today, week, all }

class MemberActivityGroup {
  const MemberActivityGroup({
    required this.memberId,
    required this.memberName,
    required this.teamKey,
    required this.events,
    required this.openTaskCount,
    required this.staleTaskCount,
  });

  final String memberId;
  final String memberName;
  final String? teamKey;
  final List<TaskActivity> events;
  final int openTaskCount;
  final int staleTaskCount;

  int get startedCount => events.where((e) => e.isStartEvent).length;
  int get completedCount => events.where((e) => e.isCompleteEvent).length;
  int get lateStartCount => events.where((e) => e.isLateStart).length;

  bool get hasActivityToday => events.any((e) => _isToday(e.createdAt));
}

bool _isToday(String iso) {
  try {
    return localDayKey(DateTime.parse(iso).toLocal()) == localDayKey(DateTime.now());
  } catch (_) {
    return false;
  }
}

bool activityMatchesFilter(TaskActivity a, ActivityDayFilter filter) {
  if (filter == ActivityDayFilter.all) return true;
  final at = a.createdAtLocal;
  if (at == null) return false;
  final now = DateTime.now();
  if (filter == ActivityDayFilter.today) {
    return localDayKey(at) == localDayKey(now);
  }
  final weekAgo = now.subtract(const Duration(days: 7));
  return at.isAfter(weekAgo);
}

String teamLabel(String? teamKey) {
  if (teamKey == null) return 'Team';
  return TaskTeam.labels[teamKey] ?? teamKey.replaceAll('_TEAM', '').replaceAll('_', ' ');
}

int _teamSortOrder(String? team) {
  switch (team) {
    case TaskTeam.coordinator:
      return 0;
    case TaskTeam.photo:
      return 1;
    case TaskTeam.cinematic:
      return 2;
    case TaskTeam.traditional:
      return 3;
    case TaskTeam.album:
      return 4;
    default:
      return 5;
  }
}

/// Groups audit events by person and attaches open-task workload hints.
List<MemberActivityGroup> buildMemberActivityGroups({
  required List<TaskActivity> activities,
  required List<Task> openTasks,
  required ActivityDayFilter filter,
}) {
  final filtered = activities.where((a) => activityMatchesFilter(a, filter)).toList();

  final eventsByMember = <String, List<TaskActivity>>{};
  final names = <String, String>{};
  final teams = <String, String?>{};

  for (final a in filtered) {
    final id = a.actorId ?? a.actorName ?? 'unknown';
    eventsByMember.putIfAbsent(id, () => []).add(a);
    if (a.actorName != null) names[id] = a.actorName!;
    teams[id] = a.actorTeam ?? a.assignedTeam;
  }

  // Include editors/coordinator with open work but no events in this window.
  for (final t in openTasks) {
    if (t.assignedToId == null) continue;
    final id = t.assignedToId!;
    eventsByMember.putIfAbsent(id, () => []);
    if (t.assigneeName != null) names[id] = t.assigneeName!;
    teams[id] = t.assignedTeam;
  }

  final groups = eventsByMember.entries.map((e) {
    final id = e.key;
    final events = [...e.value]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final memberOpen = openTasks.where((t) => t.assignedToId == id && t.status != 'COMPLETED').toList();
    final stale = memberOpen.where((t) => t.status == 'PENDING' || t.status == 'DELAYED').length;
    return MemberActivityGroup(
      memberId: id,
      memberName: names[id] ?? 'Unknown',
      teamKey: teams[id],
      events: events,
      openTaskCount: memberOpen.length,
      staleTaskCount: stale,
    );
  }).toList();

  groups.sort((a, b) {
    final teamCmp = _teamSortOrder(a.teamKey).compareTo(_teamSortOrder(b.teamKey));
    if (teamCmp != 0) return teamCmp;
    return a.memberName.compareTo(b.memberName);
  });

  return groups;
}

ActivityFeedSummary summarizeFeed(List<MemberActivityGroup> groups, ActivityDayFilter filter) {
  var started = 0;
  var completed = 0;
  var late = 0;
  var idle = 0;
  var activeMembers = 0;

  for (final g in groups) {
    started += g.startedCount;
    completed += g.completedCount;
    late += g.lateStartCount;
    if (g.events.isEmpty && g.staleTaskCount > 0) idle++;
    if (g.events.isNotEmpty) activeMembers++;
  }

  return ActivityFeedSummary(
    filter: filter,
    activeMembers: activeMembers,
    started: started,
    completed: completed,
    lateStarts: late,
    idleMembers: idle,
    totalMembers: groups.length,
  );
}

class ActivityFeedSummary {
  const ActivityFeedSummary({
    required this.filter,
    required this.activeMembers,
    required this.started,
    required this.completed,
    required this.lateStarts,
    required this.idleMembers,
    required this.totalMembers,
  });

  final ActivityDayFilter filter;
  final int activeMembers;
  final int started;
  final int completed;
  final int lateStarts;
  final int idleMembers;
  final int totalMembers;
}
