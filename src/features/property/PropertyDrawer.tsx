import type { GameAction, PricePoint, Property } from '../game/gameTypes';
import {
  calcUpgradeCost,
  formatMoney,
  nextTier,
  tierLabel,
} from '../game/propertyUtils';
import styles from './PropertyDrawer.module.css';

interface PropertyDrawerProps {
  property: Property | null;
  cash: number;
  actionsLeft: number;
  phase: 'action' | 'card';
  pendingDiscount: number;
  dispatch: (action: GameAction) => void;
}

const VB_W = 240;
const VB_H = 52;
const PAD = 4;

function aggregateHistory(history: PricePoint[]): PricePoint[] {
  if (history.length <= 16) return history;
  // Bucket into weeks — keep last price of each 7-day window
  const weeks = new Map<number, PricePoint>();
  for (const pt of history) {
    weeks.set(Math.floor((pt.day - 1) / 7), pt);
  }
  return [...weeks.values()];
}

interface SparklineProps {
  history: PricePoint[];
  purchasePrice: number;
}

function Sparkline({ history, purchasePrice }: SparklineProps) {
  const points = aggregateHistory(history);
  if (points.length < 2) return null;

  const prices = points.map(p => p.price);
  const allPrices = [...prices, purchasePrice];
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || purchasePrice * 0.01;

  const toX = (i: number) =>
    PAD + (i / (points.length - 1)) * (VB_W - PAD * 2);
  const toY = (p: number) =>
    VB_H - PAD - ((p - minP) / range) * (VB_H - PAD * 2);

  const last = points[points.length - 1].price;
  const isUp = last >= purchasePrice;
  const lineColor = isUp ? 'var(--cyan-400)' : 'var(--crimson-400)';
  const fillColor = isUp
    ? 'rgba(0,243,255,0.08)'
    : 'rgba(255,42,95,0.08)';

  const linePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(pt.price)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L${toX(points.length - 1)},${VB_H - PAD} L${toX(0)},${VB_H - PAD} Z`;

  const refY = toY(purchasePrice);
  const isWeekly = history.length > 16;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartHeader}>
        <span className={styles.chartLabel}>PRISUTVIKLING</span>
        {isWeekly && <span className={styles.chartScale}>PER UKE</span>}
      </div>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className={styles.chartSvg}
        aria-hidden="true"
      >
        {/* Purchase price reference line */}
        <line
          x1={PAD}
          y1={refY}
          x2={VB_W - PAD}
          y2={refY}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Area fill */}
        <path d={areaPath} fill={fillColor} />
        {/* Price line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Start dot */}
        <circle
          cx={toX(0)}
          cy={toY(points[0].price)}
          r="2"
          fill="rgba(255,255,255,0.35)"
        />
        {/* Current price dot */}
        <circle
          cx={toX(points.length - 1)}
          cy={toY(last)}
          r="3"
          fill={lineColor}
        />
      </svg>
    </div>
  );
}

export function PropertyDrawer({
  property,
  cash,
  actionsLeft,
  phase,
  pendingDiscount,
  dispatch,
}: PropertyDrawerProps) {
  const isOpen = property !== null;
  const isOwned =
    property?.purchasePrice !== null && property?.purchasePrice !== undefined;
  const upgradeCost = property ? calcUpgradeCost(property) : null;
  const next = property ? nextTier(property.tier) : null;

  const hasAp = phase === 'action' && actionsLeft > 0;
  const effectivePrice = property
    ? Math.round(property.marketPrice * (1 - pendingDiscount))
    : 0;

  const canBuy =
    property !== null && !isOwned && cash >= effectivePrice && hasAp;
  const canUpgrade =
    isOwned &&
    upgradeCost !== null &&
    cash >= upgradeCost &&
    next !== null &&
    hasAp;
  const canSell = isOwned && hasAp;

  const priceDelta =
    isOwned && property?.purchasePrice !== null && property?.purchasePrice !== undefined
      ? property.marketPrice - property.purchasePrice
      : null;

  function handleBuy() {
    if (property) dispatch({ type: 'BUY_PROPERTY', propertyId: property.id });
  }
  function handleSell() {
    if (property) dispatch({ type: 'SELL_PROPERTY', propertyId: property.id });
  }
  function handleUpgrade() {
    if (property)
      dispatch({ type: 'UPGRADE_PROPERTY', propertyId: property.id });
  }
  function handleClose() {
    dispatch({ type: 'DESELECT_PROPERTY' });
  }

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`}>
      <div className={`${styles.drawer} ${isOwned ? styles.owned : ''}`}>
        {property && (
          <>
            <div className={styles.header}>
              <div>
                <div className={styles.propertyName}>{property.name}</div>
                <div className={`${styles.tierBadge} ${styles[property.tier]}`}>
                  {tierLabel(property.tier)}
                </div>
                {(property.category || property.address) && (
                  <div className={styles.poiMeta}>
                    {property.category && (
                      <span className={styles.poiCategory}>
                        {property.category}
                      </span>
                    )}
                    {property.address && (
                      <span className={styles.poiAddress}>
                        {property.address}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
              >
                ✕
              </button>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>MARKET PRICE</span>
                <span className={styles.statValue}>
                  {formatMoney(property.marketPrice)}
                </span>
                {priceDelta !== null && (
                  <span
                    className={`${styles.statSub} ${priceDelta >= 0 ? styles.deltaUp : styles.deltaDown}`}
                  >
                    {priceDelta >= 0 ? '+' : ''}
                    {formatMoney(priceDelta)}
                  </span>
                )}
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>RENT / DAY</span>
                <span
                  className={`${styles.statValue} ${isOwned ? styles.rentActive : styles.rentInactive}`}
                >
                  {isOwned ? formatMoney(property.rentPerDay) : '—'}
                </span>
                {isOwned && (
                  <span className={styles.statSub}>{property.tier} yield</span>
                )}
              </div>
            </div>

            {isOwned && property.priceHistory && (
              <Sparkline
                history={property.priceHistory}
                purchasePrice={property.purchasePrice as number}
              />
            )}

            {(property.height !== undefined || property.area !== undefined) && (
              <div className={styles.statsRow}>
                {property.height !== undefined && (
                  <div className={styles.statBlock}>
                    <span className={styles.statLabel}>HEIGHT</span>
                    <span className={styles.statValueSm}>
                      {property.height} m
                    </span>
                  </div>
                )}
                {property.area !== undefined && (
                  <div className={styles.statBlock}>
                    <span className={styles.statLabel}>FOOTPRINT</span>
                    <span className={styles.statValueSm}>
                      {property.area.toLocaleString('no')} m²
                    </span>
                  </div>
                )}
              </div>
            )}

            {upgradeCost !== null && next !== null && (
              <div className={styles.upgradeHint}>
                <span className={styles.upgradeLabel}>UPGRADE PATH</span>
                <span className={styles.upgradePath}>
                  {tierLabel(property.tier)} → {tierLabel(next)}
                </span>
                <span className={styles.upgradeCost}>
                  {formatMoney(upgradeCost)}
                </span>
              </div>
            )}

            <div className={styles.actions}>
              {!isOwned && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnBuy}`}
                  disabled={!canBuy}
                  onClick={handleBuy}
                >
                  BUY{' '}
                  {pendingDiscount > 0 ? (
                    <>
                      <span className={styles.strikePrice}>
                        {formatMoney(property.marketPrice)}
                      </span>{' '}
                      {formatMoney(effectivePrice)}
                    </>
                  ) : (
                    formatMoney(property.marketPrice)
                  )}
                </button>
              )}

              {isOwned && upgradeCost !== null && next !== null && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnUpgrade}`}
                  disabled={!canUpgrade}
                  onClick={handleUpgrade}
                >
                  → {tierLabel(next)} {formatMoney(upgradeCost)}
                </button>
              )}

              {isOwned && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSell}`}
                  disabled={!canSell}
                  onClick={handleSell}
                >
                  SELL {formatMoney(property.marketPrice)}
                </button>
              )}
            </div>

            <div className={styles.cashHint}>
              YOUR CASH:{' '}
              <span className={styles.cashValue}>{formatMoney(cash)}</span>
              {actionsLeft > 0 && phase === 'action' && (
                <span className={styles.apHint}> · {actionsLeft} AP</span>
              )}
              {actionsLeft === 0 && phase === 'action' && (
                <span className={styles.apHintEmpty}> · ingen AP igjen</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
