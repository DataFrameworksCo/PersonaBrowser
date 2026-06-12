import React, { useMemo, useState } from 'react';
import { useBrowser } from '../../contexts/BrowserContext';
import { usePersona } from '../../contexts/PersonaContext';
import AppIcon from '../ui/AppIcon';
import './CommandCenter.css';

interface Props {
  onClose: () => void;
}

const CommandCenter: React.FC<Props> = ({ onClose }) => {
  const {
    tabs,
    switchTab,
    createTab,
    duplicateTab,
    recentClosedTabs,
    reopenClosedTab,
    bookmarks,
    readingList,
    workspaces,
    activeWorkspace,
    addBookmark,
    addToReadingList,
    setActiveWorkspace,
  } = useBrowser();
  const { personas, activePersona } = usePersona();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const includeQuery = (value: string) => !normalizedQuery || value.toLowerCase().includes(normalizedQuery);

  const visibleTabs = useMemo(() => tabs.filter((tab) => (
    includeQuery(`${tab.title} ${tab.url}`)
  )), [normalizedQuery, tabs]);

  const visibleClosedTabs = useMemo(() => recentClosedTabs.filter((tab) => (
    includeQuery(`${tab.title} ${tab.url}`)
  )), [normalizedQuery, recentClosedTabs]);

  const visibleBookmarks = useMemo(() => bookmarks.filter((bookmark) => (
    includeQuery(`${bookmark.title} ${bookmark.url}`)
  )).slice(0, 6), [bookmarks, normalizedQuery]);

  const visibleReadingList = useMemo(() => readingList.filter((item) => (
    includeQuery(`${item.title} ${item.url} ${item.state}`)
  )).slice(0, 6), [normalizedQuery, readingList]);

  const visibleWorkspaces = useMemo(() => workspaces.filter((workspace) => (
    includeQuery(`${workspace.name} ${workspace.description} ${workspace.focusNote}`)
  )), [normalizedQuery, workspaces]);

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
            placeholder="Search tabs, workspaces, saved pages, and actions..."
            autoFocus
          />
        </div>

        <div className="command-center-actions">
          <button className="command-center-action primary" onClick={() => createTab(activePersona?.id)}>
            <AppIcon name="plus" size={14} />
            New Tab
          </button>
          <button className="command-center-action" onClick={() => addBookmark()}>
            <AppIcon name="bookmark" size={14} />
            Save Bookmark
          </button>
          <button className="command-center-action" onClick={() => addToReadingList()}>
            <AppIcon name="note" size={14} />
            Queue Reading
          </button>
          <button className="command-center-action" onClick={() => reopenClosedTab()} disabled={recentClosedTabs.length === 0}>
            <AppIcon name="refresh" size={14} />
            Reopen Closed
          </button>
        </div>

        <div className="command-center-body">
          <div className="command-center-column">
            <div className="command-center-section">
              <div className="command-center-section-title">Workspaces</div>
              <div className="command-center-list">
                {visibleWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    className={`command-center-item-main ghost ${workspace.id === activeWorkspace?.id ? 'workspace-active' : ''}`}
                    onClick={async () => {
                      await setActiveWorkspace(workspace.id);
                      onClose();
                    }}
                  >
                    <span className="command-center-workspace-icon" style={{ color: workspace.color }}>
                      {workspace.icon}
                    </span>
                    <div className="command-center-item-copy">
                      <div className="command-center-item-title">{workspace.name}</div>
                      <div className="command-center-item-url">{workspace.description}</div>
                    </div>
                    <span className="command-center-item-badge">{workspace.links.length} links</span>
                  </button>
                ))}
                {visibleWorkspaces.length === 0 && (
                  <div className="command-center-empty">No workspaces match your search.</div>
                )}
              </div>
            </div>

            <div className="command-center-section">
              <div className="command-center-section-title">Bookmarks</div>
              <div className="command-center-list">
                {visibleBookmarks.map((bookmark) => (
                  <button
                    key={bookmark.id}
                    className="command-center-item-main ghost"
                    onClick={async () => {
                      await createTab(bookmark.personaId, bookmark.url);
                      onClose();
                    }}
                  >
                    <span className="command-center-item-persona" />
                    <div className="command-center-item-copy">
                      <div className="command-center-item-title">{bookmark.title}</div>
                      <div className="command-center-item-url">{bookmark.url}</div>
                    </div>
                    <span className="command-center-item-badge">Saved</span>
                  </button>
                ))}
                {visibleBookmarks.length === 0 && (
                  <div className="command-center-empty">Saved bookmarks will surface here.</div>
                )}
              </div>
            </div>
          </div>

          <div className="command-center-column">
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
              <div className="command-center-section-title">Reading Queue</div>
              <div className="command-center-list">
                {visibleReadingList.map((item) => (
                  <button
                    key={item.id}
                    className="command-center-item-main ghost"
                    onClick={async () => {
                      await createTab(item.personaId, item.url);
                      onClose();
                    }}
                  >
                    <span className="command-center-item-persona" />
                    <div className="command-center-item-copy">
                      <div className="command-center-item-title">{item.title}</div>
                      <div className="command-center-item-url">{item.url}</div>
                    </div>
                    <span className="command-center-item-badge muted">{item.state}</span>
                  </button>
                ))}
                {visibleReadingList.length === 0 && (
                  <div className="command-center-empty">Your queued reading will show up here.</div>
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
        </div>
      </div>
    </>
  );
};

export default CommandCenter;
