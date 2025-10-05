import { Users, Vote } from 'lucide-react';

import * as React from 'react';

import type { Apartment, PollOption, User } from '@/lib/types';

import { AddPollDialog } from '@/components/dialogs/add-poll-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CommunityPolls } from './community-polls';

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

  const grouped = React.useMemo(() => {
    const map: Record<string, Apartment & { users: User[] }> = {};
    apartments.forEach(apt => {
      map[apt.id] = { ...apt, users: [] };
    });
    users.forEach(user => {
      if (user.apartment && map[user.apartment]) {
        map[user.apartment].users.push(user);
      }
    });
    return Object.values(map);
  }, [users, apartments]);

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
          <Card>
            <CardHeader>
              <CardTitle>Community Directory</CardTitle>
              <CardDescription>See all apartments and their residents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped.map(apartment => (
                  <div key={apartment.id} className="border rounded-lg p-4 bg-muted">
                    <h3 className="font-semibold text-lg mb-2">{apartment.name}</h3>
                    <ul className="space-y-2">
                      {apartment.users.length === 0 ? (
                        <li className="text-muted-foreground text-sm">No residents</li>
                      ) : (
                        apartment.users.map(user => (
                          <li key={user.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>
                                {user.name ? user.name.charAt(0) : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-base" aria-label="Resident Name">
                                {user.name || (
                                  <span className="italic text-muted-foreground">Unnamed</span>
                                )}
                              </span>
                              <span
                                className="text-xs text-muted-foreground"
                                aria-label="Property Role"
                              >
                                {user.propertyRole || <span className="italic">No role</span>}
                              </span>
                              <span
                                className="text-xs text-muted-foreground"
                                aria-label="Phone Number"
                              >
                                {user.phone ? user.phone : <span className="italic">No phone</span>}
                              </span>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
