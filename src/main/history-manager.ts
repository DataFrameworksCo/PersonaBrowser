import { HistoryEntry } from '../shared/types';
import { settingsManager } from './settings-manager';

const HISTORY_LIMIT = 250;
const HISTORY_DEDUP_WINDOW_MS = 2 * 60 * 1000;

type VisitPayload = {
  url: string;
  title: string;
  favicon: string;
  personaId: string;
};

class HistoryManager {
  getEntries(): HistoryEntry[] {
    return [...settingsManager.getSettings().historyEntries]
      .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
  }

  private setEntries(entries: HistoryEntry[]): void {
    settingsManager.setSetting('historyEntries', entries);
  }

  recordVisit({ url, title, favicon, personaId }: VisitPayload): void {
    if (!url || url.startsWith('data:') || url.startsWith('persona://')) return;

    const now = Date.now();
    const entries = this.getEntries();
    const recentMatch = entries.find(
      (entry) => entry.url === url
        && entry.personaId === personaId
        && now - entry.lastVisitedAt < HISTORY_DEDUP_WINDOW_MS
    );

    if (recentMatch) {
      const nextEntries = entries.map((entry) => (
        entry.id === recentMatch.id
          ? {
            ...entry,
            title: title || entry.title,
            favicon: favicon || entry.favicon,
            lastVisitedAt: now,
            visitCount: entry.visitCount + 1,
          }
          : entry
      ));
      this.setEntries(nextEntries);
      return;
    }

    const nextEntry: HistoryEntry = {
      id: `history-${now}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      title: title || url,
      favicon,
      personaId,
      lastVisitedAt: now,
      visitCount: 1,
    };

    this.setEntries([nextEntry, ...entries].slice(0, HISTORY_LIMIT));
  }

  removeEntry(entryId: string): HistoryEntry[] {
    const nextEntries = this.getEntries().filter((entry) => entry.id !== entryId);
    this.setEntries(nextEntries);
    return nextEntries;
  }

  clear(): HistoryEntry[] {
    this.setEntries([]);
    return [];
  }
}

export const historyManager = new HistoryManager();
