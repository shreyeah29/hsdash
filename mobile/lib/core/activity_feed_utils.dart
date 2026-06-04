import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/task_activity.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:hsdash_mobile/models/team_member.dart';

enum ActivityPeriodFilter { today, week, month, all }

enum ActivityTypeFilter { all, assigned, started, completed, delayed }

enum ActivityViewMode { team, event, timeline }

enum OpsActivityKind { assigned, started, completed, delayed }

enum MemberHealthStatus { available, busy, delayed, noActivity }

class OpsActivityEntry {
  const OpsActivityEntry({
    required this.id,
    required this.taskId,
    required this.eventId,
    required this.kind,
    required this.timestamp,
    required this.memberId,
    required this.memberName,
    this.memberTeam,
    this.eventName,
    required this.taskName,
    this.synthetic = false,
  });

  final String id;
  final String taskId;
  final String eventId;
  final OpsActivityKind kind;
  final DateTime timestamp;
  final String memberId;
  final String memberName;
  final String? memberTeam;
  final String? eventName;
  final String taskName;
  final bool synthetic;

  factory OpsActivityEntry.fromActivity(TaskActivity a) {
    return OpsActivityEntry(
      id: a.id,
      taskId: a.taskId,
      eventId: a.eventId ?? '',
      kind: classifyActivityKind(a),
      timestamp: a.createdAtLocal ?? DateTime.fromMillisecondsSinceEpoch(0),
      memberId: a.actorId ?? a.assigneeId ?? 'unknown',
      memberName: a.actorName ?? 'Unknown',
      memberTeam: a.actorTeam ?? a.assignedTeam,
      eventName: a.clientName,
      taskName: a.taskLabel,
    );
  }

  factory OpsActivityEntry.fromTaskAssignment(Task task) {
    final created = task.createdAtLocal ?? DateTime.fromMillisecondsSinceEpoch(0);
    return OpsActivityEntry(
      id: 'assign-${task.id}',
      taskId: task.id,
      eventId: task.eventId,
      kind: OpsActivityKind.assigned,
      timestamp: created,
      memberId: task.assignedToId ?? 'unassigned',
      memberName: task.assigneeName ?? 'Unassigned',
      memberTeam: task.assignedTeam,
      eventName: task.clientName,
      taskName: task.label,
      synthetic: true,
    );
  }
}

OpsActivityKind classifyActivityKind(TaskActivity a) {
  if (a.newStatus == 'DELAYED') return OpsActivityKind.delayed;
  if (a.isCompleteEvent) return OpsActivityKind.completed;
  if (a.isStartEvent) return OpsActivityKind.started;
  if (a.isLateStart) return OpsActivityKind.delayed;
  return OpsActivityKind.started;
}

Color opsKindColor(OpsActivityKind kind) {
  switch (kind) {
    case OpsActivityKind.assigned:
      return AppColors.textMuted;
    case OpsActivityKind.started:
      return const Color(0xFF2563EB);
    case OpsActivityKind.completed:
      return AppColors.emerald;
    case OpsActivityKind.delayed:
      return AppColors.rose;
  }
}

String opsKindLabel(OpsActivityKind kind) {
  switch (kind) {
    case OpsActivityKind.assigned:
      return 'Assigned';
    case OpsActivityKind.started:
      return 'Started';
    case OpsActivityKind.completed:
      return 'Completed';
    case OpsActivityKind.delayed:
      return 'Delayed';
  }
}

class OpsDashboardFilters {
  const OpsDashboardFilters({
    this.period = ActivityPeriodFilter.today,
    this.eventId,
    this.memberId,
    this.type = ActivityTypeFilter.all,
    this.search = '',
    this.excludeMemberId,
  });

  final ActivityPeriodFilter period;
  final String? eventId;
  final String? memberId;
  final ActivityTypeFilter type;
  final String search;
  /// Hide this user's own actions (coordinator viewing team pulse).
  final String? excludeMemberId;

  OpsDashboardFilters copyWith({
    ActivityPeriodFilter? period,
    String? eventId,
    String? memberId,
    ActivityTypeFilter? type,
    String? search,
    String? excludeMemberId,
    bool clearEvent = false,
    bool clearMember = false,
  }) {
    return OpsDashboardFilters(
      period: period ?? this.period,
      eventId: clearEvent ? null : (eventId ?? this.eventId),
      memberId: clearMember ? null : (memberId ?? this.memberId),
      type: type ?? this.type,
      search: search ?? this.search,
      excludeMemberId: excludeMemberId ?? this.excludeMemberId,
    );
  }
}

