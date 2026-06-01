import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/shoot_time_utils.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_form_screen.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/widgets/activate_post_production_sheet.dart';
import 'package:hsdash_mobile/widgets/shoot_pipeline_assign_panel.dart';
import 'package:hsdash_mobile/widgets/wedding_deliverables.dart';

/// Full shoot details — agenda tap-through; activate & assign crew in one place.
class ShootEventDetailScreen extends ConsumerStatefulWidget {
  const ShootEventDetailScreen({
    super.key,
    required this.entryId,
    required this.initialEntry,
    required this.canEdit,
    required this.canActivate,
    this.canManageAssignments = false,
    required this.onMutated,
  });

  final String entryId;
  final ShootCalendarEntry initialEntry;
  final bool canEdit;
  final bool canActivate;
  final bool canManageAssignments;
  final VoidCallback onMutated;

  @override
  ConsumerState<ShootEventDetailScreen> createState() => _ShootEventDetailScreenState();
}

class _ShootEventDetailScreenState extends ConsumerState<ShootEventDetailScreen> {
  late ShootCalendarEntry _entry;

  @override
  void initState() {
    super.initState();
    _entry = widget.initialEntry;
  }

  ShootCalendarEntry _resolveEntry(List<ShootCalendarEntry>? list) {
    if (list != null) {
      for (final e in list) {
        if (e.id == widget.entryId) return e;
      }
    }
    return _entry;
  }

  void _syncFromList(List<ShootCalendarEntry> list) {
    final next = _resolveEntry(list);
    if (next.id != _entry.id) return;
    if (next.hasPostProduction != _entry.hasPostProduction || next.tasks.length != _entry.tasks.length) {
      setState(() => _entry = next);
      return;
    }
    for (final t in next.tasks) {
      final old = _entry.tasks.where((o) => o.id == t.id).firstOrNull;
      if (old == null || old.status != t.status || old.assignedToId != t.assignedToId) {
        setState(() => _entry = next);
        return;
      }
    }
  }

  List<Task> get _deliverables => _entry.tasks.where((t) => !t.isDataCopy).toList();

  void _afterChange() {
    invalidateShootCalendarEntries(ref);
    widget.onMutated();
  }

