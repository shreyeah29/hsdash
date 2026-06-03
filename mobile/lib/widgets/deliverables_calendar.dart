import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/task.dart';
import 'package:hsdash_mobile/widgets/task_widgets.dart';

class DeliverablesCalendar extends StatefulWidget {
  const DeliverablesCalendar({
    super.key,
    required this.tasks,
    this.initialSelectedKey,
  });

  final List<Task> tasks;
  final String? initialSelectedKey;

  @override
  State<DeliverablesCalendar> createState() => _DeliverablesCalendarState();
}

class _DeliverablesCalendarState extends State<DeliverablesCalendar> {
  late DateTime _cursor;
  late String? _selectedKey;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _cursor = DateTime(now.year, now.month);
    _selectedKey = widget.initialSelectedKey ?? localDayKey(now);
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
    final todayKey = localDayKey(DateTime.now());
    final monthLabel = '${_monthName(_cursor.month)} ${_cursor.year}';
    final firstDow = DateTime(_cursor.year, _cursor.month, 1).weekday % 7;
    final daysInMonth = DateTime(_cursor.year, _cursor.month + 1, 0).day;
    final selectedDues = _selectedKey != null ? (_duesByDay[_selectedKey!] ?? []) : <Task>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(monthLabel, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            Row(
              children: [
                IconButton(onPressed: () => setState(() => _cursor = DateTime(_cursor.year, _cursor.month - 1)), icon: const Icon(Icons.chevron_left)),
                IconButton(onPressed: () => setState(() => _cursor = DateTime(_cursor.year, _cursor.month + 1)), icon: const Icon(Icons.chevron_right)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: weekdayLabels.map((w) => Expanded(child: Center(child: Text(w, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted))))).toList(),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 6, crossAxisSpacing: 6, childAspectRatio: 0.85),
          itemCount: firstDow + daysInMonth,
          itemBuilder: (context, i) {
            if (i < firstDow) return const SizedBox.shrink();
            final day = i - firstDow + 1;
            final key = '${_cursor.year}-${pad2(_cursor.month)}-${pad2(day)}';
            final dueList = _duesByDay[key] ?? [];
            final isToday = key == todayKey;
            final isSel = key == _selectedKey;

            return Material(
              color: isSel ? AppColors.violetLight : Colors.white,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => setState(() => _selectedKey = key),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isToday ? AppColors.cyan : isSel ? AppColors.violet : AppColors.border,
                      width: isToday || isSel ? 1.5 : 1,
                    ),
                  ),
                  padding: const EdgeInsets.all(6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('$day', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                          if (dueList.isNotEmpty)
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFFFBBF24), shape: BoxShape.circle)),
                        ],
                      ),
                      if (dueList.isNotEmpty)
                        Expanded(
                          child: Text(
                            dueList.first.clientName ?? 'Wedding',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 9, color: AppColors.textMuted),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        Text(
          _selectedKey != null ? formatFriendlyDay(_selectedKey!, includeYear: true) : 'Select a day',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 8),
        if (selectedDues.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('Nothing due on this date — you\'re clear.', style: TextStyle(color: AppColors.textMuted)),
            ),
          )
        else
          ...selectedDues.map(
            (t) => TaskCard(
              clientName: t.clientName ?? 'Wedding',
              label: t.label,
              status: t.status,
              subtitle: t.assigneeName ?? 'Unassigned',
            ),
          ),
      ],
    );
  }

  String _monthName(int m) => const [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ][m - 1];
}
