import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { useOnchainKit } from '../../useOnchainKit';
import { METHOD_NOT_SUPPORTED_ERROR_SUBSTRING } from '../constants';
import { useCallsStatus } from '../hooks/useCallsStatus';
import { useWriteContract } from '../hooks/useWriteContract';
import { useWriteContracts } from '../hooks/useWriteContracts';
import {
  TransactionProvider,
  useTransactionContext,
} from './TransactionProvider';

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useSwitchChain: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useConfig: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
}));

vi.mock('wagmi/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
}));

vi.mock('../hooks/useCallsStatus', () => ({
  useCallsStatus: vi.fn(),
}));

vi.mock('../hooks/useWriteContract', () => ({
  useWriteContract: vi.fn(),
}));

vi.mock('../hooks/useWriteContracts', () => ({
  useWriteContracts: vi.fn(),
  genericErrorMessage: 'Something went wrong. Please try again.',
}));

vi.mock('../../useOnchainKit', () => ({
  useOnchainKit: vi.fn(),
}));

const TestComponent = () => {
  const context = useTransactionContext();
  const handleStatusError = async () => {
    context.setLifeCycleStatus({
      statusName: 'error',
      statusData: { code: 'code', error: 'error_long_messages' },
    });
  };
  const handleStatusTransactionLegacyExecuted = async () => {
    context.setLifeCycleStatus({
      statusName: 'transactionLegacyExecuted',
      statusData: {
        transactionHashList: ['hash12345678'],
      },
    });
  };
  const handleStatusTransactionLegacyExecutedMultipleContracts = async () => {
    context.setLifeCycleStatus({
      statusName: 'transactionLegacyExecuted',
      statusData: {
        transactionHashList: ['hash12345678', 'hash12345678'],
      },
    });
  };

  return (
    <div data-testid="test-component">
      <button type="button" onClick={context.onSubmit}>
        Submit
      </button>
      <span data-testid="context-value-errorCode">{context.errorCode}</span>
      <span data-testid="context-value-errorMessage">
        {context.errorMessage}
      </span>
      <span data-testid="context-value-lifeCycleStatus-statusName">
        {context.lifeCycleStatus.statusName}
      </span>
      <span data-testid="context-value-isToastVisible">
        {`${context.isToastVisible}`}
      </span>
      <button type="button" onClick={handleStatusError}>
        setLifeCycleStatus.error
      </button>
      <button type="button" onClick={handleStatusTransactionLegacyExecuted}>
        setLifeCycleStatus.transactionLegacyExecuted
      </button>
      <button
        type="button"
        onClick={handleStatusTransactionLegacyExecutedMultipleContracts}
      >
        setLifeCycleStatus.transactionLegacyExecutedMultipleContracts
      </button>
    </div>
  );
};

