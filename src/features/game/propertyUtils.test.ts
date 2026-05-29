import { describe, expect, it } from 'vitest';
import {
  calcRentPerDay,
  calcUpgradeCost,
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

describe('deriveBasePrice', () => {
  it('prices city centre higher than outskirts', () => {
    const centre = deriveBasePrice(59.9139, 10.7522);
    const outskirts = deriveBasePrice(59.85, 10.55);
    expect(centre).toBeGreaterThan(outskirts);
  });

  it('returns a positive rounded value', () => {
    const price = deriveBasePrice(59.9139, 10.7522);
    expect(price).toBeGreaterThan(0);
    expect(price % 100_000).toBe(0);
  });

  it('larger footprint means higher price at same location', () => {
    const small = deriveBasePrice(59.9139, 10.7522, 100, 3.5);
    const large = deriveBasePrice(59.9139, 10.7522, 500, 3.5);
    expect(large).toBeGreaterThan(small);
  });

  it('more floors means proportionally higher price', () => {
    const oneFloor = deriveBasePrice(59.9139, 10.7522, 200, 3.5);
    const threeFloors = deriveBasePrice(59.9139, 10.7522, 200, 10.5);
    expect(threeFloors).toBeCloseTo(oneFloor * 3, -6);
  });

  it('falls back to default GFA when no area/height given', () => {
    const withDefaults = deriveBasePrice(59.9139, 10.7522);
    const explicit200 = deriveBasePrice(59.9139, 10.7522, 200, 3.5); // 200m² × 1 floor
    expect(withDefaults).toBe(explicit200);
  });
});
