import { BrowserWindow, WebContentsView } from 'electron';
import { Tab } from '../shared/types';
import { personaManager } from './persona-manager';
import { settingsManager } from './settings-manager';

const TOOLBAR_HEIGHT = 88; // TabBar (44px) + Toolbar (44px)
const SIDEBAR_WIDTH = 280;

interface TabEntry {
  tab: Tab;
  view: WebContentsView;
}

class TabManager {
  private tabs: Map<string, TabEntry> = new Map();
  private activeTabId: string | null = null;
  private mainWindow: BrowserWindow | null = null;
  private sidebarOpen: boolean = true;
  private onTabUpdatedCallback: ((tab: Tab) => void) | null = null;
  private onTabCreatedCallback: ((tab: Tab) => void) | null = null;
  private onTabClosedCallback: ((tabId: string) => void) | null = null;

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
    this.sidebarOpen = settingsManager.getSettings().sidebarOpen;

    win.on('resize', () => {
      this.updateActiveViewBounds();
    });
  }

  setCallbacks(
    onUpdated: (tab: Tab) => void,
    onCreated: (tab: Tab) => void,
    onClosed: (tabId: string) => void
  ): void {
    this.onTabUpdatedCallback = onUpdated;
    this.onTabCreatedCallback = onCreated;
    this.onTabClosedCallback = onClosed;
  }

  setSidebarOpen(open: boolean): void {
    this.sidebarOpen = open;
    this.updateActiveViewBounds();
  }

  setActiveViewVisible(visible: boolean): void {
    if (!this.activeTabId) return;
    const entry = this.tabs.get(this.activeTabId);
    if (entry) entry.view.setVisible(visible);
  }

  private getContentBounds(): Electron.Rectangle {
    if (!this.mainWindow) return { x: 0, y: TOOLBAR_HEIGHT, width: 1400, height: 812 };

    const [width, height] = this.mainWindow.getContentSize();
    const sidebarWidth = this.sidebarOpen ? SIDEBAR_WIDTH : 0;
    return {
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: width - sidebarWidth,
      height: height - TOOLBAR_HEIGHT,
    };
  }

  private updateActiveViewBounds(): void {
    if (!this.activeTabId || !this.mainWindow) return;
    const entry = this.tabs.get(this.activeTabId);
    if (!entry) return;

    const bounds = this.getContentBounds();
    entry.view.setBounds(bounds);
  }

  async createTab(personaId?: string, url?: string): Promise<Tab> {
    if (!this.mainWindow) throw new Error('No main window');

    const activePersonaId = personaId ?? personaManager.getActivePersonaId();
    const tabSession = personaManager.getPersonaSession(activePersonaId);

    const view = new WebContentsView({
      webPreferences: {
        session: tabSession,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        devTools: true,
      },
    });

    const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const settings = settingsManager.getSettings();
    const targetUrl = url ?? settings.newTabUrl;

    const tab: Tab = {
      id: tabId,
      url: targetUrl,
      title: 'New Tab',
      favicon: '',
      personaId: activePersonaId,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isActive: false,
    };

    this.setupViewEvents(tabId, view, tab);
    this.mainWindow.contentView.addChildView(view);
    view.setBounds({ x: 0, y: TOOLBAR_HEIGHT, width: 100, height: 100 });
    view.setVisible(false);

    this.tabs.set(tabId, { tab, view });

    if (targetUrl === 'persona://newtab') {
      this.loadNewTabPage(view);
    } else {
      view.webContents.loadURL(targetUrl);
    }

    await this.switchTab(tabId);

    if (this.onTabCreatedCallback) {
      this.onTabCreatedCallback(tab);
    }

    return tab;
  }

  private loadNewTabPage(view: WebContentsView): void {
    const settings = settingsManager.getSettings();
    const persona = personaManager.getPersonas().find(
      (p) => p.id === personaManager.getActivePersonaId()
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .persona-badge {
      position: absolute;
      top: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 14px;
      backdrop-filter: blur(10px);
    }
    .persona-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${persona?.color ?? '#e94560'};
    }
    .clock {
      font-size: 80px;
      font-weight: 100;
      letter-spacing: -2px;
      margin-bottom: 8px;
      text-shadow: 0 0 40px rgba(255,255,255,0.2);
    }
    .date {
      font-size: 18px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 48px;
    }
    .search-container {
      width: 600px;
      max-width: 90vw;
      margin-bottom: 48px;
    }
    .search-form {
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 30px;
      padding: 4px 4px 4px 20px;
      backdrop-filter: blur(20px);
      transition: all 0.3s ease;
    }
    .search-form:focus-within {
      background: rgba(255,255,255,0.15);
      border-color: ${persona?.color ?? '#e94560'};
      box-shadow: 0 0 30px rgba(233,69,96,0.3);
    }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: white;
      font-size: 18px;
      padding: 10px 0;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.4); }
    .search-btn {
      background: ${persona?.color ?? '#e94560'};
      border: none;
      border-radius: 24px;
      color: white;
      cursor: pointer;
      padding: 10px 24px;
      font-size: 16px;
      transition: opacity 0.2s;
    }
    .search-btn:hover { opacity: 0.85; }
    .quick-links {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      width: 600px;
      max-width: 90vw;
    }
    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      text-decoration: none;
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }
    .quick-link:hover {
      background: rgba(255,255,255,0.12);
      transform: translateY(-2px);
    }
    .quick-link-icon { font-size: 24px; }
  </style>
