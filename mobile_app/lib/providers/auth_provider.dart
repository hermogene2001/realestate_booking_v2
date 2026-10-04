import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;
  bool get isOwner => _user?.isOwner ?? false;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get error => _error;

  Future<bool> login(String email, String password) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.post('/auth/login', body: {'email': email, 'password': password}, auth: false);
      await ApiService.setToken(data['token']);
      await _loadUser();
      _loading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString(); _loading = false; notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password, String phone, {String role = 'TENANT'}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.post('/auth/register', body: {
        'name': name, 'email': email, 'password': password, 'phone': phone, 'role': role,
      }, auth: false);
      await ApiService.setToken(data['token']);
      await _loadUser();
      _loading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString(); _loading = false; notifyListeners();
      return false;
    }
  }

  Future<void> _loadUser() async {
    try {
      final data = await ApiService.get('/auth/me');
      _user = User.fromJson(data['user']);
    } catch (_) {
      await ApiService.setToken(null);
      _user = null;
    }
  }

  Future<void> loadUserFromToken() async {
    await ApiService.init();
    if (ApiService.token != null) {
      await _loadUser();
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await ApiService.setToken(null);
    _user = null;
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    try {
      await ApiService.put('/auth/profile', body: updates);
      await _loadUser();
      notifyListeners();
    } catch (e) {
      _error = e.toString(); notifyListeners();
    }
  }
}
