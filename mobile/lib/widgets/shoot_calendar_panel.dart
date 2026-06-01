import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/shoot_time_utils.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_event_detail_screen.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_form_screen.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/widgets/create_deliverable_tasks_sheet.dart';
import 'package:intl/intl.dart';

enum ShootCalendarMode { admin, coordinator }

/// iOS Calendar–style shoots: month grid + day agenda + event detail.
class ShootCalendarPanel extends ConsumerStatefulWidget {
  const ShootCalendarPanel({super.key, required this.mode});

  final ShootCalendarMode mode;

  bool get canEdit => mode == ShootCalendarMode.admin;
  bool get canActivate => mode == ShootCalendarMode.coordinator || mode == ShootCalendarMode.admin;

  @override
  ConsumerState<ShootCalendarPanel> createState() => _ShootCalendarPanelState();
}

class _ShootCalendarPanelState extends ConsumerState<ShootCalendarPanel> {
  String? _selectedDayKey;

  @override
  void initState() {
    super.initState();
    _selectedDayKey = localDayKey(DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    final month = ref.watch(productionCalendarMonthProvider);
    final entries = ref.watch(productionCalendarEntriesProvider);

    return entries.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.rose))),
      data: (list) => _IosCalendarView(
        month: month,
        entries: list,
        selectedDayKey: _selectedDayKey!,
        canEdit: widget.canEdit,
        canActivate: widget.canActivate,
        onSelectDay: (k) => setState(() => _selectedDayKey = k),
        onPrevMonth: () => ref.read(productionCalendarMonthProvider.notifier).previousMonth(),
        onNextMonth: () => ref.read(productionCalendarMonthProvider.notifier).nextMonth(),
        onToday: () {
          final now = DateTime.now();
          ref.read(productionCalendarMonthProvider.notifier).setMonth(now);
          setState(() => _selectedDayKey = localDayKey(now));
        },
        onRefresh: () async => invalidateShootCalendarEntries(ref),
        onMutated: (dayKey) => _afterShootChange(dayKey),
      ),
    );
  }

  void _afterShootChange(String? dayKey) {
    if (dayKey != null) {
      final p = dayKey.split('-').map(int.parse).toList();
      ref.read(productionCalendarMonthProvider.notifier).setMonth(DateTime(p[0], p[1]));
      setState(() => _selectedDayKey = dayKey);
    }
    invalidateShootCalendarEntries(ref);
  }
}

class _IosCalendarView extends ConsumerWidget {
  const _IosCalendarView({
    required this.month,
    required this.entries,
    required this.selectedDayKey,
    required this.canEdit,
    required this.canActivate,
    required this.onSelectDay,
    required this.onPrevMonth,
    required this.onNextMonth,
    required this.onToday,
    required this.onRefresh,
    required this.onMutated,
  });

  /// Called after create/edit/delete; optional [dayKey] jumps calendar to that day.
  final void Function(String? dayKey) onMutated;

  final DateTime month;
  final List<ShootCalendarEntry> entries;
  final String selectedDayKey;
  final bool canEdit;
  final bool canActivate;
  final ValueChanged<String> onSelectDay;
  final VoidCallback onPrevMonth;
  final VoidCallback onNextMonth;
  final VoidCallback onToday;
  final Future<void> Function() onRefresh;

