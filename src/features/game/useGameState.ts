import { useCallback, useEffect, useReducer, useRef } from 'react';
import { reverseGeocode } from '../../api/geocode';
import { writeSave } from '../../api/storage';
import { createDeck, shuffle } from './cardData';
import type {
  ActiveEffect,
  GameAction,
  GameState,
  PricePoint,
  Property,
  PropertyTier,
} from './gameTypes';
import {
  buildProperty,
  calcRentPerDay,
  calcUpgradeCost,
  hashId,
  nextTier,
  tickMarketPrice,
} from './propertyUtils';

const BASE_AP = 3;
export const GOAL_NET_WORTH = 1_000_000_000;
const INITIAL_CASH = 100_000_000;

const defaultState: GameState = {
  cash: INITIAL_CASH,
  day: 1,
  totalRentCollected: 0,
  properties: {},
  selectedPropertyId: null,
  lastRentAmount: 0,
  phase: 'action',
  actionsLeft: BASE_AP,
  deck: createDeck(),
  discard: [],
  activeCard: null,
  activeEffects: [],
  pendingDiscount: 0,
  won: false,
};

function calcNetWorth(
  cash: number,
  properties: Record<string, Property>,
): number {
  return (
    cash +
    Object.values(properties)
      .filter(p => p.purchasePrice !== null)
      .reduce((s, p) => s + p.marketPrice, 0)
  );
}

