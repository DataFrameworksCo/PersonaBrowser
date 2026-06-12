import Store from 'electron-store';
import {
  Settings,
  Persona,
  Widget,
  Workspace,
  BookmarkEntry,
  ReadingListItem,
} from '../shared/types';

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'work',
    name: 'Work',
    color: '#4A9EFF',
    icon: '💼',
    createdAt: Date.now(),
    isPersistent: true,
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#4AFF91',
    icon: '🏠',
    createdAt: Date.now(),
    isPersistent: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    color: '#B44AFF',
    icon: '🎮',
    createdAt: Date.now(),
    isPersistent: true,
  },
  {
    id: 'incognito',
    name: 'Incognito',
    color: '#808080',
    icon: '🕵️',
    createdAt: Date.now(),
    isPersistent: false,
  },
];

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'clock-1', type: 'clock', title: 'Clock', enabled: true },
  { id: 'notes-1', type: 'notes', title: 'Notes', enabled: true },
  { id: 'bookmarks-1', type: 'bookmarks', title: 'Bookmarks', enabled: true },
];

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'briefing',
    name: 'Briefing',
    icon: 'BR',
    color: '#8a6546',
    description: 'Mail, calendar, and the first scan of the day.',
    focusNote: 'Keep this space for comms, dashboards, and inbox triage.',
    links: [
      { id: 'briefing-gmail', title: 'Gmail', url: 'https://mail.google.com', description: 'Primary inbox' },
      { id: 'briefing-calendar', title: 'Calendar', url: 'https://calendar.google.com', description: 'Schedule' },
      { id: 'briefing-news', title: 'Hacker News', url: 'https://news.ycombinator.com', description: 'Morning read' },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'build',
    name: 'Build',
    icon: 'DV',
    color: '#365b86',
    description: 'Repos, docs, CI, and deployment surfaces.',
    focusNote: 'Use this space for implementation work and release checks.',
    links: [
      { id: 'build-github', title: 'GitHub', url: 'https://github.com', description: 'Repos and PRs' },
      { id: 'build-mdn', title: 'MDN', url: 'https://developer.mozilla.org', description: 'Web reference' },
      { id: 'build-npm', title: 'npm', url: 'https://www.npmjs.com', description: 'Package registry' },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'research',
    name: 'Research',
    icon: 'RS',
    color: '#4f6b45',
    description: 'Specifications, tickets, and long-form reading.',
    focusNote: 'Capture source material here before it turns into implementation.',
    links: [
      { id: 'research-wiki', title: 'Wikipedia', url: 'https://www.wikipedia.org', description: 'Reference' },
      { id: 'research-duck', title: 'DuckDuckGo', url: 'https://duckduckgo.com', description: 'Search' },
      { id: 'research-youtube', title: 'YouTube', url: 'https://www.youtube.com', description: 'Walkthroughs' },
    ],
    createdAt: Date.now(),
  },
];

const DEFAULT_BOOKMARKS: BookmarkEntry[] = [
  {
    id: 'bookmark-github',
    title: 'GitHub',
    url: 'https://github.com',
    favicon: '',
    personaId: 'work',
    addedAt: Date.now(),
  },
  {
    id: 'bookmark-mdn',
    title: 'MDN',
    url: 'https://developer.mozilla.org',
    favicon: '',
    personaId: 'work',
    addedAt: Date.now(),
  },
  {
    id: 'bookmark-ddg',
    title: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    favicon: '',
    personaId: 'personal',
    addedAt: Date.now(),
  },
];

const DEFAULT_READING_LIST: ReadingListItem[] = [];

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accentColor: '#6366f1',
  defaultSearchEngine: 'duckduckgo',
  privacyLevel: 'standard',
  trackerBlocking: true,
  httpsOnly: false,
  personas: DEFAULT_PERSONAS,
  activePersonaId: 'personal',
  sidebarWidgets: DEFAULT_WIDGETS,
  sidebarOpen: true,
  installedExtensions: [],
  historyEntries: [],
  downloadHistory: [],
  bookmarks: DEFAULT_BOOKMARKS,
  readingList: DEFAULT_READING_LIST,
  workspaces: DEFAULT_WORKSPACES,
  activeWorkspaceId: 'build',
  newTabUrl: 'persona://newtab',
  customAccentColors: {},
};

type StoreSchema = {
  settings: Settings;
};

class SettingsManager {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'persona-settings',
      defaults: {
        settings: DEFAULT_SETTINGS,
      },
    });
  }

  getSettings(): Settings {
    const stored = this.store.get('settings') as Settings;
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    // Migrate old default accent color to new default
    if (merged.accentColor === '#e94560') {
      merged.accentColor = DEFAULT_SETTINGS.accentColor;
    }
    return merged;
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const current = this.getSettings();
    current[key] = value;
    this.store.set('settings', current);
  }

  getPersonas(): Persona[] {
    return this.getSettings().personas;
  }

  getPersonaById(id: string): Persona | undefined {
    return this.getPersonas().find((p) => p.id === id);
  }

  addPersona(persona: Persona): void {
    const settings = this.getSettings();
    settings.personas.push(persona);
    this.store.set('settings', settings);
  }

  updatePersona(id: string, updates: Partial<Persona>): void {
    const settings = this.getSettings();
    const idx = settings.personas.findIndex((p) => p.id === id);
    if (idx !== -1) {
      settings.personas[idx] = { ...settings.personas[idx], ...updates };
      this.store.set('settings', settings);
    }
  }

  deletePersona(id: string): void {
    const settings = this.getSettings();
    settings.personas = settings.personas.filter((p) => p.id !== id);
    if (settings.activePersonaId === id) {
      settings.activePersonaId = settings.personas[0]?.id ?? 'personal';
    }
    this.store.set('settings', settings);
  }

  getActivePersonaId(): string {
    return this.getSettings().activePersonaId;
  }

  setActivePersonaId(id: string): void {
    this.setSetting('activePersonaId', id);
  }

  getSidebarWidgets(): Widget[] {
    return this.getSettings().sidebarWidgets;
  }

  addWidget(widget: Widget): void {
    const settings = this.getSettings();
    settings.sidebarWidgets.push(widget);
    this.store.set('settings', settings);
  }

  removeWidget(widgetId: string): void {
    const settings = this.getSettings();
    settings.sidebarWidgets = settings.sidebarWidgets.filter((w) => w.id !== widgetId);
    this.store.set('settings', settings);
  }
}

export const settingsManager = new SettingsManager();
