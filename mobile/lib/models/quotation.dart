import 'package:hsdash_mobile/config/quotation_defaults.dart';
import 'package:hsdash_mobile/models/lead.dart';

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
      id: json['id']?.toString() ?? '',
      version: (json['version'] as num?)?.toInt() ?? 0,
      slug: json['slug']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      packageAmount: json['packageAmount']?.toString() ?? '',
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      lastViewedAt: json['lastViewedAt']?.toString(),
    );
  }
}

class QuotationEventDraft {
  QuotationEventDraft({
    required this.eventName,
    required this.venue,
    required this.eventDate,
    required this.teamSize,
    required this.duration,
    required this.notes,
  });

  String eventName;
  String venue;
  String eventDate;
  String teamSize;
  String duration;
  String notes;

  Map<String, dynamic> toJson() => {
        'eventName': eventName,
        'venue': venue,
        'eventDate': eventDate,
        'teamSize': teamSize,
        'duration': duration,
        'notes': notes,
      };

  factory QuotationEventDraft.fromJson(Map<String, dynamic> json) {
    return QuotationEventDraft(
      eventName: json['eventName']?.toString() ?? '',
      venue: json['venue']?.toString() ?? '',
      eventDate: _isoDay(json['eventDate']?.toString()),
      teamSize: json['teamSize']?.toString() ?? '',
      duration: json['duration']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
    );
  }

  factory QuotationEventDraft.defaultFromLead(LeadSummary lead) {
    return QuotationEventDraft(
      eventName: 'WEDDING',
      venue: lead.eventLocation,
      eventDate: _isoDay(lead.eventDate),
      teamSize: 'TEAM OF 5',
      duration: '6 HOUR MAX',
      notes: '',
    );
  }

  QuotationEventDraft copy() => QuotationEventDraft(
        eventName: eventName,
        venue: venue,
        eventDate: eventDate,
        teamSize: teamSize,
        duration: duration,
        notes: notes,
      );
}

class QuotationDetail {
  QuotationDetail({
    required this.id,
    required this.version,
    required this.slug,
    required this.status,
    required this.packageAmount,
    required this.bookingAmount,
    required this.secondPayment,
    required this.finalPayment,
    required this.additionalNotes,
    required this.includeEngagementPackage,
    required this.engagementPackageAmount,
    required this.engagementBookingAmount,
    required this.engagementFinalPayment,
    required this.events,
  });

  final String id;
  final int version;
  final String slug;
  final String status;
  final String packageAmount;
  final String bookingAmount;
  final String secondPayment;
  final String finalPayment;
  final String additionalNotes;
  final bool includeEngagementPackage;
  final String engagementPackageAmount;
  final String engagementBookingAmount;
  final String engagementFinalPayment;
  final List<QuotationEventDraft> events;

