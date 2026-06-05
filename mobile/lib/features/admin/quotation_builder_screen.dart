import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/models/lead.dart';
import 'package:hsdash_mobile/models/quotation.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

const _steps = ['Client', 'Events', 'Package', 'Expiry', 'Generate'];

class QuotationBuilderScreen extends ConsumerStatefulWidget {
  const QuotationBuilderScreen({super.key, required this.lead});

  final LeadSummary lead;

  @override
  ConsumerState<QuotationBuilderScreen> createState() => _QuotationBuilderScreenState();
}

class _QuotationBuilderScreenState extends ConsumerState<QuotationBuilderScreen> {
  int _step = 0;
  bool _loadingDraft = true;
  bool _creating = false;
  String? _error;
  QuotationDraft? _draft;
  QuotationSummary? _created;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    try {
      final previous = await ref.read(leadsRepositoryProvider).fetchLatestQuotation(widget.lead.id);
      if (!mounted) return;
      setState(() {
        _draft = previous != null
            ? QuotationDraft.fromPrevious(previous)
            : QuotationDraft.fromLead(widget.lead);
        _loadingDraft = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _draft = QuotationDraft.fromLead(widget.lead);
        _loadingDraft = false;
        _error = '$e';
      });
    }
  }

  Future<void> _create() async {
    final draft = _draft;
    if (draft == null) return;
    setState(() {
      _creating = true;
      _error = null;
    });
    try {
      final created = await ref.read(leadsRepositoryProvider).createQuotation(widget.lead.id, draft);
      if (!mounted) return;
      setState(() {
        _created = created;
        _creating = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _creating = false;
        _error = '$e';
      });
    }
  }

  bool get _canNext {
    final draft = _draft;
    if (draft == null) return false;
    return switch (_step) {
      0 => true,
      1 => draft.canProceedEvents,
      2 => draft.canProceedPackage,
      3 => draft.canProceedExpiry,
      _ => false,
    };
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AdminHomePalette.background,
        appBar: AppBar(
          title: Text(
            _draft?.clonedFromVersion != null ? 'Revise quotation' : 'Create quotation',
            style: AdminHomeTypography.inter(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          backgroundColor: AdminHomePalette.background,
          foregroundColor: AdminHomePalette.text,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
        body: _loadingDraft || _draft == null
            ? const Center(child: CircularProgressIndicator(color: AdminHomePalette.accent, strokeWidth: 2))
            : Column(
                children: [
                  _StepHeader(step: _step),
                  if (_draft!.clonedFromVersion != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(22, 12, 22, 0),
                      child: AdminHomeSurface(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        radius: AdminHomePalette.radiusSm,
                        child: Row(
                          children: [
                            Icon(Icons.copy_all_rounded, size: 16, color: AdminHomePalette.accent),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Prefilled from V${_draft!.clonedFromVersion}. Edit and generate a new version.',
                                style: AdminHomePalette.editorialMeta.copyWith(fontSize: 12, color: AdminHomePalette.text.withValues(alpha: 0.9)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(22, 20, 22, 24),
                      child: _buildStep(),
                    ),
                  ),
                  if (_step < 4 || _created == null) _Footer(
                    step: _step,
                    canNext: _canNext,
                    onBack: _step > 0 ? () => setState(() => _step -= 1) : null,
                    onNext: _step < 4 ? () => setState(() => _step += 1) : null,
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildStep() {
    final draft = _draft!;
    return switch (_step) {
      0 => _ClientStep(lead: widget.lead),
      1 => _EventsStep(draft: draft, onChanged: () => setState(() {})),
      2 => _PackageStep(draft: draft, onChanged: () => setState(() {})),
      3 => _ExpiryStep(draft: draft, onChanged: () => setState(() {})),
      _ => _GenerateStep(
          lead: widget.lead,
          draft: draft,
          creating: _creating,
          created: _created,
          error: _error,
          onCreate: _create,
          onDone: () => Navigator.of(context).pop(true),
        ),
    };
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 8, 22, 0),
      child: Row(
        children: [
          for (var i = 0; i < _steps.length; i++) ...[
            Expanded(
              child: Column(
                children: [
                  Container(
                    height: 3,
                    decoration: BoxDecoration(
                      color: i <= step ? AdminHomePalette.accent : AdminHomePalette.textSecondary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _steps[i].toUpperCase(),
                    style: AdminHomePalette.statLabel.copyWith(
                      fontSize: 7,
                      color: i == step ? AdminHomePalette.text : AdminHomePalette.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (i < _steps.length - 1) const SizedBox(width: 6),
          ],
        ],
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.step, required this.canNext, this.onBack, this.onNext});

  final int step;
  final bool canNext;
  final VoidCallback? onBack;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
      decoration: BoxDecoration(
        color: AdminHomePalette.background,
        border: Border(top: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.12))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: onBack,
            child: Text('Back', style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.textSecondary)),
          ),
          if (onNext != null)
            FilledButton(
              onPressed: canNext ? onNext : null,
              style: FilledButton.styleFrom(
                backgroundColor: AdminHomePalette.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('Continue'),
            ),
        ],
      ),
    );
  }
}

class _ClientStep extends StatelessWidget {
  const _ClientStep({required this.lead});

  final LeadSummary lead;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(lead.displayName, style: AdminHomePalette.editorialTitle.copyWith(fontSize: 24)),
        const SizedBox(height: 6),
        Text('Review client details before building the proposal.', style: AdminHomePalette.editorialMeta),
        const SizedBox(height: 20),
        AdminHomeSurface(
          padding: const EdgeInsets.all(14),
          radius: AdminHomePalette.radiusSm,
          child: Column(
            children: [
              _ReadonlyRow(label: 'Phone', value: lead.phoneNumber),
              if (lead.email.isNotEmpty) _ReadonlyRow(label: 'Email', value: lead.email),
              _ReadonlyRow(label: 'Event date', value: _formatDate(lead.eventDate)),
              _ReadonlyRow(label: 'Location', value: lead.eventLocation.isNotEmpty ? lead.eventLocation : '—'),
            ],
          ),
        ),
      ],
    );
  }
}

class _EventsStep extends StatelessWidget {
  const _EventsStep({required this.draft, required this.onChanged});

  final QuotationDraft draft;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Upcoming events', style: AdminHomePalette.editorialTitle.copyWith(fontSize: 22)),
        const SizedBox(height: 6),
        Text('Timeline cards — only these change per quotation.', style: AdminHomePalette.editorialMeta),
        const SizedBox(height: 16),
        for (var i = 0; i < draft.events.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: AdminHomeSurface(
              padding: const EdgeInsets.all(14),
              radius: AdminHomePalette.radiusSm,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('EVENT ${i + 1}', style: AdminHomePalette.sectionTitle),
                      const Spacer(),
                      if (draft.events.length > 1)
                        IconButton(
                          onPressed: () {
                            draft.events.removeAt(i);
                            onChanged();
                          },
                          icon: Icon(Icons.delete_outline_rounded, size: 18, color: AdminHomePalette.textSecondary),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _QuoteField(
                    label: 'Event name',
                    value: draft.events[i].eventName,
                    onChanged: (v) {
                      draft.events[i].eventName = v;
                      onChanged();
                    },
                  ),
                  _QuoteField(
                    label: 'Venue',
                    value: draft.events[i].venue,
                    onChanged: (v) {
                      draft.events[i].venue = v;
                      onChanged();
                    },
                  ),
                  _QuoteField(
                    label: 'Date',
                    value: draft.events[i].eventDate,
                    readOnly: true,
                    onTap: () async {
                      final parts = draft.events[i].eventDate.split('-');
                      final initial = DateTime(
                        int.parse(parts[0]),
                        int.parse(parts[1]),
                        int.parse(parts[2]),
                      );
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: initial,
                        firstDate: DateTime(2020),
                        lastDate: DateTime(2040),
                        builder: (context, child) => Theme(
                          data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AdminHomePalette.accent)),
                          child: child!,
                        ),
                      );
                      if (picked != null) {
                        draft.events[i].eventDate = picked.toIso8601String().split('T').first;
                        onChanged();
                      }
                    },
                  ),
                  _QuoteField(
                    label: 'Team size',
                    value: draft.events[i].teamSize,
                    onChanged: (v) {
                      draft.events[i].teamSize = v;
                      onChanged();
                    },
                  ),
                  _QuoteField(
                    label: 'Duration',
                    value: draft.events[i].duration,
                    onChanged: (v) {
                      draft.events[i].duration = v;
                      onChanged();
                    },
                  ),
                  _QuoteField(
                    label: 'Notes',
                    value: draft.events[i].notes,
                    onChanged: (v) {
                      draft.events[i].notes = v;
                      onChanged();
                    },
                    maxLines: 2,
                  ),
                ],
              ),
            ),
          ),
        TextButton.icon(
          onPressed: () {
            draft.events.add(
              QuotationEventDraft(
                eventName: '',
                venue: draft.events.isNotEmpty ? draft.events.last.venue : '',
                eventDate: draft.events.isNotEmpty ? draft.events.last.eventDate : DateTime.now().toIso8601String().split('T').first,
                teamSize: '7 MEMBERS',
                duration: 'FULL DAY',
                notes: '',
              ),
            );
            onChanged();
          },
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('Add event'),
          style: TextButton.styleFrom(foregroundColor: AdminHomePalette.accent),
        ),
      ],
    );
  }
}