  static const _barColors = [
    AppColors.violet,
    AppColors.cyan,
    AppColors.amber,
    AppColors.emerald,
    AppColors.orange,
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final todayKey = localDayKey(DateTime.now());
    final byDay = <String, List<ShootCalendarEntry>>{};
    for (final e in entries) {
      final key = shootDayKey(e.day);
      byDay.putIfAbsent(key, () => []).add(e);
    }
    final dayEntries = List<ShootCalendarEntry>.from(byDay[selectedDayKey] ?? [])
      ..sort((a, b) => (a.startTime ?? '').compareTo(b.startTime ?? ''));
    final monthTitle = DateFormat('MMMM yyyy').format(month);
    final dayHeading = _dayHeading(selectedDayKey);

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _monthHeader(context, ref, monthTitle),
          _weekdayRow(),
          _monthGrid(byDay, todayKey),
          const SizedBox(height: 18),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(dayHeading, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                ),
                if (canEdit)
                  IconButton(
                    tooltip: 'Add shoot',
                    onPressed: () => _openForm(context, ref, dayKey: selectedDayKey),
                    icon: const Icon(Icons.add_circle, color: AppColors.violet, size: 28),
                  ),
              ],
            ),
          ),
          Expanded(
            child: dayEntries.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(Icons.event_available, size: 48, color: AppColors.textMuted.withValues(alpha: 0.4)),
                            const SizedBox(height: 12),
                            const Text('No shoots this day', style: TextStyle(fontWeight: FontWeight.w600)),
                            if (canEdit) ...[
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () => _openForm(context, ref, dayKey: selectedDayKey),
                                child: const Text('Add shoot details'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                    itemCount: dayEntries.length,
                    itemBuilder: (context, i) {
                      final e = dayEntries[i];
                      return _AgendaTile(
                        entry: e,
                        color: _barColors[i % _barColors.length],
                        onTap: () => _openDetail(context, e),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _monthHeader(BuildContext context, WidgetRef ref, String monthTitle) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
      child: Row(
        children: [
          IconButton(onPressed: onPrevMonth, icon: const Icon(Icons.chevron_left)),
          Expanded(
            child: Text(monthTitle, textAlign: TextAlign.center, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          IconButton(onPressed: onNextMonth, icon: const Icon(Icons.chevron_right)),
          TextButton(onPressed: onToday, child: const Text('Today')),
          if (canEdit)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_horiz),
              onSelected: (v) {
                if (v == 'tasks') showCreateDeliverableTasksSheet(context, calendarDay: selectedDayKey);
                if (v == 'shoot') _openForm(context, ref, dayKey: selectedDayKey);
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'shoot', child: Text('Add shoot details')),
                const PopupMenuItem(value: 'tasks', child: Text('Create deliverable tasks')),
              ],
            ),
        ],
      ),
    );
  }

  Widget _weekdayRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: weekdayLabels
            .map((w) => Expanded(child: Center(child: Text(w, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted)))))
            .toList(),
      ),
    );
  }

  Widget _monthGrid(Map<String, List<ShootCalendarEntry>> byDay, String todayKey) {
    final firstDow = DateTime(month.year, month.month, 1).weekday % 7;
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: SizedBox(
        height: 236,
        child: GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(6, 4, 6, 14),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 4,
            crossAxisSpacing: 2,
          ),
        itemCount: firstDow + daysInMonth,
        itemBuilder: (context, i) {
          if (i < firstDow) return const SizedBox.shrink();
          final day = i - firstDow + 1;
          final key = '${month.year}-${pad2(month.month)}-${pad2(day)}';
          final list = byDay[key] ?? [];
          final isSel = key == selectedDayKey;
          final isToday = key == todayKey;

          return GestureDetector(
            onTap: () => onSelectDay(key),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSel ? AppColors.violet : Colors.transparent,
                    border: isToday && !isSel ? Border.all(color: AppColors.cyan, width: 2) : null,
                  ),
                  child: Text(
                    '$day',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isSel ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                SizedBox(
                  height: 6,
                  child: list.isEmpty
                      ? null
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(list.length.clamp(0, 3), (idx) {
                            return Container(
                              width: 5,
                              height: 5,
                              margin: const EdgeInsets.symmetric(horizontal: 1.5),
                              decoration: BoxDecoration(
                                color: isSel ? Colors.white.withValues(alpha: 0.9) : _barColors[idx % _barColors.length],
                                shape: BoxShape.circle,
                              ),
                            );
                          }),
                        ),
                ),
              ],
            ),
          );
        },
        ),
      ),
    );
  }

  String _dayHeading(String key) {
    final p = key.split('-').map(int.parse).toList();
    return DateFormat('EEEE, d MMMM').format(DateTime(p[0], p[1], p[2]));
  }

  Future<void> _openForm(BuildContext context, WidgetRef ref, {required String dayKey}) async {
    final repo = ref.read(productionCalendarRepositoryProvider);
    final savedDay = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => ShootFormScreen(
          initial: ShootFormData(day: dayKey, clientName: ''),
          onSave: (data) => repo.createEntry(data),
        ),
      ),
    );
    if (savedDay != null) {
      onMutated(savedDay);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Shoot saved')));
      }
    }
  }

  void _openDetail(BuildContext context, ShootCalendarEntry entry) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ShootEventDetailScreen(
          entryId: entry.id,
          initialEntry: entry,
          canEdit: canEdit,
          canActivate: canActivate,
          canManageAssignments: entry.hasPostProduction && (canEdit || canActivate),
          onMutated: () => onMutated(shootDayKey(entry.day)),
        ),
      ),
    );
  }
}

class _AgendaTile extends StatelessWidget {
  const _AgendaTile({required this.entry, required this.color, required this.onTap});

  final ShootCalendarEntry entry;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final times = splitShootTimes(entry.startTime, entry.endTime);
    final subtitle = [
      if (entry.eventName != null && entry.eventName!.isNotEmpty) entry.eventName,
      if (entry.venue != null && entry.venue!.isNotEmpty) entry.venue,
      if (entry.city != null && entry.city!.isNotEmpty) entry.city,
    ].whereType<String>().join(' · ');

    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 4,
                margin: const EdgeInsets.only(top: 4, right: 12),
                height: 44,
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.clientName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                    if (subtitle.isNotEmpty)
                      Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(times.$1, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  if (times.$2.isNotEmpty) Text(times.$2, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                ],
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
