import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/core/app_repository.dart';
import 'package:hsdash_mobile/models/notification.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/user.dart';

final appRepositoryProvider = Provider<AppRepository>((ref) => AppRepository());

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({required this.status, this.user, this.error});

  final AuthStatus status;
  final User? user;
  final String? error;

  AuthState copyWith({AuthStatus? status, User? user, String? error, bool clearError = false}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthController extends Notifier<AuthState> {
  late AppRepository _repo;

  @override
  AuthState build() {
    _repo = ref.read(appRepositoryProvider);
    Future.microtask(bootstrap);
    return const AuthState(status: AuthStatus.unknown);
  }

  Future<void> bootstrap() async {
    try {
      final user = await _repo.restoreSession();
      state = user != null
          ? AuthState(status: AuthStatus.authenticated, user: user)
          : const AuthState(status: AuthStatus.unauthenticated);
    } catch (_) {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(clearError: true);
    try {
      final user = await _repo.login(email: email, password: password);
      state = AuthState(status: AuthStatus.authenticated, user: user);
      return true;
    } on ApiException catch (e) {
      state = AuthState(status: AuthStatus.unauthenticated, error: e.message);
      return false;
    } catch (_) {
      state = const AuthState(status: AuthStatus.unauthenticated, error: 'Login failed. Try again.');
      return false;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);

final adminOverviewProvider = FutureProvider.autoDispose<({OverviewStats stats, List<Task> tasks})>((ref) async {
  return ref.read(appRepositoryProvider).fetchAdminOverview();
});

final tasksProvider = FutureProvider.autoDispose<List<Task>>((ref) async {
  return ref.read(appRepositoryProvider).fetchTasks();
});

final notificationsProvider = FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  return ref.read(appRepositoryProvider).fetchNotifications();
});

final unreadCountProvider = Provider.autoDispose<int>((ref) {
  return ref.watch(notificationsProvider).maybeWhen(
        data: (list) => list.where((n) => !n.read).length,
        orElse: () => 0,
      );
});

enum TaskFilter { open, done, all }

class TaskFilterNotifier extends Notifier<TaskFilter> {
  @override
  TaskFilter build() => TaskFilter.open;

  void setFilter(TaskFilter value) => state = value;
}

final taskFilterProvider = NotifierProvider<TaskFilterNotifier, TaskFilter>(TaskFilterNotifier.new);

final filteredTasksProvider = Provider.autoDispose<AsyncValue<List<Task>>>((ref) {
  final filter = ref.watch(taskFilterProvider);
  final tasks = ref.watch(tasksProvider);
  return tasks.whenData((list) {
    switch (filter) {
      case TaskFilter.open:
        return list.where((t) => t.status != 'COMPLETED').toList();
      case TaskFilter.done:
        return list.where((t) => t.status == 'COMPLETED').toList();
      case TaskFilter.all:
        return list;
    }
  });
});
