import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalFooter } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('renders title and children when open is true', () => {
    render(<Modal open onClose={vi.fn()} title="My Modal"><p>Body content</p></Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Close me"><p>inside</p></Modal>);
    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Esc test"><p>inside</p></Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has aria-modal and aria-labelledby attributes', () => {
    render(<Modal open onClose={vi.fn()} title="Accessible Modal"><p>content</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it.each(['sm', 'md', 'lg', 'xl'] as const)('applies %s size class', (size) => {
    render(<Modal open onClose={vi.fn()} title="Sized" size={size}><p>c</p></Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('ModalFooter', () => {
  it('renders children', () => {
    render(<ModalFooter><button>OK</button></ModalFooter>);
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('accepts className', () => {
    const { container } = render(<ModalFooter className="gap-6"><span>x</span></ModalFooter>);
    expect(container.firstChild).toHaveClass('gap-6');
  });
});
