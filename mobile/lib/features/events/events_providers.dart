import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/events_repository.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
final eventsRepositoryProvider = Provider<EventsRepository>((ref) => EventsRepository());

void invalidateEventsCaches(WidgetRef ref) {
  invalidateProductionCaches(ref);
  ref.invalidate(notificationsProvider);
}
