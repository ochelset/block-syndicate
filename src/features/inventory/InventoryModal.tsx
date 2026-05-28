import type { Property } from '../game/gameTypes';
import { formatMoney, tierLabel } from '../game/propertyUtils';
import styles from './InventoryModal.module.css';

interface InventoryModalProps {
  properties: Property[];
  onClose: () => void;
}

export function InventoryModal({ properties, onClose }: InventoryModalProps) {
  const totalRent = properties.reduce((sum, p) => sum + p.rentPerDay, 0);
  const totalValue = properties.reduce((sum, p) => sum + p.marketPrice, 0);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Inventory"
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close inventory"
        onClick={onClose}
      />
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>INVENTORY</div>
            <div className={styles.subtitle}>
              {properties.length}{' '}
              {properties.length === 1 ? 'property' : 'properties'}
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {properties.length === 0 ? (
          <div className={styles.empty}>You don't own any properties yet.</div>
        ) : (
          <>
            <div className={styles.list}>
              {properties.map(p => {
                const gain = p.marketPrice - (p.purchasePrice ?? p.marketPrice);
                const gainPositive = gain >= 0;
                return (
                  <div key={p.id} className={styles.card}>
                    <div className={styles.cardLeft}>
                      <div className={styles.cardName}>{p.name}</div>
                      <div className={`${styles.tierBadge} ${styles[p.tier]}`}>
                        {tierLabel(p.tier)}
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <div className={styles.cardValue}>
                        {formatMoney(p.marketPrice)}
                      </div>
                      <div
                        className={`${styles.cardGain} ${gainPositive ? styles.gainPos : styles.gainNeg}`}
                      >
                        {gainPositive ? '+' : ''}
                        {formatMoney(gain)}
                      </div>
                      <div className={styles.cardRent}>
                        {formatMoney(p.rentPerDay)}
                        <span className={styles.cardRentLabel}>/day</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>PORTFOLIO VALUE</span>
                <span className={styles.summaryValue}>
                  {formatMoney(totalValue)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>TOTAL RENT / DAY</span>
                <span
                  className={`${styles.summaryValue} ${styles.summaryRent}`}
                >
                  {formatMoney(totalRent)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
