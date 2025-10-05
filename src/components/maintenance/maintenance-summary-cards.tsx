import { CheckCircle2, Hammer, User } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceSummaryCardsProps {
  upcomingCount: number;
  completedCount: number;
  activeVendorsCount: number;
}

export function MaintenanceSummaryCards({
  upcomingCount,
  completedCount,
  activeVendorsCount,
}: MaintenanceSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
      <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active & Upcoming
          </CardTitle>
          <Hammer className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{upcomingCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Tasks requiring attention</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recently Completed
          </CardTitle>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{completedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Tasks finished this month</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Vendors
          </CardTitle>
          <User className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{activeVendorsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Available for work</p>
        </CardContent>
      </Card>
    </div>
  );
}
