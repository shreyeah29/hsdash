import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/weddings_archive_index.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_event_detail_screen.dart';
import 'package:hsdash_mobile/features/weddings_archive/weddings_archive_providers.dart';
import 'package:hsdash_mobile/features/weddings_archive/weddings_archive_theme.dart';
import 'package:hsdash_mobile/models/shoot_calendar_entry.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';

/// Standalone weddings browser: Year → Month → Wedding → Events → shoot details.
class WeddingsArchiveTab extends ConsumerStatefulWidget {
  const WeddingsArchiveTab({
    super.key,
    required this.accent,
    required this.canEdit,
    required this.canActivate,
  });

  final Color accent;
  final bool canEdit;
  final bool canActivate;

  @override
  ConsumerState<WeddingsArchiveTab> createState() => _WeddingsArchiveTabState();
}

class _WeddingsArchiveTabState extends ConsumerState<WeddingsArchiveTab> {
  int? _year;
  int? _month;
  String? _weddingKey;

  bool get _premium => WeddingsArchiveStyle.isPremiumDark(widget.accent);

  Color get _accent {
    if (widget.accent == LaxmanPalette.black) return LaxmanPalette.black;
    if (widget.accent == AppColors.amber) return AppColors.amber;
    return AdminHomePalette.accent;
  }

  int get _depth {
    if (_weddingKey != null) return 3;
    if (_month != null) return 2;
    if (_year != null) return 1;
    return 0;
  }

  void _popLevel() {
    setState(() {
      if (_weddingKey != null) {
        _weddingKey = null;
      } else if (_month != null) {
        _month = null;
      } else if (_year != null) {
        _year = null;
      }
    });
  }

  List<String> _breadcrumbs(WeddingsArchiveIndex? index) {
    final crumbs = <String>['Archive'];
    if (_year != null) crumbs.add('$_year');
    if (_month != null) crumbs.add(monthLabel(_month!));
    return crumbs;
  }

  String _pageTitle(WeddingsArchiveIndex? index) {
    if (_weddingKey != null && index != null && _year != null && _month != null) {
      final name = index.weddingGroup(_year!, _month!, _weddingKey!)?.displayName;
      return name != null ? _formatDisplayName(name) : 'Events';
    }
    if (_month != null) return monthLabel(_month!);
    if (_year != null) return '$_year';
    return 'Wedding archive';
  }

  String get _pageSubtitle {
    switch (_depth) {
      case 0:
        return 'Browse by year, then month and client.';
      case 1:
        return 'Pick a month for $_year.';
      case 2:
        return 'Select a client or couple.';
      case 3:
        return 'Tap an event for details.';
      default:
        return '';
    }
  }

  Future<void> _refresh() async => invalidateWeddingsArchive(ref);

  void _openEventDetail(ShootCalendarEntry entry) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => ShootEventDetailScreen(
          entryId: entry.id,
          initialEntry: entry,
          canEdit: widget.canEdit,
          canActivate: widget.canActivate,
          canManageAssignments: entry.hasPostProduction && (widget.canEdit || widget.canActivate),
          onMutated: _refresh,
        ),
        transitionsBuilder: (_, anim, __, child) {
          return FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween<Offset>(begin: const Offset(0.04, 0), end: Offset.zero).animate(
                CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
              ),
              child: child,
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_premium) watchAdminPalette(ref);
    final entries = ref.watch(weddingsArchiveEntriesProvider);
    final index = ref.watch(weddingsArchiveIndexProvider);
    final bg = WeddingsArchiveStyle.background(widget.accent);

    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _ArchiveHeader(
          premium: _premium,
          shellAccent: widget.accent,
          accent: _accent,
          title: _pageTitle(index),
          subtitle: _pageSubtitle,
          breadcrumbs: _breadcrumbs(index),
          showBack: _depth > 0,
          onBack: _popLevel,
          totalWeddings: index?.years.isNotEmpty == true
              ? index!.years.map(index.weddingCountForYear).fold<int>(0, (a, b) => a + b)
              : null,
          showStats: _depth == 0,
        ),
        Expanded(
          child: entries.when(
            loading: () => Center(child: CircularProgressIndicator(color: _accent, strokeWidth: 2)),
            error: (e, _) => ListView(
              children: [ErrorPanel(message: '$e', onRetry: _refresh)],
            ),
            data: (_) {
              if (index == null) {
                return Center(child: CircularProgressIndicator(color: _accent));
              }
              if (index.years.isEmpty) {
                return _EmptyArchive(shellAccent: widget.accent, accent: _accent);
              }
              return RefreshIndicator(
                color: _accent,
                backgroundColor: _premium ? AdminHomePalette.card : Colors.white,
                onRefresh: _refresh,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 280),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, anim) {
                    final slide = Tween<Offset>(begin: const Offset(0.06, 0), end: Offset.zero).animate(anim);
                    return FadeTransition(
                      opacity: anim,
                      child: SlideTransition(position: slide, child: child),
                    );
                  },
                  child: KeyedSubtree(
                    key: ValueKey('$_depth-$_year-$_month-$_weddingKey'),
                    child: _buildBody(index),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );

    if (_premium) {
      return AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: ColoredBox(color: bg, child: body),
      );
    }
    return ColoredBox(color: bg, child: body);
  }

