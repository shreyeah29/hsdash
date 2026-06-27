import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';

class LeadSummary {
  const LeadSummary({
    required this.id,
    required this.status,
    required this.source,
    required this.eventType,
    required this.name,
    required this.email,
    required this.phoneNumber,
    required this.eventDate,
    required this.eventLocation,
    required this.brideName,
    required this.groomName,
    required this.clientName,
    required this.message,
    this.assignedToId,
    this.assignedToName,
    this.convertedEntryId,
    this.convertedAt,
    required this.createdAt,
  });

  final String id;
  final String status;
  final String source;
  final String eventType;
  final String name;
  final String email;
  final String phoneNumber;
  final String eventDate;
  final String eventLocation;
  final String brideName;
  final String groomName;
  final String clientName;
  final String message;
  final String? assignedToId;
  final String? assignedToName;
  final String? convertedEntryId;
  final String? convertedAt;
  final String createdAt;

  String get displayName {
    if (eventType == 'WEDDING') {
      final b = brideName.trim();
      final g = groomName.trim();
      if (b.isNotEmpty && g.isNotEmpty) return '$b & $g';
      if (b.isNotEmpty) return b;
      if (g.isNotEmpty) return g;
    }
    final c = clientName.trim();
    if (c.isNotEmpty) return c;
    return name.trim().isNotEmpty ? name.trim() : 'Lead';
  }

  bool get isConverted => convertedEntryId != null && convertedEntryId!.isNotEmpty;

