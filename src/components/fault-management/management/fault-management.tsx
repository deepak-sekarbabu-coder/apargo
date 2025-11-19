'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  File,
  Info,
  Plus,
  UserPlus,
} from 'lucide-react';

import React, { useState } from 'react';

import Image from 'next/image';

import type { Fault, FaultSeverity, FaultStatus, User } from '@/lib/core/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useDebounce } from '@/hooks/use-debounce';

import { FaultReportingForm } from './fault-reporting-form';

interface FaultManagementProps {
  faults: Fault[];
  users: User[];
  onUpdateFault: (id: string, updates: Partial<Fault>) => void;
  onDeleteFault: (id: string) => void;
  onMarkFixed: (id: string) => void;
  onFaultReported: () => void;
  isAdmin: boolean;
}

// Severity color mapping
const severityColors = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  low: Info,
};

// Status color mapping
const statusColors = {
  open: 'bg-red-100 text-red-800 border-red-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

export function FaultManagement({
  faults,
  users,
  onUpdateFault,
  onDeleteFault,
  onMarkFixed,
  onFaultReported,
  isAdmin,
}: FaultManagementProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | FaultSeverity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [expandedFaults, setExpandedFaults] = useState<Set<string>>(new Set());

  const getSeverityIcon = (severity: FaultSeverity) => {
    const IconComponent = severityIcons[severity];
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusIcon = (status: FaultStatus) => {
    const IconComponent = statusIcons[status];
    return <IconComponent className="h-4 w-4" />;
  };

  const toggleExpanded = (faultId: string) => {
    setExpandedFaults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faultId)) {
        newSet.delete(faultId);
      } else {
        newSet.add(faultId);
      }
      return newSet;
    });
  };

  const filteredFaults = faults.filter(fault => {
    // Status filter
    if (filter !== 'all' && fault.status !== filter) {
      return false;
    }

    // Severity filter
    if (severityFilter !== 'all' && fault.severity !== severityFilter) {
      return false;
    }

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      return (
        fault.location.toLowerCase().includes(query) ||
        fault.description.toLowerCase().includes(query) ||
        fault.notes?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleUpdateStatus = (faultId: string, status: FaultStatus) => {
    const updates: Partial<Fault> = { status };

    if (status === 'resolved' || status === 'closed') {
      updates.fixed = true;
      updates.resolvedAt = new Date().toISOString();
      const fault = faults.find(f => f.id === faultId);
      if (!fault?.fixedAt) {
        updates.fixedAt = new Date().toISOString();
      }
    } else {
      updates.fixed = false;
      updates.resolvedAt = undefined;
    }

    onUpdateFault(faultId, updates);
  };

  const handleUpdateSeverity = (faultId: string, severity: FaultSeverity) => {
    onUpdateFault(faultId, { severity });
  };

  const handleAssignUser = (faultId: string, userId: string | null) => {
    const updates: Partial<Fault> = {
      assignedTo: userId || undefined,
      updatedAt: new Date().toISOString(),
    };

    // Auto-update status when assigning/unassigning
    if (userId && !updates.status) {
      const fault = faults.find(f => f.id === faultId);
      if (fault && fault.status === 'open') {
        updates.status = 'in_progress';
      }
    }

    onUpdateFault(faultId, updates);
  };

  const getAssignedUserName = (userId?: string): string => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const isUserAssignedToOtherFault = (userId: string, excludeFaultId: string): boolean => {
    return faults.some(
      fault =>
        fault.id !== excludeFaultId &&
        fault.assignedTo === userId &&
        fault.status !== 'resolved' &&
        fault.status !== 'closed'
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Report vs Manage */}
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="report" className="text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Report Fault
          </TabsTrigger>
          <TabsTrigger value="manage" className="text-sm">
            Manage Faults
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-4 mt-6">
          <FaultReportingForm onReport={onFaultReported} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-4 mt-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fault Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search faults..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <Select
                    value={filter}
                    onValueChange={(value: 'all' | 'open' | 'in_progress' | 'resolved') =>
                      setFilter(value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={severityFilter}
                    onValueChange={(value: 'all' | FaultSeverity) => setSeverityFilter(value)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fault List */}
          <Card>
            <CardHeader>
              <CardTitle>Faults ({filteredFaults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFaults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {faults.length === 0
                      ? 'No faults reported yet.'
                      : 'No faults match the current filters.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFaults.map(fault => (
                    <Collapsible key={fault.id} open={expandedFaults.has(fault.id)}>
                      <div className="border rounded-lg hover:bg-muted/50 transition-colors">
                        {/* Header with quick actions */}
                        <div className="p-4">
                          <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0 lg:space-x-4">
                            <CollapsibleTrigger
                              onClick={() => toggleExpanded(fault.id)}
                              className="flex-1 min-w-0 text-left hover:bg-transparent"
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className={severityColors[fault.severity]}>
                                  {getSeverityIcon(fault.severity)}
                                  <span className="ml-1 capitalize">{fault.severity}</span>
                                </Badge>
                                <Badge variant="outline" className={statusColors[fault.status]}>
                                  {getStatusIcon(fault.status)}
                                  <span className="ml-1 capitalize">
                                    {fault.status.replace('_', ' ')}
                                  </span>
                                </Badge>
                                {fault.assignedTo && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      {getAssignedUserName(fault.assignedTo)}
                                    </span>
                                    <span className="sm:hidden">Assigned</span>
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold truncate">{fault.location}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 sm:truncate">
                                {fault.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Reported {new Date(fault.reportedAt).toLocaleDateString()}
                              </p>
                            </CollapsibleTrigger>

                            {/* Quick Actions - Outside CollapsibleTrigger */}
                            {isAdmin &&
                              (fault.status === 'open' || fault.status === 'in_progress') && (
                                <div className="flex justify-end lg:justify-start">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onMarkFixed(fault.id)}
                                    className="w-full sm:w-auto"
                                  >
                                    Mark Fixed
                                  </Button>
                                </div>
                              )}
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="border-x border-b rounded-b-lg p-4 bg-muted/20">
                            {/* Images */}
                            {fault.images && fault.images.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Attachments</h5>
                                <div className="flex flex-wrap gap-2">
                                  {fault.images.map((fileUrl, i) => {
                                    const isPdf = /\.pdf($|\?)/i.test(fileUrl);
                                    return isPdf ? (
                                      <a
                                        key={i}
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 underline"
                                      >
                                        <File className="h-4 w-4" />
                                        <span>PDF {i + 1}</span>
                                      </a>
                                    ) : (
                                      <Image
                                        key={i}
                                        src={fileUrl}
                                        alt="Fault attachment"
                                        width={100}
                                        height={100}
                                        className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Full Description */}
                            <div className="mb-4">
                              <h5 className="font-medium mb-2">Description</h5>
                              <p className="text-sm">{fault.description}</p>
                            </div>

                            {/* Notes */}
                            {fault.notes && (
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Notes</h5>
                                <p className="text-sm">{fault.notes}</p>
                              </div>
                            )}

                            {/* Assignment Information */}
                            <div className="mb-4">
                              <h5 className="font-medium mb-2">Assignment</h5>
                              <div className="flex items-center space-x-2">
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {fault.assignedTo ? (
                                    <span className="text-blue-600 font-medium">
                                      Responsible : {getAssignedUserName(fault.assignedTo)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Not assigned</span>
                                  )}
                                </span>
                              </div>
                              {fault.updatedAt && fault.assignedTo && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Updated {new Date(fault.updatedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            {/* Admin Controls */}
                            {isAdmin && (
                              <div className="border-t pt-4">
                                <div className="flex flex-col space-y-3">
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <Select
                                      value={fault.status}
                                      onValueChange={(value: FaultStatus) =>
                                        handleUpdateStatus(fault.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>

                                    <Select
                                      value={fault.severity}
                                      onValueChange={(value: FaultSeverity) =>
                                        handleUpdateSeverity(fault.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                      </SelectContent>
                                    </Select>

                                    <Select
                                      value={fault.assignedTo || '__unassign__'}
                                      onValueChange={(value: string) =>
                                        handleAssignUser(
                                          fault.id,
                                          value === '__unassign__' ? null : value
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Assign to..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__unassign__">
                                          <span className="text-muted-foreground">Unassign</span>
                                        </SelectItem>
                                        {users.map(user => {
                                          const isAssignedElsewhere = isUserAssignedToOtherFault(
                                            user.id,
                                            fault.id
                                          );
                                          return (
                                            <SelectItem
                                              key={user.id}
                                              value={user.id}
                                              disabled={isAssignedElsewhere}
                                            >
                                              <div className="flex items-center justify-between w-full">
                                                <span>{user.name}</span>
                                                {isAssignedElsewhere && (
                                                  <span className="text-xs text-orange-500 ml-2">
                                                    (Busy)
                                                  </span>
                                                )}
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onDeleteFault(fault.id)}
                                    className="w-full sm:w-auto sm:self-start"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
