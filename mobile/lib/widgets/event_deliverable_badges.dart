import 'package:flutter/material.dart';
import 'package:hsdash_mobile/core/deliverable_badges.dart';
import 'package:hsdash_mobile/models/task.dart';

/// Compact status chips for open deliverables on an event row.
class EventDeliverableBadges extends StatelessWidget {
  const EventDeliverableBadges({
    super.key,
    required this.tasks,
    this.inactiveLabel = 'Deliverables off',
    this.alignEnd = false,
  });

  final List<Task> tasks;
  final String inactiveLabel;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) {
      return Wrap(
        alignment: alignEnd ? WrapAlignment.end : WrapAlignment.start,
        children: [_mutedChip(inactiveLabel, dashed: true)],
      );
    }

    final result = openDeliverableBadges(tasks);
    if (result.totalOpen == 0) {
      return Wrap(
        alignment: alignEnd ? WrapAlignment.end : WrapAlignment.start,
        children: [_doneChip()],
      );
    }

    return Wrap(
      spacing: 4,
      runSpacing: 4,
      alignment: alignEnd ? WrapAlignment.end : WrapAlignment.start,
      children: [
        for (final b in result.badges) _toneChip(b),
        if (result.overflow > 0) _mutedChip('+${result.overflow} more'),
      ],
    );
  }

  Widget _toneChip(DeliverableStatusBadge b) {
    final (bg, fg, border) = switch (b.tone) {
      DeliverableBadgeTone.pending => (
          const Color(0xFFFFFBEB),
          const Color(0xFF78350F),
          const Color(0xFFFDE68A),
        ),
      DeliverableBadgeTone.wip => (
          const Color(0xFFECFEFF),
          const Color(0xFF164E63),
          const Color(0xFFA5F3FC),
        ),
      DeliverableBadgeTone.delayed => (
          const Color(0xFFFFF1F2),
          const Color(0xFF9F1239),
          const Color(0xFFFECDD3),
        ),
    };
    return Container(
      constraints: const BoxConstraints(maxWidth: 148),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text(
        b.label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          height: 1.2,
          color: fg,
        ),
      ),
    );
  }

  Widget _doneChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFA7F3D0)),
      ),
      child: const Text(
        'All deliverables done',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          height: 1.2,
          color: Color(0xFF065F46),
        ),
      ),
    );
  }

  Widget _mutedChip(String label, {bool dashed = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFFAfAfA),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: const Color(0xFFD4D4D8),
          style: dashed ? BorderStyle.solid : BorderStyle.solid,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          height: 1.2,
          color: const Color(0xFF71717A),
        ),
      ),
    );
  }
}
