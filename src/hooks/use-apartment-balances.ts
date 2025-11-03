import { useMemo } from 'react';

/**
 * Hook for processing apartment balance data for display.
 * Separates business calculation logic from UI rendering.
 */
export const useApartmentBalances = (
  apartmentBalances: Record<
    string,
    {
      name: string;
      balance: number;
      owes: Record<string, number>;
      isOwed: Record<string, number>;
    }
  >,
  currentUserApartment?: string
) => {
  return useMemo(() => {
    const currentApartmentBalance = currentUserApartment
      ? apartmentBalances[currentUserApartment]
      : null;

    if (!currentApartmentBalance) {
      return {
        currentBalance: null,
        owedItems: [],
        owesItems: [],
        netBalance: {
          amount: 0,
          isPositive: true,
          displayText: 'Your apartment is owed',
          description: 'in total across all apartments',
        },
      };
    }

    // Process what others owe to the current apartment
    const owedItems = Object.entries(currentApartmentBalance.isOwed)
      .filter(([, amount]) => amount > 0)
      .map(([apartmentId, amount]) => ({
        apartmentId,
        apartmentName: apartmentBalances[apartmentId]?.name || 'Unknown Apartment',
        amount,
        formattedAmount: `₹${amount.toFixed(2)}`,
      }));

    // Process what the current apartment owes to others
    const owesItems = Object.entries(currentApartmentBalance.owes)
      .filter(([, amount]) => amount > 0)
      .map(([apartmentId, amount]) => ({
        apartmentId,
        apartmentName: apartmentBalances[apartmentId]?.name || 'Unknown Apartment',
        amount,
        formattedAmount: `₹${amount.toFixed(2)}`,
      }));

    // Process net balance display
    const balance = currentApartmentBalance.balance;
    const netBalance = {
      amount: Math.abs(balance),
      isPositive: balance >= 0,
      displayText: balance >= 0 ? 'Your apartment is owed' : 'Your apartment owes',
      description: balance >= 0
        ? 'in total across all apartments'
        : 'in total to other apartments',
      formattedAmount: `${balance >= 0 ? '+' : ''}₹${Math.abs(balance).toFixed(2)}`,
    };

    return {
      currentBalance: currentApartmentBalance,
      owedItems,
      owesItems,
      netBalance,
      hasBalances: owedItems.length > 0 || owesItems.length > 0 || balance !== 0,
    };
  }, [apartmentBalances, currentUserApartment]);
};
