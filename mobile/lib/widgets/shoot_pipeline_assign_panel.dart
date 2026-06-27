import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/team_member.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';

/// Lane keys aligned with backend `Team` enum.
abstract final class EditorLane {
  static const photo = ('Photo', 'PHOTO_TEAM', Icons.photo_camera_outlined);
  static const cinematic = ('Cinematic', 'CINEMATIC_TEAM', Icons.movie_outlined);
  static const traditional = ('Traditional', 'TRADITIONAL_TEAM', Icons.videocam_outlined);
  static const album = ('Album', 'ALBUM_TEAM', Icons.auto_stories_outlined);
  static const hardDrives = ('Hard drives', 'COORDINATOR_TEAM', Icons.sd_storage_outlined);

  static const all = [photo, cinematic, traditional, album, hardDrives];

  static bool isHardDrivesLane(String teamKey) => teamKey == hardDrives.$2;
}

typedef LaneAssignCallback = void Function(String teamKey, String? memberId, String? memberName);

/// 2×2 lane grid — tap lane → chip picker; updates feel instant (optimistic).
class ShootPipelineAssignPanel extends ConsumerWidget {
  const ShootPipelineAssignPanel({
    super.key,
    required this.tasks,
    required this.onLaneAssigned,
  });

  final List<Task> tasks;
  final LaneAssignCallback onLaneAssigned;

