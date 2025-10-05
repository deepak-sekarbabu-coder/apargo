'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import React from 'react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  isLoading?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  isLoading = false,
  className,
  'aria-label': ariaLabel = 'Pagination Navigation',
}: PaginationProps) {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();
  const showFirstPage = visiblePages[0] > 1;
  const showLastPage = visiblePages[visiblePages.length - 1] < totalPages;
  const showFirstEllipsis = visiblePages[0] > 2;
  const showLastEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className={cn('flex items-center justify-center space-x-1', className)}
    >
      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Go to previous page"
          className="h-8 w-8 p-0 lg:h-9 lg:w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <>
            {/* First Page */}
            {showFirstPage && (
              <>
                <Button
                  variant={1 === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={isLoading}
                  aria-label="Go to page 1"
                  aria-current={1 === currentPage ? 'page' : undefined}
                  className="h-8 w-8 p-0 lg:h-9 lg:w-9"
                >
                  1
                </Button>
                {showFirstEllipsis && (
                  <span className="flex h-8 w-8 items-center justify-center lg:h-9 lg:w-9">…</span>
                )}
              </>
            )}

            {/* Visible Pages */}
            {visiblePages.map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className="h-8 w-8 p-0 lg:h-9 lg:w-9"
              >
                {page}
              </Button>
            ))}

            {/* Last Page */}
            {showLastPage && (
              <>
                {showLastEllipsis && (
                  <span className="flex h-8 w-8 items-center justify-center lg:h-9 lg:w-9">…</span>
                )}
                <Button
                  variant={totalPages === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={isLoading}
                  aria-label={`Go to page ${totalPages}`}
                  aria-current={totalPages === currentPage ? 'page' : undefined}
                  className="h-8 w-8 p-0 lg:h-9 lg:w-9"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </>
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Go to next page"
          className="h-8 w-8 p-0 lg:h-9 lg:w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Info - Optional text display */}
      <div className="hidden text-sm text-muted-foreground sm:block ml-4">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
}

// Simple Previous/Next only pagination for minimal UI
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className,
  'aria-label': ariaLabel = 'Pagination Navigation',
}: Pick<
  PaginationProps,
  'currentPage' | 'totalPages' | 'onPageChange' | 'isLoading' | 'className' | 'aria-label'
>) {
  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className={cn('flex items-center justify-between space-x-2', className)}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        aria-label="Go to previous page"
        className="flex-1 sm:flex-none"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        aria-label="Go to next page"
        className="flex-1 sm:flex-none"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  );
}
