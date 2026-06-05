import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/lead.dart';
import 'package:hsdash_mobile/models/quotation.dart';

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
}