  Widget _buildBody(WeddingsArchiveIndex index) {
    if (_year == null) {
      return _YearsList(
        premium: _premium,
        shellAccent: widget.accent,
        index: index,
        accent: _accent,
        onSelect: (y) => setState(() => _year = y),
      );
    }
    if (_month == null) {
      return _MonthsGrid(
        premium: _premium,
        shellAccent: widget.accent,
        index: index,
        year: _year!,
        accent: _accent,
        onSelect: (m) => setState(() => _month = m),
      );
    }
    if (_weddingKey == null) {
      return _WeddingsList(
        premium: _premium,
        shellAccent: widget.accent,
        index: index,
        year: _year!,
        month: _month!,
        accent: _accent,
        onSelect: (k) => setState(() => _weddingKey = k),
      );
    }
    final group = index.weddingGroup(_year!, _month!, _weddingKey!);
    if (group == null) {
      return Center(
        child: Text('Wedding not found', style: WeddingsArchiveStyle.rowMeta(widget.accent)),
      );
    }
    return _EventsTimeline(
      premium: _premium,
      shellAccent: widget.accent,
      group: group,
      accent: _accent,
      onEventTap: _openEventDetail,
    );
  }
}

class _ArchiveHeader extends StatelessWidget {
  const _ArchiveHeader({
    required this.premium,
    required this.shellAccent,
    required this.accent,
    required this.title,
    required this.subtitle,
    required this.breadcrumbs,
    required this.showBack,
    required this.onBack,
    this.totalWeddings,
    this.showStats = false,
  });

  final bool premium;
  final Color shellAccent;
  final Color accent;
  final String title;
  final String subtitle;
  final List<String> breadcrumbs;
  final bool showBack;
  final VoidCallback onBack;
  final int? totalWeddings;
  final bool showStats;

  @override
  Widget build(BuildContext context) {
    final accentColor = premium ? accent : accent;
    final muted = premium ? AdminHomePalette.textSecondary : AppColors.textMuted;

    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (showBack)
                _HeaderIconButton(
                  premium: premium,
                  accent: accentColor,
                  icon: Icons.arrow_back_rounded,
                  onTap: onBack,
                )
              else
                _HeaderIconButton(
                  premium: premium,
                  accent: accentColor,
                  icon: Icons.folder_special_outlined,
                  onTap: null,
                ),
              const SizedBox(width: 10),
              Expanded(
                child: _BreadcrumbTrail(crumbs: breadcrumbs, muted: muted),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text('WEDDINGS', style: WeddingsArchiveStyle.sectionLabel(shellAccent)),
          const SizedBox(height: 6),
          Text(
            title,
            style: WeddingsArchiveStyle.title(shellAccent),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: WeddingsArchiveStyle.subtitle(shellAccent),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (showStats && totalWeddings != null) ...[
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _StatChip(
                  premium: premium,
                  accent: accentColor,
                  icon: Icons.favorite_border,
                  label: '$totalWeddings weddings',
                ),
                _StatChip(
                  premium: premium,
                  accent: accentColor,
                  icon: Icons.calendar_month_outlined,
                  label: 'By month',
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.premium,
    required this.accent,
    required this.icon,
    required this.onTap,
  });

  final bool premium;
  final Color accent;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final fill = premium ? AdminHomePalette.card : Colors.white;
    final iconColor = premium ? AdminHomePalette.text : accent;

    return Material(
      color: fill,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 20, color: iconColor),
        ),
      ),
    );
  }
}

