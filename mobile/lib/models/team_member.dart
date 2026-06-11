class TeamMember {
  const TeamMember({
    required this.id,
    required this.name,
    required this.username,
    this.team,
    this.designation,
  });

  final String id;
  final String name;
  final String username;
  final String? team;
  final String? designation;

  factory TeamMember.fromJson(Map<String, dynamic> json) {
    return TeamMember(
      id: json['id'] as String,
      name: json['name'] as String,
      username: json['username'] as String? ?? json['email'] as String? ?? '',
      team: json['team'] as String?,
      designation: json['designation'] as String?,
    );
  }
}
