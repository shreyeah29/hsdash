import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_client_form_section.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/models/shoot_client_profile.dart';
import 'package:hsdash_mobile/widgets/shoot_time_picker.dart';

/// Full-screen add/edit shoot — wedding/other, client autocomplete, prefill.
class ShootFormScreen extends ConsumerStatefulWidget {
  const ShootFormScreen({
    super.key,
    required this.initial,
    required this.onSave,
    this.isEdit = false,
    this.showDeliverableToggle = true,
  });

  final ShootFormData initial;
  final Future<void> Function(ShootFormData form) onSave;
  final bool isEdit;
  final bool showDeliverableToggle;

  @override
  ConsumerState<ShootFormScreen> createState() => _ShootFormScreenState();
}

class _ShootFormScreenState extends ConsumerState<ShootFormScreen> {
  final _formKey = GlobalKey<FormState>();

  ShootEventKind _eventKind = ShootEventKind.wedding;

  late final TextEditingController _brideName;
  late final TextEditingController _groomName;
  late final TextEditingController _clientName;
  late final TextEditingController _clientType;
  late final TextEditingController _clientContact;
  late final TextEditingController _city;
  late final TextEditingController _eventName;
  late final TextEditingController _venue;
  late final TextEditingController _photoTeam;
  late final TextEditingController _videoTeam;
  late final TextEditingController _addons;

  late String _day;
  late String _startTime;
  late String _endTime;
  bool _createTimeline = false;
  bool _saving = false;

  List<ShootClientProfile> _clientProfiles = [];
  bool _clientsLoading = true;

  @override
  void initState() {
    super.initState();
    final f = widget.initial;
    _day = f.day;
    _startTime = f.startTime.isEmpty ? '10:00 AM' : f.startTime;
    _endTime = f.endTime.isEmpty ? '10:00 AM' : f.endTime;
    _brideName = TextEditingController(text: f.brideName);
    _groomName = TextEditingController(text: f.groomName);
    _clientName = TextEditingController(text: f.clientName);
    _clientType = TextEditingController(text: _storedClientType(f.clientType));
    _clientContact = TextEditingController(
      text: f.clientContact.isNotEmpty ? f.clientContact : f.phoneNumber,
    );
    _city = TextEditingController(text: f.city);
    _eventName = TextEditingController(text: f.eventName);
    _venue = TextEditingController(text: f.venue);
    _photoTeam = TextEditingController(text: f.photoTeam);
    _videoTeam = TextEditingController(text: f.videoTeam);
    _addons = TextEditingController(text: f.addons);
    _createTimeline = f.createDeliverableTimeline;

    if (f.brideName.isNotEmpty || f.groomName.isNotEmpty) {
      _eventKind = ShootEventKind.wedding;
    } else if (f.clientName.isNotEmpty) {
      _eventKind = ShootEventKind.other;
    }

    if (_eventKind == ShootEventKind.wedding &&
        f.brideName.isEmpty &&
        f.groomName.isEmpty &&
        f.clientName.contains('&')) {
      final parts = f.clientName.split('&').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      if (parts.length >= 2) {
        _brideName.text = parts.first;
        _groomName.text = parts.sublist(1).join(' & ');
      }
    } else if (_eventKind == ShootEventKind.other) {
      _clientName.text = f.clientName;
    }

    _loadClients();
  }

  String _storedClientType(String raw) {
    final t = raw.trim();
    if (t.isEmpty) return '';
    final lower = t.toLowerCase();
    if (lower == 'wedding' || lower == 'other') return '';
    return t;
  }

