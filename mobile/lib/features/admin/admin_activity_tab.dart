import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/core/activity_feed_utils.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';
import 'package:hsdash_mobile/features/admin/admin_theme_mode.dart';
import 'package:hsdash_mobile/features/admin/admin_activity_providers.dart';
import 'package:hsdash_mobile/features/attendance/attendance_providers.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/models/team_member.dart';
import 'package:hsdash_mobile/widgets/dashboard_widgets.dart';
import 'package:hsdash_mobile/widgets/ops_dashboard_widgets.dart';

/// Activity feed — shared by admin and coordinator.
class AdminActivityTab extends ConsumerStatefulWidget {
  const AdminActivityTab({
    super.key,
    this.accent = AppColors.violet,
    this.excludeMemberId,
    this.monochrome = false,
    this.premiumDark = false,
  });

  final Color accent;
  /// When set, this member's actions are hidden (coordinator team feed).
  final String? excludeMemberId;
  final bool monochrome;
  final bool premiumDark;

  @override
  ConsumerState<AdminActivityTab> createState() => _AdminActivityTabState();
}

class _AdminActivityTabState extends ConsumerState<AdminActivityTab> with SingleTickerProviderStateMixin {
  static const _pageSize = 50;

  late final TabController _tabs;
  final _searchController = TextEditingController();
  final _feedScroll = ScrollController();

  ActivityPeriodFilter _period = ActivityPeriodFilter.today;
  ActivityTypeFilter _type = ActivityTypeFilter.all;
  String? _eventId;
  String? _memberId;
  String _search = '';
  int _feedVisible = _pageSize;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _feedScroll.addListener(_onFeedScroll);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _feedScroll.removeListener(_onFeedScroll);
    _feedScroll.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onFeedScroll() {
    if (_tabs.index != 0) return;
    if (!_feedScroll.hasClients) return;
    final pos = _feedScroll.position;
    if (pos.pixels >= pos.maxScrollExtent - 240) {
      setState(() => _feedVisible += _pageSize);
    }
  }

  bool get _filtersActive => _eventId != null || _memberId != null || _type != ActivityTypeFilter.all;

  OpsThemeData get _theme {
    if (widget.premiumDark) {
      return AdminHomePalette.isStudio ? OpsThemeData.dark : OpsThemeData.wedding;
    }
    return OpsThemeData.wedding;
  }

  OpsDashboardFilters get _filters => OpsDashboardFilters(
        period: _period,
        eventId: _eventId,
        memberId: _memberId,
        type: _type,
        search: _search,
        excludeMemberId: widget.excludeMemberId,
      );

  Future<void> _refresh() async {
    ref.invalidate(adminActivityFeedProvider);
    ref.invalidate(adminTaskActivityProvider);
    ref.invalidate(attendanceAlertsProvider);
    ref.invalidate(tasksProvider);
    ref.invalidate(teamMembersProvider);
  }

  void _resetPaging() => setState(() => _feedVisible = _pageSize);

  Future<void> _openFilters(OpsDashboardData dashboard) async {
    var eventId = _eventId;
    var memberId = _memberId;
    var type = _type;

    await showAppBottomSheet<void>(
      context,
      builder: (ctx) {
        return OpsTheme(
          data: _theme,
          child: StatefulBuilder(
          builder: (ctx, setSheet) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.paddingOf(ctx).bottom + 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(width: 36, height: 4, decoration: BoxDecoration(color: OpsStyle.divider(ctx), borderRadius: BorderRadius.circular(2))),
                  ),
                  const SizedBox(height: 16),
                  Text('Filters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _theme.textPrimary)),
                  const SizedBox(height: 16),
                  _SheetDropdown<String?>(
                    label: 'Event',
                    value: eventId,
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All events')),
                      ...dashboard.eventOptions.map((e) => DropdownMenuItem(value: e.id, child: Text(e.label))),
                    ],
                    onChanged: (v) => setSheet(() => eventId = v),
                  ),
                  const SizedBox(height: 12),
                  _SheetDropdown<String?>(
                    label: 'Team member',
                    value: memberId,
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All members')),
                      ...dashboard.memberOptions
                          .where((m) => m.id != widget.excludeMemberId)
                          .map((m) => DropdownMenuItem(value: m.id, child: Text(m.label))),
                    ],
                    onChanged: (v) => setSheet(() => memberId = v),
                  ),
                  const SizedBox(height: 12),
                  _SheetDropdown<ActivityTypeFilter>(
                    label: 'Activity type',
                    value: type,
                    items: const [
                      DropdownMenuItem(value: ActivityTypeFilter.all, child: Text('All types')),
                      DropdownMenuItem(value: ActivityTypeFilter.assigned, child: Text('Assigned')),
                      DropdownMenuItem(value: ActivityTypeFilter.started, child: Text('Started')),
                      DropdownMenuItem(value: ActivityTypeFilter.completed, child: Text('Completed')),
                      DropdownMenuItem(value: ActivityTypeFilter.delayed, child: Text('Delayed')),
                      DropdownMenuItem(value: ActivityTypeFilter.attendance, child: Text('Attendance')),
                    ],
                    onChanged: (v) => setSheet(() => type = v ?? ActivityTypeFilter.all),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _eventId = null;
                              _memberId = null;
                              _type = ActivityTypeFilter.all;
                            });
                            _resetPaging();
                            Navigator.pop(ctx);
                          },
                          child: const Text('Clear'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: FilledButton(
                          style: FilledButton.styleFrom(backgroundColor: widget.accent),
                          onPressed: () {
                            setState(() {
                              _eventId = eventId;
                              _memberId = memberId;
                              _type = type;
                            });
                            _resetPaging();
                            Navigator.pop(ctx);
                          },
                          child: const Text('Apply'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
        );
      },
    );
  }

