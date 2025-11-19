'use client';

import React, { useMemo } from 'react';

import { MaintenanceBudget } from '@/lib/types';

interface BudgetSummaryProps {
  budget?: MaintenanceBudget | null;
  onConfigure: () => void;
}

export function BudgetSummary({ budget, onConfigure }: BudgetSummaryProps) {
  const categoryRows = useMemo(() => {
    if (!budget) return [] as { category: string; allocated: number; spent: number }[];
    const categories = new Set<string>([
      ...Object.keys(budget.allocatedByCategory || {}),
      ...Object.keys(budget.spentByCategory || {}),
    ]);
    return Array.from(categories).map(cat => ({
      category: cat,
      allocated: budget.allocatedByCategory[cat] || 0,
      spent: budget.spentByCategory[cat] || 0,
    }));
  }, [budget]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Budget Summary</h3>
        <button onClick={onConfigure} className="px-3 py-2 rounded bg-primary text-white text-sm">
          Configure
        </button>
      </div>
      {!budget && (
        <div className="text-sm text-muted-foreground">No budget configured. Click Configure.</div>
      )}
      {budget && (
        <div className="space-y-4">
          <div className="text-sm flex flex-wrap gap-4">
            <div>
              Year: <span className="font-medium">{budget.year}</span>
            </div>
            <div>
              Allocated: <span className="font-medium">₹{budget.totalBudget.toFixed(2)}</span>
            </div>
            <div>
              Spent: <span className="font-medium">₹{budget.totalSpent.toFixed(2)}</span>
            </div>
            <div>
              Remaining:{' '}
              <span className="font-medium">
                ₹{(budget.totalBudget - budget.totalSpent).toFixed(2)}
              </span>
            </div>
          </div>
          <table className="w-full text-sm border">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">Allocated</th>
                <th className="text-left p-2">Spent</th>
                <th className="text-left p-2">Remaining</th>
                <th className="text-left p-2">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map(row => {
                const utilization = row.allocated ? (row.spent / row.allocated) * 100 : 0;
                return (
                  <tr key={row.category} className="border-t">
                    <td className="p-2 font-medium">{row.category}</td>
                    <td className="p-2">₹{row.allocated.toFixed(2)}</td>
                    <td className="p-2">₹{row.spent.toFixed(2)}</td>
                    <td className="p-2">₹{(row.allocated - row.spent).toFixed(2)}</td>
                    <td className="p-2 w-48">
                      <div className="w-full h-2 bg-muted rounded">
                        <div
                          className="h-2 rounded bg-blue-500"
                          style={{ width: `${Math.min(100, utilization).toFixed(1)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {utilization.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categoryRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No categories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default BudgetSummary;
