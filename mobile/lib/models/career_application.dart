class CareerApplication {
  const CareerApplication({
    required this.id,
    required this.status,
    required this.source,
    required this.name,
    required this.email,
    required this.phoneNumber,
    required this.roleApplied,
    required this.softwares,
    required this.experience,
    required this.portfolioUrl,
    required this.instagramLink,
    required this.notes,
    required this.submittedAt,
  });

  final String id;
  final String status;
  final String source;
  final String name;
  final String email;
  final String phoneNumber;
  final String roleApplied;
  final String softwares;
  final String experience;
  final String portfolioUrl;
  final String instagramLink;
  final String notes;
  final DateTime submittedAt;

  factory CareerApplication.fromJson(Map<String, dynamic> json) {
    return CareerApplication(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'NEW',
      source: json['source'] as String? ?? 'GOOGLE_FORM',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      roleApplied: json['roleApplied'] as String? ?? '',
      softwares: json['softwares'] as String? ?? '',
      experience: json['experience'] as String? ?? '',
      portfolioUrl: json['portfolioUrl'] as String? ?? '',
      instagramLink: json['instagramLink'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      submittedAt: DateTime.tryParse(json['submittedAt'] as String? ?? '') ??
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}

class CareerStats {
  const CareerStats({
    required this.total,
    required this.newCount,
    required this.reviewing,
    required this.shortlisted,
    required this.rejected,
    required this.hired,
    required this.archived,
  });

  final int total;
  final int newCount;
  final int reviewing;
  final int shortlisted;
  final int rejected;
  final int hired;
  final int archived;

  int get openPipeline => newCount + reviewing + shortlisted;

  factory CareerStats.fromJson(Map<String, dynamic> json) {
    return CareerStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      newCount: (json['new'] as num?)?.toInt() ?? 0,
      reviewing: (json['reviewing'] as num?)?.toInt() ?? 0,
      shortlisted: (json['shortlisted'] as num?)?.toInt() ?? 0,
      rejected: (json['rejected'] as num?)?.toInt() ?? 0,
      hired: (json['hired'] as num?)?.toInt() ?? 0,
      archived: (json['archived'] as num?)?.toInt() ?? 0,
    );
  }
}

const careerStatusLabels = <String, String>{
  'NEW': 'New',
  'REVIEWING': 'Reviewing',
  'SHORTLISTED': 'Shortlisted',
  'REJECTED': 'Rejected',
  'HIRED': 'Hired',
  'ARCHIVED': 'Archived',
};

const careerStatusOrder = <String>[
  'NEW',
  'REVIEWING',
  'SHORTLISTED',
  'REJECTED',
  'HIRED',
  'ARCHIVED',
];

/// Public JOIN US page — submissions land in the Careers inbox.
const careersFormUrl = 'https://hswf.app/join';
