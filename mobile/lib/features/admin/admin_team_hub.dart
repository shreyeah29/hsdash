import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/admin/careers_tab.dart';
import 'package:hsdash_mobile/features/admin/team_management_tab.dart';

/// Team section hub — Roster | Careers (matches web /admin/team).
class AdminTeamHub extends ConsumerStatefulWidget {
  const AdminTeamHub({super.key});

  @override
  ConsumerState<AdminTeamHub> createState() => _AdminTeamHubState();
}

class _AdminTeamHubState extends ConsumerState<AdminTeamHub> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    watchAdminPalette(ref);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
          child: Row(
            children: [
              Expanded(
                child: _HubTab(
                  label: 'Roster',
                  selected: _tab == 0,
                  onTap: () => setState(() => _tab = 0),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _HubTab(
                  label: 'Careers',
                  selected: _tab == 1,
                  onTap: () => setState(() => _tab = 1),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: IndexedStack(
            index: _tab,
            children: const [
              TeamManagementTab(adminThemed: true),
              CareersTab(),
            ],
          ),
        ),
      ],
    );
  }
}

class _HubTab extends StatelessWidget {
  const _HubTab({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AdminHomePalette.text : AdminHomePalette.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AdminHomePalette.cardBorder),
          ),
          child: Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
              color: selected ? AdminHomePalette.background : AdminHomePalette.text,
            ),
          ),
        ),
      ),
    );
  }
}
