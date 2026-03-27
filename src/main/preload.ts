import { contextBridge, ipcRenderer } from 'electron';
import { Tab, Persona, Settings, Widget, PersonaAPI } from '../shared/types';

const persona: PersonaAPI = {
  // Tabs
  createTab: (personaId?: string, url?: string) =>
    ipcRenderer.invoke('tab:create', { personaId, url }),

  closeTab: (tabId: string) =>
    ipcRenderer.invoke('tab:close', { tabId }),

  switchTab: (tabId: string) =>
    ipcRenderer.invoke('tab:switch', { tabId }),

  navigateTo: (tabId: string, url: string) =>
    ipcRenderer.invoke('tab:navigate', { tabId, url }),

  getTabs: () =>
    ipcRenderer.invoke('tab:list'),

  // Personas
  createPersona: (name: string, color: string, icon: string) =>
    ipcRenderer.invoke('persona:create', { name, color, icon }),

  switchPersona: (personaId: string) =>
    ipcRenderer.invoke('persona:switch', { personaId }),

  deletePersona: (personaId: string) =>
    ipcRenderer.invoke('persona:delete', { personaId }),

  getPersonas: () =>
    ipcRenderer.invoke('persona:list'),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('settings:get'),

  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) =>
    ipcRenderer.invoke('settings:set', { key, value }),

  // Navigation
  goBack: (tabId: string) =>
    ipcRenderer.invoke('browser:back', { tabId }),

  goForward: (tabId: string) =>
    ipcRenderer.invoke('browser:forward', { tabId }),

  reload: (tabId: string) =>
    ipcRenderer.invoke('browser:reload', { tabId }),

  getUrl: (tabId: string) =>
    ipcRenderer.invoke('browser:get-url', { tabId }),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // Overlay visibility
  showOverlay: () => ipcRenderer.invoke('overlay:show'),
  hideOverlay: () => ipcRenderer.invoke('overlay:hide'),

  // Sidebar
  toggleSidebar: () =>
    ipcRenderer.invoke('sidebar:toggle'),

  addWidget: (widget: Widget) =>
    ipcRenderer.invoke('sidebar:add-widget', { widget }),

  removeWidget: (widgetId: string) =>
    ipcRenderer.invoke('sidebar:remove-widget', { widgetId }),

  // Events
  onTabUpdated: (callback: (tab: Tab) => void) => {
    const listener = (_: Electron.IpcRendererEvent, tab: Tab) => callback(tab);
    ipcRenderer.on('tab:updated', listener);
    return () => ipcRenderer.removeListener('tab:updated', listener);
  },

  onTabCreated: (callback: (tab: Tab) => void) => {
    const listener = (_: Electron.IpcRendererEvent, tab: Tab) => callback(tab);
    ipcRenderer.on('tab:created', listener);
    return () => ipcRenderer.removeListener('tab:created', listener);
  },

  onTabClosed: (callback: (tabId: string) => void) => {
    const listener = (_: Electron.IpcRendererEvent, tabId: string) => callback(tabId);
    ipcRenderer.on('tab:closed', listener);
    return () => ipcRenderer.removeListener('tab:closed', listener);
  },

  onUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { tabId: string; url: string }) => callback(data);
    ipcRenderer.on('browser:url-changed', listener);
    return () => ipcRenderer.removeListener('browser:url-changed', listener);
  },

  onTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { tabId: string; title: string }) => callback(data);
    ipcRenderer.on('browser:title-changed', listener);
    return () => ipcRenderer.removeListener('browser:title-changed', listener);
  },

  onFaviconChanged: (callback: (data: { tabId: string; favicon: string }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { tabId: string; favicon: string }) => callback(data);
    ipcRenderer.on('browser:favicon-changed', listener);
    return () => ipcRenderer.removeListener('browser:favicon-changed', listener);
  },

  onLoadingChanged: (callback: (data: { tabId: string; isLoading: boolean }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { tabId: string; isLoading: boolean }) => callback(data);
    ipcRenderer.on('browser:loading-changed', listener);
    return () => ipcRenderer.removeListener('browser:loading-changed', listener);
  },

  onNavigationChanged: (callback: (data: { tabId: string; canGoBack: boolean; canGoForward: boolean }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { tabId: string; canGoBack: boolean; canGoForward: boolean }) => callback(data);
    ipcRenderer.on('browser:navigation-changed', listener);
    return () => ipcRenderer.removeListener('browser:navigation-changed', listener);
  },
};

contextBridge.exposeInMainWorld('persona', persona);