</head>
<body>
  <div class="persona-badge">
    <div class="persona-dot"></div>
    ${persona?.icon ?? '🌐'} ${persona?.name ?? 'Personal'}
  </div>
  <div class="clock" id="clock">00:00:00</div>
  <div class="date" id="date"></div>
  <div class="search-container">
    <form class="search-form" id="searchForm">
      <input class="search-input" type="text" placeholder="Search or enter address..." id="searchInput" autofocus>
      <button class="search-btn" type="submit">→</button>
    </form>
  </div>
  <div class="quick-links">
    <a class="quick-link" onclick="navigate('https://github.com')">
      <span class="quick-link-icon">🐙</span>GitHub
    </a>
    <a class="quick-link" onclick="navigate('https://news.ycombinator.com')">
      <span class="quick-link-icon">📰</span>HN
    </a>
    <a class="quick-link" onclick="navigate('https://reddit.com')">
      <span class="quick-link-icon">🔴</span>Reddit
    </a>
    <a class="quick-link" onclick="navigate('https://youtube.com')">
      <span class="quick-link-icon">▶️</span>YouTube
    </a>
    <a class="quick-link" onclick="navigate('https://twitter.com')">
      <span class="quick-link-icon">🐦</span>Twitter
    </a>
    <a class="quick-link" onclick="navigate('https://proton.me')">
      <span class="quick-link-icon">📧</span>Mail
    </a>
  </div>
  <script>
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      document.getElementById('clock').textContent = h + ':' + m + ':' + s;
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      document.getElementById('date').textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    }
    setInterval(updateClock, 1000);
    updateClock();

    function navigate(url) {
      window.location.href = url;
    }

    document.getElementById('searchForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return;
      if (query.startsWith('http://') || query.startsWith('https://') || query.includes('.') && !query.includes(' ')) {
        window.location.href = query.startsWith('http') ? query : 'https://' + query;
      } else {
        window.location.href = 'https://duckduckgo.com/?q=' + encodeURIComponent(query);
      }
    });
  </script>
