import React, { useState } from 'react';
import { Widget, WidgetType } from '../../../shared/types';
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
      <div className="sidebar-widget-header" onClick={() => setCollapsed((c) => !c)}>
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
  const { sidebarOpen, settings, removeWidget, createTab, navigateTo, activeTab, tabs } = useBrowser();
  const { activePersona } = usePersona();
  const widgets = settings?.sidebarWidgets ?? [];
  const activeDomain = activeTab?.url?.startsWith('http')
    ? new URL(activeTab.url).hostname.replace(/^www\./, '')
    : 'Start page';

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <div>
          <span className="sidebar-title">Workspace</span>
          <div className="sidebar-header-caption">Glanceable tools and shortcuts</div>
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
