import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/weddings_archive_index.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/shoot_client_profile.dart';

String shootClientDisplayLabel({
  required String brideName,
  required String groomName,
  required String clientName,
}) {
  final b = brideName.trim();
  final g = groomName.trim();
  if (b.isNotEmpty && g.isNotEmpty) return '$b & $g';
  if (b.isNotEmpty) return b;
  if (g.isNotEmpty) return g;
  return clientName.trim();
}

ShootClientProfile shootClientProfileFromEntry(ShootCalendarEntry entry) {
  final bride = entry.brideName?.trim() ?? '';
  final groom = entry.groomName?.trim() ?? '';
  final clientName = entry.clientName.trim();
  final rawPhone = entry.phoneNumber?.trim() ?? '';
  final rawContact = entry.clientContact?.trim() ?? '';
  final phone = effectiveClientPhone(phoneNumber: rawPhone, clientContact: rawContact);
  final contact = effectiveClientContact(phoneNumber: rawPhone, clientContact: rawContact);
  final city = entry.city?.trim() ?? '';
  final venue = entry.venue?.trim() ?? '';
  final type = _meaningfulClientType(entry.clientType?.trim() ?? '');
  final isWedding = bride.isNotEmpty ||
      groom.isNotEmpty ||
      (entry.clientType?.toLowerCase().contains('wedding') ?? false) ||
      clientName.contains('&');

  final label = shootClientDisplayLabel(brideName: bride, groomName: groom, clientName: clientName);

  return ShootClientProfile(
    id: weddingKeyForEntry(entry),
    displayLabel: label.isNotEmpty ? label : clientName,
    clientName: clientName.isNotEmpty ? clientName : label,
    clientType: type,
    clientContact: contact,
    city: city,
    venue: venue,
    brideName: bride,
    groomName: groom,
    phoneNumber: phone,
    isWedding: isWedding,
  );
}

String _meaningfulClientType(String type) {
  final t = type.trim();
  if (t.isEmpty) return '';
  final lower = t.toLowerCase();
  if (lower == 'wedding' || lower == 'other') return '';
  return t;
}

ShootClientProfile _normalizeProfile(ShootClientProfile p) {
  final rawPhone = p.phoneNumber;
  final rawContact = p.clientContact;
  return ShootClientProfile(
    id: p.id,
    displayLabel: p.displayLabel,
    clientName: p.clientName,
    clientType: p.clientType,
    city: p.city,
    venue: p.venue,
    brideName: p.brideName,
    groomName: p.groomName,
    isWedding: p.isWedding,
    phoneNumber: effectiveClientPhone(phoneNumber: rawPhone, clientContact: rawContact),
    clientContact: effectiveClientContact(phoneNumber: rawPhone, clientContact: rawContact),
  );
}

bool _entryIsNewer(ShootCalendarEntry a, ShootCalendarEntry b) {
  return shootDayKey(a.day).compareTo(shootDayKey(b.day)) >= 0;
}

List<ShootClientProfile> shootClientProfilesFromEntries(
  Iterable<ShootCalendarEntry> entries, {
  String search = '',
}) {
  final byKey = <String, ShootCalendarEntry>{};

  for (final entry in entries) {
    final name = entry.clientName.trim();
    final bride = entry.brideName?.trim() ?? '';
    final groom = entry.groomName?.trim() ?? '';
    if (name.isEmpty && bride.isEmpty && groom.isEmpty) continue;

    final key = weddingKeyForEntry(entry);
    final prev = byKey[key];
    if (prev == null || _entryIsNewer(entry, prev)) {
      byKey[key] = entry;
    }
  }

  var list = byKey.values.map((e) => _normalizeProfile(shootClientProfileFromEntry(e))).toList()
    ..sort((a, b) => a.displayLabel.compareTo(b.displayLabel));

  return filterClientProfiles(list, search);
}

