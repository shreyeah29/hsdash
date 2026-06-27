import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/activity_feed_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:intl/intl.dart';

/// Light / dark visual tokens for activity screens.
class OpsThemeData {
  const OpsThemeData({
    required this.bg,
    required this.group,
    required this.divider,
    required this.textPrimary,
    required this.textMuted,
    required this.segTrack,
    required this.segSelected,
    required this.inputFill,
    required this.emptyIconBg,
    required this.cardBorder,
    this.cardShadow,
    this.borderedGroups = false,
  });

  final Color bg;
  final Color group;
  final Color divider;
  final Color textPrimary;
  final Color textMuted;
  final Color segTrack;
  final Color segSelected;
  final Color inputFill;
  final Color emptyIconBg;
  final Color cardBorder;
  final List<BoxShadow>? cardShadow;
  final bool borderedGroups;

  static final light = OpsThemeData(
    bg: PremiumLight.background,
    group: PremiumLight.card,
    divider: PremiumLight.divider,
    textPrimary: PremiumLight.textPrimary,
    textMuted: PremiumLight.textMuted,
    segTrack: PremiumLight.surface,
    segSelected: PremiumLight.card,
    inputFill: PremiumLight.surface,
    emptyIconBg: PremiumLight.elevated,
    cardBorder: PremiumLight.border,
    cardShadow: PremiumLight.cardShadow,
    borderedGroups: true,
  );

  static final dark = OpsThemeData(
    bg: AdminHomePalette.background,
    group: AdminHomePalette.card,
    divider: AdminHomePalette.textSecondary.withValues(alpha: 0.18),
    textPrimary: AdminHomePalette.text,
    textMuted: AdminHomePalette.textSecondary,
    segTrack: AdminHomePalette.surface,
    segSelected: AdminHomePalette.card,
    inputFill: AdminHomePalette.card,
    emptyIconBg: AdminHomePalette.card,
    cardBorder: AdminHomePalette.textSecondary.withValues(alpha: 0.12),
    cardShadow: null,
    borderedGroups: true,
  );

  static OpsThemeData get wedding => OpsThemeData(
        bg: AdminHomePalette.background,
        group: AdminHomePalette.elevated,
        divider: AdminHomePalette.divider,
        textPrimary: AdminHomePalette.text,
        textMuted: AdminHomePalette.textMuted,
        segTrack: AdminHomePalette.surface,
        segSelected: AdminHomePalette.card,
        inputFill: AdminHomePalette.surface,
        emptyIconBg: AdminHomePalette.card,
        cardBorder: AdminHomePalette.cardBorder,
        cardShadow: AdminHomePalette.elevationDeep,
        borderedGroups: true,
      );
}

class OpsTheme extends InheritedWidget {
  const OpsTheme({super.key, required this.data, required super.child});

  final OpsThemeData data;

  static OpsThemeData of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<OpsTheme>()?.data ?? OpsThemeData.light;
  }

  @override
  bool updateShouldNotify(OpsTheme oldWidget) => data != oldWidget.data;
}

/// Indicator colours — warm semantic tones.
abstract final class OpsStyle {
  static const blue = PremiumLight.info;
  static const green = PremiumLight.success;

  static BorderRadius get groupRadius => BorderRadius.circular(12);

  static BoxDecoration groupBox(BuildContext context, {Color? accent}) {
    final t = OpsTheme.of(context);
    return BoxDecoration(
      color: t.group,
      borderRadius: groupRadius,
      border: accent != null
          ? Border.all(color: accent.withValues(alpha: 0.15))
          : (t.borderedGroups ? Border.all(color: t.cardBorder) : null),
    );
  }

  // Legacy accessors — prefer OpsTheme.of(context)
  static Color bg(BuildContext context) => OpsTheme.of(context).bg;
  static Color group(BuildContext context) => OpsTheme.of(context).group;
  static Color divider(BuildContext context) => OpsTheme.of(context).divider;
}

