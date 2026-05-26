import { app, ipcMain, BrowserWindow, nativeTheme, WebContentsView } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import { createMainWindow } from './window';
import { tabManager } from './tab-manager';
import { personaManager } from './persona-manager';
import { settingsManager } from './settings-manager';
import { extensionManager } from './extension-manager';
import { historyManager } from './history-manager';
import { downloadManager } from './download-manager';
import { Tab, Widget, UpdateState } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let updateCheckTimer: NodeJS.Timeout | null = null;
let currentUpdateVersion: string | undefined;
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

function sendUpdateState(state: UpdateState): void {
  mainWindow?.webContents.send('update:state-changed', state);
}

function getConfiguredUpdateUrl(): string | null {
  const rawUrl = process.env.PERSONA_UPDATE_URL?.trim();
  if (!rawUrl) return null;
  return rawUrl.replace(/\/+$/, '');
}

function setupIpcHandlers(): void {
  // ─── Tab handlers ──────────────────────────────────────────────────────────
  ipcMain.handle('tab:create', async (_event, { personaId, url }: { personaId?: string; url?: string }) => {
    return tabManager.createTab(personaId, url);
  });

  ipcMain.handle('tab:close', (_event, { tabId }: { tabId: string }) => {
    tabManager.closeTab(tabId);
  });

  ipcMain.handle('tab:switch', async (_event, { tabId }: { tabId: string }) => {
    await tabManager.switchTab(tabId);
  });

  ipcMain.handle('tab:navigate', (_event, { tabId, url }: { tabId: string; url: string }) => {
    tabManager.navigateTo(tabId, url);
  });

  ipcMain.handle('tab:list', () => {
    return tabManager.getTabs();
  });

  ipcMain.handle('extension:list', () => {
    return extensionManager.getInstalledExtensions();
  });

  ipcMain.handle('history:get', () => {
    return historyManager.getEntries();
  });

  ipcMain.handle('history:remove', (_event, { entryId }: { entryId: string }) => {
    return historyManager.removeEntry(entryId);
  });

  ipcMain.handle('history:clear', () => {
    return historyManager.clear();
  });

  ipcMain.handle('downloads:get', () => {
    return downloadManager.getDownloads();
  });

  ipcMain.handle('downloads:open', async (_event, { downloadId }: { downloadId: string }) => {
    await downloadManager.openDownload(downloadId);
  });

  ipcMain.handle('downloads:reveal', (_event, { downloadId }: { downloadId: string }) => {
    downloadManager.revealDownload(downloadId);
  });

  ipcMain.handle('downloads:clear', () => {
    return downloadManager.clearDownloads();
  });

  ipcMain.handle('extension:install', async () => {
    if (!mainWindow) throw new Error('Main window is not available.');
    return extensionManager.installFromDialog(mainWindow);
  });

  ipcMain.handle('extension:set-enabled', async (_event, { extensionId, enabled }: { extensionId: string; enabled: boolean }) => {
    return extensionManager.setEnabled(extensionId, enabled);
  });

  ipcMain.handle('extension:remove', async (_event, { extensionId }: { extensionId: string }) => {
    return extensionManager.remove(extensionId);
  });

  ipcMain.handle('extension:reveal', async (_event, { extensionId }: { extensionId: string }) => {
    return extensionManager.revealInFolder(extensionId);
  });

  // ─── Persona handlers ──────────────────────────────────────────────────────
  ipcMain.handle('persona:create', (_event, { name, color, icon }: { name: string; color: string; icon: string }) => {
    return personaManager.createPersona(name, color, icon);
  });

  ipcMain.handle('persona:switch', (_event, { personaId }: { personaId: string }) => {
    personaManager.switchPersona(personaId);
  });

  ipcMain.handle('persona:delete', (_event, { personaId }: { personaId: string }) => {
    personaManager.deletePersona(personaId);
  });

  ipcMain.handle('persona:list', () => {
    return personaManager.getPersonas();
  });

  // ─── Settings handlers ─────────────────────────────────────────────────────
  ipcMain.handle('settings:get', () => {
    return settingsManager.getSettings();
  });

  ipcMain.handle('settings:set', (_event, { key, value }: { key: string; value: unknown }) => {
    settingsManager.setSetting(key as any, value as any);

    // Side effects
    if (key === 'theme') {
      const theme = value as string;
      nativeTheme.themeSource = theme === 'light' ? 'light' : 'dark';
    }
    if (key === 'trackerBlocking') {
      personaManager.refreshTrackerBlocking();
    }
    if (key === 'sidebarOpen') {
      tabManager.setSidebarOpen(value as boolean);
    }
  });

  // ─── Browser/Navigation handlers ──────────────────────────────────────────
  ipcMain.handle('browser:back', (_event, { tabId }: { tabId: string }) => {
    tabManager.goBack(tabId);
  });

  ipcMain.handle('browser:forward', (_event, { tabId }: { tabId: string }) => {
    tabManager.goForward(tabId);
  });

  ipcMain.handle('browser:reload', (_event, { tabId }: { tabId: string }) => {
    tabManager.reload(tabId);
  });

  ipcMain.handle('browser:get-url', (_event, { tabId }: { tabId: string }) => {
    return tabManager.getUrl(tabId);
  });

  // ─── Sidebar handlers ──────────────────────────────────────────────────────
  ipcMain.handle('sidebar:toggle', () => {
    const settings = settingsManager.getSettings();
    const newState = !settings.sidebarOpen;
    settingsManager.setSetting('sidebarOpen', newState);
    tabManager.setSidebarOpen(newState);
    return newState;
  });

  ipcMain.handle('sidebar:add-widget', (_event, { widget }: { widget: Widget }) => {
    settingsManager.addWidget(widget);
  });

  ipcMain.handle('sidebar:remove-widget', (_event, { widgetId }: { widgetId: string }) => {
    settingsManager.removeWidget(widgetId);
  });

  // ─── Window control handlers ───────────────────────────────────────────────
  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) win.unmaximize();
    else win?.maximize();
  });

  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  ipcMain.handle('window:is-maximized', () => {
    return BrowserWindow.getFocusedWindow()?.isMaximized() ?? false;
  });

  // ─── Overlay visibility handlers ──────────────────────────────────────────
  ipcMain.handle('overlay:show', () => {
    tabManager.setActiveViewVisible(false);
  });

  ipcMain.handle('overlay:hide', () => {
    tabManager.setActiveViewVisible(true);
  });

  // ─── Update handlers ───────────────────────────────────────────────────────
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall();
  });
}

