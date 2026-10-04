import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/booking.dart';
import 'login_screen.dart';

class BookingDetailScreen extends StatefulWidget {
  final int bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  Booking? _booking;
  bool _loading = true;
  bool _actionLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/bookings/${widget.bookingId}');
      _booking = Booking.fromJson(data['booking'] ?? data);
    } catch (e) {
      _error = e.toString();
    }
    setState(() => _loading = false);
  }

  Future<void> _payBookingFee() async {
    setState(() { _actionLoading = true; _error = null; });
    try {
      await ApiService.patch('/bookings/${widget.bookingId}/tx', body: {
        'txHash': 'manual_${DateTime.now().millisecondsSinceEpoch}',
      });
      await _load();
    } catch (e) {
      _error = e.toString();
    }
    setState(() => _actionLoading = false);
  }

  Future<void> _payRemaining() async {
    setState(() { _actionLoading = true; _error = null; });
    try {
      await ApiService.post('/payments/eth/remaining', body: {
        'bookingId': widget.bookingId,
      });
      await _load();
    } catch (e) {
      _error = e.toString();
    }
    setState(() => _actionLoading = false);
  }

  Future<void> _confirmHandover() async {
    setState(() { _actionLoading = true; _error = null; });
    try {
      await ApiService.patch('/bookings/${widget.bookingId}/confirm');
      await _load();
    } catch (e) {
      _error = e.toString();
    }
    setState(() => _actionLoading = false);
  }

  Future<void> _cancelBooking() async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Cancel Booking'),
      content: const Text('Are you sure? A 10% penalty may apply.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes, Cancel')),
      ],
    ));
    if (ok != true) return;
    setState(() { _actionLoading = true; _error = null; });
    try {
      await ApiService.patch('/bookings/${widget.bookingId}/cancel');
      await _load();
    } catch (e) {
      _error = e.toString();
    }
    setState(() => _actionLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) return const LoginScreen();

    if (_loading) return Scaffold(appBar: AppBar(title: const Text('Booking')), body: const Center(child: CircularProgressIndicator()));
    if (_booking == null) return Scaffold(appBar: AppBar(title: const Text('Booking')), body: Center(child: Text(_error ?? 'Not found')));

    final b = _booking!;
    final steps = _buildSteps(b);

    return Scaffold(
      appBar: AppBar(title: Text(b.propertyTitle ?? 'Booking #${b.id}')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(b.propertyTitle ?? 'Property', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: _statusColor(b.status).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(b.status, style: TextStyle(color: _statusColor(b.status), fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (b.propertyDistrict != null) Text(b.propertyDistrict!, style: const TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    Row(children: [
                      const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('${b.startDate} → ${b.endDate}', style: const TextStyle(color: Colors.grey)),
                    ]),
                    if (b.ownerName != null) Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(children: [
                        const Icon(Icons.person, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text('Owner: ${b.ownerName}', style: const TextStyle(color: Colors.grey)),
                      ]),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Booking Progress', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...steps,
            if (_error != null) Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),
            if (b.isPending || b.isAccepted || (b.isCompleted && auth.user!.id == b.tenantId)) Padding(
              padding: const EdgeInsets.only(top: 16),
              child: OutlinedButton.icon(
                onPressed: _actionLoading ? null : _cancelBooking,
                icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                label: Text(_actionLoading ? 'Processing...' : 'Cancel Booking', style: const TextStyle(color: Colors.red)),
              ),
            ),
            if (b.isCompleted && auth.user!.id == b.tenantId && !b.remainingPaid && b.remainingAmount != null && b.remainingAmount!.isNotEmpty) Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Remaining Payment', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Pay remaining: ${b.remainingAmount} ETH', style: TextStyle(color: Colors.grey[600])),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _actionLoading ? null : _payRemaining,
                          icon: _actionLoading
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.payment),
                          label: Text(_actionLoading ? 'Processing...' : 'Pay Remaining ${b.remainingAmount} ETH'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildSteps(Booking b) {
    final steps = <_BookingStep>[];

    steps.add(_BookingStep(
      number: 1,
      title: 'Pending',
      subtitle: 'Awaiting owner approval',
      done: !b.isPending && !b.isRejected,
      active: b.isPending,
      failed: b.isRejected,
    ));

    steps.add(_BookingStep(
      number: 2,
      title: 'Accepted',
      subtitle: 'Owner approved your request',
      done: b.isAccepted || b.isLocked || b.isCompleted,
      active: b.isAccepted,
    ));

    steps.add(_BookingStep(
      number: 3,
      title: 'Pay Booking Fee',
      subtitle: b.isLocked || b.isCompleted ? 'Booking fee paid' : 'Pay deposit to confirm booking',
      done: b.isLocked || b.isCompleted,
      active: b.isAccepted,
      action: b.isAccepted
          ? _BookingStepAction(
              label: 'Pay Booking Fee',
              onTap: _payBookingFee,
              loading: _actionLoading,
            )
          : null,
    ));

    steps.add(_BookingStep(
      number: 4,
      title: 'Completed',
      subtitle: b.isCompleted ? 'Booking finalized successfully' : 'Confirm to complete booking',
      done: b.isCompleted,
      active: b.isLocked,
      action: b.isLocked
          ? _BookingStepAction(
              label: 'Confirm Booking',
              onTap: _confirmHandover,
              loading: _actionLoading,
            )
          : null,
    ));

    return steps.map((s) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: s,
    )).toList();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING': return Colors.orange;
      case 'ACCEPTED': return Colors.blue;
      case 'LOCKED': return Colors.indigo;
      case 'COMPLETED': return Colors.green;
      case 'REJECTED': return Colors.red;
      case 'CANCELLED': return Colors.grey;
      case 'REFUNDED': return Colors.teal;
      case 'DISPUTED': return Colors.purple;
      default: return Colors.grey;
    }
  }
}

class _BookingStep extends StatelessWidget {
  final int number;
  final String title;
  final String subtitle;
  final bool done;
  final bool active;
  final bool failed;
  final _BookingStepAction? action;

  const _BookingStep({
    required this.number,
    required this.title,
    required this.subtitle,
    this.done = false,
    this.active = false,
    this.failed = false,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    if (done) {
      icon = Icons.check_circle;
      color = Colors.green;
    } else if (failed) {
      icon = Icons.cancel;
      color = Colors.red;
    } else if (active) {
      icon = Icons.radio_button_checked;
      color = const Color(0xFF6366F1);
    } else {
      icon = Icons.radio_button_unchecked;
      color = Colors.grey[300]!;
    }

    return Card(
      color: active ? const Color(0xFF6366F1).withOpacity(0.05) : null,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: done || active ? Colors.black : Colors.grey)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                ],
              ),
            ),
            if (action != null)
              TextButton(
                onPressed: action!.loading ? null : action!.onTap,
                style: TextButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white),
                child: action!.loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(action!.label, style: const TextStyle(fontSize: 12)),
              ),
          ],
        ),
      ),
    );
  }
}

class _BookingStepAction {
  final String label;
  final VoidCallback onTap;
  final bool loading;
  _BookingStepAction({required this.label, required this.onTap, this.loading = false});
}
