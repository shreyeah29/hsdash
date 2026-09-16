import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/admin/careers_providers.dart';
import 'package:hsdash_mobile/models/career_application.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

/// Admin Careers inbox — JOIN US form applications.
class CareersTab extends ConsumerStatefulWidget {
  const CareersTab({super.key});

  @override
  ConsumerState<CareersTab> createState() => _CareersTabState();
}

class _CareersTabState extends ConsumerState<CareersTab> {
  String? _statusFilter;
  String _search = '';
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  CareersListQuery get _query => CareersListQuery(status: _statusFilter, search: _search);

  Future<void> _refresh() async {
    ref.invalidate(careerStatsProvider);
    ref.invalidate(careersListProvider(_query));
  }

  @override
  Widget build(BuildContext context) {
    watchAdminPalette(ref);
    final stats = ref.watch(careerStatsProvider);
    final list = ref.watch(careersListProvider(_query));
    final accent = AdminHomePalette.accent;

    return RefreshIndicator(
      color: accent,
      backgroundColor: AdminHomePalette.card,
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          Text('Careers inbox', style: AdminHomePalette.pageTitle.copyWith(fontSize: 24)),
          const SizedBox(height: 6),
          Text(
            'Applications from the JOIN US form.',
            style: AdminHomePalette.editorialMeta,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await Clipboard.setData(const ClipboardData(text: careersFormUrl));
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Form link copied')),
                    );
                  },
                  icon: const Icon(Icons.copy_rounded, size: 16),
                  label: const Text('Copy form'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AdminHomePalette.text,
                    side: BorderSide(color: AdminHomePalette.cardBorder),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final uri = Uri.parse(careersFormUrl);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('Open form'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AdminHomePalette.text,
                    side: BorderSide(color: AdminHomePalette.cardBorder),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          stats.when(
            loading: () => const SizedBox(height: 72, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: _refresh),
            data: (s) => _StatsRow(stats: s),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'All',
                  selected: _statusFilter == null,
                  onTap: () => setState(() => _statusFilter = null),
                ),
                for (final s in const ['NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'])
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: _FilterChip(
                      label: careerStatusLabels[s] ?? s,
                      selected: _statusFilter == s,
                      onTap: () => setState(() => _statusFilter = s),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _search = v.trim()),
            style: TextStyle(color: AdminHomePalette.text, fontWeight: FontWeight.w500),
            cursorColor: accent,
            decoration: InputDecoration(
              hintText: 'Search name, phone, role…',
              hintStyle: TextStyle(color: AdminHomePalette.textMuted),
              prefixIcon: Icon(Icons.search_rounded, color: AdminHomePalette.textMuted),
              filled: true,
              fillColor: AdminHomePalette.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
                borderSide: BorderSide(color: AdminHomePalette.cardBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
                borderSide: BorderSide(color: AdminHomePalette.cardBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
                borderSide: BorderSide(color: accent, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 16),
          list.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            error: (e, _) => ErrorPanel(message: '$e', onRetry: _refresh),
            data: (apps) {
              if (apps.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Text(
                    'No applications yet.',
                    textAlign: TextAlign.center,
                    style: AdminHomePalette.editorialMeta,
                  ),
                );
              }
              return Column(
                children: [
                  for (final app in apps) ...[
                    _ApplicationCard(
                      application: app,
                      onTap: () => _openDetail(app),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _openDetail(CareerApplication app) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AdminHomePalette.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _CareerDetailSheet(application: app),
    );
    if (mounted) await _refresh();
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.stats});

  final CareerStats stats;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatCard(label: 'Total', value: '${stats.total}'),
        const SizedBox(width: 8),
        _StatCard(label: 'Open', value: '${stats.openPipeline}'),
        const SizedBox(width: 8),
        _StatCard(label: 'Shortlisted', value: '${stats.shortlisted}'),
        const SizedBox(width: 8),
        _StatCard(label: 'Hired', value: '${stats.hired}'),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AdminHomePalette.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AdminHomePalette.cardBorder),
        ),
        child: Column(
          children: [
            Text(value, style: AdminHomePalette.editorialTitle.copyWith(fontSize: 18)),
            const SizedBox(height: 2),
            Text(
              label.toUpperCase(),
              style: AdminHomePalette.statLabel.copyWith(fontSize: 8, letterSpacing: 0.8),
            ),
          ],
        ),
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
    return Material(
      color: selected ? AdminHomePalette.text : AdminHomePalette.surface,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: AdminHomePalette.cardBorder),
          ),
          child: Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: selected ? AdminHomePalette.background : AdminHomePalette.text,
            ),
          ),
        ),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({required this.application, required this.onTap});

  final CareerApplication application;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final when = DateFormat('d MMM yyyy, HH:mm').format(application.submittedAt.toLocal());
    final status = careerStatusLabels[application.status] ?? application.status;

    return Material(
      color: AdminHomePalette.card,
      borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AdminHomePalette.radiusCard),
            border: Border.all(color: AdminHomePalette.cardBorder),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      application.name.isEmpty ? 'Unnamed' : application.name,
                      style: AdminHomePalette.editorialTitle.copyWith(fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (application.roleApplied.isNotEmpty) application.roleApplied,
                        if (application.experience.isNotEmpty) application.experience,
                        when,
                      ].join(' · '),
                      style: AdminHomePalette.editorialMeta.copyWith(fontSize: 12),
                    ),
                    if (application.phoneNumber.isNotEmpty || application.email.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        [
                          if (application.phoneNumber.isNotEmpty) application.phoneNumber,
                          if (application.email.isNotEmpty) application.email,
                        ].join(' · '),
                        style: AdminHomePalette.editorialMeta.copyWith(fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AdminHomePalette.accent.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: AdminHomePalette.accent.withValues(alpha: 0.28)),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                    color: AdminHomePalette.accent,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CareerDetailSheet extends ConsumerStatefulWidget {
  const _CareerDetailSheet({required this.application});

  final CareerApplication application;

  @override
  ConsumerState<_CareerDetailSheet> createState() => _CareerDetailSheetState();
}

class _CareerDetailSheetState extends ConsumerState<_CareerDetailSheet> {
  late String _status;
  late final TextEditingController _notes;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.application.status;
    _notes = TextEditingController(text: widget.application.notes);
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save({bool popAfter = false}) async {
    setState(() => _saving = true);
    try {
      await ref.read(careersRepositoryProvider).updateApplication(
            widget.application.id,
            status: _status,
            notes: _notes.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved')));
      if (popAfter) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete application?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(careersRepositoryProvider).deleteApplication(widget.application.id);
    if (!mounted) return;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final app = widget.application;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottom),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AdminHomePalette.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(app.name.isEmpty ? 'Applicant' : app.name, style: AdminHomePalette.pageTitle.copyWith(fontSize: 22)),
            const SizedBox(height: 12),
            _DetailLine(label: 'Role', value: app.roleApplied),
            _DetailLine(label: 'Experience', value: app.experience),
            _DetailLine(label: 'Phone', value: app.phoneNumber),
            _DetailLine(label: 'Email', value: app.email),
            _DetailLine(label: 'Softwares', value: app.softwares),
            _DetailLine(label: 'Portfolio', value: app.portfolioUrl, link: true),
            _DetailLine(label: 'Instagram', value: app.instagramLink, link: true),
            const SizedBox(height: 12),
            Text('Status', style: AdminHomePalette.statLabel),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              // ignore: deprecated_member_use — controlled selection while editing status
              value: careerStatusOrder.contains(_status) ? _status : 'NEW',
              items: [
                for (final s in careerStatusOrder)
                  DropdownMenuItem(value: s, child: Text(careerStatusLabels[s] ?? s)),
              ],
              onChanged: _saving ? null : (v) => setState(() => _status = v ?? _status),
              decoration: InputDecoration(
                filled: true,
                fillColor: AdminHomePalette.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            Text('Notes', style: AdminHomePalette.statLabel),
            const SizedBox(height: 6),
            TextField(
              controller: _notes,
              maxLines: 4,
              decoration: InputDecoration(
                filled: true,
                fillColor: AdminHomePalette.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : () => _save(popAfter: true),
              style: FilledButton.styleFrom(backgroundColor: AdminHomePalette.accent),
              child: Text(_saving ? 'Saving…' : 'Save'),
            ),
            TextButton(
              onPressed: _saving ? null : _delete,
              child: Text('Delete', style: TextStyle(color: AdminHomePalette.error)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.label, required this.value, this.link = false});

  final String label;
  final String value;
  final bool link;

  @override
  Widget build(BuildContext context) {
    if (value.trim().isEmpty) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text('$label: —', style: AdminHomePalette.editorialMeta),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: !link
            ? null
            : () async {
                var raw = value.trim();
                if (!raw.startsWith('http') && label == 'Instagram') {
                  raw = 'https://instagram.com/${raw.replaceFirst('@', '')}';
                }
                final uri = Uri.tryParse(raw);
                if (uri != null && await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
        child: Text.rich(
          TextSpan(
            children: [
              TextSpan(text: '$label: ', style: AdminHomePalette.editorialMeta.copyWith(fontWeight: FontWeight.w700)),
              TextSpan(
                text: value,
                style: AdminHomePalette.editorialMeta.copyWith(
                  color: link ? AdminHomePalette.accent : AdminHomePalette.textSecondary,
                  decoration: link ? TextDecoration.underline : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
