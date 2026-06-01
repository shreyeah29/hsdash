import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/widgets/shoot_time_picker.dart';

/// Full-screen add/edit shoot — same fields as web `Add shoot details`.
class ShootFormScreen extends StatefulWidget {
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
  State<ShootFormScreen> createState() => _ShootFormScreenState();
}

class _ShootFormScreenState extends State<ShootFormScreen> {
  final _formKey = GlobalKey<FormState>();
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

  @override
  void initState() {
    super.initState();
    final f = widget.initial;
    _day = f.day;
    _startTime = f.startTime.isEmpty ? '10:00 AM' : f.startTime;
    _endTime = f.endTime.isEmpty ? '10:00 AM' : f.endTime;
    _clientName = TextEditingController(text: f.clientName);
    _clientType = TextEditingController(text: f.clientType);
    _clientContact = TextEditingController(text: f.clientContact);
    _city = TextEditingController(text: f.city);
    _eventName = TextEditingController(text: f.eventName);
    _venue = TextEditingController(text: f.venue);
    _photoTeam = TextEditingController(text: f.photoTeam);
    _videoTeam = TextEditingController(text: f.videoTeam);
    _addons = TextEditingController(text: f.addons);
    _createTimeline = f.createDeliverableTimeline;
  }

  @override
  void dispose() {
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave(
        ShootFormData(
          day: _day,
          clientName: _clientName.text.trim(),
          clientType: _clientType.text.trim(),
          clientContact: _clientContact.text.trim(),
          city: _city.text.trim(),
          eventName: _eventName.text.trim(),
          venue: _venue.text.trim(),
          startTime: _startTime,
          endTime: _endTime,
          photoTeam: _photoTeam.text.trim(),
          videoTeam: _videoTeam.text.trim(),
          addons: _addons.text.trim(),
          createDeliverableTimeline: _createTimeline,
        ),
      );
      if (mounted) Navigator.of(context).pop(_day);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FC),
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit shoot details' : 'Add shoot details'),
        backgroundColor: Colors.white,
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
            const SizedBox(height: 20),
            _sectionTitle('Client & event'),
            _field(_clientName, 'Client name', hint: 'e.g. Rahul & Priya', required: true),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _field(_clientType, 'Type of client', hint: 'Wedding, corporate…')),
                const SizedBox(width: 12),
                Expanded(child: _field(_eventName, 'Event name', hint: 'Reception, ceremony…')),
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
    String? hint,
    bool required = false,
    int maxLines = 1,
  }) {
    return Padding(
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
