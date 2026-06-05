import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/features/admin/quotation_builder_screen.dart';
import 'package:hsdash_mobile/models/lead.dart';
import 'package:hsdash_mobile/models/quotation.dart';

class LeadDetailScreen extends ConsumerStatefulWidget {
  const LeadDetailScreen({super.key, required this.leadId, this.preview});

  final String leadId;
  final LeadSummary? preview;

  @override
  ConsumerState<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends ConsumerState<LeadDetailScreen> {
  final _noteController = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _invalidateLead() {
    ref.invalidate(leadDetailBundleProvider(widget.leadId));
  }

  Future<void> _setStatus(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(leadsRepositoryProvider).updateLead(widget.leadId, status: status);
      _invalidateLead();
    } catch (e) {
      if (mounted) _snack('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addNote() async {
    final text = _noteController.text.trim();
    if (text.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(leadsRepositoryProvider).addNote(widget.leadId, text);
      _noteController.clear();
      _invalidateLead();
    } catch (e) {
      if (mounted) _snack('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _convert() async {
    setState(() => _busy = true);
    try {
      await ref.read(leadsRepositoryProvider).convertLead(widget.leadId);
      _invalidateLead();
      if (mounted) _snack('Lead converted — shoot added to calendar');
    } catch (e) {
      if (mounted) _snack('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AdminHomePalette.card,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bundleAsync = ref.watch(leadDetailBundleProvider(widget.leadId));

    return Scaffold(
      backgroundColor: AdminHomePalette.background,
      appBar: AppBar(
        title: Text('Lead', style: AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600)),
        backgroundColor: AdminHomePalette.background,
        foregroundColor: AdminHomePalette.text,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: bundleAsync.when(
        loading: () {
          if (widget.preview != null) {
            return _LeadDetailBody(
              lead: LeadDetail.fromSummary(widget.preview!),
              quotations: const [],
              busy: _busy,
              loadingExtras: true,
              noteController: _noteController,
              onSetStatus: _setStatus,
              onAddNote: _addNote,
              onConvert: _convert,
              onSnack: _snack,
              onOpenQuotationBuilder: () => _openQuotationBuilder(widget.preview!),
              leadId: widget.leadId,
            );
          }
          return const Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2));
        },
        error: (e, _) => Center(child: Text('$e', style: AdminHomePalette.editorialMeta)),
        data: (bundle) => _LeadDetailBody(
          lead: bundle.lead,
          quotations: bundle.quotations,
          busy: _busy,
          loadingExtras: false,
          noteController: _noteController,
          onSetStatus: _setStatus,
          onAddNote: _addNote,
          onConvert: _convert,
          onSnack: _snack,
          onOpenQuotationBuilder: () => _openQuotationBuilder(bundle.lead),
          leadId: widget.leadId,
        ),
      ),
    );
  }

  Future<void> _openQuotationBuilder(LeadSummary lead) async {
    final refreshed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => QuotationBuilderScreen(lead: lead)),
    );
    if (refreshed == true) _invalidateLead();
  }
}

class _LeadDetailBody extends StatelessWidget {
  const _LeadDetailBody({
    required this.lead,
    required this.quotations,
    required this.busy,
    required this.loadingExtras,
    required this.noteController,
    required this.onSetStatus,
    required this.onAddNote,
    required this.onConvert,
    required this.onSnack,
    required this.onOpenQuotationBuilder,
    required this.leadId,
  });

  final LeadDetail lead;
  final List<QuotationSummary> quotations;
  final bool busy;
  final bool loadingExtras;
  final TextEditingController noteController;
  final Future<void> Function(String status) onSetStatus;
  final Future<void> Function() onAddNote;
  final Future<void> Function() onConvert;
  final void Function(String msg) onSnack;
  final Future<void> Function() onOpenQuotationBuilder;
  final String leadId;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 0, 22, 40),
      children: [
        AdminHomeSurface(
          padding: const EdgeInsets.all(14),
          radius: AdminHomePalette.radiusSm,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(lead.displayName, style: AdminHomePalette.editorialTitle.copyWith(fontSize: 18)),
                  ),
                  _StatusPill(label: leadStatusLabel(lead.status), color: leadStatusColor(lead.status)),
                ],
              ),
              const SizedBox(height: 10),
              _DetailRow(icon: Icons.phone_outlined, label: 'Phone', value: lead.phoneNumber),
              if (lead.email.isNotEmpty) _DetailRow(icon: Icons.mail_outline, label: 'Email', value: lead.email),
              _DetailRow(icon: Icons.event_outlined, label: 'Event date', value: _formatDate(lead.eventDate)),
              _DetailRow(icon: Icons.location_on_outlined, label: 'Location', value: lead.eventLocation.isNotEmpty ? lead.eventLocation : '—'),
              _DetailRow(icon: Icons.language_outlined, label: 'Source', value: lead.source),
              if (lead.assignedToName != null) _DetailRow(icon: Icons.person_outline, label: 'Assigned', value: lead.assignedToName!),
            ],
          ),
        ),
        if (lead.message.isNotEmpty) ...[
          const SizedBox(height: 10),
          AdminHomeSurface(
            padding: const EdgeInsets.all(14),
            radius: AdminHomePalette.radiusSm,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MESSAGE', style: AdminHomePalette.sectionTitle),
                const SizedBox(height: 6),
                Text(lead.message, style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.9), height: 1.45, fontSize: 13)),
              ],
            ),
          ),
        ],
        const SizedBox(height: 18),
        Text('UPDATE STATUS', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final s in ['NEW', 'CONTACTED', 'NEGOTIATION', 'CONFIRMED', 'LOST', 'ARCHIVED'])
              _StatusChip(
                label: leadStatusLabel(s),
                selected: lead.status == s,
                color: leadStatusColor(s),
                onTap: busy ? null : () => onSetStatus(s),
              ),
          ],
        ),
        if (lead.status == 'CONFIRMED' && !lead.isConverted) ...[
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: busy ? null : onConvert,
              style: FilledButton.styleFrom(
                backgroundColor: AdminHomePalette.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AdminHomePalette.radiusSm)),
              ),
              child: const Text('Convert to client', style: TextStyle(fontWeight: FontWeight.w600, letterSpacing: 0.3)),
            ),
          ),
        ],
        if (lead.isConverted)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Text(
              'Converted to calendar entry',
              style: AdminHomeTypography.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF34D399)),
            ),
          ),
        if (lead.status == 'NEGOTIATION') ...[
          const SizedBox(height: 20),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onOpenQuotationBuilder,
              borderRadius: BorderRadius.circular(AdminHomePalette.radiusSm),
              child: Ink(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AdminHomePalette.radiusSm),
                  border: Border.all(color: AdminHomePalette.accent.withValues(alpha: 0.4)),
                  color: AdminHomePalette.accent.withValues(alpha: 0.08),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.description_outlined, size: 18, color: AdminHomePalette.accent),
                    const SizedBox(width: 8),
                    Text(
                      quotations.isEmpty ? 'Create quotation' : 'New quotation version',
                      style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AdminHomePalette.accent),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
        Text('QUOTATIONS', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 12),
        if (loadingExtras)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2)),
          )
        else if (quotations.isEmpty)
          Text(
            'No quotations yet',
            style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.textSecondary),
          )
        else
          Column(
            children: quotations.map((q) {
              final url = quotationPublicUrl(q.slug);
              final viewed = q.viewCount > 0
                  ? 'Viewed ${q.viewCount}× · ${_formatDateTime(q.lastViewedAt)}'
                  : 'Not yet opened';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AdminHomeSurface(
                  padding: const EdgeInsets.all(12),
                  radius: AdminHomePalette.radiusSm,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: AdminHomePalette.accent.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'V${q.version}',
                              style: AdminHomeTypography.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AdminHomePalette.accent),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(q.packageAmount, style: AdminHomeTypography.inter(fontSize: 12, fontWeight: FontWeight.w500)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(viewed, style: AdminHomePalette.editorialMeta.copyWith(fontSize: 11)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _IconAction(
                            icon: Icons.link_rounded,
                            label: 'Link',
                            onTap: () async {
                              await Clipboard.setData(ClipboardData(text: url));
                              if (context.mounted) onSnack('Link copied');
                            },
                          ),
                          const SizedBox(width: 8),
                          _IconAction(
                            icon: Icons.chat_bubble_outline_rounded,
                            label: 'WhatsApp',
                            onTap: () async {
                              await Clipboard.setData(ClipboardData(text: quotationWhatsAppMessage(lead.displayName, url)));
                              if (context.mounted) onSnack('WhatsApp message copied');
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        const SizedBox(height: 20),
        Text('NOTES', style: AdminHomePalette.sectionTitle),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Theme(
                data: Theme.of(context).copyWith(
                  brightness: Brightness.dark,
                  textSelectionTheme: TextSelectionThemeData(
                    cursorColor: AdminHomePalette.accent,
                    selectionColor: AdminHomePalette.accent.withValues(alpha: 0.35),
                  ),
                  inputDecorationTheme: InputDecorationTheme(
                    filled: true,
                    fillColor: AdminHomePalette.card,
                    hintStyle: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.textSecondary),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.25)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.25)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AdminHomePalette.accent.withValues(alpha: 0.65)),
                    ),
                  ),
                ),
                child: TextField(
                  controller: noteController,
                  minLines: 1,
                  maxLines: 3,
                  style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.text),
                  cursorColor: AdminHomePalette.accent,
                  decoration: const InputDecoration(hintText: 'Add follow-up note…'),
                  onSubmitted: (_) => onAddNote(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              style: IconButton.styleFrom(
                backgroundColor: AdminHomePalette.accent,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AdminHomePalette.card,
              ),
              onPressed: busy ? null : onAddNote,
              icon: const Icon(Icons.send_rounded, size: 18),
            ),
          ],
        ),
        if (loadingExtras)
          const Padding(
            padding: EdgeInsets.only(top: 16),
            child: Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2)),
          )
        else ...[
          ...lead.notes.map(
            (n) => Padding(
              padding: const EdgeInsets.only(top: 8),
              child: AdminHomeSurface(
                padding: const EdgeInsets.all(12),
                radius: AdminHomePalette.radiusSm,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${n.authorName} · ${_formatDateTime(n.createdAt)}',
                      style: AdminHomePalette.statLabel.copyWith(fontSize: 9),
                    ),
                    const SizedBox(height: 4),
                    Text(n.content, style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.92), height: 1.4, fontSize: 13)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('TIMELINE', style: AdminHomePalette.sectionTitle),
          const SizedBox(height: 16),
          _ActivityTimeline(activities: lead.activities),
        ],
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: AdminHomePalette.textSecondary),
          const SizedBox(width: 8),
          SizedBox(
            width: 68,
            child: Text(label, style: AdminHomePalette.statLabel.copyWith(fontSize: 9)),
          ),
          Expanded(
            child: Text(value, style: AdminHomeTypography.inter(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
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

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.selected, required this.color, this.onTap});

  final String label;
  final bool selected;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: selected ? color.withValues(alpha: 0.18) : AdminHomePalette.card.withValues(alpha: 0.6),
            border: Border.all(color: selected ? color.withValues(alpha: 0.5) : AdminHomePalette.textSecondary.withValues(alpha: 0.12)),
          ),
          child: Text(
            label,
            style: AdminHomeTypography.inter(
              fontSize: 12,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              color: selected ? color : AdminHomePalette.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: AdminHomePalette.surface.withValues(alpha: 0.8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: AdminHomePalette.textSecondary),
              const SizedBox(width: 6),
              Text(label, style: AdminHomeTypography.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AdminHomePalette.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityTimeline extends StatelessWidget {
  const _ActivityTimeline({required this.activities});

  final List<LeadActivity> activities;

  @override
  Widget build(BuildContext context) {
    if (activities.isEmpty) {
      return Text('No activity yet', style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.textSecondary));
    }

    return Column(
      children: [
        for (var i = 0; i < activities.length; i++)
          _TimelineEntry(
            activity: activities[i],
            isLast: i == activities.length - 1,
          ),
      ],
    );
  }
}

class _TimelineEntry extends StatelessWidget {
  const _TimelineEntry({required this.activity, required this.isLast});

  final LeadActivity activity;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final color = _activityColor(activity.kind);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(shape: BoxShape.circle, color: color),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: AdminHomePalette.textSecondary.withValues(alpha: 0.15),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: AdminHomeSurface(
                padding: const EdgeInsets.all(14),
                radius: AdminHomePalette.radiusSm,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _activityTitle(activity.kind),
                            style: AdminHomeTypography.inter(fontSize: 13, fontWeight: FontWeight.w600, color: color),
                          ),
                        ),
                        Text(
                          _formatDateTime(activity.createdAt),
                          style: AdminHomePalette.statLabel.copyWith(fontSize: 8),
                        ),
                      ],
                    ),
                    if (activity.message.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        activity.message,
                        style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.88), height: 1.4, fontSize: 12),
                      ),
                    ],
                    if (activity.actorName != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        activity.actorName!,
                        style: AdminHomePalette.statLabel.copyWith(fontSize: 8, color: AdminHomePalette.textSecondary),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Color _activityColor(String kind) {
    if (kind.contains('QUOTATION')) return const Color(0xFFFBBF24);
    if (kind == 'STATUS_CHANGED') return AdminHomePalette.accent;
    if (kind == 'CONVERTED') return const Color(0xFF34D399);
    if (kind == 'NOTE_ADDED') return const Color(0xFF60A5FA);
    return AdminHomePalette.textSecondary;
  }
}

String _activityTitle(String kind) {
  return kind
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}

String _formatDate(String iso) {
  try {
    final d = DateTime.parse(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  } catch (_) {
    return iso.split('T').first;
  }
}

String _formatDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  try {
    final d = DateTime.parse(iso).toLocal();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final h = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    final min = d.minute.toString().padLeft(2, '0');
    return '${d.day} ${months[d.month - 1]} ${d.year} · $h:$min $ampm';
  } catch (_) {
    return iso;
  }
}
