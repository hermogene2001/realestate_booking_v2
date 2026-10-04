class Booking {
  final int id;
  final int propertyId;
  final int tenantId;
  final int? ownerId;
  final String startDate;
  final String endDate;
  final String status;
  final String? depositTxHash;
  final String? confirmTxHash;
  final double? totalPrice;
  final String? propertyTitle;
  final String? propertyDistrict;
  final List<String>? propertyImages;
  final String? tenantName;
  final String? ownerName;
  final String? totalAmount;
  final String? remainingAmount;
  final bool remainingPaid;
  final String? escrowAmount;
  final String? paymentMethod;
  final String? paymentStatus;
  final bool tenantConfirmed;
  final bool ownerConfirmed;
  final String? timeoutAt;
  final int? blockchainBookingId;
  final String? txHash;
  final String? remainingTxHash;

  Booking({
    required this.id,
    required this.propertyId,
    required this.tenantId,
    this.ownerId,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.depositTxHash,
    this.confirmTxHash,
    this.totalPrice,
    this.propertyTitle,
    this.propertyDistrict,
    this.propertyImages,
    this.tenantName,
    this.ownerName,
    this.totalAmount,
    this.remainingAmount,
    this.remainingPaid = false,
    this.escrowAmount,
    this.paymentMethod,
    this.paymentStatus,
    this.tenantConfirmed = false,
    this.ownerConfirmed = false,
    this.timeoutAt,
    this.blockchainBookingId,
    this.txHash,
    this.remainingTxHash,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    List<String> parseImages(dynamic imgs) {
      if (imgs == null) return [];
      if (imgs is List) return imgs.cast<String>();
      return [];
    }

    return Booking(
      id: json['id'] ?? 0,
      propertyId: json['propertyId'] ?? json['property_id'] ?? 0,
      tenantId: json['tenantId'] ?? json['tenant_id'] ?? 0,
      ownerId: json['ownerId'] ?? json['owner_id'],
      startDate: json['startDate'] ?? json['start_date'] ?? '',
      endDate: json['endDate'] ?? json['end_date'] ?? '',
      status: json['status'] ?? 'PENDING',
      depositTxHash: json['depositTxHash'] ?? json['deposit_tx_hash'],
      confirmTxHash: json['confirmTxHash'] ?? json['confirm_tx_hash'],
      totalPrice: (json['totalPrice'] ?? json['total_price'])?.toDouble(),
      propertyTitle: json['property']?['title'] ?? json['propertyTitle'],
      propertyDistrict: json['property']?['district'] ?? json['propertyDistrict'],
      propertyImages: json['property']?['images'] != null
          ? parseImages(json['property']['images'])
          : parseImages(json['propertyImages']),
      tenantName: json['tenant']?['name'] ?? json['tenantName'],
      ownerName: json['owner']?['name'] ?? json['ownerName'],
      totalAmount: json['totalAmount'] ?? json['total_amount'],
      remainingAmount: json['remainingAmount'] ?? json['remaining_amount'],
      remainingPaid: json['remainingPaid'] ?? json['remaining_paid'] ?? false,
      escrowAmount: json['escrowAmount'] ?? json['escrow_amount'],
      paymentMethod: json['paymentMethod'] ?? json['payment_method'],
      paymentStatus: json['paymentStatus'] ?? json['payment_status'],
      tenantConfirmed: json['tenantConfirmed'] ?? json['tenant_confirmed'] ?? false,
      ownerConfirmed: json['ownerConfirmed'] ?? json['owner_confirmed'] ?? false,
      timeoutAt: json['timeoutAt'] ?? json['timeout_at'],
      blockchainBookingId: json['blockchainBookingId'] ?? json['blockchain_booking_id'],
      txHash: json['txHash'] ?? json['tx_hash'],
      remainingTxHash: json['remainingTxHash'] ?? json['remaining_tx_hash'],
    );
  }

  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isLocked => status == 'LOCKED';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';
  bool get isRejected => status == 'REJECTED';
  bool get isDisputed => status == 'DISPUTED';
  bool get isRefunded => status == 'REFUNDED';
}
