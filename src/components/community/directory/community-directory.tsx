import * as React from 'react';

import type { Apartment, User } from '@/lib/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CommunityDirectoryProps {
    users: User[];
    apartments: Apartment[];
}

export function CommunityDirectory({ users, apartments }: CommunityDirectoryProps) {
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
    );
}
