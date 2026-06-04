import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/task.dart';

class ShootCalendarEntry {
  const ShootCalendarEntry({
    required this.id,
    required this.day,
    required this.clientName,
    this.brideName,
    this.groomName,
    this.phoneNumber,
    this.eventId,
    this.clientType,
    this.clientContact,
    this.city,
    this.eventName,
    this.venue,
    this.startTime,
    this.endTime,
    this.photoTeam,
    this.videoTeam,
    this.muhuruthamTime,
    this.addons,
    this.tasks = const [],
  });

  final String id;
  final String day;
  final String clientName;
  final String? brideName;
  final String? groomName;
  final String? phoneNumber;
  final String? eventId;
  final String? clientType;
  final String? clientContact;
  final String? city;
  final String? eventName;
  final String? venue;
  final String? startTime;
  final String? endTime;
  final String? photoTeam;
  final String? videoTeam;
  final String? muhuruthamTime;
  final String? addons;
  final List<Task> tasks;

  bool get hasPostProduction => eventId != null && eventId!.isNotEmpty;

  int get assignedEditorCount {
    final ids = <String>{};
    for (final t in tasks) {
      if (t.assignedToId != null) ids.add(t.assignedToId!);
    }
    return ids.length;
  }

  factory ShootCalendarEntry.fromJson(Map<String, dynamic> json) {
    final event = json['event'] as Map<String, dynamic>?;
    final tasksJson = event?['tasks'] as List<dynamic>? ?? [];
    return ShootCalendarEntry(
      id: json['id']?.toString() ?? '',
      day: _parseDay(json['day']),
      clientName: json['clientName']?.toString() ?? 'Wedding',
      brideName: json['brideName'] as String?,
      groomName: json['groomName'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      eventId: json['eventId'] as String?,
      clientType: json['clientType'] as String?,
      clientContact: json['clientContact'] as String?,
      city: json['city'] as String?,
      eventName: json['eventName'] as String?,
      venue: json['venue'] as String?,
      startTime: json['startTime'] as String?,
      endTime: json['endTime'] as String?,
      photoTeam: json['photoTeam'] as String?,
      videoTeam: json['videoTeam'] as String?,
      muhuruthamTime: json['muhuruthamTime'] as String?,
      addons: json['addons'] as String?,
      tasks: tasksJson.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  static String _parseDay(dynamic value) {
    if (value == null) return '';
    final s = value.toString();
    return shootDayKey(s);
  }
}

/// Body for `POST` / `PUT /production-calendar/entries`
class ShootFormData {
  const ShootFormData({
    required this.day,
    required this.clientName,
    this.brideName = '',
    this.groomName = '',
    this.phoneNumber = '',
    this.clientType = '',
    this.clientContact = '',
    this.city = '',
    this.eventName = '',
    this.venue = '',
    this.startTime = '',
    this.endTime = '',
    this.photoTeam = '',
    this.videoTeam = '',
    this.addons = '',
    this.createDeliverableTimeline = false,
  });

  final String day;
  final String clientName;
  final String brideName;
  final String groomName;
  final String phoneNumber;
  final String clientType;
  final String clientContact;
  final String city;
  final String eventName;
  final String venue;
  final String startTime;
  final String endTime;
  final String photoTeam;
  final String videoTeam;
  final String addons;
  final bool createDeliverableTimeline;

  Map<String, dynamic> toJson() => {
        'day': day,
        'clientName': clientName,
        'brideName': brideName,
        'groomName': groomName,
        'phoneNumber': phoneNumber,
        'clientType': clientType,
        'clientContact': clientContact,
        'city': city,
        'eventName': eventName,
        'venue': venue,
        'startTime': startTime,
        'endTime': endTime,
        'photoTeam': photoTeam,
        'videoTeam': videoTeam,
        'addons': addons,
        'createDeliverableTimeline': createDeliverableTimeline,
      };

  factory ShootFormData.fromEntry(ShootCalendarEntry entry, {required String dayKey}) {
    return ShootFormData(
      day: dayKey,
      clientName: entry.clientName,
      brideName: entry.brideName ?? '',
      groomName: entry.groomName ?? '',
      phoneNumber: entry.phoneNumber ?? '',
      clientType: entry.clientType ?? '',
      clientContact: entry.clientContact ?? '',
      city: entry.city ?? '',
      eventName: entry.eventName ?? '',
      venue: entry.venue ?? '',
      startTime: entry.startTime ?? '',
      endTime: entry.endTime ?? '',
      photoTeam: entry.photoTeam ?? '',
      videoTeam: entry.videoTeam ?? '',
      addons: entry.addons ?? '',
    );
  }
}
