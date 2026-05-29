import { useEffect, useRef, useState } from 'react';
import type { Card, CardEffect, GameAction } from '../game/gameTypes';
import { formatMoney } from '../game/propertyUtils';
import styles from './CardModal.module.css';

function effectSummary(effect: CardEffect): string {
  switch (effect.type) {
    case 'market_boost':
      return `Alle priser +${effect.pct}% i ${effect.days} dag${effect.days !== 1 ? 'er' : ''}`;
    case 'market_crash':
      return `Alle priser −${effect.pct}% i ${effect.days} dag${effect.days !== 1 ? 'er' : ''}`;
    case 'tax':
      return `Betal ${effect.pct}% av nettoverdi`;
    case 'discount':
      return `Neste kjøp: ${effect.pct}% rabatt`;
    case 'ap_bonus':
      return `+${effect.ap} handlingspoeng neste dag`;
    case 'fire':
      return `En eid eiendom degraderes`;
    case 'cash':
      return `Motta ${formatMoney(effect.amount)}`;
    case 'rent_boost':
      return `Leie +${effect.pct}% i ${effect.days} dag${effect.days !== 1 ? 'er' : ''}`;
  }
}

interface CardModalProps {
  activeCard: Card | null;
  day: number;
  dispatch: (action: GameAction) => void;
}

export function CardModal({ activeCard, day, dispatch }: CardModalProps) {
  const [flipped, setFlipped] = useState(() => !!activeCard);
  const [showContinue, setShowContinue] = useState(() => !!activeCard);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!activeCard) {
      setFlipped(false);
      setShowContinue(false);
      return;
    }
    const t1 = setTimeout(() => setFlipped(true), 120);
    const t2 = setTimeout(() => setShowContinue(true), 780);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeCard]);

  return (
    <div className={styles.overlay}>
      <p className={styles.phaseLabel}>KORTFASE — DAG {day}</p>

      <div className={styles.cardWrap}>
        <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
          <div className={styles.cardBack}>
            <span className={styles.backMark}>?</span>
          </div>
          <div
            className={`${styles.cardFront} ${activeCard ? styles[activeCard.polarity] : ''}`}
          >
            {activeCard && (
              <>
                <div
                  className={`${styles.cardSymbol} ${styles[activeCard.polarity]}`}
                >
                  {activeCard.polarity === 'positive' ? '+' : '−'}
                </div>
                <div className={styles.cardTitle}>{activeCard.title}</div>
                <p className={styles.cardDesc}>{activeCard.description}</p>
                <div
                  className={`${styles.cardEffect} ${styles[activeCard.polarity]}`}
                >
                  {effectSummary(activeCard.effect)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!activeCard ? (
        <button
          type="button"
          className={styles.btn}
          onClick={() => dispatch({ type: 'DRAW_CARD' })}
        >
          TREKK KORT
        </button>
      ) : showContinue ? (
        <button
          type="button"
          className={`${styles.btn} ${styles.btnContinue}`}
          onClick={() => dispatch({ type: 'DISMISS_CARD' })}
        >
          FORTSETT
        </button>
      ) : (
        <div className={styles.btnPlaceholder} />
      )}
    </div>
  );
}
