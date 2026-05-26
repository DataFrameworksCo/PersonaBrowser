import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Tab, Settings, Widget, ClosedTabEntry } from '../../shared/types';

interface BrowserContextValue {
  tabs: Tab[];
  activeTab: Tab | null;
  activeTabId: string | null;
  settings: Settings | null;
  sidebarOpen: boolean;
  recentClosedTabs: ClosedTabEntry[];
  addressValue: string;
  setAddressValue: (v: string) => void;
  createTab: (personaId?: string, url?: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => Promise<void>;
  duplicateTab: (tabId: string) => Promise<void>;
  reopenClosedTab: () => Promise<void>;
  navigateTo: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  toggleSidebar: () => Promise<void>;
  updateSettings: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  addWidget: (widget: Widget) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const BrowserContext = createContext<BrowserContextValue>({} as BrowserContextValue);

export const BrowserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentClosedTabs, setRecentClosedTabs] = useState<ClosedTabEntry[]>([]);
  const [addressValue, setAddressValue] = useState('');
  const tabsRef = useRef<Tab[]>([]);
  const activeTabId = tabs.find((t) => t.isActive)?.id ?? null;
  const activeTab = tabs.find((t) => t.isActive) ?? null;

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const captureClosedTab = useCallback((tabToClose: Tab | undefined) => {
    if (!tabToClose) return;
    if (tabToClose.url.startsWith('data:')) return;

    setRecentClosedTabs((current) => [
      {
        id: tabToClose.id,
        url: tabToClose.url,
        title: tabToClose.title,
        favicon: tabToClose.favicon,
        personaId: tabToClose.personaId,
        closedAt: Date.now(),
      },
      ...current.filter((entry) => entry.id !== tabToClose.id),
    ].slice(0, 8));
  }, []);

  const refreshSettings = useCallback(async () => {
    const s = await window.persona.getSettings();
    setSettings(s);
    setSidebarOpen(s.sidebarOpen);
  }, []);

  useEffect(() => {
    refreshSettings();

    // Load initial tabs
    window.persona.getTabs().then(setTabs);

    // Tab event listeners
    const unsubUpdated = window.persona.onTabUpdated((tab) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tab.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = tab;
        return next;
      });
      if (tab.isActive) {
        setAddressValue(tab.url.startsWith('data:') ? '' : tab.url);
      }
    });

    const unsubCreated = window.persona.onTabCreated((tab) => {
      setTabs((prev) => {
        const next = prev.map((t) => ({ ...t, isActive: false }));
        return [...next, { ...tab, isActive: true }];
      });
      setAddressValue(tab.url.startsWith('data:') ? '' : tab.url);
    });

    const unsubClosed = window.persona.onTabClosed((tabId) => {
      const closedTab = tabsRef.current.find((tab) => tab.id === tabId);
      captureClosedTab(closedTab);
      setTabs((prev) => prev.filter((t) => t.id !== tabId));
    });

    return () => {
      unsubUpdated();
      unsubCreated();
      unsubClosed();
    };
  }, [captureClosedTab, refreshSettings]);

  // Keep address bar synced with active tab URL
  useEffect(() => {
    if (activeTab && !activeTab.url.startsWith('data:')) {
      setAddressValue(activeTab.url === 'persona://newtab' ? '' : activeTab.url);
    }
  }, [activeTab?.url]);

  const createTab = useCallback(async (personaId?: string, url?: string) => {
    await window.persona.createTab(personaId, url);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    captureClosedTab(tabsRef.current.find((tab) => tab.id === tabId));
    window.persona.closeTab(tabId);
  }, [captureClosedTab]);

  const switchTab = useCallback(async (tabId: string) => {
    await window.persona.switchTab(tabId);
    setTabs((prev) =>
      prev.map((t) => ({ ...t, isActive: t.id === tabId }))
    );
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) setAddressValue(tab.url.startsWith('data:') ? '' : tab.url);
  }, [tabs]);

  const navigateTo = useCallback((url: string) => {
    if (!activeTabId) return;
    window.persona.navigateTo(activeTabId, url);
  }, [activeTabId]);

  const duplicateTab = useCallback(async (tabId: string) => {
    const target = tabsRef.current.find((tab) => tab.id === tabId);
    if (!target) return;
    await createTab(target.personaId, target.url === 'persona://newtab' ? undefined : target.url);
  }, [createTab]);

  const reopenClosedTab = useCallback(async () => {
    const nextClosed = recentClosedTabs[0];
    if (!nextClosed) return;
    await createTab(nextClosed.personaId, nextClosed.url === 'persona://newtab' ? undefined : nextClosed.url);
    setRecentClosedTabs((current) => current.slice(1));
  }, [createTab, recentClosedTabs]);

  const goBack = useCallback(() => {
    if (!activeTabId) return;
    window.persona.goBack(activeTabId);
  }, [activeTabId]);

  const goForward = useCallback(() => {
    if (!activeTabId) return;
    window.persona.goForward(activeTabId);
  }, [activeTabId]);

  const reload = useCallback(() => {
    if (!activeTabId) return;
    window.persona.reload(activeTabId);
  }, [activeTabId]);

  const toggleSidebar = useCallback(async () => {
    const newState = await window.persona.toggleSidebar();
    setSidebarOpen(newState);
    if (settings) setSettings({ ...settings, sidebarOpen: newState });
  }, [settings]);

  const updateSettings = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    await window.persona.setSetting(key, value);
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    if (key === 'sidebarOpen') setSidebarOpen(value as boolean);
  }, []);

  const addWidget = useCallback(async (widget: Widget) => {
    await window.persona.addWidget(widget);
    await refreshSettings();
  }, [refreshSettings]);

  const removeWidget = useCallback(async (widgetId: string) => {
    await window.persona.removeWidget(widgetId);
    await refreshSettings();
  }, [refreshSettings]);

  return (
    <BrowserContext.Provider
      value={{
        tabs,
        activeTab,
        activeTabId,
        settings,
        sidebarOpen,
        recentClosedTabs,
        addressValue,
        setAddressValue,
        createTab,
        closeTab,
        switchTab,
        duplicateTab,
        reopenClosedTab,
        navigateTo,
        goBack,
        goForward,
        reload,
        toggleSidebar,
        updateSettings,
        addWidget,
        removeWidget,
        refreshSettings,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};

export const useBrowser = () => useContext(BrowserContext);
