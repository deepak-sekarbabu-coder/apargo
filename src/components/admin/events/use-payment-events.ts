import React, { useState } from 'react';

import type { Payment } from '@/lib/core/types';

export function usePaymentEvents(payments: Payment[] = []) {
  const [monthsToLoad, setMonthsToLoad] = useState(6);

  const allPaymentEvents = React.useMemo(() => {
    return payments.filter(p => {
      const isIncome = p.category === 'income';
      const isMaintenance =
        p.reason?.includes('Monthly maintenance fee') ||
        p.reason?.toLowerCase().includes('maintenance') ||
        !p.expenseId;
      return isIncome && isMaintenance;
    });
  }, [payments]);

  const paymentEventsHistoryData = React.useMemo(() => {
    // Group payment events by monthYear
    const map: Record<string, typeof allPaymentEvents> = {};
    allPaymentEvents.forEach(pe => {
      map[pe.monthYear] = map[pe.monthYear] || [];
      map[pe.monthYear].push(pe);
    });
    // Get sorted months descending
    const months = Object.keys(map).sort((a, b) => b.localeCompare(a));
    const limitedMonths = months.slice(0, monthsToLoad);
    return limitedMonths.map(monthYear => {
      const paymentEvents = map[monthYear];
      const totalAmount = paymentEvents.reduce((s, p) => s + p.amount, 0);
      const paidEvents = paymentEvents.filter(p => p.status === 'paid' || p.status === 'approved');
      const paidAmount = paidEvents.reduce((s, p) => s + p.amount, 0);
      const pendingAmount = totalAmount - paidAmount;
      return {
        monthYear,
        paymentEvents,
        totalAmount,
        paidAmount,
        pendingAmount,
        paidCount: paidEvents.length,
        pendingCount: paymentEvents.length - paidEvents.length,
      };
    });
  }, [allPaymentEvents, monthsToLoad]);

  const handleLoadMoreMonths = () => setMonthsToLoad(prev => prev + 6);

  return {
    paymentEventsHistoryData,
    handleLoadMoreMonths,
  };
}
