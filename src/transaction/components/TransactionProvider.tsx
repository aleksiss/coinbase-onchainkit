import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Address } from 'viem';
import {
  useAccount,
  useConfig,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { useValue } from '../../internal/hooks/useValue';
import { useOnchainKit } from '../../useOnchainKit';
import {
  GENERIC_ERROR_MESSAGE,
  TRANSACTION_TYPE_CALLS,
  TRANSACTION_TYPE_CONTRACTS,
} from '../constants';
import { useCallsStatus } from '../hooks/useCallsStatus';
import { useSendCall } from '../hooks/useSendCall';
import { useSendCalls } from '../hooks/useSendCalls';
import { useSendWalletTransactions } from '../hooks/useSendWalletTransactions';
import { useWriteContract } from '../hooks/useWriteContract';
import { useWriteContracts } from '../hooks/useWriteContracts';
import type {
  LifeCycleStatus,
  TransactionContextType,
  TransactionProviderReact,
} from '../types';
import { getPaymasterUrl } from '../utils/getPaymasterUrl';
import { isUserRejectedRequestError } from '../utils/isUserRejectedRequestError';

const emptyContext = {} as TransactionContextType;
export const TransactionContext =
  createContext<TransactionContextType>(emptyContext);

export function useTransactionContext() {
  const context = useContext(TransactionContext);
  if (context === emptyContext) {
    throw new Error(
      'useTransactionContext must be used within a Transaction component',
    );
  }
  return context;
}

export function TransactionProvider({
  calls,
  capabilities,
  chainId,
  children,
  contracts,
  onError,
  onStatus,
  onSuccess,
}: TransactionProviderReact) {
  // Core Hooks
  const account = useAccount();
  const config = useConfig();
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [lifeCycleStatus, setLifeCycleStatus] = useState<LifeCycleStatus>({
    statusName: 'init',
    statusData: null,
  }); // Component lifecycle
  const [transactionId, setTransactionId] = useState('');
  const [transactionHashList, setTransactionHashList] = useState<Address[]>([]);
  const transactions = calls || contracts;
  const transactionType = calls
    ? TRANSACTION_TYPE_CALLS
    : TRANSACTION_TYPE_CONTRACTS;

  // Retrieve wallet capabilities
  const { walletCapabilities } = useOnchainKit();

  const { switchChainAsync } = useSwitchChain();

  // Validate `calls` and `contracts` props
  if (!contracts && !calls) {
    throw new Error(
      'Transaction: One of contracts or calls must be provided as a prop to the Transaction component.',
    );
  }
  if (calls && contracts) {
    throw new Error(
      'Transaction: Only one of contracts or calls can be provided as a prop to the Transaction component.',
    );
  }

  // useWriteContracts or useWriteContract
  // Used for contract calls with an ABI and functions.
  const { status: statusWriteContracts, writeContractsAsync } =
    useWriteContracts({
      setLifeCycleStatus,
      setTransactionId,
    });
  const {
    status: statusWriteContract,
    writeContractAsync,
    data: writeContractTransactionHash,
  } = useWriteContract({
    setLifeCycleStatus,
    transactionHashList,
  });
  // useSendCalls or useSendCall
  // Used for contract calls with raw calldata.
  const { status: statusSendCalls, sendCallsAsync } = useSendCalls({
    setLifeCycleStatus,
    setTransactionId,
  });
  const {
    status: statusSendCall,
    sendCallAsync,
    data: sendCallTransactionHash,
  } = useSendCall({
    setLifeCycleStatus,
    transactionHashList,
  });

  // Transaction Status
  // For batched, use statusSendCalls or statusWriteContracts
  // For single, use statusSendCall or statusWriteContract
  const transactionStatus = useMemo(() => {
    const transactionStatuses = walletCapabilities.hasAtomicBatch
      ? {
          [TRANSACTION_TYPE_CALLS]: statusSendCalls,
          [TRANSACTION_TYPE_CONTRACTS]: statusWriteContracts,
        }
      : {
          [TRANSACTION_TYPE_CALLS]: statusSendCall,
          [TRANSACTION_TYPE_CONTRACTS]: statusWriteContract,
        };
    return transactionStatuses[transactionType];
  }, [
    statusSendCalls,
    statusWriteContracts,
    statusSendCall,
    statusWriteContract,
    transactionType,
    walletCapabilities.hasAtomicBatch,
  ]);

  // Transaction hash for single transaction (non-batched)
  const singleTransactionHash =
    writeContractTransactionHash || sendCallTransactionHash;

  // useSendWalletTransactions
  // Used to send transactions based on the transaction type. Can be of type calls or contracts.
  const sendWalletTransactions = useSendWalletTransactions({
    capabilities,
    sendCallAsync,
    sendCallsAsync,
    transactions,
    transactionType,
    walletCapabilities,
    writeContractAsync,
    writeContractsAsync,
  });

  const { transactionHash: batchedTransactionHash, status: callStatus } =
    useCallsStatus({
      setLifeCycleStatus,
      transactionId,
    });
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: singleTransactionHash || batchedTransactionHash,
  });

  // Component lifecycle emitters
  useEffect(() => {
    setErrorMessage('');
    // Error
    if (lifeCycleStatus.statusName === 'error') {
      setErrorMessage(lifeCycleStatus.statusData.message);
      setErrorCode(lifeCycleStatus.statusData.code);
      onError?.(lifeCycleStatus.statusData);
    }
    // Transaction Legacy Executed
    if (lifeCycleStatus.statusName === 'transactionLegacyExecuted') {
      setTransactionHashList(lifeCycleStatus.statusData.transactionHashList);
    }
    // Success
    if (lifeCycleStatus.statusName === 'success') {
      onSuccess?.({
        transactionReceipts: lifeCycleStatus.statusData.transactionReceipts,
      });
    }
    // Emit Status
    onStatus?.(lifeCycleStatus);
  }, [
    onError,
    onStatus,
    onSuccess,
    lifeCycleStatus,
    lifeCycleStatus.statusData, // Keep statusData, so that the effect runs when it changes
    lifeCycleStatus.statusName, // Keep statusName, so that the effect runs when it changes
  ]);

  // Set transaction pending status when writeContracts or writeContract is pending
  useEffect(() => {
    if (transactionStatus === 'pending') {
      setLifeCycleStatus({
        statusName: 'transactionPending',
        statusData: null,
      });
    }
  }, [transactionStatus]);

  // Trigger success status when receipt is generated by useWaitForTransactionReceipt
  useEffect(() => {
    if (!receipt) {
      return;
    }
    setLifeCycleStatus({
      statusName: 'success',
      statusData: {
        transactionReceipts: [receipt],
      },
    });
  }, [receipt]);

  // When all transactions are succesful, get the receipts
  useEffect(() => {
    if (
      !transactions ||
      transactionHashList.length !== transactions.length ||
      transactions.length < 2
    ) {
      return;
    }
    getTransactionLegacyReceipts();
  }, [transactions, transactionHashList]);

  const getTransactionLegacyReceipts = useCallback(async () => {
    const receipts = [];
    for (const hash of transactionHashList) {
      try {
        const txnReceipt = await waitForTransactionReceipt(config, {
          hash,
          chainId,
        });
        receipts.push(txnReceipt);
      } catch (err) {
        setLifeCycleStatus({
          statusName: 'error',
          statusData: {
            code: 'TmTPc01', // Transaction module TransactionProvider component 01 error
            error: JSON.stringify(err),
            message: GENERIC_ERROR_MESSAGE,
          },
        });
      }
    }
    setLifeCycleStatus({
      statusName: 'success',
      statusData: {
        transactionReceipts: receipts,
      },
    });
  }, [chainId, config, transactionHashList]);

  const switchChain = useCallback(
    async (targetChainId: number | undefined) => {
      if (targetChainId && account.chainId !== targetChainId) {
        await switchChainAsync({ chainId: targetChainId });
      }
    },
    [account.chainId, switchChainAsync],
  );

  const handleSubmit = useCallback(async () => {
    setErrorMessage('');
    setIsToastVisible(true);
    try {
      // Switch chain before attempting transactions
      await switchChain(chainId);
      await sendWalletTransactions();
    } catch (err) {
      const errorMessage = isUserRejectedRequestError(err)
        ? 'Request denied.'
        : GENERIC_ERROR_MESSAGE;
      setLifeCycleStatus({
        statusName: 'error',
        statusData: {
          code: 'TmTPc03', // Transaction module TransactionProvider component 03 error
          error: JSON.stringify(err),
          message: errorMessage,
        },
      });
    }
  }, [chainId, sendWalletTransactions, switchChain]);

  const value = useValue({
    chainId,
    errorCode,
    errorMessage,
    isLoading: callStatus === 'PENDING',
    isToastVisible,
    lifeCycleStatus,
    onSubmit: handleSubmit,
    paymasterUrl: getPaymasterUrl(capabilities),
    receipt,
    setIsToastVisible,
    setLifeCycleStatus,
    setTransactionId,
    transactions,
    transactionId,
    transactionHash: singleTransactionHash || batchedTransactionHash,
  });
  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