class _PackageStep extends StatelessWidget {
  const _PackageStep({required this.draft, required this.onChanged});

  final QuotationDraft draft;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Package', style: AdminHomePalette.editorialTitle.copyWith(fontSize: 22)),
        const SizedBox(height: 6),
        Text('Pricing — the heart of this proposal.', style: AdminHomePalette.editorialMeta),
        const SizedBox(height: 16),
        _QuoteField(label: 'Package amount', value: draft.packageAmount, onChanged: (v) { draft.packageAmount = v; onChanged(); }),
        _QuoteField(label: 'Booking amount', value: draft.bookingAmount, onChanged: (v) { draft.bookingAmount = v; onChanged(); }),
        _QuoteField(label: 'Second payment', value: draft.secondPayment, onChanged: (v) { draft.secondPayment = v; onChanged(); }),
        _QuoteField(label: 'Final payment', value: draft.finalPayment, onChanged: (v) { draft.finalPayment = v; onChanged(); }),
        _QuoteField(
          label: 'Additional notes',
          value: draft.additionalNotes,
          onChanged: (v) { draft.additionalNotes = v; onChanged(); },
          maxLines: 3,
          hint: 'Optional — leave blank for standard package notes',
        ),
        const SizedBox(height: 8),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Include engagement package', style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.text)),
          value: draft.includeEngagementPackage,
          activeTrackColor: AdminHomePalette.accent.withValues(alpha: 0.45),
          thumbColor: WidgetStateProperty.resolveWith((states) => AdminHomePalette.accent),
          onChanged: (v) {
            draft.includeEngagementPackage = v;
            onChanged();
          },
        ),
        if (draft.includeEngagementPackage) ...[
          _QuoteField(label: 'Engagement package', value: draft.engagementPackageAmount, onChanged: (v) { draft.engagementPackageAmount = v; onChanged(); }),
          _QuoteField(label: 'Engagement booking', value: draft.engagementBookingAmount, onChanged: (v) { draft.engagementBookingAmount = v; onChanged(); }),
          _QuoteField(label: 'Engagement final payment', value: draft.engagementFinalPayment, onChanged: (v) { draft.engagementFinalPayment = v; onChanged(); }),
        ],
      ],
    );
  }
}

