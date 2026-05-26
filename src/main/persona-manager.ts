import { session, Session } from 'electron';
import { Persona } from '../shared/types';
import { settingsManager } from './settings-manager';
import { extensionManager } from './extension-manager';
import { downloadManager } from './download-manager';

class PersonaManager {
  private sessionCache: Map<string, Session> = new Map();

  getPersonaSession(personaId: string): Session {
    if (this.sessionCache.has(personaId)) {
      return this.sessionCache.get(personaId)!;
    }

    const persona = settingsManager.getPersonaById(personaId);
    let newSession: Session;

    if (persona && !persona.isPersistent) {
      // Incognito-style non-persistent session
      newSession = session.fromPartition(`persona-${personaId}`, { cache: false });
    } else {
      // Persistent session
      newSession = session.fromPartition(`persist:persona-${personaId}`);
    }

    this.configureSession(newSession);
    downloadManager.registerSession(newSession, personaId);
    extensionManager.registerSession(newSession, !!persona?.isPersistent || !persona);
    this.sessionCache.set(personaId, newSession);
    return newSession;
  }

  private configureSession(sess: Session): void {
    const settings = settingsManager.getSettings();

    if (settings.trackerBlocking) {
      sess.webRequest.onBeforeRequest(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          const blocked = this.shouldBlockRequest(details.url);
          callback({ cancel: blocked });
        }
      );
    }

    // Set a custom user agent
    sess.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PersonaBrowser/1.0'
    );
  }

  private shouldBlockRequest(url: string): boolean {
    const trackerPatterns = [
      /google-analytics\.com/,
      /googletagmanager\.com/,
      /doubleclick\.net/,
      /facebook\.com\/tr/,
      /connect\.facebook\.net/,
      /analytics\.twitter\.com/,
      /static\.ads-twitter\.com/,
      /bat\.bing\.com/,
      /scorecardresearch\.com/,
      /quantserve\.com/,
      /adnxs\.com/,
      /adsystem\.com/,
      /adroll\.com/,
      /hotjar\.com/,
      /mixpanel\.com/,
      /segment\.io/,
      /segment\.com\/analytics/,
      /amplitude\.com\/api/,
      /fullstory\.com/,
      /logrocket\.com/,
    ];

    return trackerPatterns.some((pattern) => pattern.test(url));
  }

  createPersona(name: string, color: string, icon: string): Persona {
    const id = `persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const persona: Persona = {
      id,
      name,
      color,
      icon,
      createdAt: Date.now(),
      isPersistent: true,
    };
    settingsManager.addPersona(persona);
    return persona;
  }

  deletePersona(personaId: string): void {
    // Clean up session cache
    this.sessionCache.delete(personaId);
    settingsManager.deletePersona(personaId);
  }

  getPersonas(): Persona[] {
    return settingsManager.getPersonas();
  }

  getActivePersonaId(): string {
    return settingsManager.getActivePersonaId();
  }

  switchPersona(personaId: string): void {
    settingsManager.setActivePersonaId(personaId);
  }

  refreshTrackerBlocking(): void {
    // Re-apply tracker settings to all active sessions
    for (const [, sess] of this.sessionCache) {
      this.configureSession(sess);
    }
  }
}

export const personaManager = new PersonaManager();
