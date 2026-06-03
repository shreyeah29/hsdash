import 'package:hsdash_mobile/models/user.dart';

String homeRouteFor(User user) {
  switch (user.role) {
    case UserRole.admin:
      return '/admin';
    case UserRole.coordinator:
      return '/coordinator';
    case UserRole.editor:
      return '/editor';
    case UserRole.unknown:
      return '/login';
  }
}
