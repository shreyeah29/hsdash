class TaskActivity {
  const TaskActivity({
    required this.id,
    required this.taskId,
    required this.newStatus,
    required this.createdAt,
    this.previousStatus,
    this.actorId,
    this.actorName,
    this.actorTeam,
    this.clientName,
    this.taskType,
    this.assignedTeam,
    this.taskDeadline,
    this.eventDate,
    this.currentTaskStatus,
    this.assigneeId,
  });

  final String id;
  final String taskId;
  final String? previousStatus;
  final String newStatus;
  final String createdAt;
  final String? actorId;
  final String? actorName;
  final String? actorTeam;
  final String? clientName;
  final String? taskType;
  final String? assignedTeam;
  final String? taskDeadline;
  final String? eventDate;
  final String? currentTaskStatus;
  final String? assigneeId;

  factory TaskActivity.fromJson(Map<String, dynamic> json) {
    final task = json['task'] as Map<String, dynamic>?;
    final event = task?['event'] as Map<String, dynamic>?;
    final actor = json['actor'] as Map<String, dynamic>?;
    final assignee = task?['assignedTo'] as Map<String, dynamic>?;
    return TaskActivity(
      id: json['id']?.toString() ?? '',
      taskId: json['taskId']?.toString() ?? '',
      previousStatus: json['previousStatus']?.toString(),
      newStatus: json['newStatus']?.toString() ?? 'PENDING',
      createdAt: json['createdAt']?.toString() ?? '',
      actorId: actor?['id']?.toString(),
      actorName: actor?['name']?.toString(),
      actorTeam: actor?['team']?.toString(),
      clientName: event?['clientName']?.toString(),
      taskType: task?['taskType']?.toString(),
      assignedTeam: task?['assignedTeam']?.toString(),
      taskDeadline: task?['deadline']?.toString(),
      eventDate: event?['eventDate']?.toString(),
      currentTaskStatus: task?['status']?.toString(),
      assigneeId: task?['assignedToId']?.toString() ?? assignee?['id']?.toString(),
    );
  }

  String get taskLabel {
    final raw = taskType;
    if (raw == null) return 'Task';
    return raw.replaceAll('_', ' ').toLowerCase().split(' ').map((w) {
      if (w.isEmpty) return w;
      return '${w[0].toUpperCase()}${w.substring(1)}';
    }).join(' ');
  }

  DateTime? get createdAtLocal {
    try {
      return DateTime.parse(createdAt).toLocal();
    } catch (_) {
      return null;
    }
  }

  bool get isStartEvent =>
      newStatus == 'IN_PROGRESS' &&
      (previousStatus == null || previousStatus == 'PENDING' || previousStatus == 'DELAYED');

  bool get isCompleteEvent => newStatus == 'COMPLETED';

  bool get isLateStart {
    if (!isStartEvent) return false;
    if (previousStatus == 'DELAYED') return true;
    final deadline = _parseInstant(taskDeadline);
    final at = createdAtLocal;
    if (deadline != null && at != null && at.isAfter(deadline)) return true;
    return false;
  }

  static DateTime? _parseInstant(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    try {
      return DateTime.parse(iso).toLocal();
    } catch (_) {
      return null;
    }
  }
}
