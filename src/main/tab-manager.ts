import { BrowserWindow, WebContentsView } from 'electron';
import { Tab } from '../shared/types';
import { personaManager } from './persona-manager';
import { settingsManager } from './settings-manager';
import { historyManager } from './history-manager';

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
    const searchBase = {
      duckduckgo: 'https://duckduckgo.com/?q=',
      google: 'https://www.google.com/search?q=',
      bing: 'https://www.bing.com/search?q=',
      brave: 'https://search.brave.com/search?q=',
    }[settings.defaultSearchEngine] ?? 'https://duckduckgo.com/?q=';

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
      background:
        radial-gradient(circle at top right, ${persona?.color ?? '#e94560'}44, transparent 24%),
        radial-gradient(circle at bottom left, rgba(255,255,255,0.12), transparent 18%),
        linear-gradient(160deg, #09111f 0%, #13203a 48%, #0b1424 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 32px;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(circle at center, black, transparent 72%);
      pointer-events: none;
    }
    .persona-badge {
      position: fixed;
      top: 28px;
      right: 28px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 999px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      backdrop-filter: blur(18px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    }
    .persona-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: ${persona?.color ?? '#e94560'};
    }
    .shell {
      width: min(980px, 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      position: relative;
      z-index: 1;
    }
    .eyebrow {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.76);
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .hero {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .hero h1 {
      font-size: clamp(42px, 7vw, 72px);
      line-height: 0.94;
      letter-spacing: -0.06em;
      max-width: 780px;
    }
    .hero p {
      font-size: 17px;
      color: rgba(255,255,255,0.68);
      max-width: 680px;
      line-height: 1.6;
    }
    .clock {
      font-size: clamp(54px, 8vw, 88px);
      font-weight: 700;
      letter-spacing: -0.06em;
      text-shadow: 0 0 40px rgba(255,255,255,0.16);
    }
    .date {
      font-size: 15px;
      color: rgba(255,255,255,0.58);
    }
    .search-container {
      width: min(720px, 100%);
    }
    .search-form {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 24px;
      padding: 8px 8px 8px 18px;
      backdrop-filter: blur(24px);
      transition: all 0.3s ease;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
    }
    .search-form:focus-within {
      background: rgba(255,255,255,0.12);
      border-color: ${persona?.color ?? '#e94560'};
      box-shadow: 0 0 0 4px ${persona?.color ?? '#e94560'}22;
    }
    .search-icon {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      color: rgba(255,255,255,0.8);
    }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: white;
      font-size: 18px;
      padding: 12px 0;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.4); }
    .search-btn {
      background: linear-gradient(135deg, ${persona?.color ?? '#e94560'}, ${persona?.color ?? '#e94560'}cc);
      border: none;
      border-radius: 18px;
      color: white;
      cursor: pointer;
      padding: 14px 22px;
      font-size: 14px;
      font-weight: 700;
      transition: opacity 0.2s, transform 0.2s;
    }
    .search-btn:hover { opacity: 0.92; transform: translateY(-1px); }
    .dashboard {
      width: min(900px, 100%);
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 18px;
    }
    .panel {
      border-radius: 26px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(22px);
      padding: 20px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.24);
    }
    .panel-kicker {
      color: rgba(255,255,255,0.5);
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .panel-title {
      margin-top: 10px;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .panel-subtitle {
      margin-top: 8px;
      color: rgba(255,255,255,0.66);
      font-size: 14px;
      line-height: 1.6;
    }
    .quick-links {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .quick-link {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      min-height: 82px;
      padding: 14px;
      text-align: left;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      text-decoration: none;
      color: rgba(255,255,255,0.86);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quick-link:hover {
      background: rgba(255,255,255,0.1);
      transform: translateY(-2px);
      border-color: rgba(255,255,255,0.24);
    }
    .quick-link-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: rgba(255,255,255,0.08);
      flex-shrink: 0;
      font-size: 18px;
    }
    .quick-link-title {
      font-weight: 700;
    }
    .quick-link-url {
      color: rgba(255,255,255,0.52);
      font-size: 11px;
      margin-top: 4px;
    }
    .focus-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .focus-card {
      align-items: center;
      padding: 14px;
      border-radius: 18px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .focus-card strong {
      display: block;
      font-size: 15px;
      margin-top: 8px;
    }
    .focus-card span {
      display: block;
      color: rgba(255,255,255,0.58);
      font-size: 12px;
      line-height: 1.5;
      margin-top: 6px;
    }
    @media (max-width: 760px) {
      .dashboard { grid-template-columns: 1fr; }
      .quick-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .persona-badge { left: 20px; right: auto; top: 20px; }
    }
  </style>
</head>
<body>
  <div class="persona-badge">
    <div class="persona-dot"></div>
    ${persona?.icon ?? '🌐'} ${persona?.name ?? 'Personal'}
  </div>
  <main class="shell">
    <div class="eyebrow">Persona Browser Workspace</div>
    <section class="hero">
      <h1>One browser. Many identities.</h1>
      <p>Separate work, personal, and private sessions in a cleaner browser shell built for focus.</p>
      <div class="clock" id="clock">00:00:00</div>
      <div class="date" id="date"></div>
    </section>
    <div class="search-container">
      <form class="search-form" id="searchForm">
        <div class="search-icon">⌕</div>
        <input class="search-input" type="text" placeholder="Search or enter address..." id="searchInput" autofocus>
        <button class="search-btn" type="submit">Go</button>
      </form>
    </div>
    <section class="dashboard">
      <div class="panel">
        <div class="panel-kicker">Quick Launch</div>
        <div class="panel-title">Start from somewhere useful</div>
        <div class="panel-subtitle">Jump straight into the places you visit most while keeping each persona isolated.</div>
        <div class="quick-links">
          <a class="quick-link" onclick="navigate('https://github.com')">
            <span class="quick-link-icon">◎</span>
            <div><div class="quick-link-title">GitHub</div><div class="quick-link-url">github.com</div></div>
          </a>
          <a class="quick-link" onclick="navigate('https://news.ycombinator.com')">
            <span class="quick-link-icon">HN</span>
            <div><div class="quick-link-title">Hacker News</div><div class="quick-link-url">news.ycombinator.com</div></div>
          </a>
          <a class="quick-link" onclick="navigate('https://reddit.com')">
            <span class="quick-link-icon">R</span>
            <div><div class="quick-link-title">Reddit</div><div class="quick-link-url">reddit.com</div></div>
          </a>
          <a class="quick-link" onclick="navigate('https://youtube.com')">
            <span class="quick-link-icon">▶</span>
            <div><div class="quick-link-title">YouTube</div><div class="quick-link-url">youtube.com</div></div>
          </a>
          <a class="quick-link" onclick="navigate('https://x.com')">
            <span class="quick-link-icon">X</span>
            <div><div class="quick-link-title">X</div><div class="quick-link-url">x.com</div></div>
          </a>
          <a class="quick-link" onclick="navigate('https://proton.me')">
            <span class="quick-link-icon">✉</span>
            <div><div class="quick-link-title">Proton</div><div class="quick-link-url">proton.me</div></div>
          </a>
        </div>
      </div>
      <div class="panel">
        <div class="panel-kicker">Focused Browsing</div>
        <div class="panel-title">${persona?.name ?? 'Personal'} profile</div>
        <div class="panel-subtitle">Your active persona keeps cookies, sessions, and local storage independent from every other workspace.</div>
        <div class="focus-grid">
          <div class="focus-card">
            <div class="panel-kicker">Security</div>
            <strong>HTTPS-first</strong>
            <span>Warnings surface quickly when a page drops below modern defaults.</span>
          </div>
          <div class="focus-card">
            <div class="panel-kicker">Isolation</div>
            <strong>Session walls</strong>
            <span>Each persona acts like a dedicated browser without the profile-switching drag.</span>
          </div>
        </div>
      </div>
    </section>
  </main>
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
        window.location.href = '${searchBase}' + encodeURIComponent(query);
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
