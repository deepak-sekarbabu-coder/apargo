'use client';

import { format } from 'date-fns';
import { PieChart as LucidePieChart } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import * as React from 'react';

import type { Category, Expense } from '@/lib/types';

import { CategoryIcon } from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsViewProps {
  expenses: Expense[];
  categories: Category[];
  analyticsMonth: string;
  setAnalyticsMonth: (month: string) => void;
  expenseMonths: string[];
  analyticsData: {
    categorySpending: Array<{
      name: string;
      total: number;
      fill: string;
      categoryId?: string;
    }>;
    monthlySpending: Array<{
      name: string;
      total: number;
    }>;
  };
}

export function AnalyticsView({
  expenses,
  categories,
  analyticsMonth,
  setAnalyticsMonth,
  expenseMonths,
  analyticsData,
}: AnalyticsViewProps) {
  const hasData = expenses.length > 0;
  const filteredData = analyticsData.categorySpending.filter(item => item.total > 0);

  return (
    <div className="grid gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
      {/* Month Filter */}
      <Card className="w-full max-w-full overflow-x-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Analytics Filters</CardTitle>
          <CardDescription className="text-sm">
            Filter your spending analytics by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <label htmlFor="analytics-month" className="text-sm font-medium whitespace-nowrap">
                Month:
              </label>
              <Select value={analyticsMonth} onValueChange={setAnalyticsMonth}>
                <SelectTrigger className="w-full sm:w-[180px]" id="analytics-month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {expenseMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {format(new Date(month + '-01'), 'MMMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {analyticsMonth !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalyticsMonth('all')}
                className="w-full sm:w-auto"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!hasData ? (
        <Card className="w-full max-w-full overflow-x-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LucidePieChart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Add some expenses to see analytics and spending insights for your apartment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid gap-4 sm:gap-6 w-full max-w-full">
            <Card className="w-full max-w-full overflow-x-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Spending by Category</CardTitle>
                <CardDescription className="text-sm">
                  A breakdown of expenses by category
                  {analyticsMonth !== 'all'
                    ? ` for ${format(new Date(analyticsMonth + '-01'), 'MMMM yyyy')}`
                    : ' for your apartment'}
                  .
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 w-full max-w-full overflow-x-auto">
                {filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 w-full">
                    <p className="text-sm text-muted-foreground">
                      No expenses found for the selected period.
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={{}}
                    className="h-[250px] sm:h-[300px] lg:h-[350px] w-full min-w-[280px] max-w-full overflow-x-auto"
                  >
                    <PieChart accessibilityLayer>
                      <RechartsTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => [`₹${value}`, name]}
                          />
                        }
                      />
                      <Pie
                        data={filteredData}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {filteredData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || 'hsl(var(--primary))'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}

                {/* Category Legend with Icons */}
                {filteredData.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Categories</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredData.map(item => {
                        const category = categories.find(cat => cat.name === item.name);
                        return (
                          <div
                            key={item.name}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                          >
                            {/* colored swatch */}
                            <div
                              className="h-5 w-5 rounded-full flex-shrink-0"
                              style={{ background: item.fill || 'hsl(var(--primary))' }}
                              aria-hidden
                            />
                            {category?.icon && (
                              <CategoryIcon
                                name={category.icon}
                                className="h-5 w-5 flex-shrink-0 ml-2"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{item.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="w-full max-w-full overflow-x-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Spending Over Time</CardTitle>
                <CardDescription className="text-sm">
                  Total expenses over the last 6 months for your apartment.
                  {analyticsMonth !== 'all' &&
                    ' (Category breakdown filtered by selected month above)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 w-full max-w-full overflow-x-auto">
                {analyticsData.monthlySpending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 w-full">
                    <p className="text-sm text-muted-foreground">
                      No spending data available for the time period.
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      total: {
                        label: 'Total Spending',
                        color: 'hsl(var(--primary))',
                      },
                    }}
                    className="h-[250px] sm:h-[300px] lg:h-[350px] w-full min-w-[280px] max-w-full overflow-x-auto"
                  >
                    <BarChart data={analyticsData.monthlySpending} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        fontSize={11}
                        height={40}
                        interval={0}
                        tick={props => {
                          // Custom tick: month on first line, year on second
                          const { x, y, payload } = props;
                          const date = new Date(payload.value + '-01');
                          const month = date.toLocaleString('default', { month: 'short' });
                          const year = date.getFullYear();
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text
                                x={0}
                                y={0}
                                dy={8}
                                textAnchor="middle"
                                fill="#888"
                                fontSize="11"
                                suppressHydrationWarning={true}
                              >
                                {month}
                              </text>
                              <text
                                x={0}
                                y={0}
                                dy={22}
                                textAnchor="middle"
                                fill="#bbb"
                                fontSize="10"
                              >
                                {year}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={value => `₹${value}`}
                      />
                      <RechartsTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => [`₹${value}`, name]}
                          />
                        }
                      />
                      <Bar
                        dataKey="total"
                        fill="hsl(var(--primary))"
                        radius={8}
                        name="Total Spending"
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsView;
