import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_activity_tab.dart';
import 'package:hsdash_mobile/features/admin/team_management_tab.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/admin_overview.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/deliverables_calendar.dart';
import 'package:hsdash_mobile/widgets/shoot_calendar_panel.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';
import 'package:hsdash_mobile/widgets/create_deliverable_tasks_sheet.dart';
import 'package:hsdash_mobile/widgets/wedding_deliverables.dart';

class AdminShell extends ConsumerStatefulWidget {
  const AdminShell({super.key, required this.user});

  final User user;

  @override
  ConsumerState<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends ConsumerState<AdminShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return DashboardShell(
      user: widget.user,
      tabIndex: _tab,
      onTabChanged: (i) => setState(() => _tab = i),
      accent: AppColors.violet,
      onLogout: () => ref.read(authControllerProvider.notifier).logout(),
      titles: const ['Overview', 'Radar', 'Deadlines', 'Shoots', 'Activity', 'Team'],
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Overview'),
        NavigationDestination(icon: Icon(Icons.radar_outlined), selectedIcon: Icon(Icons.radar), label: 'Radar'),
        NavigationDestination(icon: Icon(Icons.event_note_outlined), selectedIcon: Icon(Icons.event_note), label: 'Deadlines'),
        NavigationDestination(icon: Icon(Icons.videocam_outlined), selectedIcon: Icon(Icons.videocam), label: 'Shoots'),
        NavigationDestination(icon: Icon(Icons.timeline_outlined), selectedIcon: Icon(Icons.timeline), label: 'Activity'),
        NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Team'),
      ],
      children: const [
        _OverviewTab(),
        _RadarTab(),
        _DeliverablesCalendarTab(),
        ShootCalendarPanel(mode: ShootCalendarMode.admin),
        AdminActivityTab(),
        TeamManagementTab(),
      ],
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overview = ref.watch(adminOverviewProvider);
    final todayKey = localDayKey(DateTime.now());
    final friendlyToday = formatFriendlyDay(todayKey);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(adminOverviewProvider),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          DashboardHero(
            badge: 'Admin dashboard',
            title: 'Hey, today is $friendlyToday',
            subtitle: 'Deliverables and upcoming shoots from GET /admin/overview.',
          ),
          const SizedBox(height: 20),
          overview.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => ref.invalidate(adminOverviewProvider)),
            data: (data) => _OverviewBody(data: data, todayKey: todayKey),
          ),
        ],
      ),
    );
  }
}

class _OverviewBody extends StatelessWidget {
  const _OverviewBody({required this.data, required this.todayKey});

  final AdminOverview data;
  final String todayKey;

  @override
  Widget build(BuildContext context) {
    final open = data.tasks.where((t) => t.status != 'COMPLETED').toList();
    final duesByDay = groupOpenTasksByDeadlineDay(open, (t) => t.deadline, (t) => t.status);
    final todayTasks = duesByDay[todayKey] ?? [];
    final nextKey = [...duesByDay.keys.where((k) => k.compareTo(todayKey) > 0)]..sort();
    final nextDay = nextKey.isEmpty ? null : nextKey.first;
    final nextTasks = nextDay != null ? (duesByDay[nextDay] ?? []) : <Task>[];
    final upcomingShoots = data.entries.take(6).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.5,
          children: [
            DashboardStatCard(label: 'Weddings', value: '${data.stats.weddings}'),
            DashboardStatCard(label: 'Shoots', value: '${data.stats.shootCount}', hint: '${data.stats.eventCount} events', accent: AppColors.cyan),
            DashboardStatCard(label: 'Due today', value: '${data.stats.dueToday}', accent: AppColors.cyan),
            DashboardStatCard(label: 'Overdue', value: '${data.stats.overdue}', accent: AppColors.rose),
            DashboardStatCard(label: 'Open', value: '${data.stats.open}', hint: '${data.stats.pending} pending'),
            DashboardStatCard(label: 'Completion', value: '${data.stats.completionRate}%', hint: '${data.stats.completed} done', accent: AppColors.emerald),
          ],
        ),
        if (upcomingShoots.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text('Upcoming shoots', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          ...upcomingShoots.map((e) => _ShootCard(entry: e)),
        ],
        const SizedBox(height: 20),
        if (todayTasks.isNotEmpty) ...[
          Text('Due today (${todayTasks.length})', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 10),
          ...todayTasks.map((t) => TaskCard(clientName: t.clientName ?? 'Wedding', label: t.label, status: t.status, subtitle: t.assigneeName)),
        ] else ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Nothing due today — you\'re clear for ${formatFriendlyDay(todayKey)}.', style: const TextStyle(color: AppColors.emerald, fontWeight: FontWeight.w500)),
            ),
          ),
          if (nextDay != null) ...[
            const SizedBox(height: 16),
            Text(
              'Next due: ${formatFriendlyDay(nextDay, includeYear: true)}${daysBetweenKeys(todayKey, nextDay) == 1 ? ' (tomorrow)' : ' (in ${daysBetweenKeys(todayKey, nextDay)} days)'}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            ...nextTasks.map((t) => TaskCard(clientName: t.clientName ?? 'Wedding', label: t.label, status: t.status, subtitle: t.assigneeName)),
          ],
        ],
      ],
    );
  }
}

