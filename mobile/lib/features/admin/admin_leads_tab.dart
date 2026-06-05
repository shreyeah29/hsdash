import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/lead_detail_screen.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/models/lead.dart';

class AdminLeadsTab extends ConsumerStatefulWidget {
  const AdminLeadsTab({super.key});

  @override
  ConsumerState<AdminLeadsTab> createState() => _AdminLeadsTabState();
}

class _AdminLeadsTabState extends ConsumerState<AdminLeadsTab> {
  String? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final stats = ref.watch(leadStatsProvider);
    final leads = ref.watch(leadsListProvider(_statusFilter));

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ColoredBox(
        color: AdminHomePalette.background,
        child: RefreshIndicator(
          color: AdminHomePalette.accent,
          backgroundColor: AdminHomePalette.card,
          onRefresh: () async {
            ref.invalidate(leadStatsProvider);
            ref.invalidate(leadsListProvider(_statusFilter));
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 16, 22, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('CRM', style: AdminHomePalette.editorialLabel),
                            const SizedBox(height: 6),
                            Text('Leads', style: AdminHomePalette.editorialTitle.copyWith(fontSize: 28)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          ref.invalidate(leadStatsProvider);
                          ref.invalidate(leadsListProvider(_statusFilter));
                        },
                        icon: const Icon(Icons.refresh_rounded, color: AdminHomePalette.textSecondary),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: stats.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2)),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 22),
                    child: AdminHomeSurface(
                      child: Text('$e', style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text)),
                    ),
                  ),
                  data: (s) => Padding(
                    padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
                    child: AdminHomeSurface(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _MetricCell(label: 'Total', value: '${s.total}', highlight: true),
                            _MetricDivider(),
                            _MetricCell(label: 'New', value: '${s.newCount}'),
                            _MetricDivider(),
                            _MetricCell(label: 'Contacted', value: '${s.contacted}'),
                            _MetricDivider(),
                            _MetricCell(label: 'Negotiation', value: '${s.negotiation}'),
                            _MetricDivider(),
                            _MetricCell(label: 'Confirmed', value: '${s.confirmed}'),
                            _MetricDivider(),
                            _MetricCell(label: 'Lost', value: '${s.lost}'),
                            _MetricDivider(),
                            _MetricCell(label: 'Conversion', value: '${s.conversionRate}%'),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 22),
                  child: Row(
                    children: [
                      _FilterPill(label: 'All', selected: _statusFilter == null, onTap: () => setState(() => _statusFilter = null)),
                      for (final s in ['NEW', 'CONTACTED', 'NEGOTIATION', 'CONFIRMED', 'LOST', 'ARCHIVED'])
                        _FilterPill(
                          label: leadStatusLabel(s),
                          color: leadStatusColor(s),
                          selected: _statusFilter == s,
                          onTap: () => setState(() => _statusFilter = s),
                        ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 22),
                  child: Row(
                    children: [
                      Text('PIPELINE', style: AdminHomePalette.sectionTitle),
                      const Spacer(),
                      leads.maybeWhen(
                        data: (list) => Text(
                          '${list.length} lead${list.length == 1 ? '' : 's'}',
                          style: AdminHomePalette.statLabel,
                        ),
                        orElse: () => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 14)),
              leads.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2)),
                ),
                error: (e, _) => SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('$e', textAlign: TextAlign.center, style: AdminHomePalette.editorialMeta),
                    ),
                  ),
                ),
                data: (list) {
                  if (list.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Text(
                            'No leads yet.\nNew enquiries will appear here.',
                            textAlign: TextAlign.center,
                            style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.7)),
                          ),
                        ),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(22, 0, 22, 32),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) {
                          final lead = list[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _LeadCard(
                              lead: lead,
                              statusColor: leadStatusColor(lead.status),
                              onTap: () async {
                                ref.read(leadDetailBundleProvider(lead.id).future);
                                await Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => LeadDetailScreen(leadId: lead.id, preview: lead),
                                  ),
                                );
                                ref.invalidate(leadsListProvider(_statusFilter));
                                ref.invalidate(leadStatsProvider);
                              },
                            ),
                          );
                        },
                        childCount: list.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCell extends StatelessWidget {
  const _MetricCell({required this.label, required this.value, this.highlight = false});

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: AdminHomePalette.statValue.copyWith(
              fontSize: 22,
              color: highlight ? AdminHomePalette.accent : AdminHomePalette.text,
            ),
          ),
          const SizedBox(height: 4),
          Text(label.toUpperCase(), style: AdminHomePalette.statLabel),
        ],
      ),
    );
  }
}

class _MetricDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 36,
      color: AdminHomePalette.textSecondary.withValues(alpha: 0.15),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({
    required this.label,
    required this.selected,
    required this.onTap,
    this.color,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AdminHomePalette.accent;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              color: selected ? accent.withValues(alpha: 0.18) : AdminHomePalette.card.withValues(alpha: 0.85),
              border: Border.all(
                color: selected ? accent.withValues(alpha: 0.5) : AdminHomePalette.textSecondary.withValues(alpha: 0.12),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (color != null) ...[
                  _StatusIndicator(color: accent, size: 7),
                  const SizedBox(width: 7),
                ],
                Text(
                  label,
                  style: AdminHomeTypography.inter(
                    fontSize: 12,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    color: selected ? accent : AdminHomePalette.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LeadCard extends StatelessWidget {
  const _LeadCard({
    required this.lead,
    required this.statusColor,
    required this.onTap,
  });

  final LeadSummary lead;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dateLabel = _formatEventDate(lead.eventDate);
    final location = lead.eventLocation.isNotEmpty ? lead.eventLocation : leadStatusLabel(lead.source);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.fromLTRB(10, 11, 14, 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: AdminHomePalette.card.withValues(alpha: 0.88),
            border: Border.all(color: AdminHomePalette.textSecondary.withValues(alpha: 0.1)),
          ),
          child: Row(
            children: [
              _StatusIndicator(color: statusColor, size: 8, barHeight: 32),
              const SizedBox(width: 10),
              if (dateLabel != null) ...[
                SizedBox(
                  width: 34,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dateLabel.$1, style: AdminHomePalette.scheduleTime.copyWith(fontSize: 16, height: 1)),
                      Text(dateLabel.$2, style: AdminHomePalette.statLabel.copyWith(fontSize: 8)),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 28,
                  margin: const EdgeInsets.symmetric(horizontal: 10),
                  color: AdminHomePalette.textSecondary.withValues(alpha: 0.15),
                ),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lead.displayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AdminHomeTypography.inter(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.2),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${lead.phoneNumber} · $location',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AdminHomePalette.editorialMeta.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, size: 18, color: AdminHomePalette.textSecondary.withValues(alpha: 0.45)),
            ],
          ),
        ),
      ),
    );
  }

  (String, String)? _formatEventDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return (d.day.toString().padLeft(2, '0'), months[d.month - 1]);
    } catch (_) {
      return null;
    }
  }
}

class _StatusIndicator extends StatelessWidget {
  const _StatusIndicator({required this.color, this.size = 8, this.barHeight});

  final Color color;
  final double size;
  final double? barHeight;

  @override
  Widget build(BuildContext context) {
    if (barHeight != null) {
      return Container(
        width: 3,
        height: barHeight,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(2),
          boxShadow: [BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 6)],
        ),
      );
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.45), blurRadius: 5)],
      ),
    );
  }
}
