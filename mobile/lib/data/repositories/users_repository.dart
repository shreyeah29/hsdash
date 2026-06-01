import 'package:hsdash_mobile/core/api_client.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/models/user_form.dart';

/// Users APIs — see `API.md` → Users section (ADMIN only).
class UsersRepository {
  UsersRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  /// `GET /users`
  Future<List<User>> fetchUsers() async {
    final data = await _api.getJson('/users');
    final list = data['users'] as List<dynamic>? ?? [];
    return list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `POST /users`
  Future<User> createUser(UserFormData form) async {
    final data = await _api.postJson('/users', body: form.toCreateJson());
    final userJson = data['user'] as Map<String, dynamic>?;
    if (userJson == null) throw ApiException('Missing user in response');
    return User.fromJson(userJson);
  }

  /// `PUT /users/:id`
  Future<User> updateUser(String id, UserFormData form) async {
    final data = await _api.putJson('/users/$id', body: form.toUpdateJson());
    final userJson = data['user'] as Map<String, dynamic>?;
    if (userJson == null) throw ApiException('Missing user in response');
    return User.fromJson(userJson);
  }

  /// `POST /users/:id/reset-password`
  Future<void> resetPassword(String id, String password) async {
    await _api.postJson('/users/$id/reset-password', body: {'password': password});
  }

  /// `DELETE /users/:id`
  Future<void> deleteUser(String id) async {
    await _api.deleteJson('/users/$id');
  }
}
