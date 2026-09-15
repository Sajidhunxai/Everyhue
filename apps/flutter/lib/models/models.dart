class UserPublic {
  const UserPublic({
    required this.id,
    this.name,
    this.email,
    this.image,
  });

  final String id;
  final String? name;
  final String? email;
  final String? image;

  factory UserPublic.fromJson(Map<String, dynamic> json) {
    return UserPublic(
      id: json['id'] as String,
      name: json['name'] as String?,
      email: json['email'] as String?,
      image: json['image'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'image': image,
      };
}

class LabColor {
  const LabColor({required this.l, required this.a, required this.b});

  final double l;
  final double a;
  final double b;

  Map<String, dynamic> toJson() => {'L': l, 'a': a, 'b': b};
}

class PaletteSwatch {
  const PaletteSwatch({required this.hex, required this.name});

  final String hex;
  final String name;

  factory PaletteSwatch.fromJson(Map<String, dynamic> json) {
    return PaletteSwatch(
      hex: json['hex'] as String,
      name: json['name'] as String,
    );
  }
}

class AnalyzeResult {
  const AnalyzeResult({
    required this.engineVersion,
    required this.seasonId,
    required this.seasonLabel,
    required this.confidence,
    required this.undertone,
    required this.palette,
    required this.avoid,
    required this.tips,
    this.styleGuide,
  });

  final String engineVersion;
  final String seasonId;
  final String seasonLabel;
  final double confidence;
  final String undertone;
  final List<PaletteSwatch> palette;
  final List<PaletteSwatch> avoid;
  final List<String> tips;
  final Map<String, dynamic>? styleGuide;

  factory AnalyzeResult.fromJson(Map<String, dynamic> json) {
    return AnalyzeResult(
      engineVersion: json['engine_version'] as String? ?? '',
      seasonId: json['seasonId'] as String? ?? '',
      seasonLabel: json['seasonLabel'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      undertone: json['undertone'] as String? ?? '',
      palette: (json['palette'] as List<dynamic>? ?? [])
          .map((e) => PaletteSwatch.fromJson(e as Map<String, dynamic>))
          .toList(),
      avoid: (json['avoid'] as List<dynamic>? ?? [])
          .map((e) => PaletteSwatch.fromJson(e as Map<String, dynamic>))
          .toList(),
      tips: (json['tips'] as List<dynamic>? ?? []).cast<String>(),
      styleGuide: json['styleGuide'] as Map<String, dynamic>?,
    );
  }
}

class DashboardStats {
  const DashboardStats({
    required this.analysisCount,
    required this.wardrobeCount,
    required this.profileCount,
    this.latestSeason,
  });

  final int analysisCount;
  final int wardrobeCount;
  final int profileCount;
  final String? latestSeason;

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      analysisCount: json['analysisCount'] as int? ?? 0,
      wardrobeCount: json['wardrobeCount'] as int? ?? 0,
      profileCount: json['profileCount'] as int? ?? 0,
      latestSeason: json['latestSeason'] as String?,
    );
  }
}
