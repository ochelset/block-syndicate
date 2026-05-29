import { useCallback, useEffect, useReducer, useRef } from 'react';
import { reverseGeocode } from '../../api/geocode';
import { writeSave } from '../../api/storage';
import type { GameAction, GameState, Property } from './gameTypes';
import {
  buildProperty,
  calcRentPerDay,
  calcUpgradeCost,
  hashId,
  nextTier,
  tickMarketPrice,
} from './propertyUtils';

export const TICK_MS = 3000;
const INITIAL_CASH = 100_000_000;

const defaultState: GameState = {
  cash: INITIAL_CASH,
  day: 1,
  totalRentCollected: 0,
  properties: {},
  selectedPropertyId: null,
  lastRentAmount: 0,
};

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
      if (!prop || prop.purchasePrice !== null || state.cash < prop.marketPrice)
        return state;
      const updated: Property = {
        ...prop,
        purchasePrice: prop.marketPrice,
        rentPerDay: calcRentPerDay(prop.marketPrice, prop.tier),
      };
      return {
        ...state,
        cash: state.cash - prop.marketPrice,
        properties: { ...state.properties, [prop.id]: updated },
      };
    }

    case 'SELL_PROPERTY': {
      const prop = state.properties[action.propertyId];
      if (!prop || prop.purchasePrice === null) return state;
      const updated: Property = {
        ...prop,
        purchasePrice: null,
        tier: 'vacant',
        rentPerDay: 0,
      };
      return {
        ...state,
        cash: state.cash + prop.marketPrice,
        properties: { ...state.properties, [prop.id]: updated },
      };
    }

    case 'UPGRADE_PROPERTY': {
      const prop = state.properties[action.propertyId];
      if (!prop || prop.purchasePrice === null) return state;
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
          [action.propertyId]: { ...prop, name: action.name },
        },
      };
    }

    case 'RESET':
      return action.state
        ? { ...action.state, selectedPropertyId: null }
        : { ...defaultState };

    case 'TICK': {
      let totalRent = 0;
      const updatedProps: Record<string, Property> = {};
      const nextDay = state.day + 1;

      for (const [id, prop] of Object.entries(state.properties)) {
        const newMarketPrice = tickMarketPrice(
          prop.basePrice,
          hashId(id),
          nextDay,
        );
        const isOwned = prop.purchasePrice !== null;
        const rent = isOwned ? calcRentPerDay(newMarketPrice, prop.tier) : 0;
        if (isOwned) totalRent += rent;
        updatedProps[id] = {
          ...prop,
          marketPrice: newMarketPrice,
          rentPerDay: rent,
        };
      }

      return {
        ...state,
        day: nextDay,
        cash: state.cash + totalRent,
        totalRentCollected: state.totalRentCollected + totalRent,
        properties: updatedProps,
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
    const id = setInterval(() => dispatch({ type: 'TICK' }), TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  // Auto-save on every state change; selectedPropertyId is ephemeral
  useEffect(() => {
    if (!active) return;
    writeSave(state);
  }, [state, active]);

  const selectBlock = useCallback(
    (featureId: number | string, rawLat: number, rawLng: number) => {
      const id = String(featureId);
      const property = buildProperty(featureId, rawLat, rawLng);
      dispatch({ type: 'SELECT_PROPERTY', property });

      if (!geocodedIds.current.has(id)) {
        geocodedIds.current.add(id);
        const token = import.meta.env.VITE_MAPBOX_TOKEN as string;
        reverseGeocode(property.lat, property.lng, token).then(name => {
          if (name)
            dispatch({ type: 'SET_PROPERTY_NAME', propertyId: id, name });
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
