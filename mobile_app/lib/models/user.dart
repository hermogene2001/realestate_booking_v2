class User {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String? language;
  final String? walletAddress;
  final bool? kycVerified;
  final bool? twofaEnabled;
  final String? createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.language,
    this.walletAddress,
    this.kycVerified,
    this.twofaEnabled,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] ?? 0,
    name: json['name'] ?? '',
    email: json['email'] ?? '',
    phone: json['phone'] ?? '',
    role: json['role'] ?? 'TENANT',
    language: json['language'],
    walletAddress: json['walletAddress'] ?? json['wallet_address'],
    kycVerified: json['kycVerified'] ?? json['kyc_verified'],
    twofaEnabled: json['twofaEnabled'] ?? json['twofa_enabled'],
    createdAt: json['createdAt'] ?? json['created_at'],
  );

  bool get isOwner => role == 'OWNER';
  bool get isAdmin => role == 'ADMIN';
  bool get isTenant => role == 'TENANT';
}
