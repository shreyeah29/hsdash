import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/app_brand.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/admin/admin_shell.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_controller.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/auth/auth_routes.dart';
import 'package:hsdash_mobile/features/auth/login_choice_screen.dart';
import 'package:hsdash_mobile/features/auth/login_screen.dart';
import 'package:hsdash_mobile/features/auth/profile_selection_screen.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/features/coordinator/coordinator_shell.dart';
import 'package:hsdash_mobile/features/editor/editor_shell.dart';
import 'package:hsdash_mobile/features/realtime/realtime_sync.dart';
/// Re-runs [GoRouter.redirect] when auth changes without recreating the router.
final authRouterRefreshProvider = Provider<AuthRouterRefresh>((ref) {
  final listenable = AuthRouterRefresh(ref);
  ref.onDispose(listenable.dispose);
  return listenable;
});

class AuthRouterRefresh extends ChangeNotifier {
  AuthRouterRefresh(this._ref) {
    _ref.listen(authControllerProvider, (_, __) => notifyListeners());
    _ref.listen(adminWorkspaceProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}

String? _adminPostAuthRedirect(Ref ref, String location) {
  final user = ref.read(authControllerProvider).user;
  if (user?.role != UserRole.admin) return null;
  final hasProfile = ref.read(adminWorkspaceProvider) != null;
  final onProfiles = location == '/admin/profiles';
  final onAdmin = location.startsWith('/admin');
  if (!hasProfile && !onProfiles) return '/admin/profiles';
  if (hasProfile && onProfiles) return '/admin';
  if (hasProfile && location == '/login') return '/admin';
  if (!hasProfile && onAdmin && !onProfiles) return '/admin/profiles';
  return null;
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(authRouterRefreshProvider);

  return GoRouter(
    refreshListenable: refresh,
    initialLocation: '/login',
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final location = state.matchedLocation;
      final loggingIn = location.startsWith('/login');
      if (auth.status == AuthStatus.unknown) return null;
      if (auth.status == AuthStatus.unauthenticated) return loggingIn ? null : '/login';
      if (auth.status == AuthStatus.authenticated) {
        final adminRedirect = _adminPostAuthRedirect(ref, location);
        if (adminRedirect != null) return adminRedirect;
        if (loggingIn) return homeRouteFor(auth.user!);
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginChoiceScreen()),
      GoRoute(path: '/login/admin', builder: (_, __) => const LoginScreen(portal: LoginPortal.admin)),
      GoRoute(path: '/login/team', builder: (_, __) => const LoginScreen(portal: LoginPortal.team)),
      GoRoute(
        path: '/admin/profiles',
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          key: state.pageKey,
          child: const ProfileSelectionScreen(),
          transitionsBuilder: (context, animation, _, child) =>
              FadeTransition(opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut), child: child),
        ),
      ),
      GoRoute(
        path: '/admin',
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          key: state.pageKey,
          child: const _AdminShellRoute(),
          transitionsBuilder: (context, animation, _, child) =>
              FadeTransition(opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut), child: child),
        ),
      ),
      GoRoute(path: '/coordinator', builder: (_, __) => const _CoordinatorShellRoute()),
      GoRoute(path: '/editor', builder: (_, __) => const _EditorShellRoute()),
    ],
  );
});

class _AdminShellRoute extends ConsumerWidget {
  const _AdminShellRoute();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider.select((s) => s.user));
    if (user == null) return const _AppBootSplash();
    return AdminShell(user: user);
  }
}

class _CoordinatorShellRoute extends ConsumerWidget {
  const _CoordinatorShellRoute();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider.select((s) => s.user));
    if (user == null) return const _AppBootSplash();
    return CoordinatorShell(user: user);
  }
}

class _EditorShellRoute extends ConsumerWidget {
  const _EditorShellRoute();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider.select((s) => s.user));
    if (user == null) return const _AppBootSplash();
    return EditorShell(user: user);
  }
}

/// Shown while auth/session is resolving.
class _AppBootSplash extends StatelessWidget {
  const _AppBootSplash();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.surface,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.violet),
            SizedBox(height: 16),
            Text('Loading…', style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}

/// Fallback when the router has not built the target page yet.
class _AppRoutePlaceholder extends StatelessWidget {
  const _AppRoutePlaceholder();

  @override
  Widget build(BuildContext context) {
    return const _AppBootSplash();
  }
}

class HsDashApp extends ConsumerWidget {
  const HsDashApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final auth = ref.watch(authControllerProvider);

    return MaterialApp.router(
      title: AppBrand.name,
      theme: buildAppTheme(),
      scrollBehavior: const AppScrollBehavior(),
      routerConfig: router,
      builder: (context, child) {
        // go_router can pass a null [child] while redirects run; never show an empty view.
        final routeChild = child ?? const _AppRoutePlaceholder();

        if (auth.status == AuthStatus.authenticated) {
          return RealtimeListener(child: routeChild);
        }
        return routeChild;
      },
    );
  }
}
