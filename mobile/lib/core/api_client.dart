import 'package:dio/dio.dart';
import 'package:hsdash_mobile/config/env.dart';
import 'package:hsdash_mobile/core/token_storage.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({TokenStorage? tokenStorage, Dio? dio})
      : _tokenStorage = tokenStorage ?? TokenStorage(),
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: apiBaseUrl,
                connectTimeout: const Duration(seconds: 30),
                receiveTimeout: const Duration(seconds: 30),
                headers: {'Content-Type': 'application/json'},
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.read();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final TokenStorage _tokenStorage;
  final Dio _dio;

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(path, queryParameters: query);
      return res.data ?? {};
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<Map<String, dynamic>> postJson(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(path, data: body);
      return res.data ?? {};
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<Map<String, dynamic>> putJson(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await _dio.put<Map<String, dynamic>>(path, data: body);
      return res.data ?? {};
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<Map<String, dynamic>> patchJson(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await _dio.patch<Map<String, dynamic>>(path, data: body);
      return res.data ?? {};
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<void> deleteJson(String path) async {
    try {
      await _dio.delete(path);
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  ApiException _wrap(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] is String) {
      return ApiException(data['message'] as String, statusCode: e.response?.statusCode);
    }
    if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
      return ApiException(
        'Could not reach the server. Check API_URL and your connection.',
        statusCode: e.response?.statusCode,
      );
    }
    return ApiException(e.message ?? 'Request failed', statusCode: e.response?.statusCode);
  }
}
