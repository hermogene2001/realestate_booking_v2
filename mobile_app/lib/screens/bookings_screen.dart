import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/booking.dart';
import 'login_screen.dart';
import 'booking_detail_screen.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  List<Booking> _bookings = [];
  bool _loading = true;
  String _filter = 'ALL';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/bookings');
      _bookings = (data['bookings'] as List).map((j) => Booking.fromJson(j)).toList();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) return const LoginScreen();

    final filtered = _filter == 'ALL' ? _bookings : _bookings.where((b) => _matchFilter(b.status)).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings')),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(12),
            child: Row(
              children: ['ALL', 'PENDING', 'ACCEPTED', 'LOCKED', 'COMPLETED', 'CANCELLED'].map((f) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(label: Text(f), selected: _filter == f, onSelected: (_) => setState(() => _filter = f)),
              )).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? const Center(child: Text('No bookings found'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, i) => _buildBookingCard(filtered[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  bool _matchFilter(String status) {
    if (_filter == 'ALL') return true;
    if (_filter == 'PENDING' && status == 'PENDING') return true;
    if (_filter == 'ACCEPTED' && status == 'ACCEPTED') return true;
    if (_filter == 'LOCKED' && status == 'LOCKED') return true;
    if (_filter == 'COMPLETED' && status == 'COMPLETED') return true;
    if (_filter == 'CANCELLED' && (status == 'CANCELLED' || status == 'REJECTED')) return true;
    return false;
  }

  Widget _buildBookingCard(Booking b) {
    Color statusColor;
    switch (b.status) {
      case 'PENDING': statusColor = Colors.orange; break;
      case 'ACCEPTED': statusColor = Colors.blue; break;
      case 'LOCKED': statusColor = Colors.indigo; break;
      case 'COMPLETED': statusColor = Colors.green; break;
      case 'REJECTED':
      case 'CANCELLED': statusColor = Colors.red; break;
      case 'DISPUTED': statusColor = Colors.purple; break;
      default: statusColor = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: statusColor.withOpacity(0.2), child: Icon(Icons.calendar_today, color: statusColor, size: 20)),
        title: Text(b.propertyTitle ?? 'Property #${b.propertyId}', maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${b.startDate} → ${b.endDate}'),
            if (b.remainingPaid) Row(
              children: const [
                Icon(Icons.check_circle, size: 12, color: Colors.green),
                SizedBox(width: 4),
                Text('Full payment done', style: TextStyle(fontSize: 11, color: Colors.green)),
              ],
            ),
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Text(b.status, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
        ),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => BookingDetailScreen(bookingId: b.id)));
        },
      ),
    );
  }
}
