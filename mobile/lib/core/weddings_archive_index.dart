import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/shoot_client_profile.dart';

/// One wedding (client) with one or more shoot events in a month.
class WeddingArchiveGroup {
  const WeddingArchiveGroup({
    required this.key,
    required this.displayName,
    required this.events,
  });

  final String key;
  final String displayName;
  final List<ShootCalendarEntry> events;
}

class WeddingsArchiveIndex {
  WeddingsArchiveIndex._(this._byYearMonth);

  final Map<int, Map<int, List<ShootCalendarEntry>>> _byYearMonth;

  factory WeddingsArchiveIndex.fromEntries(List<ShootCalendarEntry> entries) {
    final byYearMonth = <int, Map<int, List<ShootCalendarEntry>>>{};
    for (final e in entries) {
      final key = shootDayKey(e.day);
      final parts = key.split('-').map(int.parse).toList();
      final y = parts[0];
      final m = parts[1];
      byYearMonth.putIfAbsent(y, () => {});
      byYearMonth[y]!.putIfAbsent(m, () => []).add(e);
    }
    for (final months in byYearMonth.values) {
      for (final list in months.values) {
        list.sort((a, b) => shootDayKey(a.day).compareTo(shootDayKey(b.day)));
      }
    }
    return WeddingsArchiveIndex._(byYearMonth);
  }

  List<int> get years {
    final ys = _byYearMonth.keys.toList()..sort((a, b) => b.compareTo(a));
    return ys;
  }

  List<int> monthsForYear(int year) {
    final months = _byYearMonth[year]?.keys.toList() ?? [];
    months.sort((a, b) => a.compareTo(b));
    return months;
  }

  int weddingCountForYear(int year) {
    final keys = <String>{};
    for (final m in monthsForYear(year)) {
      keys.addAll(_weddingKeysForMonth(year, m));
    }
    return keys.length;
  }

  int weddingCountForMonth(int year, int month) => _weddingKeysForMonth(year, month).length;

  int eventCountForMonth(int year, int month) => _byYearMonth[year]?[month]?.length ?? 0;

  List<WeddingArchiveGroup> weddingsForMonth(int year, int month) {
    final entries = _byYearMonth[year]?[month] ?? [];
    final groups = <String, List<ShootCalendarEntry>>{};
    for (final e in entries) {
      final k = weddingKeyForEntry(e);
      groups.putIfAbsent(k, () => []).add(e);
    }
    final out = groups.entries
        .map(
          (g) => WeddingArchiveGroup(
            key: g.key,
            displayName: g.value.first.clientName,
            events: List<ShootCalendarEntry>.from(g.value)
              ..sort((a, b) => shootDayKey(a.day).compareTo(shootDayKey(b.day))),
          ),
        )
        .toList()
      ..sort((a, b) => a.displayName.compareTo(b.displayName));
    return out;
  }

  WeddingArchiveGroup? weddingGroup(int year, int month, String weddingKey) {
    for (final g in weddingsForMonth(year, month)) {
      if (g.key == weddingKey) return g;
    }
    return null;
  }

  Set<String> _weddingKeysForMonth(int year, int month) {
    final entries = _byYearMonth[year]?[month] ?? [];
    return entries.map(weddingKeyForEntry).toSet();
  }
}

/// Stable group id for the same couple/client across multiple shoot days.
String weddingKeyForEntry(ShootCalendarEntry entry) {
  final label = canonicalClientLabel(entry);
  if (label.isEmpty) return 'id:${entry.id}';
  return 'g:$label';
}

/// Display-style label used to match bride/groom rows with clientName-only rows.
String canonicalClientLabel(ShootCalendarEntry entry) {
  final bride = entry.brideName?.trim() ?? '';
  final groom = entry.groomName?.trim() ?? '';
  if (bride.isNotEmpty || groom.isNotEmpty) {
    return normalizeClientLabel(
      resolveShootClientName(isWedding: true, brideName: bride, groomName: groom, clientName: ''),
    );
  }
  return normalizeClientLabel(entry.clientName);
}

String normalizeClientLabel(String name) {
  var s = name.trim().toLowerCase();
  if (s.isEmpty) return '';
  s = s.replaceAll(RegExp(r'\s+'), ' ');
  s = s.replaceAll(RegExp(r'\s*&\s*'), ' and ');
  s = s.replaceAll(RegExp(r'[^a-z0-9 ]'), '');
  s = s.replaceAll(RegExp(r'\s+'), ' ').trim();
  return s;
}

/// All shoots for the same client/couple, sorted by day (earliest first).
List<ShootCalendarEntry> shootsForSameClient(
  List<ShootCalendarEntry> all,
  ShootCalendarEntry anchor,
) {
  final key = weddingKeyForEntry(anchor);
  return all
      .where((e) => weddingKeyForEntry(e) == key)
      .toList()
    ..sort((a, b) => shootDayKey(a.day).compareTo(shootDayKey(b.day)));
}

String monthLabel(int month) {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  if (month < 1 || month > 12) return 'Month $month';
  return names[month - 1];
}
