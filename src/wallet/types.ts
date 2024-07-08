import type { UserOperation } from 'permissionless';
import type { Address, PublicClient } from 'viem';
import type { SwapError } from '../swap';
import type { UseBalanceReturnType, UseReadContractReturnType } from 'wagmi';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Note: exported as public Type
 */
export type ConnectAccountReact = {
  label?: string;
  children?: React.ReactNode; // Children can be utilized to display customized content when the wallet is connected.
};

/**
 * Note: exported as public Type
 */
export type ConnectWalletReact = {
  children?: React.ReactNode; // Children can be utilized to display customized content when the wallet is connected.
  className?: string; // Optional className override for button element
  label?: string; // Label when wallet is _not_ connected
};

/**
 * Note: exported as public Type
 */
export type IsValidAAEntrypointOptions = {
  entrypoint: string;
};

/**
 * Note: exported as public Type
 */
export type IsWalletACoinbaseSmartWalletOptions = {
  client: PublicClient;
  userOp: UserOperation<'v0.6'>;
};

/**
 * Note: exported as public Type
 */
export type IsWalletACoinbaseSmartWalletResponse =
  | { isCoinbaseSmartWallet: true }
  | { isCoinbaseSmartWallet: false; error: string; code: string };

export type UseGetETHBalanceResponse = {
  error?: SwapError;
  response?: UseBalanceReturnType;
  convertedBalance?: string;
  roundedBalance?: string;
};

export type UseGetTokenBalanceResponse = {
  error?: SwapError;
  response?: UseReadContractReturnType;
  convertedBalance?: string;
  roundedBalance?: string;
};

/**
 * Note: exported as public Type
 */
export type WalletContextType = {
  address?: Address | null; // The Ethereum address to fetch the avatar and name for.
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

/**
 * Note: exported as public Type
 */
export type WalletReact = {
  children: React.ReactNode;
};

/**
 * Note: exported as public Type
 */
export type WalletDropdownReact = {
  children: React.ReactNode;
  className?: string; // Optional className override for top div element
};
