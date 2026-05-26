import { DownloadItem, Session, shell } from 'electron';
import fs from 'fs';
import { DownloadRecord, DownloadStatus } from '../shared/types';
import { settingsManager } from './settings-manager';

class DownloadManager {
  private registeredSessions = new Set<Session>();
  private onChangedCallback: ((downloads: DownloadRecord[]) => void) | null = null;

  setOnChanged(callback: (downloads: DownloadRecord[]) => void): void {
    this.onChangedCallback = callback;
  }

  registerSession(sess: Session, personaId: string): void {
    if (this.registeredSessions.has(sess)) return;
    this.registeredSessions.add(sess);

    sess.on('will-download', (_event, item) => {
      this.trackDownload(item, personaId);
    });
  }

  getDownloads(): DownloadRecord[] {
    return [...settingsManager.getSettings().downloadHistory]
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  clearDownloads(): DownloadRecord[] {
    settingsManager.setSetting('downloadHistory', []);
    this.emit();
    return [];
  }

  async openDownload(downloadId: string): Promise<void> {
    const target = this.getDownloads().find((download) => download.id === downloadId);
    if (!target?.savePath || !fs.existsSync(target.savePath)) {
      throw new Error('Downloaded file is no longer available.');
    }
    await shell.openPath(target.savePath);
  }

  revealDownload(downloadId: string): void {
    const target = this.getDownloads().find((download) => download.id === downloadId);
    if (!target?.savePath || !fs.existsSync(target.savePath)) {
      throw new Error('Downloaded file is no longer available.');
    }
    shell.showItemInFolder(target.savePath);
  }

  private emit(): void {
    this.onChangedCallback?.(this.getDownloads());
  }

  private setDownloads(downloads: DownloadRecord[]): void {
    settingsManager.setSetting('downloadHistory', downloads);
    this.emit();
  }

  private upsert(record: DownloadRecord): void {
    const downloads = this.getDownloads();
    const nextDownloads = [
      record,
      ...downloads.filter((entry) => entry.id !== record.id),
    ].slice(0, 120);
    this.setDownloads(nextDownloads);
  }

  private toStatus(state: string): DownloadStatus {
    if (state === 'completed') return 'completed';
    if (state === 'cancelled') return 'cancelled';
    return 'interrupted';
  }

  private trackDownload(item: DownloadItem, personaId: string): void {
    const id = `download-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const getSnapshot = (status: DownloadStatus, finishedAt?: number): DownloadRecord => ({
      id,
      url: item.getURL(),
      fileName: item.getFilename(),
      status,
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      savePath: item.getSavePath() || undefined,
      personaId,
      startedAt: Date.now(),
      finishedAt,
    });

    const startedAt = Date.now();
    const snapshot = (status: DownloadStatus, finishedAt?: number): DownloadRecord => ({
      ...getSnapshot(status, finishedAt),
      startedAt,
    });

    this.upsert(snapshot('progressing'));

    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        this.upsert(snapshot('progressing'));
        return;
      }
      this.upsert(snapshot('interrupted'));
    });

    item.once('done', (_event, state) => {
      this.upsert(snapshot(this.toStatus(state), Date.now()));
    });
  }
}

export const downloadManager = new DownloadManager();
