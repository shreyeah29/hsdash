import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/users_repository.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/user.dart';

final usersRepositoryProvider = Provider<UsersRepository>((ref) => UsersRepository());

final usersProvider = FutureProvider.autoDispose<List<User>>((ref) async {
  return ref.read(usersRepositoryProvider).fetchUsers();
});

void invalidateUsersCaches(WidgetRef ref) {
  ref.invalidate(usersProvider);
  ref.invalidate(productionTeamMembersProvider);
}
