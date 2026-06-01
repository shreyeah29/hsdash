import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/theme.dart';

class LoginChoiceScreen extends StatelessWidget {
  const LoginChoiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'HS DASH',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          letterSpacing: 3,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMuted,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Choose your portal',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  const Text('Same accounts as the web dashboard.', style: TextStyle(color: AppColors.textMuted)),
                  const SizedBox(height: 28),
                  _PortalCard(
                    title: 'Admin login',
                    subtitle: 'Overview, deliverables radar, calendar & team roster',
                    accent: AppColors.violet,
                    icon: Icons.admin_panel_settings_outlined,
                    onTap: () => context.go('/login/admin'),
                  ),
                  const SizedBox(height: 12),
                  _PortalCard(
                    title: 'Team login',
                    subtitle: 'Coordinators & editors — tasks, assignments & alerts',
                    accent: AppColors.emerald,
                    icon: Icons.groups_outlined,
                    onTap: () => context.go('/login/team'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PortalCard extends StatelessWidget {
  const _PortalCard({
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final Color accent;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: accent),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: accent),
            ],
          ),
        ),
      ),
    );
  }
}
