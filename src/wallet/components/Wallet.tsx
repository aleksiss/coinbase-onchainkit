import { Children, useMemo } from 'react';
import type { WalletReact } from '../types';
import { ConnectWallet } from './ConnectWallet';
import { WalletDropdown } from './WalletDropdown';
import { WalletProvider } from './WalletProvider';

export function Wallet({ children }: WalletReact) {
  const { connect, dropdown } = useMemo(() => {
    const childrenArray = Children.toArray(children);
    return {
      // @ts-ignore
      connect: childrenArray.filter(({ type }) => type === ConnectWallet),
      // @ts-ignore
      dropdown: childrenArray.filter(({ type }) => type === WalletDropdown),
    };
  }, [children]);

  return (
    <WalletProvider>
      <div className="relative w-fit shrink-0">
        {connect}
        {dropdown}
      </div>
    </WalletProvider>
  );
}
