import React from 'react';

import { RouteGuard } from '@/components/core/route-guard';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RouteGuard>{children}</RouteGuard>;
}
