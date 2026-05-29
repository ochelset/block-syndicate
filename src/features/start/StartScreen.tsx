import { BlockSyndicateLogo } from '../../components/logo/Logo';
import styles from './StartScreen.module.css';

interface StartScreenProps {
  onStart: () => void;
  onContinue?: () => void;
  savedDay?: number;
}

export function StartScreen({
  onStart,
  onContinue,
  savedDay,
}: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <BlockSyndicateLogo className={styles.logo} width={460} height={110} />
      <p className={styles.tagline}>Claim your territory</p>
      {onContinue ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.continueButton}
            onClick={onContinue}
          >
            Continue{savedDay !== undefined ? ` — Day ${savedDay}` : ''}
          </button>
          <button
            type="button"
            className={styles.newGameButton}
            onClick={onStart}
          >
            New Game
          </button>
        </div>
      ) : (
        <button type="button" className={styles.startButton} onClick={onStart}>
          Enter
        </button>
      )}
    </div>
  );
}
