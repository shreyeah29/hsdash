import 'package:hsdash_mobile/models/lead.dart';

const leadsExportColumns = [
  'STATUS',
  'SOURCE',
  'EVENT TYPE',
  'CLIENT NAME',
  'CONTACT NAME',
  'EMAIL',
  'PHONE',
  'EVENT DATE',
  'LOCATION',
  'BRIDE',
  'GROOM',
  'ASSIGNED TO',
  'CONVERTED',
  'CREATED AT',
  'MESSAGE',
];

List<List<String>> buildLeadsExportRows(List<LeadSummary> leads) {
  final sorted = [...leads]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  return sorted.map((lead) {
    return [
      leadStatusLabel(lead.status),
      leadSourceLabel(lead.source),
      lead.eventType,
      lead.clientName.isNotEmpty ? lead.clientName : lead.displayName,
      lead.name,
      lead.email,
      lead.phoneNumber,
      lead.eventDate,
      lead.eventLocation,
      lead.brideName,
      lead.groomName,
      lead.assignedToName ?? '',
      lead.isConverted ? 'Yes' : 'No',
      lead.createdAt,
      lead.message,
    ];
  }).toList();
}

String leadSourceLabel(String source) {
  switch (source) {
    case 'WEBSITE':
      return 'Website';
    case 'REFERRAL':
      return 'Referral';
    case 'INSTAGRAM':
      return 'Instagram';
    case 'WHATSAPP':
      return 'WhatsApp';
    case 'WALK_IN':
      return 'Walk-in';
    default:
      return source;
  }
}
