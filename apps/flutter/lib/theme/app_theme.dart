import 'package:flutter/material.dart';

class AppTheme {
  static const bg = Color(0xFF12141A);
  static const surface = Color(0xFF1C2028);
  static const ink = Color(0xFFF5F3F0);
  static const muted = Color(0xFFA8AEB8);
  static const dim = Color(0xFF6B7280);
  static const primary = Color(0xFF7B9FD4);
  static const danger = Color(0xFFE07A7A);
  static const onPrimary = Color(0xFF12141A);
  static const line = Color(0x1FF5F3F0);

  static const brandName = 'Every Hue';
  static const tagline = 'Find the hues that belong with you.';

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        surface: surface,
        error: danger,
        onPrimary: onPrimary,
        onSurface: ink,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        foregroundColor: ink,
        elevation: 0,
        centerTitle: true,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: bg,
        indicatorColor: primary.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(color: primary, fontSize: 12);
          }
          return const TextStyle(color: muted, fontSize: 12);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primary);
          }
          return const IconThemeData(color: muted);
        }),
      ),
      dividerColor: line,
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          color: ink,
          fontSize: 26,
          fontWeight: FontWeight.w600,
        ),
        bodyMedium: TextStyle(color: muted, height: 1.5),
        labelLarge: TextStyle(
          color: onPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
