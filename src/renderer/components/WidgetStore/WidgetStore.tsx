import React from 'react';
import { WidgetDefinition } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import AppIcon, { IconName } from '../ui/AppIcon';
import './WidgetStore.css';

interface Props {
  onClose: () => void;
}

type WidgetCardDefinition = WidgetDefinition & { iconName: IconName; tag: string };

const AVAILABLE_WIDGETS: WidgetCardDefinition[] = [
  { type: 'clock', title: 'Clock', description: 'Display the current time with date and a focused at-a-glance layout.', icon: 'clock', iconName: 'clock', tag: 'Focus' },
  { type: 'notes', title: 'Notes', description: 'Sticky notes for quick thoughts, reminders, and tiny drafts saved locally.', icon: 'note', iconName: 'note', tag: 'Capture' },
  { type: 'bookmarks', title: 'Bookmarks', description: 'Keep a fast, editable launchpad for the sites you hit most often.', icon: 'bookmark', iconName: 'bookmark', tag: 'Launch' },
  { type: 'weather', title: 'Weather', description: 'A polished weather module ready for live data when you add an API key.', icon: 'cloud', iconName: 'cloud', tag: 'Ambient' },
  { type: 'rss', title: 'RSS Feed', description: 'Follow news feeds and blogs directly from the sidebar.', icon: 'rss', iconName: 'rss', tag: 'Soon' },
  { type: 'todo', title: 'Todo List', description: 'Track the next few tasks inside each browsing workspace.', icon: 'checklist', iconName: 'checklist', tag: 'New' },
  { type: 'pomodoro', title: 'Pomodoro Timer', description: 'Run focus and break cycles without leaving the browser.', icon: 'timer', iconName: 'timer', tag: 'New' },
  { type: 'calculator', title: 'Calculator', description: 'Solve quick math inline with a compact keypad.', icon: 'calculator', iconName: 'calculator', tag: 'New' },
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
        <button className="widget-store-back" onClick={onClose}><AppIcon name="chevron-left" size={16} /></button>
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
                <div className="widget-card-head">
                  <div className="widget-card-icon"><AppIcon name={def.iconName} size={24} /></div>
                  <span className="widget-card-tag">{def.tag}</span>
                </div>
                <div className="widget-card-name">{def.title}</div>
                <div className="widget-card-desc">{def.description}</div>
                <button
                  className={`widget-card-btn ${isInstalled ? 'installed' : 'add'}`}
                  onClick={() => !isInstalled && handleAdd(def)}
                  disabled={isInstalled}
                >
                  {isInstalled ? 'Added' : 'Add Widget'}
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
