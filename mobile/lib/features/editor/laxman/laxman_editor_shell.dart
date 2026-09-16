import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/config/app_legal.dart';
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
                  right: 8,
                  child: PopupMenuButton<String>(
                    tooltip: 'Account',
                    offset: const Offset(0, 40),
                    color: LaxmanPalette.white,
                    surfaceTintColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: LaxmanPalette.black),
                    ),
                    onSelected: (value) async {
                      if (value == 'privacy') {
                        await AppLegal.openPrivacyPolicy();
                      } else if (value == 'terms') {
                        await AppLegal.openTermsOfUse();
                      } else if (value == 'logout') {
                        ref.read(authControllerProvider.notifier).logout();
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem<String>(
                        value: 'privacy',
                        height: 44,
                        child: Text('Privacy Policy', style: LaxmanType.body('', size: 14)),
                      ),
                      PopupMenuItem<String>(
                        value: 'terms',
                        height: 44,
                        child: Text('Terms of Use', style: LaxmanType.body('', size: 14)),
                      ),
                      PopupMenuItem<String>(
                        value: 'logout',
                        height: 44,
                        child: Text(
                          'EXIT',
                          style: LaxmanType.label('').copyWith(fontSize: 11, color: Colors.red.shade700),
                        ),
                      ),
                    ],
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Text('MENU', style: LaxmanType.label('').copyWith(fontSize: 11)),
                    ),
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
