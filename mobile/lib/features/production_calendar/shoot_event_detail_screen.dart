import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/shoot_time_utils.dart';
import 'package:hsdash_mobile/core/weddings_archive_index.dart';
import 'package:hsdash_mobile/features/production_calendar/client_related_shoots_provider.dart';
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

  List<Task> get _pipelineTasks => _entry.tasks;

  void _afterChange() {
    invalidateShootCalendarEntries(ref);
    invalidateClientRelatedShoots(ref);
    widget.onMutated();
  }

  void _openRelatedEvent(ShootCalendarEntry entry) {
    if (entry.id == _entry.id) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ShootEventDetailScreen(
          entryId: entry.id,
          initialEntry: entry,
          canEdit: widget.canEdit,
          canActivate: widget.canActivate,
          canManageAssignments:
              entry.hasPostProduction && (widget.canEdit || widget.canActivate),
          onMutated: widget.onMutated,
        ),
      ),
    );
  }

  void _onLaneAssigned(String teamKey, String? memberId, String? memberName) {
    if (teamKey == 'COORDINATOR_TEAM') return;
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
    final pipelineTasks = _pipelineTasks;
    final done = pipelineTasks.where((t) => t.status == 'COMPLETED').length;
    final progress = pipelineTasks.isEmpty ? 0.0 : done / pipelineTasks.length;
    final clientKey = weddingKeyForEntry(e);
    final relatedAsync = ref.watch(clientRelatedShootsProvider(clientKey));

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
          relatedAsync.when(
            data: (related) => _clientEventsSection(related, currentId: e.id),
            loading: () => _clientEventsLoading(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          _detailSection('On-site crew', [
            _block('Photo team (on-site)', e.photoTeam),
            _block('Video team (on-site)', e.videoTeam),
            if (_has(e.addons)) _block('Notes / add-ons', e.addons),
          ]),
          if (e.hasPostProduction) ...[
            _pipelineProgress(pipelineTasks, done, progress),
            const SizedBox(height: 8),
            if (widget.canManageAssignments)
              _detailSection('Crew by lane', [
                ShootPipelineAssignPanel(tasks: pipelineTasks, onLaneAssigned: _onLaneAssigned),
              ])
            else
              _detailSection('Deliverables', [
                DeliverableTasksPanel(tasks: pipelineTasks, allowAssign: false),
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

  Widget _clientEventsLoading() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        height: 72,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }

  Widget _clientEventsSection(List<ShootCalendarEntry> related, {required String currentId}) {
    final others = related.where((r) => r.id != currentId).length;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'All events for this client',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.5),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.violet.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${related.length}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.violet),
                ),
              ),
            ],
          ),
          if (others == 0 && related.length == 1) ...[
            const SizedBox(height: 6),
            const Text(
              'No other shoots scheduled — this is the only event on record.',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.35),
            ),
          ],
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                for (var i = 0; i < related.length; i++) ...[
                  if (i > 0) const Divider(height: 1, indent: 16, endIndent: 16),
                  _clientEventTile(related[i], isCurrent: related[i].id == currentId),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _clientEventTile(ShootCalendarEntry entry, {required bool isCurrent}) {
    final dayLabel = formatFriendlyDay(shootDayKey(entry.day), includeYear: true);
    final eventLabel = _has(entry.eventName) ? entry.eventName! : 'Shoot';
    final subtitle = [
      if (_has(entry.venue)) entry.venue!,
      if (_has(entry.city) && !_has(entry.venue)) entry.city!,
    ].join(' · ');

    final content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color: (isCurrent ? AppColors.violet : AppColors.border).withValues(alpha: isCurrent ? 0.12 : 0.5),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Text(
                  shootDayKey(entry.day).split('-')[2],
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isCurrent ? AppColors.violet : AppColors.textPrimary,
                  ),
                ),
                Text(
                  _monthShort(int.parse(shootDayKey(entry.day).split('-')[1])),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isCurrent ? AppColors.violet : AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        eventLabel,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isCurrent ? AppColors.violet : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (isCurrent)
                      _pill('Current', AppColors.violet)
                    else
                      Icon(Icons.chevron_right, size: 20, color: AppColors.textMuted.withValues(alpha: 0.7)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(dayLabel, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 6),
                _pill(
                  entry.hasPostProduction ? 'Post-production active' : 'Scheduled',
                  entry.hasPostProduction ? AppColors.emerald : AppColors.amber,
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (isCurrent) {
      return Material(
        color: AppColors.violet.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        child: content,
      );
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openRelatedEvent(entry),
        borderRadius: BorderRadius.circular(16),
        child: content,
      ),
    );
  }

  String _monthShort(int month) {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (month < 1 || month > 12) return '';
    return names[month - 1];
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
