import 'package:hsdash_mobile/models/user.dart';

/// Body for `POST /users` and `PUT /users/:id` — see `API.md`.
class UserFormData {
  const UserFormData({
    required this.name,
    required this.username,
    required this.role,
    this.password,
    this.team,
    this.designation,
    this.isActive = true,
  });

  final String name;
  final String username;
  final String role;
  final String? password;
  final String? team;
  final String? designation;
  final bool isActive;

  bool get needsTeam => role == 'EDITOR' || role == 'COORDINATOR';

  Map<String, dynamic> toCreateJson() {
    return {
      'name': name,
      'username': username,
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
      'username': username,
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
      username: user.username,
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

/// Letters, numbers, underscore — 3–32 chars (matches API).
String? validateUsername(String? value) {
  final v = value?.trim() ?? '';
  if (v.isEmpty) return 'Username required';
  if (v.length < 3) return 'Use at least 3 characters';
  if (v.length > 32) return 'Use at most 32 characters';
  if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(v)) {
    return 'Letters, numbers, and underscores only';
  }
  return null;
}
