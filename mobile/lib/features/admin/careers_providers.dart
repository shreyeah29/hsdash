import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/careers_repository.dart';
import 'package:hsdash_mobile/models/career_application.dart';

final careersRepositoryProvider = Provider<CareersRepository>((ref) => CareersRepository());

final careerStatsProvider = FutureProvider.autoDispose<CareerStats>((ref) async {
  return ref.read(careersRepositoryProvider).fetchStats();
});

class CareersListQuery {
  const CareersListQuery({this.status, this.search = ''});

  final String? status;
  final String search;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CareersListQuery && other.status == status && other.search == search;

  @override
  int get hashCode => Object.hash(status, search);
}

final careersListProvider =
    FutureProvider.autoDispose.family<List<CareerApplication>, CareersListQuery>((ref, query) async {
  return ref.read(careersRepositoryProvider).fetchApplications(
        status: query.status,
        search: query.search.isEmpty ? null : query.search,
      );
});

void invalidateCareersCaches(WidgetRef ref) {
  ref.invalidate(careerStatsProvider);
  ref.invalidate(careersListProvider);
}
