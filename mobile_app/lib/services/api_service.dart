import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  static String? _baseUrl;
  static String? _token;

  static Future<void> init() async {
    _baseUrl = 'http://10.87.114.43:5001/api';
    _token = await _storage.read(key: 'auth_token');
  }

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final h = <String, String>{
      'Content-Type': 'application/json',
    };
    if (auth && _token != null) {
      h['Authorization'] = 'Bearer $_token';
    }
    return h;
  }

  static Future<Map<String, dynamic>> get(String path, {Map<String, String>? query, bool auth = true}) async {
    final uri = Uri.parse('$_baseUrl$path').replace(queryParameters: query);
    final res = await http.get(uri, headers: await _headers(auth: auth));
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body, bool auth = true}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final res = await http.post(uri, headers: await _headers(auth: auth), body: body != null ? jsonEncode(body) : null);
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? body, bool auth = true}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final res = await http.put(uri, headers: await _headers(auth: auth), body: body != null ? jsonEncode(body) : null);
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? body, bool auth = true}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final res = await http.patch(uri, headers: await _headers(auth: auth), body: body != null ? jsonEncode(body) : null);
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> delete(String path, {bool auth = true}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final res = await http.delete(uri, headers: await _headers(auth: auth));
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> uploadFile(String path, File file, {String field = 'images'}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = http.MultipartRequest('POST', uri);
    if (_token != null) request.headers['Authorization'] = 'Bearer $_token';
    request.files.add(await http.MultipartFile.fromPath(field, file.path));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _handleResponse(res);
  }

  static Map<String, dynamic> _handleResponse(http.Response res) {
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return data;
    throw ApiException(data['error'] ?? 'Request failed', res.statusCode);
  }

  static String? get token => _token;

  static Future<void> setToken(String? token) async {
    _token = token;
    if (token != null) {
      await _storage.write(key: 'auth_token', value: token);
    } else {
      await _storage.delete(key: 'auth_token');
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => 'ApiException($statusCode): $message';
}