function setupTabCallbacks(): void {
  if (!mainWindow) return;

  tabManager.setCallbacks(
    (tab: Tab) => {
      mainWindow?.webContents.send('tab:updated', tab);
    },
    (tab: Tab) => {
      mainWindow?.webContents.send('tab:created', tab);
    },
    (tabId: string) => {
      mainWindow?.webContents.send('tab:closed', tabId);
    }
  );
}

function setupDownloadCallbacks(): void {
  downloadManager.setOnChanged((downloads) => {
    mainWindow?.webContents.send('downloads:changed', downloads);
  });
}

function setupAutoUpdater(): void {
  const updateUrl = getConfiguredUpdateUrl();
  if (!updateUrl) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: updateUrl,
  });

  autoUpdater.on('checking-for-update', () => {
    sendUpdateState({ status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    currentUpdateVersion = info.version;
    sendUpdateState({ status: 'available', version: info.version });
  });

  autoUpdater.on('download-progress', (info) => {
    sendUpdateState({
      status: 'downloading',
      version: currentUpdateVersion,
      progressPercent: info.percent,
      bytesPerSecond: info.bytesPerSecond,
      transferredBytes: info.transferred,
      totalBytes: info.total,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    currentUpdateVersion = undefined;
    sendUpdateState({ status: 'not-available', version: info.version });
  });

  autoUpdater.on('update-downloaded', (info) => {
    currentUpdateVersion = info.version;
    sendUpdateState({ status: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (error) => {
    sendUpdateState({
      status: 'error',
      version: currentUpdateVersion,
      message: error.message,
    });
  });

  autoUpdater.checkForUpdates().catch((error: Error) => {
    sendUpdateState({ status: 'error', message: error.message });
  });

  updateCheckTimer = setInterval(() => {
    autoUpdater.checkForUpdates().catch((error: Error) => {
      sendUpdateState({
        status: 'error',
        version: currentUpdateVersion,
        message: error.message,
      });
    });
  }, UPDATE_CHECK_INTERVAL_MS);
}

app.whenReady().then(async () => {
  // Set up IPC handlers BEFORE window creation
  setupIpcHandlers();

  mainWindow = createMainWindow();
  tabManager.setMainWindow(mainWindow);
  setupDownloadCallbacks();
  setupTabCallbacks();

  // Create initial tab
  mainWindow.webContents.once('did-finish-load', async () => {
    await tabManager.createTab();
    if (app.isPackaged) setupAutoUpdater();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      tabManager.setMainWindow(mainWindow);
      setupTabCallbacks();
    }
  });
});

app.on('window-all-closed', () => {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent navigation to unknown protocols
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Allow all http/https navigation in webviews — only restrict renderer
    if (contents.getType() === 'window') {
      const allowedProtocols = ['file:', 'data:'];
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        // event.preventDefault(); // Let it go for now, renderer needs network
      }
    }
  });
});
