import 'package:flutter/material.dart';

import '../models/models.dart';
import '../theme/app_theme.dart';

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({super.key, required this.result});

  final AnalyzeResult result;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Results')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('Engine ${result.engineVersion}', style: const TextStyle(color: AppTheme.muted)),
          const SizedBox(height: 8),
          Text(result.seasonLabel, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'Undertone: ${result.undertone} · Confidence ${(result.confidence * 100).round()}%',
          ),
          const SizedBox(height: 24),
          const Text('Your palette', style: TextStyle(color: AppTheme.ink, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: result.palette
                .map((s) => _SwatchTile(swatch: s))
                .toList(),
          ),
          const SizedBox(height: 24),
          const Text('Usually avoid', style: TextStyle(color: AppTheme.ink, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: result.avoid.map((s) => _SwatchTile(swatch: s)).toList(),
          ),
          const SizedBox(height: 24),
          const Text('Quick tips', style: TextStyle(color: AppTheme.ink, fontSize: 18, fontWeight: FontWeight.w600)),
          ...result.tips.map((t) => Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('• $t'),
              )),
        ],
      ),
    );
  }
}

class _SwatchTile extends StatelessWidget {
  const _SwatchTile({required this.swatch});
  final PaletteSwatch swatch;

  @override
  Widget build(BuildContext context) {
    final color = _parseHex(swatch.hex);
    return SizedBox(
      width: 72,
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            swatch.name,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.muted, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Color _parseHex(String hex) {
    final h = hex.replaceFirst('#', '');
    if (h.length == 6) {
      return Color(int.parse('FF$h', radix: 16));
    }
    return AppTheme.muted;
  }
}
