class AppConfig {
  static const String appName = 'SoukSync';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8020/api/v1',
  );
  static const int connectTimeout = 15;
  static const int receiveTimeout = 15;
}
