/**
 * RegisterPage now returns null (registration is invite-only).
 * Tests for accepting an invitation are in AcceptInvitePage.test.tsx.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RegisterPage } from '@/pages/RegisterPage';

describe('RegisterPage', () => {
  it('renders nothing (invite-only system)', () => {
    const { container } = render(<RegisterPage />);
    expect(container.firstChild).toBeNull();
  });
});
