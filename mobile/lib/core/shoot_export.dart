import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';

const shootExportColumns = [
  'DATE',
  'TYPE',
  'CLIENT NAME',
  'EVENT NAME',
  'CLIENT CONTACT',
  'CITY',
  'VENUE',
  'TIME',
  'MUHURUTHAM TIME',
  'ADD ON SERVICES IF ANY',
  'TEAM - PHOTO',
  'TEAM - VIDEO',
];

List<List<String>> buildShootExportRows(List<ShootCalendarEntry> entries) {
  final sorted = [...entries]
    ..sort((a, b) {
      final dayCmp = a.day.compareTo(b.day);
      if (dayCmp != 0) return dayCmp;
      return a.clientName.compareTo(b.clientName);
    });

  return sorted.map((entry) {
    final time = entry.startTime != null && entry.endTime != null
        ? '${entry.startTime} – ${entry.endTime}'
        : (entry.startTime ?? entry.endTime ?? '');
    return [
      shootDayKey(entry.day),
      entry.clientType ?? '',
      entry.clientName,
      entry.eventName ?? '',
      entry.clientContact ?? '',
      entry.city ?? '',
      entry.venue ?? '',
      time,
      entry.muhuruthamTime ?? '',
      entry.addons ?? '',
      entry.photoTeam ?? '',
      entry.videoTeam ?? '',
    ];
  }).toList();
}
