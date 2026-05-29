import type { GameAction, Property } from '../game/gameTypes';
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
  dispatch: (action: GameAction) => void;
}

export function PropertyDrawer({
  property,
  cash,
  dispatch,
}: PropertyDrawerProps) {
  const isOpen = property !== null;
  const isOwned =
    property?.purchasePrice !== null && property?.purchasePrice !== undefined;
  const upgradeCost = property ? calcUpgradeCost(property) : null;
  const next = property ? nextTier(property.tier) : null;

  const canBuy = property !== null && !isOwned && cash >= property.marketPrice;
  const canUpgrade =
    isOwned && upgradeCost !== null && cash >= upgradeCost && next !== null;

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
                {property.purchasePrice !== null && (
                  <span className={styles.statSub}>
                    {property.marketPrice >= property.purchasePrice ? '+' : ''}
                    {formatMoney(property.marketPrice - property.purchasePrice)}
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
                  BUY {formatMoney(property.marketPrice)}
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
                  onClick={handleSell}
                >
                  SELL {formatMoney(property.marketPrice)}
                </button>
              )}
            </div>

            <div className={styles.cashHint}>
              YOUR CASH:{' '}
              <span className={styles.cashValue}>{formatMoney(cash)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
