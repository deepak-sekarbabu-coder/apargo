import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for managing admin tab state with sessionStorage persistence.
 * Handles tab state management and persistence, separating this concern from UI rendering.
 */
export const useAdminTabState = (defaultTab: string = 'users') => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Restore persisted tab on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('admin.activeTab');
      if (saved) setActiveTab(saved);
    } catch {
      // Ignore sessionStorage errors (e.g., in private browsing mode)
    }
  }, []);

  const updateTab = useCallback((newTab: string) => {
    setActiveTab(newTab);
    try {
      sessionStorage.setItem('admin.activeTab', newTab);
    } catch {
      // Ignore sessionStorage errors (e.g., in private browsing mode)
    }
  }, []);

  return {
    activeTab,
    updateTab,
  };
};
