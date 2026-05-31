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
  });

  final String id;
  final String eventId;
  final String taskType;
  final String deadline;
  final String status;
  final String priority;
  final String? clientName;
  final String? assigneeName;

  factory Task.fromJson(Map<String, dynamic> json) {
    final event = json['event'] as Map<String, dynamic>?;
    final assignee = json['assignedTo'] as Map<String, dynamic>?;
    return Task(
      id: json['id'] as String,
      eventId: json['eventId'] as String,
      taskType: json['taskType'] as String,
      deadline: json['deadline'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      clientName: event?['clientName'] as String?,
      assigneeName: assignee?['name'] as String?,
    );
  }

  String get label =>
      taskType.replaceAll('_', ' ').toLowerCase().split(' ').map((w) {
        if (w.isEmpty) return w;
        return '${w[0].toUpperCase()}${w.substring(1)}';
      }).join(' ');
}

class OverviewStats {
  const OverviewStats({
    required this.dueToday,
    required this.overdue,
    required this.open,
    required this.weddings,
    required this.completionRate,
  });

  final int dueToday;
  final int overdue;
  final int open;
  final int weddings;
  final int completionRate;

  factory OverviewStats.fromJson(Map<String, dynamic> json) {
    return OverviewStats(
      dueToday: json['dueToday'] as int? ?? 0,
      overdue: json['overdue'] as int? ?? 0,
      open: json['open'] as int? ?? 0,
      weddings: json['weddings'] as int? ?? 0,
      completionRate: json['completionRate'] as int? ?? 0,
    );
  }
}
