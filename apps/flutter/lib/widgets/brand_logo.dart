import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.size = LogoSize.md});

  final LogoSize size;

  @override
  Widget build(BuildContext context) {
    final fontSize = switch (size) {
      LogoSize.sm => 16.0,
      LogoSize.md => 20.0,
      LogoSize.lg => 28.0,
    };

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomPaint(
          size: Size(fontSize * 1.1, fontSize * 1.1),
          painter: _ColorWheelMark(),
        ),
        const SizedBox(width: 8),
        RichText(
          text: TextSpan(
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              color: AppTheme.ink,
            ),
            children: const [
              TextSpan(text: 'Every '),
              TextSpan(
                text: 'Hue',
                style: TextStyle(color: AppTheme.primary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

enum LogoSize { sm, md, lg }

class _ColorWheelMark extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    const colors = [
      Color(0xFF7B9FD4),
      Color(0xFFE8A87C),
      Color(0xFF9BC4A8),
      Color(0xFFB8A8C8),
      Color(0xFFE07A7A),
      Color(0xFFF5F3F0),
    ];
    final sweep = 2 * 3.14159 / colors.length;
    for (var i = 0; i < colors.length; i++) {
      final paint = Paint()..color = colors[i];
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        i * sweep,
        sweep,
        true,
        paint,
      );
    }
    canvas.drawCircle(center, radius * 0.35, Paint()..color = AppTheme.bg);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
