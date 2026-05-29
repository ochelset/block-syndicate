import { describe, expect, it } from 'vitest';
import type { GameState, Property } from './gameTypes';
import { reducer } from './useGameState';

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'test-id',
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
  it('deducts cash and sets purchasePrice', () => {
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
  });

  it('is a no-op when cash is insufficient', () => {
    const prop = makeProperty({ marketPrice: 1_000_000 });
    const state = makeState({ cash: 500_000, properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'BUY_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next).toBe(state);
  });

  it('is a no-op when property is already owned', () => {
    const prop = makeProperty({ purchasePrice: 900_000 });
    const state = makeState({ properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'BUY_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next).toBe(state);
  });

  it('is a no-op for unknown propertyId', () => {
    const state = makeState();
    const next = reducer(state, { type: 'BUY_PROPERTY', propertyId: 'ghost' });
    expect(next).toBe(state);
  });
});

describe('SELL_PROPERTY', () => {
  it('returns marketPrice to cash and resets property to vacant', () => {
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
  });

  it('is a no-op for an unowned property', () => {
    const prop = makeProperty();
    const state = makeState({ properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'SELL_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next).toBe(state);
  });
});

describe('UPGRADE_PROPERTY', () => {
  it('deducts cost, advances tier, and recalculates rent', () => {
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
    expect(next.cash).toBe(3_000_000); // 5M - 2× basePrice
    expect(next.properties['test-id'].tier).toBe('shop');
  });

  it('is a no-op when cash is insufficient', () => {
    const prop = makeProperty({
      purchasePrice: 1_000_000,
      basePrice: 1_000_000,
    });
    const state = makeState({ cash: 0, properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'UPGRADE_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next).toBe(state);
  });

  it('is a no-op at max tier (restaurant)', () => {
    const prop = makeProperty({ purchasePrice: 1_000_000, tier: 'restaurant' });
    const state = makeState({ properties: { 'test-id': prop } });
    const next = reducer(state, {
      type: 'UPGRADE_PROPERTY',
      propertyId: 'test-id',
    });
    expect(next).toBe(state);
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
    const next = reducer(state, {
      type: 'SET_PROPERTY_NAME',
      propertyId: 'ghost',
      name: 'Anywhere',
    });
    expect(next).toBe(state);
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
    const next = reducer(state, { type: 'DESELECT_PROPERTY' });
    expect(next.selectedPropertyId).toBeNull();
  });
});
