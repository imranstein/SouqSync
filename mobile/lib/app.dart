import 'package:flutter/material.dart';

class SoukSyncApp extends StatelessWidget {
  const SoukSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SoukSync',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1B2A4A),
        useMaterial3: true,
        fontFamily: 'NotoSansEthiopic',
      ),
      home: const Scaffold(
        body: Center(
          child: Text('SoukSync'),
        ),
      ),
    );
  }
}
