import 'package:flutter_riverpod/flutter_riverpod.dart';
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

final productionCalendarEntriesProvider = FutureProvider.autoDispose<List<ShootCalendarEntry>>((ref) async {
  final month = ref.watch(productionCalendarMonthProvider);
  final range = monthRangeIso(month);
  return ref.read(productionCalendarRepositoryProvider).fetchEntries(
        from: range['from']!,
        to: range['to']!,
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
  ref.invalidate(productionCalendarEntriesProvider);
  ref.invalidate(editorAssignedShootsProvider);
}

void invalidateProductionCaches(WidgetRef ref) {
  invalidateShootCalendarEntries(ref);
  ref.invalidate(calendarEntriesProvider);
  invalidateTaskCaches(ref);
  ref.invalidate(adminOverviewProvider);
  ref.invalidate(adminTaskActivityProvider);
}
