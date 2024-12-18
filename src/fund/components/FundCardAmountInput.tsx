import { type ChangeEvent, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../../core-react/internal/hooks/useTheme';
import { cn, text } from '../../styles/theme';
import type {
  AmountInputSnippetReact,
  FundCardAmountInputPropsReact,
} from '../types';
import { FundCardCurrencyLabel } from './FundCardCurrencyLabel';
import { AmountInputSnippet } from './AmountInputSnippet';

export const FundCardAmountInput = ({
  fiatValue,
  setFiatValue,
  cryptoValue,
  setCryptoValue,
  currencySign,
  assetSymbol,
  inputType = 'fiat',
  exchangeRate = 1,
  amountInputSnippets,
}: FundCardAmountInputPropsReact) => {
  const componentTheme = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenSpanRef = useRef<HTMLSpanElement>(null);
  const currencySpanRef = useRef<HTMLSpanElement>(null);

  const value = inputType === 'fiat' ? fiatValue : cryptoValue;

  const handleSetAmount = useCallback(
    (amount: string) => {
      const formattedAmount = formatDecimalInputValue(amount);

      if (inputType === 'fiat') {
        const fiatValue = limitToDecimalPlaces(formattedAmount, 2);
        setFiatValue(fiatValue);

        // Calculate the crypto value based on the exchange rate
        const calculatedCryptoValue = String(
          Number(formattedAmount) * Number(exchangeRate),
        );

        const resultCryptoValue = limitToDecimalPlaces(
          calculatedCryptoValue,
          8,
        );
        setCryptoValue(calculatedCryptoValue === '0' ? '' : resultCryptoValue);
      } else {
        setCryptoValue(formattedAmount);

        // Calculate the fiat value based on the exchange rate
        const calculatedFiatValue = String(
          Number(formattedAmount) / Number(exchangeRate),
        );
        const resultFiatValue = limitToDecimalPlaces(calculatedFiatValue, 2);
        setFiatValue(resultFiatValue === '0' ? '' : resultFiatValue);
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [exchangeRate, setFiatValue, setCryptoValue, inputType],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      handleSetAmount(value);
    },
    [handleSetAmount],
  );

  const handleAmountInputSnippetClick = useCallback(
    (snippet: AmountInputSnippetReact) => {
      handleSetAmount(snippet.value);
    },
    [handleSetAmount],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: When value changes, we want to update the input width
  useEffect(() => {
    if (hiddenSpanRef.current) {
      const width = Math.max(42, hiddenSpanRef.current.offsetWidth);
      const currencyWidth =
        currencySpanRef.current?.getBoundingClientRect().width || 0;

      // Set the input width based on the span width
      if (inputRef.current) {
        inputRef.current.style.width = `${width}px`;
        inputRef.current.style.maxWidth = `${390 - currencyWidth}px`;
      }
    }
  }, [value]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to focus the input when the input type changes
  useEffect(() => {
    // focus the input when the input type changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputType]);

  return (
    <div className="flex py-6">
      <style>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            appearance: none;
            margin: 0;
          }

          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      <div className="flex" style={{ height: '78px' }}>
        {/* Display the fiat currency sign before the input*/}
        {inputType === 'fiat' && currencySign && (
          <FundCardCurrencyLabel
            ref={currencySpanRef}
            currencySign={currencySign}
          />
        )}

        <input
          className={cn(
            componentTheme,
            text.body,
            'border-[none] bg-transparent',
            'text-[60px] leading-none outline-none',
          )}
          type="number"
          value={value}
          onChange={handleChange}
          ref={inputRef}
          inputMode="decimal"
          minLength={1}
          placeholder="0"
          data-testid="ockFundCardAmountInput"
        />
        {/* Display the crypto asset symbol after the input*/}
        {inputType === 'crypto' && assetSymbol && (
          <FundCardCurrencyLabel
            ref={currencySpanRef}
            currencySign={assetSymbol}
          />
        )}
      </div>

      <div className="flex w-[100%] items-center justify-end">
        {!value &&
          amountInputSnippets
            ?.filter((snippet) => snippet.type === inputType)
            .map((snippet) => (
              <AmountInputSnippet
                key={snippet.type + snippet.value}
                amountInputSnippet={snippet}
                onClick={handleAmountInputSnippetClick}
              />
            ))}
      </div>
      {/* Hidden span for measuring text width 
          Without this span the input field would not adjust its width based on the text width and would look like this:
          [0.12--------Empty Space-------][ETH] - As you can see the currency symbol is far away from the inputed value

          With this span we can measure the width of the text in the input field and set the width of the input field to match the text width
          [0.12][ETH] - Now the currency symbol is displayed next to the input field
      */}
      <span
        data-testid="ockHiddenSpan"
        ref={hiddenSpanRef}
        className={cn(
          componentTheme,
          text.body,
          'border-[none] bg-transparent',
          'text-[60px] leading-none outline-none',
        )}
        style={{
          position: 'absolute',
          opacity: 0,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {value ? `${value}.` : '0.'}
      </span>
    </div>
  );
};

export default FundCardAmountInput;

/**
 * Ensure the decimal value is formatted correctly (i.e. "0.1" instead of ".1" and "0.1" instead of "01")
 */
const formatDecimalInputValue = (value: string) => {
  let resultValue = value;
  // Add a leading zero if the value starts with a dot. (i.e. ".1" -> "0.1")
  if (resultValue[0] === '.') {
    resultValue = `0${resultValue}`;
  }

  // Add a leading zero if the value starts with a zero and is not a decimal. (i.e. "01" -> "0.1")
  if (
    resultValue.length === 2 &&
    resultValue[0] === '0' &&
    resultValue[1] !== '.'
  ) {
    resultValue = `${resultValue[0]}.${resultValue[1]}`;
  }

  return resultValue;
};

/**
 * Limit the value to N decimal places
 */
const limitToDecimalPlaces = (value: string, decimalPlaces: number) => {
  const decimalIndex = value.indexOf('.');
  let resultValue = value;
  if (decimalIndex !== -1 && value.length - decimalIndex - 1 > 2) {
    resultValue = value.substring(0, decimalIndex + decimalPlaces + 1);
  }

  return resultValue;
};
