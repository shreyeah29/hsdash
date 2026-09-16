import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/career_application.dart';

class CareersRepository {
  CareersRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<CareerStats> fetchStats() async {
    final data = await _api.getJson('/admin/careers/stats');
    return CareerStats.fromJson(data);
  }

  Future<List<CareerApplication>> fetchApplications({String? status, String? search}) async {
    final query = <String, dynamic>{};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (search != null && search.trim().isNotEmpty) query['search'] = search.trim();
    final data = await _api.getJson('/admin/careers', query: query.isEmpty ? null : query);
    final list = data['applications'] as List<dynamic>? ?? [];
    return list.map((e) => CareerApplication.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CareerApplication> updateApplication(
    String id, {
    String? status,
    String? notes,
  }) async {
    final body = <String, dynamic>{};
    if (status != null) body['status'] = status;
    if (notes != null) body['notes'] = notes;
    final data = await _api.patchJson('/admin/careers/$id', body: body);
    return CareerApplication.fromJson(data['application'] as Map<String, dynamic>);
  }

  Future<void> deleteApplication(String id) async {
    await _api.deleteJson('/admin/careers/$id');
  }
}
