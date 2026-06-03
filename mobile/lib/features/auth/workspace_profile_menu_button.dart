import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_profile.dart';

/// Tappable workspace avatar — opens account actions (switch profile, log out).
class WorkspaceProfileMenuButton extends StatelessWidget {
  const WorkspaceProfileMenuButton({
    super.key,
    required this.profile,
    required this.onSwitchProfile,
    required this.onLogout,
    this.size = 56,
  });

  final AdminWorkspaceProfile profile;
  final VoidCallback onSwitchProfile;
  final VoidCallback onLogout;
  final double size;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: '${profile.label} — account',
      offset: Offset(0, size + 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onSelected: (value) {
        switch (value) {
          case 'switch':
            onSwitchProfile();
          case 'logout':
            onLogout();
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem<String>(
          value: 'switch',
          child: Row(
            children: [
              Icon(Icons.swap_horiz_rounded, size: 20),
              SizedBox(width: 12),
              Text('Switch profile', style: TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
        PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: [
              Icon(Icons.logout_rounded, size: 20, color: Colors.red),
              const SizedBox(width: 12),
              const Text('Log out', style: TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          customBorder: const CircleBorder(),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.border, width: 2),
            ),
            child: ClipOval(
              child: Image.asset(
                profile.avatarAsset,
                fit: profile.avatarFit,
                alignment: profile.avatarAlignment,
                filterQuality: FilterQuality.medium,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
