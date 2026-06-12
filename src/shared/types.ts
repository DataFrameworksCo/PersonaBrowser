export interface Persona {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  isPersistent: boolean;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon: string;
  personaId: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isActive: boolean;
}

export interface ClosedTabEntry {
  id: string;
  url: string;
  title: string;
  favicon: string;
  personaId: string;
  closedAt: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon: string;
  personaId: string;
  lastVisitedAt: number;
  visitCount: number;
}

export interface BookmarkEntry {
  id: string;
  title: string;
  url: string;
  favicon: string;
  personaId: string;
  addedAt: number;
}

export type ReadingState = 'unread' | 'reading' | 'done';

export interface ReadingListItem {
  id: string;
  title: string;
  url: string;
  favicon: string;
  personaId: string;
  addedAt: number;
  state: ReadingState;
}

export interface WorkspaceLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  focusNote: string;
  links: WorkspaceLink[];
  createdAt: number;
}

export type DownloadStatus = 'progressing' | 'completed' | 'interrupted' | 'cancelled';

export interface DownloadRecord {
  id: string;
  url: string;
  fileName: string;
  status: DownloadStatus;
  receivedBytes: number;
  totalBytes: number;
  savePath?: string;
  personaId: string;
  startedAt: number;
  finishedAt?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export type WidgetType =
  | 'clock'
  | 'notes'
  | 'bookmarks'
  | 'weather'
  | 'rss'
  | 'todo'
  | 'pomodoro'
  | 'calculator';

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultConfig?: Record<string, unknown>;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  installed: boolean;
  enabled: boolean;
  storeUrl?: string;
  localPath?: string;
}

export type Theme = 'dark' | 'light' | 'midnight' | 'forest' | 'ocean';

export type SearchEngine = 'duckduckgo' | 'google' | 'bing' | 'brave';

export type PrivacyLevel = 'standard' | 'strict' | 'custom';

export interface Settings {
  theme: Theme;
  accentColor: string;
  defaultSearchEngine: SearchEngine;
  privacyLevel: PrivacyLevel;
  trackerBlocking: boolean;
  httpsOnly: boolean;
  personas: Persona[];
  activePersonaId: string;
  sidebarWidgets: Widget[];
  sidebarOpen: boolean;
  installedExtensions: Extension[];
  historyEntries: HistoryEntry[];
  downloadHistory: DownloadRecord[];
  bookmarks: BookmarkEntry[];
  readingList: ReadingListItem[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  newTabUrl: string;
  customAccentColors: Record<string, string>;
}

export interface PrivacyInfo {
  url: string;
  trackerCount: number;
  isHttps: boolean;
  privacyScore: number;
  blockedTrackers: string[];
}

export type UpdateStatus =
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error';

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  progressPercent?: number;
  bytesPerSecond?: number;
  transferredBytes?: number;
  totalBytes?: number;
  message?: string;
}

export interface IpcTabPayload {
  tabId?: string;
  url?: string;
  personaId?: string;
}

export interface IpcPersonaPayload {
  personaId?: string;
  name?: string;
  color?: string;
  icon?: string;
}

export interface PersonaAPI {
  // Tabs
  createTab: (personaId?: string, url?: string) => Promise<Tab>;
  closeTab: (tabId: string) => Promise<void>;
  switchTab: (tabId: string) => Promise<void>;
  navigateTo: (tabId: string, url: string) => Promise<void>;
  getTabs: () => Promise<Tab[]>;
  getInstalledExtensions: () => Promise<Extension[]>;
  getHistory: () => Promise<HistoryEntry[]>;
  removeHistoryEntry: (entryId: string) => Promise<HistoryEntry[]>;
  clearHistory: () => Promise<HistoryEntry[]>;
  getDownloads: () => Promise<DownloadRecord[]>;
  openDownload: (downloadId: string) => Promise<void>;
  revealDownload: (downloadId: string) => Promise<void>;
  clearDownloads: () => Promise<DownloadRecord[]>;
  // Personas
  createPersona: (name: string, color: string, icon: string) => Promise<Persona>;
  switchPersona: (personaId: string) => Promise<void>;
  deletePersona: (personaId: string) => Promise<void>;
  getPersonas: () => Promise<Persona[]>;
  // Settings
  getSettings: () => Promise<Settings>;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  // Navigation
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  reload: (tabId: string) => Promise<void>;
  getUrl: (tabId: string) => Promise<string>;
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  // Overlay visibility (hides/shows the active WebContentsView)
  showOverlay: () => Promise<void>;
  hideOverlay: () => Promise<void>;
  // Sidebar
  toggleSidebar: () => Promise<boolean>;
  addWidget: (widget: Widget) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  installExtension: () => Promise<Extension>;
  setExtensionEnabled: (extensionId: string, enabled: boolean) => Promise<Extension[]>;
  removeExtension: (extensionId: string) => Promise<Extension[]>;
  revealExtensionInFolder: (extensionId: string) => Promise<void>;
  // Events
  onTabUpdated: (callback: (tab: Tab) => void) => () => void;
  onTabCreated: (callback: (tab: Tab) => void) => () => void;
  onTabClosed: (callback: (tabId: string) => void) => () => void;
  onUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => () => void;
  onTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => () => void;
  onFaviconChanged: (callback: (data: { tabId: string; favicon: string }) => void) => () => void;
  onLoadingChanged: (callback: (data: { tabId: string; isLoading: boolean }) => void) => () => void;
  onNavigationChanged: (callback: (data: { tabId: string; canGoBack: boolean; canGoForward: boolean }) => void) => () => void;
  onUpdateStateChanged: (callback: (state: UpdateState) => void) => () => void;
  onDownloadsChanged: (callback: (downloads: DownloadRecord[]) => void) => () => void;
  installUpdate: () => Promise<void>;
}

declare global {
  interface Window {
    persona: PersonaAPI;
  }
}
