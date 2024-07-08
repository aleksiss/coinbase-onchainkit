import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';
import type { Address, Hex } from 'viem';
import type { Token } from '../token/types';

export type AddressOrETH = Address | 'ETH';

/**
 * Note: exported as public Type
 */
export type BuildSwapTransaction = {
  approveTransaction?: Transaction; //  // The approval transaction (https://metaschool.so/articles/what-are-erc20-approve-erc20-allowance-methods/)
  fee: Fee; // The fee for the swap
  quote: SwapQuote; // The quote for the swap
  transaction: Transaction; // The object developers should pass into Wagmi's signTransaction
  warning?: QuoteWarning; // The warning associated with the swap
};

/**
 * Note: exported as public Type
 */
export type BuildSwapTransactionResponse = BuildSwapTransaction | SwapError;

/**
 * Note: exported as public Type
 */
export type BuildSwapTransactionParams = GetSwapQuoteParams & {
  fromAddress: Address; // The address of the user
};

/**
 * Note: exported as public Type
 */
export type Fee = {
  amount: string; // The amount of the fee
  baseAsset: Token; // The base asset for the fee
  percentage: string; // The percentage of the fee
};

export type GetAPIParamsForToken =
  | GetSwapQuoteParams
  | BuildSwapTransactionParams;

export type GetQuoteAPIParams = {
  from: AddressOrETH | ''; // The source address or 'ETH' for Ethereum
  to: AddressOrETH | ''; // The destination address or 'ETH' for Ethereum
  amount: string; // The amount to be swapped
  amountReference?: string; // The reference amount for the swap
};

export type GetSwapAPIParams = GetQuoteAPIParams & {
  fromAddress: Address; // The address of the user
};

/**
 * Note: exported as public Type
 */
export type GetSwapQuoteParams = {
  from: Token; // The source token for the swap
  to: Token; // The destination token for the swap
  amount: string; // The amount to be swapped
  amountReference?: string; // The reference amount for the swap
  isAmountInDecimals?: boolean; // Whether the amount is in decimals
};

/**
 * Note: exported as public Type
 */
export type GetSwapQuoteResponse = SwapQuote | SwapError;

export type GetSwapMessageParams = {
  error?: SwapErrorState;
  loading?: boolean;
  to: SwapUnit;
  from: SwapUnit;
};

export type QuoteWarning = {
  description?: string; // The description of the warning
  message?: string; // The message of the warning
  type?: string; // The type of the warning
};

export type RawTransactionData = {
  data: string; // The transaction data
  from: string; // The sender address
  gas: string; // The gas limit
  gasPrice: string; // The gas price
  to: string; // The recipient address
  value: string; // The value of the transaction
};

/**
 * Note: exported as public Type
 */
export type SwapAmountInputReact = {
  delayMs?: number; // The debounce delay in milliseconds
  label: string; // Descriptive label for the input field
  swappableTokens?: Token[]; // Swappable tokens
  token?: Token; // Selected token
  type: 'to' | 'from'; // Identifies if component is for toToken or fromToken
  className?: string; // Optional className override for top div element.
};

export type SwapAPIParams = GetQuoteAPIParams | GetSwapAPIParams;

export type SwapAPIResponse = {
  approveTx?: RawTransactionData; // The approval transaction
  chainId: string; // The chain ID
  fee: Fee; // The fee for the trade
  quote: SwapQuote; // The quote for the trade
  tx: RawTransactionData; // The trade transaction
};

export type SwapErrorState = {
  quoteError?: SwapError;
  swapError?: SwapError;
};

/**
 * Note: exported as public Type
 */
export type SwapButtonReact = {
  disabled?: boolean; // Disables swap button
  className?: string; // Optional className override for top div element.
  onSubmit: (swapTransaction: BuildSwapTransaction) => void;
};

export type SwapUnit = {
  amount: string;
  balance?: string;
  error?: SwapError;
  loading: boolean;
  setAmount: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setToken: Dispatch<SetStateAction<Token | undefined>>;
  token: Token | undefined;
};

export type SwapContextType = {
  error?: SwapErrorState;
  from: SwapUnit;
  to: SwapUnit;
  loading: boolean;
  handleSubmit: (f: (swapTransaction: BuildSwapTransaction) => void) => void;
  handleToggle: () => void;
  handleAmountChange: (
    t: 'from' | 'to',
    amount: string,
    st?: Token,
    dt?: Token,
  ) => void;
};

export type SwapLoadingState = {
  isSwapLoading: boolean;
};

/**
 * Note: exported as public Type
 */
export type SwapQuote = {
  amountReference: string; // The reference amount for the quote
  from: Token; // The source token for the swap
  fromAmount: string; // The amount of the source token
  hasHighPriceImpact: boolean; // Whether the price impact is high
  priceImpact: string; // The price impact of the swap
  slippage: string; // The slippage of the swap
  to: Token; // The destination token for the swap
  toAmount: string; // The amount of the destination token
  warning?: QuoteWarning; // The warning associated with the quote
};

export type SwapParams = {
  amount: string;
  fromAddress: Address;
  from: Token;
  to: Token;
};

/**
 * Note: exported as public Type
 */
export type SwapReact = {
  address: Address; // Connected address from connector.
  children: ReactNode;
  title?: string; // Title for the Swap component. (default: "Swap")
  className?: string; // Optional className override for top div element.
};

/**
 * Note: exported as public Type
 */
export type SwapError = {
  code: string; // The error code
  error: string; // The error message
};

/**
 * Note: exported as public Type
 */
export type SwapMessageReact = {
  className?: string;
};

/**
 * Note: exported as public Type
 */
export type SwapToggleButtonReact = {
  className?: string;
};

/**
 * Note: exported as public Type
 */
export type Transaction = {
  chainId: number; // The chain ID
  data: Hex; // The data for the transaction
  gas: bigint; // The gas limit
  maxFeePerGas?: bigint | undefined; // The maximum fee per gas
  maxPriorityFeePerGas?: bigint | undefined; // The maximum priority fee per gas
  nonce?: number; // The nonce for the transaction
  to: Address; // The recipient address
  value: bigint; // The value of the transaction
};