class OpsOverviewMetrics {
  const OpsOverviewMetrics({
    required this.activeMembers,
    required this.assignedToday,
    required this.startedToday,
    required this.completedToday,
    required this.delayedTasks,
    required this.idleMembers,
  });

  final int activeMembers;
  final int assignedToday;
  final int startedToday;
  final int completedToday;
  final int delayedTasks;
  final int idleMembers;
}

class TeamHealthMetrics {
  const TeamHealthMetrics({
    required this.available,
    required this.busy,
    required this.delayed,
    required this.noActivity,
  });

  final int available;
  final int busy;
  final int delayed;
  final int noActivity;
}

class MemberOpsGroup {
  const MemberOpsGroup({
    required this.memberId,
    required this.memberName,
    required this.roleLabel,
    required this.openTasks,
    required this.startedInPeriod,
    required this.completedInPeriod,
    required this.lastActivity,
    required this.entries,
    required this.health,
    required this.taskTimelines,
  });

  final String memberId;
  final String memberName;
  final String roleLabel;
  final int openTasks;
  final int startedInPeriod;
  final int completedInPeriod;
  final DateTime? lastActivity;
  final List<OpsActivityEntry> entries;
  final MemberHealthStatus health;
  final List<TaskTimeline> taskTimelines;
}

class TaskTimeline {
  const TaskTimeline({
    required this.taskId,
    required this.eventName,
    required this.taskName,
    required this.steps,
  });

  final String taskId;
  final String eventName;
  final String taskName;
  final List<OpsActivityEntry> steps;
}

class EventOpsGroup {
  const EventOpsGroup({
    required this.eventId,
    required this.eventName,
    required this.assignedMembers,
    required this.startedMembers,
    required this.completedMembers,
    required this.delayedMembers,
    required this.entries,
  });

  final String eventId;
  final String eventName;
  final List<String> assignedMembers;
  final List<String> startedMembers;
  final List<String> completedMembers;
  final List<String> delayedMembers;
  final List<OpsActivityEntry> entries;
}

class OpsDashboardData {
  const OpsDashboardData({
    required this.overview,
    required this.health,
    required this.members,
    required this.events,
    required this.timeline,
    required this.eventOptions,
    required this.memberOptions,
  });

  final OpsOverviewMetrics overview;
  final TeamHealthMetrics health;
  final List<MemberOpsGroup> members;
  final List<EventOpsGroup> events;
  final List<OpsActivityEntry> timeline;
  final List<({String id, String label})> eventOptions;
  final List<({String id, String label})> memberOptions;
}

bool _inPeriod(DateTime at, ActivityPeriodFilter period) {
  final now = DateTime.now();
  switch (period) {
    case ActivityPeriodFilter.today:
      return localDayKey(at) == localDayKey(now);
    case ActivityPeriodFilter.week:
      return at.isAfter(now.subtract(const Duration(days: 7)));
    case ActivityPeriodFilter.month:
      return at.isAfter(now.subtract(const Duration(days: 30)));
    case ActivityPeriodFilter.all:
      return true;
  }
}

bool _isToday(DateTime at) => localDayKey(at) == localDayKey(DateTime.now());

String teamLabel(String? teamKey) {
  if (teamKey == null) return 'Team';
  return TaskTeam.labels[teamKey] ?? teamKey.replaceAll('_TEAM', '').replaceAll('_', ' ');
}

String memberRoleLabel(TeamMember? roster, String? teamKey) {
  if (roster?.designation != null && roster!.designation!.isNotEmpty) {
    return roster.designation!;
  }
  return teamLabel(teamKey);
}

List<OpsActivityEntry> buildOpsEntries({
  required List<TaskActivity> activities,
  required List<Task> tasks,
}) {
  final activityTaskIds = activities.map((a) => a.taskId).toSet();
  final entries = activities.map(OpsActivityEntry.fromActivity).toList();

  for (final task in tasks) {
    if (task.assignedToId == null) continue;
    if (activityTaskIds.contains(task.id)) continue;
    if (task.createdAtLocal == null) continue;
    entries.add(OpsActivityEntry.fromTaskAssignment(task));
  }

  entries.sort((a, b) => b.timestamp.compareTo(a.timestamp));
  return entries;
}

