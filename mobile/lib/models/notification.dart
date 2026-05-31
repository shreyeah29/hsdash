class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
    this.taskId,
  });

  final String id;
  final String title;
  final String body;
  final bool read;
  final String createdAt;
  final String? taskId;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String? ?? '',
      read: json['read'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
      taskId: json['taskId'] as String?,
    );
  }
}
