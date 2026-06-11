import 'package:hsdash_mobile/models/user.dart';

bool isLaxmanEditor(User user) {
  final username = user.username.toLowerCase();
  final name = user.name.toLowerCase();
  return username == 'laxman' || name.contains('laxman');
}

bool isEmmanuelCoordinator(User user) {
  final username = user.username.toLowerCase();
  final name = user.name.toLowerCase();
  return username == 'emmanuel' || name.contains('emmanuel');
}
