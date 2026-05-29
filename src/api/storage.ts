import type { GameState } from '../features/game/gameTypes';

const KEY = 'block-syndicate-v2';

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (typeof parsed.cash !== 'number' || typeof parsed.day !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSave(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, selectedPropertyId: null }));
  } catch {}
}

export function deleteSave(): void {
  localStorage.removeItem(KEY);
}
