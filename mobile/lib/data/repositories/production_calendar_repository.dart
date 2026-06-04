import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/shoot_client_profiles.dart';
import 'package:hsdash_mobile/models/create_event_form.dart';
import 'package:hsdash_mobile/models/post_production_editors.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/shoot_client_profile.dart';
import 'package:hsdash_mobile/models/team_member.dart';

/// Production calendar APIs — see `API.md` → Production calendar section.
class ProductionCalendarRepository {
  ProductionCalendarRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  /// `GET /production-calendar/entries`
  Future<List<ShootCalendarEntry>> fetchEntries({
    required String from,
    required String to,
    bool summary = false,
  }) async {
    final query = <String, dynamic>{'from': from, 'to': to};
    if (summary) query['summary'] = '1';
    final data = await _api.getJson('/production-calendar/entries', query: query);
    final list = data['entries'] as List<dynamic>? ?? [];
    return list.map((e) => ShootCalendarEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `GET /production-calendar/entries/assigned` — editor's shoots.
  Future<List<ShootCalendarEntry>> fetchAssignedEntries({
    required String from,
    required String to,
  }) async {
    final data = await _api.getJson('/production-calendar/entries/assigned', query: {'from': from, 'to': to});
    final list = data['entries'] as List<dynamic>? ?? [];
    return list.map((e) => ShootCalendarEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// All distinct clients from calendar entries (wide range, includes venue for prefill).
  Future<List<ShootClientProfile>> fetchAllClientProfiles() async {
    final now = DateTime.now();
    final from = localDayKey(DateTime(now.year - 8, 1, 1));
    final to = localDayKey(DateTime(now.year + 2, 12, 31));
    final entries = await fetchEntries(from: from, to: to);
    return shootClientProfilesFromEntries(entries);
  }

  /// Reusable clients — API when deployed, else built from calendar entries.
  Future<List<ShootClientProfile>> fetchClients({String search = ''}) async {
    try {
      final query = search.trim().isEmpty ? null : <String, dynamic>{'search': search.trim()};
      final data = await _api.getJson('/production-calendar/clients', query: query);
      final list = data['clients'] as List<dynamic>? ?? [];
      final fromApi = list.map((e) => ShootClientProfile.fromJson(e as Map<String, dynamic>)).toList();
      final merged = mergeClientProfiles(await fetchAllClientProfiles(), fromApi);
      return search.trim().isEmpty ? merged : filterClientProfiles(merged, search);
    } on ApiException catch (e) {
      if (e.statusCode != 404) rethrow;
      final now = DateTime.now();
      return shootClientProfilesFromEntries(
        await fetchEntries(
          from: localDayKey(DateTime(now.year - 8, 1, 1)),
          to: localDayKey(DateTime(now.year + 2, 12, 31)),
        ),
        search: search,
      );
    }
  }

  /// `GET /production-calendar/team-members`
  Future<List<TeamMember>> fetchTeamMembers() async {
    final data = await _api.getJson('/production-calendar/team-members');
    final list = data['users'] as List<dynamic>? ?? [];
    return list.map((e) => TeamMember.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `POST /production-calendar/entries` — shoot row + standard deliverable set.
  Future<ShootCalendarEntry> createDeliverableOnDay({
    required String day,
    required String clientName,
    EventEditorAssignments editors = EventEditorAssignments.empty,
  }) async {
    final body = <String, dynamic>{
      'day': day,
      'clientName': clientName.trim(),
      'clientType': '',
      'clientContact': '',
      'city': '',
      'eventName': '',
      'venue': '',
      'startTime': '',
      'endTime': '',
      'photoTeam': '',
      'videoTeam': '',
      'addons': '',
      'createDeliverableTimeline': true,
      ...editors.toJson(),
    };
    final data = await _api.postJson('/production-calendar/entries', body: body);
    final entryJson = data['entry'] as Map<String, dynamic>?;
    if (entryJson == null) throw ApiException('Missing entry in response');
    return ShootCalendarEntry.fromJson(entryJson);
  }

  /// `POST /production-calendar/entries`
  Future<ShootCalendarEntry> createEntry(ShootFormData form) async {
    final data = await _api.postJson('/production-calendar/entries', body: form.toJson());
    final entryJson = data['entry'] as Map<String, dynamic>?;
    if (entryJson == null) throw ApiException('Missing entry in response');
    return ShootCalendarEntry.fromJson(entryJson);
  }

  /// `PUT /production-calendar/entries/:id`
  Future<ShootCalendarEntry> updateEntry(String id, ShootFormData form) async {
    final data = await _api.putJson('/production-calendar/entries/$id', body: form.toJson());
    final entryJson = data['entry'] as Map<String, dynamic>?;
    if (entryJson == null) throw ApiException('Missing entry in response');
    return ShootCalendarEntry.fromJson(entryJson);
  }

  /// `DELETE /production-calendar/entries/:id`
  Future<void> deleteEntry(String id) async {
    await _api.deleteJson('/production-calendar/entries/$id');
  }

  /// `POST /production-calendar/entries/:id/start-post-production`
  Future<ShootCalendarEntry> startPostProduction(
    String id, {
    PostProductionEditorPick editors = const PostProductionEditorPick(),
  }) async {
    final data = await _api.postJson(
      '/production-calendar/entries/$id/start-post-production',
      body: editors.toJson(),
    );
    final entryJson = data['entry'] as Map<String, dynamic>?;
    if (entryJson == null) throw ApiException('Missing entry in response');
    return ShootCalendarEntry.fromJson(entryJson);
  }
}
