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
    this.onChangePassword,
    this.onChangeUsername,
    this.size = 56,
    this.borderColor,
    this.menuSurfaceColor,
  });

  final AdminWorkspaceProfile profile;
  final VoidCallback onSwitchProfile;
  final VoidCallback onLogout;
  final VoidCallback? onChangePassword;
  final VoidCallback? onChangeUsername;
  final double size;
  final Color? borderColor;
  final Color? menuSurfaceColor;

  @override
  Widget build(BuildContext context) {
    final surface = menuSurfaceColor ?? Colors.white;
    final darkMenu = surface.computeLuminance() < 0.35;
    final labelColor = darkMenu ? const Color(0xFFF4F4F5) : const Color(0xFF18181B);

    return PopupMenuButton<String>(
      tooltip: '${profile.label} — account',
      offset: Offset(0, size + 4),
      color: surface,
      surfaceTintColor: Colors.transparent,
      elevation: 12,
      shadowColor: Colors.black.withValues(alpha: 0.45),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: darkMenu ? const Color(0xFF2A3142) : AppColors.border),
      ),
      onSelected: (value) {
        switch (value) {
          case 'switch':
            onSwitchProfile();
          case 'password':
            onChangePassword?.call();
          case 'username':
            onChangeUsername?.call();
          case 'logout':
            onLogout();
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem<String>(
          value: 'switch',
          height: 48,
          child: Row(
            children: [
              Icon(Icons.swap_horiz_rounded, size: 20, color: darkMenu ? const Color(0xFF8B5CF6) : AppColors.violet),
              const SizedBox(width: 12),
              Text(
                'Switch profile',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: labelColor),
              ),
            ],
          ),
        ),
        if (onChangePassword != null)
          PopupMenuItem<String>(
            value: 'password',
            height: 48,
            child: Row(
              children: [
                Icon(Icons.lock_outline_rounded, size: 20, color: darkMenu ? const Color(0xFF8B5CF6) : AppColors.violet),
                const SizedBox(width: 12),
                Text(
                  'Change password',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: labelColor),
                ),
              ],
            ),
          ),
        if (onChangeUsername != null)
          PopupMenuItem<String>(
            value: 'username',
            height: 48,
            child: Row(
              children: [
                Icon(Icons.alternate_email_rounded, size: 20, color: darkMenu ? const Color(0xFF8B5CF6) : AppColors.violet),
                const SizedBox(width: 12),
                Text(
                  'Change username',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: labelColor),
                ),
              ],
            ),
          ),
        PopupMenuItem<String>(
          value: 'logout',
          height: 48,
          child: Row(
            children: [
              Icon(Icons.logout_rounded, size: 20, color: Colors.red.shade400),
              const SizedBox(width: 12),
              Text(
                'Log out',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: labelColor),
              ),
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
              border: Border.all(color: borderColor ?? AppColors.border, width: 2),
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
