import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/models/lead.dart';

class LeadDetailScreen extends ConsumerStatefulWidget {
  const LeadDetailScreen({super.key, required this.leadId});

  final String leadId;

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

  Future<void> _setStatus(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(leadsRepositoryProvider).updateLead(widget.leadId, status: status);
      ref.invalidate(leadDetailProvider(widget.leadId));
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
      ref.invalidate(leadDetailProvider(widget.leadId));
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
      ref.invalidate(leadDetailProvider(widget.leadId));
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
    final leadAsync = ref.watch(leadDetailProvider(widget.leadId));
    final quotationsAsync = ref.watch(leadQuotationsProvider(widget.leadId));

    return Scaffold(
      backgroundColor: AdminHomePalette.background,
      appBar: AppBar(
        title: Text('Lead', style: AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600)),
        backgroundColor: AdminHomePalette.background,
        foregroundColor: AdminHomePalette.text,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: leadAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2)),
        error: (e, _) => Center(child: Text('$e', style: AdminHomePalette.editorialMeta)),
        data: (lead) => ListView(
          padding: const EdgeInsets.fromLTRB(22, 0, 22, 40),
          children: [
            AdminHomeSurface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(lead.displayName, style: AdminHomePalette.editorialTitle.copyWith(fontSize: 24)),
                      ),
                      _StatusPill(label: leadStatusLabel(lead.status), color: _statusColor(lead.status)),
                    ],
                  ),
                  const SizedBox(height: 18),
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
              const SizedBox(height: 16),
              AdminHomeSurface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('MESSAGE', style: AdminHomePalette.sectionTitle),
                    const SizedBox(height: 10),
                    Text(lead.message, style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.9), height: 1.5)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
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
                    color: _statusColor(s),
                    onTap: _busy ? null : () => _setStatus(s),
                  ),
              ],
            ),
            if (lead.status == 'CONFIRMED' && !lead.isConverted) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _busy ? null : _convert,
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
                  onTap: () async {
                    final url = quotationBuilderUrl(widget.leadId);
                    await Clipboard.setData(ClipboardData(text: url));
                    if (context.mounted) _snack('Builder link copied — open in browser');
                  },
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
                          'Create quotation',
                          style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AdminHomePalette.accent),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 28),
            Text('QUOTATIONS', style: AdminHomePalette.sectionTitle),
            const SizedBox(height: 12),
            quotationsAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2)),
              ),
              error: (e, _) => Text('$e', style: AdminHomePalette.editorialMeta),
              data: (quotes) {
                if (quotes.isEmpty) {
                  return Text(
                    'No quotations yet',
                    style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.textSecondary),
                  );
                }
                return Column(
                  children: quotes.map((q) {
                    final url = quotationPublicUrl(q.slug);
                    final viewed = q.viewCount > 0
                        ? 'Viewed ${q.viewCount}× · ${_formatDateTime(q.lastViewedAt)}'
                        : 'Not yet opened';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AdminHomeSurface(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AdminHomePalette.accent.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'V${q.version}',
                                    style: AdminHomeTypography.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AdminHomePalette.accent),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(q.packageAmount, style: AdminHomeTypography.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(viewed, style: AdminHomePalette.editorialMeta.copyWith(fontSize: 12)),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                _IconAction(
                                  icon: Icons.link_rounded,
                                  label: 'Link',
                                  onTap: () async {
                                    await Clipboard.setData(ClipboardData(text: url));
                                    if (context.mounted) _snack('Link copied');
                                  },
                                ),
                                const SizedBox(width: 8),
                                _IconAction(
                                  icon: Icons.chat_bubble_outline_rounded,
                                  label: 'WhatsApp',
                                  onTap: () async {
                                    await Clipboard.setData(ClipboardData(text: quotationWhatsAppMessage(lead.displayName, url)));
                                    if (context.mounted) _snack('WhatsApp message copied');
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 28),
            Text('NOTES', style: AdminHomePalette.sectionTitle),
            const SizedBox(height: 12),
            AdminHomeSurface(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _noteController,
                      style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.text),
                      decoration: InputDecoration(
                        hintText: 'Add follow-up note…',
                        hintStyle: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.textSecondary),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      onSubmitted: (_) => _addNote(),
                    ),
                  ),
                  IconButton(
                    onPressed: _busy ? null : _addNote,
                    icon: Icon(Icons.send_rounded, color: _busy ? AdminHomePalette.textSecondary : AdminHomePalette.accent),
                  ),
                ],
              ),
            ),
            ...lead.notes.map(
              (n) => Padding(
                padding: const EdgeInsets.only(top: 10),
                child: AdminHomeSurface(
                  padding: const EdgeInsets.all(14),
                  radius: AdminHomePalette.radiusSm,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${n.authorName} · ${_formatDateTime(n.createdAt)}',
                        style: AdminHomePalette.statLabel.copyWith(fontSize: 9),
                      ),
                      const SizedBox(height: 6),
                      Text(n.content, style: AdminHomePalette.editorialMeta.copyWith(color: AdminHomePalette.text.withValues(alpha: 0.92), height: 1.45)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),
            Text('TIMELINE', style: AdminHomePalette.sectionTitle),
            const SizedBox(height: 16),
            _ActivityTimeline(activities: lead.activities),
          ],
        ),
      ),
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
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AdminHomePalette.textSecondary),
          const SizedBox(width: 10),
          SizedBox(
            width: 72,
            child: Text(label, style: AdminHomePalette.statLabel.copyWith(fontSize: 9)),
          ),
          Expanded(
            child: Text(value, style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w500)),
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
