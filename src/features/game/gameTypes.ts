export type PropertyTier = 'vacant' | 'shop' | 'restaurant';

export interface PricePoint {
  day: number;
  price: number;
}

export interface Property {
  id: string;
  featureId: number | string;
  featureIds?: (number | string)[];
  name: string;
  category?: string;
  address?: string;
  height?: number;
  area?: number;
  lat: number;
  lng: number;
  basePrice: number;
  marketPrice: number;
  purchasePrice: number | null;
  tier: PropertyTier;
  rentPerDay: number;
  neighborhoodMultiplier?: number;
  priceHistory?: PricePoint[];
}

export type CardEffect =
  | { type: 'market_boost'; pct: number; days: number }
  | { type: 'market_crash'; pct: number; days: number }
  | { type: 'tax'; pct: number }
  | { type: 'discount'; pct: number }
  | { type: 'ap_bonus'; ap: number }
  | { type: 'fire' }
  | { type: 'cash'; amount: number }
  | { type: 'rent_boost'; pct: number; days: number };

export interface Card {
  id: string;
  title: string;
  description: string;
  polarity: 'positive' | 'negative';
  effect: CardEffect;
}

export interface ActiveEffect {
  id: string;
  type: 'market_boost' | 'market_crash' | 'rent_boost';
  pct: number;
  daysLeft: number;
}

export interface GameState {
  cash: number;
  day: number;
  totalRentCollected: number;
  properties: Record<string, Property>;
  selectedPropertyId: string | null;
  lastRentAmount: number;
  phase: 'action' | 'card';
  actionsLeft: number;
  deck: Card[];
  discard: Card[];
  cardHand: Card[];
  activeCard: Card | null;
  activeEffects: ActiveEffect[];
  pendingDiscount: number;
  won: boolean;
}

export type GameAction =
  | { type: 'SELECT_PROPERTY'; property: Property }
  | { type: 'DESELECT_PROPERTY' }
  | { type: 'BUY_PROPERTY'; propertyId: string }
  | { type: 'SELL_PROPERTY'; propertyId: string }
  | { type: 'UPGRADE_PROPERTY'; propertyId: string }
  | {
      type: 'SET_PROPERTY_NAME';
      propertyId: string;
      name: string;
      category?: string;
      address?: string;
    }
  | { type: 'END_DAY' }
  | { type: 'DRAW_CARD' }
  | { type: 'SELECT_OFFERED_CARD'; index: number }
  | { type: 'DISMISS_CARD' }
  | { type: 'RESET'; state?: GameState }
  | { type: 'TICK' };
