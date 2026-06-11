import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/shoot_export.dart';
import 'package:hsdash_mobile/core/shoot_time_utils.dart';
import 'package:hsdash_mobile/core/spreadsheet_export.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_event_detail_screen.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_form_screen.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/widgets/create_deliverable_tasks_sheet.dart';
import 'package:intl/intl.dart';

enum ShootCalendarMode { admin, coordinator }

const _weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const _weekdayHeaderColor = Color(0xFFE4E4E7);

/// iOS Calendar–style shoots: month grid + day agenda + event detail.
class ShootCalendarPanel extends ConsumerStatefulWidget {
  const ShootCalendarPanel({super.key, required this.mode, this.monochrome = false});

  final ShootCalendarMode mode;
  /// B&W editorial calendar (Emmanuel) — same layout as admin premium, black/white only.
  final bool monochrome;

  bool get canEdit => mode == ShootCalendarMode.admin;
  bool get canActivate => mode == ShootCalendarMode.coordinator || mode == ShootCalendarMode.admin;
  bool get _premiumDark => mode == ShootCalendarMode.admin;
  bool get _monochromeEditorial => monochrome && mode == ShootCalendarMode.coordinator;

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
    final premium = widget._premiumDark;
    final mono = widget._monochromeEditorial;

    Widget body = entries.when(
      loading: () => Center(
        child: CircularProgressIndicator(
          color: premium
              ? AdminHomePalette.accent
              : (mono ? LaxmanPalette.black : AppColors.violet),
          strokeWidth: 2,
        ),
      ),
      error: (e, _) => Center(
        child: Text(
          '$e',
          style: TextStyle(
            color: premium
                ? AdminHomePalette.text
                : (mono ? LaxmanPalette.black : AppColors.rose),
          ),
        ),
      ),
      data: (list) => _IosCalendarView(
        month: month,
        entries: list,
        selectedDayKey: _selectedDayKey!,
        canEdit: widget.canEdit,
        canActivate: widget.canActivate,
        premiumDark: premium,
        monochromeEditorial: mono,
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

    if (!premium && !mono) return body;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: mono ? SystemUiOverlayStyle.dark : SystemUiOverlayStyle.light,
      child: ColoredBox(
        color: mono ? LaxmanPalette.white : AdminHomePalette.background,
        child: body,
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
    required this.premiumDark,
    required this.monochromeEditorial,
    required this.onSelectDay,
    required this.onPrevMonth,
    required this.onNextMonth,
    required this.onToday,
    required this.onRefresh,
    required this.onMutated,
  });

  final void Function(String? dayKey) onMutated;

  final DateTime month;
  final List<ShootCalendarEntry> entries;
  final String selectedDayKey;
  final bool canEdit;
  final bool canActivate;
  final bool premiumDark;
  final bool monochromeEditorial;
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

  static const _monoBarColors = [
    LaxmanPalette.black,
    Color(0xFF444444),
    Color(0xFF888888),
  ];

  bool get _mono => monochromeEditorial;

  List<Color> get _eventBarColors => _mono ? _monoBarColors : _barColors;

  Color get _brand => _mono ? LaxmanPalette.black : AppColors.violet;

  Color get _todayRing => _mono ? LaxmanPalette.black : AppColors.cyan;

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
    final dividerColor = premiumDark
        ? AdminHomePalette.textSecondary.withValues(alpha: 0.18)
        : (_mono ? LaxmanPalette.black.withValues(alpha: 0.12) : AppColors.border);

    return RefreshIndicator(
      color: premiumDark ? AdminHomePalette.accent : _brand,
      backgroundColor: premiumDark ? AdminHomePalette.card : (_mono ? LaxmanPalette.white : null),
      onRefresh: onRefresh,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (premiumDark) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 12, 22, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SHOOTS',
                    style: AdminHomeTypography.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 2.2,
                      color: AdminHomePalette.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Production calendar',
                          style: AdminHomeTypography.inter(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.5,
                            height: 1.12,
                          ),
                        ),
                      ),
                      IconButton(
                        tooltip: 'Export Excel',
                        onPressed: entries.isEmpty
                            ? null
                            : () => _exportShoots(context, entries),
                        icon: const Icon(Icons.ios_share_rounded, color: AdminHomePalette.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
          _monthHeader(context, ref, monthTitle),
          _weekdayRow(),
          _monthGrid(context, byDay, todayKey),
          SizedBox(height: premiumDark ? 8 : 12),
          Divider(height: 1, color: dividerColor),
          Padding(
            padding: EdgeInsets.fromLTRB(premiumDark ? 22 : 16, 14, premiumDark ? 22 : 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    dayHeading,
                    style: premiumDark
                        ? AdminHomeTypography.inter(fontSize: 17, fontWeight: FontWeight.w600)
                        : const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                  ),
                ),
                if (canEdit)
                  IconButton(
                    tooltip: 'Add shoot',
                    onPressed: () => _openForm(context, ref, dayKey: selectedDayKey),
                    icon: Icon(
                      Icons.add_circle,
                      color: premiumDark ? AdminHomePalette.accent : _brand,
                      size: 28,
                    ),
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
                            Icon(
                              Icons.event_available,
                              size: 48,
                              color: premiumDark
                                  ? AdminHomePalette.textSecondary.withValues(alpha: 0.45)
                                  : (_mono
                                      ? LaxmanPalette.black.withValues(alpha: 0.35)
                                      : AppColors.textMuted.withValues(alpha: 0.4)),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No shoots this day',
                              style: premiumDark
                                  ? AdminHomeTypography.inter(fontSize: 15, fontWeight: FontWeight.w600)
                                  : const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            if (canEdit) ...[
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () => _openForm(context, ref, dayKey: selectedDayKey),
                                style: premiumDark
                                    ? TextButton.styleFrom(foregroundColor: AdminHomePalette.accent)
                                    : null,
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
                    padding: EdgeInsets.fromLTRB(premiumDark ? 22 : 12, 0, premiumDark ? 22 : 12, 24),
                    itemCount: dayEntries.length,
                    itemBuilder: (context, i) {
                      final e = dayEntries[i];
                      return _AgendaTile(
                        entry: e,
                        color: _eventBarColors[i % _eventBarColors.length],
                        premiumDark: premiumDark,
                        monochromeEditorial: monochromeEditorial,
                        onTap: () => _openDetail(context, e),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Future<void> _exportShoots(BuildContext context, List<ShootCalendarEntry> allEntries) async {
    final stamp = DateFormat('yyyy-MM-dd').format(DateTime.now());
    await shareSpreadsheet(
      context: context,
      filename: 'shoot-calendar-$stamp.csv',
      columns: shootExportColumns,
      rows: buildShootExportRows(allEntries),
    );
  }

  Widget _monthHeader(BuildContext context, WidgetRef ref, String monthTitle) {
    final hPad = premiumDark ? 14.0 : 8.0;
    final titleStyle = premiumDark
        ? AdminHomeTypography.inter(fontSize: 20, fontWeight: FontWeight.w600, letterSpacing: -0.3)
        : const TextStyle(fontSize: 20, fontWeight: FontWeight.w700);
    final iconColor = premiumDark ? AdminHomePalette.text : null;
    final todayStyle = premiumDark
        ? AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AdminHomePalette.accent)
        : null;

    return Padding(
      padding: EdgeInsets.fromLTRB(hPad, premiumDark ? 0 : 8, hPad, 4),
      child: Row(
        children: [
          IconButton(
            onPressed: onPrevMonth,
            icon: Icon(Icons.chevron_left_rounded, color: iconColor),
          ),
          Expanded(child: Text(monthTitle, textAlign: TextAlign.center, style: titleStyle)),
          IconButton(
            onPressed: onNextMonth,
            icon: Icon(Icons.chevron_right_rounded, color: iconColor),
          ),
          TextButton(
            onPressed: onToday,
            style: premiumDark ? TextButton.styleFrom(foregroundColor: AdminHomePalette.accent) : null,
            child: Text('Today', style: todayStyle),
          ),
          if (canEdit)
            PopupMenuButton<String>(
              icon: Icon(Icons.more_horiz, color: iconColor),
              color: premiumDark ? AdminHomePalette.card : null,
              onSelected: (v) {
                if (v == 'tasks') showCreateDeliverableTasksSheet(context, calendarDay: selectedDayKey);
                if (v == 'shoot') _openForm(context, ref, dayKey: selectedDayKey);
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'shoot',
                  child: Text(
                    'Add shoot details',
                    style: premiumDark ? AdminHomeTypography.inter(fontSize: 14) : null,
                  ),
                ),
                PopupMenuItem(
                  value: 'tasks',
                  child: Text(
                    'Create deliverable tasks',
                    style: premiumDark ? AdminHomeTypography.inter(fontSize: 14) : null,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _weekdayRow() {
    final labels = premiumDark ? _weekdayLetters : weekdayLabels;
    final hPad = premiumDark ? 22.0 : 8.0;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: hPad),
      child: Row(
        children: labels
            .map(
              (w) => Expanded(
                child: Center(
                  child: Text(
                    w,
                    style: premiumDark
                        ? AdminHomeTypography.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.2,
                            color: _weekdayHeaderColor,
                          )
                        : const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _monthGrid(BuildContext context, Map<String, List<ShootCalendarEntry>> byDay, String todayKey) {
    final firstDow = DateTime(month.year, month.month, 1).weekday % 7;
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final hPad = premiumDark ? 16.0 : 6.0;
    final gridWidth = MediaQuery.sizeOf(context).width - (premiumDark ? 44.0 : 12.0);
    final cellHeight = premiumDark ? (gridWidth / 7) * 1.0 : null;

    return Padding(
      padding: EdgeInsets.only(bottom: premiumDark ? 0 : 4),
      child: SizedBox(
        height: premiumDark ? null : 236,
        child: GridView.builder(
          shrinkWrap: premiumDark,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(hPad, 4, hPad, premiumDark ? 2 : 10),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 4,
            crossAxisSpacing: premiumDark ? 4 : 2,
            mainAxisExtent: cellHeight,
          ),
          itemCount: firstDow + daysInMonth,
          itemBuilder: (context, i) {
            if (i < firstDow) return const SizedBox.shrink();
            final day = i - firstDow + 1;
            final key = '${month.year}-${pad2(month.month)}-${pad2(day)}';
            final list = byDay[key] ?? [];
            final isSel = key == selectedDayKey;
            final isToday = key == todayKey;

            if (premiumDark) {
              return Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () => onSelectDay(key),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    curve: Curves.easeOut,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: isSel ? AdminHomePalette.accent.withValues(alpha: 0.28) : Colors.transparent,
                      border: isToday && !isSel
                          ? Border.all(color: AdminHomePalette.accent.withValues(alpha: 0.55), width: 1.5)
                          : null,
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
                        if (list.isNotEmpty) ...[
                          const SizedBox(height: 5),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(list.length.clamp(0, 3), (idx) {
                              return Container(
                                width: 6,
                                height: 6,
                                margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                decoration: BoxDecoration(
                                  color: isSel
                                      ? AdminHomePalette.text
                                      : _barColors[idx % _barColors.length],
                                  shape: BoxShape.circle,
                                ),
                              );
                            }),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }

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
                      color: isSel ? _brand : Colors.transparent,
                      border: isToday && !isSel ? Border.all(color: _todayRing, width: 2) : null,
                    ),
                    child: Text(
                      '$day',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isSel ? LaxmanPalette.white : (_mono ? LaxmanPalette.black : AppColors.textPrimary),
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
                                  color: isSel
                                      ? LaxmanPalette.white.withValues(alpha: 0.9)
                                      : _eventBarColors[idx % _eventBarColors.length],
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
  const _AgendaTile({
    required this.entry,
    required this.color,
    required this.premiumDark,
    required this.monochromeEditorial,
    required this.onTap,
  });

  final ShootCalendarEntry entry;
  final Color color;
  final bool premiumDark;
  final bool monochromeEditorial;
  final VoidCallback onTap;

  bool get _mono => monochromeEditorial;

  TextStyle _timeStyle(bool premiumDark) {
    if (premiumDark) {
      return AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w600);
    }
    return TextStyle(
      fontWeight: FontWeight.w600,
      fontSize: 14,
      color: _mono ? LaxmanPalette.black : AppColors.textPrimary,
    );
  }

  TextStyle _teamLineStyle(bool premiumDark) {
    if (premiumDark) {
      return AdminHomeTypography.inter(fontSize: 12, color: AdminHomePalette.textSecondary.withValues(alpha: 0.9));
    }
    return TextStyle(
      fontSize: 12,
      color: _mono ? LaxmanPalette.black.withValues(alpha: 0.5) : AppColors.textMuted,
    );
  }

  @override
  Widget build(BuildContext context) {
    final times = splitShootTimes(entry.startTime, entry.endTime);
    final subtitle = [
      if (entry.eventName != null && entry.eventName!.isNotEmpty) entry.eventName,
      if (entry.venue != null && entry.venue!.isNotEmpty) entry.venue,
      if (entry.city != null && entry.city!.isNotEmpty) entry.city,
    ].whereType<String>().join(' · ');

    final borderColor = premiumDark
        ? AdminHomePalette.textSecondary.withValues(alpha: 0.18)
        : (_mono ? LaxmanPalette.black.withValues(alpha: 0.12) : AppColors.border);

    return Material(
      color: premiumDark ? Colors.transparent : (_mono ? LaxmanPalette.white : Colors.white),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: borderColor)),
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
                    Text(
                      entry.clientName,
                      style: premiumDark
                          ? AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600)
                          : TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: _mono ? LaxmanPalette.black : AppColors.textPrimary,
                            ),
                    ),
                    if (subtitle.isNotEmpty)
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: premiumDark
                            ? AdminHomeTypography.inter(fontSize: 13, color: AdminHomePalette.textSecondary)
                            : TextStyle(
                                fontSize: 13,
                                color: _mono ? LaxmanPalette.black.withValues(alpha: 0.55) : AppColors.textMuted,
                              ),
                      ),
                    if (entry.photoTeam != null && entry.photoTeam!.trim().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Photo · ${entry.photoTeam!.trim()}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: _teamLineStyle(premiumDark),
                      ),
                    ],
                    if (entry.videoTeam != null && entry.videoTeam!.trim().isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Video · ${entry.videoTeam!.trim()}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: _teamLineStyle(premiumDark),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(times.$1, style: _timeStyle(premiumDark)),
                  if (times.$2.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(times.$2, style: _timeStyle(premiumDark)),
                  ],
                ],
              ),
              Icon(
                Icons.chevron_right,
                color: premiumDark
                    ? AdminHomePalette.textSecondary
                    : (_mono ? LaxmanPalette.black.withValues(alpha: 0.45) : AppColors.textMuted),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
