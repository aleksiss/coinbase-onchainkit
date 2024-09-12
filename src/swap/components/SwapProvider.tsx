import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAccount, useConfig, useSendTransaction } from 'wagmi';
import { buildSwapTransaction } from '../../api/buildSwapTransaction';
import { getSwapQuote } from '../../api/getSwapQuote';
import { useValue } from '../../internal/hooks/useValue';
import { formatTokenAmount } from '../../internal/utils/formatTokenAmount';
import type { Token } from '../../token';
import { GENERIC_ERROR_MESSAGE } from '../../transaction/constants';
import { isUserRejectedRequestError } from '../../transaction/utils/isUserRejectedRequestError';
import { DEFAULT_MAX_SLIPPAGE } from '../constants';
import { useFromTo } from '../hooks/useFromTo';
import { useResetInputs } from '../hooks/useResetInputs';
import type {
  LifeCycleStatus,
  SwapContextType,
  SwapError,
  SwapProviderReact,
} from '../types';
import { isSwapError } from '../utils/isSwapError';
import { processSwapTransaction } from '../utils/processSwapTransaction';

const emptyContext = {} as SwapContextType;

export const SwapContext = createContext<SwapContextType>(emptyContext);

export function useSwapContext() {
  const context = useContext(SwapContext);
  if (context === emptyContext) {
    throw new Error('useSwapContext must be used within a Swap component');
  }
  return context;
}

