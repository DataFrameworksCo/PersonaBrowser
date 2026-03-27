import React, { useEffect, useState } from 'react';
import { Tab, Persona } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import { usePersona } from '../../contexts/PersonaContext';
import './TabBar.css';

interface TabItemProps {
  tab: Tab;
  persona: Persona | undefined;
  onSwitch: () => void;
  onClose: (e: React.MouseEvent) => void;
}

const TabItem: React.FC<TabItemProps> = ({ tab, persona, onSwitch, onClose }) => {
  return (
    <div
      className={`tab ${tab.isActive ? 'active' : ''}`}
      onClick={onSwitch}
      title={tab.title || tab.url}
    >
      <div
        className="tab-persona-indicator"
        style={{ background: persona?.color ?? '#808080' }}
      />
      <div className="tab-favicon">
        {tab.isLoading ? (
          <div className="tab-loading-spinner" />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span style={{ fontSize: 11 }}>🌐</span>
        )}
      </div>
      <span className="tab-title">{tab.title || 'New Tab'}</span>
      <button
        className="tab-close"
        onClick={onClose}
        title="Close tab"
      >
        ✕
      </button>
    </div>
  );
};

const TabBar: React.FC = () => {
  const { tabs, switchTab, closeTab, createTab, activeTabId } = useBrowser();
  const { personas, activePersonaId } = usePersona();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.persona.isWindowMaximized().then(setIsMaximized);
  }, []);

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleNewTab = () => {
    createTab(activePersonaId);
  };

  const handleMaximize = async () => {
    await window.persona.maximizeWindow();
    const maximized = await window.persona.isWindowMaximized();
    setIsMaximized(maximized);
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar-tabs">
        {tabs.map((tab) => {
          const persona = personas.find((p) => p.id === tab.personaId);
          return (
            <TabItem
              key={tab.id}
              tab={tab}
              persona={persona}
              onSwitch={() => switchTab(tab.id)}
              onClose={(e) => handleClose(e, tab.id)}
            />
          );
        })}
      </div>
      <button className="tab-new-btn no-drag" onClick={handleNewTab} title="New tab">
        +
      </button>
      <div className="window-controls no-drag">
        <button className="wc-btn wc-minimize" onClick={() => window.persona.minimizeWindow()} title="Minimize">
          ─
        </button>
        <button className="wc-btn wc-maximize" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? '❐' : '□'}
        </button>
        <button className="wc-btn wc-close" onClick={() => window.persona.closeWindow()} title="Close">
          ✕
        </button>
      </div>
    </div>
  );
};

export default TabBar;
