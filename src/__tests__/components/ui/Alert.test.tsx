import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '@/components/ui/Alert';

describe('Alert', () => {
  it('renders children text', () => {
    render(<Alert>Something went wrong</Alert>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Alert title="Heads up">Details here</Alert>);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it.each([
    ['info', 'bg-blue-50'],
    ['success', 'bg-green-50'],
    ['warning', 'bg-yellow-50'],
    ['error', 'bg-red-50'],
  ] as const)('applies %s variant background', (variant, bg) => {
    const { container } = render(<Alert variant={variant}>Msg</Alert>);
    expect(container.firstChild).toHaveClass(bg);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<Alert>message</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders dismiss button when onDismiss is provided', () => {
    render(<Alert onDismiss={vi.fn()}>message</Alert>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>message</Alert>);
    await userEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('accepts custom className', () => {
    const { container } = render(<Alert className="mt-4">msg</Alert>);
    expect(container.firstChild).toHaveClass('mt-4');
  });
});
