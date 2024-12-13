import { fireEvent, render, screen } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDisconnect } from 'wagmi';
import { useWalletContext } from '../WalletProvider';
import { useWalletIslandContext } from './WalletIslandProvider';
import { WalletIslandWalletActions } from './WalletIslandWalletActions';

vi.mock('wagmi', () => ({
  useDisconnect: vi.fn(),
}));

vi.mock('wagmi/actions', () => ({
  disconnect: vi.fn(),
}));

vi.mock('../WalletProvider', () => ({
  useWalletContext: vi.fn(),
  WalletProvider: ({ children }) => <>{children}</>,
}));

vi.mock('./WalletIslandProvider', () => ({
  useWalletIslandContext: vi.fn(),
  WalletIslandProvider: ({ children }) => <>{children}</>,
}));

describe('WalletIslandWalletActions', () => {
  const mockUseWalletContext = useWalletContext as ReturnType<typeof vi.fn>;
  const mockUseWalletIslandContext = useWalletIslandContext as ReturnType<
    typeof vi.fn
  >;

  const defaultMockUseWalletIslandContext = {
    animationClasses: {
      walletActions: 'animate-walletIslandContainerItem1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletIslandContext.mockReturnValue(
      defaultMockUseWalletIslandContext,
    );
  });

  it('renders the WalletIslandWalletActions component', () => {
    const handleCloseMock = vi.fn();
    mockUseWalletContext.mockReturnValue({ handleClose: handleCloseMock });

    const setShowQrMock = vi.fn();
    mockUseWalletIslandContext.mockReturnValue({
      ...defaultMockUseWalletIslandContext,
      setShowQr: setShowQrMock,
    });

    (useDisconnect as Mock).mockReturnValue({
      disconnect: vi.fn(),
      connectors: [],
    });

    render(<WalletIslandWalletActions />);

    expect(
      screen.getByTestId('ockWalletIsland_TransactionsButton'),
    ).toBeDefined();
    expect(screen.getByTestId('ockWalletIsland_QrButton')).toBeDefined();
    expect(
      screen.getByTestId('ockWalletIsland_DisconnectButton'),
    ).toBeDefined();
    expect(screen.getByTestId('ockWalletIsland_CollapseButton')).toBeDefined();
  });

  it('disconnects connectors and closes when disconnect button is clicked', () => {
    const handleCloseMock = vi.fn();
    mockUseWalletContext.mockReturnValue({
      ...defaultMockUseWalletIslandContext,
      handleClose: handleCloseMock,
    });

    const setShowQrMock = vi.fn();
    mockUseWalletIslandContext.mockReturnValue({
      ...defaultMockUseWalletIslandContext,
      setShowQr: setShowQrMock,
    });

    const disconnectMock = vi.fn();
    (useDisconnect as Mock).mockReturnValue({
      disconnect: disconnectMock,
      connectors: [{ id: 'mock-connector' }],
    });

    render(<WalletIslandWalletActions />);

    const disconnectButton = screen.getByTestId(
      'ockWalletIsland_DisconnectButton',
    );
    fireEvent.click(disconnectButton);

    expect(disconnectMock).toHaveBeenCalled();
    expect(handleCloseMock).toHaveBeenCalled();
  });

  it('sets showQr to true when qr button is clicked', () => {
    const setShowQrMock = vi.fn();
    mockUseWalletIslandContext.mockReturnValue({
      ...defaultMockUseWalletIslandContext,
      setShowQr: setShowQrMock,
    });

    render(<WalletIslandWalletActions />);

    const qrButton = screen.getByTestId('ockWalletIsland_QrButton');
    fireEvent.click(qrButton);

    expect(setShowQrMock).toHaveBeenCalled();
  });

  it('closes when collapse button is clicked', () => {
    const handleCloseMock = vi.fn();
    mockUseWalletContext.mockReturnValue({
      ...defaultMockUseWalletIslandContext,
      handleClose: handleCloseMock,
    });

    const setShowQrMock = vi.fn();
    mockUseWalletIslandContext.mockReturnValue({
      ...defaultMockUseWalletIslandContext,
      setShowQr: setShowQrMock,
    });

    render(<WalletIslandWalletActions />);

    const collapseButton = screen.getByTestId('ockWalletIsland_CollapseButton');
    fireEvent.click(collapseButton);

    expect(handleCloseMock).toHaveBeenCalled();
  });
});