  void _onLaneAssigned(String teamKey, String? memberId, String? memberName) {
    setState(() {
      _entry = ShootCalendarEntry(
        id: _entry.id,
        day: _entry.day,
        clientName: _entry.clientName,
        eventId: _entry.eventId,
        clientType: _entry.clientType,
        clientContact: _entry.clientContact,
        city: _entry.city,
        eventName: _entry.eventName,
        venue: _entry.venue,
        startTime: _entry.startTime,
        endTime: _entry.endTime,
        photoTeam: _entry.photoTeam,
        videoTeam: _entry.videoTeam,
        addons: _entry.addons,
        tasks: _entry.tasks.map((t) {
          if (t.assignedTeam != teamKey) return t;
          return t.copyWith(
            assignedToId: memberId,
            assigneeName: memberName,
            clearAssignee: memberId == null,
          );
        }).toList(),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(productionCalendarEntriesProvider, (prev, next) {
      next.whenData(_syncFromList);
    });

    final e = _entry;
    final dayLabel = formatFriendlyDay(shootDayKey(e.day), includeYear: true);
    final times = splitShootTimes(e.startTime, e.endTime);
    final deliverables = _deliverables;
    final done = deliverables.where((t) => t.status == 'COMPLETED').length;
    final progress = deliverables.isEmpty ? 0.0 : done / deliverables.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FC),
      appBar: AppBar(
        title: Text(e.clientName),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _headerCard(e, dayLabel, times),
          const SizedBox(height: 16),
          _detailSection('Client & event', [
            _row('Client name', e.clientName),
            if (_has(e.clientType)) _row('Type of client', e.clientType!),
            if (_has(e.eventName)) _row('Event name', e.eventName!),
            if (_has(e.clientContact)) _row('Client contact', e.clientContact!),
            if (_has(e.city)) _row('City', e.city!),
            if (_has(e.venue)) _row('Venue', e.venue!),
          ]),
          _detailSection('On-site crew', [
            _block('Photo team (on-site)', e.photoTeam),
            _block('Video team (on-site)', e.videoTeam),
            if (_has(e.addons)) _block('Notes / add-ons', e.addons),
          ]),
          if (e.hasPostProduction) ...[
            _pipelineProgress(deliverables, done, progress),
            const SizedBox(height: 8),
            if (widget.canManageAssignments)
              _detailSection('Crew by lane', [
                ShootPipelineAssignPanel(tasks: deliverables, onLaneAssigned: _onLaneAssigned),
              ])
            else
              _detailSection('Deliverables', [
                DeliverableTasksPanel(tasks: deliverables, allowAssign: false),
              ]),
          ],
          const SizedBox(height: 24),
          if (widget.canActivate && !e.hasPostProduction)
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColors.amber, padding: const EdgeInsets.symmetric(vertical: 14)),
              onPressed: () => _activateAndAssign(context),
              child: const Text('Activate post-production & assign crew'),
            ),
          if (widget.canEdit) ...[
            if (widget.canActivate && !e.hasPostProduction) const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => _edit(context),
              child: const Text('Edit shoot details'),
            ),
            TextButton(
              style: TextButton.styleFrom(foregroundColor: AppColors.rose),
              onPressed: () => _delete(context),
              child: const Text('Delete shoot'),
            ),
          ],
        ],
      ),
    );
  }

  bool _has(String? v) => v != null && v.trim().isNotEmpty;

  Widget _pipelineProgress(List<Task> tasks, int done, double progress) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text('Pipeline progress', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const Spacer(),
              Text('$done / ${tasks.length} complete', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: AppColors.border,
              color: AppColors.emerald,
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerCard(ShootCalendarEntry e, String dayLabel, (String, String) times) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(dayLabel, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
          const SizedBox(height: 6),
          Text(e.clientName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          if (_has(e.eventName)) Text(e.eventName!, style: const TextStyle(fontSize: 15, color: AppColors.textMuted)),
          const SizedBox(height: 12),
          Row(
            children: [
              _pill(
                e.hasPostProduction ? 'Post-production active' : 'Pipeline pending',
                e.hasPostProduction ? AppColors.emerald : AppColors.amber,
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(times.$1, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  if (times.$2.isNotEmpty) Text(times.$2, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _detailSection(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textMuted))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _block(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
          const SizedBox(height: 4),
          Text(value?.trim().isNotEmpty == true ? value! : '—', style: const TextStyle(fontSize: 14, height: 1.4)),
        ],
      ),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
    );
  }

  Future<void> _activateAndAssign(BuildContext context) async {
    final updated = await showActivatePostProductionSheet(
      context,
      entryId: _entry.id,
      clientName: _entry.clientName,
    );
    if (updated != null) {
      setState(() => _entry = updated);
      _afterChange();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pipeline active — assign or adjust editors below')),
        );
      }
    }
  }

  Future<void> _edit(BuildContext context) async {
    final repo = ref.read(productionCalendarRepositoryProvider);
    final dayKey = shootDayKey(_entry.day);
    final savedDay = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => ShootFormScreen(
          isEdit: true,
          showDeliverableToggle: false,
          initial: ShootFormData.fromEntry(_entry, dayKey: dayKey),
          onSave: (data) => repo.updateEntry(_entry.id, data),
        ),
      ),
    );
    if (savedDay != null) {
      _afterChange();
      if (context.mounted) Navigator.of(context).pop();
    }
  }

  Future<void> _delete(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete shoot?'),
        content: Text('Remove ${_entry.clientName} and linked deliverables?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ref.read(productionCalendarRepositoryProvider).deleteEntry(_entry.id);
      _afterChange();
      if (context.mounted) Navigator.of(context).pop();
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }
}