  void _openMemberDetail(MemberOpsGroup member) {
    final sheetTheme = OpsThemeData.light;
    showAppBottomSheet<void>(
      context,
      backgroundColor: sheetTheme.bg,
      builder: (ctx) {
        return OpsTheme(
          data: sheetTheme,
          child: DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.55,
          minChildSize: 0.35,
          maxChildSize: 0.9,
          builder: (_, scroll) {
            return ColoredBox(
              color: sheetTheme.bg,
              child: ListView(
              controller: scroll,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              children: [
                Center(
                  child: Container(width: 36, height: 4, decoration: BoxDecoration(color: sheetTheme.divider, borderRadius: BorderRadius.circular(2))),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    OpsAvatar(name: member.memberName, size: 48, accent: widget.accent),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(member.memberName, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.3, color: sheetTheme.textPrimary)),
                          Text(member.roleLabel, style: TextStyle(fontSize: 14, color: sheetTheme.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _DetailStat(value: '${member.openTasks}', label: 'Open'),
                    _DetailStat(value: '${member.startedInPeriod}', label: 'Started', color: OpsStyle.blue),
                    _DetailStat(value: '${member.completedInPeriod}', label: 'Done', color: OpsStyle.green),
                  ],
                ),
                const SizedBox(height: 20),
                if (member.taskTimelines.isEmpty)
                  const OpsEmptyState(title: 'No activity', subtitle: 'Nothing recorded in this period.', icon: Icons.history)
                else
                  ...member.taskTimelines.map(
                    (t) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: OpsStyle.groupBox(ctx),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t.eventName, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: sheetTheme.textPrimary)),
                            Text(t.taskName, style: TextStyle(fontSize: 13, color: sheetTheme.textMuted)),
                            const SizedBox(height: 10),
                            ...t.steps.asMap().entries.map(
                                  (e) => OpsPipelineStep(entry: e.value, isLast: e.key == t.steps.length - 1),
                                ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            );
          },
        ),
        );
      },
    );
  }

  void _openEventDetail(EventOpsGroup event) {
    showAppBottomSheet<void>(
      context,
      backgroundColor: _theme.bg,
      builder: (ctx) {
        return OpsTheme(
          data: _theme,
          child: DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          minChildSize: 0.35,
          maxChildSize: 0.92,
          builder: (_, scroll) {
            return ListView(
              controller: scroll,
              padding: const EdgeInsets.fromLTRB(0, 12, 0, 32),
              children: [
                Center(
                  child: Container(width: 36, height: 4, decoration: BoxDecoration(color: OpsStyle.divider(ctx), borderRadius: BorderRadius.circular(2))),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                  child: Text(event.eventName, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.3, color: _theme.textPrimary)),
                ),
                OpsGroupedSection(
                  title: 'Activity',
                  child: Column(
                    children: event.entries.asMap().entries.map((e) {
                      return OpsFeedRow(entry: e.value, showDivider: e.key < event.entries.length - 1);
                    }).toList(),
                  ),
                ),
              ],
            );
          },
        ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.premiumDark) watchAdminPalette(ref);
    final feed = ref.watch(adminActivityFeedProvider);
    final roster = ref.watch(teamMembersProvider);
    final theme = _theme;
    final accent = widget.premiumDark ? AdminHomePalette.accent : widget.accent;

    return OpsTheme(
      data: theme,
      child: ColoredBox(
      color: theme.bg,
      child: feed.when(
        loading: () => Center(child: CircularProgressIndicator(color: accent, strokeWidth: 2.5)),
        error: (e, _) => Padding(padding: const EdgeInsets.all(20), child: ErrorPanel(message: '$e', onRetry: _refresh)),
        data: (data) {
          final rosterList = roster.maybeWhen(data: (m) => m, orElse: () => <TeamMember>[]);
          final dashboard = buildOpsDashboard(
            activities: data.activities,
            tasks: data.tasks,
            filters: _filters,
            roster: rosterList,
            attendanceAlerts: data.attendanceAlerts,
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              OpsPeriodBar(
                period: _period,
                accent: widget.accent,
                onChanged: (p) {
                  setState(() => _period = p);
                  _resetPaging();
                },
              ),
              OpsSearchBar(
                controller: _searchController,
                onChanged: (s) {
                  setState(() => _search = s);
                  _resetPaging();
                },
                filterActive: _filtersActive,
                onFilterTap: () => _openFilters(dashboard),
                accent: widget.accent,
              ),
              const SizedBox(height: 8),
              TabBar(
                controller: _tabs,
                labelColor: widget.accent,
                unselectedLabelColor: theme.textMuted,
                indicatorColor: widget.accent,
                dividerColor: theme.divider,
                indicatorWeight: 2.5,
                labelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                unselectedLabelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                tabs: const [
                  Tab(text: 'Feed'),
                  Tab(text: 'People'),
                  Tab(text: 'Weddings'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabs,
                  children: [
                    _FeedTab(
                      entries: dashboard.timeline,
                      visible: _feedVisible,
                      scrollController: _feedScroll,
                      onRefresh: _refresh,
                      accent: widget.accent,
                    ),
                    _PeopleTab(members: dashboard.members, onRefresh: _refresh, onMemberTap: _openMemberDetail),
                    _WeddingsTab(events: dashboard.events, onRefresh: _refresh, onEventTap: _openEventDetail),
                  ],
                ),
              ),
            ],
          );
        },
      ),
      ),
    );
  }
}

class _FeedTab extends StatelessWidget {
  const _FeedTab({
    required this.entries,
    required this.visible,
    required this.scrollController,
    required this.onRefresh,
    required this.accent,
  });

  final List<OpsActivityEntry> entries;
  final int visible;
  final ScrollController scrollController;
  final Future<void> Function() onRefresh;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return RefreshIndicator(
        color: accent,
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            OpsEmptyState(
              title: 'No activity yet',
              subtitle: 'Task updates will appear here as your team works.',
              icon: Icons.history,
            ),
          ],
        ),
      );
    }

    final shown = entries.take(visible).toList();
    final hasMore = entries.length > visible;

    return RefreshIndicator(
      color: accent,
      onRefresh: onRefresh,
      child: ListView(
        controller: scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          OpsFeedTimeline(
            entries: shown,
            hasMore: hasMore,
            remaining: entries.length - visible,
          ),
        ],
      ),
    );
  }
}

