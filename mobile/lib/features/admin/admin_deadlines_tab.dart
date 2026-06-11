import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task.dart';

enum _RunwayView { week, month }

const _weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const _delayed = Color(0xFFF87171);

Color _deadlineBorder() => AdminHomePalette.textSecondary.withValues(alpha: 0.18);

class AdminDeadlinesTab extends ConsumerWidget {
  const AdminDeadlinesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overview = ref.watch(adminOverviewProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ColoredBox(
        color: AdminHomePalette.background,
        child: RefreshIndicator(
          color: AdminHomePalette.accent,
          backgroundColor: AdminHomePalette.card,
          onRefresh: () async => ref.invalidate(adminOverviewProvider),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 12, 22, 28),
                  child: overview.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 80),
                      child: Center(
                        child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2),
                      ),
                    ),
                    error: (e, _) => _DeadlinesError(
                      message: '$e',
                      onRetry: () => ref.invalidate(adminOverviewProvider),
                    ),
                    data: (data) => _DeliverableRunwayCalendar(tasks: data.tasks),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeadlinesError extends StatelessWidget {
  const _DeadlinesError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AdminHomePalette.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _deadlineBorder()),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Could not load deadlines', style: AdminHomeTypography.inter(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          Text(message, style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.textSecondary)),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(foregroundColor: AdminHomePalette.accent),
            child: const Text('Retry', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _DeliverableRunwayCalendar extends StatefulWidget {
  const _DeliverableRunwayCalendar({required this.tasks});

  final List<Task> tasks;

  @override
  State<_DeliverableRunwayCalendar> createState() => _DeliverableRunwayCalendarState();
}

class _DeliverableRunwayCalendarState extends State<_DeliverableRunwayCalendar> {
  _RunwayView _view = _RunwayView.month;
  late DateTime _monthCursor;
  late DateTime _weekStart;
  late String? _selectedKey;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _monthCursor = DateTime(now.year, now.month);
    _weekStart = startOfWeek(now);
    _selectedKey = localDayKey(now);
  }

  Map<String, List<Task>> get _duesByDay {
    return groupOpenTasksByDeadlineDay(
      widget.tasks,
      (t) => t.deadline,
      (t) => t.status,
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedDues = _selectedKey != null ? (_duesByDay[_selectedKey!] ?? []) : <Task>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'DEADLINES',
          style: AdminHomeTypography.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 2.2,
            color: AdminHomePalette.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Deliverable runway',
          style: AdminHomeTypography.inter(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            height: 1.12,
            color: AdminHomePalette.text,
          ),
        ),
        const SizedBox(height: 24),
        _ViewToggle(
          view: _view,
          onChanged: (v) => setState(() => _view = v),
        ),
        const SizedBox(height: 20),
        if (_view == _RunwayView.month) _buildMonthView() else _buildWeekView(),
        const SizedBox(height: 28),
        _SelectedDayPanel(selectedKey: _selectedKey, tasks: selectedDues),
      ],
    );
  }

  Widget _buildMonthView() {
    final monthLabel = '${_monthName(_monthCursor.month)} ${_monthCursor.year}';
    final firstDow = DateTime(_monthCursor.year, _monthCursor.month, 1).weekday % 7;
    final daysInMonth = DateTime(_monthCursor.year, _monthCursor.month + 1, 0).day;
    final todayKey = localDayKey(DateTime.now());
    final gridWidth = MediaQuery.sizeOf(context).width - 44;
    final cellWidth = gridWidth / 7;
    final cellHeight = cellWidth * 1.05;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _NavHeader(
          title: monthLabel,
          onPrev: () => setState(() => _monthCursor = DateTime(_monthCursor.year, _monthCursor.month - 1)),
          onNext: () => setState(() => _monthCursor = DateTime(_monthCursor.year, _monthCursor.month + 1)),
          onToday: () {
            final now = DateTime.now();
            setState(() {
              _monthCursor = DateTime(now.year, now.month);
              _selectedKey = localDayKey(now);
            });
          },
        ),
        const SizedBox(height: 16),
        Row(
          children: _weekdayLetters
              .map(
                (w) => Expanded(
                  child: Center(
                    child: Text(
                      w,
                      style: AdminHomeTypography.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AdminHomePalette.textSecondary,
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            mainAxisExtent: cellHeight,
          ),
          itemCount: firstDow + daysInMonth,
          itemBuilder: (context, i) {
            if (i < firstDow) return const SizedBox.shrink();
            final day = i - firstDow + 1;
            final key = '${_monthCursor.year}-${pad2(_monthCursor.month)}-${pad2(day)}';
            final dueList = _duesByDay[key] ?? [];
            final isSel = key == _selectedKey;
            final isToday = key == todayKey;
            final delayed = dueList.any(runwayStatusIsDelayed);

            return Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => setState(() => _selectedKey = key),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: isSel
                        ? AdminHomePalette.accent.withValues(alpha: 0.22)
                        : (isToday ? AdminHomePalette.surface : AdminHomePalette.card),
                    border: Border.all(
                      color: isToday
                          ? AdminHomePalette.accent.withValues(alpha: 0.65)
                          : (isSel ? AdminHomePalette.accent.withValues(alpha: 0.4) : _deadlineBorder()),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$day',
                        style: AdminHomeTypography.inter(
                          fontSize: 16,
                          fontWeight: isSel || isToday ? FontWeight.w700 : FontWeight.w600,
                          color: AdminHomePalette.text,
                        ),
                      ),
                      if (dueList.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: delayed ? _delayed.withValues(alpha: 0.18) : AdminHomePalette.accent.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${dueList.length}',
                            style: AdminHomeTypography.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: delayed ? _delayed : AdminHomePalette.accent,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildWeekView() {
    final days = weekDaysFrom(_weekStart);
    final end = days.last;
    final title = 'Week of ${days.first.day} – ${end.day} ${_monthName(end.month)} ${end.year}';
    final todayKey = localDayKey(DateTime.now());

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _NavHeader(
          title: title,
          onPrev: () => setState(() {
            _weekStart = _weekStart.subtract(const Duration(days: 7));
            _selectedKey = localDayKey(_weekStart);
          }),
          onNext: () => setState(() {
            _weekStart = _weekStart.add(const Duration(days: 7));
            _selectedKey = localDayKey(_weekStart);
          }),
          onToday: () {
            final now = DateTime.now();
            setState(() {
              _weekStart = startOfWeek(now);
              _selectedKey = localDayKey(now);
            });
          },
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 100,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: days.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final day = days[i];
              final key = localDayKey(day);
              final dueList = _duesByDay[key] ?? [];
              final isSel = key == _selectedKey;
              final isToday = key == todayKey;
              final delayed = dueList.any(runwayStatusIsDelayed);

              return GestureDetector(
                onTap: () => setState(() => _selectedKey = key),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  width: 72,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSel ? AdminHomePalette.accent.withValues(alpha: 0.18) : AdminHomePalette.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isToday
                          ? AdminHomePalette.accent
                          : (isSel ? AdminHomePalette.accent.withValues(alpha: 0.5) : _deadlineBorder()),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _weekdayLetters[day.weekday % 7],
                        style: AdminHomeTypography.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AdminHomePalette.textSecondary,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${day.day}',
                        style: AdminHomeTypography.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AdminHomePalette.text,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        height: 14,
                        child: Center(
                          child: dueList.isEmpty
                              ? Container(
                                  width: 5,
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: AdminHomePalette.textSecondary.withValues(alpha: 0.35),
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: delayed
                                        ? _delayed.withValues(alpha: 0.18)
                                        : AdminHomePalette.accent.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    '${dueList.length}',
                                    style: AdminHomeTypography.inter(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      height: 1,
                                      color: delayed ? _delayed : AdminHomePalette.accent,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        ...days.map((day) {
          final key = localDayKey(day);
          final dueList = _duesByDay[key] ?? [];
          if (dueList.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              decoration: BoxDecoration(
                color: AdminHomePalette.card,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _deadlineBorder()),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                    child: Text(
                      formatFriendlyDay(key, includeYear: true).toUpperCase(),
                      style: AdminHomeTypography.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.4,
                        color: AdminHomePalette.accent,
                      ),
                    ),
                  ),
                  ...dueList.map((t) => _DeadlineTaskRow(task: t, compact: true)),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  String _monthName(int m) => const [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ][m - 1];
}

class _ViewToggle extends StatelessWidget {
  const _ViewToggle({required this.view, required this.onChanged});

  final _RunwayView view;
  final ValueChanged<_RunwayView> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AdminHomePalette.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _deadlineBorder()),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ToggleChip(
              label: 'Week',
              selected: view == _RunwayView.week,
              onTap: () => onChanged(_RunwayView.week),
            ),
          ),
          Expanded(
            child: _ToggleChip(
              label: 'Month',
              selected: view == _RunwayView.month,
              onTap: () => onChanged(_RunwayView.month),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  const _ToggleChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AdminHomePalette.accent.withValues(alpha: 0.2) : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Center(
            child: Text(
              label,
              style: AdminHomeTypography.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: selected ? AdminHomePalette.accent : AdminHomePalette.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavHeader extends StatelessWidget {
  const _NavHeader({
    required this.title,
    required this.onPrev,
    required this.onNext,
    required this.onToday,
  });

  final String title;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onToday;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _NavIconButton(icon: Icons.chevron_left_rounded, onPressed: onPrev),
        Expanded(
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: AdminHomeTypography.inter(fontSize: 17, fontWeight: FontWeight.w600, color: AdminHomePalette.text),
          ),
        ),
        _NavIconButton(icon: Icons.chevron_right_rounded, onPressed: onNext),
        TextButton(
          onPressed: onToday,
          style: TextButton.styleFrom(foregroundColor: AdminHomePalette.accent),
          child: Text('Today', style: AdminHomeTypography.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

class _NavIconButton extends StatelessWidget {
  const _NavIconButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onPressed,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, color: AdminHomePalette.text, size: 24),
      ),
    );
  }
}

class _SelectedDayPanel extends StatelessWidget {
  const _SelectedDayPanel({required this.selectedKey, required this.tasks});

  final String? selectedKey;
  final List<Task> tasks;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AdminHomePalette.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _deadlineBorder()),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            selectedKey != null ? formatFriendlyDay(selectedKey!, includeYear: true).toUpperCase() : 'SELECT A DAY',
            style: AdminHomeTypography.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.4,
              color: AdminHomePalette.accent,
            ),
          ),
          const SizedBox(height: 14),
          if (tasks.isEmpty)
            Text(
              'Nothing due on this date — you\'re clear.',
              style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.textSecondary, height: 1.45),
            )
          else
            ...tasks.map((t) => _DeadlineTaskRow(task: t)),
        ],
      ),
    );
  }
}

class _DeadlineTaskRow extends StatelessWidget {
  const _DeadlineTaskRow({required this.task, this.compact = false});

  final Task task;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: compact ? 0 : 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: _deadlineBorder().withValues(alpha: 0.8)),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 14, top: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 3,
                height: 44,
                margin: const EdgeInsets.only(right: 12, top: 2),
                decoration: BoxDecoration(
                  color: runwayStatusIsDelayed(task) ? _delayed : AdminHomePalette.accent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.clientName ?? 'Wedding',
                      style: AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AdminHomePalette.text),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      task.label,
                      style: AdminHomeTypography.inter(fontSize: 13, color: AdminHomePalette.textSecondary),
                    ),
                    if (task.assigneeName != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        task.assigneeName!,
                        style: AdminHomeTypography.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.6,
                          color: AdminHomePalette.textSecondary,
                        ),
                      ),
                    ],
                    if (runwayStatusIsDelayed(task)) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Originally due ${formatFriendlyDay(task.deadline, includeYear: true)}',
                        style: AdminHomeTypography.inter(fontSize: 11, color: _delayed, height: 1.3),
                      ),
                    ],
                  ],
                ),
              ),
              _DeadlineStatusPill(task: task),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeadlineStatusPill extends StatelessWidget {
  const _DeadlineStatusPill({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final label = runwayStatusLabel(task);
    final delayed = runwayStatusIsDelayed(task);
    final done = task.status == 'COMPLETED';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: delayed
            ? _delayed.withValues(alpha: 0.18)
            : AdminHomePalette.accent.withValues(alpha: done ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(20),
        border: delayed ? Border.all(color: _delayed.withValues(alpha: 0.45)) : null,
      ),
      child: Text(
        label,
        style: AdminHomeTypography.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: delayed ? const Color(0xFFFECACA) : AdminHomePalette.text.withValues(alpha: done ? 1 : 0.85),
        ),
      ),
    );
  }
}
