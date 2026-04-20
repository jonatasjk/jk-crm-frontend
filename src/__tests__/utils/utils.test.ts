import { describe, it, expect } from 'vitest';
import { cn, formatBytes, formatDate, formatDateTime, mimeTypeIcon } from '@/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skip', 'include')).toBe('base include');
  });

  it('deduplicates tailwind classes (last wins)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles undefined and null', () => {
    expect(cn(undefined, null, 'valid')).toBe('valid');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatBytes', () => {
  it('formats bytes below 1024 as B', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats bytes between 1024 and 1MB as KB', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats bytes above 1MB as MB', () => {
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('formats 0 as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats 1024 bytes as 1.0 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });
});

describe('formatDate', () => {
  it('returns a human-readable date string', () => {
    // Use a midday UTC timestamp to avoid timezone edge-case shifting the day
    const result = formatDate('2024-06-15T12:00:00Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
    // Day may vary ±1 depending on local timezone but year and month must match
    expect(result).toMatch(/1[45]/);
  });

  it('handles ISO strings with time component', () => {
    const result = formatDate('2024-01-20T12:00:00Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });
});

describe('formatDateTime', () => {
  it('includes date and time in output', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(result).toMatch(/2024/);
    // Result should have more content than just the date
    expect(result.length).toBeGreaterThan(10);
  });
});

describe('mimeTypeIcon', () => {
  it('returns PDF icon for application/pdf', () => {
    expect(mimeTypeIcon('application/pdf')).toBe('📄');
  });

  it('returns spreadsheet icon for Excel', () => {
    expect(mimeTypeIcon('application/vnd.ms-excel')).toBe('📊');
    expect(
      mimeTypeIcon(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ),
    ).toBe('📊');
  });

  it('returns presentation icon for PowerPoint', () => {
    expect(mimeTypeIcon('application/vnd.ms-powerpoint')).toBe('📑');
    expect(
      mimeTypeIcon(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ),
    ).toBe('📑');
  });

  it('returns word icon for Word docs', () => {
    expect(mimeTypeIcon('application/msword')).toBe('📝');
    expect(
      mimeTypeIcon(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe('📝');
  });

  it('returns image icon for image types', () => {
    expect(mimeTypeIcon('image/png')).toBe('🖼️');
    expect(mimeTypeIcon('image/jpeg')).toBe('🖼️');
  });

  it('returns generic icon for unknown types', () => {
    expect(mimeTypeIcon('application/octet-stream')).toBe('📎');
    expect(mimeTypeIcon('text/plain')).toBe('📎');
  });
});
