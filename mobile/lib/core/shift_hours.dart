/// Studio shift helpers — mirrors backend IST rules (10:00–19:00).
const shiftStartHour = 10;
const shiftEndHour = 19;
const _istOffsetMinutes = 5 * 60 + 30;

String formatShiftHourLabel(int hour24) {
  final h = hour24 % 12 == 0 ? 12 : hour24 % 12;
  final suffix = hour24 >= 12 ? 'PM' : 'AM';
  return '$h $suffix';
}

String get shiftHoursLabel =>
    '${formatShiftHourLabel(shiftStartHour)} – ${formatShiftHourLabel(shiftEndHour)}';

/// Wall clock in studio timezone (Asia/Kolkata, UTC+5:30).
DateTime studioNow() {
  final utc = DateTime.now().toUtc();
  var totalMinutes = utc.hour * 60 + utc.minute + _istOffsetMinutes;
  var day = DateTime(utc.year, utc.month, utc.day);
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    day = day.add(const Duration(days: 1));
  }
  while (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    day = day.subtract(const Duration(days: 1));
  }
  return DateTime(day.year, day.month, day.day, totalMinutes ~/ 60, totalMinutes % 60, utc.second);
}

DateTime studioShiftEndToday() {
  final now = studioNow();
  return DateTime(now.year, now.month, now.day, shiftEndHour);
}

Duration get expectedShiftDuration => Duration(hours: shiftEndHour - shiftStartHour);

DateTime studioShiftStartOnDay(DateTime day) {
  return DateTime(day.year, day.month, day.day, shiftStartHour);
}

DateTime studioShiftEndOnDay(DateTime day) {
  return DateTime(day.year, day.month, day.day, shiftEndHour);
}

Duration workedDuration({required DateTime clockIn, DateTime? clockOut}) {
  final end = clockOut ?? DateTime.now();
  final delta = end.difference(clockIn);
  return delta.isNegative ? Duration.zero : delta;
}

Duration lateStartDuration(DateTime clockIn) {
  final start = studioShiftStartOnDay(clockIn);
  if (!clockIn.isAfter(start)) return Duration.zero;
  return clockIn.difference(start);
}

Duration earlyEndDuration(DateTime clockOut) {
  final end = studioShiftEndOnDay(clockOut);
  if (!clockOut.isBefore(end)) return Duration.zero;
  return end.difference(clockOut);
}

/// Minutes still short of a full 9h shift (late start, early leave, or both).
Duration shiftOwedDuration({required DateTime clockIn, DateTime? clockOut}) {
  final worked = workedDuration(clockIn: clockIn, clockOut: clockOut);
  final shortfall = expectedShiftDuration - worked;
  if (shortfall.isNegative || shortfall == Duration.zero) return Duration.zero;
  return shortfall;
}

/// When a full shift must finish if they started late (clock-in + 9 hours).
DateTime fullShiftTargetTime(DateTime clockIn) => clockIn.add(expectedShiftDuration);

Duration timeUntilShiftEnd() {
  final now = studioNow();
  final end = studioShiftEndToday();
  if (!now.isBefore(end)) return Duration.zero;
  return end.difference(now);
}

Duration timeUntilFullShift(DateTime clockIn) {
  final target = fullShiftTargetTime(clockIn);
  final now = DateTime.now();
  if (!now.isBefore(target)) return Duration.zero;
  return target.difference(now);
}

String formatDurationHuman(Duration d) {
  if (d <= Duration.zero) return '0m';
  final h = d.inHours;
  final m = d.inMinutes.remainder(60);
  if (h > 0 && m > 0) return '${h}h ${m}m';
  if (h > 0) return '${h}h';
  return '${m}m';
}

String formatCountdown(Duration d) {
  final h = d.inHours;
  final m = d.inMinutes.remainder(60);
  final s = d.inSeconds.remainder(60);
  return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}

String formatClockTime(DateTime dt) {
  final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
  final m = dt.minute.toString().padLeft(2, '0');
  final suffix = dt.hour >= 12 ? 'PM' : 'AM';
  return '$h:$m $suffix';
}
