import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/property.dart';
import '../screens/property_detail_screen.dart';

class PropertyCard extends StatelessWidget {
  final Property property;

  const PropertyCard({super.key, required this.property});

  @override
  Widget build(BuildContext context) {
    final firstImage = property.images.isNotEmpty ? 'http://localhost:5001${property.images[0]}' : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PropertyDetailScreen(property: property))),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (firstImage != null)
              CachedNetworkImage(imageUrl: firstImage, height: 180, width: double.infinity, fit: BoxFit.cover,
                placeholder: (_, __) => Container(height: 180, color: Colors.grey[200]),
                errorWidget: (_, __, ___) => Container(height: 180, color: Colors.grey[200], child: const Center(child: Icon(Icons.broken_image, size: 40))))
            else
              Container(height: 180, color: Colors.grey[200], child: const Center(child: Icon(Icons.home_work, size: 40, color: Colors.grey))),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(property.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      Text('${property.priceEthValue.toStringAsFixed(3)} ETH', style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.location_on, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(child: Text('${property.location}, ${property.district}', style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ]),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _miniChip(Icons.bed, '${property.bedrooms}'),
                      const SizedBox(width: 12),
                      _miniChip(Icons.bathroom, '${property.bathrooms}'),
                      const SizedBox(width: 12),
                      _miniChip(Icons.square_foot, '${property.area.toInt()} m²'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniChip(IconData icon, String label) => Row(
    children: [Icon(icon, size: 14, color: Colors.grey[500]), const SizedBox(width: 3), Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey))],
  );
}
