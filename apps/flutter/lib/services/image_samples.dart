import 'dart:math';
import 'dart:typed_data';

import 'package:image/image.dart' as img;

import '../models/models.dart';

class PhotoValidationException implements Exception {
  PhotoValidationException(this.message);
  final String message;

  @override
  String toString() => message;
}

class ImageSampleService {
  static Future<List<LabColor>> samplesFromBytes(Uint8List bytes) async {
    final decoded = img.decodeImage(bytes);
    if (decoded == null) {
      throw PhotoValidationException(
        "We couldn't read that image. Try another photo.",
      );
    }

    final resized = img.copyResize(decoded, width: 64, height: 64);
    final stats = _statsFromImage(resized);
    _assertValid(stats);

    final center = stats.centerRgb;
    final samples = _stubSamplesFromAverageRgb(center.$1, center.$2, center.$3);
    samples.add(_srgbToLab(center.$1, center.$2, center.$3));
    return samples;
  }

  static ({({double r, double g, double b}) centerRgb, double luminanceVariance})
      _statsFromImage(img.Image image) {
    final w = image.width;
    final h = image.height;
    final cx0 = (w * 0.35).floor();
    final cx1 = (w * 0.65).ceil();
    final cy0 = (h * 0.25).floor();
    final cy1 = (h * 0.75).ceil();

    final center = _avgRgb(image, cx0, cy0, cx1, cy1);
    final luminances = <double>[];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        final p = image.getPixel(x, y);
        luminances.add(_luminance(p.r, p.g, p.b));
      }
    }
    final mean = luminances.reduce((a, b) => a + b) / luminances.length;
    var variance = 0.0;
    for (final l in luminances) {
      variance += (l - mean) * (l - mean);
    }
    variance = sqrt(variance / luminances.length);

    return (centerRgb: center, luminanceVariance: variance);
  }

  static ({double r, double g, double b}) _avgRgb(
    img.Image image,
    int x0,
    int y0,
    int x1,
    int y1,
  ) {
    var r = 0.0, g = 0.0, b = 0.0, n = 0;
    for (var y = y0; y < y1 && y < image.height; y++) {
      for (var x = x0; x < x1 && x < image.width; x++) {
        final p = image.getPixel(x, y);
        r += p.r;
        g += p.g;
        b += p.b;
        n++;
      }
    }
    if (n == 0) return (r: 128, g: 128, b: 128);
    return (r: r / n, g: g / n, b: b / n);
  }

  static double _luminance(num r, num g, num b) =>
      0.2126 * r + 0.7152 * g + 0.0722 * b;

  static void _assertValid(
    ({({double r, double g, double b}) centerRgb, double luminanceVariance}) stats,
  ) {
    if (stats.luminanceVariance < 8) {
      throw PhotoValidationException(
        'This photo looks too uniform. Use a clear photo of your face in daylight.',
      );
    }
    final lum = _luminance(
      stats.centerRgb.r,
      stats.centerRgb.g,
      stats.centerRgb.b,
    );
    if (lum < 25) {
      throw PhotoValidationException('Photo is too dark. Try brighter daylight.');
    }
    if (lum > 240) {
      throw PhotoValidationException('Photo is overexposed. Avoid harsh backlight.');
    }
  }

  static List<LabColor> _stubSamplesFromAverageRgb(double r, double g, double b) {
    final base = _srgbToLab(r, g, b);
    return [
      LabColor(l: base.l + 4, a: base.a + 1, b: base.b + 1),
      LabColor(l: base.l - 3, a: base.a - 1, b: base.b),
      LabColor(l: base.l, a: base.a + 2, b: base.b - 2),
    ];
  }

  /// sRGB (0–255) → CIELAB (D65).
  static LabColor _srgbToLab(double r, double g, double b) {
    double linearize(double c) {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4).toDouble();
    }

    final rl = linearize(r);
    final gl = linearize(g);
    final bl = linearize(b);

    final x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
    final y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
    final z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;

    double f(double t) =>
        t > 0.008856 ? pow(t, 1 / 3).toDouble() : (7.787 * t + 16 / 116);

    const refX = 0.95047;
    const refY = 1.0;
    const refZ = 1.08883;

    final fx = f(x / refX);
    final fy = f(y / refY);
    final fz = f(z / refZ);

    return LabColor(
      l: (116 * fy - 16).clamp(0, 100),
      a: 500 * (fx - fy),
      b: 200 * (fy - fz),
    );
  }
}
