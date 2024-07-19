import { useWriteContracts as useWriteContractsWagmi } from 'wagmi/experimental';
import type { TransactionExecutionError } from 'viem';
import type { TransactionError } from '../types';

type UseWriteContractsParams = {
  onError?: (e: TransactionError) => void;
  setErrorMessage: (error: string) => void;
  setTransactionId: (id: string) => void;
};

const genericErrorMessage = 'Something went wrong. Please try again.';
const uncaughtErrorCode = 'UNCAUGHT_WRITE_TRANSACTIONS_ERROR';
const errorCode = 'WRITE_TRANSACTIONS_ERROR';

export function useWriteContracts({
  onError,
  setErrorMessage,
  setTransactionId,
}: UseWriteContractsParams) {
  try {
    const { status, writeContracts } = useWriteContractsWagmi({
      mutation: {
        onError: (e) => {
          if (
            (e as TransactionExecutionError)?.cause?.name ===
            'UserRejectedRequestError'
          ) {
            setErrorMessage('Request denied.');
          } else {
            setErrorMessage(genericErrorMessage);
          }
          onError?.({ code: errorCode, error: e.message });
        },
        onSuccess: (id) => {
          setTransactionId(id);
        },
      },
    });
    return { status, writeContracts };
  } catch (err) {
    onError?.({ code: uncaughtErrorCode, error: JSON.stringify(err) });
    setErrorMessage(genericErrorMessage);
    return { status: 'error', writeContracts: () => {} };
  }
}
