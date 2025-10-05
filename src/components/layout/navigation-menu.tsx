'use client';

import { AlertTriangle, Cog, Home, LineChart, Settings, Wallet } from 'lucide-react';

import * as React from 'react';

import Image from 'next/image';

import type { User, View } from '@/lib/types';

import { Users } from '@/components/ui/lucide';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeSwitch } from '@/components/ui/theme-switch';

interface NavigationMenuProps {
  user: User | null;
  view: View;
  setView: (view: View) => void;
  role: string;
}

export function NavigationMenu({ user, view, setView, role }: NavigationMenuProps) {
  const { setOpenMobile, isMobile } = useSidebar();
  // Removed isClient state and useEffect as role is already available from props

  const handleNavigation = (newView: View) => {
    setView(newView);
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogoNavigation = () => {
    if (user) {
      setView('dashboard');
      if (isMobile) {
        setOpenMobile(false);
      }
    }
    // If user is not logged in, the parent component should handle navigation
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-1 px-3 py-2 w-full border-b">
          <div
            className="flex items-center gap-1.5 min-w-0 cursor-pointer flex-1"
            onClick={handleLogoNavigation}
          >
            <Image
              src="/apargo-logo.png"
              alt="Apargo Logo"
              width={24}
              height={24}
              className="object-contain rounded bg-white flex-shrink-0"
              priority
              unoptimized
            />
            <span className="text-sm font-semibold truncate">Apargo</span>
          </div>
          <div className="flex-shrink-0">
            <ThemeSwitch />
          </div>
        </div>
      </SidebarHeader>
      {/* Navigation menu remains unchanged */}
      <SidebarContent>
        <SidebarMenu>
          {/* Each nav item now uses a colored icon container mirroring dashboard feature colors */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('dashboard')}
              isActive={view === 'dashboard'}
              tooltip="Dashboard"
            >
              {/* Updated to emerald theme per request */}
              <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Home className="h-4 w-4" />
              </span>
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('ledger')}
              isActive={view === 'ledger'}
              tooltip="Ledger"
            >
              <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </span>
              Ledger
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('expense-analytics')}
              isActive={view === 'expense-analytics'}
              tooltip="Expense Management"
            >
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <LineChart className="h-4 w-4" />
              </span>
              Expense Management
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('faults')}
              isActive={view === 'faults'}
              tooltip="Fault Management"
            >
              <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Fault Management
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('maintenance')}
              isActive={view === 'maintenance'}
              tooltip="Maintenance"
            >
              <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Cog className="h-4 w-4" />
              </span>
              Maintenance
            </SidebarMenuButton>
          </SidebarMenuItem>
          {role === 'admin' && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigation('admin')}
                isActive={view === 'admin'}
                tooltip="Admin"
              >
                <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Settings className="h-4 w-4" />
                </span>
                Admin
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('community')}
              isActive={view === 'community'}
              tooltip="Community"
            >
              <span className="p-1.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Users className="h-4 w-4" />
              </span>
              Community
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
