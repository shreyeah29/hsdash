import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/shoot_client_profiles.dart';
import 'package:hsdash_mobile/models/shoot_client_profile.dart';

enum ShootClientSourceMode { newClient, existingClient }

enum ShootEventKind { wedding, other }

/// Segmented control — New / Existing client or Wedding / Other.
class ShootFormSegmented<T extends Object> extends StatelessWidget {
  const ShootFormSegmented({
    super.key,
    required this.segments,
    required this.selected,
    required this.onChanged,
  });

  final List<ButtonSegment<T>> segments;
  final T selected;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<T>(
      segments: segments,
      selected: {selected},
      onSelectionChanged: (s) => onChanged(s.first),
      style: ButtonStyle(
        visualDensity: VisualDensity.compact,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return Colors.white;
          return AppColors.textPrimary;
        }),
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.violet;
          return Colors.white;
        }),
      ),
    );
  }
}

/// Searchable list of clients from past shoots.
class ShootExistingClientPicker extends StatelessWidget {
  const ShootExistingClientPicker({
    super.key,
    required this.profiles,
    required this.loading,
    required this.error,
    required this.searchController,
    required this.onSearchChanged,
    required this.selected,
    required this.onSelect,
    required this.onRetry,
  });

  final List<ShootClientProfile> profiles;
  final bool loading;
  final String? error;
  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  final ShootClientProfile? selected;
  final ValueChanged<ShootClientProfile> onSelect;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: searchController,
          onChanged: onSearchChanged,
          decoration: InputDecoration(
            labelText: 'Search client',
            hintText: 'Aishwarya & Rahul',
            prefixIcon: const Icon(Icons.search, color: AppColors.violet),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        const SizedBox(height: 12),
        if (loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator(color: AppColors.violet)),
          )
        else if (error != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Could not load clients. Check your connection and try again.',
                  style: const TextStyle(color: AppColors.rose, fontSize: 13),
                ),
                TextButton(onPressed: onRetry, child: const Text('Retry')),
              ],
            ),
          )
        else if (profiles.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('No saved clients yet. Add a shoot with a new client first.', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          )
        else
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: profiles.length,
              separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
              itemBuilder: (context, i) {
                final p = profiles[i];
                final isSel = selected?.id == p.id;
                return ListTile(
                  tileColor: Colors.white,
                  selectedTileColor: const Color(0xFFF0EDFF),
                  title: Text(p.displayLabel, style: TextStyle(fontWeight: isSel ? FontWeight.w700 : FontWeight.w600)),
                  subtitle: p.city.isNotEmpty ? Text(p.city, style: const TextStyle(fontSize: 12)) : null,
                  trailing: isSel ? const Icon(Icons.check_circle, color: AppColors.violet) : null,
                  onTap: () => onSelect(p),
                );
              },
            ),
          ),
      ],
    );
  }
}

/// Read-only summary after an existing client is chosen.
class ShootClientPrefillSummary extends StatelessWidget {
  const ShootClientPrefillSummary({super.key, required this.profile});

  final ShootClientProfile profile;

  @override
  Widget build(BuildContext context) {
    final lines = <String>[];
    if (profile.isWedding) {
      if (profile.brideName.isNotEmpty) lines.add('Bride: ${profile.brideName}');
      if (profile.groomName.isNotEmpty) lines.add('Groom: ${profile.groomName}');
    } else if (profile.clientName.isNotEmpty) {
      lines.add(profile.clientName);
    }
    if (profile.phoneNumber.isNotEmpty) lines.add('Phone: ${profile.phoneNumber}');
    if (profile.clientContact.isNotEmpty) lines.add('Contact: ${profile.clientContact}');
    if (profile.city.isNotEmpty) lines.add('City: ${profile.city}');
    if (profile.venue.isNotEmpty) lines.add('Venue: ${profile.venue}');

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: Material(
        key: ValueKey(profile.id),
        color: const Color(0xFFF0EDFF),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(profile.displayLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              if (lines.isNotEmpty) ...[
                const SizedBox(height: 6),
                ...lines.map((l) => Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(l, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                    )),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Inline suggestions while typing a client / bride / groom name.
class ShootClientAutocompleteField extends StatefulWidget {
  const ShootClientAutocompleteField({
    super.key,
    required this.controller,
    required this.label,
    required this.profiles,
    required this.onSelected,
    this.hint,
    this.required = false,
    this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool required;
  final List<ShootClientProfile> profiles;
  final ValueChanged<ShootClientProfile> onSelected;
  final VoidCallback? onChanged;

  @override
  State<ShootClientAutocompleteField> createState() => _ShootClientAutocompleteFieldState();
}

class _ShootClientAutocompleteFieldState extends State<ShootClientAutocompleteField> {
  final _focusNode = FocusNode();
  bool _suppressSuggestions = false;
  String? _lastAutoFilledId;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) setState(() {});
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _focusNode.dispose();
    super.dispose();
  }

  void _onTextChanged(String value) {
    setState(() => _suppressSuggestions = false);
    widget.onChanged?.call();

    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      final match = resolveClientProfileForQuery(widget.profiles, value);
      if (match == null || match.id == _lastAutoFilledId) return;
      widget.onSelected(match);
      _lastAutoFilledId = match.id;
      setState(() => _suppressSuggestions = true);
    });
  }

  List<ShootClientProfile> get _suggestions {
    if (_suppressSuggestions) return [];
    return filterClientProfiles(widget.profiles, widget.controller.text);
  }

  void _pick(ShootClientProfile profile) {
    _debounce?.cancel();
    _lastAutoFilledId = profile.id;
    setState(() => _suppressSuggestions = true);
    widget.onSelected(profile);
    _focusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final suggestions = _suggestions;
    final showList = _focusNode.hasFocus && suggestions.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: widget.controller,
            focusNode: _focusNode,
            onChanged: _onTextChanged,
            decoration: InputDecoration(
              labelText: widget.label,
              hintText: widget.hint,
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
            validator: widget.required
                ? (v) {
                    if (v == null || v.trim().isEmpty) return '${widget.label} is required';
                    return null;
                  }
                : null,
          ),
          if (showList) ...[
            const SizedBox(height: 6),
            Material(
              elevation: 2,
              shadowColor: Colors.black26,
              borderRadius: BorderRadius.circular(14),
              color: Colors.white,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Column(
                  children: [
                    for (var i = 0; i < suggestions.length; i++) ...[
                      if (i > 0) const Divider(height: 1, color: AppColors.border),
                      ListTile(
                        dense: true,
                        tileColor: Colors.white,
                        title: Text(
                          suggestions[i].displayLabel,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        subtitle: _subtitleFor(suggestions[i]),
                        trailing: const Icon(Icons.north_west, size: 16, color: AppColors.violet),
                        onTap: () => _pick(suggestions[i]),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget? _subtitleFor(ShootClientProfile p) {
    final parts = <String>[];
    if (p.clientType.isNotEmpty) parts.add(p.clientType);
    if (p.city.isNotEmpty) parts.add(p.city);
    if (parts.isEmpty) return null;
    return Text(parts.join(' · '), style: const TextStyle(fontSize: 12));
  }
}
