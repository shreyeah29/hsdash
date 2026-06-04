import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/weddings_archive_index.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';

/// All calendar shoots for one client group ([weddingKeyForEntry]), wide date range.
final clientRelatedShootsProvider =
    FutureProvider.autoDispose.family<List<ShootCalendarEntry>, String>((ref, clientKey) async {
  final now = DateTime.now();
  final from = localDayKey(DateTime(now.year - 8, 1, 1));
  final to = localDayKey(DateTime(now.year + 2, 12, 31));
  final all = await ref.read(productionCalendarRepositoryProvider).fetchEntries(from: from, to: to);
  final related = all.where((e) => weddingKeyForEntry(e) == clientKey).toList()
    ..sort((a, b) => shootDayKey(a.day).compareTo(shootDayKey(b.day)));
  return related;
});

void invalidateClientRelatedShoots(WidgetRef ref) {
  ref.invalidate(clientRelatedShootsProvider);
}
