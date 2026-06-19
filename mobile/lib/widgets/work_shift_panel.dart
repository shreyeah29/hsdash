import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/shift_hours.dart';
import 'package:hsdash_mobile/features/attendance/attendance_providers.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/models/work_shift.dart';
import 'package:intl/intl.dart';

enum WorkShiftPanelStyle { standard, monochrome }

class WorkShiftPanel extends ConsumerStatefulWidget {
  const WorkShiftPanel({super.key, this.style = WorkShiftPanelStyle.standard});

  final WorkShiftPanelStyle style;

  @override
  ConsumerState<WorkShiftPanel> createState() => _WorkShiftPanelState();
}

class _WorkShiftPanelState extends ConsumerState<WorkShiftPanel> {
  Timer? _ticker;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _startTicker();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {});
    });
  }

  bool get _mono => widget.style == WorkShiftPanelStyle.monochrome;

  Future<void> _clockIn() async {
    setState(() => _busy = true);
    try {
      await ref.read(attendanceRepositoryProvider).clockIn();
      ref.invalidate(workShiftTodayProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _clockOut() async {
    setState(() => _busy = true);
    try {
      await ref.read(attendanceRepositoryProvider).clockOut();
      ref.invalidate(workShiftTodayProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shift = ref.watch(workShiftTodayProvider);

    return shift.when(
      loading: () => const SizedBox(height: 4),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) => _panel(data.session),
    );
  }

  Widget _panel(WorkShiftSession? session) {
    final border = _mono ? LaxmanPalette.black.withValues(alpha: 0.12) : AppColors.border;
    final bg = _mono ? LaxmanPalette.white : Colors.white;
    final titleStyle = _mono
        ? LaxmanType.sectionHead('SHIFT')
        : const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.textMuted);
    final bodyStyle = _mono
        ? LaxmanType.body('', size: 13)
        : const TextStyle(fontSize: 13, color: AppColors.textMuted);
    final timerStyle = _mono
        ? LaxmanType.display('', size: 32)
        : const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: -1, color: AppColors.textPrimary);
    final statStyle = _mono
        ? LaxmanType.body('', size: 14, w: FontWeight.w700)
        : const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary);
    final warnStyle = _mono
        ? LaxmanType.body('', size: 13, w: FontWeight.w600).copyWith(color: const Color(0xFFB45309))
        : const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFB45309));
    final btnColor = _mono ? LaxmanPalette.black : AppColors.emerald;

    return Container(
      margin: EdgeInsets.only(bottom: _mono ? 24 : 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(_mono ? 0 : 16),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('WORK SHIFT', style: titleStyle),
          const SizedBox(height: 6),
          Text('Studio hours · $shiftHoursLabel', style: bodyStyle),
          const SizedBox(height: 16),
          if (session == null) ...[
            Text('Tap clock in when you start today.', style: bodyStyle),
            const SizedBox(height: 14),
            _actionButton(
              label: 'CLOCK IN',
              onPressed: _busy ? null : _clockIn,
              color: btnColor,
              filled: true,
            ),
          ] else if (session.isActive) ...[
            ..._activeShiftBody(session, bodyStyle, timerStyle, statStyle, warnStyle),
            const SizedBox(height: 14),
            _actionButton(
              label: 'CLOCK OUT',
              onPressed: _busy ? null : _clockOut,
              color: btnColor,
              filled: false,
            ),
          ] else ...[
            ..._completedShiftBody(session, bodyStyle, statStyle, warnStyle),
          ],
        ],
      ),
    );
  }

  List<Widget> _activeShiftBody(
    WorkShiftSession session,
    TextStyle bodyStyle,
    TextStyle timerStyle,
    TextStyle statStyle,
    TextStyle warnStyle,
  ) {
    final clockIn = session.clockInAt;
    final worked = workedDuration(clockIn: clockIn);
    final owed = shiftOwedDuration(clockIn: clockIn);
    final late = lateStartDuration(clockIn);
    final untilOfficialEnd = timeUntilShiftEnd();
    final untilFullShift = timeUntilFullShift(clockIn);
    final fullShiftBy = fullShiftTargetTime(clockIn);

    return [
      _statRow('Worked', formatCountdown(worked), statStyle),
      const SizedBox(height: 10),
      Text('Until 7 PM', style: bodyStyle),
      const SizedBox(height: 4),
      Text(formatCountdown(untilOfficialEnd), style: timerStyle.copyWith(fontSize: 28)),
      if (untilOfficialEnd == Duration.zero)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('Past 7 PM — clock out when you leave', style: bodyStyle.copyWith(fontWeight: FontWeight.w600)),
        ),
      const SizedBox(height: 12),
      if (late > Duration.zero) ...[
        Text('Started ${formatDurationHuman(late)} late', style: warnStyle),
        const SizedBox(height: 4),
      ],
      if (owed > Duration.zero) ...[
        Text(
          'Still owe ${formatDurationHuman(owed)} for a full shift',
          style: warnStyle,
        ),
        const SizedBox(height: 4),
        Text(
          'Stay until ${formatClockTime(fullShiftBy)} to complete it'
              '${untilFullShift > Duration.zero ? ' · ${formatDurationHuman(untilFullShift)} left' : ''}',
          style: bodyStyle,
        ),
      ] else
        Text('On track for a full shift', style: bodyStyle.copyWith(fontWeight: FontWeight.w600)),
      const SizedBox(height: 10),
      Text('Clocked in at ${formatClockTime(clockIn)}', style: bodyStyle),
    ];
  }

  List<Widget> _completedShiftBody(
    WorkShiftSession session,
    TextStyle bodyStyle,
    TextStyle statStyle,
    TextStyle warnStyle,
  ) {
    final clockIn = session.clockInAt;
    final clockOut = session.clockOutAt!;
    final worked = workedDuration(clockIn: clockIn, clockOut: clockOut);
    final owed = shiftOwedDuration(clockIn: clockIn, clockOut: clockOut);
    final late = lateStartDuration(clockIn);
    final early = earlyEndDuration(clockOut);

    return [
      Text('Shift complete for today', style: bodyStyle.copyWith(fontWeight: FontWeight.w600)),
      const SizedBox(height: 12),
      _statRow('Worked', formatDurationHuman(worked), statStyle),
      _statRow('Expected', formatDurationHuman(expectedShiftDuration), bodyStyle),
      const SizedBox(height: 8),
      _timeRow('In', clockIn, bodyStyle),
      const SizedBox(height: 6),
      _timeRow('Out', clockOut, bodyStyle),
      const SizedBox(height: 12),
      if (late > Duration.zero)
        Text('Started ${formatDurationHuman(late)} late', style: warnStyle),
      if (early > Duration.zero) ...[
        if (late > Duration.zero) const SizedBox(height: 4),
        Text('Left ${formatDurationHuman(early)} before 7 PM', style: warnStyle),
      ],
      if (owed > Duration.zero) ...[
        const SizedBox(height: 8),
        Text(
          '${formatDurationHuman(owed)} still owed — catch up when you can',
          style: warnStyle,
        ),
      ] else if (worked >= expectedShiftDuration) ...[
        const SizedBox(height: 8),
        Text('Full shift completed', style: bodyStyle.copyWith(fontWeight: FontWeight.w700)),
      ],
    ];
  }

  Widget _statRow(String label, String value, TextStyle valueStyle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          SizedBox(width: 72, child: Text(label, style: valueStyle.copyWith(fontWeight: FontWeight.w500))),
          Text(value, style: valueStyle),
        ],
      ),
    );
  }

  Widget _timeRow(String label, DateTime time, TextStyle style) {
    return Row(
      children: [
        SizedBox(width: 36, child: Text(label, style: style)),
        Text(DateFormat('h:mm a').format(time), style: style.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }

  Widget _actionButton({
    required String label,
    required VoidCallback? onPressed,
    required Color color,
    required bool filled,
  }) {
    if (_mono) {
      return SizedBox(
        width: double.infinity,
        child: filled
            ? FilledButton(
                onPressed: onPressed,
                style: FilledButton.styleFrom(
                  backgroundColor: LaxmanPalette.black,
                  foregroundColor: LaxmanPalette.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(),
                ),
                child: Text(
                  label,
                  style: LaxmanType.label('').copyWith(color: LaxmanPalette.white),
                ),
              )
            : OutlinedButton(
                onPressed: onPressed,
                style: OutlinedButton.styleFrom(
                  foregroundColor: LaxmanPalette.black,
                  side: const BorderSide(color: LaxmanPalette.black),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(),
                ),
                child: Text(label, style: LaxmanType.label(label)),
              ),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: filled
          ? FilledButton(
              onPressed: onPressed,
              style: FilledButton.styleFrom(
                backgroundColor: color,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(label),
            )
          : OutlinedButton(
              onPressed: onPressed,
              style: OutlinedButton.styleFrom(
                foregroundColor: color,
                side: BorderSide(color: color),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(label),
            ),
    );
  }
}
