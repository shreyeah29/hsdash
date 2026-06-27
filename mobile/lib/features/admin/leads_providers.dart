import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/leads_repository.dart';
import 'package:hsdash_mobile/models/lead.dart';
import 'package:hsdash_mobile/models/quotation.dart';

final leadsRepositoryProvider = Provider<LeadsRepository>((ref) => LeadsRepository());

final leadStatsProvider = FutureProvider.autoDispose<LeadStats>((ref) async {
  return ref.read(leadsRepositoryProvider).fetchStats();
});

final leadsListProvider =
    FutureProvider.autoDispose.family<List<LeadSummary>, LeadsListQuery>((ref, query) async {
  return ref.read(leadsRepositoryProvider).fetchLeads(
        status: query.status,
        search: query.search.isEmpty ? null : query.search,
      );
});

/// Filters for the admin leads list.
class LeadsListQuery {
  const LeadsListQuery({this.status, this.search = ''});

  final String? status;
  final String search;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LeadsListQuery && other.status == status && other.search == search;

  @override
  int get hashCode => Object.hash(status, search);
}

final leadDetailProvider = FutureProvider.autoDispose.family<LeadDetail, String>((ref, id) async {
  return ref.read(leadsRepositoryProvider).fetchLead(id);
});

final leadDetailBundleProvider = FutureProvider.autoDispose.family<LeadDetailBundle, String>((ref, id) async {
  return ref.read(leadsRepositoryProvider).fetchLeadBundle(id);
});

final leadQuotationsProvider = FutureProvider.autoDispose.family<List<QuotationSummary>, String>((ref, leadId) async {
  return ref.read(leadsRepositoryProvider).fetchQuotations(leadId);
});
