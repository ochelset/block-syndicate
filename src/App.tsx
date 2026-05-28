import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { GameMap } from './features/map/GameMap';
import { StartScreen } from './features/start/StartScreen';
import type { Modal, Screen } from './types';

export function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [modal, setModal] = useState<Modal>(null);

  if (screen === 'start') {
    return <StartScreen onStart={() => setScreen('game')} />;
  }

  return (
    <Layout
      onOpenModal={setModal}
      activeModal={modal}
      onCloseModal={() => setModal(null)}
    >
      <GameMap />
    </Layout>
  );
}
