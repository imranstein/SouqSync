import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../constants/app_constants.dart';

const _localeKey = 'locale_code';

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale(AppConstants.defaultLocale)) {
    _load();
  }

  void _load() {
    final box = Hive.box('settings');
    final code = box.get(_localeKey) as String?;
    if (code != null && code.isNotEmpty) {
      state = Locale(code);
    }
  }

  Future<void> setLocale(String code) async {
    final next = code.trim();
    if (next.isEmpty) return;
    state = Locale(next);
    await Hive.box('settings').put(_localeKey, next);
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

