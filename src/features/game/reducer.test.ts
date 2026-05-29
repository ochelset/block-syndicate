import { describe, expect, it } from 'vitest';
import type { Card, GameState, Property } from './gameTypes';
import { reducer } from './useGameState';

const DUMMY_CARD: Card = {
  id: 'test-card',
  title: 'Test',
  description: 'Test card',
  polarity: 'positive',
  effect: { type: 'cash', amount: 1_000_000 },
};

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'test-id',
    featureId: 1234,
    name: 'Test Block',
    lat: 59.9139,
    lng: 10.7522,
    basePrice: 1_000_000,
    marketPrice: 1_000_000,
    purchasePrice: null,
    tier: 'vacant',
    rentPerDay: 0,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    cash: 10_000_000,
    day: 1,
    totalRentCollected: 0,
    properties: {},
    selectedPropertyId: null,
    lastRentAmount: 0,
    phase: 'action',
    actionsLeft: 3,
    deck: [DUMMY_CARD, DUMMY_CARD, DUMMY_CARD],
    discard: [],
    cardHand: [],
    activeCard: null,
    activeEffects: [],
    pendingDiscount: 0,
    won: false,
    ...overrides,
  };
}

describe('SELECT_PROPERTY', () => {
  it('adds a new property and sets selectedPropertyId', () => {
    const prop = makeProperty();
    const state = reducer(makeState(), {
      type: 'SELECT_PROPERTY',
      property: prop,
    });
    expect(state.selectedPropertyId).toBe('test-id');
    expect(state.properties['test-id']).toEqual(prop);
  });

  it('preserves existing property data when re-selecting', () => {
    const owned = makeProperty({ purchasePrice: 900_000 });
    const state = makeState({ properties: { 'test-id': owned } });
    const next = reducer(state, {
      type: 'SELECT_PROPERTY',
      property: makeProperty(),
    });
    expect(next.properties['test-id'].purchasePrice).toBe(900_000);
  });
});