class _BreadcrumbTrail extends StatelessWidget {
  const _BreadcrumbTrail({required this.crumbs, required this.muted});

  final List<String> crumbs;
  final Color muted;

  @override
  Widget build(BuildContext context) {
    return Text(
      crumbs.join('  ›  '),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: AdminHomeTypography.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: muted,
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.premium,
    required this.accent,
    required this.icon,
    required this.label,
  });

  final bool premium;
  final Color accent;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final bg = premium ? accent.withValues(alpha: 0.14) : accent.withValues(alpha: 0.08);
    final fg = premium ? AdminHomePalette.text : accent;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent.withValues(alpha: premium ? 0.22 : 0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: accent),
          const SizedBox(width: 6),
          Text(
            label,
            style: AdminHomeTypography.inter(fontSize: 12, fontWeight: FontWeight.w600, color: fg),
          ),
        ],
      ),
    );
  }
}

class _EmptyArchive extends StatelessWidget {
  const _EmptyArchive({required this.shellAccent, required this.accent});

  final Color shellAccent;
  final Color accent;

  bool get premium => WeddingsArchiveStyle.isPremiumDark(shellAccent);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inbox_outlined, size: 48, color: accent.withValues(alpha: 0.35)),
            const SizedBox(height: 16),
            Text(
              'No weddings in the archive yet',
              style: WeddingsArchiveStyle.rowTitle(shellAccent),
            ),
            const SizedBox(height: 8),
            Text(
              'Add shoots from the calendar — they will appear here by year.',
              textAlign: TextAlign.center,
              style: WeddingsArchiveStyle.subtitle(shellAccent),
            ),
          ],
        ),
      ),
    );
  }
}

class _YearsList extends StatelessWidget {
  const _YearsList({
    required this.premium,
    required this.shellAccent,
    required this.index,
    required this.accent,
    required this.onSelect,
  });

