import 'package:flutter_test/flutter_test.dart';
import 'package:hsdash_mobile/models/user.dart';

void main() {
  test('User.fromJson parses admin role', () {
    final user = User.fromJson({
      'id': '1',
      'name': 'Damini',
      'email': 'admin@test.com',
      'role': 'ADMIN',
      'team': null,
      'designation': null,
      'isActive': true,
    });
    expect(user.role, UserRole.admin);
    expect(user.roleLabel, 'Admin');
  });
}
