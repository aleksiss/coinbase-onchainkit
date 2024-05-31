import { TokenChipReact } from '../types';
import './TokenChip.css';

/**
 * Small button that display a given token symbol and image.
 *
 * WARNING: This component is under development and
 *          may change in the next few weeks.
 */
export function TokenChip({ token, onClick }: TokenChipReact) {
  return (
    <button
      data-testid="ockTokenChip_Button"
      className="token-chip__button"
      onClick={() => onClick?.(token)}
    >
      <img className="token-chip__image" src={token.image || ''} />
      <span className="token-chip__label">{token.symbol}</span>
    </button>
  );
}
