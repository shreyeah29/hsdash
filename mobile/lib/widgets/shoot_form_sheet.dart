import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';

/// Admin create/edit shoot — maps to `POST` / `PUT /production-calendar/entries`.
class ShootFormSheet extends StatefulWidget {
  const ShootFormSheet({
    super.key,
    required this.initial,
    required this.onSave,
    this.isEdit = false,
  });

  final ShootFormData initial;
  final Future<void> Function(ShootFormData form) onSave;
  final bool isEdit;

  @override
  State<ShootFormSheet> createState() => _ShootFormSheetState();
}

class _ShootFormSheetState extends State<ShootFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _clientName;
  late final TextEditingController _clientType;
  late final TextEditingController _clientContact;
  late final TextEditingController _city;
  late final TextEditingController _eventName;
  late final TextEditingController _venue;
  late final TextEditingController _startTime;
  late final TextEditingController _endTime;
  late final TextEditingController _photoTeam;
  late final TextEditingController _videoTeam;
  late final TextEditingController _addons;
  bool _createTimeline = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final f = widget.initial;
    _clientName = TextEditingController(text: f.clientName);
    _clientType = TextEditingController(text: f.clientType);
    _clientContact = TextEditingController(text: f.clientContact);
    _city = TextEditingController(text: f.city);
    _eventName = TextEditingController(text: f.eventName);
    _venue = TextEditingController(text: f.venue);
    _startTime = TextEditingController(text: f.startTime);
    _endTime = TextEditingController(text: f.endTime);
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
    _startTime.dispose();
    _endTime.dispose();
    _photoTeam.dispose();
    _videoTeam.dispose();
    _addons.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave(
        ShootFormData(
          day: widget.initial.day,
          clientName: _clientName.text.trim(),
          clientType: _clientType.text.trim(),
          clientContact: _clientContact.text.trim(),
          city: _city.text.trim(),
          eventName: _eventName.text.trim(),
          venue: _venue.text.trim(),
          startTime: _startTime.text.trim(),
          endTime: _endTime.text.trim(),
          photoTeam: _photoTeam.text.trim(),
          videoTeam: _videoTeam.text.trim(),
          addons: _addons.text.trim(),
          createDeliverableTimeline: _createTimeline,
        ),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.isEdit ? 'Edit shoot' : 'New shoot',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text('Day: ${widget.initial.day}', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
              const SizedBox(height: 16),
              _field(_clientName, 'Client names', required: true),
              _field(_clientType, 'Client type'),
              _field(_clientContact, 'Contact'),
              _field(_city, 'City'),
              _field(_eventName, 'Event name'),
              _field(_venue, 'Venue'),
              Row(
                children: [
                  Expanded(child: _field(_startTime, 'Start time')),
                  const SizedBox(width: 10),
                  Expanded(child: _field(_endTime, 'End time')),
                ],
              ),
              _field(_photoTeam, 'Photo team'),
              _field(_videoTeam, 'Video team'),
              _field(_addons, 'Addons', maxLines: 2),
              if (!widget.isEdit)
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Create deliverable timeline', style: TextStyle(fontSize: 14)),
                  subtitle: const Text('Spawns deliverable tasks on save', style: TextStyle(fontSize: 12)),
                  value: _createTimeline,
                  onChanged: (v) => setState(() => _createTimeline = v),
                ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(widget.isEdit ? 'Save changes' : 'Create shoot'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label, {bool required = false, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
        validator: required
            ? (v) {
                if (v == null || v.trim().isEmpty) return '$label required';
                return null;
              }
            : null,
      ),
    );
  }
}
