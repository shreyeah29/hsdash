/// Reusable client row derived from past shoot calendar entries.
class ShootClientProfile {
  const ShootClientProfile({
    required this.id,
    required this.displayLabel,
    required this.clientName,
    required this.clientType,
    required this.clientContact,
    required this.city,
    required this.venue,
    required this.brideName,
    required this.groomName,
    required this.phoneNumber,
    required this.isWedding,
  });

  final String id;
  final String displayLabel;
  final String clientName;
  final String clientType;
  final String clientContact;
  final String city;
  final String venue;
  final String brideName;
  final String groomName;
  final String phoneNumber;
  final bool isWedding;

  factory ShootClientProfile.fromJson(Map<String, dynamic> json) {
    final bride = json['brideName']?.toString() ?? '';
    final groom = json['groomName']?.toString() ?? '';
    final type = json['clientType']?.toString() ?? '';
    final clientName = json['clientName']?.toString() ?? '';
    final isWedding = bride.isNotEmpty ||
        groom.isNotEmpty ||
        type.toLowerCase().contains('wedding') ||
        clientName.contains('&');

    final rawPhone = json['phoneNumber']?.toString() ?? '';
    final rawContact = json['clientContact']?.toString() ?? '';

    return ShootClientProfile(
      id: json['id']?.toString() ?? '',
      displayLabel: json['displayLabel']?.toString() ?? clientName,
      clientName: clientName,
      clientType: type,
      clientContact: effectiveClientContact(phoneNumber: rawPhone, clientContact: rawContact),
      city: json['city']?.toString() ?? '',
      venue: json['venue']?.toString() ?? '',
      brideName: bride,
      groomName: groom,
      phoneNumber: effectiveClientPhone(phoneNumber: rawPhone, clientContact: rawContact),
      isWedding: isWedding,
    );
  }
}

/// True when the string is mostly digits (legacy shoots stored phone in contact).
bool looksLikePhoneNumber(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  return digits.length >= 8 && digits.length <= 15;
}

String effectiveClientPhone({required String phoneNumber, required String clientContact}) {
  final phone = phoneNumber.trim();
  if (phone.isNotEmpty) return phone;
  final contact = clientContact.trim();
  if (looksLikePhoneNumber(contact)) return contact;
  return '';
}

String effectiveClientContact({required String phoneNumber, required String clientContact}) {
  final phone = phoneNumber.trim();
  final contact = clientContact.trim();
  if (contact.isEmpty) return '';
  if (phone.isNotEmpty && contact == phone) return '';
  if (phone.isEmpty && looksLikePhoneNumber(contact)) return '';
  return contact;
}

String resolveShootClientName({
  required bool isWedding,
  required String brideName,
  required String groomName,
  required String clientName,
}) {
  if (!isWedding) return clientName.trim();
  final b = brideName.trim();
  final g = groomName.trim();
  if (b.isEmpty && g.isEmpty) return '';
  if (b.isEmpty) return g;
  if (g.isEmpty) return b;
  return '$b & $g';
}
