import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_widgets.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/notification.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:intl/intl.dart';

List<AppNotification> monochromeAlertsForToday(List<AppNotification> all) {
  final todayKey = localDayKey(DateTime.now());
  return all
      .where((n) => calendarDayKeyFromIso(n.createdAt) == todayKey)
      .toList()
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
}

String monochromeTodayHeadline() {
  return DateFormat('d MMMM').format(DateTime.now()).toUpperCase();
}

class MonochromeTodayHeader extends StatelessWidget {
  const MonochromeTodayHeader({super.key, required this.greeting, required this.firstName});

  final String greeting;
  final String firstName;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(greeting.toUpperCase(), style: LaxmanType.label('')),
        const SizedBox(height: 12),
        Text(firstName, style: LaxmanType.display(firstName, size: 48)),
        const SizedBox(height: 6),
        Text(monochromeTodayHeadline(), style: LaxmanType.body('', size: 15).copyWith(letterSpacing: 1.2)),
        const SizedBox(height: 40),
      ],
    );
  }
}

class MonochromeTodayAlertsFocus extends StatelessWidget {
  const MonochromeTodayAlertsFocus({super.key, required this.alerts});

  final List<AppNotification> alerts;

  String _timeLabel(String iso) => DateFormat('h:mm a').format(DateTime.parse(iso).toLocal()).toUpperCase();

  @override
  Widget build(BuildContext context) {
    final unread = alerts.where((a) => !a.read).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TODAY', style: LaxmanType.sectionHead('')),
                  const SizedBox(height: 10),
                  Text('${alerts.length}', style: LaxmanType.display('${alerts.length}', size: 72)),
                ],
              ),
            ),
            if (unread > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text('$unread NEW', style: LaxmanType.label('').copyWith(fontSize: 10)),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          alerts.length == 1 ? 'alert landed today' : 'alerts landed today',
          style: LaxmanType.body('', size: 17),
        ),
        const SizedBox(height: 32),
        for (var i = 0; i < alerts.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          MonochromeTodayAlertTile(
            title: alerts[i].title,
            body: alerts[i].body.isNotEmpty ? alerts[i].body : null,
            time: _timeLabel(alerts[i].createdAt),
            unread: !alerts[i].read,
          ),
        ],
      ],
    );
  }
}

class MonochromeTodayAlertTile extends StatelessWidget {
  const MonochromeTodayAlertTile({
    super.key,
    required this.title,
    this.body,
    required this.time,
    required this.unread,
  });

  final String title;
  final String? body;
  final String time;
  final bool unread;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(width: unread ? 4 : 1, color: LaxmanPalette.black),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 4, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(time, style: LaxmanType.label('').copyWith(fontSize: 10)),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    style: LaxmanType.bodyLarge(title).copyWith(
                      fontSize: 22,
                      fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                  if (body != null) ...[
                    const SizedBox(height: 8),
                    Text(body!, style: LaxmanType.body(body!, size: 15).copyWith(height: 1.45)),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MonochromeTodayNextFocus extends ConsumerStatefulWidget {
  const MonochromeTodayNextFocus({
    super.key,
    required this.task,
    this.sectionLabel = 'NEXT CUT',
    this.quietLine = 'Nothing new today — here is what is next.',
    this.showActions = true,
  });

  final Task task;
  final String sectionLabel;
  final String quietLine;
  final bool showActions;

  @override
  ConsumerState<MonochromeTodayNextFocus> createState() => _MonochromeTodayNextFocusState();
}

class _MonochromeTodayNextFocusState extends ConsumerState<MonochromeTodayNextFocus> {
  bool _busy = false;

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(tasksRepositoryProvider).updateStatus(widget.task.id, status);
      invalidateTaskCaches(ref);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$e', style: const TextStyle(color: LaxmanPalette.white)),
            backgroundColor: LaxmanPalette.black,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.task;
    final hint = deadlineHint(t.deadline);
    final action = laxmanTaskAction(
      showActions: widget.showActions,
      busy: _busy,
      status: t.status,
      onStart: () => _update(TaskStatusUpdate.inProgress),
      onComplete: () => _update(TaskStatusUpdate.completed),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('QUIET INBOX', style: LaxmanType.sectionHead('')),
        const SizedBox(height: 8),
        Text(widget.quietLine, style: LaxmanType.body('', size: 17)),
        const LaxmanHairline(margin: EdgeInsets.symmetric(vertical: 32)),
        Text(widget.sectionLabel, style: LaxmanType.sectionHead('')),
        const SizedBox(height: 20),
        Text(t.clientName ?? 'Wedding', style: LaxmanType.display(t.clientName ?? 'Wedding', size: 40)),
        const SizedBox(height: 10),
        Text(t.label, style: LaxmanType.body(t.label, size: 18)),
        const SizedBox(height: 32),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formatFriendlyDay(t.deadline, includeYear: true).toUpperCase(),
                    style: LaxmanType.label('').copyWith(fontSize: 10),
                  ),
                  const SizedBox(height: 6),
                  Text(hint.hint.toUpperCase(), style: LaxmanType.metricValue(hint.hint, size: 36)),
                ],
              ),
            ),
            Text(t.status.replaceAll('_', ' '), style: LaxmanType.label('').copyWith(fontSize: 10)),
          ],
        ),
        if (action != null) ...[
          const SizedBox(height: 32),
          Align(alignment: Alignment.centerLeft, child: action),
        ],
      ],
    );
  }
}

class MonochromeTodayEmptyState extends StatelessWidget {
  const MonochromeTodayEmptyState({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('TODAY', style: LaxmanType.sectionHead('')),
        const SizedBox(height: 24),
        Text('Clear', style: LaxmanType.display('Clear', size: 56)),
        const SizedBox(height: 16),
        Text(message, style: LaxmanType.body(message, size: 18)),
      ],
    );
  }
}
