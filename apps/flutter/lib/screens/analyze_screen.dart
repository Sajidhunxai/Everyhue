import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/image_samples.dart';
import '../theme/app_theme.dart';
import '../widgets/app_button.dart';
import 'login_screen.dart';
import 'results_screen.dart';

const _faceShapes = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
];

const _bodyTypes = [
  'balanced',
  'pear',
  'apple',
  'hourglass',
  'rectangle',
  'inverted_triangle',
];

class AnalyzeScreen extends StatefulWidget {
  const AnalyzeScreen({super.key});

  @override
  State<AnalyzeScreen> createState() => _AnalyzeScreenState();
}

class _AnalyzeScreenState extends State<AnalyzeScreen> {
  final _api = ApiClient();
  final _picker = ImagePicker();
  bool _busy = false;
  String? _error;
  String _faceShape = 'oval';
  String _bodyType = 'balanced';

  Future<void> _pick(ImageSource source) async {
    final auth = context.read<AuthService>();
    if (auth.accessToken == null) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      );
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final file = await _picker.pickImage(source: source, imageQuality: 70);
      if (file == null) return;

      final bytes = await file.readAsBytes();
      final samples = await ImageSampleService.samplesFromBytes(bytes);
      final result = await _api.analyze(
        accessToken: auth.accessToken!,
        samples: samples,
        faceShape: _faceShape,
        bodyType: _bodyType,
      );

      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => ResultsScreen(result: result),
        ),
      );
    } on PhotoValidationException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _cycleFace() {
    setState(() {
      final i = _faceShapes.indexOf(_faceShape);
      _faceShape = _faceShapes[(i + 1) % _faceShapes.length];
    });
  }

  void _cycleBody() {
    setState(() {
      final i = _bodyTypes.indexOf(_bodyType);
      _bodyType = _bodyTypes[(i + 1) % _bodyTypes.length];
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Analyze', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        const Text(
          'Use daylight on your face. We verify the photo looks like a person before analyzing.',
        ),
        const SizedBox(height: 16),
        Text('Face: $_faceShape', style: const TextStyle(color: AppTheme.ink)),
        TextButton(onPressed: _cycleFace, child: const Text('Change face shape')),
        Text('Body: $_bodyType', style: const TextStyle(color: AppTheme.ink)),
        TextButton(onPressed: _cycleBody, child: const Text('Change body type')),
        if (_busy) const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Center(child: CircularProgressIndicator()),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_error!, style: const TextStyle(color: AppTheme.danger)),
          ),
        AppButton(
          label: 'Camera',
          disabled: _busy,
          onPressed: () => _pick(ImageSource.camera),
        ),
        const SizedBox(height: 8),
        AppButton(
          label: 'Gallery',
          variant: AppButtonVariant.secondary,
          disabled: _busy,
          onPressed: () => _pick(ImageSource.gallery),
        ),
      ],
    );
  }
}
