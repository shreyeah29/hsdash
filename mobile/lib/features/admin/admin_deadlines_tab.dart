import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/task_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task.dart';

enum _RunwayView { week, month }

const _weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

Color _deadlineBorder() => AdminHomePalette.cardBorder;

Color _delayedColor() => AdminHomePalette.delayed;

class AdminDeadlinesTab extends ConsumerWidget {
  const AdminDeadlinesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    watchAdminPalette(ref);
    final overview = ref.watch(adminOverviewProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AdminHomePalette.lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
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
                  loading: () => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 80),
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
  final _monthStripScroll = ScrollController();

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _monthCursor = DateTime(now.year, now.month);
    _weekStart = startOfWeek(now);
    _selectedKey = localDayKey(now);
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollMonthStripToSelected());
  }

  @override
  void dispose() {
    _monthStripScroll.dispose();
    super.dispose();
  }

  void _scrollMonthStripToSelected() {
    if (_selectedKey == null || !_monthStripScroll.hasClients) return;
    final parts = _selectedKey!.split('-').map(int.parse).toList();
    final dayIndex = parts[2] - 1;
    const itemWidth = 48.0;
    const gap = 6.0;
    final offset = (dayIndex * (itemWidth + gap)) - (MediaQuery.sizeOf(context).width - 44) / 2 + itemWidth / 2;
    _monthStripScroll.animateTo(
      offset.clamp(0.0, _monthStripScroll.position.maxScrollExtent),
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
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
        Text('DEADLINES', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 10),
        Text('Deliverable runway', style: AdminHomePalette.pageTitle),
        const SizedBox(height: 28),
        _ViewToggle(
          view: _view,
          onChanged: (v) => setState(() => _view = v),
        ),
        const SizedBox(height: 24),
        if (_view == _RunwayView.month) _buildMonthView() else _buildWeekView(),
        const SizedBox(height: 28),
        _SelectedDayAgenda(selectedKey: _selectedKey, tasks: selectedDues),
      ],
    );
  }

  Widget _buildMonthView() {
    final daysInMonth = DateTime(_monthCursor.year, _monthCursor.month + 1, 0).day;
    final days = List.generate(
      daysInMonth,
      (i) => DateTime(_monthCursor.year, _monthCursor.month, i + 1),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _RunwayNavHeader(
          primary: _monthName(_monthCursor.month),
          secondary: '${_monthCursor.year}',
          onPrev: () => setState(() {
            _monthCursor = DateTime(_monthCursor.year, _monthCursor.month - 1);
            _selectedKey = '${_monthCursor.year}-${pad2(_monthCursor.month)}-01';
          }),
          onNext: () => setState(() {
            _monthCursor = DateTime(_monthCursor.year, _monthCursor.month + 1);
            _selectedKey = '${_monthCursor.year}-${pad2(_monthCursor.month)}-01';
          }),
          onToday: () {
            final now = DateTime.now();
            setState(() {
              _monthCursor = DateTime(now.year, now.month);
              _selectedKey = localDayKey(now);
            });
            WidgetsBinding.instance.addPostFrameCallback((_) => _scrollMonthStripToSelected());
          },
        ),
        const SizedBox(height: 20),
        _RunwayDayStrip(
          days: days,
          selectedKey: _selectedKey,
          duesByDay: _duesByDay,
          fitToWidth: false,
          scrollController: _monthStripScroll,
          onSelect: (key) => setState(() => _selectedKey = key),
        ),
      ],
    );
  }

  Widget _buildWeekView() {
    final days = weekDaysFrom(_weekStart);
    final end = days.last;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _RunwayNavHeader(
          primary: '${days.first.day} – ${end.day}',
          secondary: '${_monthName(end.month)} ${end.year}',
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
        const SizedBox(height: 20),
        _RunwayDayStrip(
          days: days,
          selectedKey: _selectedKey,
          duesByDay: _duesByDay,
          fitToWidth: true,
          onSelect: (key) => setState(() => _selectedKey = key),
        ),
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
        color: AdminHomePalette.isStudio ? AdminHomePalette.card : AdminHomePalette.surface,
        borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
        border: Border.all(color: AdminHomePalette.cardBorder),
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
      color: selected
          ? (AdminHomePalette.isStudio
              ? AdminHomePalette.accent.withValues(alpha: 0.2)
              : AdminHomePalette.elevated)
          : Colors.transparent,
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
                color: selected ? AdminHomePalette.accent : AdminHomePalette.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RunwayNavHeader extends StatelessWidget {
  const _RunwayNavHeader({
    required this.primary,
    required this.secondary,
    required this.onPrev,
    required this.onNext,
    required this.onToday,
  });

  final String primary;
  final String secondary;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onToday;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        _NavIconButton(icon: Icons.chevron_left_rounded, onPressed: onPrev),
        Expanded(
          child: Column(
            children: [
              Text(
                primary,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AdminHomePalette.editorialTitle.copyWith(fontSize: 24, letterSpacing: -0.4),
              ),
              const SizedBox(height: 2),
              Text(
                secondary,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AdminHomePalette.editorialMeta.copyWith(
                  fontSize: 13,
                  color: AdminHomePalette.accent,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: onToday,
                style: TextButton.styleFrom(
                  foregroundColor: AdminHomePalette.accent,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text('Today', style: AdminHomeTypography.inter(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
        _NavIconButton(icon: Icons.chevron_right_rounded, onPressed: onNext),
      ],
    );
  }
}

class _RunwayDayStrip extends StatelessWidget {
  const _RunwayDayStrip({
    required this.days,
    required this.selectedKey,
    required this.duesByDay,
    required this.onSelect,
    required this.fitToWidth,
    this.scrollController,
  });

  final List<DateTime> days;
  final String? selectedKey;
  final Map<String, List<Task>> duesByDay;
  final ValueChanged<String> onSelect;
  final bool fitToWidth;
  final ScrollController? scrollController;

  @override
  Widget build(BuildContext context) {
    final todayKey = localDayKey(DateTime.now());
    const scrollCellWidth = 48.0;
    const scrollGap = 6.0;
    const fitGap = 4.0;

    Widget dayCell(DateTime day) {
      return _RunwayDayCell(
        day: day,
        dueList: duesByDay[localDayKey(day)] ?? const [],
        isSelected: localDayKey(day) == selectedKey,
        isToday: localDayKey(day) == todayKey,
        onTap: () => onSelect(localDayKey(day)),
      );
    }

    Widget stripContent(BoxConstraints constraints) {
      if (fitToWidth) {
        final cellWidth = (constraints.maxWidth - fitGap * (days.length - 1)) / days.length;
        return Row(
          children: [
            for (var i = 0; i < days.length; i++) ...[
              if (i > 0) const SizedBox(width: fitGap),
              SizedBox(width: cellWidth, child: dayCell(days[i])),
            ],
          ],
        );
      }

      return ListView(
        controller: scrollController,
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: [
          for (var i = 0; i < days.length; i++) ...[
            if (i > 0) const SizedBox(width: scrollGap),
            SizedBox(width: scrollCellWidth, child: dayCell(days[i])),
          ],
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          height: 1,
          margin: const EdgeInsets.only(bottom: 18),
          color: AdminHomePalette.divider,
        ),
        SizedBox(
          height: 96,
          width: double.infinity,
          child: LayoutBuilder(builder: (_, constraints) => stripContent(constraints)),
        ),
        Container(
          height: 1,
          margin: const EdgeInsets.only(top: 18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.transparent,
                AdminHomePalette.accent.withValues(alpha: 0.35),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _RunwayDayCell extends StatelessWidget {
  const _RunwayDayCell({
    required this.day,
    required this.dueList,
    required this.isSelected,
    required this.isToday,
    required this.onTap,
  });

  final DateTime day;
  final List<Task> dueList;
  final bool isSelected;
  final bool isToday;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final delayed = dueList.any(runwayStatusIsDelayed);
    final loadColor = delayed ? _delayedColor() : AdminHomePalette.accent;
    final dotCount = dueList.length.clamp(0, 4);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _weekdayLetters[day.weekday % 7],
            maxLines: 1,
            overflow: TextOverflow.clip,
            style: AdminHomePalette.statLabel.copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
              color: isSelected ? AdminHomePalette.accent : AdminHomePalette.text,
            ),
          ),
          const SizedBox(height: 8),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            width: isSelected ? 38 : 32,
            height: isSelected ? 38 : 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected ? AdminHomePalette.accent.withValues(alpha: 0.2) : Colors.transparent,
              border: Border.all(
                color: isToday
                    ? AdminHomePalette.accent
                    : (isSelected ? AdminHomePalette.accent.withValues(alpha: 0.55) : Colors.transparent),
                width: isToday ? 1.5 : 1,
              ),
            ),
            child: Text(
              '${day.day}',
              maxLines: 1,
              style: AdminHomeTypography.inter(
                fontSize: isSelected ? 17 : 14,
                fontWeight: isSelected || isToday ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? AdminHomePalette.accent : AdminHomePalette.text,
                height: 1,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 6,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (dotCount == 0)
                    Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AdminHomePalette.textSecondary.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                    )
                  else
                    for (var i = 0; i < dotCount; i++)
                      Container(
                        width: 4,
                        height: 4,
                        margin: EdgeInsets.only(left: i == 0 ? 0 : 3),
                        decoration: BoxDecoration(
                          color: loadColor.withValues(alpha: i == dotCount - 1 && dueList.length > 4 ? 0.45 : 0.85),
                          shape: BoxShape.circle,
                        ),
                      ),
                  if (dueList.length > 4) ...[
                    const SizedBox(width: 2),
                    Text(
                      '+',
                      style: AdminHomeTypography.inter(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        color: loadColor,
                      ),
                    ),
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

class _SelectedDayAgenda extends StatelessWidget {
  const _SelectedDayAgenda({required this.selectedKey, required this.tasks});

  final String? selectedKey;
  final List<Task> tasks;

  @override
  Widget build(BuildContext context) {
    final sorted = List<Task>.from(tasks)
      ..sort((a, b) {
        final ad = runwayStatusIsDelayed(a) ? 0 : 1;
        final bd = runwayStatusIsDelayed(b) ? 0 : 1;
        if (ad != bd) return ad.compareTo(bd);
        return (a.clientName ?? '').compareTo(b.clientName ?? '');
      });

    final dateLabel = selectedKey != null
        ? formatFriendlyDay(selectedKey!, includeYear: true)
        : 'Select a day';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                dateLabel,
                style: AdminHomePalette.editorialTitle.copyWith(fontSize: 22, letterSpacing: -0.3),
              ),
            ),
            if (sorted.isNotEmpty)
              Text(
                '${sorted.length} ${sorted.length == 1 ? 'deliverable' : 'deliverables'}',
                style: AdminHomePalette.editorialMeta.copyWith(
                  fontSize: 12,
                  color: AdminHomePalette.accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        Container(
          height: 1,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AdminHomePalette.accent.withValues(alpha: 0.55),
                AdminHomePalette.divider,
                Colors.transparent,
              ],
            ),
          ),
        ),
        if (sorted.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 36),
            child: Text(
              'Nothing due on this date — you\'re clear.',
              textAlign: TextAlign.center,
              style: AdminHomePalette.editorialMeta.copyWith(
                fontSize: 15,
                color: AdminHomePalette.textSecondary,
              ),
            ),
          )
        else
          ...sorted.asMap().entries.map((entry) {
            final i = entry.key;
            final task = entry.value;
            return Column(
              children: [
                _AgendaTaskRow(task: task),
                if (i < sorted.length - 1)
                  Divider(
                    height: 1,
                    thickness: 1,
                    color: AdminHomePalette.divider,
                  ),
              ],
            );
          }),
      ],
    );
  }
}

class _AgendaTaskRow extends StatelessWidget {
  const _AgendaTaskRow({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final delayed = runwayStatusIsDelayed(task);
    final statusColor = delayed ? _delayedColor() : AdminHomePalette.statusColor(task.status);
    final statusLabel = runwayStatusLabel(task);
    final meta = <String>[
      task.label,
      if (task.assigneeName != null) task.assigneeName!,
    ].join(' · ');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 3,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    statusLabel,
                    style: AdminHomePalette.statLabel.copyWith(
                      fontSize: 10,
                      letterSpacing: 1.6,
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    task.clientName ?? 'Wedding',
                    style: AdminHomePalette.editorialTitle.copyWith(fontSize: 18, height: 1.2),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    meta,
                    style: AdminHomePalette.editorialMeta.copyWith(
                      fontSize: 13,
                      color: AdminHomePalette.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
