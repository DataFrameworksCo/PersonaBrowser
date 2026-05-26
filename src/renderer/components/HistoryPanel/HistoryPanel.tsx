import React, { useEffect, useMemo, useState } from 'react';
import { HistoryEntry } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import { usePersona } from '../../contexts/PersonaContext';
import AppIcon from '../ui/AppIcon';
import './HistoryPanel.css';

interface Props {
  onClose: () => void;
}

const HistoryPanel: React.FC<Props> = ({ onClose }) => {
  const { createTab } = useBrowser();
  const { personas } = usePersona();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    window.persona.getHistory().then(setEntries);
  }, []);

  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries;
    return entries.filter((entry) => `${entry.title} ${entry.url}`.toLowerCase().includes(normalized));
  }, [entries, query]);

  const removeEntry = async (entryId: string) => {
    const nextEntries = await window.persona.removeHistoryEntry(entryId);
    setEntries(nextEntries);
  };

  const clearHistory = async () => {
    const nextEntries = await window.persona.clearHistory();
    setEntries(nextEntries);
  };

  const formatTimestamp = (value: number) => new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="history-overlay">
      <div className="history-header">
        <button className="history-back" onClick={onClose}><AppIcon name="chevron-left" size={16} /></button>
        <div>
          <div className="history-kicker">Browsing Trail</div>
          <div className="history-title">History</div>
        </div>
        <button className="history-clear-btn" onClick={clearHistory} disabled={entries.length === 0}>
          <AppIcon name="trash" size={14} />
          Clear
        </button>
      </div>

      <div className="history-content">
        <div className="history-search">
          <AppIcon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your browsing history"
            autoFocus
          />
        </div>

        <div className="history-list">
          {visibleEntries.map((entry) => {
            const persona = personas.find((item) => item.id === entry.personaId);
            return (
              <div key={entry.id} className="history-item">
                <button
                  className="history-item-main"
                  onClick={async () => {
                    await createTab(entry.personaId, entry.url);
                    onClose();
                  }}
                >
                  <div className="history-item-favicon">
                    {entry.favicon ? <img src={entry.favicon} alt="" /> : <AppIcon name="globe" size={14} />}
                  </div>
                  <div className="history-item-copy">
                    <div className="history-item-title">{entry.title || entry.url}</div>
                    <div className="history-item-url">{entry.url}</div>
                  </div>
                  <div className="history-item-meta">
                    <span className="history-item-persona" style={{ borderColor: persona?.color ?? 'transparent' }}>
                      {persona?.name ?? 'Persona'}
                    </span>
                    <span>{formatTimestamp(entry.lastVisitedAt)}</span>
                    <span>{entry.visitCount} visit{entry.visitCount === 1 ? '' : 's'}</span>
                  </div>
                </button>
                <button
                  className="history-item-action"
                  onClick={() => removeEntry(entry.id)}
                  title="Remove from history"
                >
                  <AppIcon name="trash" size={14} />
                </button>
              </div>
            );
          })}

          {visibleEntries.length === 0 && (
            <div className="history-empty">
              <div className="history-empty-icon"><AppIcon name="history" size={22} /></div>
              <div className="history-empty-title">No history yet</div>
              <div className="history-empty-copy">Pages you open in Persona Browser will show up here for quick return visits.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
