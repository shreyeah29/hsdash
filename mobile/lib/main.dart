import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/app.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  configureAppSystemUi();
  ErrorWidget.builder = (details) {
    return Material(
      color: const Color(0xFFFAFAFA),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            details.exceptionAsString(),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFFE11D48), fontSize: 14),
          ),
        ),
      ),
    );
  };
  runApp(const ProviderScope(child: HsDashApp()));
}
