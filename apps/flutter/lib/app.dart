import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/shell_screen.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';

class EveryHueApp extends StatelessWidget {
  const EveryHueApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppTheme.brandName,
      theme: AppTheme.dark(),
      home: const ShellScreen(),
    );
  }
}

class AppBootstrap extends StatefulWidget {
  const AppBootstrap({super.key});

  @override
  State<AppBootstrap> createState() => _AppBootstrapState();
}

class _AppBootstrapState extends State<AppBootstrap> {
  late final AuthService _auth;

  @override
  void initState() {
    super.initState();
    _auth = AuthService()..init();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _auth,
      child: const EveryHueApp(),
    );
  }
}
