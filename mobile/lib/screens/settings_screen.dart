import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/providers/locale_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  static const Map<String, String> _localeLabels = {
    'en': 'English',
    'am': 'አማርኛ',
    'om': 'Afaan Oromo',
    'sid': 'Sidama',
    'ti': 'ትግርኛ',
    'ar': 'العربية',
    'sw': 'Kiswahili',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Brand ──
          _sectionTitle(theme, 'Brand'),
          const SizedBox(height: 8),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.black.withOpacity(0.08)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.storefront_outlined, color: theme.colorScheme.primary, size: 24),
                      const SizedBox(width: 12),
                      Text(
                        AppConfig.appName,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Custom branding (logo, colors) is set by your organization in the web dashboard.',
                    style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ── Features ──
          _sectionTitle(theme, 'Features'),
          const SizedBox(height: 8),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.black.withOpacity(0.08)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.flag_outlined, color: theme.colorScheme.primary, size: 24),
                      const SizedBox(width: 12),
                      const Text('Feature flags', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Feature toggles are managed by your admin in Settings. This app respects enabled features.',
                    style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ── Language ──
          _sectionTitle(theme, 'Language'),
          const SizedBox(height: 8),
          ...AppConstants.supportedLocales.map((code) {
            return Card(
              elevation: 0,
              margin: const EdgeInsets.only(bottom: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.black.withOpacity(0.08)),
              ),
              child: RadioListTile<String>(
                value: code,
                groupValue: locale.languageCode,
                title: Text(_localeLabels[code] ?? code),
                onChanged: (value) async {
                  if (value == null) return;
                  await ref.read(localeProvider.notifier).setLocale(value);
                },
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _sectionTitle(ThemeData theme, String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
    );
  }
}

