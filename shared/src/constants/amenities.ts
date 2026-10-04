export const AMENITIES = [
  'wifi',
  'parking',
  'pool',
  'gym',
  'security',
  'garden',
  'balcony',
  'furnished',
  'air_conditioning',
  'water_heater',
  'generator',
  'cctv',
  'laundry',
  'pets_allowed',
  'elevator',
] as const;

export type Amenity = typeof AMENITIES[number];
