import 'package:url_launcher/url_launcher.dart';

/// Public legal URLs used for App Store / in-app links.
abstract final class AppLegal {
  static const privacyPolicyUrl = 'https://hswf.app/privacy';
  static const termsOfUseUrl = 'https://hswf.app/terms';
  static const supportEmail = 'hello@hswf.in';
  static const supportUrl = 'https://hswf.app/support';

  static Future<bool> openPrivacyPolicy() => _open(privacyPolicyUrl);

  static Future<bool> openTermsOfUse() => _open(termsOfUseUrl);

  static Future<bool> openSupport() => _open(supportUrl);

  static Future<bool> _open(String url) async {
    final uri = Uri.parse(url);
    if (!await canLaunchUrl(uri)) return false;
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
