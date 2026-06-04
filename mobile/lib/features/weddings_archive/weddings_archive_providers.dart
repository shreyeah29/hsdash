import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/weddings_archive_index.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';

/// All shoot entries for the weddings archive (wide date range).
final weddingsArchiveEntriesProvider = FutureProvider.autoDispose<List<ShootCalendarEntry>>((ref) async {
  final now = DateTime.now();
  final from = localDayKey(DateTime(now.year - 8, 1, 1));
  final to = localDayKey(DateTime(now.year + 2, 12, 31));
  return ref.read(productionCalendarRepositoryProvider).fetchEntries(from: from, to: to);
});

final weddingsArchiveIndexProvider = Provider.autoDispose<WeddingsArchiveIndex?>((ref) {
  final entries = ref.watch(weddingsArchiveEntriesProvider);
  return entries.when(
    data: WeddingsArchiveIndex.fromEntries,
    loading: () => null,
    error: (_, __) => null,
  );
});

void invalidateWeddingsArchive(WidgetRef ref) {
  ref.invalidate(weddingsArchiveEntriesProvider);
  invalidateShootCalendarEntries(ref);
}
