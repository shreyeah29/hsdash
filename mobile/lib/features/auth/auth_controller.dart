import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/core/app_repository.dart';
import 'package:hsdash_mobile/data/repositories/admin_repository.dart';
import 'package:hsdash_mobile/models/admin_overview.dart';
import 'package:hsdash_mobile/models/notification.dart';
import 'package:hsdash_mobile/models/task_activity.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/user.dart';

final appRepositoryProvider = Provider<AppRepository>((ref) => AppRepository());

final adminRepositoryProvider = Provider<AdminRepository>((ref) => AdminRepository());

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

  Future<bool> login(String email, String password, {UserRole? expectedRole, bool teamPortal = false}) async {
    state = state.copyWith(clearError: true);
    try {
      final user = await _repo.login(email: email, password: password);
      if (expectedRole != null && user.role != expectedRole) {
        await _repo.logout();
        final msg = expectedRole == UserRole.admin
            ? 'This account is not an admin. Use Team login instead.'
            : 'Use the correct login portal for this account.';
        state = AuthState(status: AuthStatus.unauthenticated, error: msg);
        return false;
      }
      if (teamPortal && user.role == UserRole.admin) {
        await _repo.logout();
        state = const AuthState(status: AuthStatus.unauthenticated, error: 'Admin accounts must use Admin login.');
        return false;
      }
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

final adminOverviewProvider = FutureProvider.autoDispose<AdminOverview>((ref) async {
  return ref.read(adminRepositoryProvider).fetchOverview();
});

final adminTaskActivityProvider = FutureProvider.autoDispose<List<TaskActivity>>((ref) async {
  return ref.read(adminRepositoryProvider).fetchTaskActivity(limit: 200);
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

final teamMembersProvider = productionTeamMembersProvider;

/// @deprecated Use [productionCalendarEntriesProvider].
final calendarEntriesProvider = productionCalendarEntriesProvider;
