import type { ReactNode } from 'react';
import type { Modal } from '../../types';
import { Header } from '../header/Header';
import styles from './Layout.module.css';

interface LayoutProps {
  children?: ReactNode;
  onOpenModal: (modal: Modal) => void;
  activeModal: Modal;
  onCloseModal: () => void;
}

export function Layout({ children, onOpenModal }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header onOpenModal={onOpenModal} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
