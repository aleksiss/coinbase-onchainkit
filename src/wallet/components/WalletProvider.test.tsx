import '@testing-library/jest-dom';
import { act, render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WagmiProvider } from 'wagmi';
import { WalletProvider, useWalletContext } from './WalletProvider';

vi.mock('wagmi', () => ({
  useAccount: vi.fn().mockReturnValue({ address: null }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('useWalletContext', () => {
  it('should return default context', () => {
    render(
      <WagmiProvider>
        <WalletProvider>
          <div />
        </WalletProvider>
      </WagmiProvider>,
    );

    const { result } = renderHook(() => useWalletContext(), {
      wrapper: ({ children }) => (
        <WagmiProvider config={{}}>
          <WalletProvider>{children}</WalletProvider>
        </WagmiProvider>
      ),
    });
    expect(result.current.isOpen).toEqual(false);
    expect(result.current.address).toEqual(null);
    expect(result.current.isClosing).toEqual(false);
  });

  it('should handle wallet closing correctly', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useWalletContext(), {
      wrapper: ({ children }) => (
        <WagmiProvider config={{}}>
          <WalletProvider>{children}</WalletProvider>
        </WagmiProvider>
      ),
    });

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toEqual(true);

    act(() => {
      result.current.handleClose();
    });
    expect(result.current.isClosing).toEqual(true);
    expect(result.current.isOpen).toEqual(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isOpen).toEqual(false);
    expect(result.current.isClosing).toEqual(false);

    vi.useRealTimers();
  });
});
