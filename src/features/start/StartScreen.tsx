import { BlockSyndicateLogo } from '../../components/logo/Logo';
import styles from './StartScreen.module.css';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <BlockSyndicateLogo className={styles.logo} width={460} height={110} />
      <p className={styles.tagline}>Claim your territory</p>
      <button type="button" className={styles.startButton} onClick={onStart}>
        Enter
      </button>
    </div>
  );
}
