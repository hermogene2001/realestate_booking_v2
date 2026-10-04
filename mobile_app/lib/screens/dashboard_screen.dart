import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../models/property.dart';
import '../widgets/property_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  User? _user;
  List<Property> _myProperties = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final userData = await ApiService.get('/auth/me');
      _user = User.fromJson(userData['user']);
      final propData = await ApiService.get('/properties/mine');
      _myProperties = (propData['properties'] as List).map((j) => Property.fromJson(j)).toList();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person), radius: 24),
                    title: Text(_user?.name ?? 'User'),
                    subtitle: Text(_user?.email ?? ''),
                    trailing: Text(_user?.role ?? '', style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('My Properties', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (_myProperties.isEmpty)
                  const Card(child: Padding(padding: EdgeInsets.all(24), child: Center(child: Text('No properties yet. Create your first listing!'))))
                else
                  ...List.generate(_myProperties.length, (i) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: const Icon(Icons.home_work),
                      title: Text(_myProperties[i].title, maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Text('${_myProperties[i].priceEth} ETH - ${_myProperties[i].status}'),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  )),
              ],
            ),
    );
  }
}
