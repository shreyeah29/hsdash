import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/coordinator/coordinator_providers.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_theme.dart';
import 'package:hsdash_mobile/features/production_calendar/production_calendar_providers.dart';
import 'package:hsdash_mobile/widgets/wedding_deliverables.dart';

/// Coordinator Work — deliverables to assign (same flow as before, B&W chrome from parent theme).
class CoordinatorWorkTab extends ConsumerWidget {
  const CoordinatorWorkTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliverables = ref.watch(coordinatorDeliverableTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('WORK', style: LaxmanType.sectionHead('')),
              const SizedBox(height: 6),
              Text(
                'Assign editors to deliverables from shoots you activate.',
                style: LaxmanType.body('', size: 14),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: LaxmanPalette.black,
            backgroundColor: LaxmanPalette.white,
            onRefresh: () async => invalidateProductionCaches(ref),
            child: deliverables.when(
              loading: () => const Center(child: CircularProgressIndicator(color: LaxmanPalette.black)),
              error: (e, _) => ListView(
                children: [Padding(padding: const EdgeInsets.all(20), child: Text('$e'))],
              ),
              data: (list) {
                if (list.isEmpty) {
                  return ListView(
                    children: [
                      const SizedBox(height: 48),
                      Center(child: Text('No deliverables yet.', style: LaxmanType.body('', size: 16))),
                    ],
                  );
                }
                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  children: [
                    WeddingDeliverablesList(
                      tasks: list,
                      allowAssign: true,
                      onChanged: () => invalidateProductionCaches(ref),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
