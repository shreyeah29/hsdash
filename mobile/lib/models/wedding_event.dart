import 'package:hsdash_mobile/models/task.dart';

/// Wedding event returned by `POST /events` and related APIs.
class WeddingEvent {
  const WeddingEvent({
    required this.id,
    required this.clientName,
    this.eventDate,
    this.tasks = const [],
  });

  final String id;
  final String clientName;
  final DateTime? eventDate;
  final List<Task> tasks;

  factory WeddingEvent.fromJson(Map<String, dynamic> json) {
    final tasksJson = json['tasks'] as List<dynamic>? ?? [];
    return WeddingEvent(
      id: json['id'] as String,
      clientName: json['clientName'] as String,
      eventDate: json['eventDate'] != null ? DateTime.tryParse(json['eventDate'] as String) : null,
      tasks: tasksJson.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
