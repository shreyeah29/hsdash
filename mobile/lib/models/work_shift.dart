class WorkShiftSession {
  const WorkShiftSession({
    required this.id,
    required this.day,
    required this.clockInAt,
    this.clockOutAt,
  });

  final String id;
  final String day;
  final DateTime clockInAt;
  final DateTime? clockOutAt;

  bool get isActive => clockOutAt == null;

  factory WorkShiftSession.fromJson(Map<String, dynamic> json) {
    return WorkShiftSession(
      id: json['id']?.toString() ?? '',
      day: json['day']?.toString() ?? '',
      clockInAt: DateTime.parse(json['clockInAt'] as String).toLocal(),
      clockOutAt: json['clockOutAt'] != null ? DateTime.parse(json['clockOutAt'] as String).toLocal() : null,
    );
  }
}

class WorkShiftToday {
  const WorkShiftToday({
    required this.shiftStartHour,
    required this.shiftEndHour,
    required this.timezone,
    this.session,
  });

  final int shiftStartHour;
  final int shiftEndHour;
  final String timezone;
  final WorkShiftSession? session;

  factory WorkShiftToday.fromJson(Map<String, dynamic> json) {
    final sessionJson = json['session'] as Map<String, dynamic>?;
    return WorkShiftToday(
      shiftStartHour: (json['shiftStartHour'] as num?)?.toInt() ?? 10,
      shiftEndHour: (json['shiftEndHour'] as num?)?.toInt() ?? 19,
      timezone: json['timezone']?.toString() ?? 'Asia/Kolkata',
      session: sessionJson != null ? WorkShiftSession.fromJson(sessionJson) : null,
    );
  }
}