class _ExpiryStep extends StatelessWidget {
  const _ExpiryStep({required this.draft, required this.onChanged});

  final QuotationDraft draft;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    const presets = [
      ('24h', '24 Hours'),
      ('48h', '48 Hours'),
      ('7d', '7 Days'),
      ('custom', 'Custom date'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Expiry', style: AdminHomePalette.editorialTitle.copyWith(fontSize: 22)),
        const SizedBox(height: 6),
        Text('How long should this proposal stay active?', style: AdminHomePalette.editorialMeta),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: presets.map((p) {
            final selected = draft.expiryPreset == p.$1;
            return Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  draft.expiryPreset = p.$1;
                  onChanged();
                },
                borderRadius: BorderRadius.circular(10),
                child: Ink(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: selected ? AdminHomePalette.accent.withValues(alpha: 0.18) : AdminHomePalette.card.withValues(alpha: 0.85),
                    border: Border.all(color: selected ? AdminHomePalette.accent.withValues(alpha: 0.5) : AdminHomePalette.textSecondary.withValues(alpha: 0.12)),
                  ),
                  child: Text(
                    p.$2,
                    style: AdminHomeTypography.inter(
                      fontSize: 12,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                      color: selected ? AdminHomePalette.accent : AdminHomePalette.textSecondary,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        if (draft.expiryPreset == 'custom') ...[
          const SizedBox(height: 16),
          _QuoteField(
            label: 'Custom expiry date',
            value: draft.customExpiryDay ?? '',
            readOnly: true,
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now().add(const Duration(days: 7)),
                firstDate: DateTime.now(),
                lastDate: DateTime(2040),
                builder: (context, child) => Theme(
                  data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AdminHomePalette.accent)),
                  child: child!,
                ),
              );
              if (picked != null) {
                draft.customExpiryDay = picked.toIso8601String().split('T').first;
                onChanged();
              }
            },
          ),
        ],
      ],
    );
  }
}

