import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Token } from '../../token';
import { DAI_TOKEN, ETH_TOKEN, USDC_TOKEN } from '../mocks';
import type { SwapContextType } from '../types';
import { SwapAmountInput } from './SwapAmountInput';
import { useSwapContext } from './SwapProvider';

vi.mock('../../token', () => ({
  TokenChip: vi.fn(() => <div>TokenChip</div>),
  TokenSelectDropdown: vi.fn(() => <div>TokenSelectDropdown</div>),
}));

vi.mock('./SwapProvider', () => ({
  useSwapContext: vi.fn(),
}));

const useSwapContextMock = useSwapContext as Mock;

const mockContextValue = {
  from: {
    amount: '10',
    balance: '0.0002851826238227',
    setAmount: vi.fn(),
    setLoading: vi.fn(),
    setToken: vi.fn(),
    loading: false,
    token: undefined,
  },
  to: {
    amount: '20',
    setAmount: vi.fn(),
    setLoading: vi.fn(),
    setToken: vi.fn(),
    loading: false,
    token: undefined,
  },
  loading: false,
  handleToggle: vi.fn(),
  handleSubmit: vi.fn(),
  handleAmountChange: vi.fn(),
} as SwapContextType;

const mockSwappableTokens: Token[] = [ETH_TOKEN, USDC_TOKEN, DAI_TOKEN];

describe('SwapAmountInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with the correct label and token', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    expect(screen.getByText('From')).toBeInTheDocument();
  });

  it('renders from token input with max button and balance', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);
    expect(screen.getByText('Balance: 0.00028518')).toBeInTheDocument();
    expect(
      screen.getByTestId('ockSwapAmountInput_MaxButton'),
    ).toBeInTheDocument();
  });

  it('does not render max button for to token input', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="to" />);
    expect(
      screen.queryByTestId('ockSwapAmountInput_MaxButton'),
    ).not.toBeInTheDocument();
  });

  it('updates input value with balance amount on max button click', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    const maxButton = screen.getByTestId('ockSwapAmountInput_MaxButton');
    fireEvent.click(maxButton);

    expect(mockContextValue.from.setAmount).toHaveBeenCalledWith(
      '0.0002851826238227',
    );
  });

  it('does not update input value with balance amount on max button click when balance is undefined', () => {
    const mockContextValueWithNoBalance = {
      ...mockContextValue,
      from: {
        ...mockContextValue.from,
        balance: undefined,
      },
    };

    useSwapContextMock.mockReturnValue(mockContextValueWithNoBalance);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    const maxButton = screen.getByTestId('ockSwapAmountInput_MaxButton');
    fireEvent.click(maxButton);

    expect(mockContextValue.from.setAmount).not.toHaveBeenCalled();
  });

  it('displays the correct amount when this type is "from"', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    const input = screen.getByTestId('ockTextInput_Input');
    expect(input).toHaveValue('10');
  });

  it('displays the correct amount when this type is "to"', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="To" token={ETH_TOKEN} type="to" />);

    const input = screen.getByTestId('ockTextInput_Input');
    expect(input).toHaveValue('20');
  });

  it('calls setFromAmount when type is "from" and valid input is entered', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    const input = screen.getByTestId('ockTextInput_Input');
    fireEvent.change(input, { target: { value: '15' } });

    expect(mockContextValue.from.setAmount).toHaveBeenCalledWith('15');
  });

  it('calls setToAmount when type is "to" and valid input is entered', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="to" />);

    const input = screen.getByTestId('ockTextInput_Input');
    fireEvent.change(input, { target: { value: '15' } });

    expect(mockContextValue.to.setAmount).toHaveBeenCalledWith('15');
  });

  it('does not call setAmount when invalid input is entered', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    const input = screen.getByTestId('ockTextInput_Input');
    fireEvent.change(input, { target: { value: 'invalid' } });

    expect(mockContextValue.from.setAmount).not.toHaveBeenCalled();
  });

  it('calls setFromToken when type is "from" and token prop is provided', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    expect(mockContextValue.from.setToken).toHaveBeenCalledWith(ETH_TOKEN);
  });

  it('calls setToToken when type is "to" and token prop is provided', () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(<SwapAmountInput label="To" token={ETH_TOKEN} type="to" />);

    expect(mockContextValue.to.setToken).toHaveBeenCalledWith(ETH_TOKEN);
  });

  it('correctly computes sourceTokenOptions excluding destination token', () => {
    const mockContextValueWithTokens = {
      ...mockContextValue,
      to: {
        ...mockContextValue.to,
        token: ETH_TOKEN,
      },
    };

    useSwapContextMock.mockReturnValue(mockContextValueWithTokens);
    render(
      <SwapAmountInput
        label="From"
        token={USDC_TOKEN}
        type="from"
        swappableTokens={mockSwappableTokens}
      />,
    );

    const dropdown = screen.getByText('TokenSelectDropdown');
    expect(dropdown).toBeInTheDocument();
  });

  it('hasInsufficientBalance is true when balance is less than amount for type "from"', () => {
    const mockContextValueWithLowBalance = {
      ...mockContextValue,
      from: {
        ...mockContextValue.from,
        balance: '5',
        amount: '10',
      },
    };

    useSwapContextMock.mockReturnValue(mockContextValueWithLowBalance);
    render(<SwapAmountInput label="From" token={ETH_TOKEN} type="from" />);

    const input = screen.getByTestId('ockTextInput_Input');
    expect(input).toHaveClass('text-ock-error');
  });

  it('renders a TokenChip component if swappableTokens are not passed as prop', () => {
    useSwapContextMock.mockReturnValue({
      ...mockContextValue,
      to: {
        ...mockContextValue.to,
        token: USDC_TOKEN,
      },
    });

    render(<SwapAmountInput label="To" token={USDC_TOKEN} type="to" />);

    const chips = screen.getAllByText('TokenChip');

    expect(chips.length).toBeGreaterThan(0);

    expect(chips[0]).toBeInTheDocument();
  });

  it('applies the given className to the button', async () => {
    useSwapContextMock.mockReturnValue(mockContextValue);
    render(
      <SwapAmountInput
        label="From"
        token={ETH_TOKEN}
        type="from"
        className="custom-class"
      />,
    );

    expect(screen.getByTestId('ockSwapAmountInput_Container')).toHaveClass(
      'custom-class',
    );
  });
});
