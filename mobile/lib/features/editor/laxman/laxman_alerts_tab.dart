import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_widgets.dart';

class LaxmanAlertsTab extends ConsumerWidget {
  const LaxmanAlertsTab({super.key, required this.onOpenWork});

  final VoidCallback onOpenWork;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = ref.watch(notificationsProvider);

    return RefreshIndicator(
      color: LaxmanPalette.black,
      backgroundColor: LaxmanPalette.white,
      onRefresh: () async => ref.invalidate(notificationsProvider),
      child: notes.when(
        loading: () => const Center(child: CircularProgressIndicator(color: LaxmanPalette.black)),
        error: (e, _) => ListView(
          children: [Padding(padding: const EdgeInsets.all(28), child: Text('$e', style: LaxmanType.body('$e')))],
        ),
        data: (list) {
          if (list.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 48, 28, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('ALERTS', style: LaxmanType.sectionHead('')),
                      const SizedBox(height: 12),
                      Text('Zero', style: LaxmanType.display('Zero', size: 56)),
                      const SizedBox(height: 16),
                      Text('No pings yet.', style: LaxmanType.body('', size: 18)),
                    ],
                  ),
                ),
              ],
            );
          }

          final unread = list.where((n) => !n.read).length;

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.fromLTRB(28, 20, 28, 40),
            children: [
              Text('ALERTS', style: LaxmanType.sectionHead('')),
              const SizedBox(height: 12),
              Text('$unread', style: LaxmanType.display('$unread', size: 56)),
              Text(
                unread == 1 ? 'unread signal' : 'unread signals',
                style: LaxmanType.body('', size: 16),
              ),
              if (list.any((n) => !n.read)) ...[
                const SizedBox(height: 20),
                LaxmanGhostButton(
                  label: 'Mark all read',
                  onPressed: () async {
                    await ref.read(appRepositoryProvider).markAllNotificationsRead();
                    ref.invalidate(notificationsProvider);
                  },
                ),
              ],
              const LaxmanHairline(margin: EdgeInsets.symmetric(vertical: 32)),
              for (var i = 0; i < list.length; i++) ...[
                if (i > 0) const Divider(height: 1, color: LaxmanPalette.black),
                LaxmanNotificationRow(
                  title: list[i].title,
                  body: list[i].body.isNotEmpty ? list[i].body : null,
                  unread: !list[i].read,
                  onTap: onOpenWork,
                  onMarkRead: list[i].read
                      ? null
                      : () async {
                          await ref.read(appRepositoryProvider).markNotificationRead(list[i].id);
                          ref.invalidate(notificationsProvider);
                        },
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
