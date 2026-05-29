import { formatMoney } from '../game/propertyUtils';
import { GOAL_NET_WORTH } from '../game/useGameState';
import styles from './HUD.module.css';

interface HUDProps {
  cash: number;
  netWorth: number;
  day: number;
  rentAmount: number;
  actionsLeft: number;
  phase: 'action' | 'card';
  onEndDay: () => void;
}

export function HUD({
  cash,
  netWorth,
  day,
  rentAmount,
  actionsLeft,
  phase,
  onEndDay,
}: HUDProps) {
  const goalProgress = Math.min(netWorth / GOAL_NET_WORTH, 1);

  return (
    <div className={styles.hud}>
      <div className={styles.apRow}>
        <div className={styles.apDots}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`${styles.apDot} ${i < Math.min(actionsLeft, 3) ? styles.apDotFull : ''}`}
            />
          ))}
          {actionsLeft > 3 && (
            <span className={styles.apBonus}>+{actionsLeft - 3}</span>
          )}
        </div>
        <button
          type="button"
          className={styles.endDayBtn}
          onClick={onEndDay}
          disabled={phase !== 'action'}
        >
          AVSLUTT DAG
        </button>
      </div>
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
