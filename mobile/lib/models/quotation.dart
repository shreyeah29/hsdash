class QuotationSummary {
  QuotationSummary({
    required this.id,
    required this.version,
    required this.slug,
    required this.status,
    required this.packageAmount,
    required this.viewCount,
    this.lastViewedAt,
  });

  final String id;
  final int version;
  final String slug;
  final String status;
  final String packageAmount;
  final int viewCount;
  final String? lastViewedAt;

  factory QuotationSummary.fromJson(Map<String, dynamic> json) {
    return QuotationSummary(
      id: json['id'] as String,
      version: json['version'] as int,
      slug: json['slug'] as String,
      status: json['status'] as String,
      packageAmount: json['packageAmount'] as String? ?? '',
      viewCount: json['viewCount'] as int? ?? 0,
      lastViewedAt: json['lastViewedAt'] as String?,
    );
  }
}
