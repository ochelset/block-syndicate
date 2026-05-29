export type PropertyTier = 'vacant' | 'shop' | 'restaurant';

export interface Property {
  id: string;
  name: string;
  lat: number;
  lng: number;
  basePrice: number;
  marketPrice: number;
  purchasePrice: number | null;
  tier: PropertyTier;
  rentPerDay: number;
}

export interface GameState {
  cash: number;
  day: number;
  totalRentCollected: number;
  properties: Record<string, Property>;
  selectedPropertyId: string | null;
  lastRentAmount: number;
}

export type GameAction =
  | { type: 'SELECT_PROPERTY'; property: Property }
  | { type: 'DESELECT_PROPERTY' }
  | { type: 'BUY_PROPERTY'; propertyId: string }
  | { type: 'SELL_PROPERTY'; propertyId: string }
  | { type: 'UPGRADE_PROPERTY'; propertyId: string }
  | { type: 'SET_PROPERTY_NAME'; propertyId: string; name: string }
  | { type: 'RESET'; state?: GameState }
  | { type: 'TICK' };
