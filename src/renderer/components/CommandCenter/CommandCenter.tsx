import React, { useMemo, useState } from 'react';
import { useBrowser } from '../../contexts/BrowserContext';
import { usePersona } from '../../contexts/PersonaContext';
import AppIcon from '../ui/AppIcon';
import './CommandCenter.css';

interface Props {
  onClose: () => void;
}

const CommandCenter: React.FC<Props> = ({ onClose }) => {
  const { tabs, switchTab, createTab, duplicateTab, recentClosedTabs, reopenClosedTab } = useBrowser();
  const { personas } = usePersona();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleTabs = useMemo(() => tabs.filter((tab) => {
    if (!normalizedQuery) return true;
    return `${tab.title} ${tab.url}`.toLowerCase().includes(normalizedQuery);
  }), [normalizedQuery, tabs]);

  const visibleClosedTabs = useMemo(() => recentClosedTabs.filter((tab) => {
    if (!normalizedQuery) return true;
    return `${tab.title} ${tab.url}`.toLowerCase().includes(normalizedQuery);
  }), [normalizedQuery, recentClosedTabs]);

  const getPersona = (personaId: string) => personas.find((persona) => persona.id === personaId);

  return (
    <>
      <div className="command-center-overlay" onClick={onClose} />
      <div className="command-center-panel">
        <div className="command-center-header">
          <div>
            <div className="command-center-kicker">Workspace Search</div>
            <div className="command-center-title">Command Center</div>
          </div>
          <button className="command-center-close" onClick={onClose}>
            <AppIcon name="x" size={16} />
          </button>
        </div>

        <div className="command-center-search">
          <AppIcon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search open tabs, recent tabs, and actions..."
            autoFocus
          />
        </div>

        <div className="command-center-actions">
          <button className="command-center-action primary" onClick={() => createTab()}>
            <AppIcon name="plus" size={14} />
            New Tab
          </button>
          <button className="command-center-action" onClick={() => reopenClosedTab()} disabled={recentClosedTabs.length === 0}>
            <AppIcon name="refresh" size={14} />
            Reopen Closed Tab
          </button>
        </div>

        <div className="command-center-section">
          <div className="command-center-section-title">Open Tabs</div>
          <div className="command-center-list">
            {visibleTabs.map((tab) => {
              const persona = getPersona(tab.personaId);
              return (
                <div key={tab.id} className={`command-center-item ${tab.isActive ? 'active' : ''}`}>
                  <button
                    className="command-center-item-main"
                    onClick={async () => {
                      await switchTab(tab.id);
                      onClose();
                    }}
                  >
                    <span className="command-center-item-persona" style={{ background: persona?.color ?? '#808080' }} />
                    <div className="command-center-item-copy">
                      <div className="command-center-item-title">{tab.title || 'New Tab'}</div>
                      <div className="command-center-item-url">{tab.url}</div>
                    </div>
                    <span className="command-center-item-badge">{persona?.name ?? 'Persona'}</span>
                  </button>
                  <button
                    className="command-center-item-icon"
                    onClick={() => duplicateTab(tab.id)}
                    title="Duplicate tab"
                  >
                    <AppIcon name="plus" size={14} />
                  </button>
                </div>
              );
            })}
            {visibleTabs.length === 0 && (
              <div className="command-center-empty">No open tabs match your search.</div>
            )}
          </div>
        </div>

        <div className="command-center-section">
          <div className="command-center-section-title">Recently Closed</div>
          <div className="command-center-list">
            {visibleClosedTabs.map((tab) => {
              const persona = getPersona(tab.personaId);
              return (
                <button
                  key={`${tab.id}-${tab.closedAt}`}
                  className="command-center-item-main ghost"
                  onClick={async () => {
                    await createTab(tab.personaId, tab.url);
                    onClose();
                  }}
                >
                  <span className="command-center-item-persona" style={{ background: persona?.color ?? '#808080' }} />
                  <div className="command-center-item-copy">
                    <div className="command-center-item-title">{tab.title || 'Closed Tab'}</div>
                    <div className="command-center-item-url">{tab.url}</div>
                  </div>
                  <span className="command-center-item-badge muted">Reopen</span>
                </button>
              );
            })}
            {visibleClosedTabs.length === 0 && (
              <div className="command-center-empty">Your recently closed tabs will show up here.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandCenter;
