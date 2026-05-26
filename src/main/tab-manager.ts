import { BrowserWindow, WebContentsView } from 'electron';
import { Tab } from '../shared/types';
import { personaManager } from './persona-manager';
import { settingsManager } from './settings-manager';
import { historyManager } from './history-manager';

const TAB_BAR_HEIGHT = 40;
const TOOLBAR_ROW_HEIGHT = 48;
const TOOLBAR_HEIGHT = TAB_BAR_HEIGHT + TOOLBAR_ROW_HEIGHT; // 88
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
    const searchBase = {
      duckduckgo: 'https://duckduckgo.com/?q=',
      google: 'https://www.google.com/search?q=',
      bing: 'https://www.bing.com/search?q=',
      brave: 'https://search.brave.com/search?q=',
    }[settings.defaultSearchEngine] ?? 'https://duckduckgo.com/?q=';

    const accentColor = persona?.color ?? '#6366f1';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
      background:
        radial-gradient(ellipse 60% 50% at 70% 0%, ${accentColor}1a, transparent),
        linear-gradient(180deg, #0b1120 0%, #111827 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 40px 24px;
      overflow: hidden;
    }
    .shell {
      width: min(680px, 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }
    .persona-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px 5px 8px;
      border-radius: 999px;
      border: 1px solid ${accentColor}33;
      background: ${accentColor}0f;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.75);
      letter-spacing: 0.01em;
    }
    .persona-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${accentColor};
      flex-shrink: 0;
    }
    .clock-block {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .clock {
      font-size: clamp(60px, 10vw, 96px);
      font-weight: 700;
      letter-spacing: -0.05em;
      color: #f0f4ff;
      line-height: 1;
    }
    .clock-seconds {
      font-size: 0.42em;
      font-weight: 500;
      color: rgba(255,255,255,0.45);
      vertical-align: middle;
    }
    .date {
      font-size: 14px;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.02em;
    }
    .search-wrap {
      width: 100%;
    }
    .search-form {
      display: flex;
      align-items: center;
      gap: 0;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      padding: 4px 4px 4px 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-form:focus-within {
      border-color: ${accentColor}66;
      box-shadow: 0 0 0 3px ${accentColor}18;
    }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: rgba(255,255,255,0.9);
      font-size: 15px;
      padding: 10px 0;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.3); }
    .search-btn {
      background: ${accentColor};
      border: none;
      border-radius: 12px;
      color: white;
      cursor: pointer;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 600;
      transition: opacity 0.15s, transform 0.15s;
      flex-shrink: 0;
    }
    .search-btn:hover { opacity: 0.88; transform: scale(0.98); }
    .shortcuts {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }
    .shortcut {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      padding: 12px 8px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.04);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
      text-decoration: none;
      color: rgba(255,255,255,0.75);
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .shortcut:hover {
      background: rgba(255,255,255,0.09);
      border-color: rgba(255,255,255,0.14);
      transform: translateY(-1px);
      color: rgba(255,255,255,0.9);
    }
    .shortcut-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      background: rgba(255,255,255,0.06);
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="persona-pill">
      <div class="persona-dot"></div>
      ${persona?.icon ?? ''} ${persona?.name ?? 'Personal'}
    </div>
    <div class="clock-block">
      <div class="clock" id="clock">00:00<span class="clock-seconds" id="secs">:00</span></div>
      <div class="date" id="date"></div>
    </div>
    <div class="search-wrap">
      <form class="search-form" id="searchForm">
        <input class="search-input" type="text" placeholder="Search or enter address…" id="searchInput" autofocus>
        <button class="search-btn" type="submit">Go</button>
      </form>
    </div>
    <div class="shortcuts">
      <a class="shortcut" onclick="navigate('https://github.com')">
        <div class="shortcut-icon">⌥</div>GitHub
      </a>
      <a class="shortcut" onclick="navigate('https://news.ycombinator.com')">
        <div class="shortcut-icon">Y</div>HN
      </a>
      <a class="shortcut" onclick="navigate('https://reddit.com')">
        <div class="shortcut-icon">R</div>Reddit
      </a>
      <a class="shortcut" onclick="navigate('https://youtube.com')">
        <div class="shortcut-icon">▶</div>YouTube
      </a>
      <a class="shortcut" onclick="navigate('https://x.com')">
        <div class="shortcut-icon">𝕏</div>X
      </a>
      <a class="shortcut" onclick="navigate('https://proton.me')">
        <div class="shortcut-icon">✉</div>Proton
      </a>
    </div>
  </main>
  <script>
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      document.getElementById('clock').firstChild.textContent = h + ':' + m;
      document.getElementById('secs').textContent = ':' + s;
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      document.getElementById('date').textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
    }
    setInterval(updateClock, 1000);
    updateClock();

    function navigate(url) { window.location.href = url; }

    document.getElementById('searchForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return;
      if (query.startsWith('http://') || query.startsWith('https://') || (query.includes('.') && !query.includes(' '))) {
        window.location.href = query.startsWith('http') ? query : 'https://' + query;
      } else {
        window.location.href = '${searchBase}' + encodeURIComponent(query);
      }
    });

    document.addEventListener('keydown', function(e) {
      const input = document.getElementById('searchInput');
      if (document.activeElement !== input && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
        input.focus();
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
      historyManager.recordVisit({
        url: wc.getURL(),
        title: wc.getTitle() || tab.title,
        favicon: tab.favicon,
        personaId: tab.personaId,
      });
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
