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

  static Color _statusColor(String status) {
    switch (status) {
      case 'NEW':
        return AdminHomePalette.accent;
      case 'CONTACTED':
        return const Color(0xFF60A5FA);
      case 'NEGOTIATION':
        return const Color(0xFFFBBF24);
      case 'CONFIRMED':
        return const Color(0xFF34D399);
      case 'LOST':
        return const Color(0xFFFB7185);
      default:
        return AdminHomePalette.textSecondary;
    }
  }

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
                    child: Wrap(
                      spacing: 20,
                      runSpacing: 16,
                      children: [
                        _MetricItem(label: 'Total', value: '${s.total}'),
                        _MetricItem(label: 'New', value: '${s.newCount}'),
                        _MetricItem(label: 'Contacted', value: '${s.contacted}'),
                        _MetricItem(label: 'Negotiation', value: '${s.negotiation}'),
                        _MetricItem(label: 'Confirmed', value: '${s.confirmed}'),
                        _MetricItem(label: 'Lost', value: '${s.lost}'),
                        _MetricItem(label: 'Conversion', value: '${s.conversionRate}%'),
                      ],
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
                  child: Text('PIPELINE', style: AdminHomePalette.sectionTitle),
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
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _LeadCard(
                              lead: lead,
                              statusColor: _statusColor(lead.status),
                              onTap: () async {
                                await Navigator.of(context).push(
                                  MaterialPageRoute<void>(builder: (_) => LeadDetailScreen(leadId: lead.id)),
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

class _MetricItem extends StatelessWidget {
  const _MetricItem({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: AdminHomePalette.statValue.copyWith(fontSize: 24)),
          const SizedBox(height: 4),
          Text(label.toUpperCase(), style: AdminHomePalette.statLabel),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              color: selected ? AdminHomePalette.accent.withValues(alpha: 0.18) : AdminHomePalette.card.withValues(alpha: 0.85),
              border: Border.all(
                color: selected ? AdminHomePalette.accent.withValues(alpha: 0.45) : AdminHomePalette.textSecondary.withValues(alpha: 0.12),
              ),
            ),
            child: Text(
              label,
              style: AdminHomeTypography.inter(
                fontSize: 12,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                color: selected ? AdminHomePalette.accent : AdminHomePalette.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LeadCard extends StatelessWidget {
  const _LeadCard({required this.lead, required this.statusColor, required this.onTap});

  final LeadSummary lead;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dateLabel = _formatEventDate(lead.eventDate);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AdminHomePalette.radiusMd),
        child: AdminHomeSurface(
          padding: const EdgeInsets.all(18),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (dateLabel != null)
                SizedBox(
                  width: 48,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dateLabel.$1, style: AdminHomePalette.scheduleTime.copyWith(fontSize: 18)),
                      Text(dateLabel.$2, style: AdminHomePalette.statLabel),
                    ],
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(lead.displayName, style: AdminHomePalette.editorialTitle.copyWith(fontSize: 17)),
                    const SizedBox(height: 6),
                    Text(
                      '${lead.phoneNumber} · ${lead.eventLocation.isNotEmpty ? lead.eventLocation : leadStatusLabel(lead.source)}',
                      style: AdminHomePalette.editorialMeta,
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _StatusPill(label: leadStatusLabel(lead.status), color: statusColor),
                  const SizedBox(height: 12),
                  Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AdminHomePalette.textSecondary.withValues(alpha: 0.5)),
                ],
              ),
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

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        label.toUpperCase(),
        style: AdminHomeTypography.inter(fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: color),
      ),
    );
  }
}
