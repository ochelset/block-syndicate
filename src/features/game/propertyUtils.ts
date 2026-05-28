import type { Property, PropertyTier } from './gameTypes';

const OSLO_CENTER = { lat: 59.9139, lng: 10.7522 };

const RENT_RATE: Record<PropertyTier, number> = {
  vacant: 0.005,
  shop: 0.025,
  restaurant: 0.07,
};

const UPGRADE_COST_MULT: Partial<Record<PropertyTier, number>> = {
  vacant: 2,
  shop: 3.5,
};

const TIER_LABELS: Record<PropertyTier, string> = {
  vacant: 'VACANT LOT',
  shop: 'SHOP',
  restaurant: 'RESTAURANT',
};

const NEXT_TIER: Partial<Record<PropertyTier, PropertyTier>> = {
  vacant: 'shop',
  shop: 'restaurant',
};

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function deriveBasePrice(lat: number, lng: number): number {
  const km = haversineKm(lat, lng, OSLO_CENTER.lat, OSLO_CENTER.lng);
  const raw = 18_000_000 * Math.exp(-0.55 * km) + 300_000;
  return Math.round(raw / 100_000) * 100_000;
}

export function derivePropertyName(lat: number, lng: number): string {
  const km = haversineKm(lat, lng, OSLO_CENTER.lat, OSLO_CENTER.lng);
  const zones: [number, string[]][] = [
    [0.6, ['Aker Brygge', 'Rådhusplassen', 'Tjuvholmen', 'Pipervika']],
    [1.5, ['Grønland', 'Oslo S', 'Kvadraturen', 'Vippetangen']],
    [3, ['Grünerløkka', 'Majorstuen', 'Bislett', 'Frogner', 'St. Hanshaugen']],
    [5, ['Tøyen', 'Sinsen', 'Marienlyst', 'Ullevål', 'Kuba']],
    [
      Number.POSITIVE_INFINITY,
      ['Groruddalen', 'Holmlia', 'Lambertseter', 'Furuset'],
    ],
  ];
  const [, names] = zones.find(([max]) => km <= max) ?? [0, ['Outskirts']];
  const seed = Math.abs(Math.round(lat * 10000 + lng * 10000)) % names.length;
  const blockNum = (Math.abs(Math.round(lat * 1777 + lng * 1337)) % 99) + 1;
  return `Block ${String(blockNum).padStart(2, '0')} · ${names[seed]}`;
}

export function calcRentPerDay(
  marketPrice: number,
  tier: PropertyTier,
): number {
  return Math.round(marketPrice * RENT_RATE[tier]);
}

export function calcUpgradeCost(property: Property): number | null {
  const mult = UPGRADE_COST_MULT[property.tier];
  if (mult === undefined) return null;
  return Math.round(property.basePrice * mult);
}

export function nextTier(tier: PropertyTier): PropertyTier | null {
  return NEXT_TIER[tier] ?? null;
}

export function tierLabel(tier: PropertyTier): string {
  return TIER_LABELS[tier];
}

export function coordsToId(lat: number, lng: number): string {
  const p = 3000;
  const snappedLat = Math.round(lat * p) / p;
  const snappedLng = Math.round(lng * p) / p;
  return `${snappedLat.toFixed(4)}_${snappedLng.toFixed(4)}`;
}

export function buildProperty(
  id: string,
  rawLat: number,
  rawLng: number,
): Property {
  const p = 3000;
  const lat = Math.round(rawLat * p) / p;
  const lng = Math.round(rawLng * p) / p;
  const basePrice = deriveBasePrice(lat, lng);
  return {
    id,
    name: derivePropertyName(lat, lng),
    lat,
    lng,
    basePrice,
    marketPrice: basePrice,
    purchasePrice: null,
    tier: 'vacant',
    rentPerDay: 0,
  };
}

export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)
    return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export function tickMarketPrice(
  basePrice: number,
  idHash: number,
  day: number,
): number {
  const seed = Math.sin(idHash + day * 17.3) * 43758.5453;
  const r = seed - Math.floor(seed);
  const pct = 1 + (r - 0.5) * 0.06; // ±3% per day
  return (
    Math.round(Math.max(basePrice * 0.4, basePrice * pct) / 10_000) * 10_000
  );
}

export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
