import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';

/// Keeps admin palette in sync so every tab rebuilds when Studio / Wedding toggles.
class AdminTabWrapper extends ConsumerWidget {
  const AdminTabWrapper({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    watchAdminPalette(ref);
    return AdminPageBackground(layerBackdrop: false, child: child);
  }
}
