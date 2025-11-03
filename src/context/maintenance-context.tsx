'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  addMaintenanceBudget,
  getMaintenanceBudget,
  updateMaintenanceBudget,
} from '@/lib/firestore/maintenance-budgets';
import {
  addMaintenanceTask,
  deleteMaintenanceTask,
  getMaintenanceTasks,
  subscribeToMaintenanceTasks,
  updateMaintenanceTask,
} from '@/lib/firestore/maintenance-tasks';
import {
  addVendor,
  deleteVendor,
  getVendors,
  subscribeToVendors,
  updateVendor,
} from '@/lib/firestore/vendors';
import { MaintenanceBudget, MaintenanceTask, Vendor } from '@/lib/types';

interface MaintenanceContextValue {
  tasks: MaintenanceTask[];
  vendors: Vendor[];
  budget: MaintenanceBudget | null;
  loading: boolean;
  refresh: () => Promise<void>;
  createTask: (task: Parameters<typeof addMaintenanceTask>[0]) => Promise<MaintenanceTask>;
  editTask: (id: string, task: Parameters<typeof updateMaintenanceTask>[1]) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  createVendor: (vendor: Parameters<typeof addVendor>[0]) => Promise<Vendor>;
  editVendor: (id: string, vendor: Parameters<typeof updateVendor>[1]) => Promise<void>;
  removeVendor: (id: string) => Promise<void>;
  setOrCreateBudget: (
    year: number,
    totalBudget: number,
    allocatedByCategory: Record<string, number>
  ) => Promise<MaintenanceBudget>;
}

const MaintenanceContext = createContext<MaintenanceContextValue | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode; year?: number }> = ({
  children,
  year,
}) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budget, setBudget] = useState<MaintenanceBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const activeYear = year || new Date().getFullYear();

  useEffect(() => {
    let unsubTasks: (() => void) | undefined;
    let unsubVendors: (() => void) | undefined;
    (async () => {
      setLoading(true);
      const [initialTasks, initialVendors, initialBudget] = await Promise.all([
        getMaintenanceTasks(),
        getVendors(),
        getMaintenanceBudget(activeYear),
      ]);
      setTasks(initialTasks);
      setVendors(initialVendors);
      setBudget(initialBudget);
      unsubTasks = subscribeToMaintenanceTasks(setTasks);
      unsubVendors = subscribeToVendors(setVendors);
      setLoading(false);
    })();
    return () => {
      unsubTasks?.();
      unsubVendors?.();
    };
  }, [activeYear]);

  const refresh = useCallback(async () => {
    const [t, v, b] = await Promise.all([
      getMaintenanceTasks(),
      getVendors(),
      getMaintenanceBudget(activeYear),
    ]);
    setTasks(t);
    setVendors(v);
    setBudget(b);
  }, [activeYear]);

  const createTask: MaintenanceContextValue['createTask'] = async task => {
    const created = await addMaintenanceTask(task);
    setTasks(prev => [created, ...prev]);
    return created;
  };

  const editTask: MaintenanceContextValue['editTask'] = async (id, task) => {
    await updateMaintenanceTask(id, task);
    // The Firebase subscription (subscribeToMaintenanceTasks) will handle all state updates,
    // including new recurring tasks created when marking tasks as completed
  };

  const removeTask: MaintenanceContextValue['removeTask'] = async id => {
    await deleteMaintenanceTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const createVendor: MaintenanceContextValue['createVendor'] = async vendor => {
    const created = await addVendor(vendor);
    setVendors(prev => [created, ...prev]);
    return created;
  };

  const editVendor: MaintenanceContextValue['editVendor'] = async (id, vendor) => {
    await updateVendor(id, vendor);
  };

  const removeVendor: MaintenanceContextValue['removeVendor'] = async id => {
    await deleteVendor(id);
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const setOrCreateBudget: MaintenanceContextValue['setOrCreateBudget'] = async (
    year,
    totalBudget,
    allocatedByCategory
  ) => {
    let b = await getMaintenanceBudget(year);
    if (!b) {
      b = await addMaintenanceBudget({ year, totalBudget, allocatedByCategory });
    } else {
      await updateMaintenanceBudget(b.id, { totalBudget, allocatedByCategory });
      b = { ...b, totalBudget, allocatedByCategory };
    }
    setBudget(b);
    return b;
  };

  return (
    <MaintenanceContext.Provider
      value={{
        tasks,
        vendors,
        budget,
        loading,
        refresh,
        createTask,
        editTask,
        removeTask,
        createVendor,
        editVendor,
        removeVendor,
        setOrCreateBudget,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) throw new Error('useMaintenance must be used within MaintenanceProvider');
  return ctx;
};
