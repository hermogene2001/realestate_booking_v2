import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/property.dart';
import '../widgets/property_card.dart';

class PropertiesScreen extends StatefulWidget {
  const PropertiesScreen({super.key});

  @override
  State<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends State<PropertiesScreen> {
  List<Property> _all = [];
  List<Property> _filtered = [];
  bool _loading = true;
  String _selectedDistrict = 'All';
  String _sortBy = 'Newest';
  final _searchController = TextEditingController();

  final _districts = ['All', 'Gasabo', 'Kicukiro', 'Nyarugenge'];
  final _sortOptions = ['Newest', 'Price: Low', 'Price: High', 'Name'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/properties');
      _all = (data['properties'] as List).map((j) => Property.fromJson(j)).toList();
      _applyFilters();
    } catch (_) {}
    setState(() => _loading = false);
  }

  void _applyFilters() {
    _filtered = List.from(_all);
    if (_selectedDistrict != 'All') {
      _filtered = _filtered.where((p) => p.district == _selectedDistrict).toList();
    }
    if (_searchController.text.isNotEmpty) {
      final q = _searchController.text.toLowerCase();
      _filtered = _filtered.where((p) => p.title.toLowerCase().contains(q) || p.location.toLowerCase().contains(q)).toList();
    }
    switch (_sortBy) {
      case 'Price: Low': _filtered.sort((a, b) => a.priceEthValue.compareTo(b.priceEthValue)); break;
      case 'Price: High': _filtered.sort((a, b) => b.priceEthValue.compareTo(a.priceEthValue)); break;
      case 'Name': _filtered.sort((a, b) => a.title.compareTo(b.title)); break;
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Properties')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search...', prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (_) => _applyFilters(),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                ..._districts.map((d) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(label: Text(d), selected: _selectedDistrict == d, onSelected: (_) { setState(() => _selectedDistrict = d); _applyFilters(); }),
                )),
                const SizedBox(width: 8),
                DropdownButton<String>(value: _sortBy, underline: const SizedBox(),
                  items: _sortOptions.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
                  onChanged: (v) { setState(() => _sortBy = v!); _applyFilters(); }),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? const Center(child: Text('No properties match your filters'))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _filtered.length,
                        itemBuilder: (ctx, i) => PropertyCard(property: _filtered[i]),
                      ),
          ),
        ],
      ),
    );
  }
}
