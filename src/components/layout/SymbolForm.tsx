import { useState, type FormEvent } from 'react';
import { normalizeSymbol } from '../../domain/symbols';
import type { Ticker } from '../../types/market';

interface SymbolFormProps {
  /** Called with a normalized ticker (trimmed, upper-case) only after local validation passes. */
  onSubmit: (symbol: Ticker) => void;
  onClear?: () => void;
  hasSelection?: boolean;
}

/** Ticker input. Validates format locally so malformed input never reaches the network. */
export function SymbolForm({ onSubmit, onClear, hasSelection = false }: SymbolFormProps) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() === '') {
      setMessage('Enter a ticker symbol, for example NVDA.');
      return;
    }
    const symbol = normalizeSymbol(value);
    if (!symbol) {
      setMessage(`"${value.trim()}" is not a valid ticker. Use 1-10 letters, digits, "." or "-" (for example BRK-B).`);
      return;
    }
    setMessage(null);
    onSubmit(symbol);
  }

  function handleClear() {
    setValue('');
    setMessage(null);
    onClear?.();
  }

  return (
    <form className="symbol-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="symbol-input">Compare another company</label>
      <div className="symbol-form__row">
        <input
          id="symbol-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ticker, e.g. NVDA"
          autoComplete="off"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? 'symbol-input-message' : undefined}
        />
        <button type="submit">Show chart</button>
        {hasSelection && (
          <button type="button" className="symbol-form__clear" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      {message && (
        <p id="symbol-input-message" className="symbol-form__message" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
