import React, { useState } from 'react';
import { Widget, WidgetType } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import ClockWidget from '../widgets/ClockWidget';
import NotesWidget from '../widgets/NotesWidget';
import BookmarksWidget from '../widgets/BookmarksWidget';
import WeatherWidget from '../widgets/WeatherWidget';
import './Sidebar.css';

const WIDGET_ICONS: Record<WidgetType, string> = {
  clock: '🕐',
  notes: '📝',
  bookmarks: '🔖',
  weather: '⛅',
  rss: '📰',
  todo: '✅',
  pomodoro: '🍅',
  calculator: '🔢',
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
          <span className="sidebar-widget-icon">{WIDGET_ICONS[widget.type]}</span>
          {widget.title}
        </span>
        <div className="sidebar-widget-controls">
          <button
            className="sidebar-widget-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
            title="Remove widget"
          >
            ✕
          </button>
          <span className="sidebar-widget-collapse-icon">▼</span>
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
  const { sidebarOpen, settings, removeWidget } = useBrowser();
  const widgets = settings?.sidebarWidgets ?? [];

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Widgets</span>
        <div className="sidebar-header-actions">
          <button className="sidebar-action-btn" onClick={onOpenWidgetStore} title="Widget store">
            +
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        {widgets.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">🧩</div>
            <div className="sidebar-empty-text">
              No widgets yet.<br />Add some from the store!
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
        + Add Widget
      </button>
    </div>
  );
};

export default Sidebar;
