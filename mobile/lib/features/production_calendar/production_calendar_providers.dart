import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/data/repositories/production_calendar_repository.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/team_member.dart';

final productionCalendarRepositoryProvider = Provider<ProductionCalendarRepository>((ref) {
  return ProductionCalendarRepository();
});

class ProductionCalendarMonthNotifier extends Notifier<DateTime> {
  @override
  DateTime build() {
    final now = DateTime.now();
    return DateTime(now.year, now.month);
  }

  void setMonth(DateTime value) => state = DateTime(value.year, value.month);

  void previousMonth() => state = DateTime(state.year, state.month - 1);

  void nextMonth() => state = DateTime(state.year, state.month + 1);
}

final productionCalendarMonthProvider =
    NotifierProvider<ProductionCalendarMonthNotifier, DateTime>(ProductionCalendarMonthNotifier.new);

/// Wide-range cache — loaded once per session; month navigation filters client-side (no spinner).
final productionCalendarWideEntriesProvider = FutureProvider<List<ShootCalendarEntry>>((ref) async {
  final now = DateTime.now();
  final from = localDayKey(DateTime(now.year - 8, 1, 1));
  final to = localDayKey(DateTime(now.year + 2, 12, 31));
  return ref.read(productionCalendarRepositoryProvider).fetchEntries(from: from, to: to);
});

List<ShootCalendarEntry> entriesForMonth(List<ShootCalendarEntry> all, DateTime month) {
  final range = monthRangeIso(month);
  final from = range['from']!;
  final to = range['to']!;
  return all
      .where((e) {
        final key = shootDayKey(e.day);
        return key.compareTo(from) >= 0 && key.compareTo(to) <= 0;
      })
      .toList();
}

/// Month view derived from [productionCalendarWideEntriesProvider] — instant when changing months.
final productionCalendarEntriesProvider = Provider<AsyncValue<List<ShootCalendarEntry>>>((ref) {
  final month = ref.watch(productionCalendarMonthProvider);
  return ref.watch(productionCalendarWideEntriesProvider).whenData(
        (entries) => entriesForMonth(entries, month),
      );
});

final productionTeamMembersProvider = FutureProvider.autoDispose<List<TeamMember>>((ref) async {
  return ref.read(productionCalendarRepositoryProvider).fetchTeamMembers();
});

/// Editor assigned shoots for current month.
final editorAssignedShootsProvider = FutureProvider.autoDispose<List<ShootCalendarEntry>>((ref) async {
  final month = ref.watch(productionCalendarMonthProvider);
  final range = monthRangeIso(month);
  return ref.read(productionCalendarRepositoryProvider).fetchAssignedEntries(
        from: range['from']!,
        to: range['to']!,
      );
});

/// Refresh shoot calendar only — safe while other dashboard tabs stay mounted.
void invalidateShootCalendarEntries(WidgetRef ref) {
  ref.invalidate(productionCalendarWideEntriesProvider);
  ref.invalidate(editorAssignedShootsProvider);
}

void invalidateProductionCaches(WidgetRef ref) {
  invalidateShootCalendarEntries(ref);
  ref.invalidate(calendarEntriesProvider);
  invalidateTaskCaches(ref);
  ref.invalidate(adminOverviewProvider);
  ref.invalidate(adminTaskActivityProvider);
}
