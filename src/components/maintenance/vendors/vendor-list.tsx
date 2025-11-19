'use client';

import { Trash2 } from 'lucide-react';

import React, { useMemo, useState } from 'react';

import { Vendor } from '@/lib/core/types';
import { DEBOUNCE_CONFIG, DEBOUNCE_OPTIONS } from '@/lib/utils';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';

import { filterVendors } from './vendor-filter';
import RatingStars from './vendor-rating-stars';
import StatusBadge from './vendor-status-badge';

export function getVendorHighlightClasses(vendorId: string, highlightVendorId?: string | null) {
  if (!highlightVendorId || vendorId !== highlightVendorId) return '';
  return 'animate-pulse-once bg-primary/5 ring-1 ring-primary/40';
}

interface VendorListProps {
  vendors: Vendor[];
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  highlightVendorId?: string | null;
  isAdmin?: boolean;
}

export function VendorList({
  vendors,
  onAdd,
  onEdit,
  onDelete,
  highlightVendorId,
  isAdmin = false,
}: VendorListProps) {
  const [search, setSearch] = useState('');
  // Leading edge gives instant first character filtering; trailing handles subsequent pauses
  const debouncedSearch = useDebounce(
    search,
    DEBOUNCE_CONFIG.VENDOR_SEARCH_DELAY,
    DEBOUNCE_OPTIONS.SEARCH
  );
  const [showInactive, setShowInactive] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation(); // Prevent triggering the row click (edit)
    setVendorToDelete(vendor);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (vendorToDelete && onDelete) {
      onDelete(vendorToDelete);
      toast({
        title: 'Vendor Deleted',
        description: `${vendorToDelete.name} has been removed successfully.`,
      });
    }
    setShowDeleteDialog(false);
    setVendorToDelete(null);
  };

  const filtered = useMemo(
    () => filterVendors(vendors, debouncedSearch, showInactive),
    [vendors, debouncedSearch, showInactive]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold tracking-tight text-base md:text-lg">Vendor Directory</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, service, phone…"
                aria-label="Search vendors"
                className="w-full rounded-md border bg-background/60 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Show inactive
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onAdd} className="self-start md:self-auto">
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block rounded-lg border bg-background/50 shadow-sm">
        <div className="overflow-x-auto rounded-lg scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground sticky top-0 z-10">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-medium">Name</th>
                <th className="px-3 py-3 text-left font-medium">Service</th>
                <th className="px-3 py-3 text-left font-medium">Rating</th>
                <th className="px-3 py-3 text-left font-medium">Contact</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                {isAdmin && onDelete && (
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr
                  key={v.id}
                  className={`group border-t border-border/60 hover:bg-muted/40 cursor-pointer transition-colors ${getVendorHighlightClasses(v.id, highlightVendorId)}`}
                  onClick={() => onEdit(v)}
                >
                  <td className="py-3 pl-4 pr-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[180px]" title={v.name}>
                        {v.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                    {v.serviceType}
                  </td>
                  <td className="px-3 py-3">
                    <RatingStars rating={v.rating} />
                  </td>
                  <td className="px-3 py-3 space-y-1">
                    {v.phone && <div className="font-medium">{v.phone}</div>}
                    {v.email && (
                      <div
                        className="text-[11px] text-muted-foreground truncate max-w-[160px]"
                        title={v.email}
                      >
                        {v.email}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge active={!!v.isActive} />
                  </td>
                  {isAdmin && onDelete && (
                    <td className="px-3 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => handleDeleteClick(e, v)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete vendor ${v.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin && onDelete ? 6 : 5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {vendors.length === 0 ? 'No vendors' : 'No results match your search'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card Grid */}
      <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(v => (
          <div
            key={v.id}
            className={`group relative rounded-lg border bg-background/60 p-4 text-left shadow-sm transition-all hover:bg-muted/40`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`space-y-2 flex-1 min-w-0 cursor-pointer ${getVendorHighlightClasses(v.id, highlightVendorId)}`}
                onClick={() => onEdit(v)}
                role="button"
                tabIndex={0}
                aria-label={`Edit vendor ${v.name}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium text-sm md:text-base truncate" title={v.name}>
                    {v.name}
                  </h4>
                  <StatusBadge active={!!v.isActive} />
                  {isAdmin && onDelete && (
                    <div className="ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(e, v);
                        }}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete vendor ${v.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="uppercase tracking-wide rounded bg-primary/10 px-1.5 py-0.5 text-primary/80 dark:text-primary/70">
                      {v.serviceType || '—'}
                    </span>
                  </span>
                  <RatingStars rating={v.rating} />
                </div>
                {(v.phone || v.email) && (
                  <div className="space-y-1 text-xs">
                    {v.phone && <div className="font-medium text-foreground">{v.phone}</div>}
                    {v.email && (
                      <div className="text-muted-foreground truncate" title={v.email}>
                        {v.email}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <svg
                className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M7 5l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground rounded-lg border bg-background/40">
            {vendors.length === 0 ? 'No vendors' : 'No results match your search'}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {vendorToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default VendorList;
