import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, createConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import type { BuildSwapTransaction } from '../../api/types';
import { Capabilities } from '../../constants';
import { PERMIT2_CONTRACT_ADDRESS } from '../constants';
import { DEGEN_TOKEN, ETH_TOKEN, USDC_TOKEN } from '../mocks';
import { processSwapTransaction } from './processSwapTransaction';

const mockSwitchChain = vi.fn();

vi.mock('wagmi/actions', () => ({
  waitForTransactionReceipt: vi.fn().mockResolvedValue({
    transactionHash: 'receiptHash',
  }),
}));

describe('processSwapTransaction', () => {
  const updateLifecycleStatus = vi.fn();
  let sendTransactionAsync: Mock;
  let sendTransactionAsyncPermit2: Mock;
  let sendCallsAsync: Mock;
  const walletCapabilities = {
    [Capabilities.AtomicBatch]: { supported: false },
  };
  const mockTransactionReceipt = {
    transactionHash: 'receiptHash',
  };

  const config = createConfig({
    chains: [base],
    connectors: [
      mock({
        accounts: [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        ],
      }),
    ],
    transports: {
      [base.id]: http(),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    sendTransactionAsync = vi
      .fn()
      .mockResolvedValueOnce('approveTxHash')
      .mockResolvedValueOnce('txHash');

    sendTransactionAsyncPermit2 = vi
      .fn()
      .mockResolvedValueOnce('approveTxHash')
      .mockResolvedValueOnce('permit2TxHash')
      .mockResolvedValueOnce('txHash');

    sendCallsAsync = vi.fn().mockResolvedValue('callsId');
  });

  it('should switch chains correctly', async () => {
    const swapTransaction: BuildSwapTransaction = {
      transaction: {
        to: '0x123',
        value: 0n,
        data: '0x',
        chainId: 8453,
        gas: 0n,
      },
      approveTransaction: undefined,
      quote: {
        from: ETH_TOKEN,
        to: DEGEN_TOKEN,
        fromAmount: '100000000000000',
        toAmount: '19395353519910973703',
        amountReference: 'from',
        priceImpact: '0.94',
        hasHighPriceImpact: false,
        slippage: '3',
        warning: undefined,
      },
      fee: {
        baseAsset: DEGEN_TOKEN,
        percentage: '1',
        amount: '195912661817282562',
      },
    };
    await processSwapTransaction({
      chainId: 84532,
      config,
      sendTransactionAsync,
      sendCallsAsync,
      updateLifecycleStatus,
      swapTransaction,
      switchChainAsync: mockSwitchChain,
      useAggregator: true,
      walletCapabilities,
    });
    expect(mockSwitchChain).toHaveBeenCalledTimes(1);
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(2);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(1, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'success',
      statusData: {
        transactionReceipt: mockTransactionReceipt,
      },
    });
    expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1);
  });

  it('should request approval and make the swap for ERC-20 tokens', async () => {
    const swapTransaction: BuildSwapTransaction = {
      transaction: {
        to: '0x123',
        value: 0n,
        data: '0x',
        chainId: 8453,
        gas: 0n,
      },
      approveTransaction: {
        to: '0x456',
        value: 0n,
        data: '0x123',
        chainId: 8453,
        gas: 0n,
      },
      quote: {
        from: {
          address: '',
          chainId: 8453,
          decimals: 18,
          image:
            'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
          name: 'ETH',
          symbol: 'ETH',
        },
        to: {
          address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
          chainId: 8453,
          decimals: 18,
          image:
            'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/3b/bf/3bbf118b5e6dc2f9e7fc607a6e7526647b4ba8f0bea87125f971446d57b296d2-MDNmNjY0MmEtNGFiZi00N2I0LWIwMTItMDUyMzg2ZDZhMWNm',
          name: 'DEGEN',
          symbol: 'DEGEN',
        },
        fromAmount: '100000000000000',
        toAmount: '19395353519910973703',
        amountReference: 'from',
        priceImpact: '0.94',
        hasHighPriceImpact: false,
        slippage: '3',
        warning: undefined,
      },
      fee: {
        baseAsset: DEGEN_TOKEN,
        percentage: '1',
        amount: '195912661817282562',
      },
    };
    await processSwapTransaction({
      chainId: 8453,
      config,
      sendTransactionAsync,
      sendCallsAsync,
      updateLifecycleStatus,
      swapTransaction,
      switchChainAsync: mockSwitchChain,
      useAggregator: true,
      walletCapabilities,
    });
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(4);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(1, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: 'approveTxHash',
        transactionType: 'ERC20',
      },
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(3, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(4, {
      statusName: 'success',
      statusData: {
        transactionReceipt: mockTransactionReceipt,
      },
    });
    expect(sendTransactionAsync).toHaveBeenCalledTimes(2);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(2);
  });

  it('should make the swap for non-ERC-20 tokens', async () => {
    const swapTransaction: BuildSwapTransaction = {
      transaction: {
        to: '0x123',
        value: 0n,
        data: '0x',
        chainId: 8453,
        gas: 0n,
      },
      approveTransaction: undefined,
      quote: {
        from: ETH_TOKEN,
        to: DEGEN_TOKEN,
        fromAmount: '100000000000000',
        toAmount: '19395353519910973703',
        amountReference: 'from',
        priceImpact: '0.94',
        hasHighPriceImpact: false,
        slippage: '3',
        warning: undefined,
      },
      fee: {
        baseAsset: DEGEN_TOKEN,
        percentage: '1',
        amount: '195912661817282562',
      },
    };
    await processSwapTransaction({
      chainId: 8453,
      config,
      sendTransactionAsync,
      sendCallsAsync,
      updateLifecycleStatus,
      swapTransaction,
      switchChainAsync: mockSwitchChain,
      useAggregator: true,
      walletCapabilities,
    });
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(2);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(1, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'success',
      statusData: {
        transactionReceipt: mockTransactionReceipt,
      },
    });
    expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1);
  });

  it('should successfully use Permit2 approval process for `useAggregator`=false', async () => {
    const swapTransaction: BuildSwapTransaction = {
      transaction: {
        to: '0x123',
        value: 0n,
        data: '0x',
        chainId: 8453,
        gas: 0n,
      },
      approveTransaction: {
        to: '0x456',
        value: 0n,
        data: '0x123',
        chainId: 8453,
        gas: 0n,
      },
      quote: {
        from: USDC_TOKEN,
        to: DEGEN_TOKEN,
        fromAmount: '100000000000000',
        toAmount: '19395353519910973703',
        amountReference: 'from',
        priceImpact: '0.94',
        hasHighPriceImpact: false,
        slippage: '3',
        warning: undefined,
      },
      fee: {
        baseAsset: DEGEN_TOKEN,
        percentage: '1',
        amount: '195912661817282562',
      },
    };
    await processSwapTransaction({
      chainId: 8453,
      config,
      sendTransactionAsync: sendTransactionAsyncPermit2,
      sendCallsAsync,
      updateLifecycleStatus,
      swapTransaction,
      switchChainAsync: mockSwitchChain,
      useAggregator: false,
      walletCapabilities,
    });
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(6);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(1, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: 'approveTxHash',
        transactionType: 'Permit2',
      },
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(3, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(4, {
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: 'permit2TxHash',
        transactionType: 'ERC20',
      },
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(5, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(6, {
      statusName: 'success',
      statusData: {
        transactionReceipt: mockTransactionReceipt,
      },
    });
    expect(sendTransactionAsyncPermit2).toHaveBeenCalledTimes(3);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(3);
    expect(sendTransactionAsyncPermit2).toHaveBeenNthCalledWith(2, {
      to: PERMIT2_CONTRACT_ADDRESS,
      data: expect.any(String),
      value: 0n,
    });
  });

  it('should process atomic batch transactions', async () => {
    const swapTransaction: BuildSwapTransaction = {
      transaction: {
        to: '0x123',
        value: 0n,
        data: '0x',
        chainId: 8453,
        gas: 0n,
      },
      approveTransaction: {
        to: '0x456',
        value: 0n,
        data: '0x123',
        chainId: 8453,
        gas: 0n,
      },
      quote: {
        from: USDC_TOKEN,
        to: DEGEN_TOKEN,
        fromAmount: '100000000000000',
        toAmount: '19395353519910973703',
        amountReference: 'from',
        priceImpact: '0.94',
        hasHighPriceImpact: false,
        slippage: '3',
        warning: undefined,
      },
      fee: {
        baseAsset: DEGEN_TOKEN,
        percentage: '1',
        amount: '195912661817282562',
      },
    };

    await processSwapTransaction({
      chainId: 8453,
      config,
      sendTransactionAsync,
      sendCallsAsync,
      updateLifecycleStatus,
      swapTransaction,
      switchChainAsync: mockSwitchChain,
      useAggregator: false,
      walletCapabilities: { [Capabilities.AtomicBatch]: { supported: true } },
    });

    expect(sendCallsAsync).toHaveBeenCalledTimes(1);
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(2);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(1, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'transactionApproved',
      statusData: {
        callsId: 'callsId',
        transactionType: 'Batched',
      },
    });
  });
});
