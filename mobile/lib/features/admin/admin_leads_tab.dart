import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/leads_export.dart';
import 'package:hsdash_mobile/core/spreadsheet_export.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/admin/lead_detail_screen.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/models/lead.dart';
import 'package:intl/intl.dart';

const _segments = <(String?, String)>[
  (null, 'All'),
  ('NEW', 'New'),
  ('CONTACTED', 'Contacted'),
  ('NEGOTIATION', 'Negotiation'),
  ('CONFIRMED', 'Confirmed'),
];

class AdminLeadsTab extends ConsumerStatefulWidget {
  const AdminLeadsTab({super.key});

  @override
  ConsumerState<AdminLeadsTab> createState() => _AdminLeadsTabState();
}

class _AdminLeadsTabState extends ConsumerState<AdminLeadsTab> {
  String? _statusFilter;
  String _search = '';
  final _searchController = TextEditingController();

  LeadsListQuery get _query => LeadsListQuery(status: _statusFilter, search: _search);

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    watchAdminPalette(ref);
    final leads = ref.watch(leadsListProvider(_query));

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AdminHomePalette.lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: RefreshIndicator(
          color: AdminHomePalette.accent,
          backgroundColor: AdminHomePalette.card,
          onRefresh: () async => ref.invalidate(leadsListProvider(_query)),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 14, 22, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('CRM', style: AdminHomePalette.sectionTitle.copyWith(fontSize: 11)),
                                const SizedBox(height: 6),
                                Text('Leads', style: AdminHomePalette.pageTitle.copyWith(fontSize: 30)),
                                const SizedBox(height: 6),
                                Text(
                                  'Manage enquiries and bookings.',
                                  style: AdminHomePalette.editorialMeta.copyWith(
                                    fontSize: 14,
                                    color: AdminHomePalette.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            tooltip: 'Export Excel',
                            onPressed: () => _exportLeads(context),
                            icon: Icon(Icons.ios_share_rounded, color: AdminHomePalette.textMuted, size: 22),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      TextField(
                        controller: _searchController,
                        onChanged: (v) => setState(() => _search = v.trim()),
                        style: AdminHomeTypography.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: AdminHomePalette.text,
                        ),
                        cursorColor: AdminHomePalette.accent,
                        decoration: InputDecoration(
                          hintText: 'Search client, event or phone',
                          hintStyle: AdminHomeTypography.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: AdminHomePalette.textMuted,
                          ),
                          prefixIcon: Icon(Icons.search_rounded, size: 22, color: AdminHomePalette.textMuted),
                          filled: true,
                          fillColor: AdminHomePalette.surface,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide(color: AdminHomePalette.cardBorder),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide(color: AdminHomePalette.cardBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide(color: AdminHomePalette.accent, width: 1.5),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _PipelineSegmentedControl(
                        selected: _statusFilter,
                        onChanged: (v) => setState(() => _statusFilter = v),
                      ),
                      const SizedBox(height: 18),
                    ],
                  ),
                ),
              ),
              leads.when(
                loading: () => SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2),
                  ),
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
                            _search.isNotEmpty
                                ? 'No leads match your search.'
                                : 'No leads yet.\nNew enquiries will appear here.',
                            textAlign: TextAlign.center,
                            style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.textMuted),
                          ),
                        ),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(22, 0, 22, 88),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) {
                          final lead = list[i];
                          return Padding(
                            padding: EdgeInsets.only(bottom: i < list.length - 1 ? 10 : 0),
                            child: _LeadCard(
                              lead: lead,
                              onTap: () => _openLead(context, ref, lead),
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

  Future<void> _openLead(BuildContext context, WidgetRef ref, LeadSummary lead) async {
    ref.read(leadDetailBundleProvider(lead.id).future);
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => LeadDetailScreen(leadId: lead.id, preview: lead),
      ),
    );
    ref.invalidate(leadsListProvider(_query));
    ref.invalidate(leadStatsProvider);
  }

  Future<void> _exportLeads(BuildContext context) async {
    try {
      final allLeads = await ref.read(leadsRepositoryProvider).fetchLeads();
      if (!context.mounted) return;
      final stamp = DateFormat('yyyy-MM-dd').format(DateTime.now());
      await shareSpreadsheet(
        context: context,
        filename: 'leads-$stamp.csv',
        columns: leadsExportColumns,
        rows: buildLeadsExportRows(allLeads),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e')));
    }
  }
}

class _PipelineSegmentedControl extends StatelessWidget {
  const _PipelineSegmentedControl({required this.selected, required this.onChanged});

  final String? selected;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AdminHomePalette.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AdminHomePalette.cardBorder),
      ),
      child: Row(
        children: [
          for (var i = 0; i < _segments.length; i++) ...[
            Expanded(
              child: _Segment(
                label: _segments[i].$2,
                status: _segments[i].$1,
                selected: selected == _segments[i].$1,
                onTap: () => onChanged(_segments[i].$1),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({
    required this.label,
    required this.status,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String? status;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = status != null ? leadStatusColor(status!) : null;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 4),
        decoration: BoxDecoration(
          color: selected ? AdminHomePalette.card : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: selected && !AdminHomePalette.isStudio
              ? AdminHomePalette.elevationDeep
              : (selected
                  ? [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (statusColor != null) ...[
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 5),
            ],
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AdminHomeTypography.inter(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w700,
                  color: selected ? AdminHomePalette.text : AdminHomePalette.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LeadCard extends StatelessWidget {
  const _LeadCard({required this.lead, required this.onTap});

  final LeadSummary lead;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pipeline = leadStatusLabel(lead.status);
    final followUp = _followUpLabel(lead);
    final eventDate = _formatEventDate(lead.eventDate);
    final location = lead.eventLocation.trim().isNotEmpty ? lead.eventLocation.trim() : '—';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: AdminHomePalette.card,
            border: Border.all(color: AdminHomePalette.cardBorder),
            boxShadow: AdminHomePalette.elevationDeep,
          ),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _PipelineBar(status: lead.status),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lead.displayName.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AdminHomeTypography.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                          color: AdminHomePalette.text,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        [_eventTypeLabel(lead.eventType), location, if (eventDate != null) eventDate]
                            .join('  ·  '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AdminHomeTypography.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AdminHomePalette.textSecondary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Text(
                            pipeline,
                            style: AdminHomeTypography.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AdminHomePalette.text,
                            ),
                          ),
                          if (followUp.isNotEmpty) ...[
                            Text(
                              '  ·  ',
                              style: TextStyle(color: AdminHomePalette.textMuted.withValues(alpha: 0.6)),
                            ),
                            Flexible(
                              child: Text(
                                followUp,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AdminHomeTypography.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: AdminHomePalette.textMuted,
                                ),
                              ),
                            ),
                          ],
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
}

class _PipelineBar extends StatelessWidget {
  const _PipelineBar({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 3,
      decoration: BoxDecoration(
        color: _pipelineIndicatorColor(status),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}

Color _pipelineIndicatorColor(String status) => leadStatusColor(status);

String _eventTypeLabel(String type) {
  switch (type) {
    case 'WEDDING':
      return 'Wedding';
    case 'CORPORATE':
      return 'Corporate';
    case 'BIRTHDAY':
      return 'Birthday';
    default:
      if (type.isEmpty) return 'Event';
      return type[0].toUpperCase() + type.substring(1).toLowerCase();
  }
}

String? _formatEventDate(String iso) {
  if (iso.trim().isEmpty) return null;
  try {
    return formatFriendlyDay(iso.contains('T') ? calendarDayKeyFromIso(iso) : iso);
  } catch (_) {
    return null;
  }
}

String _followUpLabel(LeadSummary lead) {
  if (lead.status == 'CONFIRMED' || lead.status == 'LOST' || lead.status == 'ARCHIVED') {
    return '';
  }

  final created = DateTime.tryParse(lead.createdAt)?.toLocal();
  if (created == null) return 'Follow up soon';

  final today = DateTime.now();
  final createdDay = DateTime(created.year, created.month, created.day);
  final elapsed = DateTime(today.year, today.month, today.day).difference(createdDay).inDays;

  switch (lead.status) {
    case 'NEW':
      if (elapsed <= 0) return 'Follow up today';
      if (elapsed == 1) return 'Follow up today';
      return 'Follow up overdue';
    case 'CONTACTED':
      return elapsed >= 2 ? 'Follow up tomorrow' : 'Follow up this week';
    case 'NEGOTIATION':
      return 'Follow up tomorrow';
    default:
      return 'Follow up soon';
  }
}
