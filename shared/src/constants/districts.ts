export const KIGALI_DISTRICTS = [
  'Gasabo',
  'Kicukiro',
  'Nyarugenge',
] as const;

export type KigaliDistrict = typeof KIGALI_DISTRICTS[number];

export const KIGALI_SECTORS: Record<KigaliDistrict, string[]> = {
  Gasabo: ['Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Remera', 'Rusororo', 'Rutunga'],
  Kicukiro: ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'],
  Nyarugenge: ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'],
};

export const KIGALI_CENTER = { lat: -1.9403, lng: 29.8739 };
