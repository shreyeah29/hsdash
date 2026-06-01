import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/activity_feed_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_activity_providers.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task_activity.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';
import 'package:intl/intl.dart';

/// `GET /admin/task-activity` — grouped by team member with efficiency signals.
class AdminActivityTab extends ConsumerStatefulWidget {
  const AdminActivityTab({super.key});

  @override
  ConsumerState<AdminActivityTab> createState() => _AdminActivityTabState();
}

class _AdminActivityTabState extends ConsumerState<AdminActivityTab> {
  ActivityDayFilter _filter = ActivityDayFilter.today;
  final _expanded = <String>{};

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(adminActivityFeedProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(adminActivityFeedProvider);
        ref.invalidate(adminTaskActivityProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const DashboardHero(
            badge: 'Team pulse',
            title: 'Activity by person',
            subtitle: 'See who started or finished work today — spot late starts and idle assignees.',
          ),
          const SizedBox(height: 16),
          SegmentedButton<ActivityDayFilter>(
            segments: const [
              ButtonSegment(value: ActivityDayFilter.today, label: Text('Today')),
              ButtonSegment(value: ActivityDayFilter.week, label: Text('7 days')),
              ButtonSegment(value: ActivityDayFilter.all, label: Text('All')),
            ],
            selected: {_filter},
            onSelectionChanged: (s) => setState(() => _filter = s.first),
          ),
          const SizedBox(height: 16),
          feed.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => ErrorPanel(
              message: '$e',
              onRetry: () {
                ref.invalidate(adminActivityFeedProvider);
                ref.invalidate(adminTaskActivityProvider);
              },
            ),
            data: (data) {
              final groups = buildMemberActivityGroups(
                activities: data.activities,
                openTasks: data.openTasks,
                filter: _filter,
              );
              final summary = summarizeFeed(groups, _filter);

              if (groups.isEmpty) {
                return const EmptyPanel(message: 'No team activity in this period.');
              }

              final active = groups.where((g) => g.events.isNotEmpty).toList();
              final quiet = groups.where((g) => g.events.isEmpty && g.staleTaskCount > 0).toList();

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _SummaryStrip(summary: summary),
                  const SizedBox(height: 16),
                  if (active.isNotEmpty) ...[
                    Text(
                      _filter == ActivityDayFilter.today ? 'Active today' : 'With updates',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    ...active.map((g) => _MemberSection(
                          group: g,
                          expanded: _filter == ActivityDayFilter.today || _expanded.contains(g.memberId),
                          onToggle: _filter == ActivityDayFilter.today
                              ? () {}
                              : () => setState(() {
                                    if (_expanded.contains(g.memberId)) {
                                      _expanded.remove(g.memberId);
                                    } else {
                                      _expanded.add(g.memberId);
                                    }
                                  }),
                        )),
                  ],
                  if (quiet.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text(
                      'No motion in this window',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textMuted.withValues(alpha: 0.9)),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Assigned work still pending — follow up on these editors.',
                      style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 8),
                    ...quiet.map((g) => _QuietMemberCard(group: g)),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SummaryStrip extends StatelessWidget {
  const _SummaryStrip({required this.summary});

  final ActivityFeedSummary summary;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        StatChip(label: 'Active', value: '${summary.activeMembers}', accent: AppColors.violet),
        StatChip(label: 'Started', value: '${summary.started}', accent: AppColors.cyan),
        StatChip(label: 'Finished', value: '${summary.completed}', accent: AppColors.emerald),
        if (summary.lateStarts > 0)
          StatChip(label: 'Late starts', value: '${summary.lateStarts}', accent: AppColors.rose),
        if (summary.idleMembers > 0)
          StatChip(label: 'No updates', value: '${summary.idleMembers}', accent: AppColors.amber),
      ],
    );
  }
}

class _MemberSection extends StatelessWidget {
  const _MemberSection({
    required this.group,
    required this.expanded,
    required this.onToggle,
  });

  final MemberActivityGroup group;
  final bool expanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final team = teamLabel(group.teamKey);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          ListTile(
            onTap: onToggle,
            title: Text(group.memberName, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('$team · ${group.openTaskCount} open · ${group.staleTaskCount} not started'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (group.lateStartCount > 0)
                  Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.rose.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('${group.lateStartCount} late', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.rose)),
                  ),
                Icon(expanded ? Icons.expand_less : Icons.expand_more),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Wrap(
              spacing: 6,
              children: [
                _MiniStat(label: 'Started', value: group.startedCount),
                _MiniStat(label: 'Done', value: group.completedCount),
              ],
            ),
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Column(
                children: group.events.isEmpty
                    ? [
                        const Padding(
                          padding: EdgeInsets.all(8),
                          child: Text('No status changes in this period.', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                        ),
                      ]
                    : group.events.map((e) => _ActivityEventTile(activity: e)).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: AppColors.violetLight, borderRadius: BorderRadius.circular(8)),
      child: Text('$value $label', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.violet)),
    );
  }
}

class _QuietMemberCard extends StatelessWidget {
  const _QuietMemberCard({required this.group});

  final MemberActivityGroup group;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: const Color(0xFFFFFBEB),
      child: ListTile(
        leading: const Icon(Icons.hourglass_empty, color: AppColors.amber),
        title: Text(group.memberName, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${teamLabel(group.teamKey)} · ${group.staleTaskCount} tasks still pending / delayed'),
        trailing: Text('${group.openTaskCount} open', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.amber)),
      ),
    );
  }
}

class _ActivityEventTile extends StatelessWidget {
  const _ActivityEventTile({required this.activity});

  final TaskActivity activity;

  @override
  Widget build(BuildContext context) {
    final when = _formatWhen(activity.createdAt);
    final verb = activity.isCompleteEvent
        ? 'Finished'
        : activity.isStartEvent
            ? 'Started'
            : 'Updated';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '$verb · ${activity.clientName ?? 'Wedding'}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
              Text(when, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
          ),
          Text(activity.taskLabel, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          if (activity.isLateStart) ...[
            const SizedBox(height: 6),
            const Text(
              'Late start — began after deadline or from delayed',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.rose),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              if (activity.previousStatus != null) ...[
                TaskStatusChip(status: activity.previousStatus!),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(Icons.arrow_forward, size: 14, color: AppColors.textMuted),
                ),
              ],
              TaskStatusChip(status: activity.newStatus),
            ],
          ),
        ],
      ),
    );
  }

  String _formatWhen(String iso) {
    try {
      return DateFormat('h:mm a').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }
}