List<OpsActivityEntry> applyOpsFilters(
  List<OpsActivityEntry> entries,
  OpsDashboardFilters filters,
) {
  final q = filters.search.trim().toLowerCase();
  return entries.where((e) {
    if (!_inPeriod(e.timestamp, filters.period)) return false;
    if (filters.excludeMemberId != null && e.memberId == filters.excludeMemberId) return false;
    if (filters.eventId != null && e.eventId != filters.eventId) return false;
    if (filters.memberId != null && e.memberId != filters.memberId) return false;
    if (filters.type != ActivityTypeFilter.all) {
      final match = switch (filters.type) {
        ActivityTypeFilter.assigned => e.kind == OpsActivityKind.assigned,
        ActivityTypeFilter.started => e.kind == OpsActivityKind.started,
        ActivityTypeFilter.completed => e.kind == OpsActivityKind.completed,
        ActivityTypeFilter.delayed => e.kind == OpsActivityKind.delayed,
        ActivityTypeFilter.all => true,
      };
      if (!match) return false;
    }
    if (q.isNotEmpty) {
      final hay = '${e.memberName} ${e.eventName ?? ''} ${e.taskName}'.toLowerCase();
      if (!hay.contains(q)) return false;
    }
    return true;
  }).toList();
}

MemberHealthStatus _memberHealth({
  required List<Task> memberTasks,
  required List<OpsActivityEntry> memberEntries,
  required ActivityPeriodFilter period,
}) {
  final open = memberTasks.where((t) => t.status != 'COMPLETED').toList();
  if (open.isEmpty) return MemberHealthStatus.available;
  if (open.any((t) => t.status == 'DELAYED')) return MemberHealthStatus.delayed;
  if (open.any((t) => t.status == 'IN_PROGRESS')) return MemberHealthStatus.busy;
  final hasActivity = memberEntries.any((e) => _inPeriod(e.timestamp, period));
  if (open.isNotEmpty && !hasActivity) return MemberHealthStatus.noActivity;
  return MemberHealthStatus.available;
}

List<TaskTimeline> _buildTaskTimelines(List<OpsActivityEntry> entries, List<Task> tasks) {
  final tasksById = {for (final t in tasks) t.id: t};
  final byTask = <String, List<OpsActivityEntry>>{};
  for (final e in entries) {
    byTask.putIfAbsent(e.taskId, () => []).add(e);
  }
  return byTask.entries.map((kv) {
    final steps = [...kv.value]..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    final task = tasksById[kv.key];
    if (task != null && task.createdAtLocal != null && !steps.any((s) => s.kind == OpsActivityKind.assigned)) {
      steps.insert(0, OpsActivityEntry.fromTaskAssignment(task));
    }
    final first = steps.first;
    return TaskTimeline(
      taskId: kv.key,
      eventName: first.eventName ?? 'Event',
      taskName: first.taskName,
      steps: steps,
    );
  }).toList()
    ..sort((a, b) {
      final aLast = a.steps.last.timestamp;
      final bLast = b.steps.last.timestamp;
      return bLast.compareTo(aLast);
    });
}

