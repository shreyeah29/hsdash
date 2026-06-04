import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';

class TaskStatusChip extends StatelessWidget {
  const TaskStatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = _colors(status);
    final label = status.replaceAll('_', ' ');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.6, color: fg),
      ),
    );
  }

  (Color, Color, Color) _colors(String s) {
    switch (s) {
      case 'COMPLETED':
        return (const Color(0xFFECFDF5), AppColors.emerald, const Color(0xFFA7F3D0));
      case 'IN_PROGRESS':
        return (const Color(0xFFF5F3FF), AppColors.violet, const Color(0xFFDDD6FE));
      case 'DELAYED':
        return (const Color(0xFFFFF1F2), AppColors.rose, const Color(0xFFFECDD3));
      default:
        return (const Color(0xFFF4F4F5), AppColors.textMuted, AppColors.border);
    }
  }
}

/// Compact pill filter: Open · Done · All
class TaskFilterBar extends StatelessWidget {
  const TaskFilterBar({super.key, required this.selected, required this.onChanged});

  final TaskFilter selected;
  final ValueChanged<TaskFilter> onChanged;

  static const _labels = {
    TaskFilter.open: 'Open',
    TaskFilter.done: 'Done',
    TaskFilter.all: 'All',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
      ),
      child: Row(
        children: TaskFilter.values.map((filter) {
          final isSelected = filter == selected;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => onChanged(filter),
                  borderRadius: BorderRadius.circular(10),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOut,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.06),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      _labels[filter]!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppColors.violet : AppColors.textMuted,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

enum TaskActionKind { start, complete }

/// Filled action control for task rows (Start / Mark done).
class TaskActionButton extends StatelessWidget {
  const TaskActionButton({
    super.key,
    required this.kind,
    required this.onPressed,
  });

  final TaskActionKind kind;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final isComplete = kind == TaskActionKind.complete;
    final bg = isComplete ? AppColors.emerald : AppColors.violet;
    final icon = isComplete ? Icons.check_rounded : Icons.play_arrow_rounded;
    final label = isComplete ? 'Mark done' : 'Start';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: bg.withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: Colors.white),
                const SizedBox(width: 5),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class TaskActionBusy extends StatelessWidget {
  const TaskActionBusy({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 88,
      height: 34,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.violet),
      ),
    );
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
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.border.withValues(alpha: 0.85)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    clientName,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: -0.2),
                  ),
                  const SizedBox(height: 4),
                  Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, height: 1.25)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle!,
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.35),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                TaskStatusChip(status: status),
                if (trailing != null) ...[
                  const SizedBox(height: 10),
                  trailing!,
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Builds the standard Start / Mark done action for editable task rows.
Widget? buildTaskStatusAction({
  required bool showActions,
  required bool busy,
  required String status,
  required VoidCallback onStart,
  required VoidCallback onComplete,
}) {
  if (busy) return const TaskActionBusy();
  if (!showActions || status == 'COMPLETED') return null;
  if (status == 'PENDING' || status == 'DELAYED') {
    return TaskActionButton(kind: TaskActionKind.start, onPressed: onStart);
  }
  if (status == 'IN_PROGRESS') {
    return TaskActionButton(kind: TaskActionKind.complete, onPressed: onComplete);
  }
  return null;
}
