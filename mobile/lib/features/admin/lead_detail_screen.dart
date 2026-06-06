import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/lead_detail_theme.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/features/admin/lead_status_pipeline.dart';
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
        content: Text(msg, style: AdminHomeTypography.inter(fontSize: 14, color: Colors.white)),
        backgroundColor: LeadDetailPalette.text,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bundleAsync = ref.watch(leadDetailBundleProvider(widget.leadId));

    return LeadDetailBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const SizedBox.shrink(),
          centerTitle: true,
          backgroundColor: Colors.transparent,
          foregroundColor: LeadDetailPalette.text,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: const IconThemeData(color: LeadDetailPalette.text, size: 22),
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
            return const Center(child: CircularProgressIndicator(color: LeadDetailPalette.accent, strokeWidth: 2));
          },
          error: (e, _) => Center(child: Text('$e', style: LeadDetailPalette.meta)),
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
      padding: const EdgeInsets.fromLTRB(
        LeadDetailPalette.pagePaddingH,
        4,
        LeadDetailPalette.pagePaddingH,
        48,
      ),
      children: [
        Text(lead.displayName, style: LeadDetailPalette.leadName),
        const SizedBox(height: 12),
        _StatusPill(status: lead.status),
        const SizedBox(height: 20),
        LeadDetailSurface(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text('CLIENT DETAILS', style: LeadDetailPalette.sectionTitle),
              ),
              _DetailField(label: 'Phone', value: lead.phoneNumber),
              if (lead.email.isNotEmpty) _DetailField(label: 'Email', value: lead.email),
              _DetailField(label: 'Event date', value: _formatDate(lead.eventDate)),
              _DetailField(
                label: 'Location',
                value: lead.eventLocation.isNotEmpty ? lead.eventLocation : '—',
              ),
              _DetailField(label: 'Source', value: lead.source, isLast: lead.assignedToName == null),
              if (lead.assignedToName != null)
                _DetailField(label: 'Assigned', value: lead.assignedToName!, isLast: true),
            ],
          ),
        ),
        if (lead.message.isNotEmpty) ...[
          const SizedBox(height: 16),
          LeadMessageCallout(message: lead.message),
        ],
        const SizedBox(height: LeadDetailPalette.sectionGap),
        LeadStatusPipeline(
          currentStatus: lead.status,
          enabled: !busy,
          onStatusSelected: onSetStatus,
        ),
        if (lead.status == 'CONFIRMED' && !lead.isConverted) ...[
          const SizedBox(height: 16),
          _PrimaryButton(
            label: 'Convert to client',
            onPressed: busy ? null : onConvert,
          ),
        ],
        if (lead.isConverted)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(
              children: [
                Icon(Icons.check_circle_rounded, size: 16, color: LeadDetailPalette.success),
                const SizedBox(width: 6),
                Text(
                  'Converted to calendar entry',
                  style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w600, color: LeadDetailPalette.success),
                ),
              ],
            ),
          ),
        if (lead.status == 'NEGOTIATION') ...[
          const SizedBox(height: 16),
          _SecondaryButton(
            icon: Icons.description_outlined,
            label: quotations.isEmpty ? 'Create quotation' : 'New quotation version',
            onPressed: onOpenQuotationBuilder,
          ),
        ],
        const SizedBox(height: LeadDetailPalette.sectionGap),
        const LeadSectionHeader(title: 'Quotations'),
        if (loadingExtras)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(child: CircularProgressIndicator(color: LeadDetailPalette.accent, strokeWidth: 2)),
          )
        else if (quotations.isEmpty)
          Text('No quotations yet', style: LeadDetailPalette.meta)
        else
          Column(
            children: quotations.map((q) {
              final url = quotationPublicUrl(q.slug);
              final viewed = q.viewCount > 0
                  ? 'Viewed ${q.viewCount}× · ${_formatDateTime(q.lastViewedAt)}'
                  : 'Not yet opened';
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: LeadDetailSurface(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _VersionBadge(version: q.version),
                          const SizedBox(width: 12),
                          Expanded(child: Text(q.packageAmount, style: LeadDetailPalette.quotationValue)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(viewed, style: LeadDetailPalette.caption),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _IconAction(
                            icon: Icons.link_rounded,
                            label: 'Copy link',
                            onTap: () async {
                              await Clipboard.setData(ClipboardData(text: url));
                              if (context.mounted) onSnack('Link copied');
                            },
                          ),
                          const SizedBox(width: 10),
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
        const SizedBox(height: LeadDetailPalette.sectionGap),
        const LeadSectionHeader(title: 'Notes'),
        LeadNoteComposer(
          controller: noteController,
          busy: busy,
          onSubmit: onAddNote,
        ),
        if (loadingExtras)
          const Padding(
            padding: EdgeInsets.only(top: 20),
            child: Center(child: CircularProgressIndicator(color: LeadDetailPalette.accent, strokeWidth: 2)),
          )
        else ...[
          ...lead.notes.map(
            (n) => LeadNoteBubble(
              author: n.authorName,
              time: _formatDateTime(n.createdAt),
              content: n.content,
            ),
          ),
          const SizedBox(height: LeadDetailPalette.sectionGap),
          const LeadSectionHeader(title: 'Timeline'),
          _ActivityTimeline(activities: lead.activities),
        ],
      ],
    );
  }
}

class _DetailField extends StatelessWidget {
  const _DetailField({required this.label, required this.value, this.isLast = false});

  final String label;
  final String value;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 82,
            child: Text(label, style: LeadDetailPalette.fieldLabel),
          ),
          Expanded(
            child: Text(value, style: LeadDetailPalette.fieldValue.copyWith(fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = leadStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(leadStatusIcon(status), size: 13, color: color),
          const SizedBox(width: 6),
          Text(
            leadStatusLabel(status).toUpperCase(),
            style: AdminHomeTypography.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.9,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _VersionBadge extends StatelessWidget {
  const _VersionBadge({required this.version});

  final int version;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: LeadDetailPalette.accentSoft,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'V$version',
        style: AdminHomeTypography.inter(fontSize: 11, fontWeight: FontWeight.w700, color: LeadDetailPalette.accent),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: LeadDetailPalette.accent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 17),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: Text(label, style: AdminHomeTypography.inter(fontSize: 15, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  const _SecondaryButton({required this.icon, required this.label, required this.onPressed});

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: LeadDetailPalette.accentSoft,
            border: Border.all(color: LeadDetailPalette.accent.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: LeadDetailPalette.accent),
              const SizedBox(width: 8),
              Text(label, style: AdminHomeTypography.inter(fontSize: 15, fontWeight: FontWeight.w600, color: LeadDetailPalette.accent)),
            ],
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
        borderRadius: BorderRadius.circular(10),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: LeadDetailPalette.mutedFill,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 15, color: LeadDetailPalette.accent),
              const SizedBox(width: 6),
              Text(label, style: AdminHomeTypography.inter(fontSize: 13, fontWeight: FontWeight.w600, color: LeadDetailPalette.text)),
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
      return Text('No activity yet', style: LeadDetailPalette.meta);
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

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 22,
            child: Column(
              children: [
                Container(
                  width: 9,
                  height: 9,
                  margin: const EdgeInsets.only(top: 5),
                  decoration: BoxDecoration(shape: BoxShape.circle, color: color),
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 52,
                    margin: const EdgeInsets.symmetric(vertical: 5),
                    color: LeadDetailPalette.border,
                  ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        _activityTitle(activity.kind),
                        style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w600, color: color),
                      ),
                    ),
                    Text(_formatDateTime(activity.createdAt), style: LeadDetailPalette.caption),
                  ],
                ),
                if (activity.message.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    activity.message,
                    style: LeadDetailPalette.body.copyWith(fontWeight: FontWeight.w400, fontSize: 13),
                  ),
                ],
                if (activity.actorName != null) ...[
                  const SizedBox(height: 4),
                  Text(activity.actorName!, style: LeadDetailPalette.caption),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Color _activityColor(String kind) {
    if (kind.contains('QUOTATION')) return LeadDetailPalette.warning;
    if (kind == 'STATUS_CHANGED') return LeadDetailPalette.accent;
    if (kind == 'CONVERTED') return LeadDetailPalette.success;
    if (kind == 'NOTE_ADDED') return const Color(0xFF6366F1);
    return LeadDetailPalette.textSecondary;
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
