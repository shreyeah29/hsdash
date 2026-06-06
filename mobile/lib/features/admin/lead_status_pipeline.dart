import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/lead_detail_theme.dart';
import 'package:hsdash_mobile/models/lead.dart';

/// Premium vertical pipeline stepper inside a single card surface.
class LeadStatusPipeline extends StatelessWidget {
  const LeadStatusPipeline({
    super.key,
    required this.currentStatus,
    required this.onStatusSelected,
    this.enabled = true,
  });

  final String currentStatus;
  final ValueChanged<String> onStatusSelected;
  final bool enabled;

  void _select(String status) {
    if (!enabled || status == currentStatus) return;
    HapticFeedback.selectionClick();
    onStatusSelected(status);
  }

  int get _currentIndex => kLeadPipelineStatuses.indexOf(currentStatus);

  @override
  Widget build(BuildContext context) {
    return LeadDetailSurface(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Row(
              children: [
                Text('PIPELINE', style: LeadDetailPalette.sectionTitle),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: LeadDetailPalette.mutedFill,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    _currentIndex >= 0 ? 'Step ${_currentIndex + 1} of ${kLeadPipelineStatuses.length}' : 'Closed',
                    style: LeadDetailPalette.caption.copyWith(fontWeight: FontWeight.w600, color: LeadDetailPalette.textSecondary),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: Column(
              children: [
                for (var i = 0; i < kLeadPipelineStatuses.length; i++)
                  _PipelineRow(
                    status: kLeadPipelineStatuses[i],
                    index: i,
                    currentIndex: _currentIndex,
                    enabled: enabled,
                    isLast: i == kLeadPipelineStatuses.length - 1,
                    onTap: () => _select(kLeadPipelineStatuses[i]),
                  ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 1, color: LeadDetailPalette.border.withValues(alpha: 0.7)),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: _TerminalRow(
              currentStatus: currentStatus,
              enabled: enabled,
              onSelect: _select,
            ),
          ),
        ],
      ),
    );
  }
}

enum _StageState { upcoming, current, passed }

class _PipelineRow extends StatelessWidget {
  const _PipelineRow({
    required this.status,
    required this.index,
    required this.currentIndex,
    required this.enabled,
    required this.isLast,
    required this.onTap,
  });

  final String status;
  final int index;
  final int currentIndex;
  final bool enabled;
  final bool isLast;
  final VoidCallback onTap;

  _StageState get _state {
    if (currentIndex < 0) return _StageState.upcoming;
    if (index < currentIndex) return _StageState.passed;
    if (index == currentIndex) return _StageState.current;
    return _StageState.upcoming;
  }

  @override
  Widget build(BuildContext context) {
    final color = leadStatusColor(status);
    final state = _state;
    final selected = state == _StageState.current;
    final passed = state == _StageState.passed;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            border: selected ? Border.all(color: color.withValues(alpha: 0.22)) : null,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PipelineTrack(
                color: color,
                state: state,
                showLine: !isLast,
                linePassed: passed || selected,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      leadStatusLabel(status),
                      style: AdminHomeTypography.inter(
                        fontSize: selected ? 16 : 15,
                        fontWeight: selected ? FontWeight.w700 : (passed ? FontWeight.w600 : FontWeight.w500),
                        color: selected || passed ? LeadDetailPalette.text : LeadDetailPalette.textSecondary,
                        letterSpacing: selected ? -0.2 : 0,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      leadStatusHint(status),
                      style: LeadDetailPalette.meta.copyWith(
                        fontSize: 12,
                        color: selected
                            ? color.withValues(alpha: 0.95)
                            : LeadDetailPalette.labelColor.withValues(alpha: passed ? 0.9 : 0.75),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (selected)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.check_rounded, size: 16, color: color),
                )
              else if (passed)
                Icon(Icons.check_rounded, size: 16, color: LeadDetailPalette.labelColor.withValues(alpha: 0.55))
              else
                Icon(leadStatusIcon(status), size: 15, color: LeadDetailPalette.labelColor.withValues(alpha: 0.45)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PipelineTrack extends StatelessWidget {
  const _PipelineTrack({
    required this.color,
    required this.state,
    required this.showLine,
    required this.linePassed,
  });

  final Color color;
  final _StageState state;
  final bool showLine;
  final bool linePassed;

  @override
  Widget build(BuildContext context) {
    final current = state == _StageState.current;
    final filled = state != _StageState.upcoming;

    return SizedBox(
      width: 20,
      child: Column(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 240),
            width: current ? 14 : 11,
            height: current ? 14 : 11,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: filled ? (current ? color : color.withValues(alpha: 0.45)) : LeadDetailPalette.surface,
              border: Border.all(
                color: filled ? color : LeadDetailPalette.border,
                width: current ? 2.5 : 1.5,
              ),
              boxShadow: current
                  ? [
                      BoxShadow(
                        color: color.withValues(alpha: 0.35),
                        blurRadius: 8,
                        spreadRadius: 0,
                      ),
                    ]
                  : null,
            ),
          ),
          if (showLine)
            Container(
              width: 2,
              height: 28,
              margin: const EdgeInsets.symmetric(vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: linePassed ? color.withValues(alpha: 0.35) : LeadDetailPalette.border,
              ),
            ),
        ],
      ),
    );
  }
}

class _TerminalRow extends StatelessWidget {
  const _TerminalRow({
    required this.currentStatus,
    required this.enabled,
    required this.onSelect,
  });

  final String currentStatus;
  final bool enabled;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('CLOSE LEAD', style: LeadDetailPalette.caption.copyWith(letterSpacing: 1.2, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final status in kLeadTerminalStatuses)
              _TerminalChip(
                status: status,
                selected: currentStatus == status,
                enabled: enabled,
                onTap: () => onSelect(status),
              ),
          ],
        ),
      ],
    );
  }
}

class _TerminalChip extends StatelessWidget {
  const _TerminalChip({
    required this.status,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final String status;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = leadStatusColor(status);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.12) : LeadDetailPalette.mutedFill,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? color.withValues(alpha: 0.35) : LeadDetailPalette.border.withValues(alpha: 0.8)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(leadStatusIcon(status), size: 14, color: selected ? color : LeadDetailPalette.labelColor),
              const SizedBox(width: 6),
              Text(
                leadStatusLabel(status),
                style: AdminHomeTypography.inter(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                  color: selected ? color : LeadDetailPalette.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
