import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/leads_providers.dart';
import 'package:hsdash_mobile/features/admin/quotation_builder_theme.dart';
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
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: QuotationBuilderPalette.background,
        appBar: AppBar(
          title: Text(
            _draft?.clonedFromVersion != null ? 'Revise quotation' : 'Create quotation',
            style: QuotationBuilderPalette.eyebrow.copyWith(fontSize: 11, letterSpacing: 3.5, color: QuotationBuilderPalette.accent),
          ),
          centerTitle: true,
          backgroundColor: QuotationBuilderPalette.background.withValues(alpha: 0.96),
          foregroundColor: QuotationBuilderPalette.text,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: QuotationBuilderPalette.border),
          ),
        ),
        body: _loadingDraft || _draft == null
            ? const Center(child: CircularProgressIndicator(color: QuotationBuilderPalette.accent, strokeWidth: 2))
            : Column(
                children: [
                  _StepHeader(step: _step),
                  if (_draft!.clonedFromVersion != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(QuotationBuilderPalette.pagePaddingH, 14, QuotationBuilderPalette.pagePaddingH, 0),
                      child: QuotationBuilderBanner(
                        message: 'Prefilled from V${_draft!.clonedFromVersion}. Edit and generate a new version.',
                      ),
                    ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(
                        QuotationBuilderPalette.pagePaddingH,
                        28,
                        QuotationBuilderPalette.pagePaddingH,
                        24,
                      ),
                      child: _buildStep(),
                    ),
                  ),
                  if (_step < 4 || _created == null)
                    _Footer(
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
      padding: const EdgeInsets.fromLTRB(QuotationBuilderPalette.pagePaddingH, 12, QuotationBuilderPalette.pagePaddingH, 0),
      child: Row(
        children: [
          for (var i = 0; i < _steps.length; i++) ...[
            Expanded(
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 280),
                    curve: Curves.easeOutCubic,
                    height: 3,
                    decoration: BoxDecoration(
                      color: i <= step ? QuotationBuilderPalette.accent : QuotationBuilderPalette.border,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(height: 10),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      _steps[i].toUpperCase(),
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      style: i == step ? QuotationBuilderPalette.stepNavLabelActive : QuotationBuilderPalette.stepNavLabel,
                    ),
                  ),
                ],
              ),
            ),
            if (i < _steps.length - 1) const SizedBox(width: 8),
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
      padding: const EdgeInsets.fromLTRB(QuotationBuilderPalette.pagePaddingH, 14, QuotationBuilderPalette.pagePaddingH, 28),
      decoration: BoxDecoration(
        color: QuotationBuilderPalette.background.withValues(alpha: 0.96),
        border: Border(top: BorderSide(color: QuotationBuilderPalette.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: onBack,
            style: TextButton.styleFrom(
              foregroundColor: QuotationBuilderPalette.textMuted,
              disabledForegroundColor: QuotationBuilderPalette.textMuted.withValues(alpha: 0.35),
            ),
            child: Text('BACK', style: QuotationBuilderPalette.stepLabel.copyWith(letterSpacing: 2)),
          ),
          if (onNext != null)
            FilledButton(
              onPressed: canNext ? onNext : null,
              style: FilledButton.styleFrom(
                backgroundColor: QuotationBuilderPalette.buttonDark,
                foregroundColor: Colors.white,
                disabledBackgroundColor: QuotationBuilderPalette.buttonDark.withValues(alpha: 0.35),
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              child: Text('CONTINUE', style: QuotationBuilderPalette.stepLabel.copyWith(color: Colors.white, letterSpacing: 2)),
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
        Text(lead.displayName, style: QuotationBuilderPalette.serifTitle),
        const SizedBox(height: 8),
        Text('Review client details before building the proposal.', style: QuotationBuilderPalette.meta),
        const SizedBox(height: 28),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.only(top: 24),
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: QuotationBuilderPalette.border)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ReadonlyField(label: 'Phone', value: lead.phoneNumber),
              if (lead.email.isNotEmpty) _ReadonlyField(label: 'Email', value: lead.email),
              _ReadonlyField(label: 'Event date', value: _formatDate(lead.eventDate)),
              _ReadonlyField(label: 'Location', value: lead.eventLocation.isNotEmpty ? lead.eventLocation : '—', isLast: true),
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
        Text('Upcoming events', style: QuotationBuilderPalette.serifTitleMd),
        const SizedBox(height: 8),
        Text('Timeline cards — only these change per quotation.', style: QuotationBuilderPalette.meta),
        const SizedBox(height: 24),
        for (var i = 0; i < draft.events.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: QuotationBuilderSurface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('EVENT ${i + 1}', style: QuotationBuilderPalette.eyebrow.copyWith(fontSize: 10)),
                      const Spacer(),
                      if (draft.events.length > 1)
                        IconButton(
                          onPressed: () {
                            draft.events.removeAt(i);
                            onChanged();
                          },
                          icon: Icon(Icons.delete_outline_rounded, size: 18, color: QuotationBuilderPalette.textMuted),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
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
                    onTap: () => _pickEventDate(context, draft, i, onChanged),
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
                    isLast: true,
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
          icon: Icon(Icons.add_rounded, size: 18, color: QuotationBuilderPalette.accent),
          label: Text('ADD EVENT', style: QuotationBuilderPalette.eyebrow.copyWith(fontSize: 10, letterSpacing: 2)),
          style: TextButton.styleFrom(foregroundColor: QuotationBuilderPalette.accent),
        ),
      ],
    );
  }

  Future<void> _pickEventDate(BuildContext context, QuotationDraft draft, int i, VoidCallback onChanged) async {
    final parts = draft.events[i].eventDate.split('-');
    final initial = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2040),
      builder: (context, child) => Theme(data: QuotationBuilderPalette.datePickerTheme, child: child!),
    );
    if (picked != null) {
      draft.events[i].eventDate = picked.toIso8601String().split('T').first;
      onChanged();
    }
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
        Text('Package', style: QuotationBuilderPalette.serifTitleMd),
        const SizedBox(height: 8),
        Text('Pricing — the heart of this proposal.', style: QuotationBuilderPalette.meta),
        const SizedBox(height: 24),
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
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Include engagement package', style: QuotationBuilderPalette.body),
          value: draft.includeEngagementPackage,
          activeTrackColor: QuotationBuilderPalette.accent.withValues(alpha: 0.45),
          thumbColor: WidgetStateProperty.resolveWith((states) => QuotationBuilderPalette.accent),
          onChanged: (v) {
            draft.includeEngagementPackage = v;
            onChanged();
          },
        ),
        if (draft.includeEngagementPackage)
          Container(
            margin: const EdgeInsets.only(left: 4),
            padding: const EdgeInsets.only(left: 16),
            decoration: BoxDecoration(
              border: Border(left: BorderSide(color: QuotationBuilderPalette.accent.withValues(alpha: 0.45), width: 2)),
            ),
            child: Column(
              children: [
                _QuoteField(label: 'Engagement package', value: draft.engagementPackageAmount, onChanged: (v) { draft.engagementPackageAmount = v; onChanged(); }),
                _QuoteField(label: 'Engagement booking', value: draft.engagementBookingAmount, onChanged: (v) { draft.engagementBookingAmount = v; onChanged(); }),
                _QuoteField(label: 'Engagement final payment', value: draft.engagementFinalPayment, onChanged: (v) { draft.engagementFinalPayment = v; onChanged(); }, isLast: true),
              ],
            ),
          ),
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
        Text('Expiry', style: QuotationBuilderPalette.serifTitleMd),
        const SizedBox(height: 8),
        Text('How long should this proposal stay active?', style: QuotationBuilderPalette.meta),
        const SizedBox(height: 24),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: presets.map((p) {
            final selected = draft.expiryPreset == p.$1;
            return Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  draft.expiryPreset = p.$1;
                  onChanged();
                },
                borderRadius: BorderRadius.circular(4),
                child: Ink(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    color: selected ? QuotationBuilderPalette.buttonDark : Colors.transparent,
                    border: Border.all(color: selected ? QuotationBuilderPalette.buttonDark : QuotationBuilderPalette.border),
                  ),
                  child: Text(
                    p.$2.toUpperCase(),
                    style: QuotationBuilderPalette.stepLabel.copyWith(
                      letterSpacing: 2,
                      color: selected ? QuotationBuilderPalette.background : QuotationBuilderPalette.textMuted,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        if (draft.expiryPreset == 'custom') ...[
          const SizedBox(height: 20),
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
                builder: (context, child) => Theme(data: QuotationBuilderPalette.datePickerTheme, child: child!),
              );
              if (picked != null) {
                draft.customExpiryDay = picked.toIso8601String().split('T').first;
                onChanged();
              }
            },
            isLast: true,
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
              border: Border.all(color: QuotationBuilderPalette.accent),
            ),
            child: Icon(Icons.check_rounded, color: QuotationBuilderPalette.accent, size: 28),
          ),
          const SizedBox(height: 20),
          Text('Proposal ready', style: QuotationBuilderPalette.serifTitle),
          const SizedBox(height: 8),
          Text('Version ${created!.version} · ${created!.slug}', style: QuotationBuilderPalette.meta),
          const SizedBox(height: 20),
          SelectableText(url, style: QuotationBuilderPalette.body.copyWith(color: QuotationBuilderPalette.accent)),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => Share.share(quotationWhatsAppMessage(lead.displayName, url)),
              style: FilledButton.styleFrom(
                backgroundColor: QuotationBuilderPalette.buttonDark,
                padding: const EdgeInsets.symmetric(vertical: 16),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              icon: const Icon(Icons.share_rounded, size: 18),
              label: Text('SHARE ON WHATSAPP', style: QuotationBuilderPalette.stepLabel.copyWith(color: Colors.white, letterSpacing: 1.5)),
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
                    SnackBar(
                      content: Text('Link copied', style: AdminHomeTypography.inter(fontSize: 14, color: Colors.white)),
                      backgroundColor: QuotationBuilderPalette.buttonDark,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: QuotationBuilderPalette.text,
                side: const BorderSide(color: QuotationBuilderPalette.buttonDark),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              icon: const Icon(Icons.link_rounded, size: 18),
              label: Text('COPY LINK', style: QuotationBuilderPalette.stepLabel.copyWith(color: QuotationBuilderPalette.text, letterSpacing: 1.5)),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () async {
              final uri = Uri.parse(url);
              if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
            },
            child: Text('Preview proposal', style: QuotationBuilderPalette.meta.copyWith(decoration: TextDecoration.underline)),
          ),
          const SizedBox(height: 16),
          TextButton(onPressed: onDone, child: Text('DONE', style: QuotationBuilderPalette.eyebrow.copyWith(fontSize: 10))),
        ],
      );
    }

    return Column(
      children: [
        Text('Generate', style: QuotationBuilderPalette.serifTitle),
        const SizedBox(height: 12),
        Text.rich(
          TextSpan(
            style: QuotationBuilderPalette.meta,
            children: [
              const TextSpan(text: 'Creates a new version for '),
              TextSpan(text: lead.displayName, style: QuotationBuilderPalette.body.copyWith(fontWeight: FontWeight.w500)),
              const TextSpan(text: ' with a secure client link.'),
            ],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: creating ? null : onCreate,
            style: FilledButton.styleFrom(
              backgroundColor: QuotationBuilderPalette.buttonDark,
              padding: const EdgeInsets.symmetric(vertical: 18),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: Text(
              creating ? 'CREATING…' : 'GENERATE QUOTATION',
              style: QuotationBuilderPalette.stepLabel.copyWith(color: Colors.white, letterSpacing: 2, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 14),
          Text(error!, textAlign: TextAlign.center, style: AdminHomeTypography.inter(color: QuotationBuilderPalette.danger, fontSize: 13)),
        ],
      ],
    );
  }
}

class _ReadonlyField extends StatelessWidget {
  const _ReadonlyField({required this.label, required this.value, this.isLast = false});

  final String label;
  final String value;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: QuotationBuilderPalette.fieldLabel),
          const SizedBox(height: 8),
          Text(value, style: QuotationBuilderPalette.serifValue),
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
    this.isLast = false,
  });

  final String label;
  final String value;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final bool readOnly;
  final int maxLines;
  final String? hint;
  final bool isLast;

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
      padding: EdgeInsets.only(bottom: widget.isLast ? 0 : 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label.toUpperCase(), style: QuotationBuilderPalette.fieldLabel),
          const SizedBox(height: 6),
          TextField(
            controller: _controller,
            readOnly: widget.readOnly,
            onTap: widget.onTap,
            maxLines: widget.maxLines,
            style: QuotationBuilderPalette.body.copyWith(fontSize: 15),
            cursorColor: QuotationBuilderPalette.accent,
            decoration: QuotationBuilderPalette.underlineField(hint: widget.hint),
            onChanged: widget.onChanged,
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
