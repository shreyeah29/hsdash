import 'package:hsdash_mobile/models/task_type.dart';

class Task {
  const Task({
    required this.id,
    required this.eventId,
    required this.taskType,
    required this.deadline,
    required this.status,
    required this.priority,
    this.clientName,
    this.assigneeName,
    this.assignedToId,
    this.assignedTeam,
    this.createdAt,
  });

  final String id;
  final String eventId;
  final String taskType;
  final String deadline;
  final String status;
  final String priority;
  final String? clientName;
  final String? assigneeName;
  final String? assignedToId;
  final String? assignedTeam;
  final String? createdAt;

  bool get isDataCopy => taskType == TaskTypeKey.dataCopy;

  Task copyWith({
    String? assignedToId,
    String? assigneeName,
    String? status,
    bool clearAssignee = false,
  }) {
    return Task(
      id: id,
      eventId: eventId,
      taskType: taskType,
      deadline: deadline,
      status: status ?? this.status,
      priority: priority,
      clientName: clientName,
      assignedToId: clearAssignee ? null : (assignedToId ?? this.assignedToId),
      assigneeName: clearAssignee ? null : (assigneeName ?? this.assigneeName),
      assignedTeam: assignedTeam,
    );
  }

  factory Task.fromJson(Map<String, dynamic> json) {
    final event = json['event'] as Map<String, dynamic>?;
    final assignee = json['assignedTo'] as Map<String, dynamic>?;
    return Task(
      id: _reqString(json['id']),
      eventId: _reqString(json['eventId'], fallback: event?['id']?.toString()),
      taskType: _reqString(json['taskType'], fallback: 'DELIVERABLE'),
      deadline: _parseInstant(json['deadline']),
      status: _reqString(json['status'], fallback: 'PENDING'),
      priority: _reqString(json['priority'], fallback: 'LOW'),
      clientName: event?['clientName']?.toString(),
      assigneeName: assignee?['name']?.toString(),
      assignedToId: json['assignedToId']?.toString() ?? assignee?['id']?.toString(),
      assignedTeam: json['assignedTeam']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }

  DateTime? get createdAtLocal {
    if (createdAt == null || createdAt!.isEmpty) return null;
    try {
      return DateTime.parse(createdAt!).toLocal();
    } catch (_) {
      return null;
    }
  }

  String get label =>
      taskType.replaceAll('_', ' ').toLowerCase().split(' ').map((w) {
        if (w.isEmpty) return w;
        return '${w[0].toUpperCase()}${w.substring(1)}';
      }).join(' ');

  static String _reqString(dynamic value, {String? fallback}) {
    if (value == null) return fallback ?? '';
    return value.toString();
  }

  static String _parseInstant(dynamic value) {
    if (value == null) return '';
    final s = value.toString();
    return s;
  }
}

class OverviewStats {
  const OverviewStats({
    required this.dueToday,
    required this.overdue,
    required this.open,
    required this.weddings,
    required this.completionRate,
    this.completed = 0,
    this.pending = 0,
    this.total = 0,
    this.eventCount = 0,
    this.shootCount = 0,
  });

  final int dueToday;
  final int overdue;
  final int open;
  final int weddings;
  final int completionRate;
  final int completed;
  final int pending;
  final int total;
  final int eventCount;
  final int shootCount;

  factory OverviewStats.fromJson(Map<String, dynamic> json) {
    return OverviewStats(
      dueToday: json['dueToday'] as int? ?? 0,
      overdue: json['overdue'] as int? ?? 0,
      open: json['open'] as int? ?? 0,
      weddings: json['weddings'] as int? ?? 0,
      completionRate: json['completionRate'] as int? ?? 0,
      completed: json['completed'] as int? ?? 0,
      pending: json['pending'] as int? ?? 0,
      total: json['total'] as int? ?? 0,
      eventCount: json['eventCount'] as int? ?? 0,
      shootCount: json['shootCount'] as int? ?? 0,
    );
  }
}