  factory QuotationDetail.fromJson(Map<String, dynamic> json) {
    final eventsJson = json['events'] as List<dynamic>? ?? [];
    return QuotationDetail(
      id: json['id']?.toString() ?? '',
      version: (json['version'] as num?)?.toInt() ?? 0,
      slug: json['slug']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      packageAmount: json['packageAmount']?.toString() ?? '',
      bookingAmount: json['bookingAmount']?.toString() ?? '',
      secondPayment: json['secondPayment']?.toString() ?? '',
      finalPayment: json['finalPayment']?.toString() ?? '',
      additionalNotes: json['additionalNotes']?.toString() ?? '',
      includeEngagementPackage: json['includeEngagementPackage'] == true,
      engagementPackageAmount: json['engagementPackageAmount']?.toString() ?? '',
      engagementBookingAmount: json['engagementBookingAmount']?.toString() ?? '',
      engagementFinalPayment: json['engagementFinalPayment']?.toString() ?? '',
      events: eventsJson.map((e) => QuotationEventDraft.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

class QuotationDraft {
  QuotationDraft({
    required this.events,
    required this.packageAmount,
    required this.bookingAmount,
    required this.secondPayment,
    required this.finalPayment,
    required this.additionalNotes,
    required this.includeEngagementPackage,
    required this.engagementPackageAmount,
    required this.engagementBookingAmount,
    required this.engagementFinalPayment,
    required this.expiryPreset,
    this.customExpiryDay,
    this.clonedFromVersion,
  });

  List<QuotationEventDraft> events;
  String packageAmount;
  String bookingAmount;
  String secondPayment;
  String finalPayment;
  String additionalNotes;
  bool includeEngagementPackage;
  String engagementPackageAmount;
  String engagementBookingAmount;
  String engagementFinalPayment;
  String expiryPreset;
  String? customExpiryDay;
  int? clonedFromVersion;

  factory QuotationDraft.fromLead(LeadSummary lead) {
    return QuotationDraft(
      events: [QuotationEventDraft.defaultFromLead(lead)],
      packageAmount: QuotationDefaults.packageAmount,
      bookingAmount: QuotationDefaults.bookingAmount,
      secondPayment: QuotationDefaults.secondPayment,
      finalPayment: QuotationDefaults.finalPayment,
      additionalNotes: '',
      includeEngagementPackage: false,
      engagementPackageAmount: QuotationDefaults.engagementPackageAmount,
      engagementBookingAmount: QuotationDefaults.engagementBookingAmount,
      engagementFinalPayment: QuotationDefaults.engagementFinalPayment,
      expiryPreset: '48h',
    );
  }

  factory QuotationDraft.fromPrevious(QuotationDetail previous) {
    return QuotationDraft(
      events: previous.events.map((e) => e.copy()).toList(),
      packageAmount: previous.packageAmount,
      bookingAmount: previous.bookingAmount,
      secondPayment: previous.secondPayment,
      finalPayment: previous.finalPayment,
      additionalNotes: previous.additionalNotes,
      includeEngagementPackage: previous.includeEngagementPackage,
      engagementPackageAmount: previous.engagementPackageAmount,
      engagementBookingAmount: previous.engagementBookingAmount,
      engagementFinalPayment: previous.engagementFinalPayment,
      expiryPreset: '48h',
      clonedFromVersion: previous.version,
    );
  }

  DateTime resolveExpiry() {
    final now = DateTime.now();
    switch (expiryPreset) {
      case '24h':
        return now.add(const Duration(hours: 24));
      case '7d':
        return now.add(const Duration(days: 7));
      case 'custom':
        final day = customExpiryDay ?? now.toIso8601String().split('T').first;
        return DateTime.parse('${day}T23:59:59');
      case '48h':
      default:
        return now.add(const Duration(hours: 48));
    }
  }

  Map<String, dynamic> toCreateBody() => {
        'packageAmount': packageAmount.trim(),
        'bookingAmount': bookingAmount.trim(),
        'secondPayment': secondPayment.trim(),
        'finalPayment': finalPayment.trim(),
        'additionalNotes': additionalNotes.trim(),
        'includeEngagementPackage': includeEngagementPackage,
        'engagementPackageAmount': includeEngagementPackage ? engagementPackageAmount.trim() : '',
        'engagementBookingAmount': includeEngagementPackage ? engagementBookingAmount.trim() : '',
        'engagementFinalPayment': includeEngagementPackage ? engagementFinalPayment.trim() : '',
        'expiresAt': resolveExpiry().toUtc().toIso8601String(),
        'events': events.map((e) => e.toJson()).toList(),
      };

  bool get canProceedEvents =>
      events.isNotEmpty && events.every((e) => e.eventName.trim().isNotEmpty && e.eventDate.trim().isNotEmpty);

  bool get canProceedPackage => packageAmount.trim().isNotEmpty && bookingAmount.trim().isNotEmpty;

  bool get canProceedExpiry => expiryPreset != 'custom' || (customExpiryDay != null && customExpiryDay!.isNotEmpty);
}

String _isoDay(String? iso) {
  if (iso == null || iso.isEmpty) {
    return DateTime.now().toIso8601String().split('T').first;
  }
  return iso.split('T').first;
}
