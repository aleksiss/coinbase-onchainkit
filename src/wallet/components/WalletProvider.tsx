import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useValue } from '../../core-react/internal/hooks/useValue';
import { useOnchainKit } from '../../core-react/useOnchainKit';
import type { WalletContextType } from '../types';

const emptyContext = {} as WalletContextType;

const WalletContext = createContext<WalletContextType>(emptyContext);

export type WalletProviderReact = {
  children: ReactNode;
};

export function WalletProvider({ children }: WalletProviderReact) {
  const { chain } = useOnchainKit();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { address } = useAccount();

  const handleClose = useCallback(() => {
    if (!isOpen) {
      return;
    }
    setIsClosing(true);
  }, [isOpen]);

  const value = useValue({
    address,
    chain,
    isOpen,
    setIsOpen,
    isClosing,
    setIsClosing,
    handleClose,
  });

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}