List<String> _profileSearchLabels(ShootClientProfile c) {
  final labels = <String>[
    normalizeClientLabel(c.displayLabel),
    normalizeClientLabel(c.clientName),
  ];
  if (c.brideName.isNotEmpty || c.groomName.isNotEmpty) {
    labels.add(
      normalizeClientLabel(
        resolveShootClientName(isWedding: true, brideName: c.brideName, groomName: c.groomName, clientName: ''),
      ),
    );
    labels.add(normalizeClientLabel('${c.brideName} ${c.groomName}'));
  }
  return labels.where((s) => s.isNotEmpty).toSet().toList();
}

/// Fuzzy match — handles "yesh and harika" vs stored "Yesh & Harika".
bool profileMatchesQuery(ShootClientProfile profile, String query) {
  final needle = normalizeClientLabel(query);
  if (needle.isEmpty) return false;

  for (final hay in _profileSearchLabels(profile)) {
    if (hay == needle || hay.contains(needle) || needle.contains(hay)) return true;
    final words = needle.split(' ').where((w) => w.length >= 2).toList();
    if (words.isNotEmpty && words.every((w) => hay.contains(w))) return true;
  }
  return false;
}

List<ShootClientProfile> filterClientProfiles(
  List<ShootClientProfile> profiles,
  String query, {
  int limit = 8,
}) {
  if (query.trim().isEmpty) return [];

  final matches = profiles.where((c) => profileMatchesQuery(c, query)).toList();

  return matches.length <= limit ? matches : matches.sublist(0, limit);
}

/// When the typed name clearly matches one saved client, return it for auto-prefill.
ShootClientProfile? resolveClientProfileForQuery(List<ShootClientProfile> profiles, String query) {
  final needle = normalizeClientLabel(query);
  if (needle.length < 3) return null;

  final matches = profiles.where((c) => profileMatchesQuery(c, query)).toList();
  if (matches.isEmpty) return null;

  for (final c in matches) {
    for (final label in _profileSearchLabels(c)) {
      if (label == needle) return c;
    }
  }

  if (matches.length == 1) {
    final only = matches.first;
    for (final label in _profileSearchLabels(only)) {
      if (label.startsWith(needle) && needle.length >= 6) return only;
    }
  }

  return null;
}

String _profileMergeKey(ShootClientProfile p) {
  final label = p.displayLabel.isNotEmpty ? p.displayLabel : p.clientName;
  final key = normalizeClientLabel(label);
  return key.isNotEmpty ? key : p.id;
}

ShootClientProfile _combineProfiles(ShootClientProfile base, ShootClientProfile extra) {
  return ShootClientProfile(
    id: base.id,
    displayLabel: base.displayLabel.isNotEmpty ? base.displayLabel : extra.displayLabel,
    clientName: base.clientName.isNotEmpty ? base.clientName : extra.clientName,
    clientType: base.clientType.isNotEmpty ? base.clientType : extra.clientType,
    clientContact: base.clientContact.isNotEmpty ? base.clientContact : extra.clientContact,
    city: base.city.isNotEmpty ? base.city : extra.city,
    venue: base.venue.isNotEmpty ? base.venue : extra.venue,
    brideName: base.brideName.isNotEmpty ? base.brideName : extra.brideName,
    groomName: base.groomName.isNotEmpty ? base.groomName : extra.groomName,
    phoneNumber: base.phoneNumber.isNotEmpty ? base.phoneNumber : extra.phoneNumber,
    isWedding: base.isWedding || extra.isWedding,
  );
}

/// Prefer [primary] (calendar rows with venue) when merging with API client list.
List<ShootClientProfile> mergeClientProfiles(
  List<ShootClientProfile> primary,
  List<ShootClientProfile> secondary,
) {
  final byKey = <String, ShootClientProfile>{};
  for (final p in secondary) {
    byKey[_profileMergeKey(p)] = p;
  }
  for (final p in primary) {
    final key = _profileMergeKey(p);
    final prev = byKey[key];
    byKey[key] = prev == null ? p : _combineProfiles(p, prev);
  }
  final out = byKey.values.toList()..sort((a, b) => a.displayLabel.compareTo(b.displayLabel));
  return out;
}
