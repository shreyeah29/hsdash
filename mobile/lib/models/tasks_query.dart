/// Query params for `GET /tasks` (admin/coordinator only) — see `API.md`.
class TasksQuery {
  const TasksQuery({this.team, this.status, this.priority, this.eventId});

  final String? team;
  final String? status;
  final String? priority;
  final String? eventId;

  static const empty = TasksQuery();

  bool get isEmpty => team == null && status == null && priority == null && eventId == null;

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (team != null && team!.isNotEmpty) params['team'] = team;
    if (status != null && status!.isNotEmpty) params['status'] = status;
    if (priority != null && priority!.isNotEmpty) params['priority'] = priority;
    if (eventId != null && eventId!.isNotEmpty) params['eventId'] = eventId;
    return params;
  }

  TasksQuery copyWith({
    String? team,
    String? status,
    String? priority,
    String? eventId,
    bool clearTeam = false,
    bool clearStatus = false,
    bool clearPriority = false,
    bool clearEventId = false,
  }) {
    return TasksQuery(
      team: clearTeam ? null : (team ?? this.team),
      status: clearStatus ? null : (status ?? this.status),
      priority: clearPriority ? null : (priority ?? this.priority),
      eventId: clearEventId ? null : (eventId ?? this.eventId),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is TasksQuery &&
      other.team == team &&
      other.status == status &&
      other.priority == priority &&
      other.eventId == eventId;

  @override
  int get hashCode => Object.hash(team, status, priority, eventId);
}

/// `GET /tasks` query: `team`
abstract final class TaskTeam {
  static const photo = 'PHOTO_TEAM';
  static const cinematic = 'CINEMATIC_TEAM';
  static const traditional = 'TRADITIONAL_TEAM';
  static const album = 'ALBUM_TEAM';
  static const coordinator = 'COORDINATOR_TEAM';

  static const labels = {
    photo: 'Photo',
    cinematic: 'Cinematic',
    traditional: 'Traditional',
    album: 'Album',
    coordinator: 'Coordinator',
  };

  static const values = [photo, cinematic, traditional, album, coordinator];
}

/// `GET /tasks` query: `status`
abstract final class TaskStatusFilter {
  static const pending = 'PENDING';
  static const inProgress = 'IN_PROGRESS';
  static const completed = 'COMPLETED';
  static const delayed = 'DELAYED';

  static const labels = {
    pending: 'Pending',
    inProgress: 'In progress',
    completed: 'Completed',
    delayed: 'Delayed',
  };

  static const values = [pending, inProgress, completed, delayed];
}

/// `GET /tasks` query: `priority`
abstract final class TaskPriorityFilter {
  static const critical = 'CRITICAL';
  static const high = 'HIGH';
  static const medium = 'MEDIUM';
  static const low = 'LOW';

  static const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  static const values = [critical, high, medium, low];
}

/// Body for `PUT /tasks/:id/status`
abstract final class TaskStatusUpdate {
  static const pending = 'PENDING';
  static const inProgress = 'IN_PROGRESS';
  static const completed = 'COMPLETED';
}
