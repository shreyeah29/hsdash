import 'package:flutter/painting.dart';

/// Admin workspace profiles — cosmetic only; same dashboard for all.
enum AdminWorkspaceProfile {
  damini(
    'Damini',
    'assets/images/profiles/damini.png',
    0xFFE879F9,
    0xFF9333EA,
    BoxFit.cover,
    Alignment(0, -0.1),
    1.12,
  ),
  harish('Harish', 'assets/images/profiles/harish.png', 0xFF34D399, 0xFF059669),
  shankar('Shankar', 'assets/images/profiles/shankar.png', 0xFF60A5FA, 0xFF2563EB);

  const AdminWorkspaceProfile(
    this.label,
    this.avatarAsset,
    this.glowStart,
    this.glowEnd, [
    this.avatarFit = BoxFit.contain,
    this.avatarAlignment = Alignment.center,
    this.avatarZoom = 1,
  ]);

  final String label;
  final String avatarAsset;
  final int glowStart;
  final int glowEnd;
  final BoxFit avatarFit;
  final Alignment avatarAlignment;
  final double avatarZoom;

  static AdminWorkspaceProfile? tryParse(String? value) {
    if (value == null || value.isEmpty) return null;
    for (final p in AdminWorkspaceProfile.values) {
      if (p.name == value) return p;
    }
    return null;
  }
}
