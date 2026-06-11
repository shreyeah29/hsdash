import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/shoot_time_utils.dart';

/// Black / white time picker with purple selection — no pink or lavender tints.
Theme wrapShootTimePicker(BuildContext context, Widget? child) {
  const ink = Color(0xFF111111);
  const muted = Color(0xFF6B7280);
  const line = Color(0xFFE5E5E5);
  const dialFill = Color(0xFFF5F5F5);

  return Theme(
    data: Theme.of(context).copyWith(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: AppColors.violet,
        onPrimary: Colors.white,
        secondary: AppColors.violet,
        onSecondary: Colors.white,
        surface: Colors.white,
        onSurface: ink,
        onSurfaceVariant: muted,
        outline: line,
        surfaceContainerHighest: dialFill,
      ),
      dialogTheme: const DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      timePickerTheme: TimePickerThemeData(
        backgroundColor: Colors.white,
        dialBackgroundColor: dialFill,
        dialHandColor: AppColors.violet,
        dialTextColor: ink,
        entryModeIconColor: muted,
        hourMinuteShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: line),
        ),
        dayPeriodShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: line),
        ),
        dayPeriodBorderSide: const BorderSide(color: line),
        hourMinuteColor: WidgetStateColor.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.violet;
          return Colors.white;
        }),
        hourMinuteTextColor: WidgetStateColor.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return Colors.white;
          return ink;
        }),
        dayPeriodColor: WidgetStateColor.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.violet;
          return Colors.white;
        }),
        dayPeriodTextColor: WidgetStateColor.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return Colors.white;
          return ink;
        }),
        helpTextStyle: const TextStyle(color: muted, fontWeight: FontWeight.w500),
        hourMinuteTextStyle: const TextStyle(fontSize: 52, fontWeight: FontWeight.w400, color: ink),
        dayPeriodTextStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: AppColors.violet),
      ),
    ),
    child: MediaQuery(
      data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: false),
      child: child ?? const SizedBox.shrink(),
    ),
  );
}

/// Tap-to-pick time using the system time picker (mobile-friendly).
class ShootTimeField extends StatelessWidget {
  const ShootTimeField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final String value;
  final ValueChanged<String> onChanged;

  Future<void> _pick(BuildContext context) async {
    final parts = parseShootTime(value);
    final picked = await showTimePicker(
      context: context,
      initialTime: shootPartsToTimeOfDay(parts),
      builder: wrapShootTimePicker,
    );
    if (picked == null) return;
    onChanged(formatShootTime(timeOfDayToShootParts(picked)));
  }

  @override
  Widget build(BuildContext context) {
    final display = value.trim().isEmpty ? 'Tap to set time' : value;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => _pick(context),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.schedule, color: AppColors.violet, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    const SizedBox(height: 2),
                    Text(
                      display,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: value.trim().isEmpty ? AppColors.textMuted : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