  factory LeadSummary.fromJson(Map<String, dynamic> json) {
    final assigned = json['assignedTo'] as Map<String, dynamic>?;
    return LeadSummary(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'NEW',
      source: json['source']?.toString() ?? 'WEBSITE',
      eventType: json['eventType']?.toString() ?? 'WEDDING',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      eventDate: json['eventDate']?.toString() ?? '',
      eventLocation: json['eventLocation']?.toString() ?? '',
      brideName: json['brideName']?.toString() ?? '',
      groomName: json['groomName']?.toString() ?? '',
      clientName: json['clientName']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      assignedToId: assigned?['id']?.toString(),
      assignedToName: assigned?['name']?.toString(),
      convertedEntryId: json['convertedEntryId']?.toString(),
      convertedAt: json['convertedAt']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}

class LeadNote {
  const LeadNote({
    required this.id,
    required this.content,
    required this.authorName,
    required this.createdAt,
  });

  final String id;
  final String content;
  final String authorName;
  final String createdAt;

  factory LeadNote.fromJson(Map<String, dynamic> json) {
    final author = json['author'] as Map<String, dynamic>?;
    return LeadNote(
      id: json['id']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      authorName: author?['name']?.toString() ?? 'Staff',
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}

class LeadActivity {
  const LeadActivity({
    required this.id,
    required this.kind,
    required this.message,
    required this.createdAt,
    this.actorName,
  });

  final String id;
  final String kind;
  final String message;
  final String createdAt;
  final String? actorName;

  factory LeadActivity.fromJson(Map<String, dynamic> json) {
    final actor = json['actor'] as Map<String, dynamic>?;
    return LeadActivity(
      id: json['id']?.toString() ?? '',
      kind: json['kind']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      createdAt: json['createdAt']?.toString() ?? '',
      actorName: actor?['name']?.toString(),
    );
  }
}

class LeadDetail extends LeadSummary {
  const LeadDetail({
    required super.id,
    required super.status,
    required super.source,
    required super.eventType,
    required super.name,
    required super.email,
    required super.phoneNumber,
    required super.eventDate,
    required super.eventLocation,
    required super.brideName,
    required super.groomName,
    required super.clientName,
    required super.message,
    super.assignedToId,
    super.assignedToName,
    super.convertedEntryId,
    super.convertedAt,
    required super.createdAt,
    required this.notes,
    required this.activities,
  });

  final List<LeadNote> notes;
  final List<LeadActivity> activities;

  factory LeadDetail.fromSummary(LeadSummary summary) {
    return LeadDetail(
      id: summary.id,
      status: summary.status,
      source: summary.source,
      eventType: summary.eventType,
      name: summary.name,
      email: summary.email,
      phoneNumber: summary.phoneNumber,
      eventDate: summary.eventDate,
      eventLocation: summary.eventLocation,
      brideName: summary.brideName,
      groomName: summary.groomName,
      clientName: summary.clientName,
      message: summary.message,
      assignedToId: summary.assignedToId,
      assignedToName: summary.assignedToName,
      convertedEntryId: summary.convertedEntryId,
      convertedAt: summary.convertedAt,
      createdAt: summary.createdAt,
      notes: const [],
      activities: const [],
    );
  }

  factory LeadDetail.fromJson(Map<String, dynamic> json) {
    final notesJson = json['notes'] as List<dynamic>? ?? [];
    final activitiesJson = json['activities'] as List<dynamic>? ?? [];
    final assigned = json['assignedTo'] as Map<String, dynamic>?;
    return LeadDetail(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'NEW',
      source: json['source']?.toString() ?? 'WEBSITE',
      eventType: json['eventType']?.toString() ?? 'WEDDING',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      eventDate: json['eventDate']?.toString() ?? '',
      eventLocation: json['eventLocation']?.toString() ?? '',
      brideName: json['brideName']?.toString() ?? '',
      groomName: json['groomName']?.toString() ?? '',
      clientName: json['clientName']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      assignedToId: assigned?['id']?.toString(),
      assignedToName: assigned?['name']?.toString(),
      convertedEntryId: json['convertedEntryId']?.toString(),
      convertedAt: json['convertedAt']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
      notes: notesJson.map((e) => LeadNote.fromJson(e as Map<String, dynamic>)).toList(),
      activities: activitiesJson.map((e) => LeadActivity.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

class LeadStats {
  const LeadStats({
    required this.total,
    required this.newCount,
    required this.contacted,
    required this.negotiation,
    required this.confirmed,
    required this.lost,
    required this.conversionRate,
  });

  final int total;
  final int newCount;
  final int contacted;
  final int negotiation;
  final int confirmed;
  final int lost;
  final double conversionRate;

  factory LeadStats.fromJson(Map<String, dynamic> json) {
    return LeadStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      newCount: (json['new'] as num?)?.toInt() ?? 0,
      contacted: (json['contacted'] as num?)?.toInt() ?? 0,
      negotiation: (json['negotiation'] as num?)?.toInt() ?? 0,
      confirmed: (json['confirmed'] as num?)?.toInt() ?? 0,
      lost: (json['lost'] as num?)?.toInt() ?? 0,
      conversionRate: (json['conversionRate'] as num?)?.toDouble() ?? 0,
    );
  }
}

String leadStatusLabel(String status) {
  switch (status) {
    case 'NEW':
      return 'New';
    case 'CONTACTED':
      return 'Contacted';
    case 'NEGOTIATION':
      return 'Negotiation';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'LOST':
      return 'Lost';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
}

Color leadStatusColor(String status) {
  switch (status) {
    case 'NEW':
      return PremiumLight.info;
    case 'CONTACTED':
      return PremiumLight.accentSecondary;
    case 'NEGOTIATION':
      return PremiumLight.warning;
    case 'CONFIRMED':
      return PremiumLight.success;
    case 'LOST':
      return PremiumLight.error;
    case 'ARCHIVED':
      return PremiumLight.textMuted;
    default:
      return PremiumLight.textMuted;
  }
}

IconData leadStatusIcon(String status) {
  switch (status) {
    case 'NEW':
      return Icons.auto_awesome_rounded;
    case 'CONTACTED':
      return Icons.forum_rounded;
    case 'NEGOTIATION':
      return Icons.handshake_rounded;
    case 'CONFIRMED':
      return Icons.verified_rounded;
    case 'LOST':
      return Icons.heart_broken_rounded;
    case 'ARCHIVED':
      return Icons.inventory_2_rounded;
    default:
      return Icons.circle_outlined;
  }
}

String leadStatusHint(String status) {
  switch (status) {
    case 'NEW':
      return 'Fresh enquiry — make first contact';
    case 'CONTACTED':
      return 'Conversation started';
    case 'NEGOTIATION':
      return 'Quotation & terms in play';
    case 'CONFIRMED':
      return 'Booked — ready to convert';
    case 'LOST':
      return 'Marked as not proceeding';
    case 'ARCHIVED':
      return 'Filed away for later';
    default:
      return 'Update pipeline stage';
  }
}

/// Sales funnel order — terminal states sit outside the main rail.
const kLeadPipelineStatuses = ['NEW', 'CONTACTED', 'NEGOTIATION', 'CONFIRMED'];
const kLeadTerminalStatuses = ['LOST', 'ARCHIVED'];
