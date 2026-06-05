import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/config/theme.dart';
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

  Future<void> _setStatus(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(leadsRepositoryProvider).updateLead(widget.leadId, status: status);
      ref.invalidate(leadDetailProvider(widget.leadId));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
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
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _convert() async {
    setState(() => _busy = true);
    try {
      await ref.read(leadsRepositoryProvider).convertLead(widget.leadId);
      ref.invalidate(leadDetailProvider(widget.leadId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lead converted — shoot added to calendar')),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final leadAsync = ref.watch(leadDetailProvider(widget.leadId));
    final quotationsAsync = ref.watch(leadQuotationsProvider(widget.leadId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Lead details'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: leadAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        error: (e, _) => Center(child: Text('$e')),
        data: (lead) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(lead.displayName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(leadStatusLabel(lead.status), style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w600)),
            const SizedBox(height: 20),
            _InfoRow('Phone', lead.phoneNumber),
            if (lead.email.isNotEmpty) _InfoRow('Email', lead.email),
            _InfoRow('Event date', lead.eventDate.split('T').first),
            _InfoRow('Location', lead.eventLocation),
            _InfoRow('Source', lead.source),
            if (lead.assignedToName != null) _InfoRow('Assigned', lead.assignedToName!),
            if (lead.message.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text('Message', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
              const SizedBox(height: 6),
              Text(lead.message),
            ],
            const SizedBox(height: 20),
            const Text('Update status', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in ['NEW', 'CONTACTED', 'NEGOTIATION', 'CONFIRMED', 'LOST', 'ARCHIVED'])
                  ActionChip(
                    label: Text(leadStatusLabel(s)),
                    backgroundColor: lead.status == s ? AppColors.violet.withValues(alpha: 0.15) : null,
                    onPressed: _busy ? null : () => _setStatus(s),
                  ),
              ],
            ),
            if (lead.status == 'CONFIRMED' && !lead.isConverted) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _busy ? null : _convert,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.violet, padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: const Text('Convert to client'),
                ),
              ),
            ],
            if (lead.isConverted)
              const Padding(
                padding: EdgeInsets.only(top: 16),
                child: Text('Converted to calendar entry', style: TextStyle(color: AppColors.emerald, fontWeight: FontWeight.w600)),
              ),
            if (lead.status == 'NEGOTIATION') ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final url = quotationBuilderUrl(widget.leadId);
                    await Clipboard.setData(ClipboardData(text: url));
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Builder link copied — open in browser to create quotation')),
                      );
                    }
                  },
                  icon: const Icon(Icons.description_outlined),
                  label: const Text('Create quotation (web)'),
                ),
              ),
            ],
            const SizedBox(height: 24),
            const Text('Quotations', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
            const SizedBox(height: 8),
            quotationsAsync.when(
              loading: () => const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: LinearProgressIndicator()),
              error: (e, _) => Text('$e', style: const TextStyle(fontSize: 13)),
              data: (quotes) {
                if (quotes.isEmpty) {
                  return const Text('No quotations yet', style: TextStyle(fontSize: 13, color: AppColors.textMuted));
                }
                return Column(
                  children: quotes.map((q) {
                    final url = quotationPublicUrl(q.slug);
                    final viewed = q.viewCount > 0
                        ? 'Viewed ${q.viewCount} time${q.viewCount == 1 ? '' : 's'}${q.lastViewedAt != null ? ' · Last ${q.lastViewedAt}' : ''}'
                        : 'Not yet opened';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text('Version ${q.version}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(width: 8),
                                Expanded(child: Text(q.packageAmount, style: const TextStyle(fontSize: 12))),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(viewed, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              children: [
                                TextButton.icon(
                                  onPressed: () async {
                                    await Clipboard.setData(ClipboardData(text: url));
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
                                    }
                                  },
                                  icon: const Icon(Icons.copy, size: 16),
                                  label: const Text('Copy link'),
                                ),
                                TextButton.icon(
                                  onPressed: () async {
                                    await Clipboard.setData(ClipboardData(text: quotationWhatsAppMessage(lead.displayName, url)));
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('WhatsApp message copied')));
                                    }
                                  },
                                  icon: const Icon(Icons.chat_outlined, size: 16),
                                  label: const Text('WhatsApp'),
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
            const SizedBox(height: 24),
            const Text('Notes', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _noteController,
                    decoration: const InputDecoration(hintText: 'Add follow-up note…', border: OutlineInputBorder()),
                  ),
                ),
                IconButton(onPressed: _busy ? null : _addNote, icon: const Icon(Icons.send)),
              ],
            ),
            ...lead.notes.map(
              (n) => Card(
                margin: const EdgeInsets.only(top: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${n.authorName} · ${n.createdAt}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      const SizedBox(height: 4),
                      Text(n.content),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Timeline', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
            const SizedBox(height: 8),
            ...lead.activities.map(
              (a) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  '${a.kind.replaceAll('_', ' ')}${a.message.isNotEmpty ? ' — ${a.message}' : ''}${a.actorName != null ? ' (${a.actorName})' : ''}',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
