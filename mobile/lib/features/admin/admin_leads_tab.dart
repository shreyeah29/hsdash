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
                            padding: const EdgeInsets.only(bottom: 14),
                            child: _LeadCard(
                              lead: lead,
                              index: i + 1,
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
  const _LeadCard({
    required this.lead,
    required this.index,
    required this.statusColor,
    required this.onTap,
  });

  final LeadSummary lead;
  final int index;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dateLabel = _formatEventDate(lead.eventDate);
    final location = lead.eventLocation.isNotEmpty ? lead.eventLocation : leadStatusLabel(lead.source);
    final initials = _initials(lead.displayName);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        splashColor: statusColor.withValues(alpha: 0.08),
        highlightColor: statusColor.withValues(alpha: 0.04),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AdminHomePalette.card,
                AdminHomePalette.surface.withValues(alpha: 0.95),
              ],
            ),
            border: Border.all(color: statusColor.withValues(alpha: 0.22)),
            boxShadow: [
              BoxShadow(
                color: statusColor.withValues(alpha: 0.08),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              children: [
                Positioned(
                  top: -24,
                  right: -24,
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          statusColor.withValues(alpha: 0.28),
                          statusColor.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  child: Container(width: 3, color: statusColor.withValues(alpha: 0.85)),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      if (dateLabel != null)
                        Container(
                          width: 54,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: statusColor.withValues(alpha: 0.22)),
                          ),
                          child: Column(
                            children: [
                              Text(
                                dateLabel.$1,
                                style: AdminHomePalette.scheduleTime.copyWith(fontSize: 20, height: 1),
                              ),
                              const SizedBox(height: 2),
                              Text(dateLabel.$2, style: AdminHomePalette.statLabel.copyWith(fontSize: 9)),
                            ],
                          ),
                        ),
                      if (dateLabel != null) const SizedBox(width: 14),
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              statusColor.withValues(alpha: 0.35),
                              statusColor.withValues(alpha: 0.12),
                            ],
                          ),
                          border: Border.all(color: statusColor.withValues(alpha: 0.35)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          initials,
                          style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AdminHomePalette.text),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lead.displayName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -0.2),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.phone_in_talk_outlined, size: 13, color: AdminHomePalette.textSecondary),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    lead.phoneNumber,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AdminHomePalette.editorialMeta.copyWith(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.place_outlined, size: 13, color: AdminHomePalette.textSecondary),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    location,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AdminHomePalette.editorialMeta.copyWith(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            _StatusPill(label: leadStatusLabel(lead.status), color: statusColor),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        children: [
                          Text(
                            '#$index',
                            style: AdminHomePalette.statLabel.copyWith(fontSize: 8, color: AdminHomePalette.textSecondary.withValues(alpha: 0.6)),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AdminHomePalette.background.withValues(alpha: 0.6),
                              border: Border.all(color: AdminHomePalette.textSecondary.withValues(alpha: 0.12)),
                            ),
                            child: Icon(
                              Icons.arrow_outward_rounded,
                              size: 16,
                              color: statusColor.withValues(alpha: 0.9),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+&\s+|\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
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
