'use client';

import { format, isToday, isYesterday, subDays, isThisWeek, isThisMonth } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as LucidePieChart, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  isRealTime?: boolean;
  lastUpdated?: Date;
}

// Real-time analytics utility functions
function calculateSpendingVelocity(expenses: Expense[], days: number = 7): number {
  const cutoffDate = subDays(new Date(), days);
  const recentExpenses = expenses.filter(e => {
    try {
      return e.date && new Date(e.date) >= cutoffDate;
    } catch {
      return false;
    }
  });
  
  return recentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

function calculateTrendIndicator(currentValue: number, previousValue: number): {
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  icon: React.ReactNode;
} {
  if (previousValue === 0) {
    return {
      trend: currentValue > 0 ? 'up' : 'neutral',
      percentage: 0,
      icon: currentValue > 0 ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />
    };
  }
  
  const percentage = ((currentValue - previousValue) / previousValue) * 100;
  const isIncrease = percentage > 5; // 5% threshold for meaningful change
  
  return {
    trend: isIncrease ? 'up' : 'down',
    percentage: Math.abs(percentage),
    icon: isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  };
}

export function AnalyticsView({
  expenses,
  categories,
  analyticsMonth,
  setAnalyticsMonth,
  expenseMonths,
  analyticsData,
  isRealTime = true,
  lastUpdated = new Date(),
}: AnalyticsViewProps) {
  const hasData = expenses.length > 0;
  const filteredData = analyticsData.categorySpending.filter(item => item.total > 0);

  // Real-time analytics calculations
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subDays(new Date(), 30), 'yyyy-MM');
  
  const currentMonthSpending = analyticsData.monthlySpending.find(m => 
    m.name.includes(format(new Date(currentMonth), 'MMM yyyy'))
  )?.total || 0;
  
  const lastMonthSpending = analyticsData.monthlySpending.find(m => 
    m.name.includes(format(new Date(lastMonth), 'MMM yyyy'))
  )?.total || 0;

  const trendIndicator = calculateTrendIndicator(currentMonthSpending, lastMonthSpending);
  const weeklyVelocity = calculateSpendingVelocity(expenses, 7);
  const monthlyVelocity = calculateSpendingVelocity(expenses, 30);

  // Recent activity tracking
  const todayExpenses = expenses.filter(e => {
    try {
      return e.date && isToday(new Date(e.date));
    } catch {
      return false;
    }
  });

  const thisWeekExpenses = expenses.filter(e => {
    try {
      return e.date && isThisWeek(new Date(e.date));
    } catch {
      return false;
    }
  });

  // Real-time data freshness indicator
  const dataAge = new Date().getTime() - lastUpdated.getTime();
  const dataFreshness = dataAge < 60000 ? 'fresh' : dataAge < 300000 ? 'recent' : 'stale';

  const getFreshnessIcon = () => {
    switch (dataFreshness) {
      case 'fresh': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'recent': return <Clock className="h-3 w-3 text-yellow-500" />;
      default: return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
  };

  const getFreshnessText = () => {
    switch (dataFreshness) {
      case 'fresh': return 'Live';
      case 'recent': return 'Recent';
      default: return 'Stale';
    }
  };

  return (
    <div className="grid gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
      {/* Real-time Dashboard Header */}
      <Card className="w-full max-w-full overflow-x-auto">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Analytics Dashboard
                {isRealTime && (
                  <Badge variant="outline" className="ml-2">
                    <div className="flex items-center gap-1">
                      {getFreshnessIcon()}
                      {getFreshnessText()}
                    </div>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                Live spending insights for your apartment with trend analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Real-time Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Current Month Total */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Current Month</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">₹{currentMonthSpending.toFixed(0)}</p>
                <Badge 
                  variant={trendIndicator.trend === 'up' ? 'destructive' : 'secondary'}
                  className="flex items-center gap-1 text-xs"
                >
                  {trendIndicator.icon}
                  {trendIndicator.percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Weekly Velocity */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Weekly Spending</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">₹{weeklyVelocity.toFixed(0)}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  7 days
                </div>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Today</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{todayExpenses.length}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="h-3 w-3 mr-1" />
                  expenses
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">This Week</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">₹{thisWeekExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toFixed(0)}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  total
                </div>
              </div>
            </div>
          </div>

          {/* Month Filter */}
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
          {/* Enhanced Charts Grid */}
          <div className="grid gap-4 sm:gap-6 w-full max-w-full">
            {/* Enhanced Spending by Category with Trend Indicators */}
            <Card className="w-full max-w-full overflow-x-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Category Breakdown & Trends</CardTitle>
                <CardDescription className="text-sm">
                  Real-time spending analysis by category with trend indicators
                  {analyticsMonth !== 'all'
                    ? ` for ${format(new Date(analyticsMonth + '-01'), 'MMMM yyyy')}`
                    : ' for your apartment'}
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
                  <div className="space-y-6">
                    {/* Pie Chart */}
                    <ChartContainer
                      config={{}}
                      className="h-[250px] sm:h-[300px] lg:h-[350px] w-full min-w-[280px] max-w-full overflow-x-auto"
                    >
                      <ResponsiveContainer width="100%" height="100%">
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
                            label={({ name, total }) => total > 0 ? `${name}: ₹${total.toFixed(0)}` : ''}
                          >
                            {filteredData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill || 'hsl(var(--primary))'} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* Enhanced Category Cards with Real-time Indicators */}
                    {filteredData.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredData.map(item => {
                          const category = categories.find(cat => cat.name === item.name);
                          const categoryExpenses = analyticsMonth === 'all' 
                            ? expenses.filter(e => e.categoryId === category?.id)
                            : expenses.filter(e => {
                                try {
                                  return e.categoryId === category?.id && 
                                         e.date && 
                                         format(new Date(e.date), 'yyyy-MM') === analyticsMonth;
                                } catch {
                                  return false;
                                }
                              });
                          
                          const recentExpenses = categoryExpenses.filter(e => {
                            try {
                              return e.date && isThisWeek(new Date(e.date));
                            } catch {
                              return false;
                            }
                          });

                          const percentage = (item.total / filteredData.reduce((sum, cat) => sum + cat.total, 0)) * 100;

                          return (
                            <div
                              key={item.name}
                              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                {category?.icon && (
                                  <CategoryIcon
                                    name={category.icon}
                                    className="h-5 w-5 flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-lg font-bold">₹{item.total.toFixed(0)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                  <Badge variant="outline" className="text-xs">
                                    {recentExpenses.length} recent
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Progress value={percentage} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{recentExpenses.length} this week</span>
                                  <span>{categoryExpenses.length} total</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Spending Over Time with Velocity Tracking */}
            <Card className="w-full max-w-full overflow-x-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Spending Velocity & Trends</CardTitle>
                <CardDescription className="text-sm">
                  Interactive spending analysis with velocity tracking over the last 6 months.
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
                  <div className="space-y-6">
                    {/* Enhanced Chart with Line and Bar combination */}
                    <ChartContainer
                      config={{
                        total: {
                          label: 'Total Spending',
                          color: 'hsl(var(--primary))',
                        },
                        velocity: {
                          label: 'Spending Velocity',
                          color: 'hsl(var(--chart-2))',
                        },
                      }}
                      className="h-[250px] sm:h-[300px] lg:h-[350px] w-full min-w-[280px] max-w-full overflow-x-auto"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.monthlySpending} accessibilityLayer>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={11}
                            height={40}
                            interval={0}
                            tick={props => {
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
                                labelFormatter={label => `Month: ${label}`}
                              />
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stackId="1"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                            strokeWidth={2}
                            name="Total Spending"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* Real-time Insights Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                      {/* Spending Streak */}
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Spending Streak</p>
                        <div className="flex items-center justify-center gap-1">
                          <Activity className="h-4 w-4" />
                          <p className="text-lg font-bold">
                            {analyticsData.monthlySpending.filter(m => m.total > 0).length} months
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">active spending</p>
                      </div>

                      {/* Average Monthly */}
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Monthly Average</p>
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <p className="text-lg font-bold">
                            ₹{(analyticsData.monthlySpending.reduce((sum, m) => sum + m.total, 0) / analyticsData.monthlySpending.length).toFixed(0)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">last 6 months</p>
                      </div>

                      {/* Peak Month */}
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Peak Month</p>
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <p className="text-lg font-bold">
                            {analyticsData.monthlySpending.reduce((max, m) => m.total > max.total ? m : max, { name: '', total: 0 }).name.split(' ')[0]}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ₹{Math.max(...analyticsData.monthlySpending.map(m => m.total)).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
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