class _GenerateStep extends StatelessWidget {
  const _GenerateStep({
    required this.lead,
    required this.draft,
    required this.creating,
    required this.created,
    required this.error,
    required this.onCreate,
    required this.onDone,
  });

  final LeadSummary lead;
  final QuotationDraft draft;
  final bool creating;
  final QuotationSummary? created;
  final String? error;
  final VoidCallback onCreate;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    if (created != null) {
      final url = quotationPublicUrl(created!.slug);
      return Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AdminHomePalette.accent.withValues(alpha: 0.5)),
            ),
            child: const Icon(Icons.check_rounded, color: AdminHomePalette.accent, size: 28),
          ),
          const SizedBox(height: 16),
          Text('Proposal ready', style: AdminHomePalette.editorialTitle.copyWith(fontSize: 24)),
          const SizedBox(height: 8),
          Text('Version ${created!.version} · ${created!.slug}', style: AdminHomePalette.editorialMeta),
          const SizedBox(height: 16),
          SelectableText(url, style: AdminHomeTypography.inter(fontSize: 13, color: AdminHomePalette.accent)),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => Share.share(quotationWhatsAppMessage(lead.displayName, url)),
              style: FilledButton.styleFrom(backgroundColor: AdminHomePalette.accent, padding: const EdgeInsets.symmetric(vertical: 14)),
              icon: const Icon(Icons.share_rounded, size: 18),
              label: const Text('Share on WhatsApp'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: url));
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: const Text('Link copied'), backgroundColor: AdminHomePalette.card, behavior: SnackBarBehavior.floating),
                  );
                }
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AdminHomePalette.text,
                side: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.25)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              icon: const Icon(Icons.link_rounded, size: 18),
              label: const Text('Copy link'),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () async {
              final uri = Uri.parse(url);
              if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
            },
            child: Text('Preview proposal', style: AdminHomeTypography.inter(fontSize: 13, color: AdminHomePalette.textSecondary)),
          ),
          const SizedBox(height: 16),
          TextButton(onPressed: onDone, child: const Text('Done')),
        ],
      );
    }

    return Column(
      children: [
        Text('Generate', style: AdminHomePalette.editorialTitle.copyWith(fontSize: 24)),
        const SizedBox(height: 12),
        Text(
          'Creates a new version for ${lead.displayName} with a secure client link.',
          textAlign: TextAlign.center,
          style: AdminHomePalette.editorialMeta,
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: creating ? null : onCreate,
            style: FilledButton.styleFrom(
              backgroundColor: AdminHomePalette.accent,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: Text(creating ? 'Creating…' : 'Generate quotation'),
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 12),
          Text(error!, textAlign: TextAlign.center, style: AdminHomeTypography.inter(color: const Color(0xFFFB7185), fontSize: 13)),
        ],
      ],
    );
  }
}

class _ReadonlyRow extends StatelessWidget {
  const _ReadonlyRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label.toUpperCase(), style: AdminHomePalette.statLabel.copyWith(fontSize: 9))),
          Expanded(child: Text(value, style: AdminHomeTypography.inter(fontSize: 14, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}

class _QuoteField extends StatefulWidget {
  const _QuoteField({
    required this.label,
    required this.value,
    this.onChanged,
    this.onTap,
    this.readOnly = false,
    this.maxLines = 1,
    this.hint,
  });

  final String label;
  final String value;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final bool readOnly;
  final int maxLines;
  final String? hint;

  @override
  State<_QuoteField> createState() => _QuoteFieldState();
}

class _QuoteFieldState extends State<_QuoteField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(covariant _QuoteField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value && _controller.text != widget.value) {
      _controller.text = widget.value;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label.toUpperCase(), style: AdminHomePalette.statLabel.copyWith(fontSize: 9)),
          const SizedBox(height: 6),
          Theme(
            data: Theme.of(context).copyWith(
              brightness: Brightness.dark,
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: AdminHomePalette.card,
                hintStyle: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.textSecondary),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.2)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AdminHomePalette.textSecondary.withValues(alpha: 0.2)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AdminHomePalette.accent.withValues(alpha: 0.6)),
                ),
              ),
            ),
            child: TextField(
              controller: _controller,
              readOnly: widget.readOnly,
              onTap: widget.onTap,
              maxLines: widget.maxLines,
              style: AdminHomeTypography.inter(fontSize: 14, color: AdminHomePalette.text),
              decoration: InputDecoration(hintText: widget.hint),
              onChanged: widget.onChanged,
            ),
          ),
        ],
      ),
    );
  }
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
