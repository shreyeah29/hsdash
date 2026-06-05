import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/config/theme.dart';
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

  Color _statusColor(String status) {
    switch (status) {
      case 'NEW':
        return AppColors.violet;
      case 'CONTACTED':
        return const Color(0xFF2563EB);
      case 'NEGOTIATION':
        return AppColors.amber;
      case 'CONFIRMED':
        return AppColors.emerald;
      case 'LOST':
        return AppColors.rose;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = ref.watch(leadStatsProvider);
    final leads = ref.watch(leadsListProvider(_statusFilter));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Leads'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Copy enquiry link',
            icon: const Icon(Icons.link),
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: enquiryFormUrl));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Enquiry link copied')),
                );
              }
            },
          ),
          IconButton(
            tooltip: 'Copy WhatsApp message',
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: enquiryShareMessage()));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Message copied — paste in WhatsApp')),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(leadStatsProvider);
              ref.invalidate(leadsListProvider(_statusFilter));
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.violet,
        onRefresh: () async {
          ref.invalidate(leadStatsProvider);
          ref.invalidate(leadsListProvider(_statusFilter));
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.violetLight,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Share with clients',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        enquiryFormUrl,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.violet),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                await Clipboard.setData(ClipboardData(text: enquiryFormUrl));
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Link copied')),
                                  );
                                }
                              },
                              icon: const Icon(Icons.copy, size: 16),
                              label: const Text('Copy link'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                await Clipboard.setData(ClipboardData(text: enquiryShareMessage()));
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('WhatsApp message copied')),
                                  );
                                }
                              },
                              icon: const Icon(Icons.chat, size: 16),
                              label: const Text('Copy message'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: stats.when(
                loading: () => const SizedBox(height: 100, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
                error: (e, _) => Padding(padding: const EdgeInsets.all(16), child: Text('$e')),
                data: (s) => Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _StatChip(label: 'Total', value: '${s.total}'),
                      _StatChip(label: 'New', value: '${s.newCount}'),
                      _StatChip(label: 'Contacted', value: '${s.contacted}'),
                      _StatChip(label: 'Negotiation', value: '${s.negotiation}'),
                      _StatChip(label: 'Confirmed', value: '${s.confirmed}'),
                      _StatChip(label: 'Lost', value: '${s.lost}'),
                      _StatChip(label: 'Conversion', value: '${s.conversionRate}%'),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _FilterChip(label: 'All', selected: _statusFilter == null, onTap: () => setState(() => _statusFilter = null)),
                    for (final s in ['NEW', 'CONTACTED', 'NEGOTIATION', 'CONFIRMED', 'LOST', 'ARCHIVED'])
                      _FilterChip(
                        label: leadStatusLabel(s),
                        selected: _statusFilter == s,
                        onTap: () => setState(() => _statusFilter = s),
                      ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            leads.when(
              loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
              error: (e, _) => SliverFillRemaining(child: Center(child: Text('$e', textAlign: TextAlign.center))),
              data: (list) {
                if (list.isEmpty) {
                  return const SliverFillRemaining(
                    child: Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No leads yet.\nUse Copy link above and send to your next client.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                      ),
                    ),
                  );
                }
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      final lead = list[i];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                        title: Text(lead.displayName, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${lead.phoneNumber} · ${lead.eventLocation}'),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _statusColor(lead.status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            leadStatusLabel(lead.status),
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _statusColor(lead.status)),
                          ),
                        ),
                        onTap: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute<void>(builder: (_) => LeadDetailScreen(leadId: lead.id)),
                          );
                          ref.invalidate(leadsListProvider(_statusFilter));
                          ref.invalidate(leadStatsProvider);
                        },
                      );
                    },
                    childCount: list.length,
                  ),
                );
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.violet.withValues(alpha: 0.15),
        checkmarkColor: AppColors.violet,
      ),
    );
  }
}
