import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Tab,
  Settings,
  Widget,
  ClosedTabEntry,
  BookmarkEntry,
  ReadingListItem,
  ReadingState,
  Workspace,
} from '../../shared/types';

type SavedPageInput = {
  title?: string;
  url?: string;
  favicon?: string;
  personaId?: string;
};

interface BrowserContextValue {
  tabs: Tab[];
  activeTab: Tab | null;
  activeTabId: string | null;
  settings: Settings | null;
  sidebarOpen: boolean;
  recentClosedTabs: ClosedTabEntry[];
  addressValue: string;
  bookmarks: BookmarkEntry[];
  readingList: ReadingListItem[];
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
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
  addBookmark: (input?: SavedPageInput) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  addToReadingList: (input?: SavedPageInput) => Promise<void>;
  removeFromReadingList: (itemId: string) => Promise<void>;
  setReadingState: (itemId: string, state: ReadingState) => Promise<void>;
  setActiveWorkspace: (workspaceId: string) => Promise<void>;
  addWorkspace: (name: string, color: string, description: string) => Promise<void>;
  removeWorkspace: (workspaceId: string) => Promise<void>;
  saveWorkspaceNote: (workspaceId: string, note: string) => Promise<void>;
  addWorkspaceLink: (workspaceId: string, title: string, url: string, description: string) => Promise<void>;
  removeWorkspaceLink: (workspaceId: string, linkId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const BrowserContext = createContext<BrowserContextValue>({} as BrowserContextValue);

const sanitizeUrl = (value: string): string => {
  const next = value.trim();
  if (!next || next.startsWith('persona://') || next.startsWith('data:')) return '';
  if (next.startsWith('http://') || next.startsWith('https://') || next.startsWith('file://')) {
    return next;
  }
  if (next.includes('.') && !next.includes(' ')) {
    return `https://${next}`;
  }
  return next;
};

export const BrowserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentClosedTabs, setRecentClosedTabs] = useState<ClosedTabEntry[]>([]);
  const [addressValue, setAddressValue] = useState('');
  const tabsRef = useRef<Tab[]>([]);
  const settingsRef = useRef<Settings | null>(null);
  const activeTabId = tabs.find((t) => t.isActive)?.id ?? null;
  const activeTab = tabs.find((t) => t.isActive) ?? null;
  const bookmarks = settings?.bookmarks ?? [];
  const readingList = settings?.readingList ?? [];
  const workspaces = settings?.workspaces ?? [];
  const activeWorkspace = workspaces.find((workspace) => workspace.id === settings?.activeWorkspaceId) ?? null;

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

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
    const nextSettings = await window.persona.getSettings();
    setSettings(nextSettings);
    setSidebarOpen(nextSettings.sidebarOpen);
  }, []);

  useEffect(() => {
    refreshSettings();
    window.persona.getTabs().then(setTabs);

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
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === tabId })));
    const tab = tabsRef.current.find((t) => t.id === tabId);
    if (tab) setAddressValue(tab.url.startsWith('data:') ? '' : tab.url);
  }, []);

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
    setSettings((prev) => (prev ? { ...prev, sidebarOpen: newState } : prev));
  }, []);

  const updateSettings = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    await window.persona.setSetting(key, value);
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
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

  const buildSavedPage = useCallback((input?: SavedPageInput) => {
    const source = activeTab ?? null;
    const nextUrl = sanitizeUrl(input?.url ?? source?.url ?? '');
    if (!nextUrl) return null;

    const fallbackSettings = settingsRef.current;
    return {
      title: input?.title?.trim() || source?.title || nextUrl,
      url: nextUrl,
      favicon: input?.favicon ?? source?.favicon ?? '',
      personaId: input?.personaId ?? source?.personaId ?? fallbackSettings?.activePersonaId ?? 'personal',
    };
  }, [activeTab]);

  const addBookmark = useCallback(async (input?: SavedPageInput) => {
    if (!settingsRef.current) return;
    const savedPage = buildSavedPage(input);
    if (!savedPage) return;

    const nextBookmarks: BookmarkEntry[] = [
      {
        id: `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        addedAt: Date.now(),
        ...savedPage,
      },
      ...settingsRef.current.bookmarks.filter(
        (bookmark) => !(bookmark.url === savedPage.url && bookmark.personaId === savedPage.personaId)
      ),
    ].slice(0, 48);

    await updateSettings('bookmarks', nextBookmarks);
  }, [buildSavedPage, updateSettings]);

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    if (!settingsRef.current) return;
    const nextBookmarks = settingsRef.current.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId);
    await updateSettings('bookmarks', nextBookmarks);
  }, [updateSettings]);

  const addToReadingList = useCallback(async (input?: SavedPageInput) => {
    if (!settingsRef.current) return;
    const savedPage = buildSavedPage(input);
    if (!savedPage) return;

    const existingEntry = settingsRef.current.readingList.find((item) => item.url === savedPage.url);
    const nextItems: ReadingListItem[] = [
      {
        id: existingEntry?.id ?? `reading-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        addedAt: existingEntry?.addedAt ?? Date.now(),
        state: existingEntry?.state ?? 'unread',
        ...savedPage,
      },
      ...settingsRef.current.readingList.filter((item) => item.url !== savedPage.url),
    ].slice(0, 80);

    await updateSettings('readingList', nextItems);
  }, [buildSavedPage, updateSettings]);

  const removeFromReadingList = useCallback(async (itemId: string) => {
    if (!settingsRef.current) return;
    const nextItems = settingsRef.current.readingList.filter((item) => item.id !== itemId);
    await updateSettings('readingList', nextItems);
  }, [updateSettings]);

  const setReadingState = useCallback(async (itemId: string, state: ReadingState) => {
    if (!settingsRef.current) return;
    const nextItems = settingsRef.current.readingList.map((item) => (
      item.id === itemId ? { ...item, state } : item
    ));
    await updateSettings('readingList', nextItems);
  }, [updateSettings]);

  const setActiveWorkspace = useCallback(async (workspaceId: string) => {
    await updateSettings('activeWorkspaceId', workspaceId);
  }, [updateSettings]);

  const addWorkspace = useCallback(async (name: string, color: string, description: string) => {
    if (!settingsRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const nextWorkspace: Workspace = {
      id: `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      icon: trimmedName.slice(0, 2).toUpperCase(),
      color,
      description: description.trim() || 'Custom workspace',
      focusNote: '',
      links: [],
      createdAt: Date.now(),
    };

    const nextWorkspaces = [...settingsRef.current.workspaces, nextWorkspace];
    await updateSettings('workspaces', nextWorkspaces);
    await updateSettings('activeWorkspaceId', nextWorkspace.id);
  }, [updateSettings]);

  const removeWorkspace = useCallback(async (workspaceId: string) => {
    if (!settingsRef.current || settingsRef.current.workspaces.length <= 1) return;

    const nextWorkspaces = settingsRef.current.workspaces.filter((workspace) => workspace.id !== workspaceId);
    const nextActiveWorkspaceId = settingsRef.current.activeWorkspaceId === workspaceId
      ? nextWorkspaces[0]?.id ?? settingsRef.current.activeWorkspaceId
      : settingsRef.current.activeWorkspaceId;

    await updateSettings('workspaces', nextWorkspaces);
    await updateSettings('activeWorkspaceId', nextActiveWorkspaceId);
  }, [updateSettings]);

  const saveWorkspaceNote = useCallback(async (workspaceId: string, note: string) => {
    if (!settingsRef.current) return;
    const nextWorkspaces = settingsRef.current.workspaces.map((workspace) => (
      workspace.id === workspaceId ? { ...workspace, focusNote: note } : workspace
    ));
    await updateSettings('workspaces', nextWorkspaces);
  }, [updateSettings]);

  const addWorkspaceLink = useCallback(async (workspaceId: string, title: string, url: string, description: string) => {
    if (!settingsRef.current) return;
    const sanitizedUrl = sanitizeUrl(url);
    if (!title.trim() || !sanitizedUrl) return;

    const nextWorkspaces = settingsRef.current.workspaces.map((workspace) => {
      if (workspace.id !== workspaceId) return workspace;
      return {
        ...workspace,
        links: [
          ...workspace.links,
          {
            id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: title.trim(),
            url: sanitizedUrl,
            description: description.trim(),
          },
        ],
      };
    });

    await updateSettings('workspaces', nextWorkspaces);
  }, [updateSettings]);

  const removeWorkspaceLink = useCallback(async (workspaceId: string, linkId: string) => {
    if (!settingsRef.current) return;
    const nextWorkspaces = settingsRef.current.workspaces.map((workspace) => (
      workspace.id === workspaceId
        ? { ...workspace, links: workspace.links.filter((link) => link.id !== linkId) }
        : workspace
    ));
    await updateSettings('workspaces', nextWorkspaces);
  }, [updateSettings]);

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
        bookmarks,
        readingList,
        workspaces,
        activeWorkspace,
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
        addBookmark,
        removeBookmark,
        addToReadingList,
        removeFromReadingList,
        setReadingState,
        setActiveWorkspace,
        addWorkspace,
        removeWorkspace,
        saveWorkspaceNote,
        addWorkspaceLink,
        removeWorkspaceLink,
        refreshSettings,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};

export const useBrowser = () => useContext(BrowserContext);
