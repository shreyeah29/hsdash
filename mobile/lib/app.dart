import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/admin/admin_shell.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/auth/login_screen.dart';
import 'package:hsdash_mobile/features/staff/staff_shell.dart';
import 'package:hsdash_mobile/models/user.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      if (auth.status == AuthStatus.unknown) return null;
      if (auth.status == AuthStatus.unauthenticated) return loggingIn ? null : '/login';
      if (loggingIn) return _homeFor(auth.user!);
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/admin', builder: (_, __) => AdminShell(user: auth.user!)),
      GoRoute(path: '/staff', builder: (_, __) => StaffShell(user: auth.user!)),
    ],
  );
});

String _homeFor(User user) {
  switch (user.role) {
    case UserRole.admin:
      return '/admin';
    case UserRole.coordinator:
    case UserRole.editor:
      return '/staff';
    case UserRole.unknown:
      return '/login';
  }
}

class HsDashApp extends ConsumerWidget {
  const HsDashApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final auth = ref.watch(authControllerProvider);

    return MaterialApp.router(
      title: 'HS Dash',
      theme: buildAppTheme(),
      routerConfig: router,
      builder: (context, child) {
        if (auth.status == AuthStatus.unknown) {
          return const Scaffold(
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
        return child ?? const SizedBox.shrink();
      },
    );
  }
}
