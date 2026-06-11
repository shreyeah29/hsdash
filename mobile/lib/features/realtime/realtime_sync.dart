import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/core/realtime_client.dart';
import 'package:hsdash_mobile/core/token_storage.dart';
import 'package:hsdash_mobile/features/attendance/attendance_providers.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/features/tasks/tasks_providers.dart';
import 'package:hsdash_mobile/features/users/users_providers.dart';

final realtimeClientProvider = Provider<RealtimeClient>((ref) {
  final client = RealtimeClient();
  ref.onDispose(client.disconnect);
  return client;
});

/// Invalidates Riverpod caches when the server pushes Socket.IO events.
void handleRealtimeEvent(WidgetRef ref, String event) {
  switch (event) {
    case 'task:updated':
    case 'production:cleared':
      _bumpAllProduction(ref);
      if (event == 'production:cleared') {
        ref.invalidate(usersProvider);
        ref.invalidate(productionTeamMembersProvider);
      }
    case 'assignment:updated':
      _bumpAssignments(ref);
    case 'notification:new':
      ref.invalidate(notificationsProvider);
    case 'attendance:updated':
      ref.invalidate(workShiftTodayProvider);
      ref.invalidate(attendanceAlertsProvider);
      ref.invalidate(adminTaskActivityProvider);
  }
}

void _bumpAllProduction(WidgetRef ref) {
  ref.invalidate(tasksProvider);
  ref.invalidate(adminOverviewProvider);
  ref.invalidate(adminTaskActivityProvider);
  ref.invalidate(productionCalendarWideEntriesProvider);
  ref.invalidate(editorAssignedShootsProvider);
  ref.invalidate(calendarEntriesProvider);
}

void _bumpAssignments(WidgetRef ref) {
  ref.invalidate(tasksProvider);
  ref.invalidate(adminOverviewProvider);
  ref.invalidate(adminTaskActivityProvider);
  ref.invalidate(productionCalendarWideEntriesProvider);
  ref.invalidate(notificationsProvider);
}

/// Connects Socket.IO while the user is authenticated (wrap dashboards).
class RealtimeListener extends ConsumerStatefulWidget {
  const RealtimeListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<RealtimeListener> createState() => _RealtimeListenerState();
}

class _RealtimeListenerState extends ConsumerState<RealtimeListener> {
  String? _connectedUserId;
  RealtimeClient? _client;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncConnection());
  }

  @override
  void didUpdateWidget(RealtimeListener oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncConnection();
  }

  Future<void> _syncConnection() async {
    final auth = ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated || auth.user == null) {
      _disconnect();
      return;
    }

    final userId = auth.user!.id;
    if (_connectedUserId == userId) return;

    final token = await TokenStorage().read();
    if (token == null || token.isEmpty) {
      _disconnect();
      return;
    }

    _client ??= ref.read(realtimeClientProvider);
    _client!.connect(
      token: token,
      onEvent: (event) {
        if (!mounted) return;
        handleRealtimeEvent(ref, event);
      },
    );
    _connectedUserId = userId;
  }

  void _disconnect() {
    _client?.disconnect();
    _connectedUserId = null;
  }

  @override
  void dispose() {
    _client?.disconnect();
    _connectedUserId = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
