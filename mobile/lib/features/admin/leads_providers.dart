import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/data/repositories/leads_repository.dart';
import 'package:hsdash_mobile/models/lead.dart';

final leadsRepositoryProvider = Provider<LeadsRepository>((ref) => LeadsRepository());

final leadStatsProvider = FutureProvider.autoDispose<LeadStats>((ref) async {
  return ref.read(leadsRepositoryProvider).fetchStats();
});

final leadsListProvider = FutureProvider.autoDispose.family<List<LeadSummary>, String?>((ref, statusFilter) async {
  return ref.read(leadsRepositoryProvider).fetchLeads(status: statusFilter);
});

final leadDetailProvider = FutureProvider.autoDispose.family<LeadDetail, String>((ref, id) async {
  return ref.read(leadsRepositoryProvider).fetchLead(id);
});
