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

const FAN = [
  { tx: -90, ty: 16, rot: -12 },
  { tx: 0, ty: 0, rot: 0 },
  { tx: 90, ty: 16, rot: 12 },
] as const;

function cardStyle(
  index: number,
  hovered: number | null,
  selected: number | null,
  postSelect: boolean,
  mounted: boolean,
): React.CSSProperties {
  if (!mounted) {
    return { opacity: 0, transform: 'translateY(30px) scale(0.96)' };
  }

  const b = FAN[index];
  const isSelected = index === selected;

  if (selected === null) {
    const lift = hovered === index ? -12 : 0;
    return {
      transform: `translateX(${b.tx}px) translateY(${b.ty + lift}px) rotate(${b.rot}deg)`,
      zIndex: index === 1 ? 2 : 1,
      cursor: 'pointer',
    };
  }

  if (isSelected) {
    return {
      transform: 'translateX(0) translateY(-10px) rotate(0deg)',
      zIndex: 10,
      cursor: postSelect ? 'default' : 'pointer',
    };
  }

  return {
    transform: `translateX(${b.tx}px) translateY(${b.ty + (postSelect ? 50 : 22)}px) rotate(${b.rot}deg)`,
    opacity: postSelect ? 0 : 0.28,
    filter: postSelect ? 'none' : 'saturate(0)',
    zIndex: 1,
    pointerEvents: 'none',
    cursor: 'default',
  };
}

interface CardModalProps {
  cardHand: Card[];
  activeCard: Card | null;
  day: number;
  dispatch: (action: GameAction) => void;
}

export function CardModal({ cardHand, activeCard, day, dispatch }: CardModalProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [postSelect, setPostSelect] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entryDone, setEntryDone] = useState(false);
  const handKey = useRef('');

  // Auto-deal when entering card phase
  useEffect(() => {
    if (cardHand.length > 0 || activeCard) return;
    const t = setTimeout(() => dispatch({ type: 'DRAW_CARD' }), 220);
    return () => clearTimeout(t);
  }, [cardHand.length, activeCard, dispatch]);

  // Animate cards into fan when hand arrives
  useEffect(() => {
    const key = cardHand.map(c => c.id).join(',');
    if (key === handKey.current || cardHand.length === 0) return;
    handKey.current = key;
    setMounted(false);
    setSelected(null);
    setPostSelect(false);
    setFlipped(false);
    setShowContinue(false);
    setEntryDone(false);
    const t1 = setTimeout(() => setMounted(true), 16);
    const t2 = setTimeout(() => setEntryDone(true), 16 + 3 * 70 + 420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cardHand]);

  // Flip reveal after VELG
  useEffect(() => {
    if (!activeCard) return;
    const t1 = setTimeout(() => setFlipped(true), 150);
    const t2 = setTimeout(() => setShowContinue(true), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeCard]);

  function handleCardClick(index: number) {
    if (postSelect) return;
    setSelected(prev => (prev === index ? null : index));
    setHovered(null);
  }

  function handleVelg() {
    if (selected === null) return;
    setPostSelect(true);
    dispatch({ type: 'SELECT_OFFERED_CARD', index: selected });
  }

  const delay = (i: number) =>
    entryDone ? '0ms' : `${16 + i * 70}ms`;

  return (
    <div className={styles.overlay}>
      <p className={styles.phaseLabel}>KORTFASE — DAG {day}</p>

      <div className={styles.fanContainer}>
        {cardHand.map((card, i) => (
          <div
            key={card.id}
            className={styles.fanCard}
            style={{ ...cardStyle(i, hovered, selected, postSelect, mounted), transitionDelay: delay(i) }}
            onClick={() => handleCardClick(i)}
            onMouseEnter={() => { if (!postSelect && selected === null) setHovered(i); }}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className={`${styles.fanCardInner} ${postSelect && selected === i && flipped ? styles.flipped : ''}`}
            >
              <div className={styles.cardBack}>
                <span className={styles.backMark}>?</span>
              </div>
              <div
                className={`${styles.cardFront} ${activeCard && selected === i ? styles[activeCard.polarity] : ''}`}
              >
                {activeCard && selected === i && (
                  <>
                    <div className={`${styles.cardSymbol} ${styles[activeCard.polarity]}`}>
                      {activeCard.polarity === 'positive' ? '+' : '−'}
                    </div>
                    <div className={styles.cardTitle}>{activeCard.title}</div>
                    <p className={styles.cardDesc}>{activeCard.description}</p>
                    <div className={`${styles.cardEffect} ${styles[activeCard.polarity]}`}>
                      {effectSummary(activeCard.effect)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {!postSelect && selected === null && (
              <div className={`${styles.cardHoverHint} ${hovered === i ? styles.cardHoverHintVisible : ''}`}>
                VELG
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.btnArea}>
        {!postSelect && selected !== null && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnVelg}`}
            onClick={handleVelg}
          >
            VELG DETTE KORTET
          </button>
        )}
        {postSelect && showContinue && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnContinue}`}
            onClick={() => dispatch({ type: 'DISMISS_CARD' })}
          >
            FORTSETT
          </button>
        )}
        {((cardHand.length === 0) || (!postSelect && selected === null) || (postSelect && !showContinue)) && (
          <div className={styles.btnPlaceholder} />
        )}
      </div>
    </div>
  );
}
