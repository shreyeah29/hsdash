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
  Duration _remaining = timeUntilShiftEnd();
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
      setState(() => _remaining = timeUntilShiftEnd());
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
          Text('Studio hours · $shiftStartHour AM – $shiftEndHour PM', style: bodyStyle),
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
            Text('Time left in shift', style: bodyStyle),
            const SizedBox(height: 6),
            Text(
              _remaining == Duration.zero ? 'Shift ended' : formatCountdown(_remaining),
              style: timerStyle,
            ),
            const SizedBox(height: 10),
            Text('Clocked in at ${formatClockTime(session.clockInAt)}', style: bodyStyle),
            const SizedBox(height: 14),
            _actionButton(
              label: 'CLOCK OUT',
              onPressed: _busy ? null : _clockOut,
              color: btnColor,
              filled: false,
            ),
          ] else ...[
            Text('Shift complete for today', style: bodyStyle.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            _timeRow('In', session.clockInAt, bodyStyle),
            const SizedBox(height: 6),
            _timeRow('Out', session.clockOutAt!, bodyStyle),
          ],
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
                child: Text(label, style: LaxmanType.label('')),
              )
            : OutlinedButton(
                onPressed: onPressed,
                style: OutlinedButton.styleFrom(
                  foregroundColor: LaxmanPalette.black,
                  side: const BorderSide(color: LaxmanPalette.black),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(),
                ),
                child: Text(label, style: LaxmanType.label('')),
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
