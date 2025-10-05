import { getVendorHighlightClasses } from '@/components/maintenance/vendor-list';

describe('getVendorHighlightClasses', () => {
  it('returns empty string when no highlight id', () => {
    expect(getVendorHighlightClasses('a', null)).toBe('');
  });
  it('returns empty string when vendor id does not match', () => {
    expect(getVendorHighlightClasses('a', 'b')).toBe('');
  });
  it('returns highlight classes when ids match', () => {
    const cls = getVendorHighlightClasses('a', 'a');
    expect(cls).toMatch(/animate-pulse-once/);
    expect(cls).toMatch(/ring-primary/);
  });
});
