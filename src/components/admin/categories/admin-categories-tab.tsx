import { Pencil, PlusCircle, Trash2 } from 'lucide-react';

import React from 'react';

import type { Category } from '@/lib/core/types';

import { AddCategoryDialog } from '@/components/dialogs/add-category-dialog';
import { EditCategoryDialog } from '@/components/dialogs/edit-category-dialog';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Icons } from '@/components/icons/icons';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminCategoriesTabProps {
  categories: Category[];
  onAddCategory: (categoryData: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function AdminCategoriesTab({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: AdminCategoriesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Manage expense categories for the group.</CardDescription>
            </div>
            <AddCategoryDialog onAddCategory={onAddCategory}>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </AddCategoryDialog>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li
                  key={cat.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CategoryIcon name={cat.icon as keyof typeof Icons} className="flex-shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="truncate">{cat.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {cat.noSplit && (
                          <Badge variant="secondary" className="text-xs w-fit">
                            No Split
                          </Badge>
                        )}
                        {cat.isPaymentEvent && (
                          <Badge variant="default" className="text-xs w-fit bg-blue-600">
                            Payment Event
                          </Badge>
                        )}
                        {cat.isPaymentEvent && cat.autoGenerate && (
                          <Badge
                            variant="outline"
                            className="text-xs w-fit border-green-600 text-green-600"
                          >
                            Auto-Generate
                          </Badge>
                        )}
                      </div>
                      {cat.isPaymentEvent && (
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {cat.monthlyAmount && <span>Monthly: ₹{cat.monthlyAmount}</span>}
                          {cat.dayOfMonth && (
                            <span>
                              Generated on: {cat.dayOfMonth}
                              {cat.dayOfMonth === 1
                                ? 'st'
                                : cat.dayOfMonth === 2
                                  ? 'nd'
                                  : cat.dayOfMonth === 3
                                    ? 'rd'
                                    : 'th'}{' '}
                              of each month
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 justify-end items-center w-full sm:w-auto mt-2 sm:mt-0">
                    <EditCategoryDialog category={cat} onUpdateCategory={onUpdateCategory}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border font-medium text-xs px-2 py-1 flex items-center justify-center transition-colors duration-150 hover:bg-primary/10 focus:ring-2 focus:ring-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </EditCategoryDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the{' '}
                            <strong>{cat.name}</strong> category.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteCategory(cat.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
