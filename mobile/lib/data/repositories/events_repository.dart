import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/create_event_form.dart';
import 'package:hsdash_mobile/models/wedding_event.dart';

/// Events APIs — see `API.md` → Events section (ADMIN).
class EventsRepository {
  EventsRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  /// `POST /events` — deliverable tasks without a calendar shoot row.
  Future<WeddingEvent> createEvent(CreateEventFormData form) async {
    final data = await _api.postJson('/events', body: form.toJson());
    final eventJson = data['event'] as Map<String, dynamic>?;
    if (eventJson == null) throw ApiException('Missing event in response');
    return WeddingEvent.fromJson(eventJson);
  }
}
