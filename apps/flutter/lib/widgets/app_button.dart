import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

enum AppButtonVariant { primary, secondary, ghost, google }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.disabled = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final enabled = !disabled && onPressed != null;

    if (variant == AppButtonVariant.ghost) {
      return TextButton(
        onPressed: enabled ? onPressed : null,
        child: Text(label, style: const TextStyle(color: AppTheme.muted)),
      );
    }

    final bg = switch (variant) {
      AppButtonVariant.primary => AppTheme.primary,
      AppButtonVariant.secondary => Colors.transparent,
      AppButtonVariant.google => Colors.white,
      AppButtonVariant.ghost => Colors.transparent,
    };

    final fg = switch (variant) {
      AppButtonVariant.primary => AppTheme.onPrimary,
      AppButtonVariant.secondary => AppTheme.ink,
      AppButtonVariant.google => Colors.black87,
      AppButtonVariant.ghost => AppTheme.muted,
    };

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: enabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: bg.withValues(alpha: 0.4),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
            side: variant == AppButtonVariant.secondary
                ? const BorderSide(color: AppTheme.line)
                : BorderSide.none,
          ),
          elevation: 0,
        ),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
    );
  }
}
