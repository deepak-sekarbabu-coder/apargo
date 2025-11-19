'use client';

import * as React from 'react';

import { getCategories } from '@/lib/firestore/categories';

import { ApargoApp } from '@/components/core/apargo-app';

export default function DashboardClient() {
  const [categories, setCategories] = React.useState(
    [] as Awaited<ReturnType<typeof getCategories>>
  );
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let isMounted = true;
    getCategories()
      .then(cats => {
        if (isMounted) setCategories(cats);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground" suppressHydrationWarning>
        Loading dashboard...
      </div>
    );
  }
  return <ApargoApp initialCategories={categories} />;
}
