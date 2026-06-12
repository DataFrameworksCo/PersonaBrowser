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
    const activeWorkspace = settings.workspaces.find((workspace) => workspace.id === settings.activeWorkspaceId)
      ?? settings.workspaces[0];
    const featuredLinks = (activeWorkspace?.links ?? []).slice(0, 6);
    const bookmarks = settings.bookmarks.slice(0, 6);
    const readingList = settings.readingList.slice(0, 4);
    const workspaces = settings.workspaces.slice(0, 4);

    const escapeHtml = (value: string): string => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const featuredLinksMarkup = featuredLinks.map((link) => `
      <button class="launch-item" onclick="navigate(decodeURIComponent('${encodeURIComponent(link.url)}'))">
        <span class="launch-item-kicker">${escapeHtml(activeWorkspace?.name ?? 'Desk')}</span>
        <span class="launch-item-title">${escapeHtml(link.title)}</span>
        <span class="launch-item-desc">${escapeHtml(link.description || link.url)}</span>
      </button>
    `).join('');

    const bookmarkMarkup = bookmarks.map((bookmark) => `
      <button class="list-row" onclick="navigate(decodeURIComponent('${encodeURIComponent(bookmark.url)}'))">
        <span class="list-row-title">${escapeHtml(bookmark.title)}</span>
        <span class="list-row-meta">${escapeHtml(bookmark.url.replace(/^https?:\/\//, ''))}</span>
      </button>
    `).join('');

    const readingMarkup = readingList.map((item) => `
      <button class="list-row" onclick="navigate(decodeURIComponent('${encodeURIComponent(item.url)}'))">
        <span class="list-row-title">${escapeHtml(item.title)}</span>
        <span class="list-row-meta">
          <span class="status-pill ${escapeHtml(item.state)}">${escapeHtml(item.state)}</span>
          ${escapeHtml(item.url.replace(/^https?:\/\//, ''))}
        </span>
      </button>
    `).join('');

    const workspaceMarkup = workspaces.map((workspace) => `
      <div class="workspace-card">
        <div class="workspace-card-head">
          <span class="workspace-card-icon" style="color:${escapeHtml(workspace.color)}">${escapeHtml(workspace.icon)}</span>
          <span class="workspace-card-name">${escapeHtml(workspace.name)}</span>
        </div>
        <div class="workspace-card-desc">${escapeHtml(workspace.description)}</div>
        <div class="workspace-card-meta">${workspace.links.length} links</div>
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Aptos', 'Segoe UI Variable Text', 'Inter', sans-serif;
      background:
        linear-gradient(180deg, rgba(15, 11, 9, 0.92), rgba(15, 11, 9, 0.92)),
        radial-gradient(circle at top right, ${accentColor}18, transparent 32%),
        #171311;
      min-height: 100vh;
      color: #181410;
      padding: 28px;
    }
    .page {
      min-height: calc(100vh - 56px);
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
      gap: 18px;
    }
    .panel {
      background: #f1eadf;
      border-radius: 28px;
      border: 1px solid rgba(24, 20, 16, 0.08);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.22);
    }
    .hero {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .aside {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 18px;
      background: rgba(241, 234, 223, 0.06);
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.08);
      color: #f1eadf;
    }
    .persona-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(24, 20, 16, 0.08);
      background: rgba(255,255,255,0.54);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      width: fit-content;
    }
    .persona-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${accentColor};
      flex-shrink: 0;
    }
    .headline {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-bottom: 1px solid rgba(24, 20, 16, 0.09);
      padding-bottom: 22px;
    }
    .eyebrow {
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(24, 20, 16, 0.58);
      font-weight: 700;
    }
    .title {
      font-family: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
      font-size: clamp(46px, 7vw, 74px);
      line-height: 0.96;
      letter-spacing: -0.045em;
      max-width: 10ch;
    }
    .subcopy {
      max-width: 56ch;
      color: rgba(24, 20, 16, 0.7);
      font-size: 15px;
      line-height: 1.65;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
      gap: 18px;
    }
    .clock-card, .brief-card, .launch-card, .list-card, .workspace-card {
      border-radius: 22px;
      border: 1px solid rgba(24, 20, 16, 0.08);
      background: rgba(255,255,255,0.55);
    }
    .clock-card {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 240px;
      justify-content: space-between;
    }
    .clock-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .clock {
      font-family: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
      font-size: clamp(60px, 9vw, 92px);
      letter-spacing: -0.06em;
      line-height: 0.9;
    }
    .clock-seconds {
      font-size: 0.42em;
      color: rgba(24, 20, 16, 0.42);
      vertical-align: middle;
    }
    .date {
      font-size: 14px;
      color: rgba(24, 20, 16, 0.58);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .search-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
    }
    .search-input {
      height: 50px;
      border-radius: 16px;
      border: 1px solid rgba(24, 20, 16, 0.1);
      background: rgba(255,255,255,0.7);
      padding: 0 16px;
      font-size: 15px;
      color: #181410;
    }
    .search-btn {
      height: 50px;
      border-radius: 16px;
      border: 0;
      background: #181410;
      color: #f1eadf;
      padding: 0 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .brief-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(24, 20, 16, 0.5);
      font-weight: 700;
    }
    .section-title {
      font-family: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
      font-size: 22px;
      line-height: 1.1;
    }
    .section-copy {
      color: rgba(24, 20, 16, 0.7);
      line-height: 1.55;
      font-size: 14px;
    }
    .launch-card {
      margin-top: 4px;
      padding: 18px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .launch-item {
      text-align: left;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(24, 20, 16, 0.08);
      background: rgba(255,255,255,0.64);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: inherit;
    }
    .launch-item-kicker {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(24, 20, 16, 0.46);
      font-weight: 700;
    }
    .launch-item-title {
      font-size: 16px;
      font-weight: 700;
    }
    .launch-item-desc {
      font-size: 13px;
      line-height: 1.5;
      color: rgba(24, 20, 16, 0.66);
    }
    .aside-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(241, 234, 223, 0.56);
      font-weight: 700;
    }
    .workspace-grid {
      display: grid;
      gap: 10px;
    }
    .workspace-card {
      padding: 16px;
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.08);
      color: inherit;
    }
    .workspace-card-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .workspace-card-icon {
      font-size: 12px;
      font-weight: 800;
      border: 1px solid currentColor;
      border-radius: 8px;
      padding: 4px 6px;
    }
    .workspace-card-name {
      font-size: 15px;
      font-weight: 700;
    }
    .workspace-card-desc {
      margin-top: 10px;
      color: rgba(241, 234, 223, 0.72);
      line-height: 1.5;
      font-size: 13px;
    }
    .workspace-card-meta {
      margin-top: 12px;
      color: rgba(241, 234, 223, 0.52);
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .list-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.08);
      color: inherit;
    }
    .list-row {
      text-align: left;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      border-radius: 16px;
      padding: 14px;
      color: inherit;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .list-row-title {
      font-size: 14px;
      font-weight: 700;
    }
    .list-row-meta {
      color: rgba(241, 234, 223, 0.62);
      font-size: 12px;
      line-height: 1.5;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 64px;
      margin-right: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .status-pill.unread { background: rgba(138, 101, 70, 0.22); color: #f7d0af; }
    .status-pill.reading { background: rgba(54, 91, 134, 0.24); color: #b6d4f4; }
    .status-pill.done { background: rgba(79, 107, 69, 0.24); color: #cde3be; }
    .empty-copy {
      color: rgba(241, 234, 223, 0.58);
      font-size: 13px;
      line-height: 1.6;
    }
    @media (max-width: 1080px) {
      .page {
        grid-template-columns: 1fr;
      }
      .hero-grid,
      .launch-card {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="panel hero">
      <div class="persona-pill">
        <div class="persona-dot"></div>
        ${escapeHtml(persona?.name ?? 'Personal')} Desk
      </div>

      <div class="headline">
        <div class="eyebrow">Structured Start</div>
        <div class="title">A browser built for real work.</div>
        <div class="subcopy">Use the start page as a live desk: quick search, focused launch links, reading backlog, and workspace context without the usual glossy filler.</div>
      </div>

      <div class="hero-grid">
        <div class="clock-card">
          <div class="clock-block">
            <div class="clock" id="clock">00:00<span class="clock-seconds" id="secs">:00</span></div>
            <div class="date" id="date"></div>
          </div>
          <form class="search-form" id="searchForm">
            <input class="search-input" type="text" placeholder="Search or enter address..." id="searchInput" autofocus>
            <button class="search-btn" type="submit">Go</button>
          </form>
        </div>

        <div class="brief-card">
          <div class="section-kicker">Active Workspace</div>
          <div class="section-title">${escapeHtml(activeWorkspace?.name ?? 'Workspace')}</div>
          <div class="section-copy">${escapeHtml(activeWorkspace?.focusNote || activeWorkspace?.description || 'Use workspaces to keep browsing intent visible instead of scattered across tabs.')}</div>
        </div>
      </div>

      <div class="section-kicker">Launch Board</div>
      <div class="launch-card">
        ${featuredLinksMarkup || '<div class="section-copy">Add launch links to the active workspace from the sidebar.</div>'}
      </div>
    </section>

    <aside class="aside">
      <div>
        <div class="aside-title">Workspaces</div>
        <div class="workspace-grid">${workspaceMarkup}</div>
      </div>

      <div class="list-card">
        <div class="aside-title">Bookmarks</div>
        ${bookmarkMarkup || '<div class="empty-copy">Saved bookmarks will show up here.</div>'}
      </div>

      <div class="list-card">
        <div class="aside-title">Reading Queue</div>
        ${readingMarkup || '<div class="empty-copy">Queue articles from the toolbar or command center.</div>'}
      </div>
    </aside>
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
