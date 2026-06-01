import 'package:flutter/material.dart';
import 'package:hsdash_mobile/models/tasks_query.dart';
import 'package:hsdash_mobile/models/user_form.dart';

class UserFormSheet extends StatefulWidget {
  const UserFormSheet({
    super.key,
    required this.initial,
    required this.isEdit,
    required this.onSave,
  });

  final UserFormData initial;
  final bool isEdit;
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
    _team = f.team ?? TaskTeam.photo;
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!widget.isEdit && _password.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password must be at least 8 characters')));
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
          designation: _designation.text.trim(),
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
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.isEdit ? 'Edit team member' : 'Add team member',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Name required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
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
                items: UserRoleApi.values.map((r) => DropdownMenuItem(value: r, child: Text(UserRoleApi.labels[r]!))).toList(),
                onChanged: (v) => setState(() {
                  _role = v ?? UserRoleApi.editor;
                  if (!_needsTeam) _team = null;
                }),
              ),
              if (_needsTeam) ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _team,
                  decoration: const InputDecoration(labelText: 'Team'),
                  items: TaskTeam.values.map((t) => DropdownMenuItem(value: t, child: Text(TaskTeam.labels[t]!))).toList(),
                  onChanged: (v) => setState(() => _team = v),
                ),
                const SizedBox(height: 12),
                TextFormField(controller: _designation, decoration: const InputDecoration(labelText: 'Designation')),
              ],
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Active account'),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(widget.isEdit ? 'Save' : 'Create user'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
