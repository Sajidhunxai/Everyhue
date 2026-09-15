import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/env.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_button.dart';
import '../widgets/brand_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _busy = false;
  String? _error;

  Future<void> _signIn() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AuthService>().signInWithGoogle();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const BrandLogo(size: LogoSize.lg),
            const SizedBox(height: 16),
            Text('Welcome back', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            const Text(
              'Sign in to save palettes, wardrobe items, and family profiles.',
            ),
            const SizedBox(height: 24),
            if (_busy) const Center(child: CircularProgressIndicator()),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: const TextStyle(color: AppTheme.danger)),
              ),
            if (Env.isGoogleConfigured)
              AppButton(
                label: 'Continue with Google',
                variant: AppButtonVariant.google,
                disabled: _busy,
                onPressed: _signIn,
              )
            else
              const Text(
                'Configure GOOGLE_WEB_CLIENT_ID via --dart-define. See apps/flutter/README.md.',
                style: TextStyle(color: AppTheme.muted),
              ),
          ],
        ),
      ),
    );
  }
}
