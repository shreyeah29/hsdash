import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';

const sheetTaskTypeOrder = <String>[
  'DATA_COPY',
  'SNEAK_PEEK_PHOTOS',
  'FULL_SET_PHOTOS',
  'CINEMATIC_VIDEO',
  'REELS',
  'TRADITIONAL_VIDEO',
  'ALBUM_DESIGN',
  'ALBUM_PRINT',
];

const deliverableBadgeLabels = <String, String>{
  'DATA_COPY': 'Data copy',
  'SNEAK_PEEK_PHOTOS': 'Sneak peek',
  'FULL_SET_PHOTOS': 'Full set',
  'CINEMATIC_VIDEO': 'Cinematic',
  'REELS': 'Reels',
  'TRADITIONAL_VIDEO': 'Traditional',
  'ALBUM_DESIGN': 'Album design',
  'ALBUM_PRINT': 'Album print',
  'PREVIEW_PHOTOS': 'Preview',
  'FULL_PHOTOS': 'Full photos',
  'CINEMATIC_HIGHLIGHT': 'Highlight',
};

enum DeliverableBadgeTone { pending, wip, delayed }

class DeliverableStatusBadge {
  const DeliverableStatusBadge({
    required this.key,
    required this.label,
    required this.tone,
  });

  final String key;
  final String label;
  final DeliverableBadgeTone tone;
}

class OpenDeliverableBadges {
  const OpenDeliverableBadges({
    required this.badges,
    required this.overflow,
    required this.totalOpen,
    required this.total,
  });

  final List<DeliverableStatusBadge> badges;
  final int overflow;
  final int totalOpen;
  final int total;
}

/// Open deliverables as short status chips (e.g. "Album design pending").
OpenDeliverableBadges openDeliverableBadges(List<Task> tasks, {int max = 4}) {
  final order = {for (var i = 0; i < sheetTaskTypeOrder.length; i++) sheetTaskTypeOrder[i]: i};
  final open = tasks.where((t) => t.status != TaskStatusFilter.completed).toList()
    ..sort((a, b) => (order[a.taskType] ?? 99).compareTo(order[b.taskType] ?? 99));

  final badges = open.take(max).map((t) {
    final name = deliverableBadgeLabels[t.taskType] ??
        t.taskType.replaceAll('_', ' ').toLowerCase();
    if (t.status == TaskStatusFilter.inProgress) {
      return DeliverableStatusBadge(key: t.id, label: '$name WIP', tone: DeliverableBadgeTone.wip);
    }
    if (t.status == TaskStatusFilter.delayed) {
      return DeliverableStatusBadge(key: t.id, label: '$name delayed', tone: DeliverableBadgeTone.delayed);
    }
    return DeliverableStatusBadge(key: t.id, label: '$name pending', tone: DeliverableBadgeTone.pending);
  }).toList();
  return OpenDeliverableBadges(
    badges: badges,
    overflow: (open.length - max).clamp(0, 999),
    totalOpen: open.length,
    total: tasks.length,
  );
}
