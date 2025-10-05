import { Megaphone } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function AnnouncementsEmpty() {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active announcements</p>
          <p className="text-sm mt-1">Create an announcement to see it listed here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
