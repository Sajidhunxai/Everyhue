import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/env.dart';
import '../models/models.dart';

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<DashboardStats> fetchDashboard(String accessToken) async {
    final res = await _client.get(
      Uri.parse('${Env.apiBaseUrl}/api/dashboard'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    if (res.statusCode != 200) {
      throw Exception(res.body.isNotEmpty ? res.body : 'Dashboard failed');
    }
    return DashboardStats.fromJson(
      jsonDecode(res.body) as Map<String, dynamic>,
    );
  }

  Future<AnalyzeResult> analyze({
    required String accessToken,
    required List<LabColor> samples,
    String? faceShape,
    String? bodyType,
    String? profileId,
  }) async {
    final body = <String, dynamic>{
      'mode': 'lab',
      'samples': samples.map((s) => s.toJson()).toList(),
      if (faceShape != null) 'faceShape': faceShape,
      if (bodyType != null) 'bodyType': bodyType,
      if (profileId != null) 'profileId': profileId,
    };

    final res = await _client.post(
      Uri.parse('${Env.apiBaseUrl}/api/analyze'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode(body),
    );

    if (res.statusCode != 200) {
      throw Exception(res.body.isNotEmpty ? res.body : 'Analyze failed');
    }

    return AnalyzeResult.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<({String accessToken, UserPublic user})> exchangeMobileAuth({
    required String provider,
    required String providerToken,
  }) async {
    final res = await _client.post(
      Uri.parse('${Env.apiBaseUrl}/api/auth/mobile'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'provider': provider,
        'accessToken': providerToken,
      }),
    );

    if (res.statusCode != 200) {
      throw Exception(res.body.isNotEmpty ? res.body : 'Auth failed');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (
      accessToken: data['accessToken'] as String,
      user: UserPublic.fromJson(data['user'] as Map<String, dynamic>),
    );
  }
}
