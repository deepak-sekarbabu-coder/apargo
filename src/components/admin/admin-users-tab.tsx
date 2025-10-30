import { Pencil, PlusCircle, Search, Trash2, Users, X } from 'lucide-react';

import React, { useState } from 'react';

import type { User } from '@/lib/types';
import { DEBOUNCE_CONFIG, DEBOUNCE_OPTIONS } from '@/lib/utils';

import { AddUserDialog } from '@/components/dialogs/add-user-dialog';
import { EditUserDialog } from '@/components/dialogs/edit-user-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useDebounce } from '@/hooks/use-debounce';
import { useUserFilter } from '@/hooks/use-user-filter';

interface AdminUsersTabProps {
  users: User[];
  onAddUser: (userData: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
}

export function AdminUsersTab({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRejectUser,
}: AdminUsersTabProps) {
  // Local search state - simplified like vendor filtering
  const [localUserSearch, setLocalUserSearch] = useState('');
  const debouncedLocalSearch = useDebounce(
    localUserSearch,
    DEBOUNCE_CONFIG.USER_SEARCH_DELAY,
    DEBOUNCE_OPTIONS.SEARCH // Use SEARCH preset for instant first character filtering like vendor search
  );

  // Track if search is being debounced for loading state
  const isSearching = localUserSearch !== debouncedLocalSearch;

  // Filter users locally like vendor filtering
  const localFilteredUsers = useUserFilter(users, debouncedLocalSearch);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Add, edit, or remove users from the system.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 pr-8 w-full sm:w-[200px] lg:w-[300px] admin-mobile-input"
                value={localUserSearch}
                onChange={e => setLocalUserSearch(e.target.value)}
              />
              {isSearching && (
                <Spinner className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              {localUserSearch && !isSearching && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => setLocalUserSearch('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <AddUserDialog onAddUser={onAddUser}>
              <Button className="w-full sm:w-auto admin-mobile-action-button">
                <PlusCircle className="mr-2 h-4 w-4" /> Add User
              </Button>
            </AddUserDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Results Summary */}
        {localUserSearch && (
          <div className="mb-4 text-sm text-muted-foreground">
            {localFilteredUsers.length === 0 ? (
              <span>No users found matching "{localUserSearch}"</span>
            ) : (
              <span>
                {localFilteredUsers.length} user{localFilteredUsers.length !== 1 ? 's' : ''} found
                {localFilteredUsers.length !== users.length &&
                  ` (filtered from ${users.length} total)`}
              </span>
            )}
          </div>
        )}

        {/* Mobile Card Layout - Simplified */}
        <div className="block md:hidden space-y-3 overflow-x-hidden">
          {localFilteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-muted-foreground">
                {localUserSearch ? 'No users found' : 'No users available'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {localUserSearch
                  ? `Try adjusting your search term "${localUserSearch}"`
                  : 'Add users to get started with user management'}
              </p>
            </div>
          ) : (
            localFilteredUsers.map(u => (
              <Card key={u.id} className="shadow-sm border-border/60">
                <div className="p-4 space-y-3">
                  {/* User Header - Simplified */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback suppressHydrationWarning={true}>
                        {u.name && typeof u.name === 'string' && u.name.length > 0
                          ? u.name.charAt(0)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{u.name || 'Unnamed User'}</p>
                      <p className="text-xs text-muted-foreground">{u.apartment || 'No apartment'}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {u.role}
                        </Badge>
                        {u.isApproved ? (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            ✓ Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-amber-600">
                            ⏳ Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Streamlined for Mobile */}
                  <div className="space-y-2">
                    {u.isApproved ? (
                      /* Approved User Actions */
                      <div className="flex gap-2">
                        <EditUserDialog user={u} onUpdateUser={onUpdateUser}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-xs"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </EditUserDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete{' '}
                                <strong>{u.name || 'this user'}</strong>'s account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteUser(u.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      /* Pending User Actions */
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => onUpdateUser({ ...u, isApproved: true })}
                          >
                            ✓ Approve
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs text-destructive border-destructive/30"
                              >
                                ✗ Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Application?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently reject{' '}
                                  <strong>{u.name || 'this user'}</strong>'s application.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onRejectUser(u.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Reject Application
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <EditUserDialog user={u} onUpdateUser={onUpdateUser}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit Before Approving
                          </Button>
                        </EditUserDialog>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Apartment</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localFilteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">
                        {localUserSearch ? 'No users found' : 'No users available'}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {localUserSearch
                          ? `Try adjusting your search term "${localUserSearch}"`
                          : 'Add users to get started with user management'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                localFilteredUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar} alt={u.name} />
                          <AvatarFallback suppressHydrationWarning={true}>
                            {u.name && typeof u.name === 'string' && u.name.length > 0
                              ? u.name.charAt(0)
                              : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.name || 'Unnamed User'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.apartment || 'N/A'}</TableCell>
                    <TableCell>{u.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                        {u.propertyRole && (
                          <Badge variant="outline" className="capitalize">
                            {u.propertyRole}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.isApproved ? (
                        <Badge variant="default">Approved</Badge>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onUpdateUser({ ...u, isApproved: true })}
                          >
                            Approve
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject User Application?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently reject and remove{' '}
                                  <strong>{u.name || 'this user'}</strong>'s application.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onRejectUser(u.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Reject Application
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditUserDialog user={u} onUpdateUser={onUpdateUser}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </EditUserDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete{' '}
                              <strong>{u.name || 'this user'}</strong>'s account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteUser(u.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
