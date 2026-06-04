import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/models/task.dart';

/// Single-letter weekday headers for the admin deadlines grid.
const _weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/// Weekday header colour — soft white, slightly below day numbers.
const _weekdayHeaderColor = Color(0xFFE4E4E7);

/// Admin deliverables calendar — same cinematic theme as [AdminHomeTab].
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
                    data: (data) => _AdminDeadlinesCalendar(tasks: data.tasks),
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
    return AdminHomeSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Could not load deadlines', style: AdminHomePalette.sectionTitle),
          const SizedBox(height: 10),
          Text(message, style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text)),
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

class _AdminDeadlinesCalendar extends StatefulWidget {
  const _AdminDeadlinesCalendar({required this.tasks});

  final List<Task> tasks;

  @override
  State<_AdminDeadlinesCalendar> createState() => _AdminDeadlinesCalendarState();
}

class _AdminDeadlinesCalendarState extends State<_AdminDeadlinesCalendar> {
  late DateTime _cursor;
  late String? _selectedKey;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _cursor = DateTime(now.year, now.month);
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
    final monthLabel = '${_monthName(_cursor.month)} ${_cursor.year}';
    final firstDow = DateTime(_cursor.year, _cursor.month, 1).weekday % 7;
    final daysInMonth = DateTime(_cursor.year, _cursor.month + 1, 0).day;
    final selectedDues = _selectedKey != null ? (_duesByDay[_selectedKey!] ?? []) : <Task>[];
    const hPad = 0.0;
    final gridWidth = MediaQuery.sizeOf(context).width - 44;
    final cellWidth = gridWidth / 7;
    final cellHeight = cellWidth * 1.15;

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
          ),
        ),
        const SizedBox(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: hPad),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  monthLabel,
                  style: AdminHomeTypography.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              _MonthNavButton(
                icon: Icons.chevron_left_rounded,
                onPressed: () => setState(() => _cursor = DateTime(_cursor.year, _cursor.month - 1)),
              ),
              const SizedBox(width: 8),
              _MonthNavButton(
                icon: Icons.chevron_right_rounded,
                onPressed: () => setState(() => _cursor = DateTime(_cursor.year, _cursor.month + 1)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: hPad),
          child: Row(
            children: _weekdayLetters
                .map(
                  (w) => Expanded(
                    child: Center(
                      child: Text(
                        w,
                        style: AdminHomeTypography.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                          color: _weekdayHeaderColor,
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: hPad),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
              mainAxisExtent: cellHeight,
            ),
            itemCount: firstDow + daysInMonth,
            itemBuilder: (context, i) {
              if (i < firstDow) return const SizedBox.shrink();
              final day = i - firstDow + 1;
              final key = '${_cursor.year}-${pad2(_cursor.month)}-${pad2(day)}';
              final dueList = _duesByDay[key] ?? [];
              final isSel = key == _selectedKey;
              final hasDue = dueList.isNotEmpty;

              return Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () => setState(() => _selectedKey = key),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    curve: Curves.easeOut,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: isSel ? AdminHomePalette.accent.withValues(alpha: 0.28) : Colors.transparent,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '$day',
                          style: AdminHomeTypography.inter(
                            fontSize: 17,
                            fontWeight: isSel ? FontWeight.w700 : FontWeight.w600,
                            height: 1,
                            color: AdminHomePalette.text,
                          ),
                        ),
                        if (hasDue) ...[
                          const SizedBox(height: 5),
                          const _DueDot(),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 32),
        Text(
          _selectedKey != null ? formatFriendlyDay(_selectedKey!, includeYear: true).toUpperCase() : 'SELECT A DAY',
          style: AdminHomeTypography.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.6,
            color: AdminHomePalette.textSecondary,
          ),
        ),
        const SizedBox(height: 14),
        if (selectedDues.isEmpty)
          Text(
            'Nothing due on this date — you\'re clear.',
            style: AdminHomeTypography.inter(
              fontSize: 14,
              color: AdminHomePalette.textSecondary,
              height: 1.45,
            ),
          )
        else
          ...selectedDues.map((t) => _DeadlineTaskRow(task: t)),
        const SizedBox(height: 8),
      ],
    );
  }

  String _monthName(int m) => const [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ][m - 1];
}

class _DueDot extends StatelessWidget {
  const _DueDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 7,
      height: 7,
      decoration: const BoxDecoration(
        color: AdminHomePalette.accent,
        shape: BoxShape.circle,
      ),
    );
  }
}

class _MonthNavButton extends StatelessWidget {
  const _MonthNavButton({required this.icon, required this.onPressed});

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

class _DeadlineTaskRow extends StatelessWidget {
  const _DeadlineTaskRow({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.18)),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.clientName ?? 'Wedding',
                      style: AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600),
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
                  ],
                ),
              ),
              _DeadlineStatusPill(label: task.status),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeadlineStatusPill extends StatelessWidget {
  const _DeadlineStatusPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final done = label == 'COMPLETED';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AdminHomePalette.accent.withValues(alpha: done ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: AdminHomeTypography.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: AdminHomePalette.text.withValues(alpha: done ? 1 : 0.8),
        ),
      ),
    );
  }
}
