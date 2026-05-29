import { useState } from 'react';
import styles from './App.module.css';
import { deleteSave, loadSave } from './api/storage';
import { Layout } from './components/layout/Layout';
import { CardModal } from './features/card/CardModal';
import { formatMoney } from './features/game/propertyUtils';
import { useGameState } from './features/game/useGameState';
import { HUD } from './features/hud/HUD';
import { InventoryModal } from './features/inventory/InventoryModal';
import { GameMap } from './features/map/GameMap';
import { PropertyDrawer } from './features/property/PropertyDrawer';
import { StartScreen } from './features/start/StartScreen';
import type { Modal, Screen } from './types';

export function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [modal, setModal] = useState<Modal>(null);
  const [savedGame] = useState(() => loadSave());
  const { state, dispatch, selectBlock, netWorth } = useGameState(
    screen === 'game',
  );

  const ownedProperties = Object.values(state.properties).filter(
    p => p.purchasePrice !== null,
  );

  const selectedProperty = state.selectedPropertyId
    ? (state.properties[state.selectedPropertyId] ?? null)
    : null;

  function handleNewGame() {
    deleteSave();
    dispatch({ type: 'RESET' });
    setScreen('game');
  }

  function handleContinue() {
    if (savedGame) dispatch({ type: 'RESET', state: savedGame });
    setScreen('game');
  }

  if (screen === 'start') {
    return (
      <StartScreen
        onStart={handleNewGame}
        onContinue={savedGame ? handleContinue : undefined}
        savedDay={savedGame?.day}
      />
    );
  }

  return (
    <>
      <Layout
        onOpenModal={setModal}
        activeModal={modal}
        onCloseModal={() => setModal(null)}
      >
        <GameMap
          onBlockClick={selectBlock}
          ownedProperties={ownedProperties}
          selectedFeatureIds={
            selectedProperty
              ? (selectedProperty.featureIds ?? [selectedProperty.featureId])
              : []
          }
        />
      </Layout>
      <HUD
        cash={state.cash}
        netWorth={netWorth}
        day={state.day}
        rentAmount={state.lastRentAmount}
        actionsLeft={state.actionsLeft}
        phase={state.phase}
        onEndDay={() => dispatch({ type: 'END_DAY' })}
      />
      <PropertyDrawer
        property={selectedProperty}
        cash={state.cash}
        actionsLeft={state.actionsLeft}
        phase={state.phase}
        pendingDiscount={state.pendingDiscount}
        dispatch={dispatch}
      />
      {state.phase === 'card' && (
        <CardModal
          activeCard={state.activeCard}
          day={state.day}
          dispatch={dispatch}
        />
      )}
      {modal === 'inventory' && (
        <InventoryModal
          properties={ownedProperties}
          onClose={() => setModal(null)}
        />
      )}
      {state.won && (
        <div className={styles.victory}>
          <div className={styles.victoryBox}>
            <div className={styles.victoryTitle}>SYNDIKAT VUNNET</div>
            <p className={styles.victorySub}>
              DAG {state.day} · {formatMoney(netWorth)} NETTOVERDI
            </p>
            <button
              type="button"
              className={styles.victoryBtn}
              onClick={handleNewGame}
            >
              NY RUNDE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
