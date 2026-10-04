import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/property.dart';
import '../widgets/property_card.dart';
import 'login_screen.dart';
import 'properties_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Property> _properties = [];
  bool _loading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties({String? query}) async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/properties', query: query != null ? {'search': query} : null);
      _properties = (data['properties'] as List).map((j) => Property.fromJson(j)).toList();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kigali RE'),
        actions: [
          if (!auth.isLoggedIn)
            TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
              child: const Text('Login', style: TextStyle(color: Colors.white))),
          if (auth.isLoggedIn)
            PopupMenuButton<String>(
              icon: const CircleAvatar(child: Icon(Icons.person), radius: 16),
              onSelected: (v) {
                if (v == 'logout') auth.logout();
              },
              itemBuilder: (_) => [
                PopupMenuItem(value: 'profile', child: ListTile(
                  leading: const Icon(Icons.person), title: Text(auth.user?.name ?? ''),
                  subtitle: Text(auth.user?.email ?? ''))),
                if (auth.isOwner || auth.isAdmin)
                  const PopupMenuItem(value: 'dashboard', child: ListTile(leading: Icon(Icons.dashboard), title: Text('Dashboard'))),
                const PopupMenuItem(value: 'logout', child: ListTile(leading: Icon(Icons.logout), title: Text('Logout'))),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search properties...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _searchController.clear(); _loadProperties(); })
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onSubmitted: (v) => _loadProperties(query: v),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _properties.isEmpty
                    ? const Center(child: Text('No properties found'))
                    : RefreshIndicator(
                        onRefresh: _loadProperties,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _properties.length + 2,
                          itemBuilder: (ctx, i) {
                            if (i == 0) return _buildStatsRow();
                            if (i == 1) return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  const Text('Available Properties', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  const Spacer(),
                                  TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PropertiesScreen())),
                                    child: const Text('See All')),
                                ],
                              ),
                            );
                            return PropertyCard(property: _properties[i - 2]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final districts = _properties.length;
    final avgPrice = _properties.isEmpty ? 0 : _properties.map((p) => p.priceEthValue).reduce((a, b) => a + b) / _properties.length;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${_properties.length} Properties Available', style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 4),
          Text('Avg: ${avgPrice.toStringAsFixed(3)} ETH', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _statItem('Secure Escrow', '🔒'),
              _statItem('0% Fraud', '✅'),
              _statItem('3 Districts', '📍'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statItem(String label, String icon) => Column(
    children: [Text(icon, style: const TextStyle(fontSize: 20)), Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11))],
  );
}