String memberInitials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  return name.isNotEmpty ? name[0].toUpperCase() : '?';
}

Color avatarColorForName(String name) {
  const palette = [
    PremiumLight.accent,
    PremiumLight.accentSecondary,
    PremiumLight.info,
    PremiumLight.success,
    PremiumLight.warning,
    PremiumLight.textSecondary,
  ];
  var hash = 0;
  for (final c in name.codeUnits) {
    hash = (hash + c) % palette.length;
  }
  return palette[hash];
}

class OpsAvatar extends StatelessWidget {
  const OpsAvatar({super.key, required this.name, this.size = 40, this.accent});

  final String name;
  final double size;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final color = accent ?? avatarColorForName(name);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withValues(alpha: 0.85), color],
        ),
        borderRadius: BorderRadius.circular(size * 0.32),
      ),
      child: Text(
        memberInitials(name),
        style: TextStyle(fontSize: size * 0.34, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: -0.3),
      ),
    );
  }
}

String formatFeedTime(DateTime at) {
  final now = DateTime.now();
  final diff = now.difference(at);
  if (diff.inMinutes < 1) return 'Now';
  if (diff.inHours < 1) return '${diff.inMinutes}m';
  if (diff.inDays < 1) return DateFormat('h:mm a').format(at);
  if (diff.inDays < 7) return DateFormat('EEE').format(at);
  return DateFormat('MMM d').format(at);
}

String formatLastActivity(DateTime? at) {
  if (at == null) return 'No activity yet';
  final now = DateTime.now();
  final diff = now.difference(at);
  if (diff.inMinutes < 1) return 'Active just now';
  if (diff.inHours < 1) return 'Active ${diff.inMinutes}m ago';
  if (diff.inDays < 1) return 'Active today ${DateFormat('h:mm a').format(at)}';
  if (diff.inDays < 7) return 'Active ${DateFormat('EEE h:mm a').format(at)}';
  return 'Active ${DateFormat('MMM d').format(at)}';
}

// ─── Feed tab widgets ────────────────────────────────────────────────────────

String feedDayHeader(DateTime day) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final d = DateTime(day.year, day.month, day.day);
  final diff = today.difference(d).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  if (diff < 7) return DateFormat('EEEE').format(day);
  return DateFormat('MMM d').format(day);
}

IconData feedKindIcon(OpsActivityKind kind) {
  return switch (kind) {
    OpsActivityKind.assigned => Icons.assignment_ind_outlined,
    OpsActivityKind.started => Icons.play_circle_outline_rounded,
    OpsActivityKind.completed => Icons.check_circle_outline_rounded,
    OpsActivityKind.delayed => Icons.error_outline_rounded,
    OpsActivityKind.attendance => Icons.schedule_rounded,
  };
}

List<({String label, List<OpsActivityEntry> entries})> groupFeedByDay(List<OpsActivityEntry> entries) {
  final map = <String, List<OpsActivityEntry>>{};
  final order = <String>[];
  for (final e in entries) {
    final key = '${e.timestamp.year}-${e.timestamp.month}-${e.timestamp.day}';
    if (!map.containsKey(key)) {
      map[key] = [];
      order.add(key);
    }
    map[key]!.add(e);
  }
  return order.map((key) {
    final list = map[key]!;
    return (label: feedDayHeader(list.first.timestamp), entries: list);
  }).toList();
}

class OpsFeedActivityCard extends StatelessWidget {
  const OpsFeedActivityCard({super.key, required this.entry});

