import { useMemo } from 'react';

/**
 * Hook for processing account summary data for display.
 * Separates business calculation logic from UI rendering.
 */
export const useAccountSummary = (loggedInUserBalance: number) => {
  return useMemo(() => {
    const absBalance = Math.abs(loggedInUserBalance);
    const isSettled = absBalance < 0.01;
    const isPositive = loggedInUserBalance >= 0;

    const balanceDisplay = {
      amount: loggedInUserBalance,
      isSettled,
      isPositive,
      formattedAmount: isSettled
        ? '₹0.00'
        : isPositive
        ? `-₹${loggedInUserBalance.toFixed(2)}`
        : `+₹${absBalance.toFixed(2)}`,
      statusText: isSettled
        ? 'You are all settled up.'
        : isPositive
        ? 'Others owe you money.'
        : 'You have outstanding balances.',
    };

    const showReminder = loggedInUserBalance < -0.01;

    return {
      balanceDisplay,
      showReminder,
    };
  }, [loggedInUserBalance]);
};