  List<Task> _laneTasks(String teamKey) =>
      tasks.where((t) => t.assignedTeam == teamKey).toList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Keep roster warm so the picker opens without a spinner.
    ref.watch(productionTeamMembersProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Tap a lane to assign or change editors',
          style: TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.35,
          children: EditorLane.all.map((lane) {
            final laneTasks = _laneTasks(lane.$2);
            final isHardDrives = EditorLane.isHardDrivesLane(lane.$2);
            return _LaneCard(
              label: lane.$1,
              icon: lane.$3,
              tasks: laneTasks,
              onTap: () {
                if (isHardDrives) {
                  _openHardDrivesSheet(context, laneTasks);
                } else {
                  _openLanePicker(context, ref, lane.$1, lane.$2, laneTasks);
                }
              },
            );
          }).toList(),
        ),
        Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          clipBehavior: Clip.antiAlias,
          child: Theme(
            data: Theme.of(context).copyWith(
              dividerColor: Colors.transparent,
              splashColor: AppColors.violet.withValues(alpha: 0.08),
              highlightColor: AppColors.violet.withValues(alpha: 0.06),
              listTileTheme: const ListTileThemeData(
                tileColor: Colors.white,
                selectedTileColor: AppColors.violetLight,
                iconColor: AppColors.textPrimary,
              ),
            ),
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              childrenPadding: const EdgeInsets.only(top: 4, bottom: 4),
              backgroundColor: AppColors.card,
              collapsedBackgroundColor: Colors.white,
              shape: const RoundedRectangleBorder(),
              collapsedShape: const RoundedRectangleBorder(),
              title: const Text('All pipeline tasks', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              subtitle: Text(
                '${tasks.where((t) => t.status == 'COMPLETED').length} / ${tasks.length} done',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              children: tasks.map((t) => _CompactStatusRow(task: t)).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _openLanePicker(
    BuildContext context,
    WidgetRef ref,
    String label,
    String teamKey,
    List<Task> laneTasks,
  ) async {
    final List<TeamMember> roster = ref.read(productionTeamMembersProvider).value ??
        await ref.read(productionTeamMembersProvider.future) ??
        const [];
    final filtered = roster
        .where((u) => u.team == teamKey || u.team == null)
        .toList()
      ..sort((a, b) => a.name.compareTo(b.name));

    if (!context.mounted) return;

    final currentId = laneTasks.isNotEmpty ? laneTasks.first.assignedToId : null;

    final picked = await showAppBottomSheet<_EditorPick>(
      context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _LanePickerSheet(
        label: label,
        tasks: laneTasks,
        roster: filtered,
        selectedId: currentId,
      ),
    );

    if (picked == null || !context.mounted) return;
    if (EditorLane.isHardDrivesLane(teamKey)) return;
    onLaneAssigned(teamKey, picked.id, picked.name);
    unawaited(_persistLane(ref, laneTasks, picked.id));
  }

  Future<void> _openHardDrivesSheet(BuildContext context, List<Task> laneTasks) async {
    if (laneTasks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No hard drives task for this event yet.')),
      );
      return;
    }

    final task = laneTasks.first;
    await showAppBottomSheet<void>(
      context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(12, 0, 12, MediaQuery.paddingOf(ctx).bottom + 12),
          child: Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Hard drives', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(
                    task.assigneeName ?? 'Coordinator',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Emmanuel updates status from his dashboard. Pipeline progress refreshes automatically.',
                    style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.35),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: Text(task.pipelineLabel, style: const TextStyle(fontWeight: FontWeight.w600))),
                      TaskStatusChip(status: task.status),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _persistLane(WidgetRef ref, List<Task> laneTasks, String? memberId) async {
    if (laneTasks.isEmpty) return;
    try {
      final repo = ref.read(tasksRepositoryProvider);
      await Future.wait(laneTasks.map((t) => repo.updateAssignee(t.id, memberId)));
      invalidateShootCalendarEntries(ref);
    } catch (_) {
      // Parent already shows optimistic UI; silent refresh on next open fixes drift.
      invalidateShootCalendarEntries(ref);
    }
  }
}

class _EditorPick {
  const _EditorPick({this.id, this.name});
  final String? id;
  final String? name;
}

class _LanePickerSheet extends StatelessWidget {
  const _LanePickerSheet({
    required this.label,
    required this.tasks,
    required this.roster,
    required this.selectedId,
  });

  final String label;
  final List<Task> tasks;
  final List<TeamMember> roster;
  final String? selectedId;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(label, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(
                    tasks.map((t) => t.label).join(' · '),
                    style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _EditorChip(
                        label: 'Unassigned',
                        initials: '—',
                        selected: selectedId == null,
                        onTap: () => Navigator.pop(context, const _EditorPick()),
                      ),
                      ...roster.map(
                        (m) => _EditorChip(
                          label: m.name,
                          initials: _initials(m.name),
                          selected: selectedId == m.id,
                          onTap: () => Navigator.pop(context, _EditorPick(id: m.id, name: m.name)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EditorChip extends StatelessWidget {
  const _EditorChip({
    required this.label,
    required this.initials,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String initials;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.violet : Colors.white,
      elevation: selected ? 2 : 0,
      shadowColor: AppColors.violet.withValues(alpha: 0.25),
      borderRadius: BorderRadius.circular(28),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: selected ? AppColors.violet : AppColors.border, width: selected ? 1.5 : 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: selected ? Colors.white.withValues(alpha: 0.25) : AppColors.violetLight,
                child: Text(
                  initials,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : AppColors.violet,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LaneCard extends StatelessWidget {
  const _LaneCard({
    required this.label,
    required this.icon,
    required this.tasks,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final List<Task> tasks;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final done = tasks.where((t) => t.status == 'COMPLETED').length;
    final assignees = <String>{};
    for (final t in tasks) {
      if (t.assigneeName != null && t.assigneeName!.isNotEmpty) assignees.add(t.assigneeName!);
    }
    final assigneeLabel = assignees.isEmpty
        ? 'Tap to assign'
        : assignees.length == 1
            ? assignees.first
            : '${assignees.length} editors';

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        splashColor: AppColors.violet.withValues(alpha: 0.1),
        highlightColor: AppColors.violet.withValues(alpha: 0.06),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 18, color: AppColors.amber),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  ),
                  Text(
                    tasks.isEmpty ? '—' : '$done/${tasks.length}',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                assigneeLabel,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: assignees.isEmpty ? AppColors.textMuted : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                tasks.isEmpty ? 'No tasks' : tasks.map((t) => t.pipelineLabel).join(' · '),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CompactStatusRow extends StatelessWidget {
  const _CompactStatusRow({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final statusColor = task.status == 'COMPLETED'
        ? AppColors.emerald
        : task.status == 'DELAYED'
            ? AppColors.rose
            : task.status == 'IN_PROGRESS'
                ? AppColors.cyan
                : AppColors.textMuted;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(task.pipelineLabel, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
          if (task.assigneeName != null)
            Text(
              task.assigneeName!,
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(width: 8),
          TaskStatusChip(status: task.status),
        ],
      ),
    );
  }
}
