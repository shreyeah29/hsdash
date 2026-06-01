import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';

/// Per-task assign + status (single shoot / compact lists).
class DeliverableTasksPanel extends ConsumerWidget {
  const DeliverableTasksPanel({
    super.key,
    required this.tasks,
    this.allowAssign = false,
    this.onChanged,
  });

  final List<Task> tasks;
  final bool allowAssign;
  final VoidCallback? onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (tasks.isEmpty) {
      return const EmptyStateCard(message: 'No deliverable tasks yet.');
    }
    final sorted = List<Task>.from(tasks)..sort((a, b) => a.deadline.compareTo(b.deadline));
    return Column(
      children: sorted
          .map(
            (t) => _DeliverableTile(
              task: t,
              allowAssign: allowAssign,
              onChanged: onChanged,
            ),
          )
          .toList(),
    );
  }
}

class WeddingDeliverablesList extends ConsumerStatefulWidget {
  const WeddingDeliverablesList({
    super.key,
    required this.tasks,
    this.allowAssign = false,
    this.onChanged,
  });

  final List<Task> tasks;
  final bool allowAssign;
  final VoidCallback? onChanged;

  @override
  ConsumerState<WeddingDeliverablesList> createState() => _WeddingDeliverablesListState();
}

class _WeddingDeliverablesListState extends ConsumerState<WeddingDeliverablesList> {
  String _query = '';
  final _expanded = <String>{};

  @override
  Widget build(BuildContext context) {
    final grouped = groupTasksByWedding(widget.tasks);
    var weddings = grouped.keys.toList()..sort();
    if (_query.isNotEmpty) {
      final q = _query.toLowerCase();
      weddings = weddings.where((w) {
        if (w.toLowerCase().contains(q)) return true;
        return (grouped[w] ?? []).any((t) => (t.assigneeName ?? '').toLowerCase().contains(q));
      }).toList();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          decoration: const InputDecoration(
            hintText: 'Search wedding or editor…',
            prefixIcon: Icon(Icons.search, size: 20),
          ),
          onChanged: (v) => setState(() => _query = v),
        ),
        const SizedBox(height: 12),
        Text('${weddings.length} weddings', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(height: 12),
        if (weddings.isEmpty)
          const EmptyStateCard(message: 'No weddings match your search.')
        else
          ...weddings.map((wedding) {
            final tasks = grouped[wedding]!;
            final done = tasks.where((t) => t.status == 'COMPLETED').length;
            final expanded = _expanded.contains(wedding);
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Column(
                children: [
                  ListTile(
                    title: Text(wedding, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('$done / ${tasks.length} complete'),
                    trailing: Icon(expanded ? Icons.expand_less : Icons.expand_more),
                    onTap: () => setState(() {
                      if (expanded) {
                        _expanded.remove(wedding);
                      } else {
                        _expanded.add(wedding);
                      }
                    }),
                  ),
                  if (expanded)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                      child: Column(
                        children: tasks.map((t) => _DeliverableTile(
                          task: t,
                          allowAssign: widget.allowAssign,
                          onChanged: widget.onChanged,
                        )).toList(),
                      ),
                    ),
                ],
              ),
            );
          }),
      ],
    );
  }
}

class _DeliverableTile extends ConsumerStatefulWidget {
  const _DeliverableTile({required this.task, required this.allowAssign, this.onChanged});

  final Task task;
  final bool allowAssign;
  final VoidCallback? onChanged;

  @override
  ConsumerState<_DeliverableTile> createState() => _DeliverableTileState();
}

class _DeliverableTileState extends ConsumerState<_DeliverableTile> {
  bool _busy = false;

  Future<void> _assign(String? memberId) async {
    setState(() => _busy = true);
    try {
      await ref.read(tasksRepositoryProvider).updateAssignee(widget.task.id, memberId);
      invalidateTaskCaches(ref);
      widget.onChanged?.call();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.task;
    final hint = deadlineHint(t.deadline);
    final members = ref.watch(teamMembersProvider);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(t.label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
              TaskStatusChip(status: t.status),
            ],
          ),
          const SizedBox(height: 4),
          Text('${hint.date} · ${hint.hint}', style: TextStyle(fontSize: 12, color: hint.tone == 'rose' ? AppColors.rose : AppColors.textMuted)),
          const SizedBox(height: 6),
          if (widget.allowAssign && !t.isDataCopy)
            members.when(
              loading: () => const LinearProgressIndicator(minHeight: 2),
              error: (_, __) => Text(t.assigneeName ?? 'Unassigned', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              data: (list) {
                if (_busy) return const SizedBox(height: 24, child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
                return DropdownButtonFormField<String?>(
                  value: t.assignedToId,
                  isExpanded: true,
                  decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Unassigned')),
                    ...list.map((m) => DropdownMenuItem(value: m.id, child: Text('${m.name} · ${teamLabel(m.team)}'))),
                  ],
                  onChanged: _busy ? null : _assign,
                );
              },
            )
          else
            Text(t.assigneeName ?? 'Unassigned', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class EmptyStateCard extends StatelessWidget {
  const EmptyStateCard({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(child: Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted))),
      ),
    );
  }
}

class PriorityTaskCard extends StatelessWidget {
  const PriorityTaskCard({super.key, required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final hint = deadlineHint(task.deadline);
    final borderColor = hint.tone == 'rose'
        ? AppColors.rose
        : hint.tone == 'amber'
            ? AppColors.amber
            : AppColors.cyan;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: borderColor.withValues(alpha: 0.35)),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border(left: BorderSide(color: borderColor, width: 4)),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.clientName ?? 'Wedding', style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(task.label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(hint.hint, style: TextStyle(fontSize: 12, color: borderColor, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            TaskStatusChip(status: task.status),
          ],
        ),
      ),
    );
  }
}
