import { describe, expect, it } from 'vitest';
import {
  calcRentPerDay,
  calcUpgradeCost,
  coordsToId,
  deriveBasePrice,
  formatMoney,
  nextTier,
  tierLabel,
} from './propertyUtils';

describe('formatMoney', () => {
  it('formats sub-1K values', () => {
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(500)).toBe('$500');
    expect(formatMoney(999)).toBe('$999');
  });

  it('formats thousands', () => {
    expect(formatMoney(1_000)).toBe('$1K');
    expect(formatMoney(1_500)).toBe('$2K');
    expect(formatMoney(999_999)).toBe('$1000K');
  });

  it('formats millions with 2 decimals under 10M', () => {
    expect(formatMoney(1_000_000)).toBe('$1.00M');
    expect(formatMoney(1_500_000)).toBe('$1.50M');
    expect(formatMoney(9_990_000)).toBe('$9.99M');
  });

  it('formats millions with 1 decimal at 10M+', () => {
    expect(formatMoney(10_000_000)).toBe('$10.0M');
    expect(formatMoney(123_400_000)).toBe('$123.4M');
  });

  it('formats billions', () => {
    expect(formatMoney(1_000_000_000)).toBe('$1.00B');
    expect(formatMoney(2_500_000_000)).toBe('$2.50B');
  });

  it('handles negative values', () => {
    expect(formatMoney(-500)).toBe('-$500');
    expect(formatMoney(-1_500_000)).toBe('-$1.50M');
  });
});

describe('calcRentPerDay', () => {
  it('returns 0.5% of market price for vacant', () => {
    expect(calcRentPerDay(1_000_000, 'vacant')).toBe(5_000);
  });

  it('returns 2.5% of market price for shop', () => {
    expect(calcRentPerDay(1_000_000, 'shop')).toBe(25_000);
  });

  it('returns 7% of market price for restaurant', () => {
    expect(calcRentPerDay(1_000_000, 'restaurant')).toBe(70_000);
  });
});

describe('calcUpgradeCost', () => {
  const base = { basePrice: 1_000_000 } as Parameters<
    typeof calcUpgradeCost
  >[0];

  it('returns 2× basePrice for vacant → shop', () => {
    expect(calcUpgradeCost({ ...base, tier: 'vacant' })).toBe(2_000_000);
  });

  it('returns 3.5× basePrice for shop → restaurant', () => {
    expect(calcUpgradeCost({ ...base, tier: 'shop' })).toBe(3_500_000);
  });

  it('returns null for restaurant (max tier)', () => {
    expect(calcUpgradeCost({ ...base, tier: 'restaurant' })).toBeNull();
  });
});

describe('nextTier', () => {
  it('vacant → shop', () => expect(nextTier('vacant')).toBe('shop'));
  it('shop → restaurant', () => expect(nextTier('shop')).toBe('restaurant'));
  it('restaurant → null', () => expect(nextTier('restaurant')).toBeNull());
});

describe('tierLabel', () => {
  it('returns human-readable labels', () => {
    expect(tierLabel('vacant')).toBe('VACANT LOT');
    expect(tierLabel('shop')).toBe('SHOP');
    expect(tierLabel('restaurant')).toBe('RESTAURANT');
  });
});

describe('coordsToId', () => {
  it('produces the same ID for the same coordinates', () => {
    expect(coordsToId(59.9139, 10.7522)).toBe(coordsToId(59.9139, 10.7522));
  });

  it('snaps nearby coordinates to the same ID', () => {
    // 1/3000 degree ≈ 37m — coords within snapping grid should match
    const id1 = coordsToId(59.9139, 10.7522);
    const id2 = coordsToId(59.91391, 10.75221);
    expect(id1).toBe(id2);
  });

  it('produces different IDs for coordinates in different grid cells', () => {
    const id1 = coordsToId(59.9, 10.7);
    const id2 = coordsToId(59.91, 10.71);
    expect(id1).not.toBe(id2);
  });
});

describe('deriveBasePrice', () => {
  it('prices city centre higher than outskirts', () => {
    const centre = deriveBasePrice(59.9139, 10.7522); // Oslo S
    const outskirts = deriveBasePrice(59.85, 10.55);
    expect(centre).toBeGreaterThan(outskirts);
  });

  it('returns a positive rounded value', () => {
    const price = deriveBasePrice(59.9139, 10.7522);
    expect(price).toBeGreaterThan(0);
    expect(price % 100_000).toBe(0);
  });
});
