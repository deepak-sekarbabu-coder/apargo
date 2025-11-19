import { Vendor } from '@/lib/core/types';

export function filterVendors(vendors: Vendor[], search: string, showInactive: boolean): Vendor[] {
  const q = search.toLowerCase();
  return vendors.filter(v => {
    if (!showInactive && !v.isActive) return false;
    if (!search) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      (v.serviceType || '').toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q)
    );
  });
}

export default filterVendors;
