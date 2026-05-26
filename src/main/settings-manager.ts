import Store from 'electron-store';
import { Settings, Persona, Widget, Theme, SearchEngine, PrivacyLevel } from '../shared/types';

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

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accentColor: '#e94560',
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
    // Merge with defaults to handle new keys added in updates
    return { ...DEFAULT_SETTINGS, ...stored };
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
