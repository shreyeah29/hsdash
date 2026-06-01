import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/admin/admin_activity_tab.dart';
import 'package:hsdash_mobile/features/coordinator/coordinator_data_copy_tab.dart';
import 'package:hsdash_mobile/features/coordinator/coordinator_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/shoot_calendar_panel.dart';
import 'package:hsdash_mobile/widgets/wedding_deliverables.dart';

class CoordinatorShell extends ConsumerStatefulWidget {
  const CoordinatorShell({super.key, required this.user});

  final User user;

  @override
  ConsumerState<CoordinatorShell> createState() => _CoordinatorShellState();
}

class _CoordinatorShellState extends ConsumerState<CoordinatorShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return DashboardShell(
      user: widget.user,
      tabIndex: _tab,
      onTabChanged: (i) => setState(() => _tab = i),
      accent: AppColors.amber,
      onLogout: () => ref.read(authControllerProvider.notifier).logout(),
      titles: const ['Home', 'Shoots', 'Activity', 'Data copy'],
      destinations: const [
        NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Home'),
        NavigationDestination(icon: Icon(Icons.videocam_outlined), selectedIcon: Icon(Icons.videocam), label: 'Shoots'),
        NavigationDestination(icon: Icon(Icons.timeline_outlined), selectedIcon: Icon(Icons.timeline), label: 'Activity'),
        NavigationDestination(icon: Icon(Icons.sd_storage_outlined), selectedIcon: Icon(Icons.sd_storage), label: 'Data copy'),
      ],
      children: const [
        _HomeTab(),
        ShootCalendarPanel(mode: ShootCalendarMode.coordinator),
        AdminActivityTab(),
        CoordinatorDataCopyTab(),
      ],
    );
  }
}

class _HomeTab extends ConsumerWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliverables = ref.watch(coordinatorDeliverableTasksProvider);
    final dataCopy = ref.watch(coordinatorDataCopyTasksProvider);
    final entries = ref.watch(productionCalendarEntriesProvider);
    final todayKey = localDayKey(DateTime.now());

    return RefreshIndicator(
      onRefresh: () async => invalidateProductionCaches(ref),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const DashboardHero(
            badge: 'Coordinator runway',
            title: 'Orchestrate shoots',
            subtitle: 'Activate shoots from the calendar, assign editors there, then track team work on Activity.',
            accent: AppColors.amber,
            background: Color(0xFFFFFBEB),
          ),
          const SizedBox(height: 20),
          deliverables.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: () => invalidateProductionCaches(ref)),
            data: (taskList) {
              return entries.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => ErrorPanel(message: '$e', onRetry: () => invalidateProductionCaches(ref)),
                data: (shoots) {
                  final open = taskList.where((t) => t.status != 'COMPLETED').toList();
                  final delayed = open.where((t) => t.status == 'DELAYED').length;
                  final unassigned = open.where((t) => t.assignedToId == null).length;
                  final pendingPipeline = shoots.where((e) => !e.hasPostProduction).length;
                  final upcoming = shoots.where((e) => e.day.compareTo(todayKey) >= 0).length;

                  final myDataCopy = dataCopy.maybeWhen(data: (d) => d, orElse: () => <Task>[]);
                  final openDataCopy = myDataCopy.where((t) => t.status != 'COMPLETED').toList();
                  final urgentDataCopy = sortTasksByDeadline(openDataCopy).take(6).toList();

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
                          DashboardStatCard(label: 'Pending pipeline', value: '$pendingPipeline', hint: 'Awaiting kickoff', accent: AppColors.amber),
                          DashboardStatCard(label: 'Open deliverables', value: '${open.length}', hint: '$unassigned unassigned', accent: AppColors.orange),
                          DashboardStatCard(label: 'Upcoming shoots', value: '$upcoming', hint: 'This month', accent: AppColors.cyan),
                          DashboardStatCard(label: 'At risk', value: '$delayed', hint: 'Delayed tasks', accent: AppColors.rose),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text('Your data copy', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      const Text(
                        'Due 1 day after each event — update on the Data copy tab.',
                        style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 10),
                      if (urgentDataCopy.isEmpty)
                        const EmptyPanel(message: 'No open data copy tasks right now.')
                      else
                        ...urgentDataCopy.map((t) => PriorityTaskCard(task: t)),
                    ],
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

