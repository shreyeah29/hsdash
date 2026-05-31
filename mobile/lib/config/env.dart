/// API base URL — override at run time:
/// flutter run --dart-define=API_URL=https://hsdash.onrender.com
const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://hsdash.onrender.com',
);
