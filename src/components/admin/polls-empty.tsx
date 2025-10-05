import { BarChart3 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function PollsEmpty() {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active polls</p>
          <p className="text-sm mt-1">Create a poll to see it listed here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
