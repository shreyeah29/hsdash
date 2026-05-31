import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';

class TaskStatusChip extends StatelessWidget {
  const TaskStatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }

  (Color, Color) _colors(String s) {
    switch (s) {
      case 'COMPLETED':
        return (const Color(0xFFD1FAE5), AppColors.emerald);
      case 'IN_PROGRESS':
        return (const Color(0xFFEDE9FE), AppColors.violet);
      case 'DELAYED':
        return (const Color(0xFFFFE4E6), AppColors.rose);
      default:
        return (AppColors.violetLight, AppColors.violet);
    }
  }
}

class StatChip extends StatelessWidget {
  const StatChip({super.key, required this.label, required this.value, this.accent});

  final String label;
  final String value;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1),
          ),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: accent ?? AppColors.textPrimary)),
        ],
      ),
    );
  }
}

class TaskCard extends StatelessWidget {
  const TaskCard({super.key, required this.clientName, required this.label, required this.status, this.subtitle, this.trailing});

  final String clientName;
  final String label;
  final String status;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(clientName, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(subtitle!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            TaskStatusChip(status: status),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