  final bool premium;
  final Color shellAccent;
  final WeddingsArchiveIndex index;
  final Color accent;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        Text('YEARS', style: WeddingsArchiveStyle.sectionLabel(shellAccent)),
        const SizedBox(height: 10),
        _ArchiveGroupedList(
          premium: premium,
          accent: accent,
          children: index.years.map((y) {
            final weddings = index.weddingCountForYear(y);
            final months = index.monthsForYear(y).length;
            return _ArchiveListRow(
              premium: premium,
              shellAccent: shellAccent,
              accent: accent,
              onTap: () => onSelect(y),
              leading: premium
                  ? Container(
                      width: 44,
                      height: 44,
                      alignment: Alignment.center,
                      decoration: WeddingsArchiveStyle.yearBadgeDecoration(accent),
                      child: Text(
                        '$y',
                        style: AdminHomeTypography.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : Text(
                      '$y',
                      style: AdminHomeTypography.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: accent,
                      ),
                    ),
              title: '$weddings ${weddings == 1 ? 'wedding' : 'weddings'}',
              subtitle: '$months active ${months == 1 ? 'month' : 'months'}',
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _MonthsGrid extends StatelessWidget {
  const _MonthsGrid({
    required this.premium,
    required this.shellAccent,
    required this.index,
    required this.year,
    required this.accent,
    required this.onSelect,
  });

  final bool premium;
  final Color shellAccent;
  final WeddingsArchiveIndex index;
  final int year;
  final Color accent;
  final ValueChanged<int> onSelect;

  static const _shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context) {
    final months = index.monthsForYear(year);
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        Text('MONTHS · $year', style: WeddingsArchiveStyle.sectionLabel(shellAccent)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.05,
          ),
          itemCount: months.length,
          itemBuilder: (context, i) {
            final m = months[i];
            final weddings = index.weddingCountForMonth(year, m);
            final events = index.eventCountForMonth(year, m);
            return _MonthCell(
              premium: premium,
              accent: accent,
              shortLabel: _shortMonth[m - 1],
              weddings: weddings,
              events: events,
              onTap: () => onSelect(m),
            );
          },
        ),
      ],
    );
  }
}

class _MonthCell extends StatelessWidget {
  const _MonthCell({
    required this.premium,
    required this.accent,
    required this.shortLabel,
    required this.weddings,
    required this.events,
    required this.onTap,
  });

  final bool premium;
  final Color accent;
  final String shortLabel;
  final int weddings;
  final int events;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        splashColor: accent.withValues(alpha: 0.16),
        highlightColor: accent.withValues(alpha: 0.08),
        child: Ink(
          decoration: WeddingsArchiveStyle.monthTileDecoration(accent),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(shortLabel, style: WeddingsArchiveStyle.monthTileLabel(accent)),
                const Spacer(),
                Text('$weddings wed.', style: WeddingsArchiveStyle.monthMeta(accent)),
                Text(
                  '$events evt.',
                  style: WeddingsArchiveStyle.monthMeta(accent).copyWith(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WeddingsList extends StatelessWidget {
  const _WeddingsList({
    required this.premium,
    required this.shellAccent,
    required this.index,
    required this.year,
    required this.month,
    required this.accent,
    required this.onSelect,
  });

  final bool premium;
  final Color shellAccent;
  final WeddingsArchiveIndex index;
  final int year;
  final int month;
  final Color accent;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final groups = index.weddingsForMonth(year, month);
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        _ArchiveGroupedList(
          premium: premium,
          accent: accent,
          children: groups.map((g) {
            return _ArchiveListRow(
              premium: premium,
              shellAccent: shellAccent,
              accent: accent,
              onTap: () => onSelect(g.key),
              title: _formatDisplayName(g.displayName),
              subtitle: '${g.events.length} ${g.events.length == 1 ? 'event' : 'events'}',
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _EventsTimeline extends StatelessWidget {
  const _EventsTimeline({
    required this.premium,
    required this.shellAccent,
    required this.group,
    required this.accent,
    required this.onEventTap,
  });

  final bool premium;
  final Color shellAccent;
  final WeddingArchiveGroup group;
  final Color accent;
  final ValueChanged<ShootCalendarEntry> onEventTap;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        _ArchiveGroupedList(
          premium: premium,
          accent: accent,
          children: group.events.map((entry) {
            final day = formatFriendlyDay(shootDayKey(entry.day), includeYear: true);
            final eventLabel =
                (entry.eventName?.trim().isNotEmpty ?? false) ? entry.eventName!.trim() : 'Shoot';
            return _ArchiveListRow(
              premium: premium,
              shellAccent: shellAccent,
              accent: accent,
              onTap: () => onEventTap(entry),
              title: eventLabel,
              subtitle: day,
              trailing: Icon(
                entry.hasPostProduction ? Icons.bolt : Icons.chevron_right_rounded,
                size: 18,
                color: entry.hasPostProduction ? AppColors.emerald : accent.withValues(alpha: 0.6),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

/// Grouped panel with dividers between rows.
class _ArchiveGroupedList extends StatelessWidget {
  const _ArchiveGroupedList({
    required this.premium,
    required this.accent,
    required this.children,
  });

  final bool premium;
  final Color accent;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();

    final dividerColor = WeddingsArchiveStyle.divider(accent);

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: DecoratedBox(
        decoration: WeddingsArchiveStyle.panelDecoration(accent),
        child: Column(
          children: [
            for (var i = 0; i < children.length; i++) ...[
              children[i],
              if (i < children.length - 1) Divider(height: 1, thickness: 1, color: dividerColor),
            ],
          ],
        ),
      ),
    );
  }
}

class _ArchiveListRow extends StatelessWidget {
  const _ArchiveListRow({
    required this.premium,
    required this.shellAccent,
    required this.accent,
    required this.onTap,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
  });

  final bool premium;
  final Color shellAccent;
  final Color accent;
  final VoidCallback onTap;
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final titleStyle = WeddingsArchiveStyle.rowTitle(shellAccent);
    final metaStyle = WeddingsArchiveStyle.rowMeta(shellAccent);
    final chevron = trailing ??
        Icon(Icons.chevron_right_rounded, size: 20, color: accent.withValues(alpha: 0.65));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: titleStyle, maxLines: 2, overflow: TextOverflow.ellipsis),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(subtitle!, style: metaStyle),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              chevron,
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDisplayName(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return trimmed;
  if (trimmed == trimmed.toUpperCase()) {
    return trimmed
        .split(RegExp(r'\s+'))
        .map((w) => w.isEmpty ? w : '${w[0]}${w.substring(1).toLowerCase()}')
        .join(' ');
  }
  return trimmed;
}
