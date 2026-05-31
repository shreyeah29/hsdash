enum UserRole { admin, coordinator, editor, unknown }

UserRole parseRole(String? raw) {
  switch (raw?.toUpperCase()) {
    case 'ADMIN':
      return UserRole.admin;
    case 'COORDINATOR':
      return UserRole.coordinator;
    case 'EDITOR':
      return UserRole.editor;
    default:
      return UserRole.unknown;
  }
}

class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.team,
    this.designation,
    this.isActive = true,
  });

  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? team;
  final String? designation;
  final bool isActive;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: parseRole(json['role'] as String?),
      team: json['team'] as String?,
      designation: json['designation'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  String get roleLabel {
    switch (role) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.coordinator:
        return 'Coordinator';
      case UserRole.editor:
        return 'Editor';
      case UserRole.unknown:
        return 'User';
    }
  }
}
