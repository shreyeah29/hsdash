import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';
import 'package:hsdash_mobile/models/user.dart';

/// Production teams — matches backend `Team` enum and `Task.assignedTeam`.
abstract final class StudioTeam {
  static const photo = 'PHOTO_TEAM';
  static const cinematic = 'CINEMATIC_TEAM';
  static const traditional = 'TRADITIONAL_TEAM';
  static const album = 'ALBUM_TEAM';
  static const coordinator = 'COORDINATOR_TEAM';

  static const productionOrder = [photo, cinematic, traditional, album, coordinator];

  static const labels = {
    photo: 'Photo',
    cinematic: 'Cinematic',
    traditional: 'Traditional',
    album: 'Album',
    coordinator: 'Coordinator',
  };

  static const sectionTitles = {
    photo: 'Photo team',
    cinematic: 'Cinematic & video',
    traditional: 'Traditional team',
    album: 'Album team',
    coordinator: 'Coordinator team',
  };

  static const descriptions = {
    photo: 'Photo editing, albums prep, stills workflow',
    cinematic: 'Cinematic films, reels, video deliverables',
    traditional: 'Traditional edit style deliverables',
    album: 'Album design and print-ready exports',
    coordinator: 'Assignments, scheduling, production ops',
  };

  static IconData iconFor(String? team) {
    switch (team) {
      case photo:
        return Icons.photo_camera_outlined;
      case cinematic:
        return Icons.movie_creation_outlined;
      case traditional:
        return Icons.auto_awesome_outlined;
      case album:
        return Icons.collections_bookmark_outlined;
      case coordinator:
        return Icons.event_note_outlined;
      default:
        return Icons.group_outlined;
    }
  }

  static Color accentFor(String? team) {
    switch (team) {
      case photo:
        return PremiumLight.accent;
      case cinematic:
        return PremiumLight.info;
      case traditional:
        return PremiumLight.warning;
      case album:
        return PremiumLight.success;
      case coordinator:
        return PremiumLight.accentSecondary;
      default:
        return PremiumLight.textMuted;
    }
  }

  static String displayLabel(String? team) {
    if (team == null || team.isEmpty) return 'Unassigned';
    return labels[team] ?? team.replaceAll('_TEAM', '').replaceAll('_', ' ');
  }

  static String? normalize(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    if (productionOrder.contains(raw)) return raw;
    return null;
  }
}

class TeamMemberSection {
  const TeamMemberSection({
    required this.id,
    required this.title,
    required this.members,
    this.subtitle,
  });

  final String id;
  final String title;
  final String? subtitle;
  final List<User> members;
}

/// Groups users for the admin team screen (admins → production teams → unassigned).
List<TeamMemberSection> groupUsersByStudioTeam(List<User> users) {
  final admins = users.where((u) => u.role == UserRole.admin).toList();
  final others = users.where((u) => u.role != UserRole.admin).toList();

  final sections = <TeamMemberSection>[];

  if (admins.isNotEmpty) {
    sections.add(TeamMemberSection(
      id: 'admin',
      title: 'Administration',
      subtitle: 'Full studio access',
      members: admins,
    ));
  }

  for (final teamKey in StudioTeam.productionOrder) {
    final members = others.where((u) => u.team == teamKey).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
    if (members.isEmpty) continue;
    sections.add(TeamMemberSection(
      id: teamKey,
      title: StudioTeam.sectionTitles[teamKey]!,
      subtitle: StudioTeam.descriptions[teamKey],
      members: members,
    ));
  }

  final unassigned = others.where((u) => StudioTeam.normalize(u.team) == null).toList()
    ..sort((a, b) => a.name.compareTo(b.name));
  if (unassigned.isNotEmpty) {
    sections.add(TeamMemberSection(
      id: 'unassigned',
      title: 'Needs team assignment',
      subtitle: 'Edit member to set Photo, Cinematic, etc.',
      members: unassigned,
    ));
  }

  return sections;
}
