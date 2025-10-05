import { useMemo } from 'react';

import log from '@/lib/logger';
import type { Payment } from '@/lib/types';

export function usePaymentFilters(payments: Payment[], filterMonth: string) {
  const { filteredPayments, paymentMonths } = useMemo(() => {
    try {
      // Filter payments based on month
      const filtered = filterMonth === 'all' 
        ? payments 
        : payments.filter(payment => payment.monthYear === filterMonth);
      
      // Extract unique months
      const months = Array.from(
        new Set(payments.map(payment => payment.monthYear).filter(Boolean))
      ).sort().reverse() as string[];
      
      return { filteredPayments: filtered, paymentMonths: months };
    } catch (error) {
      log.error('Error filtering payments:', error);
      return { filteredPayments: [], paymentMonths: [] };
    }
  }, [payments, filterMonth]); // Only recompute when payments or filterMonth changes

  return { filteredPayments, paymentMonths };
}