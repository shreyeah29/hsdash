import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_alerts_tab.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_tasks_tab.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_today_tab.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_widgets.dart';
import 'package:hsdash_mobile/features/realtime/realtime_sync.dart';
import 'package:hsdash_mobile/models/user.dart';

/// Monochrome editorial shell — shared by all team editors.
class LaxmanEditorShell extends ConsumerStatefulWidget {
  const LaxmanEditorShell({super.key, required this.user});

  final User user;

  @override
  ConsumerState<LaxmanEditorShell> createState() => _LaxmanEditorShellState();
}

class _LaxmanEditorShellState extends ConsumerState<LaxmanEditorShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(unreadCountProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: RealtimeListener(
        child: Scaffold(
          backgroundColor: LaxmanPalette.white,
          body: SafeArea(
            bottom: false,
            child: Stack(
              children: [
                IndexedStack(
                  index: _tab,
                  children: [
                    LaxmanTodayTab(user: widget.user),
                    const LaxmanTasksTab(),
                    LaxmanAlertsTab(onOpenWork: () => setState(() => _tab = 1)),
                  ],
                ),
                Positioned(
                  top: 8,
                  right: 16,
                  child: TextButton(
                    onPressed: () => ref.read(authControllerProvider.notifier).logout(),
                    style: TextButton.styleFrom(
                      foregroundColor: LaxmanPalette.black,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    child: Text('EXIT', style: LaxmanType.label('').copyWith(fontSize: 11)),
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: LaxmanBottomNav(
            index: _tab,
            onChanged: (i) => setState(() => _tab = i),
            labels: const ['Today', 'Work', 'Alerts'],
            badgeIndex: 2,
            badgeCount: unread,
          ),
        ),
      ),
    );
  }
}
