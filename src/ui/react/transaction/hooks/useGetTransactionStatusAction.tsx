import { useTransactionContext } from '@/core-react/transaction/providers/TransactionProvider';
import { getChainExplorer } from '@/core/network/getChainExplorer';
import { cn, color, text } from '@/styles/theme';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useChainId } from 'wagmi';
import { useShowCallsStatus } from 'wagmi/experimental';

export function useGetTransactionStatusAction() {
  const { chainId, receipt, transactionHash, transactionId } =
    useTransactionContext();
  const accountChainId = chainId ?? useChainId();

  const { showCallsStatus } = useShowCallsStatus();

  return useMemo(() => {
    const chainExplorer = getChainExplorer(accountChainId);

    let actionElement: ReactNode = null;

    // EOA will have txn hash
    if (transactionHash) {
      actionElement = (
        <a
          href={`${chainExplorer}/tx/${transactionHash}`}
          target="_blank"
          rel="noreferrer"
        >
          <span className={cn(text.label1, color.primary)}>
            View transaction
          </span>
        </a>
      );
    }

    // SW will have txn id
    if (transactionId) {
      actionElement = (
        <button
          onClick={() => showCallsStatus({ id: transactionId })}
          type="button"
        >
          <span className={cn(text.label1, color.primary)}>
            View transaction
          </span>
        </button>
      );
    }

    if (receipt) {
      actionElement = null;
    }

    return { actionElement };
  }, [
    accountChainId,
    receipt,
    showCallsStatus,
    transactionHash,
    transactionId,
  ]);
}