OpsDashboardData buildOpsDashboard({
  required List<TaskActivity> activities,
  required List<Task> tasks,
  required OpsDashboardFilters filters,
  List<TeamMember> roster = const [],
}) {
  final allEntries = buildOpsEntries(activities: activities, tasks: tasks);
  final filtered = applyOpsFilters(allEntries, filters);

  final rosterById = {for (final m in roster) m.id: m};
  final memberIds = <String>{};
  for (final e in filtered) {
    if (e.memberId != 'unknown' && e.memberId != 'unassigned') memberIds.add(e.memberId);
  }
  for (final t in tasks) {
    if (t.assignedToId != null) memberIds.add(t.assignedToId!);
  }
  if (filters.excludeMemberId != null) {
    memberIds.remove(filters.excludeMemberId);
  }

  final eventOptionsMap = <String, String>{};
  for (final e in allEntries) {
    if (e.eventId.isNotEmpty) eventOptionsMap[e.eventId] = e.eventName ?? 'Event';
  }
  for (final t in tasks) {
    eventOptionsMap[t.eventId] = t.clientName ?? 'Event';
  }

  final memberOptions = memberIds.map((id) {
    String name = rosterById[id]?.name ?? 'Unknown';
    for (final e in allEntries) {
      if (e.memberId == id) {
        name = e.memberName;
        break;
      }
    }
    for (final t in tasks) {
      if (t.assignedToId == id && t.assigneeName != null) {
        name = t.assigneeName!;
        break;
      }
    }
    return (id: id, label: name);
  }).toList()
    ..sort((a, b) => a.label.compareTo(b.label));

  final eventOptions = eventOptionsMap.entries.map((e) => (id: e.key, label: e.value)).toList()
    ..sort((a, b) => a.label.compareTo(b.label));

  var assignedToday = 0;
  var startedToday = 0;
  var completedToday = 0;
  var delayedTasks = tasks.where((t) => t.status == 'DELAYED').length;
  var activeMembers = 0;
  var idleMembers = 0;

  final members = <MemberOpsGroup>[];
  for (final id in memberIds) {
    final memberTasks = tasks.where((t) => t.assignedToId == id).toList();
    final memberEntries = filtered.where((e) => e.memberId == id).toList();
    final openCount = memberTasks.where((t) => t.status != 'COMPLETED').length;
    final started = memberEntries.where((e) => e.kind == OpsActivityKind.started).length;
    final completed = memberEntries.where((e) => e.kind == OpsActivityKind.completed).length;
    final last = memberEntries.isEmpty ? null : memberEntries.first.timestamp;
    final teamKey = rosterById[id]?.team ?? memberEntries.firstOrNull?.memberTeam ?? memberTasks.firstOrNull?.assignedTeam;

    final health = _memberHealth(memberTasks: memberTasks, memberEntries: memberEntries, period: filters.period);
    if (memberEntries.isNotEmpty) activeMembers++;
    if (health == MemberHealthStatus.noActivity) idleMembers++;

    members.add(
      MemberOpsGroup(
        memberId: id,
        memberName: rosterById[id]?.name ?? memberEntries.firstOrNull?.memberName ?? 'Unknown',
        roleLabel: memberRoleLabel(rosterById[id], teamKey),
        openTasks: openCount,
        startedInPeriod: started,
        completedInPeriod: completed,
        lastActivity: last,
        entries: memberEntries,
        health: health,
        taskTimelines: _buildTaskTimelines(memberEntries, tasks),
      ),
    );
  }

  members.sort((a, b) {
    return (b.lastActivity ?? DateTime.fromMillisecondsSinceEpoch(0))
        .compareTo(a.lastActivity ?? DateTime.fromMillisecondsSinceEpoch(0));
  });

  for (final e in filtered) {
    if (e.kind == OpsActivityKind.assigned && _isToday(e.timestamp)) assignedToday++;
    if (e.kind == OpsActivityKind.started && _isToday(e.timestamp)) startedToday++;
    if (e.kind == OpsActivityKind.completed && _isToday(e.timestamp)) completedToday++;
  }

  var available = 0;
  var busy = 0;
  var delayed = 0;
  var noActivity = 0;
  for (final m in members) {
    switch (m.health) {
      case MemberHealthStatus.available:
        available++;
      case MemberHealthStatus.busy:
        busy++;
      case MemberHealthStatus.delayed:
        delayed++;
      case MemberHealthStatus.noActivity:
        noActivity++;
    }
  }

  final eventsMap = <String, EventOpsGroup>{};
  for (final e in filtered) {
    if (e.eventId.isEmpty) continue;
    final existing = eventsMap[e.eventId];
    final assigned = {...?existing?.assignedMembers.toSet()};
    final started = {...?existing?.startedMembers.toSet()};
    final completed = {...?existing?.completedMembers.toSet()};
    final delayedMembers = {...?existing?.delayedMembers.toSet()};
    final entries = [...?existing?.entries, e];

    switch (e.kind) {
      case OpsActivityKind.assigned:
        assigned.add(e.memberName);
      case OpsActivityKind.started:
        started.add(e.memberName);
      case OpsActivityKind.completed:
        completed.add(e.memberName);
      case OpsActivityKind.delayed:
        delayedMembers.add(e.memberName);
    }

    eventsMap[e.eventId] = EventOpsGroup(
      eventId: e.eventId,
      eventName: e.eventName ?? existing?.eventName ?? 'Event',
      assignedMembers: assigned.toList()..sort(),
      startedMembers: started.toList()..sort(),
      completedMembers: completed.toList()..sort(),
      delayedMembers: delayedMembers.toList()..sort(),
      entries: entries,
    );
  }

  final events = eventsMap.values.toList()
    ..sort((a, b) => a.eventName.compareTo(b.eventName));

  return OpsDashboardData(
    overview: OpsOverviewMetrics(
      activeMembers: activeMembers,
      assignedToday: assignedToday,
      startedToday: startedToday,
      completedToday: completedToday,
      delayedTasks: delayedTasks,
      idleMembers: idleMembers,
    ),
    health: TeamHealthMetrics(
      available: available,
      busy: busy,
      delayed: delayed,
      noActivity: noActivity,
    ),
    members: members,
    events: events,
    timeline: filtered,
    eventOptions: eventOptions,
    memberOptions: memberOptions,
  );
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull {
    final it = iterator;
    if (!it.moveNext()) return null;
    return it.current;
  }
}
