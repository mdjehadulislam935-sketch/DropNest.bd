import React, { createContext, useContext, useEffect, useState } from 'react';
import type { DashboardTab, UserRole } from '../types/platform.ts';

interface TabContextType {
  tabs: DashboardTab[];
  activeTabId: string;
  openTab: (tab: Omit<DashboardTab, 'refreshKey'>) => void;
  closeTab: (tabId: string) => void;
  refreshTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  replaceActiveTab: (viewId: string, title: string, params?: Record<string, any>) => void;
  resetTabsForRole: (role: UserRole) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

function getDefaultTabsForRole(role: UserRole): DashboardTab[] {
  return [
    {
      id: `${role.toLowerCase()}-dashboard`,
      title: 'Dashboard',
      viewId: 'dashboard',
      isClosable: false,
      refreshKey: 0,
    },
  ];
}

export const TabProvider: React.FC<{ role: UserRole | null; children: React.ReactNode }> = ({ role, children }) => {
  const [tabs, setTabs] = useState<DashboardTab[]>(() => (role ? getDefaultTabsForRole(role) : []));
  const [activeTabId, setActiveTabId] = useState<string>(() => (tabs[0]?.id || ''));

  // Sync tabs when role changes
  useEffect(() => {
    if (role) {
      const defaultTabs = getDefaultTabsForRole(role);
      setTabs(defaultTabs);
      setActiveTabId(defaultTabs[0].id);
    } else {
      setTabs([]);
      setActiveTabId('');
    }
  }, [role]);

  const openTab = (newTab: Omit<DashboardTab, 'refreshKey'>) => {
    setTabs((prevTabs) => {
      const existing = prevTabs.find((t) => t.id === newTab.id || t.viewId === newTab.viewId);
      if (existing) {
        // Activate existing tab
        setActiveTabId(existing.id);
        return prevTabs;
      }
      const created: DashboardTab = {
        ...newTab,
        refreshKey: 0,
      };
      setActiveTabId(created.id);
      return [...prevTabs, created];
    });
  };

  const closeTab = (tabId: string) => {
    setTabs((prevTabs) => {
      const targetIndex = prevTabs.findIndex((t) => t.id === tabId);
      if (targetIndex === -1) return prevTabs;
      if (!prevTabs[targetIndex].isClosable) return prevTabs; // Cannot close unclosable tab

      const filtered = prevTabs.filter((t) => t.id !== tabId);

      // If closed tab was active, switch to adjacent tab
      if (activeTabId === tabId) {
        const nextActive = filtered[Math.max(0, targetIndex - 1)] || filtered[0];
        if (nextActive) {
          setActiveTabId(nextActive.id);
        }
      }

      return filtered;
    });
  };

  const refreshTab = (tabId: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === tabId ? { ...t, refreshKey: t.refreshKey + 1 } : t))
    );
  };

  const replaceActiveTab = (viewId: string, title: string, params?: Record<string, any>) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId) {
          return {
            ...t,
            viewId,
            title,
            params: params || t.params,
            refreshKey: t.refreshKey + 1,
          };
        }
        return t;
      })
    );
  };

  const resetTabsForRole = (newRole: UserRole) => {
    const defaultTabs = getDefaultTabsForRole(newRole);
    setTabs(defaultTabs);
    setActiveTabId(defaultTabs[0].id);
  };

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        refreshTab,
        setActiveTabId,
        replaceActiveTab,
        resetTabsForRole,
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export function useTabs() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
}
