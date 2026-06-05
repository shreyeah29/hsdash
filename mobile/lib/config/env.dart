/// API base URL — override at run time:
/// flutter run --dart-define=API_URL=https://hsdash.onrender.com
const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://hsdash.onrender.com',
);

/// Public website — enquiry form is served here (not the API host).
const String publicSiteUrl = String.fromEnvironment(
  'PUBLIC_SITE_URL',
  defaultValue: 'https://hsdash.vercel.app',
);

String get enquiryFormUrl => '$publicSiteUrl/enquiry';

String enquiryShareMessage([String? url]) {
  final link = url ?? enquiryFormUrl;
  return "Thank you for contacting HS Photography. Please fill out our enquiry form and we'll get back to you shortly:\n$link";
}