class _PeopleTab extends StatelessWidget {
  const _PeopleTab({required this.members, required this.onRefresh, required this.onMemberTap});

  final List<MemberOpsGroup> members;
  final Future<void> Function() onRefresh;
  final ValueChanged<MemberOpsGroup> onMemberTap;

  @override
  Widget build(BuildContext context) {
    if (members.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            OpsEmptyState(title: 'No people match', subtitle: 'Try adjusting your filters.', icon: Icons.people_outline),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 12, bottom: 24),
        children: [
          OpsGroupedSection(
            title: 'Team',
            child: Column(
              children: members.asMap().entries.map((e) {
                final m = e.value;
                return OpsPersonRow(
                  name: m.memberName,
                  role: m.roleLabel,
                  openTasks: m.openTasks,
                  lastActivity: m.lastActivity,
                  showDivider: e.key < members.length - 1,
                  onTap: () => onMemberTap(m),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _WeddingsTab extends StatelessWidget {
  const _WeddingsTab({required this.events, required this.onRefresh, required this.onEventTap});

  final List<EventOpsGroup> events;
  final Future<void> Function() onRefresh;
  final ValueChanged<EventOpsGroup> onEventTap;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            OpsEmptyState(title: 'No wedding activity', subtitle: 'Events with updates will show here.', icon: Icons.event_outlined),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 12, bottom: 24),
        children: [
          OpsGroupedSection(
            title: 'Weddings',
            child: Column(
              children: events.asMap().entries.map((e) {
                final ev = e.value;
                final people = {...ev.assignedMembers, ...ev.startedMembers, ...ev.completedMembers}.length;
                return OpsEventRow(
                  eventName: ev.eventName,
                  activityCount: ev.entries.length,
                  memberCount: people,
                  showDivider: e.key < events.length - 1,
                  onTap: () => onEventTap(ev),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailStat extends StatelessWidget {
  const _DetailStat({required this.value, required this.label, this.color});

  final String value;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: OpsStyle.groupBox(context),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: color ?? t.textPrimary)),
            Text(label, style: TextStyle(fontSize: 12, color: t.textMuted)),
          ],
        ),
      ),
    );
  }
}

class _SheetDropdown<T> extends StatelessWidget {
  const _SheetDropdown({required this.label, required this.value, required this.items, required this.onChanged});

  final String label;
  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = OpsTheme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.textMuted)),
        const SizedBox(height: 6),
        DropdownButtonFormField<T>(
          value: value,
          isExpanded: true,
          dropdownColor: t.group,
          style: TextStyle(fontSize: 15, color: t.textPrimary),
          decoration: InputDecoration(
            filled: true,
            fillColor: t.inputFill,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
          items: items,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
