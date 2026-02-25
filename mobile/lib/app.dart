import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers/locale_provider.dart';
import 'screens/home_screen.dart';

class SoukSyncApp extends ConsumerWidget {
  const SoukSyncApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      onGenerateTitle: (ctx) => AppLocalizations.of(ctx)?.appTitle ?? 'SoukSync',
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1B2A4A),
        useMaterial3: true,
        fontFamily: 'NotoSansEthiopic',
      ),
      home: const HomeScreen(),
    );
  }
}
