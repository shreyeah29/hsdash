import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/models/studio_team.dart';
import 'package:hsdash_mobile/models/user_form.dart';

class UserFormSheet extends StatefulWidget {
  const UserFormSheet({
    super.key,
    required this.initial,
    required this.isEdit,
    required this.onSave,
    this.forCreate = false,
  });

  final UserFormData initial;
  final bool isEdit;
  final bool forCreate;
  final Future<void> Function(UserFormData form) onSave;

  @override
  State<UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends State<UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _password;
  late final TextEditingController _designation;
  late String _role;
  late String? _team;
  late bool _isActive;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final f = widget.initial;
    _name = TextEditingController(text: f.name);
    _email = TextEditingController(text: f.email);
    _password = TextEditingController(text: f.password ?? '');
    _designation = TextEditingController(text: f.designation ?? '');
    _role = f.role;
    _team = StudioTeam.normalize(f.team) ?? StudioTeam.photo;
    _isActive = f.isActive;
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _designation.dispose();
    super.dispose();
  }

  bool get _needsTeam => _role == UserRoleApi.coordinator || _role == UserRoleApi.editor;

  List<String> get _roleOptions {
    if (widget.forCreate) return const [UserRoleApi.editor, UserRoleApi.coordinator];
    return UserRoleApi.values;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_needsTeam && (_team == null || _team!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a production team (Photo, Cinematic, etc.)')),
      );
      return;
    }
    if (!widget.isEdit && _password.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await widget.onSave(
        UserFormData(
          name: _name.text.trim(),
          email: _email.text.trim(),
          role: _role,
          password: _password.text.isEmpty ? null : _password.text,
          team: _needsTeam ? _team : null,
          designation: _designation.text.trim().isEmpty ? null : _designation.text.trim(),
          isActive: _isActive,
        ),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.isEdit ? 'Edit team member' : 'Add team member',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Team drives task routing — Photo, Cinematic, Album, and more update across the app.',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _saving ? null : () => Navigator.of(context).pop(),
                    tooltip: 'Close',
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      foregroundColor: AppColors.textMuted,
                      minimumSize: const Size(36, 36),
                      padding: EdgeInsets.zero,
                    ),
                    icon: const Icon(Icons.close_rounded, size: 22),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Name required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: widget.isEdit ? 'New password (optional)' : 'Password',
                  hintText: 'Min 8 characters',
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _role,
                decoration: const InputDecoration(labelText: 'Role'),
                items: _roleOptions
                    .map((r) => DropdownMenuItem(value: r, child: Text(UserRoleApi.labels[r]!)))
                    .toList(),
                onChanged: (v) => setState(() {
                  _role = v ?? UserRoleApi.editor;
                  if (!_needsTeam) {
                    _team = null;
                  } else {
                    _team ??= StudioTeam.photo;
                  }
                }),
              ),
              if (_needsTeam) ...[
                const SizedBox(height: 16),
                const Text(
                  'Production team',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Tasks and assignments filter by this team across HS Dash.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 10),
                ...StudioTeam.productionOrder.map((teamKey) {
                  final selected = _team == teamKey;
                  final accent = StudioTeam.accentFor(teamKey);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: selected ? accent.withValues(alpha: 0.12) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => setState(() => _team = teamKey),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selected ? accent : AppColors.border,
                              width: selected ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(StudioTeam.iconFor(teamKey), color: accent, size: 22),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      StudioTeam.sectionTitles[teamKey]!,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: selected ? accent : AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      StudioTeam.descriptions[teamKey]!,
                                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                    ),
                                  ],
                                ),
                              ),
                              if (selected) Icon(Icons.check_circle, color: accent, size: 20),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _designation,
                  decoration: const InputDecoration(
                    labelText: 'Skill note (optional)',
                    hintText: 'e.g. Senior photo editor',
                  ),
                ),
              ],
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Active account'),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _saving ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.violet,
                  minimumSize: const Size.fromHeight(52),
                ),
                child: _saving
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(widget.isEdit ? 'Save changes' : 'Create member'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
