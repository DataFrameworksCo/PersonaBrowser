import React from 'react';
import { WidgetDefinition, WidgetType } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import './WidgetStore.css';

interface Props {
  onClose: () => void;
}

const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  { type: 'clock', title: 'Clock', description: 'Display the current time with date. Supports analog and digital modes.', icon: '🕐' },
  { type: 'notes', title: 'Notes', description: 'Sticky notes for quick thoughts and reminders, saved locally.', icon: '📝' },
  { type: 'bookmarks', title: 'Bookmarks', description: 'Quick access to your favorite websites from the sidebar.', icon: '🔖' },
  { type: 'weather', title: 'Weather', description: 'Current weather and 4-day forecast. Requires an OpenWeatherMap API key.', icon: '⛅' },
  { type: 'rss', title: 'RSS Feed', description: 'Follow your favorite news feeds and blogs directly in the sidebar.', icon: '📰' },
  { type: 'todo', title: 'Todo List', description: 'Keep track of your tasks with a simple checklist widget.', icon: '✅' },
  { type: 'pomodoro', title: 'Pomodoro Timer', description: 'Focus timer using the Pomodoro technique — 25 min work, 5 min break.', icon: '🍅' },
  { type: 'calculator', title: 'Calculator', description: 'A quick inline calculator for simple math operations.', icon: '🔢' },
];

const WidgetStore: React.FC<Props> = ({ onClose }) => {
  const { settings, addWidget } = useBrowser();
  const installedTypes = new Set(settings?.sidebarWidgets.map((w) => w.type) ?? []);

  const handleAdd = async (def: WidgetDefinition) => {
    const widget = {
      id: `${def.type}-${Date.now()}`,
      type: def.type,
      title: def.title,
      enabled: true,
      config: def.defaultConfig,
    };
    await addWidget(widget);
  };

  return (
    <div className="widget-store-overlay">
      <div className="widget-store-header">
        <button className="widget-store-back" onClick={onClose}>←</button>
        <span className="widget-store-title">Widget Store</span>
      </div>
      <div className="widget-store-content">
        <div className="widget-store-subtitle">
          Add widgets to your sidebar to enhance your browsing experience.
        </div>
        <div className="widget-grid">
          {AVAILABLE_WIDGETS.map((def) => {
            const isInstalled = installedTypes.has(def.type);
            return (
              <div key={def.type} className="widget-card">
                <div className="widget-card-icon">{def.icon}</div>
                <div className="widget-card-name">{def.title}</div>
                <div className="widget-card-desc">{def.description}</div>
                <button
                  className={`widget-card-btn ${isInstalled ? 'installed' : 'add'}`}
                  onClick={() => !isInstalled && handleAdd(def)}
                  disabled={isInstalled}
                >
                  {isInstalled ? '✓ Added' : '+ Add Widget'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WidgetStore;