export function SwapProvider({
  children,
  config = {
    maxSlippage: DEFAULT_MAX_SLIPPAGE,
  },
  experimental,
  onError,
  onStatus,
  onSuccess,
}: SwapProviderReact) {
  const { address } = useAccount();
  // Feature flags
  const { useAggregator } = experimental;
  // Core Hooks
  const accountConfig = useConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SwapError>();
  const [isTransactionPending, setPendingTransaction] = useState(false);
  const [lifeCycleStatus, setLifeCycleStatus] = useState<LifeCycleStatus>({
    statusName: 'init',
    statusData: {
      isMissingRequiredField: true,
      maxSlippage: config.maxSlippage,
    },
  }); // Component lifecycle
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);
  const { from, to } = useFromTo(address);
  const { sendTransactionAsync } = useSendTransaction(); // Sending the transaction (and approval, if applicable)

  // Refreshes balances and inputs post-swap
  const resetInputs = useResetInputs({ from, to });

  // Component lifecycle emitters
  useEffect(() => {
    // Error
    if (lifeCycleStatus.statusName === 'error') {
      setLoading(false);
      setPendingTransaction(false);
      setError(lifeCycleStatus.statusData);
      onError?.(lifeCycleStatus.statusData);
    }
    if (lifeCycleStatus.statusName === 'amountChange') {
      setError(undefined);
    }
    if (lifeCycleStatus.statusName === 'transactionPending') {
      setLoading(true);
      setPendingTransaction(true);
    }
    if (lifeCycleStatus.statusName === 'transactionApproved') {
      setPendingTransaction(false);
    }
    // Success
    if (lifeCycleStatus.statusName === 'success') {
      setError(undefined);
      setLoading(false);
      setPendingTransaction(false);
      onSuccess?.(lifeCycleStatus.statusData.transactionReceipt);
      setHasHandledSuccess(true);
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

  useEffect(() => {
    // Reset inputs after status reset. `resetInputs` is dependent
    // on 'from' and 'to' so moved to separate useEffect to
    // prevents multiple calls to `onStatus`
    if (lifeCycleStatus.statusName === 'init' && hasHandledSuccess) {
      setHasHandledSuccess(false);
      resetInputs();
    }
  }, [hasHandledSuccess, lifeCycleStatus.statusName, resetInputs]);

  useEffect(() => {
    const maxSlippage = lifeCycleStatus.statusData.maxSlippage;
    // Reset status to init after success has been handled
    if (lifeCycleStatus.statusName === 'success' && hasHandledSuccess) {
      setLifeCycleStatus({
        statusName: 'init',
        statusData: {
          isMissingRequiredField:
            lifeCycleStatus.statusData.isMissingRequiredField,
          maxSlippage,
        },
      });
    }
  }, [
    hasHandledSuccess,
    lifeCycleStatus.statusData,
    lifeCycleStatus.statusName,
  ]);

  const handleToggle = useCallback(() => {
    from.setAmount(to.amount);
    to.setAmount(from.amount);
    from.setToken(to.token);
    to.setToken(from.token);
  }, [from, to]);

  const handleAmountChange = useCallback(
    async (
      type: 'from' | 'to',
      amount: string,
      sToken?: Token,
      dToken?: Token,
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO Refactor this component
    ) => {
      const maxSlippage = lifeCycleStatus.statusData.maxSlippage;
      const source = type === 'from' ? from : to;
      const destination = type === 'from' ? to : from;

      source.token = sToken ?? source.token;
      destination.token = dToken ?? destination.token;

      // if token is missing alert user via isMissingRequiredField
      if (source.token === undefined || destination.token === undefined) {
        setLifeCycleStatus({
          statusName: 'amountChange',
          statusData: {
            amountFrom: from.amount,
            amountTo: to.amount,
            maxSlippage,
            tokenFrom: from.token,
            tokenTo: to.token,
            // token is missing
            isMissingRequiredField: true,
          },
        });
        return;
      }
      if (amount === '' || amount === '.' || Number.parseFloat(amount) === 0) {
        return destination.setAmount('');
      }

      // When toAmount changes we fetch quote for fromAmount
      // so set isFromQuoteLoading to true
      destination.setLoading(true);
      setLifeCycleStatus({
        statusName: 'amountChange',
        statusData: {
          // when fetching quote, the previous
          // amount is irrelevant
          amountFrom: type === 'from' ? amount : '',
          amountTo: type === 'to' ? amount : '',
          // when fetching quote, the destination
          // amount is missing
          isMissingRequiredField: true,
          maxSlippage,
          tokenFrom: from.token,
          tokenTo: to.token,
        },
      });

      try {
        const response = await getSwapQuote({
          amount,
          amountReference: 'from',
          from: source.token,
          maxSlippage: String(maxSlippage),
          to: destination.token,
          useAggregator,
        });
        // If request resolves to error response set the quoteError
        // property of error state to the SwapError response
        if (isSwapError(response)) {
          setLifeCycleStatus({
            statusName: 'error',
            statusData: {
              code: response.code,
              error: response.error,
              message: '',
              // LifecycleStatus shared data
              isMissingRequiredField:
                lifeCycleStatus.statusData.isMissingRequiredField,
              maxSlippage,
            },
          });
          return;
        }
        const formattedAmount = formatTokenAmount(
          response.toAmount,
          response.to.decimals,
        );
        destination.setAmount(formattedAmount);
        setLifeCycleStatus({
          statusName: 'amountChange',
          statusData: {
            amountFrom: type === 'from' ? amount : formattedAmount,
            amountTo: type === 'to' ? amount : formattedAmount,
            // if quote was fetched successfully, we
            // have all required fields
            isMissingRequiredField: !formattedAmount,
            maxSlippage,
            tokenFrom: from.token,
            tokenTo: to.token,
          },
        });
      } catch (err) {
        setLifeCycleStatus({
          statusName: 'error',
          statusData: {
            code: 'TmSPc01', // Transaction module SwapProvider component 01 error
            error: JSON.stringify(err),
            message: '',
            // LifecycleStatus shared data
            isMissingRequiredField:
              lifeCycleStatus.statusData.isMissingRequiredField,
            maxSlippage,
          },
        });
      } finally {
        // reset loading state when quote request resolves
        destination.setLoading(false);
      }
    },
    [from, lifeCycleStatus, to, useAggregator],
  );

  const handleSubmit = useCallback(async () => {
    if (!address || !from.token || !to.token || !from.amount) {
      return;
    }
    const maxSlippage = lifeCycleStatus.statusData.maxSlippage;
    setLifeCycleStatus({
      statusName: 'init',
      statusData: {
        isMissingRequiredField: false,
        maxSlippage,
      },
    });

    try {
      const response = await buildSwapTransaction({
        amount: from.amount,
        fromAddress: address,
        from: from.token,
        maxSlippage: String(maxSlippage),
        to: to.token,
        useAggregator,
      });
      if (isSwapError(response)) {
        setLifeCycleStatus({
          statusName: 'error',
          statusData: {
            code: response.code,
            error: response.error,
            message: response.message,
            // LifecycleStatus shared data
            isMissingRequiredField:
              lifeCycleStatus.statusData.isMissingRequiredField,
            maxSlippage,
          },
        });
        return;
      }
      await processSwapTransaction({
        config: accountConfig,
        lifeCycleStatus,
        sendTransactionAsync,
        setLifeCycleStatus,
        swapTransaction: response,
        useAggregator,
      });

      // TODO: refresh balances
    } catch (err) {
      const errorMessage = isUserRejectedRequestError(err)
        ? 'Request denied.'
        : GENERIC_ERROR_MESSAGE;
      setLifeCycleStatus({
        statusName: 'error',
        statusData: {
          code: 'TmSPc02', // Transaction module SwapProvider component 02 error
          error: JSON.stringify(err),
          message: errorMessage,
          // LifecycleStatus shared data
          isMissingRequiredField:
            lifeCycleStatus.statusData.isMissingRequiredField,
          maxSlippage,
        },
      });
    }
  }, [
    accountConfig,
    address,
    from.amount,
    from.token,
    lifeCycleStatus,
    sendTransactionAsync,
    to.token,
    useAggregator,
  ]);

  const value = useValue({
    address,
    error,
    from,
    loading,
    handleAmountChange,
    handleToggle,
    handleSubmit,
    lifeCycleStatus,
    isTransactionPending,
    setLifeCycleStatus,
    to,
  });

  return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
}