describe('BUY_PROPERTY', () => {
  it('deducts cash, sets purchasePrice, and decrements AP', () => {
    const prop = makeProperty({ marketPrice: 1_000_000 });
    const state = makeState({
      cash: 5_000_000,
      properties: { 'test-id': prop },
    });
    const next = reducer(state, {
      type: 'BUY_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next.cash).toBe(4_000_000);
    expect(next.properties['test-id'].purchasePrice).toBe(1_000_000);
    expect(next.properties['test-id'].rentPerDay).toBeGreaterThan(0);
    expect(next.actionsLeft).toBe(2);
  });

  it('applies pendingDiscount and clears it', () => {
    const prop = makeProperty({ marketPrice: 1_000_000 });
    const state = makeState({
      cash: 5_000_000,
      properties: { 'test-id': prop },
      pendingDiscount: 0.5,
    });
    const next = reducer(state, {
      type: 'BUY_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next.cash).toBe(4_500_000);
    expect(next.properties['test-id'].purchasePrice).toBe(500_000);
    expect(next.pendingDiscount).toBe(0);
  });

  it('is a no-op when cash is insufficient', () => {
    const prop = makeProperty({ marketPrice: 1_000_000 });
    const state = makeState({ cash: 500_000, properties: { 'test-id': prop } });
    expect(
      reducer(state, { type: 'BUY_PROPERTY', propertyId: 'test-id' }),
    ).toBe(state);
  });

  it('is a no-op when AP is exhausted', () => {
    const prop = makeProperty({ marketPrice: 1_000_000 });
    const state = makeState({
      cash: 5_000_000,
      actionsLeft: 0,
      properties: { 'test-id': prop },
    });
    expect(
      reducer(state, { type: 'BUY_PROPERTY', propertyId: 'test-id' }),
    ).toBe(state);
  });

  it('is a no-op during card phase', () => {
    const prop = makeProperty({ marketPrice: 1_000_000 });
    const state = makeState({
      cash: 5_000_000,
      phase: 'card',
      properties: { 'test-id': prop },
    });
    expect(
      reducer(state, { type: 'BUY_PROPERTY', propertyId: 'test-id' }),
    ).toBe(state);
  });
});

describe('SELL_PROPERTY', () => {
  it('returns marketPrice to cash, resets to vacant, and decrements AP', () => {
    const prop = makeProperty({
      purchasePrice: 900_000,
      marketPrice: 1_100_000,
      tier: 'shop',
      rentPerDay: 27_500,
    });
    const state = makeState({ cash: 0, properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'SELL_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next.cash).toBe(1_100_000);
    expect(next.properties['test-id'].purchasePrice).toBeNull();
    expect(next.properties['test-id'].tier).toBe('vacant');
    expect(next.properties['test-id'].rentPerDay).toBe(0);
    expect(next.actionsLeft).toBe(2);
  });

  it('is a no-op for an unowned property', () => {
    const prop = makeProperty();
    const state = makeState({ properties: { 'test-id': prop } });
    expect(
      reducer(state, { type: 'SELL_PROPERTY', propertyId: 'test-id' }),
    ).toBe(state);
  });
});

describe('UPGRADE_PROPERTY', () => {
  it('deducts cost, advances tier, recalculates rent, and decrements AP', () => {
    const prop = makeProperty({
      purchasePrice: 1_000_000,
      tier: 'vacant',
      basePrice: 1_000_000,
      marketPrice: 1_000_000,
    });
    const state = makeState({
      cash: 5_000_000,
      properties: { 'test-id': prop },
    });
    const next = reducer(state, {
      type: 'UPGRADE_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next.cash).toBe(3_000_000);
    expect(next.properties['test-id'].tier).toBe('shop');
    expect(next.actionsLeft).toBe(2);
  });

  it('is a no-op when cash is insufficient', () => {
    const prop = makeProperty({
      purchasePrice: 1_000_000,
      basePrice: 1_000_000,
    });
    const state = makeState({ cash: 0, properties: { 'test-id': prop } });
    expect(
      reducer(state, { type: 'UPGRADE_PROPERTY', propertyId: 'test-id' }),
    ).toBe(state);
  });

  it('is a no-op at max tier (restaurant)', () => {
    const prop = makeProperty({ purchasePrice: 1_000_000, tier: 'restaurant' });
    const state = makeState({ properties: { 'test-id': prop } });
    expect(
      reducer(state, { type: 'UPGRADE_PROPERTY', propertyId: 'test-id' }),
    ).toBe(state);
  });
});

describe('SET_PROPERTY_NAME', () => {
  it('updates the name of an existing property', () => {
    const prop = makeProperty({ name: 'Generated Name' });
    const state = makeState({ properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'SET_PROPERTY_NAME',
      propertyId: 'test-id',
      name: 'Stortingsgata 6',
    });
    expect(next.properties['test-id'].name).toBe('Stortingsgata 6');
  });

  it('is a no-op for unknown propertyId', () => {
    const state = makeState();
    expect(
      reducer(state, {
        type: 'SET_PROPERTY_NAME',
        propertyId: 'ghost',
        name: 'X',
      }),
    ).toBe(state);
  });
});

describe('END_DAY', () => {
  it('transitions phase to card', () => {
    const state = makeState({ phase: 'action' });
    expect(reducer(state, { type: 'END_DAY' }).phase).toBe('card');
  });

  it('is a no-op when already in card phase', () => {
    const state = makeState({ phase: 'card' });
    expect(reducer(state, { type: 'END_DAY' })).toBe(state);
  });
});

describe('DRAW_CARD', () => {
  it('deals 3 cards into cardHand from the deck', () => {
    const c1 = { ...DUMMY_CARD, id: 'c1' };
    const c2 = { ...DUMMY_CARD, id: 'c2' };
    const c3 = { ...DUMMY_CARD, id: 'c3' };
    const state = makeState({ phase: 'card', deck: [c1, c2, c3], cardHand: [] });
    const next = reducer(state, { type: 'DRAW_CARD' });
    expect(next.cardHand).toHaveLength(3);
    expect(next.deck).toHaveLength(0);
    expect(next.discard).toHaveLength(3);
  });

  it('reshuffles discard into deck when fewer than 3 cards remain', () => {
    const c1 = { ...DUMMY_CARD, id: 'c1' };
    const c2 = { ...DUMMY_CARD, id: 'c2' };
    const c3 = { ...DUMMY_CARD, id: 'c3' };
    const state = makeState({
      phase: 'card',
      deck: [c1],
      discard: [c2, c3],
      cardHand: [],
    });
    const next = reducer(state, { type: 'DRAW_CARD' });
    expect(next.cardHand).toHaveLength(3);
  });

  it('is a no-op when cardHand already has cards', () => {
    const state = makeState({ phase: 'card', cardHand: [DUMMY_CARD, DUMMY_CARD, DUMMY_CARD] });
    expect(reducer(state, { type: 'DRAW_CARD' })).toBe(state);
  });
});

describe('DISMISS_CARD', () => {
  it('advances the day, resets phase and AP', () => {
    const state = makeState({ phase: 'card', activeCard: DUMMY_CARD, day: 3 });
    const next = reducer(state, { type: 'DISMISS_CARD' });
    expect(next.day).toBe(4);
    expect(next.phase).toBe('action');
    expect(next.actionsLeft).toBe(3);
    expect(next.activeCard).toBeNull();
  });

  it('cash effect adds to cash before tick', () => {
    const state = makeState({
      cash: 5_000_000,
      phase: 'card',
      activeCard: DUMMY_CARD,
    });
    const next = reducer(state, { type: 'DISMISS_CARD' });
    expect(next.cash).toBeGreaterThan(5_000_000);
  });

  it('ap_bonus card gives extra AP next day', () => {
    const apCard: Card = {
      ...DUMMY_CARD,
      effect: { type: 'ap_bonus', ap: 2 },
    };
    const state = makeState({ phase: 'card', activeCard: apCard });
    const next = reducer(state, { type: 'DISMISS_CARD' });
    expect(next.actionsLeft).toBe(5);
  });

  it('is a no-op when activeCard is null', () => {
    const state = makeState({ phase: 'card', activeCard: null });
    expect(reducer(state, { type: 'DISMISS_CARD' })).toBe(state);
  });
});

describe('TICK', () => {
  it('increments the day', () => {
    const state = makeState({ day: 3 });
    expect(reducer(state, { type: 'TICK' }).day).toBe(4);
  });

  it('collects rent only from owned properties', () => {
    const owned = makeProperty({
      id: 'owned',
      purchasePrice: 1_000_000,
      marketPrice: 1_000_000,
      tier: 'shop',
      rentPerDay: 25_000,
    });
    const unowned = makeProperty({
      id: 'free',
      purchasePrice: null,
      rentPerDay: 0,
    });
    const state = makeState({
      cash: 0,
      properties: { owned, free: unowned },
    });
    const next = reducer(state, { type: 'TICK' });
    expect(next.cash).toBeGreaterThan(0);
    expect(next.totalRentCollected).toBeGreaterThan(0);
    expect(next.lastRentAmount).toBeGreaterThan(0);
  });

  it('adds zero rent when no properties are owned', () => {
    const state = makeState({ cash: 1_000_000 });
    const next = reducer(state, { type: 'TICK' });
    expect(next.cash).toBe(1_000_000);
    expect(next.lastRentAmount).toBe(0);
  });
});

describe('DESELECT_PROPERTY', () => {
  it('clears selectedPropertyId', () => {
    const state = makeState({ selectedPropertyId: 'test-id' });
    expect(
      reducer(state, { type: 'DESELECT_PROPERTY' }).selectedPropertyId,
    ).toBeNull();
  });
});

describe('RESET', () => {
  it('resets to default state when no state is provided', () => {
    const state = makeState({ cash: 0, day: 99 });
    const next = reducer(state, { type: 'RESET' });
    expect(next.cash).toBe(100_000_000);
    expect(next.day).toBe(1);
    expect(next.properties).toEqual({});
    expect(next.phase).toBe('action');
    expect(next.actionsLeft).toBe(3);
  });

  it('restores provided state and clears selectedPropertyId and activeCard', () => {
    const saved = makeState({
      cash: 5_000_000,
      day: 14,
      selectedPropertyId: 'old',
      activeCard: DUMMY_CARD,
    });
    const next = reducer(makeState(), { type: 'RESET', state: saved });
    expect(next.cash).toBe(5_000_000);
    expect(next.day).toBe(14);
    expect(next.selectedPropertyId).toBeNull();
    expect(next.activeCard).toBeNull();
    expect(next.phase).toBe('action');
  });
});
