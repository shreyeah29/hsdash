import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';

class LaxmanHairline extends StatelessWidget {
  const LaxmanHairline({super.key, this.margin = const EdgeInsets.symmetric(vertical: 28)});

  final EdgeInsets margin;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: const Divider(height: 1, thickness: 1, color: LaxmanPalette.black),
    );
  }
}

class LaxmanPrimaryButton extends StatelessWidget {
  const LaxmanPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.onDark = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final bg = onDark ? LaxmanPalette.white : LaxmanPalette.black;
    final fg = onDark ? LaxmanPalette.black : LaxmanPalette.white;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 18, color: fg),
                  const SizedBox(width: 8),
                ],
                Text(
                  label.toUpperCase(),
                  style: LaxmanType.label('').copyWith(color: fg, letterSpacing: 2),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LaxmanGhostButton extends StatelessWidget {
  const LaxmanGhostButton({super.key, required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: LaxmanPalette.black, width: 1.5),
          ),
          child: Text(
            label.toUpperCase(),
            style: LaxmanType.label(''),
          ),
        ),
      ),
    );
  }
}

class LaxmanFilterRail extends StatelessWidget {
  const LaxmanFilterRail({super.key, required this.selected, required this.onChanged});

  final TaskFilter selected;
  final ValueChanged<TaskFilter> onChanged;

  static const _labels = {TaskFilter.open: 'OPEN', TaskFilter.done: 'DONE', TaskFilter.all: 'ALL'};

  @override
  Widget build(BuildContext context) {
    return Row(
      children: TaskFilter.values.map((f) {
        final on = f == selected;
        return Padding(
          padding: const EdgeInsets.only(right: 10),
          child: Material(
            color: on ? LaxmanPalette.black : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
            child: InkWell(
              onTap: () => onChanged(f),
              borderRadius: BorderRadius.circular(999),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  border: on ? null : Border.all(color: LaxmanPalette.black, width: 1.5),
                ),
                child: Text(
                  _labels[f]!,
                  style: LaxmanType.label('').copyWith(color: on ? LaxmanPalette.white : LaxmanPalette.black),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class LaxmanTaskRow extends StatelessWidget {
  const LaxmanTaskRow({
    super.key,
    required this.clientName,
    required this.label,
    required this.meta,
    required this.status,
    this.trailing,
    this.onTap,
  });

  final String clientName;
  final String label;
  final String meta;
  final String status;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(clientName, style: LaxmanType.bodyLarge(clientName)),
                    const SizedBox(height: 6),
                    Text(label, style: LaxmanType.body(label, size: 15)),
                    const SizedBox(height: 8),
                    Text(meta.toUpperCase(), style: LaxmanType.label(meta)),
                    const SizedBox(height: 10),
                    Text(
                      status.replaceAll('_', ' '),
                      style: LaxmanType.label(status).copyWith(fontSize: 10, letterSpacing: 2.8),
                    ),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
      ),
    );
  }
}

Widget? laxmanTaskAction({
  required bool showActions,
  required bool busy,
  required String status,
  required VoidCallback onStart,
  required VoidCallback onComplete,
  bool onDark = false,
}) {
  if (busy) {
    return SizedBox(
      width: 36,
      height: 36,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: onDark ? LaxmanPalette.white : LaxmanPalette.black,
      ),
    );
  }
  if (!showActions || status == 'COMPLETED') return null;
  if (status == 'PENDING' || status == 'DELAYED') {
    return LaxmanPrimaryButton(
      label: 'Start',
      icon: Icons.play_arrow_rounded,
      onPressed: onStart,
      onDark: onDark,
    );
  }
  if (status == 'IN_PROGRESS') {
    return LaxmanPrimaryButton(
      label: 'Done',
      icon: Icons.check_rounded,
      onPressed: onComplete,
      onDark: onDark,
    );
  }
  return null;
}

class LaxmanNotificationRow extends StatelessWidget {
  const LaxmanNotificationRow({
    super.key,
    required this.title,
    this.body,
    required this.unread,
    this.onTap,
    this.onMarkRead,
  });

  final String title;
  final String? body;
  final bool unread;
  final VoidCallback? onTap;
  final VoidCallback? onMarkRead;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: unread ? 4 : 1, color: LaxmanPalette.black),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 22, 4, 22),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: LaxmanType.bodyLarge(title).copyWith(
                                fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                              ),
                            ),
                            if (body != null && body!.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(body!, style: LaxmanType.body(body!, size: 14)),
                            ],
                          ],
                        ),
                      ),
                      if (unread && onMarkRead != null)
                        IconButton(
                          onPressed: onMarkRead,
                          icon: const Icon(Icons.check, color: LaxmanPalette.black),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LaxmanBottomNav extends StatelessWidget {
  const LaxmanBottomNav({
    super.key,
    required this.index,
    required this.onChanged,
    required this.labels,
    this.badgeIndex,
    this.badgeCount = 0,
  });

  final int index;
  final ValueChanged<int> onChanged;
  final List<String> labels;
  final int? badgeIndex;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: LaxmanPalette.white,
        border: Border(top: BorderSide(color: LaxmanPalette.black, width: 1)),
      ),
      padding: EdgeInsets.fromLTRB(12, 10, 12, MediaQuery.paddingOf(context).bottom + 10),
      child: Row(
        children: List.generate(labels.length, (i) {
          final selected = i == index;
          final showBadge = badgeIndex == i && badgeCount > 0;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                onChanged(i);
              },
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: selected ? LaxmanPalette.black : Colors.transparent,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (showBadge)
                      Text(
                        '$badgeCount',
                        style: LaxmanType.label('').copyWith(
                          color: selected ? LaxmanPalette.white : LaxmanPalette.black,
                          fontSize: 10,
                        ),
                      ),
                    Text(
                      labels[i].toUpperCase(),
                      style: LaxmanType.label(labels[i]).copyWith(
                        fontSize: 10,
                        color: selected ? LaxmanPalette.white : LaxmanPalette.black,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
