import React, { useEffect, useMemo, useState } from 'react';
import { DownloadRecord } from '../../../shared/types';
import { usePersona } from '../../contexts/PersonaContext';
import AppIcon from '../ui/AppIcon';
import './DownloadsPanel.css';

interface Props {
  onClose: () => void;
}

const DownloadsPanel: React.FC<Props> = ({ onClose }) => {
  const { personas } = usePersona();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    window.persona.getDownloads().then(setDownloads);
    const offDownloadsChanged = window.persona.onDownloadsChanged(setDownloads);
    return () => {
      offDownloadsChanged();
    };
  }, []);

  const visibleDownloads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return downloads;
    return downloads.filter((download) => `${download.fileName} ${download.url}`.toLowerCase().includes(normalized));
  }, [downloads, query]);

  const clearDownloads = async () => {
    const nextDownloads = await window.persona.clearDownloads();
    setDownloads(nextDownloads);
  };

  const formatSize = (value: number) => {
    if (value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const scaled = value / 1024 ** index;
    return `${scaled.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const formatTime = (value: number) => new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="downloads-overlay">
      <div className="downloads-header">
        <button className="downloads-back" onClick={onClose}><AppIcon name="chevron-left" size={16} /></button>
        <div>
          <div className="downloads-kicker">Transfer Queue</div>
          <div className="downloads-title">Downloads</div>
        </div>
        <button className="downloads-clear-btn" onClick={clearDownloads} disabled={downloads.length === 0}>
          <AppIcon name="trash" size={14} />
          Clear
        </button>
      </div>

      <div className="downloads-content">
        <div className="downloads-search">
          <AppIcon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search downloads"
            autoFocus
          />
        </div>

        <div className="downloads-list">
          {visibleDownloads.map((download) => {
            const persona = personas.find((item) => item.id === download.personaId);
            const progress = download.totalBytes > 0
              ? Math.min(100, Math.round((download.receivedBytes / download.totalBytes) * 100))
              : 0;

            return (
              <div key={download.id} className="downloads-item">
                <div className="downloads-item-header">
                  <div className="downloads-item-icon">
                    <AppIcon name="download" size={16} />
                  </div>
                  <div className="downloads-item-copy">
                    <div className="downloads-item-title">{download.fileName}</div>
                    <div className="downloads-item-url">{download.url}</div>
                  </div>
                  <div className={`downloads-item-state ${download.status}`}>
                    {download.status}
                  </div>
                </div>

                <div className="downloads-progress-track">
                  <div className="downloads-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="downloads-item-meta">
                  <span>{formatSize(download.receivedBytes)} of {formatSize(download.totalBytes)}</span>
                  <span>{progress}%</span>
                  <span>{formatTime(download.finishedAt ?? download.startedAt)}</span>
                  <span className="downloads-item-persona" style={{ borderColor: persona?.color ?? 'transparent' }}>
                    {persona?.name ?? 'Persona'}
                  </span>
                </div>

                <div className="downloads-item-actions">
                  <button
                    className="downloads-action-btn"
                    onClick={() => window.persona.openDownload(download.id)}
                    disabled={download.status !== 'completed'}
                  >
                    <AppIcon name="launch" size={14} />
                    Open
                  </button>
                  <button
                    className="downloads-action-btn"
                    onClick={() => window.persona.revealDownload(download.id)}
                    disabled={download.status !== 'completed'}
                  >
                    <AppIcon name="folder" size={14} />
                    Reveal
                  </button>
                </div>
              </div>
            );
          })}

          {visibleDownloads.length === 0 && (
            <div className="downloads-empty">
              <div className="downloads-empty-icon"><AppIcon name="download" size={22} /></div>
              <div className="downloads-empty-title">No downloads yet</div>
              <div className="downloads-empty-copy">Files you download in Persona Browser will show up here with progress and quick access.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadsPanel;
