class AttendanceAlert {
  const AttendanceAlert({
    required this.id,
    required this.userId,
    required this.userName,
    this.userTeam,
    required this.kind,
    required this.minutes,
    required this.message,
    required this.occurredAt,
  });

  final String id;
  final String userId;
  final String userName;
  final String? userTeam;
  final String kind;
  final int minutes;
  final String message;
  final DateTime occurredAt;

  bool get isLateClockIn => kind == 'LATE_CLOCK_IN';
  bool get isEarlyClockOut => kind == 'EARLY_CLOCK_OUT';

  factory AttendanceAlert.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return AttendanceAlert(
      id: json['id']?.toString() ?? '',
      userId: user?['id']?.toString() ?? json['userId']?.toString() ?? '',
      userName: user?['name']?.toString() ?? 'Team member',
      userTeam: user?['team']?.toString(),
      kind: json['kind']?.toString() ?? '',
      minutes: (json['minutes'] as num?)?.toInt() ?? 0,
      message: json['message']?.toString() ?? '',
      occurredAt: DateTime.parse(json['occurredAt'] as String).toLocal(),
    );
  }
}
