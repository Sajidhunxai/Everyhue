import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../config/env.dart';
import '../models/models.dart';
import 'api_client.dart';

const _tokenKey = 'photomatcher.accessToken';
const _userKey = 'photomatcher.user';

class AuthService extends ChangeNotifier {
  AuthService({ApiClient? api, FlutterSecureStorage? storage})
      : _api = api ?? ApiClient(),
        _storage = storage ?? const FlutterSecureStorage();

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  UserPublic? user;
  String? accessToken;
  bool ready = false;

  Future<void> init() async {
    try {
      final token = await _storage.read(key: _tokenKey);
      final rawUser = await _storage.read(key: _userKey);
      if (token != null && rawUser != null) {
        accessToken = token;
        user = UserPublic.fromJson(
          jsonDecode(rawUser) as Map<String, dynamic>,
        );
      }
    } finally {
      ready = true;
      notifyListeners();
    }
  }

  Future<void> signInWithGoogle() async {
    if (!Env.isGoogleConfigured) {
      throw Exception(
        'Set GOOGLE_WEB_CLIENT_ID via --dart-define (see apps/flutter/README.md)',
      );
    }

    final googleSignIn = GoogleSignIn(
      scopes: const ['email', 'profile'],
      serverClientId:
          Env.googleWebClientId.isNotEmpty ? Env.googleWebClientId : null,
    );

    final account = await googleSignIn.signIn();
    if (account == null) return;

    final auth = await account.authentication;
    final token = auth.accessToken;
    if (token == null) {
      throw Exception('Google did not return an access token');
    }

    final session = await _api.exchangeMobileAuth(
      provider: 'google',
      providerToken: token,
    );

    await _persist(session.accessToken, session.user);
  }

  Future<void> _persist(String token, UserPublic u) async {
    accessToken = token;
    user = u;
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userKey, value: jsonEncode(u.toJson()));
    notifyListeners();
  }

  Future<void> signOut() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    accessToken = null;
    user = null;
    notifyListeners();
  }
}
