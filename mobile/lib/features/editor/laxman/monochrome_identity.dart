import 'package:hsdash_mobile/models/user.dart';

/// All editors use the monochrome team shell (not coordinators or admin).
bool isMonochromeTeamEditor(User user) => user.role == UserRole.editor;

@Deprecated('Use isMonochromeTeamEditor — all editors share the same shell now.')
bool isLaxmanEditor(User user) => isMonochromeTeamEditor(user);

bool isEmmanuelCoordinator(User user) {
  final username = user.username.toLowerCase();
  final name = user.name.toLowerCase();
  return username == 'emmanuel' || name.contains('emmanuel');
}
