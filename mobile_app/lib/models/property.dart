import 'dart:convert';

class Property {
  final int id;
  final int ownerId;
  final String title;
  final String description;
  final String location;
  final String district;
  final double lat;
  final double lng;
  final String priceEth;
  final String depositEth;
  final List<String> images;
  final int bedrooms;
  final int bathrooms;
  final double area;
  final List<String> amenities;
  final String status;
  final bool isApproved;
  final bool? isVerified;
  final String? ownerName;
  final String? ownerEmail;
  final String? ownerPhone;
  final double? avgRating;
  final int? reviewCount;

  Property({
    required this.id,
    required this.ownerId,
    required this.title,
    required this.description,
    required this.location,
    required this.district,
    required this.lat,
    required this.lng,
    required this.priceEth,
    required this.depositEth,
    required this.images,
    required this.bedrooms,
    required this.bathrooms,
    required this.area,
    required this.amenities,
    required this.status,
    required this.isApproved,
    this.isVerified,
    this.ownerName,
    this.ownerEmail,
    this.ownerPhone,
    this.avgRating,
    this.reviewCount,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    List<String> parseImages(dynamic imgs) {
      if (imgs == null) return [];
      if (imgs is List) return imgs.cast<String>();
      if (imgs is String) {
        try {
          final parsed = Uri.tryParse(imgs);
          if (parsed != null && imgs.startsWith('[')) {
            return (jsonDecode(imgs) as List).cast<String>();
          }
        } catch (_) {}
        return imgs.isNotEmpty ? [imgs] : [];
      }
      return [];
    }

    List<String> parseAmenities(dynamic am) {
      if (am == null) return [];
      if (am is List) return am.cast<String>();
      if (am is String) {
        try { return (jsonDecode(am) as List).cast<String>(); } catch (_) {}
        return am.isNotEmpty ? [am] : [];
      }
      return [];
    }

    return Property(
      id: json['id'] ?? 0,
      ownerId: json['ownerId'] ?? json['owner_id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      location: json['location'] ?? '',
      district: json['district'] ?? '',
      lat: (json['lat'] ?? 0).toDouble(),
      lng: (json['lng'] ?? 0).toDouble(),
      priceEth: json['priceEth'] ?? json['price_eth'] ?? '0',
      depositEth: json['depositEth'] ?? json['deposit_eth'] ?? '0',
      images: parseImages(json['images']),
      bedrooms: json['bedrooms'] ?? 1,
      bathrooms: json['bathrooms'] ?? 1,
      area: (json['area'] ?? 0).toDouble(),
      amenities: parseAmenities(json['amenities']),
      status: json['status'] ?? 'AVAILABLE',
      isApproved: json['isApproved'] ?? json['is_approved'] ?? false,
      isVerified: json['isVerified'],
      ownerName: json['owner']?['name'],
      ownerEmail: json['owner']?['email'],
      ownerPhone: json['owner']?['phone'],
      avgRating: json['avgRating']?.toDouble(),
      reviewCount: json['reviewCount'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'title': title, 'description': description,
    'location': location, 'district': district, 'lat': lat, 'lng': lng,
    'priceEth': priceEth, 'depositEth': depositEth,
    'images': images, 'bedrooms': bedrooms, 'bathrooms': bathrooms,
    'area': area, 'amenities': amenities, 'status': status,
    'isApproved': isApproved,
  };

  double get priceEthValue => double.tryParse(priceEth) ?? 0;
  double get depositEthValue => double.tryParse(depositEth) ?? 0;
}