  final OpsActivityEntry entry;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    final color = opsKindColor(entry.kind);
    final icon = feedKindIcon(entry.kind);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: t.group,
        borderRadius: BorderRadius.circular(14),
        border: t.borderedGroups ? Border.all(color: t.cardBorder) : null,
        boxShadow: t.cardShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: color),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: Icon(icon, size: 17, color: color),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(opsKindLabel(entry.kind), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
                                Text(DateFormat('h:mm a').format(entry.timestamp), style: TextStyle(fontSize: 11, color: t.textMuted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(entry.taskName, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -0.3, color: t.textPrimary)),
                      const SizedBox(height: 4),
                      Text(entry.eventName ?? 'Wedding', style: TextStyle(fontSize: 14, color: t.textMuted, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          OpsAvatar(name: entry.memberName, size: 26),
                          const SizedBox(width: 8),
                          Text(entry.memberName, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: t.textPrimary)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class OpsFeedDaySection extends StatelessWidget {
  const OpsFeedDaySection({super.key, required this.label, required this.entries});

  final String label;
  final List<OpsActivityEntry> entries;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 4, 4, 10),
            child: Row(
              children: [
                Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: -0.2, color: t.textPrimary)),
                const SizedBox(width: 8),
                Text('${entries.length}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.textMuted)),
              ],
            ),
          ),
          ...entries.map((e) => OpsFeedActivityCard(entry: e)),
        ],
      ),
    );
  }
}

class OpsFeedTimeline extends StatelessWidget {
  const OpsFeedTimeline({super.key, required this.entries, this.hasMore = false, this.remaining = 0});

  final List<OpsActivityEntry> entries;
  final bool hasMore;
  final int remaining;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    final sections = groupFeedByDay(entries);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...sections.map((s) => OpsFeedDaySection(label: s.label, entries: s.entries)),
        if (hasMore)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Center(
              child: Text('$remaining more · scroll to load', style: TextStyle(fontSize: 12, color: t.textMuted)),
            ),
          ),
      ],
    );
  }
}

// ─── Shared rows ─────────────────────────────────────────────────────────────

class OpsFeedRow extends StatelessWidget {
  const OpsFeedRow({super.key, required this.entry, this.showDivider = true});

  final OpsActivityEntry entry;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    final color = opsKindColor(entry.kind);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              OpsAvatar(name: entry.memberName, size: 38),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: TextStyle(fontSize: 14, height: 1.35, color: t.textPrimary),
                        children: [
                          TextSpan(text: entry.memberName, style: const TextStyle(fontWeight: FontWeight.w600)),
                          TextSpan(text: ' ${opsKindLabel(entry.kind).toLowerCase()} ', style: TextStyle(color: color, fontWeight: FontWeight.w600)),
                          TextSpan(text: entry.taskName, style: const TextStyle(fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(entry.eventName ?? 'Wedding', style: TextStyle(fontSize: 13, color: t.textMuted)),
                  ],
                ),
              ),
              Text(formatFeedTime(entry.timestamp), style: TextStyle(fontSize: 12, color: t.textMuted, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
        if (showDivider) Divider(height: 1, indent: 66, endIndent: 16, color: t.divider),
      ],
    );
  }
}

class OpsPersonRow extends StatelessWidget {
  const OpsPersonRow({
    super.key,
    required this.name,
    required this.role,
    required this.openTasks,
    required this.lastActivity,
    this.showDivider = true,
    this.onTap,
  });

  final String name;
  final String role;
  final int openTasks;
  final DateTime? lastActivity;
  final bool showDivider;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
              child: Row(
                children: [
                  OpsAvatar(name: name, size: 42),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: t.textPrimary)),
                        const SizedBox(height: 2),
                        Text('$role · $openTasks open', style: TextStyle(fontSize: 13, color: t.textMuted)),
                        const SizedBox(height: 2),
                        Text(formatLastActivity(lastActivity), style: TextStyle(fontSize: 12, color: t.textMuted.withValues(alpha: 0.85))),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, size: 20, color: t.textMuted.withValues(alpha: 0.5)),
                ],
              ),
            ),
          ),
        ),
        if (showDivider) Divider(height: 1, indent: 70, endIndent: 16, color: t.divider),
      ],
    );
  }
}

class OpsEventRow extends StatelessWidget {
  const OpsEventRow({
    super.key,
    required this.eventName,
    required this.activityCount,
    required this.memberCount,
    this.showDivider = true,
    this.onTap,
  });

