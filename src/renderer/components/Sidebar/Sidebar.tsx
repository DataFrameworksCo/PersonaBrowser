import React, { useMemo, useState, useEffect } from 'react';
import { Widget, WidgetType, ReadingState } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import ClockWidget from '../widgets/ClockWidget';
import NotesWidget from '../widgets/NotesWidget';
import BookmarksWidget from '../widgets/BookmarksWidget';
import WeatherWidget from '../widgets/WeatherWidget';
import TodoWidget from '../widgets/TodoWidget';
import PomodoroWidget from '../widgets/PomodoroWidget';
import CalculatorWidget from '../widgets/CalculatorWidget';
import AppIcon, { IconName } from '../ui/AppIcon';
import { usePersona } from '../../contexts/PersonaContext';
import './Sidebar.css';
import '../widgets/widgets.css';

const WIDGET_ICONS: Record<WidgetType, IconName> = {
  clock: 'clock',
  notes: 'note',
  bookmarks: 'bookmark',
  weather: 'cloud',
  rss: 'rss',
  todo: 'checklist',
  pomodoro: 'timer',
  calculator: 'calculator',
};

const getNextReadingState = (state: ReadingState): ReadingState => {
  if (state === 'unread') return 'reading';
  if (state === 'reading') return 'done';
  return 'unread';
};

interface SidebarWidgetProps {
  widget: Widget;
  onRemove: (id: string) => void;
}

