import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-700');
  });

  it.each([
    ['success', 'bg-green-100', 'text-green-700'],
    ['warning', 'bg-yellow-100', 'text-yellow-700'],
    ['danger', 'bg-red-100', 'text-red-700'],
    ['info', 'bg-blue-100', 'text-blue-700'],
    ['purple', 'bg-purple-100', 'text-purple-700'],
  ] as const)('applies %s variant classes', (variant, bg, text) => {
    render(<Badge variant={variant}>Label</Badge>);
    const badge = screen.getByText('Label');
    expect(badge.className).toContain(bg);
    expect(badge.className).toContain(text);
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class">Tag</Badge>);
    expect(screen.getByText('Tag').className).toContain('custom-class');
  });

  it('renders as a span', () => {
    render(<Badge>Tag</Badge>);
    expect(screen.getByText('Tag').tagName).toBe('SPAN');
  });
});
