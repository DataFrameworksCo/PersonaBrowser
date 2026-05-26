import { BrowserWindow, dialog, Session, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { Extension } from '../shared/types';
import { settingsManager } from './settings-manager';

type RegisteredSession = {
  session: Session;
  persistent: boolean;
};

type ManifestShape = {
  name?: string;
  version?: string;
  description?: string;
  icons?: Record<string, string>;
};

class ExtensionManager {
  private registeredSessions = new Set<RegisteredSession>();

  registerSession(sess: Session, persistent: boolean): void {
    const existing = Array.from(this.registeredSessions).find((entry) => entry.session === sess);
    if (existing) return;

    const entry = { session: sess, persistent };
    this.registeredSessions.add(entry);

    if (persistent) {
      void this.applyInstalledExtensionsToSession(sess);
    }
  }

  getInstalledExtensions(): Extension[] {
    return settingsManager.getSettings().installedExtensions;
  }

  private setInstalledExtensions(installedExtensions: Extension[]): void {
    settingsManager.setSetting('installedExtensions', installedExtensions);
  }

  private async readManifest(folderPath: string): Promise<ManifestShape> {
    const manifestPath = path.join(folderPath, 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(manifestContent) as ManifestShape;
  }

  private getManifestIconUrl(folderPath: string, manifest: ManifestShape): string {
    const iconEntry = manifest.icons
      ? Object.entries(manifest.icons).sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1]
      : undefined;

    if (!iconEntry) return '';
    return pathToFileURL(path.join(folderPath, iconEntry)).toString();
  }

  private async ensureLoaded(sess: Session, extension: Extension): Promise<Extension> {
    if (!extension.localPath) throw new Error('Extension path is missing.');
    const existing = sess.getAllExtensions().find((loadedExtension) => (
      loadedExtension.path === extension.localPath
      || (extension.id ? loadedExtension.id === extension.id : false)
    ));
    const loaded = existing ?? await sess.loadExtension(extension.localPath, { allowFileAccess: true });
    return {
      ...extension,
      id: loaded.id,
      name: loaded.name,
      version: loaded.version,
      description: loaded.manifest.description ?? extension.description,
      icon: extension.icon || this.getManifestIconUrl(extension.localPath, loaded.manifest as ManifestShape),
      installed: true,
    };
  }

  private async applyInstalledExtensionsToSession(sess: Session): Promise<void> {
    const installed = this.getInstalledExtensions().filter((extension) => extension.enabled && extension.localPath);
    let nextInstalled = this.getInstalledExtensions();

    for (const extension of installed) {
      try {
        const normalized = await this.ensureLoaded(sess, extension);
        nextInstalled = nextInstalled.map((current) => current.localPath === normalized.localPath ? normalized : current);
      } catch {
        // Skip broken extension loads but keep the entry so the user can remove it.
      }
    }

    this.setInstalledExtensions(nextInstalled);
  }

  private async applyToRegisteredSessions(callback: (sess: Session) => Promise<void>): Promise<void> {
    const persistentSessions = Array.from(this.registeredSessions)
      .filter((entry) => entry.persistent)
      .map((entry) => entry.session);

    await Promise.all(persistentSessions.map((sess) => callback(sess)));
  }

  async installFromDialog(win: BrowserWindow): Promise<Extension> {
    const result = await dialog.showOpenDialog(win, {
      title: 'Load Unpacked Extension',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      throw new Error('Extension installation canceled.');
    }

    const folderPath = result.filePaths[0];
    const manifest = await this.readManifest(folderPath);
    const seeded: Extension = {
      id: '',
      name: manifest.name ?? path.basename(folderPath),
      description: manifest.description ?? 'Unpacked browser extension',
      version: manifest.version ?? '0.0.0',
      icon: this.getManifestIconUrl(folderPath, manifest),
      installed: true,
      enabled: true,
      localPath: folderPath,
    };

    const persistentSessions = Array.from(this.registeredSessions).filter((entry) => entry.persistent);
    if (persistentSessions.length === 0) {
      throw new Error('No persistent browser session is available yet. Open a persona tab and try again.');
    }

    const normalized = await this.ensureLoaded(persistentSessions[0].session, seeded);
    await Promise.all(
      persistentSessions.slice(1).map(async (entry) => {
        try {
          await this.ensureLoaded(entry.session, normalized);
        } catch {
          // Keep installing in other sessions even if one fails.
        }
      })
    );

    const installed = this.getInstalledExtensions().filter((extension) => extension.localPath !== normalized.localPath);
    installed.push(normalized);
    this.setInstalledExtensions(installed);
    return normalized;
  }

  async setEnabled(extensionId: string, enabled: boolean): Promise<Extension[]> {
    let installed = this.getInstalledExtensions();
    const target = installed.find((extension) => extension.id === extensionId);
    if (!target) throw new Error('Extension not found.');

    installed = installed.map((extension) =>
      extension.id === extensionId ? { ...extension, enabled } : extension
    );

    if (enabled) {
      await this.applyToRegisteredSessions(async (sess) => {
        await this.ensureLoaded(sess, { ...target, enabled: true });
      });
    } else {
      await this.applyToRegisteredSessions(async (sess) => {
        try {
          sess.removeExtension(extensionId);
        } catch {
          // Ignore sessions where the extension was not loaded.
        }
      });
    }

    this.setInstalledExtensions(installed);
    return installed;
  }

  async remove(extensionId: string): Promise<Extension[]> {
    const installed = this.getInstalledExtensions();
    const target = installed.find((extension) => extension.id === extensionId);
    if (!target) throw new Error('Extension not found.');

    await this.applyToRegisteredSessions(async (sess) => {
      try {
        sess.removeExtension(extensionId);
      } catch {
        // Ignore sessions where the extension was not loaded.
      }
    });

    const nextInstalled = installed.filter((extension) => extension.id !== extensionId);
    this.setInstalledExtensions(nextInstalled);
    return nextInstalled;
  }

  async revealInFolder(extensionId: string): Promise<void> {
    const target = this.getInstalledExtensions().find((extension) => extension.id === extensionId);
    if (!target?.localPath) throw new Error('Extension path not found.');
    await shell.openPath(target.localPath);
  }
}

export const extensionManager = new ExtensionManager();
