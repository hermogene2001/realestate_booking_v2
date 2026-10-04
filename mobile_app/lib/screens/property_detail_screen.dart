import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../models/property.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'booking_detail_screen.dart';

class PropertyDetailScreen extends StatefulWidget {
  final Property property;
  const PropertyDetailScreen({super.key, required this.property});

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  int _currentImage = 0;

  @override
  Widget build(BuildContext context) {
    final p = widget.property;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: p.images.isEmpty
                  ? Container(color: Colors.grey[200], child: const Center(child: Icon(Icons.image, size: 60, color: Colors.grey)))
                  : Stack(
                      children: [
                        PageView.builder(
                          itemCount: p.images.length,
                          onPageChanged: (i) => setState(() => _currentImage = i),
                          itemBuilder: (ctx, i) => CachedNetworkImage(imageUrl: 'http://localhost:5001${p.images[i]}', fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: Colors.grey[200]),
                            errorWidget: (_, __, ___) => Container(color: Colors.grey[200], child: const Icon(Icons.broken_image))),
                        ),
                        if (p.images.length > 1)
                          Positioned(
                            bottom: 12, left: 0, right: 0,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(p.images.length, (i) => Container(
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                width: _currentImage == i ? 20 : 8, height: 8,
                                decoration: BoxDecoration(
                                  color: _currentImage == i ? Colors.white : Colors.white54,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              )),
                            ),
                          ),
                      ],
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(p.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
                      Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(8)),
                        child: Text('${p.priceEthValue.toStringAsFixed(3)} ETH/mo', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.location_on, size: 16, color: Colors.grey),
                    Text('${p.location}, ${p.district}', style: TextStyle(color: Colors.grey[600])),
                  ]),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _infoChip(Icons.bed, '${p.bedrooms} Beds'),
                      _infoChip(Icons.bathroom, '${p.bathrooms} Baths'),
                      _infoChip(Icons.square_foot, '${p.area.toInt()} m²'),
                      _infoChip(Icons.monetization_on, '${p.depositEthValue.toStringAsFixed(2)} Deposit'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(p.description, style: const TextStyle(color: Colors.grey, height: 1.5)),
                  const SizedBox(height: 16),
                  const Text('Amenities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: p.amenities.map((a) => Chip(label: Text(a, style: const TextStyle(fontSize: 12)), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap)).toList(),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: double.infinity, height: 48,
            child: ElevatedButton.icon(
              onPressed: () => _showBookingSheet(context),
              icon: const Icon(Icons.calendar_today),
              label: const Text('Book This Property', style: TextStyle(fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) => Column(
    children: [Icon(icon, color: const Color(0xFF6366F1), size: 22), const SizedBox(height: 4), Text(label, style: const TextStyle(fontSize: 12))],
  );

  void _showBookingSheet(BuildContext context) {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }

    final p = widget.property;
    DateTime startDate = DateTime.now().add(const Duration(days: 1));
    DateTime endDate = DateTime.now().add(const Duration(days: 31));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Book This Property', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(p.title, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 20),
              const Text('Select Dates', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(context: ctx, initialDate: startDate, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                        if (picked != null) setSheetState(() { startDate = picked; if (endDate.isBefore(picked)) endDate = picked.add(const Duration(days: 30)); });
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(labelText: 'Check-in', prefixIcon: Icon(Icons.calendar_today, size: 18)),
                        child: Text('${startDate.year}-${startDate.month.toString().padLeft(2, '0')}-${startDate.day.toString().padLeft(2, '0')}'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(context: ctx, initialDate: endDate, firstDate: startDate, lastDate: DateTime.now().add(const Duration(days: 365)));
                        if (picked != null) setSheetState(() => endDate = picked);
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(labelText: 'Check-out', prefixIcon: Icon(Icons.calendar_today, size: 18)),
                        child: Text('${endDate.year}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}'),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Card(
                color: const Color(0xFF6366F1).withOpacity(0.05),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Price: ${p.priceEthValue.toStringAsFixed(3)} ETH/month', style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text('Deposit: ${p.depositEthValue.toStringAsFixed(3)} ETH', style: TextStyle(color: Colors.grey[700])),
                      const SizedBox(height: 4),
                      Text('You will book first, then pay the deposit after the owner accepts.', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity, height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    await _createBooking(startDate, endDate);
                  },
                  child: const Text('Submit Booking Request'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _createBooking(DateTime start, DateTime end) async {
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: Card(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))));

    try {
      final data = await ApiService.post('/bookings', body: {
        'propertyId': widget.property.id,
        'startDate': '${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}',
        'endDate': '${end.year}-${end.month.toString().padLeft(2, '0')}-${end.day.toString().padLeft(2, '0')}',
      });

      Navigator.pop(context);

      final bookingId = data['booking']?['id'] ?? data['id'];
      if (bookingId != null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking request submitted!'), backgroundColor: Colors.green));

        Navigator.push(context, MaterialPageRoute(
          builder: (_) => BookingDetailScreen(bookingId: bookingId),
        ));
      }
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    }
  }
}
