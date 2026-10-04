'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  lat: number;
  lng: number;
  title: string;
}

export default function PropertyMap({ lat, lng, title }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || !hasCoordinates) return;
    if (mapInstanceRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
          `<strong>${title}</strong><br/><span style="font-size:12px;color:#6b7280">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>`
        )
        .openPopup();

      // Fix map rendering after layout settles
      requestAnimationFrame(() => {
        if (mapRef.current) map.invalidateSize();
      });

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasCoordinates, lat, lng, title]);

  if (!hasCoordinates) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl bg-gray-100 px-4 text-center text-sm text-gray-500">
        No exact map coordinates have been added for this property yet.
      </div>
    );
  }

  return (
    <div className="h-full min-h-[320px] w-full overflow-hidden rounded-xl" ref={mapRef} />
  );
}
