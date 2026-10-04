'use client';

import { useEffect, useRef } from 'react';

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

// Kigali center
const DEFAULT_LAT = -1.9403;
const DEFAULT_LNG = 29.8739;

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // Mark the container as taken synchronously before the async import resolves
    // This prevents React StrictMode double-invoke from creating two maps
    const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) return;

    import('leaflet').then((L) => {
      if (mapInstanceRef.current) return; // guard again after await
      // Fix default marker icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([lat || DEFAULT_LAT, lng || DEFAULT_LNG], 17);
      mapInstanceRef.current = map;

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      });

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
          maxZoom: 19,
        }
      ).addTo(map);

      L.control.layers(
        {
          Satellite: satelliteLayer,
          Street: streetLayer,
        },
        undefined,
        { position: 'topright' }
      ).addTo(map);

      const marker = L.marker([lat || DEFAULT_LAT, lng || DEFAULT_LNG], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.bindPopup('Drag to set property location').openPopup();

      // Update on marker drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });

      // Update on map click
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
      });

      L.control.scale({ metric: true, imperial: false }).addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current?.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-gray-300 overflow-hidden"
        style={{ height: '320px' }}
      />
      <p className="text-xs text-gray-500">
        Click the satellite map or drag the marker to set the exact house location.
        Selected: <span className="font-mono font-medium text-gray-700">{lat}, {lng}</span>
      </p>
    </div>
  );
}
