import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders spinner and is disabled when loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Submit</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it.each([
    ['primary', 'bg-indigo-600'],
    ['secondary', 'bg-gray-100'],
    ['danger', 'bg-red-600'],
    ['outline', 'border-gray-300'],
    ['ghost', 'text-gray-600'],
  ] as const)('applies %s variant class', (variant, expectedClass) => {
    render(<Button variant={variant}>Btn</Button>);
    expect(screen.getByRole('button').className).toContain(expectedClass);
  });

  it.each([
    ['sm', 'px-3'],
    ['md', 'px-4'],
    ['lg', 'px-5'],
  ] as const)('applies %s size class', (size, expectedClass) => {
    render(<Button size={size}>Btn</Button>);
    expect(screen.getByRole('button').className).toContain(expectedClass);
  });

  it('accepts custom className', () => {
    render(<Button className="w-full">Full</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('forwards type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
