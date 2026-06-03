import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/users_repository.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/user.dart';

final usersRepositoryProvider = Provider<UsersRepository>((ref) => UsersRepository());

final usersProvider = FutureProvider.autoDispose<List<User>>((ref) async {
  return ref.read(usersRepositoryProvider).fetchUsers();
});

/// Refresh roster everywhere tasks / calendar / assignments read team members.
void invalidateUsersCaches(WidgetRef ref) {
  ref.invalidate(usersProvider);
  ref.invalidate(productionTeamMembersProvider);
  ref.invalidate(tasksProvider);
  ref.invalidate(adminOverviewProvider);
  ref.invalidate(adminTaskActivityProvider);
}

final canManageTeamProvider = Provider<bool>((ref) {
  final auth = ref.watch(authControllerProvider);
  return auth.user?.role == UserRole.admin;
});
