import 'package:hsdash_mobile/models/user.dart';

/// Body for `POST /users` and `PUT /users/:id` — see `API.md`.
class UserFormData {
  const UserFormData({
    required this.name,
    required this.email,
    required this.role,
    this.password,
    this.team,
    this.designation,
    this.isActive = true,
  });

  final String name;
  final String email;
  final String role;
  final String? password;
  final String? team;
  final String? designation;
  final bool isActive;

  bool get needsTeam => role == 'EDITOR' || role == 'COORDINATOR';

  Map<String, dynamic> toCreateJson() {
    return {
      'name': name,
      'email': email,
      'password': password,
      'role': role,
      'team': needsTeam ? team : null,
      'designation': needsTeam && designation != null && designation!.isNotEmpty ? designation : null,
      'isActive': isActive,
    };
  }

  Map<String, dynamic> toUpdateJson() {
    final map = <String, dynamic>{
      'name': name,
      'email': email,
      'role': role,
      'team': needsTeam ? team : null,
      'designation': needsTeam && designation != null && designation!.isNotEmpty ? designation : null,
      'isActive': isActive,
    };
    if (password != null && password!.isNotEmpty) {
      map['password'] = password;
    }
    return map;
  }

  factory UserFormData.fromUser(User user) {
    return UserFormData(
      name: user.name,
      email: user.email,
      role: _roleToApi(user.role),
      team: user.team,
      designation: user.designation ?? '',
      isActive: user.isActive,
    );
  }

  static String _roleToApi(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.coordinator:
        return 'COORDINATOR';
      case UserRole.editor:
        return 'EDITOR';
      case UserRole.unknown:
        return 'EDITOR';
    }
  }
}

abstract final class UserRoleApi {
  static const admin = 'ADMIN';
  static const coordinator = 'COORDINATOR';
  static const editor = 'EDITOR';

  static const labels = {
    admin: 'Admin',
    coordinator: 'Coordinator',
    editor: 'Editor',
  };

  static const values = [admin, coordinator, editor];
}
