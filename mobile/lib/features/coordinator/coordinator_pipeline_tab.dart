import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_event_detail_screen.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';

/// Active pipelines — view assigned editors and progress; open shoot to edit assignments.
class CoordinatorPipelineTab extends ConsumerWidget {
  const CoordinatorPipelineTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries = ref.watch(productionCalendarEntriesProvider);

    return RefreshIndicator(
      onRefresh: () async {
        invalidateShootCalendarEntries(ref);
        ref.invalidate(productionTeamMembersProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const DashboardHero(
            badge: 'Active pipelines',
            title: 'Assigned crews & progress',
            subtitle: 'Open a wedding to see each deliverable, change editors, and track status.',
            accent: AppColors.amber,
            background: Color(0xFFFFFBEB),
          ),
          const SizedBox(height: 20),
          entries.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => invalidateShootCalendarEntries(ref)),
            data: (list) {
              final active = list.where((e) => e.hasPostProduction).toList()
                ..sort((a, b) => shootDayKey(a.day).compareTo(shootDayKey(b.day)));

              if (active.isEmpty) {
                return const EmptyPanel(
                  message: 'No active pipelines yet.\nOpen a shoot on the calendar and tap “Activate post-production & assign crew”.',
                );
              }

              return Column(
                children: active.map((e) => _PipelineCard(
                  entry: e,
                  onTap: () => _openDetail(context, ref, e),
                )).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _openDetail(BuildContext context, WidgetRef ref, ShootCalendarEntry entry) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ShootEventDetailScreen(
          entryId: entry.id,
          initialEntry: entry,
          canEdit: false,
          canActivate: false,
          canManageAssignments: true,
          onMutated: () => invalidateShootCalendarEntries(ref),
        ),
      ),
    );
  }
}

class _PipelineCard extends StatelessWidget {
  const _PipelineCard({required this.entry, required this.onTap});

  final ShootCalendarEntry entry;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tasks = entry.tasks.where((t) => !t.isDataCopy).toList();
    final done = tasks.where((t) => t.status == 'COMPLETED').length;
    final progress = tasks.isEmpty ? 0.0 : done / tasks.length;
    final assigned = tasks.where((t) => t.assignedToId != null).length;
    final dayLabel = formatFriendlyDay(shootDayKey(entry.day), includeYear: true);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(entry.clientName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                  const Icon(Icons.chevron_right, color: AppColors.textMuted),
                ],
              ),
              const SizedBox(height: 4),
              Text(dayLabel, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(height: 10),
              Text('$done / ${tasks.length} complete · $assigned assigned', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: AppColors.border,
                  color: AppColors.emerald,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
