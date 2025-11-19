import { filterVendors } from '@/components/maintenance/vendors/vendor-filter';

const sampleVendors = [
  {
    id: '1',
    name: 'Alpha Services',
    serviceType: 'plumbing',
    rating: 4.2,
    phone: '123',
    email: 'a@test.com',
    isActive: true,
  },
  {
    id: '2',
    name: 'Beta Electrical',
    serviceType: 'electrical',
    rating: 3.8,
    phone: '456',
    email: 'b@test.com',
    isActive: false,
  },
] as any;

describe('filterVendors helper', () => {
  it('excludes inactive by default', () => {
    const result = filterVendors(sampleVendors, '', false);
    expect(result.map(v => v.name)).toEqual(['Alpha Services']);
  });
  it('includes inactive when flag true', () => {
    const result = filterVendors(sampleVendors, '', true);
    expect(result.length).toBe(2);
  });
  it('search matches name/service/phone', () => {
    expect(filterVendors(sampleVendors, 'beta', true).map(v => v.name)).toEqual([
      'Beta Electrical',
    ]);
    expect(filterVendors(sampleVendors, '123', true).map(v => v.name)).toEqual(['Alpha Services']);
  });
});