  final String eventName;
  final int activityCount;
  final int memberCount;
  final bool showDivider;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.violet.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.favorite_rounded, size: 18, color: AppColors.violet),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(eventName, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: t.textPrimary)),
                        const SizedBox(height: 2),
                        Text('$activityCount updates · $memberCount people', style: TextStyle(fontSize: 13, color: t.textMuted)),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, size: 20, color: t.textMuted.withValues(alpha: 0.5)),
                ],
              ),
            ),
          ),
        ),
        if (showDivider) Divider(height: 1, indent: 68, endIndent: 16, color: t.divider),
      ],
    );
  }
}

class OpsGroupedSection extends StatelessWidget {
  const OpsGroupedSection({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              title.toUpperCase(),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: t.textMuted, letterSpacing: 0.6),
            ),
          ),
          ClipRRect(
            borderRadius: OpsStyle.groupRadius,
            child: DecoratedBox(
              decoration: OpsStyle.groupBox(context),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

class OpsEmptyState extends StatelessWidget {
  const OpsEmptyState({super.key, required this.title, this.subtitle, this.icon = Icons.history});

  final String title;
  final String? subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: t.emptyIconBg, borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, size: 28, color: t.textMuted.withValues(alpha: 0.4)),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: t.textPrimary)),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: t.textMuted, height: 1.4)),
            ],
          ],
        ),
      ),
    );
  }
}

class OpsPeriodBar extends StatelessWidget {
  const OpsPeriodBar({super.key, required this.period, required this.accent, required this.onChanged});

  final ActivityPeriodFilter period;
  final Color accent;
  final ValueChanged<ActivityPeriodFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(color: t.segTrack, borderRadius: BorderRadius.circular(10)),
        child: Row(
          children: [
            _seg(context, 'Today', ActivityPeriodFilter.today),
            _seg(context, '7 days', ActivityPeriodFilter.week),
            _seg(context, '30 days', ActivityPeriodFilter.month),
          ],
        ),
      ),
    );
  }

  Widget _seg(BuildContext context, String label, ActivityPeriodFilter value) {
    final t = OpsTheme.of(context);
    final selected = period == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => onChanged(value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 7),
          decoration: BoxDecoration(
            color: selected ? t.segSelected : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: selected && !t.borderedGroups
                ? const [BoxShadow(color: Color(0x14000000), blurRadius: 4, offset: Offset(0, 1))]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              color: selected ? t.textPrimary : t.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}

class OpsSearchBar extends StatelessWidget {
  const OpsSearchBar({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.filterActive,
    required this.onFilterTap,
    required this.accent,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final bool filterActive;
  final VoidCallback onFilterTap;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: TextStyle(fontSize: 15, color: t.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search',
                hintStyle: TextStyle(color: t.textMuted.withValues(alpha: 0.65)),
                prefixIcon: Icon(Icons.search, size: 20, color: t.textMuted.withValues(alpha: 0.65)),
                filled: true,
                fillColor: t.inputFill,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: accent.withValues(alpha: 0.4)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: filterActive ? accent.withValues(alpha: 0.12) : t.inputFill,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              onTap: onFilterTap,
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 44,
                height: 44,
                child: Icon(Icons.tune_rounded, size: 20, color: filterActive ? accent : t.textMuted),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OpsPipelineStep extends StatelessWidget {
  const OpsPipelineStep({super.key, required this.entry, required this.isLast});

  final OpsActivityEntry entry;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    final color = opsKindColor(entry.kind);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 20,
            child: Column(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                if (!isLast) Expanded(child: Container(width: 2, color: t.divider)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 4 : 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${opsKindLabel(entry.kind)} · ${DateFormat('h:mm a').format(entry.timestamp)}',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
                  ),
                  Text('${entry.eventName ?? 'Event'} · ${entry.taskName}', style: TextStyle(fontSize: 13, color: t.textMuted)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