function applyTick(
  properties: Record<string, Property>,
  activeEffects: ActiveEffect[],
  nextDay: number,
): {
  updatedProps: Record<string, Property>;
  totalRent: number;
  nextEffects: ActiveEffect[];
} {
  const priceMultiplier = activeEffects.reduce((m, e) => {
    if (e.type === 'market_boost') return m * (1 + e.pct / 100);
    if (e.type === 'market_crash') return m * (1 - e.pct / 100);
    return m;
  }, 1);
  const rentMultiplier = activeEffects.reduce((m, e) => {
    if (e.type === 'rent_boost') return m * (1 + e.pct / 100);
    return m;
  }, 1);

  let totalRent = 0;
  const updatedProps: Record<string, Property> = {};
  for (const [id, prop] of Object.entries(properties)) {
    const rawPrice = tickMarketPrice(prop.basePrice, hashId(id), nextDay);
    const newMarketPrice =
      Math.round((rawPrice * priceMultiplier) / 10_000) * 10_000;
    const isOwned = prop.purchasePrice !== null;
    const rent = isOwned
      ? Math.round(calcRentPerDay(newMarketPrice, prop.tier) * rentMultiplier)
      : 0;
    if (isOwned) totalRent += rent;
    const newPoint: PricePoint = { day: nextDay, price: newMarketPrice };
    updatedProps[id] = {
      ...prop,
      marketPrice: newMarketPrice,
      rentPerDay: rent,
      ...(isOwned && {
        priceHistory: [...(prop.priceHistory ?? []), newPoint],
      }),
    };
  }

  const nextEffects = activeEffects
    .map(e => ({ ...e, daysLeft: e.daysLeft - 1 }))
    .filter(e => e.daysLeft > 0);

  return { updatedProps, totalRent, nextEffects };
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_PROPERTY': {
      const existing = state.properties[action.property.id] ?? action.property;
      return {
        ...state,
        selectedPropertyId: action.property.id,
        properties: { ...state.properties, [action.property.id]: existing },
      };
    }

    case 'DESELECT_PROPERTY':
      return { ...state, selectedPropertyId: null };

    case 'BUY_PROPERTY': {
      const prop = state.properties[action.propertyId];
      if (!prop || prop.purchasePrice !== null) return state;
      if (state.phase !== 'action' || state.actionsLeft <= 0) return state;
      const effectivePrice = Math.round(
        prop.marketPrice * (1 - state.pendingDiscount),
      );
      if (state.cash < effectivePrice) return state;
      const updated: Property = {
        ...prop,
        purchasePrice: effectivePrice,
        rentPerDay: calcRentPerDay(prop.marketPrice, prop.tier),
        priceHistory: [{ day: state.day, price: prop.marketPrice }],
      };
      return {
        ...state,
        cash: state.cash - effectivePrice,
        actionsLeft: state.actionsLeft - 1,
        pendingDiscount: 0,
        properties: { ...state.properties, [prop.id]: updated },
      };
    }

    case 'SELL_PROPERTY': {
      const prop = state.properties[action.propertyId];
      if (!prop || prop.purchasePrice === null) return state;
      if (state.phase !== 'action' || state.actionsLeft <= 0) return state;
      const updated: Property = {
        ...prop,
        purchasePrice: null,
        tier: 'vacant',
        rentPerDay: 0,
        priceHistory: undefined,
      };
      return {
        ...state,
        cash: state.cash + prop.marketPrice,
        actionsLeft: state.actionsLeft - 1,
        properties: { ...state.properties, [prop.id]: updated },
      };
    }

    case 'UPGRADE_PROPERTY': {
      const prop = state.properties[action.propertyId];
      if (!prop || prop.purchasePrice === null) return state;
      if (state.phase !== 'action' || state.actionsLeft <= 0) return state;
      const cost = calcUpgradeCost(prop);
      const next = nextTier(prop.tier);
      if (cost === null || next === null || state.cash < cost) return state;
      const updated: Property = {
        ...prop,
        tier: next,
        rentPerDay: calcRentPerDay(prop.marketPrice, next),
      };
      return {
        ...state,
        cash: state.cash - cost,
        actionsLeft: state.actionsLeft - 1,
        properties: { ...state.properties, [prop.id]: updated },
      };
    }

    case 'SET_PROPERTY_NAME': {
      const prop = state.properties[action.propertyId];
      if (!prop) return state;
      return {
        ...state,
        properties: {
          ...state.properties,
          [action.propertyId]: {
            ...prop,
            name: action.name,
            ...(action.category !== undefined && { category: action.category }),
            ...(action.address !== undefined && { address: action.address }),
          },
        },
      };
    }

    case 'END_DAY':
      if (state.phase !== 'action') return state;
      return { ...state, phase: 'card' };

    case 'DRAW_CARD': {
      if (state.phase !== 'card' || state.activeCard !== null) return state;
      let deck = state.deck;
      let discard = state.discard;
      if (deck.length === 0) {
        deck = shuffle([...discard]);
        discard = [];
      }
      const [card, ...remaining] = deck;
      return {
        ...state,
        activeCard: card,
        deck: remaining,
        discard: [...discard, card],
      };
    }

    case 'DISMISS_CARD': {
      const card = state.activeCard;
      if (!card) return state;

      // biome-ignore lint/style/useConst: reassigned in 'cash' and 'tax' switch cases
      let cash = state.cash;
      let properties = state.properties;
      const activeEffects = [...state.activeEffects];
      let pendingDiscount = state.pendingDiscount;
      let bonusAp = 0;

      switch (card.effect.type) {
        case 'cash':
          cash += card.effect.amount;
          break;
        case 'tax': {
          const nw = calcNetWorth(cash, properties);
          cash = Math.max(0, cash - Math.round((nw * card.effect.pct) / 100));
          break;
        }
        case 'market_boost':
          activeEffects.push({
            id: `${card.id}-d${state.day}`,
            type: 'market_boost',
            pct: card.effect.pct,
            daysLeft: card.effect.days,
          });
          break;
        case 'market_crash':
          activeEffects.push({
            id: `${card.id}-d${state.day}`,
            type: 'market_crash',
            pct: card.effect.pct,
            daysLeft: card.effect.days,
          });
          break;
        case 'rent_boost':
          activeEffects.push({
            id: `${card.id}-d${state.day}`,
            type: 'rent_boost',
            pct: card.effect.pct,
            daysLeft: card.effect.days,
          });
          break;
        case 'discount':
          pendingDiscount = card.effect.pct / 100;
          break;
        case 'ap_bonus':
          bonusAp = card.effect.ap;
          break;
        case 'fire': {
          const owned = Object.values(properties).filter(
            p => p.purchasePrice !== null && p.tier !== 'vacant',
          );
          if (owned.length > 0) {
            const target = owned[Math.floor(Math.random() * owned.length)];
            const newTier: PropertyTier =
              target.tier === 'restaurant' ? 'shop' : 'vacant';
            properties = {
              ...properties,
              [target.id]: {
                ...target,
                tier: newTier,
                rentPerDay: calcRentPerDay(target.marketPrice, newTier),
              },
            };
          }
          break;
        }
      }

      const nextDay = state.day + 1;
      const { updatedProps, totalRent, nextEffects } = applyTick(
        properties,
        activeEffects,
        nextDay,
      );

      const newCash = cash + totalRent;
      const won = calcNetWorth(newCash, updatedProps) >= GOAL_NET_WORTH;

      return {
        ...state,
        cash: newCash,
        day: nextDay,
        totalRentCollected: state.totalRentCollected + totalRent,
        lastRentAmount: totalRent,
        properties: updatedProps,
        activeEffects: nextEffects,
        pendingDiscount,
        activeCard: null,
        phase: 'action',
        actionsLeft: BASE_AP + bonusAp,
        won,
      };
    }

    case 'RESET':
      return action.state
        ? {
            ...action.state,
            selectedPropertyId: null,
            activeCard: null,
            phase: 'action',
          }
        : { ...defaultState, deck: createDeck() };

    case 'TICK': {
      const nextDay = state.day + 1;
      const { updatedProps, totalRent, nextEffects } = applyTick(
        state.properties,
        state.activeEffects,
        nextDay,
      );
      return {
        ...state,
        day: nextDay,
        cash: state.cash + totalRent,
        totalRentCollected: state.totalRentCollected + totalRent,
        properties: updatedProps,
        activeEffects: nextEffects,
        lastRentAmount: totalRent,
      };
    }

    default:
      return state;
  }
}

export function useGameState(active = false) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const geocodedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!active) return;
    writeSave(state);
  }, [state, active]);

  const selectBlock = useCallback(
    (
      featureId: number | string,
      rawLat: number,
      rawLng: number,
      height?: number,
      area?: number,
      featureIds?: (number | string)[],
    ) => {
      const id = String(featureId);
      const property = buildProperty(featureId, rawLat, rawLng, height, area, featureIds);
      dispatch({ type: 'SELECT_PROPERTY', property });

      if (!geocodedIds.current.has(id)) {
        geocodedIds.current.add(id);
        const token = import.meta.env.VITE_MAPBOX_TOKEN as string;
        reverseGeocode(property.lat, property.lng, token).then(info => {
          if (info)
            dispatch({
              type: 'SET_PROPERTY_NAME',
              propertyId: id,
              name: info.name,
              category: info.category,
              address: info.address,
            });
        });
      }
    },
    [],
  );

  const netWorth =
    state.cash +
    Object.values(state.properties)
      .filter(p => p.purchasePrice !== null)
      .reduce((sum, p) => sum + p.marketPrice, 0);

  return { state, dispatch, selectBlock, netWorth };
}
