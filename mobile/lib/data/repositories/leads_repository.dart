import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/lead.dart';
import 'package:hsdash_mobile/models/quotation.dart';

class LeadDetailBundle {
  const LeadDetailBundle({required this.lead, required this.quotations});

  final LeadDetail lead;
  final List<QuotationSummary> quotations;
}

class LeadsRepository {
  LeadsRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<LeadStats> fetchStats() async {
    final data = await _api.getJson('/admin/leads/stats');
    return LeadStats.fromJson(data);
  }

  Future<List<LeadSummary>> fetchLeads({String? status, String? search}) async {
    final query = <String, dynamic>{};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (search != null && search.trim().isNotEmpty) query['search'] = search.trim();
    final data = await _api.getJson('/admin/leads', query: query.isEmpty ? null : query);
    final list = data['leads'] as List<dynamic>? ?? [];
    return list.map((e) => LeadSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<LeadDetail> fetchLead(String id) async {
    final data = await _api.getJson('/admin/leads/$id');
    return LeadDetail.fromJson(data['lead'] as Map<String, dynamic>);
  }

  Future<LeadDetailBundle> fetchLeadBundle(String id) async {
    try {
      final data = await _api.getJson('/admin/leads/$id/bundle');
      final quotes = data['quotations'] as List<dynamic>? ?? [];
      return LeadDetailBundle(
        lead: LeadDetail.fromJson(data['lead'] as Map<String, dynamic>),
        quotations: quotes.map((e) => QuotationSummary.fromJson(e as Map<String, dynamic>)).toList(),
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        final results = await Future.wait([
          fetchLead(id),
          fetchQuotations(id),
        ]);
        return LeadDetailBundle(
          lead: results[0] as LeadDetail,
          quotations: results[1] as List<QuotationSummary>,
        );
      }
      rethrow;
    }
  }

  Future<LeadDetail> updateLead(String id, {String? status, String? assignedToId}) async {
    final body = <String, dynamic>{};
    if (status != null) body['status'] = status;
    if (assignedToId != null) body['assignedToId'] = assignedToId;
    final data = await _api.patchJson('/admin/leads/$id', body: body);
    return LeadDetail.fromJson(data['lead'] as Map<String, dynamic>);
  }

  Future<void> addNote(String leadId, String content) async {
    await _api.postJson('/admin/leads/$leadId/notes', body: {'content': content});
  }

  Future<LeadDetail> convertLead(String id) async {
    final data = await _api.postJson('/admin/leads/$id/convert');
    return LeadDetail.fromJson(data['lead'] as Map<String, dynamic>);
  }

  Future<List<QuotationSummary>> fetchQuotations(String leadId) async {
    final data = await _api.getJson('/admin/leads/$leadId/quotations');
    final list = data['quotations'] as List<dynamic>? ?? [];
    return list.map((e) => QuotationSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<QuotationDetail?> fetchLatestQuotation(String leadId) async {
    try {
      final data = await _api.getJson('/admin/leads/$leadId/quotations/latest');
      return QuotationDetail.fromJson(data['quotation'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<QuotationSummary> createQuotation(String leadId, QuotationDraft draft) async {
    final data = await _api.postJson('/admin/leads/$leadId/quotations', body: draft.toCreateBody());
    return QuotationSummary.fromJson(data['quotation'] as Map<String, dynamic>);
  }
}
