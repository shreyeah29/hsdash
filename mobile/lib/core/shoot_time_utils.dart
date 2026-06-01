import 'package:flutter/material.dart';

/// Parses and formats shoot times like the web `TimePicker` (`10:00 AM`).
class ShootTimeParts {
  const ShootTimeParts({required this.hour, required this.minute, required this.ampm});

  final int hour; // 1–12
  final int minute; // 0–59
  final String ampm; // AM | PM
}

String formatShootTime(ShootTimeParts p) {
  final hh = p.hour.clamp(1, 12);
  final mm = p.minute.clamp(0, 59).toString().padLeft(2, '0');
  return '$hh:$mm ${p.ampm}';
}

ShootTimeParts parseShootTime(String? raw) {
  final s = (raw ?? '').trim();
  if (s.isEmpty) return const ShootTimeParts(hour: 10, minute: 0, ampm: 'AM');
  final m = RegExp(r'^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$', caseSensitive: false).firstMatch(s);
  if (m == null) return const ShootTimeParts(hour: 10, minute: 0, ampm: 'AM');
  var hour = int.tryParse(m.group(1)!) ?? 10;
  final minute = int.tryParse(m.group(2) ?? '0') ?? 0;
  final ampm = (m.group(3) ?? 'AM').toUpperCase();
  hour = hour.clamp(1, 12);
  return ShootTimeParts(hour: hour, minute: minute.clamp(0, 59), ampm: ampm == 'PM' ? 'PM' : 'AM');
}

TimeOfDay shootPartsToTimeOfDay(ShootTimeParts p) {
  var hour24 = p.hour % 12;
  if (p.ampm == 'PM') hour24 += 12;
  if (p.hour == 12 && p.ampm == 'AM') hour24 = 0;
  return TimeOfDay(hour: hour24, minute: p.minute.clamp(0, 59));
}

ShootTimeParts timeOfDayToShootParts(TimeOfDay t) {
  final period = t.period;
  var hour12 = t.hourOfPeriod;
  if (hour12 == 0) hour12 = 12;
  return ShootTimeParts(
    hour: hour12,
    minute: t.minute,
    ampm: period == DayPeriod.am ? 'AM' : 'PM',
  );
}

/// Display for agenda list — start line bold, end below.
(String start, String end) splitShootTimes(String? startRaw, String? endRaw) {
  final start = (startRaw ?? '').trim();
  final end = (endRaw ?? '').trim();
  if (start.isEmpty && end.isEmpty) return ('All day', '');
  if (end.isEmpty) return (start, '');
  return (start, end);
}
