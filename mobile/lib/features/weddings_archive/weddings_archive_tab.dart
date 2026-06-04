import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/calendar_utils.dart';
import 'package:hsdash_mobile/core/weddings_archive_index.dart';
import 'package:hsdash_mobile/features/production_calendar/shoot_event_detail_screen.dart';
import 'package:hsdash_mobile/features/weddings_archive/weddings_archive_providers.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
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
    if (_weddingKey != null && _year != null && _month != null) {
      crumbs.add(index?.weddingGroup(_year!, _month!, _weddingKey!)?.displayName ?? 'Events');
    }
    return crumbs;
  }

  String get _heroTitle {
    if (_weddingKey != null) return 'Events';
    if (_month != null) return monthLabel(_month!);
    if (_year != null) return '$_year';
    return 'Weddings';
  }

  String get _heroSubtitle {
    switch (_depth) {
      case 0:
        return 'Pick a year to explore every wedding and event.';
      case 1:
        return 'Choose a month to see who shot that season.';
      case 2:
        return 'Select a couple or client to view their events.';
      case 3:
        return 'Tap an event for full shoot & pipeline details.';
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
    final entries = ref.watch(weddingsArchiveEntriesProvider);
    final index = ref.watch(weddingsArchiveIndexProvider);

    return ColoredBox(
      color: const Color(0xFFF4F4F8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ArchiveHero(
            accent: widget.accent,
            title: _heroTitle,
            subtitle: _heroSubtitle,
            breadcrumbs: _breadcrumbs(index),
            showBack: _depth > 0,
            onBack: _popLevel,
            totalWeddings: index?.years.isNotEmpty == true
                ? index!.years.map(index.weddingCountForYear).fold<int>(0, (a, b) => a + b)
                : null,
          ),
          Expanded(
            child: entries.when(
              loading: () => Center(child: CircularProgressIndicator(color: widget.accent, strokeWidth: 2.5)),
              error: (e, _) => ListView(
                children: [ErrorPanel(message: '$e', onRetry: _refresh)],
              ),
              data: (_) {
                if (index == null) {
                  return Center(child: CircularProgressIndicator(color: widget.accent));
                }
                if (index.years.isEmpty) {
                  return _EmptyArchive(accent: widget.accent);
                }
                return RefreshIndicator(
                  color: widget.accent,
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
      ),
    );
  }

  Widget _buildBody(WeddingsArchiveIndex index) {
    if (_year == null) {
      return _YearsGrid(index: index, accent: widget.accent, onSelect: (y) => setState(() => _year = y));
    }
    if (_month == null) {
      return _MonthsGrid(
        index: index,
        year: _year!,
        accent: widget.accent,
        onSelect: (m) => setState(() => _month = m),
      );
    }
    if (_weddingKey == null) {
      return _WeddingsList(
        index: index,
        year: _year!,
        month: _month!,
        accent: widget.accent,
        onSelect: (k) => setState(() => _weddingKey = k),
      );
    }
    final group = index.weddingGroup(_year!, _month!, _weddingKey!);
    if (group == null) {
      return const Center(child: Text('Wedding not found'));
    }
    return _EventsTimeline(
      group: group,
      accent: widget.accent,
      onEventTap: _openEventDetail,
    );
  }
}

class _ArchiveHero extends StatelessWidget {
  const _ArchiveHero({
    required this.accent,
    required this.title,
    required this.subtitle,
    required this.breadcrumbs,
    required this.showBack,
    required this.onBack,
    this.totalWeddings,
  });

  final Color accent;
  final String title;
  final String subtitle;
  final List<String> breadcrumbs;
  final bool showBack;
  final VoidCallback onBack;
  final int? totalWeddings;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: WeddingsArchiveStyle.heroDecoration(accent),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (showBack)
                Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 2,
                  shadowColor: accent.withValues(alpha: 0.2),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: onBack,
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Icon(Icons.arrow_back_rounded, color: accent, size: 22),
                    ),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.folder_special_rounded, color: accent, size: 22),
                ),
              const SizedBox(width: 12),
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: breadcrumbs.asMap().entries.map((e) {
                    final isLast = e.key == breadcrumbs.length - 1;
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (e.key > 0)
                          Icon(Icons.chevron_right, size: 14, color: accent.withValues(alpha: 0.5)),
                        Text(
                          e.value,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isLast ? FontWeight.w700 : FontWeight.w500,
                            color: isLast ? accent : AppColors.textMuted,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(title, style: WeddingsArchiveStyle.title(32, color: accent == LaxmanPalette.black ? Colors.black : null)),
          const SizedBox(height: 6),
          Text(subtitle, style: WeddingsArchiveStyle.bodyMuted()),
          if (totalWeddings != null && !showBack) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                _HeroStatChip(icon: Icons.favorite_border, label: '$totalWeddings weddings', accent: accent),
                const SizedBox(width: 8),
                _HeroStatChip(icon: Icons.calendar_month, label: 'By month', accent: accent),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _HeroStatChip extends StatelessWidget {
  const _HeroStatChip({required this.icon, required this.label, required this.accent});

  final IconData icon;
  final String label;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: accent),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: accent)),
        ],
      ),
    );
  }
}

