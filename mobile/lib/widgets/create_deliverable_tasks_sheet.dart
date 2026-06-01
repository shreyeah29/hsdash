import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/events/events_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/create_event_form.dart';
import 'package:hsdash_mobile/models/team_member.dart';
/// Admin: spawn standard deliverable tasks — `POST /events` or calendar-linked create.
class CreateDeliverableTasksSheet extends ConsumerStatefulWidget {
  const CreateDeliverableTasksSheet({
    super.key,
    this.calendarDay,
  });

  /// When set, also logs a shoot on this day via `POST /production-calendar/entries`.
  final String? calendarDay;

  @override
  ConsumerState<CreateDeliverableTasksSheet> createState() => _CreateDeliverableTasksSheetState();
}

class _CreateDeliverableTasksSheetState extends ConsumerState<CreateDeliverableTasksSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _clientName;
  late String _eventDate;
  EventEditorAssignments _editors = EventEditorAssignments.empty;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _clientName = TextEditingController();
    _eventDate = widget.calendarDay ?? localDayKey(DateTime.now());
  }

  @override
  void dispose() {
    _clientName.dispose();
    super.dispose();
  }

  List<TeamMember> _rosterForTeam(List<TeamMember> roster, String teamKey) {
    return roster.where((u) => u.team == teamKey || u.team == null).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final name = _clientName.text.trim();
    if (name.isEmpty) return;

    setState(() => _saving = true);
    try {
      final day = widget.calendarDay ?? _eventDate;
      var taskCount = 0;
      var clientLabel = name;
      if (widget.calendarDay != null) {
        final entry = await ref.read(productionCalendarRepositoryProvider).createDeliverableOnDay(
              day: day,
              clientName: name,
              editors: _editors,
            );
        taskCount = entry.tasks.length;
        clientLabel = entry.clientName;
      } else {
        final event = await ref.read(eventsRepositoryProvider).createEvent(
              CreateEventFormData(clientName: name, eventDate: day, editors: _editors),
            );
        taskCount = event.tasks.length;
        clientLabel = event.clientName;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Created $taskCount deliverable tasks for $clientLabel')),
        );
      }
      if (mounted) {
        invalidateEventsCaches(ref);
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final parts = _eventDate.split('-').map(int.parse).toList();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(parts[0], parts[1], parts[2]),
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );
    if (picked != null) {
      setState(() => _eventDate = localDayKey(picked));
    }
  }

  @override
  Widget build(BuildContext context) {
    final roster = ref.watch(productionTeamMembersProvider);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Create deliverable tasks',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                widget.calendarDay != null
                    ? 'Spawns deadlines from the shoot day and logs this shoot on ${formatFriendlyDay(widget.calendarDay!, includeYear: true)}.'
                    : 'Spawns the standard deadline set from the event day — no calendar shoot row (POST /events).',
                style: const TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _clientName,
                decoration: const InputDecoration(labelText: 'Client / wedding name', hintText: 'e.g. Rahul & Priya'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Name required' : null,
              ),
              const SizedBox(height: 12),
              if (widget.calendarDay == null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Event date (deadline anchor)'),
                  subtitle: Text(formatFriendlyDay(_eventDate, includeYear: true)),
                  trailing: const Icon(Icons.calendar_today, size: 20),
                  onTap: _pickDate,
                )
              else
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.violetLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    'Shoot day: ${formatFriendlyDay(widget.calendarDay!, includeYear: true)}',
                    style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.violet),
                  ),
                ),
              const SizedBox(height: 16),
              const Text('Assign editors (optional)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
              const SizedBox(height: 8),
              roster.when(
                loading: () => const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())),
                error: (e, _) => Text('$e', style: const TextStyle(color: AppColors.rose, fontSize: 13)),
                data: (list) => Column(
                  children: EventEditorLanes.all.map((lane) {
                    final label = lane.$1;
                    final teamKey = lane.$2;
                    final fieldKey = lane.$3;
                    final options = _rosterForTeam(list, teamKey);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          if (options.isEmpty)
                            const Text('No editors listed yet.', style: TextStyle(fontSize: 12, color: AppColors.textMuted))
                          else
                            ...options.map(
                              (u) => CheckboxListTile(
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                                title: Text(u.name, style: const TextStyle(fontSize: 14)),
                                value: _editors.idForField(fieldKey) == u.id,
                                onChanged: (_) => setState(() => _editors = _editors.toggleField(fieldKey, u.id)),
                              ),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Create tasks'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<bool?> showCreateDeliverableTasksSheet(
  BuildContext context, {
  String? calendarDay,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => CreateDeliverableTasksSheet(calendarDay: calendarDay),
  );
}
