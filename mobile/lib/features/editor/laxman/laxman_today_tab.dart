import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/monochrome_today_shared.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/user.dart';

class LaxmanTodayTab extends ConsumerWidget {
  const LaxmanTodayTab({super.key, required this.user});

  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(tasksProvider);
    final notes = ref.watch(notificationsProvider);
    final hour = DateTime.now().hour;
    final firstName = user.name.split(' ').first.toUpperCase();

    return RefreshIndicator(
      color: LaxmanPalette.black,
      backgroundColor: LaxmanPalette.white,
      onRefresh: () async {
        invalidateTaskCaches(ref);
        ref.invalidate(notificationsProvider);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(28, 8, 28, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MonochromeTodayHeader(greeting: greetingForHour(hour), firstName: firstName),
                  tasks.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 64),
                      child: Center(child: CircularProgressIndicator(color: LaxmanPalette.black)),
                    ),
                    error: (e, _) => Text('Could not load — $e', style: LaxmanType.body('$e')),
                    data: (taskList) => notes.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 48),
                        child: Center(child: CircularProgressIndicator(color: LaxmanPalette.black)),
                      ),
                      error: (_, __) => const MonochromeTodayEmptyState(message: 'Signals unavailable right now.'),
                      data: (notifications) {
                        final todayAlerts = monochromeAlertsForToday(notifications);
                        if (todayAlerts.isNotEmpty) {
                          return MonochromeTodayAlertsFocus(alerts: todayAlerts);
                        }
                        final open = taskList.where((t) => t.status != 'COMPLETED').toList();
                        if (open.isEmpty) {
                          return const MonochromeTodayEmptyState(
                            message: 'Nothing on your plate today — enjoy the calm.',
                          );
                        }
                        return MonochromeTodayNextFocus(task: sortTasksByDeadline(open).first);
                      },
                    ),
                  ),
                  const SizedBox(height: 56),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
