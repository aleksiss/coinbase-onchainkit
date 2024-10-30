import { fireEvent, render, screen } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { getSlicedAddress } from '../utils/getSlicedAddress';
import { Address } from './Address';
import { useIdentityContext } from './IdentityProvider';

function mock<T>(func: T) {
  return func as Mock;
}

vi.mock('../utils/getSlicedAddress', () => ({
  getSlicedAddress: vi.fn(),
}));

vi.mock('./IdentityProvider', () => ({
  useIdentityContext: vi.fn(() => ({
    address: undefined,
    ensName: undefined,
    loading: false,
    error: null,
  })),
}));

const useIdentityContextMock = mock(useIdentityContext);

const mockGetSlicedAddress = (addr: string) =>
  `${addr.slice(0, 5)}...${addr.slice(-4)}`;

const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true,
});

describe('Address component', () => {
  const testIdentityProviderAddress = '0xIdentityAddress';
  const testAddressComponentAddress =
    '0x1234567890abcdef1234567890abcdef12345678';

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockClear();
    useIdentityContextMock.mockReturnValue({
      address: undefined,
      ensName: undefined,
      loading: false,
      error: null,
    });
  });

  it('should console.error and return null when no address is provided', () => {
    useIdentityContextMock.mockReturnValue({
      address: undefined,
      ensName: undefined,
      loading: false,
      error: null,
    });

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { container } = render(<Address />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Address: an Ethereum address must be provided to the Identity or Address component.',
    );
    expect(container.firstChild).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('renders the sliced address when address supplied to Identity', () => {
    useIdentityContextMock.mockReturnValue({
      address: testAddressComponentAddress,
      ensName: undefined,
      loading: false,
      error: null,
    });
    (getSlicedAddress as Mock).mockReturnValue(
      mockGetSlicedAddress(testAddressComponentAddress),
    );

    render(<Address />);
    expect(getSlicedAddress).toHaveBeenCalledWith(testAddressComponentAddress);
    expect(
      screen.getByText(mockGetSlicedAddress(testAddressComponentAddress)),
    ).toBeInTheDocument();
  });

  it('renders the sliced address when address supplied directly to component', () => {
    useIdentityContextMock.mockReturnValue({
      address: undefined,
      ensName: undefined,
      loading: false,
      error: null,
    });
    (getSlicedAddress as Mock).mockReturnValue(
      mockGetSlicedAddress(testAddressComponentAddress),
    );

    render(<Address address={testAddressComponentAddress} />);
    expect(getSlicedAddress).toHaveBeenCalledWith(testAddressComponentAddress);
    expect(
      screen.getByText(mockGetSlicedAddress(testAddressComponentAddress)),
    ).toBeInTheDocument();
  });

  it('displays sliced address when ENS name is not available and isSliced is true', () => {
    useIdentityContextMock.mockReturnValue({
      address: undefined,
      ensName: undefined,
      loading: false,
      error: null,
    });
    (getSlicedAddress as Mock).mockReturnValue(
      mockGetSlicedAddress(testAddressComponentAddress),
    );

    render(<Address address={testAddressComponentAddress} isSliced={true} />);
    expect(getSlicedAddress).toHaveBeenCalledWith(testAddressComponentAddress);
    expect(
      screen.getByText(mockGetSlicedAddress(testAddressComponentAddress)),
    ).toBeInTheDocument();
  });

  it('displays full address when isSliced is false and ENS name is not available', () => {
    useIdentityContextMock.mockReturnValue({});
    render(<Address address={testAddressComponentAddress} isSliced={false} />);
    expect(screen.getByText(testAddressComponentAddress)).toBeInTheDocument();
    expect(getSlicedAddress).not.toHaveBeenCalled();
  });

  it('uses identity context address if provided', () => {
    useIdentityContextMock.mockReturnValue({
      address: testIdentityProviderAddress,
    });
    render(<Address isSliced={false} />);
    expect(screen.getByText(testIdentityProviderAddress)).toBeInTheDocument();
    expect(getSlicedAddress).not.toHaveBeenCalled();
  });

  it('prioritizes component address over identity context address if both are provided', () => {
    useIdentityContextMock.mockReturnValue({
      address: testIdentityProviderAddress,
    });
    render(<Address address={testAddressComponentAddress} isSliced={false} />);
    expect(screen.getByText(testAddressComponentAddress)).toBeInTheDocument();
    expect(getSlicedAddress).not.toHaveBeenCalled();
  });

  describe('clipboard functionality', () => {
    const testAddress = '0x1234567890abcdef';

    beforeEach(() => {
      vi.clearAllMocks();
      useIdentityContextMock.mockReturnValue({
        address: undefined,
        ensName: undefined,
        loading: false,
        error: null,
      });
    });

    it('copies address to clipboard on click', () => {
      render(<Address address={testAddress} />);
      const element = screen.getByTestId('ockAddress');
      fireEvent.click(element);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(testAddress);
    });

    it('shows Copied text after clicking', async () => {
      render(<Address address={testAddress} />);
      const element = screen.getByTestId('ockAddress');

      const tooltipSpan = element.querySelector('span');
      expect(tooltipSpan).toHaveTextContent('Copy');

      fireEvent.click(element);

      await vi.waitFor(() => {
        expect(tooltipSpan).toHaveTextContent('Copied');
      });
    });

    it('handles clipboard error', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Failed'));
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<Address address={testAddress} />);
      const element = screen.getByTestId('ockAddress');
      fireEvent.click(element);

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('copies on Enter key', () => {
      render(<Address address={testAddress} />);
      const element = screen.getByTestId('ockAddress');
      fireEvent.keyDown(element, { key: 'Enter' });
      expect(mockClipboard.writeText).toHaveBeenCalledWith(testAddress);
    });

    it('copies on Space key', () => {
      render(<Address address={testAddress} />);
      const element = screen.getByTestId('ockAddress');
      fireEvent.keyDown(element, { key: ' ' });
      expect(mockClipboard.writeText).toHaveBeenCalledWith(testAddress);
    });
  });
});
