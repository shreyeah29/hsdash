import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/admin/admin_activity_tab.dart';
import 'package:hsdash_mobile/features/admin/admin_leads_tab.dart';
import 'package:hsdash_mobile/features/admin/admin_deadlines_tab.dart';
import 'package:hsdash_mobile/features/admin/admin_home_tab.dart';
import 'package:hsdash_mobile/features/admin/team_management_tab.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/features/weddings_archive/weddings_archive_tab.dart';
import 'package:hsdash_mobile/widgets/shoot_calendar_panel.dart';

class AdminShell extends ConsumerStatefulWidget {
  const AdminShell({super.key, required this.user});

  final User user;

  @override
  ConsumerState<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends ConsumerState<AdminShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return DashboardShell(
      tabIndex: _tab,
      onTabChanged: (i) => setState(() => _tab = i),
      accent: AppColors.violet,
      premiumDarkTabIndices: const {0, 1, 2, 3, 4},
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Overview'),
        NavigationDestination(icon: Icon(Icons.person_add_outlined), selectedIcon: Icon(Icons.person_add), label: 'Leads'),
        NavigationDestination(icon: Icon(Icons.event_note_outlined), selectedIcon: Icon(Icons.event_note), label: 'Deadlines'),
        NavigationDestination(icon: Icon(Icons.videocam_outlined), selectedIcon: Icon(Icons.videocam), label: 'Shoots'),
        NavigationDestination(icon: Icon(Icons.folder_outlined), selectedIcon: Icon(Icons.folder), label: 'Weddings'),
        NavigationDestination(icon: Icon(Icons.timeline_outlined), selectedIcon: Icon(Icons.timeline), label: 'Activity'),
        NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Team'),
      ],
      children: const [
        AdminHomeTab(),
        AdminLeadsTab(),
        AdminDeadlinesTab(),
        ShootCalendarPanel(mode: ShootCalendarMode.admin),
        WeddingsArchiveTab(accent: AppColors.violet, canEdit: true, canActivate: false),
        AdminActivityTab(),
        TeamManagementTab(),
      ],
    );
  }
}