  Future<void> _loadClients() async {
    try {
      final list = await ref.read(productionCalendarRepositoryProvider).fetchAllClientProfiles();
      if (mounted) {
        setState(() {
          _clientProfiles = list;
          _clientsLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _clientsLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _brideName.dispose();
    _groomName.dispose();
    _clientName.dispose();
    _clientType.dispose();
    _clientContact.dispose();
    _city.dispose();
    _eventName.dispose();
    _venue.dispose();
    _photoTeam.dispose();
    _videoTeam.dispose();
    _addons.dispose();
    super.dispose();
  }

  void _applyClientProfile(ShootClientProfile profile) {
    setState(() {
      if (profile.isWedding && (profile.brideName.isNotEmpty || profile.groomName.isNotEmpty)) {
        _eventKind = ShootEventKind.wedding;
        _brideName.text = profile.brideName;
        _groomName.text = profile.groomName;
      } else {
        _eventKind = ShootEventKind.other;
        _clientName.text = profile.clientName.isNotEmpty ? profile.clientName : profile.displayLabel;
      }
      _clientType.text = profile.clientType;
      final contact = profile.clientContact.isNotEmpty ? profile.clientContact : profile.phoneNumber;
      _clientContact.text = contact;
      _city.text = profile.city;
      _venue.text = profile.venue;
      _eventName.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Prefilled details for ${profile.displayLabel}'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _pickDay() async {
    final parts = _day.split('-').map(int.parse).toList();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(parts[0], parts[1], parts[2]),
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );
    if (picked != null) setState(() => _day = localDayKey(picked));
  }

  ShootFormData _buildFormData() {
    final isWedding = _eventKind == ShootEventKind.wedding;
    final contact = _clientContact.text.trim();
    String bride = '';
    String groom = '';
    String clientName = '';

    if (isWedding) {
      bride = _brideName.text.trim();
      groom = _groomName.text.trim();
      clientName = resolveShootClientName(isWedding: true, brideName: bride, groomName: groom, clientName: '');
    } else {
      clientName = _clientName.text.trim();
    }

    final phone = looksLikePhoneNumber(contact) ? contact : '';

    return ShootFormData(
      day: _day,
      clientName: clientName,
      brideName: bride,
      groomName: groom,
      phoneNumber: phone,
      clientType: _clientType.text.trim(),
      clientContact: looksLikePhoneNumber(contact) ? '' : contact,
      city: _city.text.trim(),
      eventName: _eventName.text.trim(),
      venue: _venue.text.trim(),
      startTime: _startTime,
      endTime: _endTime,
      photoTeam: _photoTeam.text.trim(),
      videoTeam: _videoTeam.text.trim(),
      addons: _addons.text.trim(),
      createDeliverableTimeline: _createTimeline,
    );
  }

  Future<void> _submit() async {
    if (_eventKind == ShootEventKind.wedding) {
      if (_brideName.text.trim().isEmpty && _groomName.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter bride or groom name')),
        );
        return;
      }
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave(_buildFormData());
      if (mounted) Navigator.of(context).pop(_day);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profiles = _clientProfiles;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit shoot details' : 'Add shoot details'),
        backgroundColor: AppColors.card,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            _sectionTitle('Schedule'),
            _dateTile(),
            const SizedBox(height: 12),
            const Text('Event type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
            const SizedBox(height: 8),
            ShootFormSegmented<ShootEventKind>(
              segments: const [
                ButtonSegment(value: ShootEventKind.wedding, label: Text('Wedding')),
                ButtonSegment(value: ShootEventKind.other, label: Text('Other')),
              ],
              selected: _eventKind,
              onChanged: (k) => setState(() => _eventKind = k),
            ),
            const SizedBox(height: 20),
            _sectionTitle('Client & event'),
            if (_clientsLoading)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: LinearProgressIndicator(minHeight: 2, color: AppColors.violet),
              ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: _eventKind == ShootEventKind.wedding
                  ? Column(
                      key: const ValueKey('wedding'),
                      children: [
                        ShootClientAutocompleteField(
                          controller: _brideName,
                          label: 'Bride name',
                          hint: 'e.g. Yesh',
                          profiles: profiles,
                          onSelected: _applyClientProfile,
                        ),
                        ShootClientAutocompleteField(
                          controller: _groomName,
                          label: 'Groom name',
                          hint: 'e.g. Harika',
                          profiles: profiles,
                          onSelected: _applyClientProfile,
                        ),
                      ],
                    )
                  : ShootClientAutocompleteField(
                      key: const ValueKey('other'),
                      controller: _clientName,
                      label: 'Client name',
                      hint: 'e.g. Yesh & Harika',
                      required: true,
                      profiles: profiles,
                      onSelected: _applyClientProfile,
                    ),
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _field(_eventName, 'Event name', hint: 'Reception')),
                const SizedBox(width: 12),
                Expanded(child: _field(_clientType, 'Type of client', hint: 'HSP, corporate…')),
              ],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _field(_clientContact, 'Client contact', hint: 'Phone / email')),
                const SizedBox(width: 12),
                Expanded(child: _field(_city, 'City', hint: 'City')),
              ],
            ),
            _field(_venue, 'Venue', hint: 'Ceremony / reception location'),
            const SizedBox(height: 8),
            ShootTimeField(
              label: 'Start time',
              value: _startTime,
              onChanged: (v) => setState(() => _startTime = v),
            ),
            const SizedBox(height: 12),
            ShootTimeField(
              label: 'End time',
              value: _endTime,
              onChanged: (v) => setState(() => _endTime = v),
            ),
            const SizedBox(height: 20),
            _sectionTitle('On-site crew'),
            _field(_photoTeam, 'Photo team (on-site)', hint: 'Names / crew going', maxLines: 4),
            _field(_videoTeam, 'Video team (on-site)', hint: 'Names / crew going', maxLines: 4),
            _field(_addons, 'Notes / add-ons', hint: 'Anything extra to remember', maxLines: 4),
            if (!widget.isEdit && widget.showDeliverableToggle) ...[
              const SizedBox(height: 8),
              Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                child: SwitchListTile(
                  title: const Text('Create deliverable timeline', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Spawns standard deliverable tasks when you save', style: TextStyle(fontSize: 12)),
                  value: _createTimeline,
                  onChanged: (v) => setState(() => _createTimeline = v),
                ),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.violet,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _saving
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(widget.isEdit ? 'Save changes' : 'Save shoot', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.6)),
    );
  }

  Widget _dateTile() {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: ListTile(
        tileColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: AppColors.border)),
        leading: const Icon(Icons.calendar_today, color: AppColors.violet),
        title: const Text('Day', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
        subtitle: Text(formatFriendlyDay(_day, includeYear: true), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
        trailing: const Icon(Icons.chevron_right),
        onTap: _pickDay,
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    Key? key,
    String? hint,
    bool required = false,
    int maxLines = 1,
  }) {
    return Padding(
      key: key,
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          filled: true,
          fillColor: Colors.white,
          alignLabelWithHint: maxLines > 1,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        ),
        validator: required
            ? (v) {
                if (v == null || v.trim().isEmpty) return '$label is required';
                return null;
              }
            : null,
      ),
    );
  }
}
