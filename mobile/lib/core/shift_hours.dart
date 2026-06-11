/// Studio shift helpers — mirrors backend IST rules (10:00–19:00).
const shiftStartHour = 10;
const shiftEndHour = 19;

DateTime istNow() => DateTime.now().toUtc().add(const Duration(hours: 5, minutes: 30));

DateTime istShiftEndToday() {
  final now = istNow();
  return DateTime(now.year, now.month, now.day, shiftEndHour);
}

Duration timeUntilShiftEnd() {
  final now = istNow();
  final end = istShiftEndToday();
  if (!now.isBefore(end)) return Duration.zero;
  return end.difference(now);
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
