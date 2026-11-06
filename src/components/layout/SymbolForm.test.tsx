import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SymbolForm } from './SymbolForm';

function setup(props: Partial<React.ComponentProps<typeof SymbolForm>> = {}) {
  const onSubmit = vi.fn();
  render(<SymbolForm onSubmit={onSubmit} {...props} />);
  const input = screen.getByLabelText('Compare another company');
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Show chart' }));
  return { onSubmit, input, submit };
}

describe('SymbolForm', () => {
  it('submits a trimmed, upper-cased ticker', () => {
    const { onSubmit, input, submit } = setup();
    fireEvent.change(input, { target: { value: '  nvda ' } });
    submit();
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('NVDA');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a message and does not submit empty input', () => {
    const { onSubmit, submit } = setup();
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a ticker/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects malformed input without submitting', () => {
    const { onSubmit, input, submit } = setup();
    for (const bad of ['1IBM', 'IBM;DROP', 'A B', 'ABCDEFGHIJK']) {
      fireEvent.change(input, { target: { value: bad } });
      submit();
      expect(screen.getByRole('alert')).toHaveTextContent(`"${bad}" is not a valid ticker`);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears the message after a valid submit', () => {
    const { input, submit } = setup();
    submit();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'AAPL' } });
    submit();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows Clear only when something is selected and resets the input', () => {
    const onClear = vi.fn();
    const { input } = setup({ hasSelection: true, onClear });
    fireEvent.change(input, { target: { value: 'NVDA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(input).toHaveValue('');
  });

  it('hides Clear when nothing is selected', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
