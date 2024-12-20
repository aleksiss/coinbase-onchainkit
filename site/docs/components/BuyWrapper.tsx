'use client';
import type { BuildSwapTransaction } from '@coinbase/onchainkit/swap';
import type { Token } from '@coinbase/onchainkit/token';
import { type ReactNode, useCallback } from 'react';

type BuyComponentsChildren = {
  toToken: Token;
  onSubmit: (b: BuildSwapTransaction) => void;
};

type BuyComponentsReact = {
  children: (props: BuyComponentsChildren) => ReactNode;
};

export default function BuyComponents({ children }: BuyComponentsReact) {
  const degenToken: Token = {
    name: 'DEGEN',
    address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    symbol: 'DEGEN',
    decimals: 18,
    image:
      'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/3b/bf/3bbf118b5e6dc2f9e7fc607a6e7526647b4ba8f0bea87125f971446d57b296d2-MDNmNjY0MmEtNGFiZi00N2I0LWIwMTItMDUyMzg2ZDZhMWNm',
    chainId: 8453,
  };

  const onSubmit = useCallback(() => {}, []);

  return (
    <main className="flex flex-col">
      <div className="flex w-full flex-col items-center justify-center gap-4 rounded-xl px-2 py-4 md:grow h-36">
        {children({ toToken: degenToken, onSubmit })}
      </div>
    </main>
  );
}