class _ShootCard extends StatelessWidget {
  const _ShootCard({required this.entry});

  final ShootCalendarEntry entry;

  @override
  Widget build(BuildContext context) {
    final dayLabel = formatFriendlyDay(entry.day, includeYear: true);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(entry.clientName, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          [
            dayLabel,
            if (entry.city != null && entry.city!.isNotEmpty) entry.city,
            if (entry.venue != null && entry.venue!.isNotEmpty) entry.venue,
          ].whereType<String>().join(' · '),
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: entry.hasPostProduction ? AppColors.emerald.withValues(alpha: 0.12) : AppColors.amber.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            entry.hasPostProduction ? 'Active' : 'Pipeline',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: entry.hasPostProduction ? AppColors.emerald : AppColors.amber),
          ),
        ),
      ),
    );
  }
}

class _RadarTab extends ConsumerWidget {
  const _RadarTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(tasksProvider);

    return RefreshIndicator(
      onRefresh: () async => invalidateTaskCaches(ref),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: DashboardHero(
                  badge: 'Deliverables radar',
                  title: 'Team status sheet',
                  subtitle: 'GET /tasks — filter by team or status, then browse weddings.',
                ),
              ),
              IconButton.filled(
                style: IconButton.styleFrom(backgroundColor: AppColors.violet),
                tooltip: 'Create deliverable tasks',
                onPressed: () => showCreateDeliverableTasksSheet(context),
                icon: const Icon(Icons.add_task, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const _RadarFilters(),
          const SizedBox(height: 12),
          tasks.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => invalidateTaskCaches(ref)),
            data: (list) => WeddingDeliverablesList(tasks: list),
          ),
        ],
      ),
    );
  }
}

/// Server-side filters for admin radar (`GET /tasks?team=&status=`).
class _RadarFilters extends ConsumerWidget {
  const _RadarFilters();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(tasksQueryProvider);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          ...TaskTeam.values.map((v) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text(TaskTeam.labels[v]!, style: const TextStyle(fontSize: 12)),
                  selected: query.team == v,
                  onSelected: (sel) => ref.read(tasksQueryProvider.notifier).setTeam(sel ? v : null),
                ),
              )),
          ...TaskStatusFilter.values.map((v) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text(TaskStatusFilter.labels[v]!, style: const TextStyle(fontSize: 12)),
                  selected: query.status == v,
                  onSelected: (sel) => ref.read(tasksQueryProvider.notifier).setStatus(sel ? v : null),
                ),
              )),
          if (!query.isEmpty)
            ActionChip(
              label: const Text('Clear'),
              onPressed: () => ref.read(tasksQueryProvider.notifier).clearAll(),
            ),
        ],
      ),
    );
  }
}

class _DeliverablesCalendarTab extends ConsumerWidget {
  const _DeliverablesCalendarTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overview = ref.watch(adminOverviewProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(adminOverviewProvider),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          overview.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => ref.invalidate(adminOverviewProvider)),
            data: (data) => DeliverablesCalendar(tasks: data.tasks),
          ),
        ],
      ),
    );
  }
}
