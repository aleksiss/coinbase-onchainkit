import { renderHook } from '@testing-library/react';
import type { TransactionExecutionError } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWriteContracts as useWriteContractsWagmi } from 'wagmi/experimental';
import { useWriteContracts } from './useWriteContracts';

vi.mock('wagmi/experimental', () => ({
  useWriteContracts: vi.fn(),
}));

describe('useWriteContracts', () => {
  const mockSetLifeCycleStatus = vi.fn();
  const mockSetTransactionId = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should handle generic error', () => {
    const genericError = new Error('Something went wrong. Please try again.');
    let onErrorCallback: ((error: Error) => void) | undefined;
    (useWriteContractsWagmi as ReturnType<typeof vi.fn>).mockImplementation(
      ({ mutation }: UseWriteContractsConfig) => {
        onErrorCallback = mutation.onError;
        return {
          writeContracts: vi.fn(),
          status: 'error',
        };
      },
    );
    renderHook(() =>
      useWriteContracts({
        setLifeCycleStatus: mockSetLifeCycleStatus,
        setTransactionId: mockSetTransactionId,
      }),
    );
    expect(onErrorCallback).toBeDefined();
    onErrorCallback?.(genericError);
    expect(mockSetLifeCycleStatus).toHaveBeenCalledWith({
      statusName: 'error',
      statusData: {
        code: 'TmUWCSh01',
        error: 'Something went wrong. Please try again.',
        message: 'Something went wrong. Please try again.',
      },
    });
  });

  it('should handle userRejectedRequestError', () => {
    let onErrorCallback:
      | ((error: TransactionExecutionError) => void)
      | undefined;
    (useWriteContractsWagmi as ReturnType<typeof vi.fn>).mockImplementation(
      ({ mutation }: UseWriteContractsConfig) => {
        onErrorCallback = mutation.onError;
        return {
          writeContracts: vi.fn(),
          status: 'error',
        };
      },
    );
    renderHook(() =>
      useWriteContracts({
        setLifeCycleStatus: mockSetLifeCycleStatus,
        setTransactionId: mockSetTransactionId,
      }),
    );
    expect(onErrorCallback).toBeDefined();
    onErrorCallback?.({
      cause: {
        name: 'UserRejectedRequestError',
      },
      message: 'Request denied.',
    });
    expect(mockSetLifeCycleStatus).toHaveBeenCalledWith({
      statusName: 'error',
      statusData: {
        code: 'TmUWCSh01',
        error: 'Request denied.',
        message: 'Request denied.',
      },
    });
  });

  it('should handle successful transaction', () => {
    const transactionId = '0x123';
    let onSuccessCallback: ((id: string) => void) | undefined;
    (useWriteContractsWagmi as ReturnType<typeof vi.fn>).mockImplementation(
      ({ mutation }: UseWriteContractsConfig) => {
        onSuccessCallback = mutation.onSuccess;
        return {
          writeContracts: vi.fn(),
          status: 'success',
        };
      },
    );
    renderHook(() =>
      useWriteContracts({
        setLifeCycleStatus: mockSetLifeCycleStatus,
        setTransactionId: mockSetTransactionId,
      }),
    );
    expect(onSuccessCallback).toBeDefined();
    onSuccessCallback?.(transactionId);
    expect(mockSetTransactionId).toHaveBeenCalledWith(transactionId);
  });

  it('should handle uncaught errors', () => {
    const uncaughtError = new Error('Uncaught error');
    (useWriteContractsWagmi as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw uncaughtError;
      },
    );
    const { result } = renderHook(() =>
      useWriteContracts({
        setLifeCycleStatus: mockSetLifeCycleStatus,
        setTransactionId: mockSetTransactionId,
      }),
    );
    expect(result.current.status).toBe('error');
    expect(result.current.writeContracts).toBeInstanceOf(Function);
    expect(mockSetLifeCycleStatus).toHaveBeenCalledWith({
      statusName: 'error',
      statusData: {
        code: 'TmUWCSh02',
        error: JSON.stringify(uncaughtError),
        message: 'Something went wrong. Please try again.',
      },
    });
  });
});
