import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/widgets/deliverables_calendar.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';

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
    return Scaffold(
      appBar: AppBar(
        title: Text(_tab == 0 ? 'Overview' : 'Calendar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: IndexedStack(
        index: _tab,
        children: [
          _OverviewTab(user: widget.user),
          _CalendarTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Today'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'Calendar'),
        ],
      ),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab({required this.user});
  final User user;

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
          Text('Hey, today is $friendlyToday', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Signed in as ${user.name}', style: const TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 20),
          overview.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())),
            error: (e, _) => _ErrorCard(message: '$e', onRetry: () => ref.invalidate(adminOverviewProvider)),
            data: (data) => _OverviewBody(data: data, todayKey: todayKey),
          ),
        ],
      ),
    );
  }
}

class _OverviewBody extends StatelessWidget {
  const _OverviewBody({required this.data, required this.todayKey});

  final ({OverviewStats stats, List<Task> tasks}) data;
  final String todayKey;

  @override
  Widget build(BuildContext context) {
    final open = data.tasks.where((t) => t.status != 'COMPLETED').toList();
    final duesByDay = groupOpenTasksByDeadlineDay(open, (t) => t.deadline, (t) => t.status);
    final todayTasks = duesByDay[todayKey] ?? [];
    final nextKey = [...duesByDay.keys.where((k) => k.compareTo(todayKey) > 0)]..sort();
    final nextDay = nextKey.isEmpty ? null : nextKey.first;
    final nextTasks = nextDay != null ? (duesByDay[nextDay] ?? []) : <Task>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            StatChip(label: 'Weddings', value: '${data.stats.weddings}'),
            StatChip(label: 'Due today', value: '${data.stats.dueToday}', accent: AppColors.cyan),
            StatChip(label: 'Overdue', value: '${data.stats.overdue}', accent: AppColors.rose),
            StatChip(label: 'Open', value: '${data.stats.open}'),
          ],
        ),
        const SizedBox(height: 20),
        if (todayTasks.isNotEmpty) ...[
          Text('Due today (${todayTasks.length})', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 10),
          ...todayTasks.map((t) => TaskCard(clientName: t.clientName ?? 'Wedding', label: t.label, status: t.status, subtitle: t.assigneeName)),
        ] else ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Nothing due today — you\'re clear for $friendlyToday.', style: const TextStyle(color: AppColors.emerald, fontWeight: FontWeight.w500)),
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
        const SizedBox(height: 12),
        Text('${data.stats.completionRate}% complete', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
      ],
    );
  }

  String get friendlyToday => formatFriendlyDay(todayKey);
}

class _CalendarTab extends ConsumerWidget {
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
            error: (e, _) => _ErrorCard(message: '$e', onRetry: () => ref.invalidate(adminOverviewProvider)),
            data: (data) => DeliverablesCalendar(tasks: data.tasks),
          ),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Could not load data', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: AppColors.rose, fontSize: 13)),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