describe('TransactionProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ chainId: 1 });
    (useSwitchChain as ReturnType<typeof vi.fn>).mockReturnValue({
      switchChainAsync: vi.fn(),
    });
    (useCallsStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      transactionHash: null,
      status: 'idle',
    });
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContract: vi.fn(),
      data: null,
    });
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: vi.fn(),
    });
    (useWaitForTransactionReceipt as ReturnType<typeof vi.fn>).mockReturnValue({
      receipt: undefined,
    });
    (useOnchainKit as ReturnType<typeof vi.fn>).mockReturnValue({
      walletCapabilities: {
        hasAtomicBatch: false,
        hasPaymasterService: false,
        hasAuxiliaryFunds: false,
      },
    });
  });

  it('should emit onError when setLifeCycleStatus is called with error', async () => {
    const onErrorMock = vi.fn();
    render(
      <TransactionProvider contracts={[]} onError={onErrorMock}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('setLifeCycleStatus.error');
    fireEvent.click(button);
    expect(onErrorMock).toHaveBeenCalled();
  });

  it('should emit onStatus when setLifeCycleStatus is called with transactionLegacyExecuted', async () => {
    const onStatusMock = vi.fn();
    render(
      <TransactionProvider contracts={[]} onStatus={onStatusMock}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText(
      'setLifeCycleStatus.transactionLegacyExecuted',
    );
    fireEvent.click(button);
    expect(onStatusMock).toHaveBeenCalledWith({
      statusName: 'transactionLegacyExecuted',
      statusData: {
        transactionHashList: ['hash12345678'],
      },
    });
  });

  it('should emit onStatus when setLifeCycleStatus is called', async () => {
    const onStatusMock = vi.fn();
    render(
      <TransactionProvider contracts={[]} onStatus={onStatusMock}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('setLifeCycleStatus.error');
    fireEvent.click(button);
    expect(onStatusMock).toHaveBeenCalled();
  });

  it('should emit onSuccess when one receipt exist', async () => {
    const onSuccessMock = vi.fn();
    (useWaitForTransactionReceipt as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { status: 'success' },
    });
    (useCallsStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      transactionHash: 'hash',
    });
    render(
      <TransactionProvider
        contracts={[{ address: '0x123', method: 'method' }]}
        onSuccess={onSuccessMock}
      >
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalledWith({
        transactionReceipts: [{ status: 'success' }],
      });
    });
  });

  it('should emit onSuccess for multiple contracts using legacy transactions', async () => {
    const onSuccessMock = vi.fn();
    (waitForTransactionReceipt as ReturnType<typeof vi.fn>).mockReturnValue(
      'hash12345678',
    );
    render(
      <TransactionProvider
        contracts={[
          { address: '0x123', method: 'method' },
          { address: '0x123', method: 'method' },
        ]}
        onSuccess={onSuccessMock}
      >
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText(
      'setLifeCycleStatus.transactionLegacyExecutedMultipleContracts',
    );
    fireEvent.click(button);
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalledWith({
        transactionReceipts: ['hash12345678', 'hash12345678'],
      });
    });
  });

  it('should emit onError when legacy transactions fail', async () => {
    const onErrorMock = vi.fn();
    (waitForTransactionReceipt as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('error getting transaction receipt'),
    );
    render(
      <TransactionProvider
        contracts={[
          { address: '0x123', method: 'method' },
          { address: '0x123', method: 'method' },
        ]}
        onError={onErrorMock}
      >
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText(
      'setLifeCycleStatus.transactionLegacyExecutedMultipleContracts',
    );
    fireEvent.click(button);
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
    });
  });

  it('should set setLifeCycleStatus to transactionPending when writeContractsAsync is pending', async () => {
    const writeContractsAsyncMock = vi.fn();
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'pending',
      writeContractsAsync: writeContractsAsyncMock,
    });
    render(
      <TransactionProvider contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(
        screen.getByTestId('context-value-lifeCycleStatus-statusName')
          .textContent,
      ).toBe('transactionPending');
    });
  });

  it('should set setLifeCycleStatus to transactionPending when writeContractAsync is pending', async () => {
    const writeContractsAsyncMock = vi.fn();
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'pending',
      writeContractsAsync: writeContractsAsyncMock,
    });
    render(
      <TransactionProvider contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(
        screen.getByTestId('context-value-lifeCycleStatus-statusName')
          .textContent,
      ).toBe('transactionPending');
    });
  });

  it('should update context on handleSubmit', async () => {
    const writeContractsAsyncMock = vi.fn();
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: writeContractsAsyncMock,
    });
    (useOnchainKit as ReturnType<typeof vi.fn>).mockReturnValue({
      walletCapabilities: {
        hasAtomicBatch: true,
      },
    });
    render(
      <TransactionProvider contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(writeContractsAsyncMock).toHaveBeenCalled();
    });
  });

  it('should handle errors during submission', async () => {
    const writeContractsAsyncMock = vi
      .fn()
      .mockRejectedValue(new Error('Test error'));
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: writeContractsAsyncMock,
    });
    (useOnchainKit as ReturnType<typeof vi.fn>).mockReturnValue({
      walletCapabilities: {
        hasAtomicBatch: true,
      },
    });
    render(
      <TransactionProvider contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('context-value-errorCode').textContent).toBe(
        'TmTPc03',
      );
      expect(screen.getByTestId('context-value-errorMessage').textContent).toBe(
        'Something went wrong. Please try again.',
      );
    });
  });

  it('should switch chains when required', async () => {
    const switchChainAsyncMock = vi.fn();
    (useSwitchChain as ReturnType<typeof vi.fn>).mockReturnValue({
      switchChainAsync: switchChainAsyncMock,
    });
    render(
      <TransactionProvider chainId={2} contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(switchChainAsyncMock).toHaveBeenCalled();
    });
  });

  it('should display toast on error', async () => {
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: vi.fn().mockRejectedValue(new Error('Test error')),
    });
    render(
      <TransactionProvider contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      const testComponent = screen.getByTestId('context-value-isToastVisible');
      expect(testComponent.textContent).toBe('true');
    });
  });

  it('should handle user rejected request', async () => {
    const writeContractsAsyncMock = vi
      .fn()
      .mockRejectedValue({ cause: { name: 'UserRejectedRequestError' } });
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: writeContractsAsyncMock,
    });
    (useOnchainKit as ReturnType<typeof vi.fn>).mockReturnValue({
      walletCapabilities: {
        hasAtomicBatch: true,
      },
    });
    render(
      <TransactionProvider contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      const errorMessage = screen.getByTestId('context-value-errorMessage');
      expect(errorMessage.textContent).toBe('Request denied.');
    });
  });

  it('should handle chain switching', async () => {
    const switchChainAsyncMock = vi.fn();
    (useSwitchChain as ReturnType<typeof vi.fn>).mockReturnValue({
      switchChainAsync: switchChainAsyncMock,
    });
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ chainId: 1 });
    render(
      <TransactionProvider chainId={2} contracts={[]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(switchChainAsyncMock).toHaveBeenCalledWith({ chainId: 2 });
    });
  });

  it('should call fallbackToWriteContract when executeContracts fails', async () => {
    const writeContractsAsyncMock = vi
      .fn()
      .mockRejectedValue(new Error(METHOD_NOT_SUPPORTED_ERROR_SUBSTRING));
    const writeContractAsyncMock = vi.fn();
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: writeContractsAsyncMock,
    });
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractAsync: writeContractAsyncMock,
    });
    render(
      <TransactionProvider contracts={[{}]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(writeContractAsyncMock).toHaveBeenCalled();
    });
  });

  it('should handle generic error during fallback', async () => {
    const writeContractAsyncMock = vi
      .fn()
      .mockRejectedValue(new Error('Generic error'));
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractAsync: writeContractAsyncMock,
    });
    render(
      <TransactionProvider contracts={[{}]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('context-value-errorCode').textContent).toBe(
        'TmTPc02',
      );
      expect(screen.getByTestId('context-value-errorMessage').textContent).toBe(
        'Something went wrong. Please try again.',
      );
    });
  });

  it('should call setLifeCycleStatus when calling fallbackToWriteContract when executeContracts fails', async () => {
    const writeContractsAsyncMock = vi
      .fn()
      .mockRejectedValue(new Error(METHOD_NOT_SUPPORTED_ERROR_SUBSTRING));
    const writeContractAsyncMock = vi
      .fn()
      .mockRejectedValue(new Error('Basic error'));
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: writeContractsAsyncMock,
    });
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractAsync: writeContractAsyncMock,
    });
    render(
      <TransactionProvider contracts={[{}]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('context-value-errorCode').textContent).toBe(
        'TmTPc02',
      );
      expect(screen.getByTestId('context-value-errorMessage').textContent).toBe(
        'Something went wrong. Please try again.',
      );
    });
  });

  it('should call setLifeCycleStatus when calling fallbackToWriteContract when user rejects request', async () => {
    const writeContractsAsyncMock = vi
      .fn()
      .mockRejectedValue(new Error(METHOD_NOT_SUPPORTED_ERROR_SUBSTRING));
    const writeContractAsyncMock = vi
      .fn()
      .mockRejectedValue({ cause: { name: 'UserRejectedRequestError' } });
    (useWriteContracts as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractsAsync: writeContractsAsyncMock,
    });
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      writeContractAsync: writeContractAsyncMock,
    });
    render(
      <TransactionProvider contracts={[{}]}>
        <TestComponent />
      </TransactionProvider>,
    );
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('context-value-errorCode').textContent).toBe(
        'TmTPc02',
      );
      expect(screen.getByTestId('context-value-errorMessage').textContent).toBe(
        'Request denied.',
      );
    });
  });
});

describe('useTransactionContext', () => {
  it('should throw an error when used outside of TransactionProvider', () => {
    const TestComponent = () => {
      useTransactionContext();
      return null;
    };
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {}); // Suppress error logging
    expect(() => render(<TestComponent />)).toThrow(
      'useTransactionContext must be used within a Transaction component',
    );
    consoleError.mockRestore();
  });
});