const SidebarWidget: React.FC<SidebarWidgetProps> = ({ widget, onRemove }) => {
  const [collapsed, setCollapsed] = useState(false);

  const renderContent = () => {
    switch (widget.type) {
      case 'clock': return <ClockWidget />;
      case 'notes': return <NotesWidget />;
      case 'bookmarks': return <BookmarksWidget />;
      case 'weather': return <WeatherWidget />;
      case 'todo': return <TodoWidget />;
      case 'pomodoro': return <PomodoroWidget />;
      case 'calculator': return <CalculatorWidget />;
      default: return (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '4px' }}>
          Widget coming soon...
        </div>
      );
    }
  };

  return (
    <div className={`sidebar-widget ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-widget-header" onClick={() => setCollapsed((current) => !current)}>
        <span className="sidebar-widget-title">
          <span className="sidebar-widget-icon"><AppIcon name={WIDGET_ICONS[widget.type]} size={14} /></span>
          {widget.title}
        </span>
        <div className="sidebar-widget-controls">
          <button
            className="sidebar-widget-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
            title="Remove widget"
          >
            <AppIcon name="x" size={12} />
          </button>
          <span className="sidebar-widget-collapse-icon"><AppIcon name="chevron-down" size={12} /></span>
        </div>
      </div>
      <div className="sidebar-widget-body">
        {renderContent()}
      </div>
    </div>
  );
};

interface SidebarProps {
  onOpenWidgetStore: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenWidgetStore }) => {
  const {
    sidebarOpen,
    settings,
    removeWidget,
    createTab,
    navigateTo,
    activeTab,
    tabs,
    bookmarks,
    readingList,
    workspaces,
    activeWorkspace,
    addBookmark,
    removeBookmark,
    addToReadingList,
    removeFromReadingList,
    setReadingState,
    setActiveWorkspace,
    addWorkspace,
    removeWorkspace,
    saveWorkspaceNote,
    addWorkspaceLink,
    removeWorkspaceLink,
  } = useBrowser();
  const { activePersona } = usePersona();
  const widgets = settings?.sidebarWidgets ?? [];
  const activeDomain = (() => {
    if (!activeTab?.url?.startsWith('http')) return 'Start page';
    try {
      return new URL(activeTab.url).hostname.replace(/^www\./, '');
    } catch {
      return 'Current page';
    }
  })();
  const recentHistory = useMemo(
    () => [...(settings?.historyEntries ?? [])]
      .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
      .slice(0, 4),
    [settings?.historyEntries]
  );

  const [workspaceNoteDraft, setWorkspaceNoteDraft] = useState('');
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceColor, setWorkspaceColor] = useState('#8a6546');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');

  useEffect(() => {
    setWorkspaceNoteDraft(activeWorkspace?.focusNote ?? '');
  }, [activeWorkspace?.id, activeWorkspace?.focusNote]);

  const openInNewTab = (url: string) => {
    void createTab(activePersona?.id, url);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <div>
          <span className="sidebar-title">Operations</span>
          <div className="sidebar-header-caption">Workspaces, saved pages, and live context</div>
        </div>
        <div className="sidebar-header-actions">
          <button className="sidebar-action-btn" onClick={onOpenWidgetStore} title="Widget store">
            <AppIcon name="plus" size={13} />
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-overview-card">
          <div className="sidebar-overview-top">
            <div>
              <div className="sidebar-overview-kicker">Current Persona</div>
              <div className="sidebar-overview-name">{activePersona?.name ?? 'Personal'}</div>
            </div>
            <div className="sidebar-overview-badge" style={{ borderColor: `${activePersona?.color ?? '#808080'}55` }}>
              <span className="sidebar-overview-dot" style={{ background: activePersona?.color ?? '#808080' }} />
              {activePersona?.icon ?? '◌'}
            </div>
          </div>
          <div className="sidebar-overview-stats">
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-label">Active Site</div>
              <div className="sidebar-stat-value">{activeDomain}</div>
            </div>
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-label">Open Tabs</div>
              <div className="sidebar-stat-value">{tabs.length}</div>
            </div>
          </div>
          <div className="sidebar-overview-actions">
            <button className="sidebar-overview-action primary" onClick={() => createTab()}>
              <AppIcon name="plus" size={14} />
              New Tab
            </button>
            <button className="sidebar-overview-action" onClick={() => navigateTo('persona://newtab')}>
              <AppIcon name="sparkles" size={14} />
              Start Page
            </button>
          </div>
        </div>

        <section className="sidebar-section">
          <div className="sidebar-section-head">
            <div>
              <div className="sidebar-section-title">Workspaces</div>
              <div className="sidebar-section-caption">Task-focused desks with notes and launch links.</div>
            </div>
            <button className="sidebar-mini-btn" onClick={() => setShowWorkspaceForm((current) => !current)}>
              <AppIcon name="plus" size={12} />
            </button>
          </div>

          <div className="sidebar-workspace-list">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                className={`sidebar-workspace-pill ${workspace.id === activeWorkspace?.id ? 'active' : ''}`}
                onClick={() => setActiveWorkspace(workspace.id)}
                style={{ borderColor: workspace.id === activeWorkspace?.id ? `${workspace.color}55` : undefined }}
              >
                <span className="sidebar-workspace-pill-icon" style={{ color: workspace.color }}>{workspace.icon}</span>
                <span>{workspace.name}</span>
              </button>
            ))}
          </div>

          {showWorkspaceForm && (
            <div className="sidebar-form-card">
              <input
                className="sidebar-input"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace name"
              />
              <input
                className="sidebar-input"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                placeholder="What is this desk for?"
              />
              <div className="sidebar-form-row">
                <input
                  className="sidebar-color-input"
                  type="color"
                  value={workspaceColor}
                  onChange={(e) => setWorkspaceColor(e.target.value)}
                />
                <button
                  className="sidebar-primary-btn"
                  onClick={async () => {
                    await addWorkspace(workspaceName, workspaceColor, workspaceDescription);
                    setWorkspaceName('');
                    setWorkspaceDescription('');
                    setWorkspaceColor('#8a6546');
                    setShowWorkspaceForm(false);
                  }}
                >
                  Create Workspace
                </button>
              </div>
            </div>
          )}

          {activeWorkspace && (
            <div className="sidebar-workspace-card">
              <div className="sidebar-workspace-card-head">
                <div>
                  <div className="sidebar-workspace-card-title">{activeWorkspace.name}</div>
                  <div className="sidebar-workspace-card-desc">{activeWorkspace.description}</div>
                </div>
                {workspaces.length > 1 && (
                  <button className="sidebar-mini-btn danger" onClick={() => removeWorkspace(activeWorkspace.id)}>
                    <AppIcon name="trash" size={12} />
                  </button>
                )}
              </div>

              <label className="sidebar-label">Focus Note</label>
              <textarea
                className="sidebar-textarea"
                value={workspaceNoteDraft}
                onChange={(e) => setWorkspaceNoteDraft(e.target.value)}
                placeholder="Keep the current intent for this workspace here."
              />
              <button
                className="sidebar-secondary-btn"
                onClick={() => saveWorkspaceNote(activeWorkspace.id, workspaceNoteDraft)}
              >
                Save Note
              </button>

              <div className="sidebar-subsection">
                <div className="sidebar-subsection-head">
                  <span className="sidebar-label">Launch Links</span>
                  <button className="sidebar-text-btn" onClick={() => addBookmark()}>
                    Save Current Page
                  </button>
                </div>
                <div className="sidebar-link-list">
                  {activeWorkspace.links.map((link) => (
                    <div key={link.id} className="sidebar-link-row">
                      <button className="sidebar-link-main" onClick={() => openInNewTab(link.url)}>
                        <div className="sidebar-link-title">{link.title}</div>
                        <div className="sidebar-link-desc">{link.description || link.url}</div>
                      </button>
                      <button className="sidebar-mini-btn" onClick={() => removeWorkspaceLink(activeWorkspace.id, link.id)}>
                        <AppIcon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="sidebar-form-card inline">
                  <input
                    className="sidebar-input"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Link title"
                  />
                  <input
                    className="sidebar-input"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                  <input
                    className="sidebar-input"
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    placeholder="One-line description"
                  />
                  <button
                    className="sidebar-primary-btn"
                    onClick={async () => {
                      if (!activeWorkspace) return;
                      await addWorkspaceLink(activeWorkspace.id, linkTitle, linkUrl, linkDescription);
                      setLinkTitle('');
                      setLinkUrl('');
                      setLinkDescription('');
                    }}
                  >
                    Add Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-head">
            <div>
              <div className="sidebar-section-title">Bookmarks</div>
              <div className="sidebar-section-caption">Pinned destinations across personas.</div>
            </div>
            <button className="sidebar-mini-btn" onClick={() => addBookmark()}>
              <AppIcon name="plus" size={12} />
            </button>
          </div>
          <div className="sidebar-list-card">
            {bookmarks.slice(0, 6).map((bookmark) => (
              <div key={bookmark.id} className="sidebar-list-row">
                <button className="sidebar-list-main" onClick={() => openInNewTab(bookmark.url)}>
                  <div className="sidebar-list-title">{bookmark.title}</div>
                  <div className="sidebar-list-meta">{bookmark.url.replace(/^https?:\/\//, '')}</div>
                </button>
                <button className="sidebar-mini-btn" onClick={() => removeBookmark(bookmark.id)}>
                  <AppIcon name="x" size={12} />
                </button>
              </div>
            ))}
            {bookmarks.length === 0 && (
              <div className="sidebar-empty-inline">No saved bookmarks yet.</div>
            )}
          </div>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-head">
            <div>
              <div className="sidebar-section-title">Reading Queue</div>
              <div className="sidebar-section-caption">Articles and references staged for later.</div>
            </div>
            <button className="sidebar-mini-btn" onClick={() => addToReadingList()}>
              <AppIcon name="plus" size={12} />
            </button>
          </div>
          <div className="sidebar-list-card">
            {readingList.slice(0, 6).map((item) => (
              <div key={item.id} className="sidebar-list-row">
                <button className="sidebar-list-main" onClick={() => openInNewTab(item.url)}>
                  <div className="sidebar-list-title">{item.title}</div>
                  <div className="sidebar-list-meta">
                    <span className={`sidebar-status-chip ${item.state}`}>{item.state}</span>
                    {item.url.replace(/^https?:\/\//, '')}
                  </div>
                </button>
                <button className="sidebar-mini-btn" onClick={() => setReadingState(item.id, getNextReadingState(item.state))}>
                  <AppIcon name="refresh" size={12} />
                </button>
                <button className="sidebar-mini-btn" onClick={() => removeFromReadingList(item.id)}>
                  <AppIcon name="x" size={12} />
                </button>
              </div>
            ))}
            {readingList.length === 0 && (
              <div className="sidebar-empty-inline">Nothing queued right now.</div>
            )}
          </div>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-head">
            <div>
              <div className="sidebar-section-title">Recent Activity</div>
              <div className="sidebar-section-caption">The last few places this browser touched.</div>
            </div>
          </div>
          <div className="sidebar-list-card">
            {recentHistory.map((entry) => (
              <button key={entry.id} className="sidebar-activity-row" onClick={() => openInNewTab(entry.url)}>
                <div className="sidebar-list-title">{entry.title}</div>
                <div className="sidebar-list-meta">{entry.url.replace(/^https?:\/\//, '')}</div>
              </button>
            ))}
            {recentHistory.length === 0 && (
              <div className="sidebar-empty-inline">No browsing history yet.</div>
            )}
          </div>
        </section>

        {widgets.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon"><AppIcon name="layout" size={28} /></div>
            <div className="sidebar-empty-text">
              No widgets yet.<br />Build your sidebar from the store.
            </div>
          </div>
        ) : (
          widgets.map((widget) => (
            <SidebarWidget
              key={widget.id}
              widget={widget}
              onRemove={removeWidget}
            />
          ))
        )}
      </div>

      <button className="sidebar-add-widget-btn" onClick={onOpenWidgetStore}>
        <AppIcon name="plus" size={14} />
        Add Widget
      </button>
    </div>
  );
};

export default Sidebar;
