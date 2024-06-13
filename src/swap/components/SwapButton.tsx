import { useCallback, useContext } from 'react';
import { cn } from '../../lib/utils';
import { buildSwapTransaction } from '../core/buildSwapTransaction';
import { isSwapError } from '../utils';
import { SwapContext } from '../context';
import type { SwapButtonReact, SwapError } from '../types';

export function SwapButton({ onError, onSubmit }: SwapButtonReact) {
  const { account, fromAmount, fromToken, toToken } = useContext(SwapContext);

  const handleSubmit = useCallback(async () => {
    if (account && fromToken && toToken && fromAmount) {
      try {
        const response = await buildSwapTransaction({
          amount: fromAmount,
          fromAddress: account.address,
          from: fromToken,
          to: toToken,
        });
        if (isSwapError(response)) {
          onError?.(response);
        } else {
          onSubmit?.(response);
        }
      } catch (error) {
        onError?.(error as SwapError);
      }
    }
  }, [account, fromAmount, fromToken, toToken]);

  return (
    <div className="w-full p-4">
      <button
        className={cn(
          'w-full rounded-[100px] bg-blue-700',
          'px-4 py-3 font-medium text-base text-white leading-6',
        )}
        onClick={handleSubmit}
        disabled={!fromAmount || !fromToken || !toToken}
      >
        Swap
      </button>
    </div>
  );
}
