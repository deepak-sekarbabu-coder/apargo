import { Users, Vote } from 'lucide-react';

import * as React from 'react';

import type { Apartment, PollOption, User } from '@/lib/types';

import { AddPollDialog } from '@/components/dialogs/add-poll-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CommunityDirectory } from './directory/community-directory';
import { CommunityPolls } from './polls/community-polls';

interface CommunityViewProps {
  users: User[];
  apartments: Apartment[];
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
  initialTab?: 'directory' | 'polls';
}

export function CommunityView({
  users,
  apartments,
  onAddPoll,
  initialTab = 'directory',
}: CommunityViewProps) {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  return (
    <div className="space-y-6">
      {/* Community Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as 'directory' | 'polls')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="directory">
            <Users className="w-4 h-4 mr-2" />
            Community Directory
          </TabsTrigger>
          <TabsTrigger value="polls">
            <Vote className="w-4 h-4 mr-2" />
            Polls
          </TabsTrigger>
        </TabsList>

        {/* Community Directory Tab */}
        <TabsContent value="directory" className="space-y-4">
          <CommunityDirectory users={users} apartments={apartments} />
        </TabsContent>

        {/* Polls Tab */}
        <TabsContent value="polls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Community Polls</CardTitle>
                  <CardDescription>
                    Create and participate in community polls to make decisions together.
                  </CardDescription>
                </div>
                <AddPollDialog onAddPoll={onAddPoll} />
              </div>
            </CardHeader>
            <CardContent>
              <CommunityPolls apartments={apartments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
