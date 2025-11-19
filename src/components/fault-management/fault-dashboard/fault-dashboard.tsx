'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  TrendingUp,
  UserPlus,
  Wrench,
} from 'lucide-react';

import React, { useMemo, useState } from 'react';

import type { Fault, FaultSeverity, FaultStatus, User } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FaultDashboardProps {
  faults: Fault[];
  users: User[];
  onUpdateStatus: (id: string, status: FaultStatus) => void;
  onUpdateSeverity: (id: string, severity: FaultSeverity) => void;
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

export function FaultDashboard({
  faults,
  users,
  onUpdateStatus,
  onUpdateSeverity,
  isAdmin,
}: FaultDashboardProps) {
  // Pagination state for Recent Faults
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const stats = useMemo(() => {
    const openFaults = faults.filter(f => f.status === 'open');
    const inProgressFaults = faults.filter(f => f.status === 'in_progress');
    const resolvedFaults = faults.filter(f => f.status === 'resolved' || f.status === 'closed');

    const criticalFaults = faults.filter(
      f => f.severity === 'critical' && f.status !== 'resolved' && f.status !== 'closed'
    );
    const warningFaults = faults.filter(
      f => f.severity === 'warning' && f.status !== 'resolved' && f.status !== 'closed'
    );
    const lowFaults = faults.filter(
      f => f.severity === 'low' && f.status !== 'resolved' && f.status !== 'closed'
    );

    const totalActiveFaults = openFaults.length + inProgressFaults.length;
    const resolutionRate = faults.length > 0 ? (resolvedFaults.length / faults.length) * 100 : 0;

    return {
      total: faults.length,
      open: openFaults.length,
      inProgress: inProgressFaults.length,
      resolved: resolvedFaults.length,
      critical: criticalFaults.length,
      warning: warningFaults.length,
      low: lowFaults.length,
      totalActive: totalActiveFaults,
      resolutionRate,
    };
  }, [faults]);

  const sortedFaults = useMemo(() => {
    return [...faults].sort(
      (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }, [faults]);

  const totalPages = Math.ceil(sortedFaults.length / itemsPerPage);

  const paginatedFaults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedFaults.slice(startIndex, endIndex);
  }, [sortedFaults, currentPage, itemsPerPage]);

  const recentFaults = useMemo(() => {
    return paginatedFaults;
  }, [paginatedFaults]);

  const getSeverityIcon = (severity: FaultSeverity) => {
    const IconComponent = severityIcons[severity];
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusIcon = (status: FaultStatus) => {
    const IconComponent = statusIcons[status];
    return <IconComponent className="h-4 w-4" />;
  };

  const getAssignedUserName = (userId?: string): string => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when faults change significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium">Total Faults</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.totalActive} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently being resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.resolutionRate.toFixed(1)}%
            </div>
            <Progress value={stats.resolutionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Active Faults by Severity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="flex items-center justify-between sm:justify-start space-x-2 p-3 sm:p-0 bg-red-50 dark:bg-red-950/30 sm:bg-transparent sm:dark:bg-transparent rounded-lg sm:rounded-none">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-sm font-medium">Critical</span>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.critical}</Badge>
            </div>
            <div className="flex items-center justify-between sm:justify-start space-x-2 p-3 sm:p-0 bg-yellow-50 dark:bg-yellow-950/30 sm:bg-transparent sm:dark:bg-transparent rounded-lg sm:rounded-none">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0" />
                <span className="text-sm font-medium">Warning</span>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.warning}</Badge>
            </div>
            <div className="flex items-center justify-between sm:justify-start space-x-2 p-3 sm:p-0 bg-green-50 dark:bg-green-950/30 sm:bg-transparent sm:dark:bg-transparent rounded-lg sm:rounded-none">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-sm font-medium">Low</span>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.low}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Faults */}
      <Card>
        <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-base sm:text-lg">Recent Faults</CardTitle>
            {sortedFaults.length > 0 && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedFaults.length)}-
                {Math.min(currentPage * itemsPerPage, sortedFaults.length)} of {sortedFaults.length}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {sortedFaults.length === 0 ? (
            <p className="text-muted-foreground">No faults reported yet.</p>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {recentFaults.map(fault => (
                  <div
                    key={fault.id}
                    className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:space-x-4 border-b pb-3 sm:pb-4 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <Badge className={`${severityColors[fault.severity]} text-xs`}>
                          {getSeverityIcon(fault.severity)}
                          <span className="ml-1 capitalize">{fault.severity}</span>
                        </Badge>
                        <Badge variant="outline" className={`${statusColors[fault.status]} text-xs`}>
                          {getStatusIcon(fault.status)}
                          <span className="ml-1 capitalize">{fault.status.replace('_', ' ')}</span>
                        </Badge>
                        {fault.assignedTo && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">
                              {getAssignedUserName(fault.assignedTo)}
                            </span>
                            <span className="sm:hidden">Assigned</span>
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-medium mb-1 line-clamp-1">{fault.location}</h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2 sm:line-clamp-1">{fault.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                        <p className="text-xs text-muted-foreground">
                          Reported {new Date(fault.reportedAt).toLocaleDateString()}
                        </p>
                        {fault.assignedTo && (
                          <p className="text-xs text-blue-600 font-medium sm:hidden">
                            {getAssignedUserName(fault.assignedTo)}
                          </p>
                        )}
                      </div>
                    </div>

                    {isAdmin && (fault.status === 'open' || fault.status === 'in_progress') && (
                      <div className="flex flex-row sm:flex-col gap-2 min-w-0 w-full sm:w-auto">
                        <Select
                          value={fault.status}
                          onValueChange={(value: FaultStatus) => onUpdateStatus(fault.id, value)}
                        >
                          <SelectTrigger className="flex-1 sm:flex-none sm:w-32 h-9 sm:h-8 text-xs">
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
                            onUpdateSeverity(fault.id, value)
                          }
                        >
                          <SelectTrigger className="flex-1 sm:flex-none sm:w-32 h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 sm:mt-6 border-t pt-3 sm:pt-4">
                  <div className="flex flex-col items-center space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
                    {/* Page info - mobile */}
                    <div className="text-xs sm:text-sm text-muted-foreground sm:hidden order-1">
                      Page {currentPage} of {totalPages}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-center space-x-2 w-full sm:w-auto order-2 sm:order-none">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="h-9 px-3 sm:h-9 sm:w-auto sm:px-3"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="ml-1">Previous</span>
                      </Button>

                      {/* Page numbers - hidden on mobile, visible on larger screens */}
                      <div className="hidden sm:flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageClick(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="h-9 px-3 sm:h-9 sm:w-auto sm:px-3"
                      >
                        <span className="mr-1">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Page info - desktop */}
                    <div className="hidden sm:block text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
