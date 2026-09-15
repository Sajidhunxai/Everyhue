/// Runtime config — override with `--dart-define=API_URL=http://192.168.x.x:3000`.
class Env {
  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://192.168.18.98:3000',
  );

  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );

  static const googleAndroidClientId = String.fromEnvironment(
    'GOOGLE_ANDROID_CLIENT_ID',
    defaultValue: '',
  );

  static String get apiBaseUrl => apiUrl.replaceAll(RegExp(r'/$'), '');

  static bool get isGoogleConfigured =>
      googleWebClientId.isNotEmpty || googleAndroidClientId.isNotEmpty;
}
