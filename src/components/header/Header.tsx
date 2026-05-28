import type { Modal } from '../../types';
import { BlockSyndicateLogo } from '../logo/Logo';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenModal: (modal: Modal) => void;
}

export function Header({ onOpenModal }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <BlockSyndicateLogo width={160} height={38} />
      </div>
      <nav className={styles.nav}>
        <button
          type="button"
          className={styles.navLink}
          onClick={() => onOpenModal('inventory')}
        >
          Inventory
        </button>
        <button
          type="button"
          className={styles.navLink}
          onClick={() => onOpenModal('settings')}
        >
          Settings
        </button>
      </nav>
    </header>
  );
}