class _EmptyArchive extends StatelessWidget {
  const _EmptyArchive({required this.accent});

  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inbox_outlined, size: 56, color: accent.withValues(alpha: 0.35)),
            const SizedBox(height: 16),
            const Text('No weddings in the archive yet', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'Add shoots from the calendar — they will appear here by year.',
              textAlign: TextAlign.center,
              style: WeddingsArchiveStyle.bodyMuted(),
            ),
          ],
        ),
      ),
    );
  }
}

class _YearsGrid extends StatelessWidget {
  const _YearsGrid({required this.index, required this.accent, required this.onSelect});

  final WeddingsArchiveIndex index;
  final Color accent;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Text('YEARS', style: WeddingsArchiveStyle.label(accent)),
        const SizedBox(height: 12),
        ...index.years.map((y) {
          final weddings = index.weddingCountForYear(y);
          final months = index.monthsForYear(y).length;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _TappableCard(
              accent: accent,
              onTap: () => onSelect(y),
              child: Row(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [accent, accent.withValues(alpha: 0.65)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '$y',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$weddings ${weddings == 1 ? 'Wedding' : 'Weddings'}', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('$months active ${months == 1 ? 'month' : 'months'}', style: WeddingsArchiveStyle.bodyMuted()),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios_rounded, size: 16, color: accent),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _MonthsGrid extends StatelessWidget {
  const _MonthsGrid({
    required this.index,
    required this.year,
    required this.accent,
    required this.onSelect,
  });

  final WeddingsArchiveIndex index;
  final int year;
  final Color accent;
  final ValueChanged<int> onSelect;

  static const _shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context) {
    final months = index.monthsForYear(year);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Text('MONTHS · $year', style: WeddingsArchiveStyle.label(accent)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.35,
          ),
          itemCount: months.length,
          itemBuilder: (context, i) {
            final m = months[i];
            final weddings = index.weddingCountForMonth(year, m);
            final events = index.eventCountForMonth(year, m);
            return _TappableCard(
              accent: accent,
              onTap: () => onSelect(m),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_shortMonth[m - 1], style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: accent, height: 1)),
                  const Spacer(),
                  Text(monthLabel(m), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _MiniPill('$weddings wed.', accent),
                      const SizedBox(width: 6),
                      _MiniPill('$events evt.', accent, muted: true),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _WeddingsList extends StatelessWidget {
  const _WeddingsList({
    required this.index,
    required this.year,
    required this.month,
    required this.accent,
    required this.onSelect,
  });

  final WeddingsArchiveIndex index;
  final int year;
  final int month;
  final Color accent;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final groups = index.weddingsForMonth(year, month);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Text('${groups.length} WEDDINGS', style: WeddingsArchiveStyle.label(accent)),
        const SizedBox(height: 12),
        ...groups.map((g) {
          final done = g.events.where((e) => e.hasPostProduction).length;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _TappableCard(
              accent: accent,
              onTap: () => onSelect(g.key),
              child: Row(
                children: [
                  _AvatarInitials(name: g.displayName, accent: accent),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(g.displayName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            _MiniPill('${g.events.length} events', accent),
                            if (done > 0) ...[
                              const SizedBox(width: 6),
                              _MiniPill('$done live', AppColors.emerald, muted: true),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: accent),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _EventsTimeline extends StatelessWidget {
  const _EventsTimeline({
    required this.group,
    required this.accent,
    required this.onEventTap,
  });

  final WeddingArchiveGroup group;
  final Color accent;
  final ValueChanged<ShootCalendarEntry> onEventTap;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Text('EVENT TIMELINE', style: WeddingsArchiveStyle.label(accent)),
        const SizedBox(height: 16),
        ...group.events.asMap().entries.map((e) {
          final entry = e.value;
          final isLast = e.key == group.events.length - 1;
          final day = formatFriendlyDay(shootDayKey(entry.day), includeYear: true);
          final eventLabel = (entry.eventName?.trim().isNotEmpty ?? false) ? entry.eventName!.trim() : 'Shoot';
          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: 28,
                  child: Column(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: entry.hasPostProduction ? AppColors.emerald : accent,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: [
                            BoxShadow(color: accent.withValues(alpha: 0.35), blurRadius: 6),
                          ],
                        ),
                      ),
                      if (!isLast)
                        Expanded(
                          child: Container(
                            width: 2,
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            color: accent.withValues(alpha: 0.2),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
                    child: _TappableCard(
                      accent: accent,
                      onTap: () => onEventTap(entry),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(eventLabel, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                              ),
                              if (entry.hasPostProduction)
                                const Icon(Icons.bolt, size: 18, color: AppColors.emerald)
                              else
                                Icon(Icons.schedule, size: 18, color: accent.withValues(alpha: 0.6)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(day, style: WeddingsArchiveStyle.bodyMuted()),
                          if (entry.venue?.trim().isNotEmpty == true) ...[
                            const SizedBox(height: 4),
                            Text(entry.venue!, maxLines: 1, overflow: TextOverflow.ellipsis, style: WeddingsArchiveStyle.bodyMuted()),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _MiniPill(
                                entry.hasPostProduction ? 'Pipeline active' : 'Scheduled',
                                entry.hasPostProduction ? AppColors.emerald : accent,
                              ),
                              const Spacer(),
                              Text('View details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: accent)),
                              const SizedBox(width: 4),
                              Icon(Icons.arrow_forward, size: 14, color: accent),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class _TappableCard extends StatelessWidget {
  const _TappableCard({required this.accent, required this.onTap, required this.child});

  final Color accent;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: accent.withValues(alpha: 0.12),
        highlightColor: accent.withValues(alpha: 0.06),
        child: Ink(
          decoration: WeddingsArchiveStyle.cardDecoration(accent),
          child: Padding(padding: const EdgeInsets.all(16), child: child),
        ),
      ),
    );
  }
}

class _AvatarInitials extends StatelessWidget {
  const _AvatarInitials({required this.name, required this.accent});

  final String name;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final parts = name.trim().split(RegExp(r'\s+'));
    String initials = '?';
    if (parts.isNotEmpty) {
      initials = parts.length == 1
          ? parts.first.substring(0, 1).toUpperCase()
          : '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return CircleAvatar(
      radius: 26,
      backgroundColor: accent.withValues(alpha: 0.12),
      child: Text(initials, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: accent)),
    );
  }
}

class _MiniPill extends StatelessWidget {
  const _MiniPill(this.text, this.color, {this.muted = false});

  final String text;
  final Color color;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (muted ? AppColors.textMuted : color).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: muted ? AppColors.textMuted : color),
      ),
    );
  }
}
