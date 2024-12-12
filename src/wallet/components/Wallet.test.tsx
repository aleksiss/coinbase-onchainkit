import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOutsideClick } from '../../ui/react/internal/hooks/useOutsideClick';
import { ConnectWallet } from './ConnectWallet';
import { Wallet } from './Wallet';
import { WalletDropdown } from './WalletDropdown';
import { type WalletProviderReact, useWalletContext } from './WalletProvider';

vi.mock('./WalletProvider', () => ({
  useWalletContext: vi.fn(),
  WalletProvider: ({ children }: WalletProviderReact) => <>{children}</>,
}));

vi.mock('./ConnectWallet', () => ({
  ConnectWallet: () => <div data-testid="connect-wallet">Connect Wallet</div>,
}));

vi.mock('./WalletDropdown', () => ({
  WalletDropdown: () => (
    <div data-testid="wallet-dropdown">Wallet Dropdown</div>
  ),
}));

vi.mock('../../core-react/internal/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

vi.mock('../../ui/react/internal/hooks/useOutsideClick', () => ({
  useOutsideClick: vi.fn(),
}));

type useOutsideClickType = ReturnType<
  typeof vi.fn<
    (
      ref: React.RefObject<HTMLElement>,
      callback: (event: MouseEvent) => void,
    ) => void
  >
>;

describe('Wallet Component', () => {
  let mockSetIsOpen: ReturnType<typeof vi.fn>;
  let mockOutsideClickCallback: (e: MouseEvent) => void;

  beforeEach(() => {
    mockSetIsOpen = vi.fn();
    (useWalletContext as ReturnType<typeof vi.fn>).mockReturnValue({
      isOpen: true,
      setIsOpen: mockSetIsOpen,
    });

    (useOutsideClick as unknown as useOutsideClickType).mockImplementation(
      (_, callback) => {
        mockOutsideClickCallback = callback;
      },
    );

    vi.clearAllMocks();
  });

  it('should render the Wallet component with ConnectWallet', () => {
    (useWalletContext as ReturnType<typeof vi.fn>).mockReturnValue({
      isOpen: false,
      setIsOpen: mockSetIsOpen,
    });

    render(
      <Wallet>
        <ConnectWallet />
        <WalletDropdown>
          <div>Wallet Dropdown</div>
        </WalletDropdown>
      </Wallet>,
    );

    expect(screen.getByTestId('connect-wallet')).toBeDefined();
    expect(screen.queryByTestId('wallet-dropdown')).toBeNull();
  });

  it('should close the wallet when clicking outside', () => {
    render(
      <Wallet>
        <ConnectWallet />
        <WalletDropdown>
          <div>Wallet Dropdown</div>
        </WalletDropdown>
      </Wallet>,
    );

    expect(screen.getByTestId('wallet-dropdown')).toBeDefined();

    mockOutsideClickCallback({} as MouseEvent);

    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it('should not trigger click handler when wallet is closed', () => {
    (useWalletContext as ReturnType<typeof vi.fn>).mockReturnValue({
      isOpen: false,
      setIsOpen: mockSetIsOpen,
    });

    render(
      <Wallet>
        <ConnectWallet />
        <WalletDropdown>
          <div>Wallet Dropdown</div>
        </WalletDropdown>
      </Wallet>,
    );

    expect(screen.queryByTestId('wallet-dropdown')).toBeNull();

    mockOutsideClickCallback({} as MouseEvent);

    expect(mockSetIsOpen).not.toHaveBeenCalled();
  });
});