</body>
</html>`;

    view.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  }

  private setupViewEvents(tabId: string, view: WebContentsView, tab: Tab): void {
    const wc = view.webContents;

    wc.on('did-start-loading', () => {
      tab.isLoading = true;
      this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
    });

    wc.on('did-stop-loading', () => {
      tab.isLoading = false;
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
    });

    wc.on('did-navigate', (_event: Electron.Event, url: string) => {
      tab.url = url;
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
    });

    wc.on('did-navigate-in-page', (_event: Electron.Event, url: string) => {
      tab.url = url;
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
    });

    wc.on('page-title-updated', (_event: Electron.Event, title: string) => {
      tab.title = title;
      this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
    });

    wc.on('page-favicon-updated', (_event: Electron.Event, favicons: string[]) => {
      tab.favicon = favicons[0] ?? '';
      this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
    });

    wc.on('new-window' as any, (event: Event, url: string) => {
      event.preventDefault();
      this.createTab(tab.personaId, url);
    });

    // Handle new window via setWindowOpenHandler
    wc.setWindowOpenHandler(({ url }) => {
      this.createTab(tab.personaId, url);
      return { action: 'deny' };
    });
  }

  private getTabSnapshot(tabId: string): Tab {
    const entry = this.tabs.get(tabId);
    if (!entry) throw new Error(`Tab not found: ${tabId}`);
    return { ...entry.tab, isActive: tabId === this.activeTabId };
  }

  async switchTab(tabId: string): Promise<void> {
    if (!this.mainWindow) return;

    // Hide current active tab
    if (this.activeTabId && this.activeTabId !== tabId) {
      const currentEntry = this.tabs.get(this.activeTabId);
      if (currentEntry) {
        currentEntry.view.setVisible(false);
        currentEntry.tab.isActive = false;
      }
    }

    const entry = this.tabs.get(tabId);
    if (!entry) throw new Error(`Tab not found: ${tabId}`);

    entry.tab.isActive = true;
    this.activeTabId = tabId;

    const bounds = this.getContentBounds();
    entry.view.setBounds(bounds);
    entry.view.setVisible(true);
    entry.view.webContents.focus();

    this.onTabUpdatedCallback?.(this.getTabSnapshot(tabId));
  }

  closeTab(tabId: string): void {
    if (!this.mainWindow) return;

    const entry = this.tabs.get(tabId);
    if (!entry) return;

    entry.view.setVisible(false);
    this.mainWindow.contentView.removeChildView(entry.view);
    entry.view.webContents.close();
    this.tabs.delete(tabId);

    if (this.onTabClosedCallback) {
      this.onTabClosedCallback(tabId);
    }

    // Switch to another tab if this was active
    if (this.activeTabId === tabId) {
      this.activeTabId = null;
      const remaining = Array.from(this.tabs.keys());
      if (remaining.length > 0) {
        this.switchTab(remaining[remaining.length - 1]);
      }
    }
  }

  navigateTo(tabId: string, url: string): void {
    const entry = this.tabs.get(tabId);
    if (!entry) return;

    let finalUrl = url;
    if (url === 'persona://newtab') {
      this.loadNewTabPage(entry.view);
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = 'https://' + url;
      } else {
        const settings = settingsManager.getSettings();
        const engines: Record<string, string> = {
          duckduckgo: 'https://duckduckgo.com/?q=',
          google: 'https://www.google.com/search?q=',
          bing: 'https://www.bing.com/search?q=',
          brave: 'https://search.brave.com/search?q=',
        };
        finalUrl = (engines[settings.defaultSearchEngine] ?? engines['duckduckgo']) + encodeURIComponent(url);
      }
    }

    entry.view.webContents.loadURL(finalUrl);
  }

  goBack(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry?.view.webContents.canGoBack()) {
      entry.view.webContents.goBack();
    }
  }

  goForward(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry?.view.webContents.canGoForward()) {
      entry.view.webContents.goForward();
    }
  }

  reload(tabId: string): void {
    const entry = this.tabs.get(tabId);
    entry?.view.webContents.reload();
  }

  getUrl(tabId: string): string {
    const entry = this.tabs.get(tabId);
    return entry?.view.webContents.getURL() ?? '';
  }

  getTabs(): Tab[] {
    return Array.from(this.tabs.entries()).map(([id, entry]) => ({
      ...entry.tab,
      isActive: id === this.activeTabId,
    }));
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }
}

export const tabManager = new TabManager();
