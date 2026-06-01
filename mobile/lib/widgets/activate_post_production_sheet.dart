import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/post_production_editors.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/team_member.dart';

/// Assign editor lanes, then activate post-production for a shoot.
Future<ShootCalendarEntry?> showActivatePostProductionSheet(
  BuildContext context, {
  required String entryId,
  required String clientName,
}) {
  return showModalBottomSheet<ShootCalendarEntry>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _ActivatePostProductionSheet(entryId: entryId, clientName: clientName),
  );
}

class _ActivatePostProductionSheet extends ConsumerStatefulWidget {
  const _ActivatePostProductionSheet({required this.entryId, required this.clientName});

  final String entryId;
  final String clientName;

  @override
  ConsumerState<_ActivatePostProductionSheet> createState() => _ActivatePostProductionSheetState();
}

class _ActivatePostProductionSheetState extends ConsumerState<_ActivatePostProductionSheet> {
  final _photo = <String>{};
  final _cinematic = <String>{};
  final _traditional = <String>{};
  final _album = <String>{};
  bool _saving = false;

  static const _lanes = [
    ('Photo editors', 'PHOTO_TEAM', 0),
    ('Cinematic editors', 'CINEMATIC_TEAM', 1),
    ('Traditional editors', 'TRADITIONAL_TEAM', 2),
    ('Album editors', 'ALBUM_TEAM', 3),
  ];

  Set<String> _setForLane(int lane) {
    switch (lane) {
      case 0:
        return _photo;
      case 1:
        return _cinematic;
      case 2:
        return _traditional;
      default:
        return _album;
    }
  }

  bool get _hasPick => _photo.isNotEmpty || _cinematic.isNotEmpty || _traditional.isNotEmpty || _album.isNotEmpty;

  List<TeamMember> _rosterForTeam(List<TeamMember> roster, String teamKey) {
    return roster.where((u) => u.team == teamKey || u.team == null).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  Future<void> _submit() async {
    if (!_hasPick) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pick at least one editor to activate the pipeline')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final entry = await ref.read(productionCalendarRepositoryProvider).startPostProduction(
            widget.entryId,
            editors: PostProductionEditorPick(
              photoEditorIds: _photo.toList(),
              cinematicEditorIds: _cinematic.toList(),
              traditionalEditorIds: _traditional.toList(),
              albumEditorIds: _album.toList(),
            ),
          );
      if (mounted) Navigator.of(context).pop(entry);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final roster = ref.watch(productionTeamMembersProvider);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Activate & assign crew',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              '${widget.clientName} — creates deliverable deadlines and notifies assigned editors.',
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.35),
            ),
            const SizedBox(height: 20),
            roster.when(
              loading: () => const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('$e', style: const TextStyle(color: AppColors.rose)),
              data: (list) => Column(
                children: _lanes.map((lane) {
                  final options = _rosterForTeam(list, lane.$2);
                  final picked = _setForLane(lane.$3);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lane.$1, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        if (options.isEmpty)
                          const Text('No editors in this lane', style: TextStyle(fontSize: 12, color: AppColors.textMuted))
                        else
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.border),
                              borderRadius: BorderRadius.circular(14),
                              color: AppColors.surface,
                            ),
                            child: Column(
                              children: options.map((u) {
                                final checked = picked.contains(u.id);
                                return CheckboxListTile(
                                  value: checked,
                                  dense: true,
                                  title: Text(u.name, style: const TextStyle(fontSize: 14)),
                                  subtitle: u.designation != null ? Text(u.designation!, style: const TextStyle(fontSize: 11)) : null,
                                  onChanged: _saving
                                      ? null
                                      : (v) => setState(() {
                                            if (v == true) {
                                              picked.add(u.id);
                                            } else {
                                              picked.remove(u.id);
                                            }
                                          }),
                                );
                              }).toList(),
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _saving || !_hasPick ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.amber,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _saving
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Activate pipeline', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            ),
            TextButton(onPressed: _saving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
          ],
        ),
      ),
    );
  }
}
