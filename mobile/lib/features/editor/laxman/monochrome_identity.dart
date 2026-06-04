import 'package:hsdash_mobile/models/user.dart';

bool isLaxmanEditor(User user) {
  final email = user.email.toLowerCase();
  final name = user.name.toLowerCase();
  return email == 'laxman@wedding.local' || name.contains('laxman');
}

bool isEmmanuelCoordinator(User user) {
  final email = user.email.toLowerCase();
  final name = user.name.toLowerCase();
  return email == 'emmanuel@wedding.local' || name.contains('emmanuel');
}
