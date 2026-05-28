import { formatMoney } from '../game/propertyUtils';
import styles from './HUD.module.css';

interface HUDProps {
  cash: number;
  netWorth: number;
  day: number;
  rentAmount: number;
}

export function HUD({ cash, netWorth, day, rentAmount }: HUDProps) {
  const goalProgress = Math.min(netWorth / 1_000_000_000, 1);

  return (
    <div className={styles.hud}>
      <div className={styles.bar}>
        <div className={styles.stat}>
          <span className={styles.label}>CASH</span>
          <span className={styles.valueCash}>{formatMoney(cash)}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.label}>NET WORTH</span>
          <span className={styles.valueNet}>{formatMoney(netWorth)}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.label}>DAY</span>
          <span className={styles.valueDay}>{day}</span>
        </div>
      </div>
      <div className={styles.goalTrack}>
        <div
          className={styles.goalFill}
          style={{ width: `${goalProgress * 100}%` }}
        />
        <span className={styles.goalLabel}>
          GOAL $1B — {(goalProgress * 100).toFixed(1)}%
        </span>
      </div>
      {rentAmount > 0 && (
        <div key={day} className={styles.rentToast}>
          +{formatMoney(rentAmount)}/day
        </div>
      )}
    </div>
  );
}
