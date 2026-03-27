import React, { useState } from 'react';
import TabBar from './components/TabBar/TabBar';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import PersonaSwitcher from './components/PersonaSwitcher/PersonaSwitcher';
import Settings from './components/Settings/Settings';
import WidgetStore from './components/WidgetStore/WidgetStore';
import ExtensionStore from './components/ExtensionStore/ExtensionStore';
import { useBrowser } from './contexts/BrowserContext';

type OverlayPage = 'settings' | 'widget-store' | 'extension-store' | null;

const App: React.FC = () => {
  const [overlay, setOverlay] = useState<OverlayPage>(null);
  const [showPersonaSwitcher, setShowPersonaSwitcher] = useState(false);
  const { sidebarOpen, toggleSidebar } = useBrowser();

  const openOverlay = (page: OverlayPage) => {
    window.persona.showOverlay();
    setOverlay(page);
  };

  const closeOverlay = () => {
    window.persona.hideOverlay();
    setOverlay(null);
  };

  const openPersonaSwitcher = () => {
    window.persona.showOverlay();
    setShowPersonaSwitcher(true);
  };

  const closePersonaSwitcher = () => {
    window.persona.hideOverlay();
    setShowPersonaSwitcher(false);
  };

  const handleToggleSidebar = async () => {
    await toggleSidebar();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Top chrome: TabBar + Toolbar */}
      <TabBar />
      <Toolbar
        onOpenSettings={() => openOverlay('settings')}
        onTogglePersonaSwitcher={() => showPersonaSwitcher ? closePersonaSwitcher() : openPersonaSwitcher()}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Content area */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* WebContentsView fills remaining space — managed by main process */}
        <div
          id="web-content-placeholder"
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden',
          }}
        />

        {/* Sidebar */}
        <Sidebar onOpenWidgetStore={() => openOverlay('widget-store')} />
      </div>

      {/* Overlays */}
      {showPersonaSwitcher && (
        <PersonaSwitcher onClose={closePersonaSwitcher} />
      )}

      {overlay === 'settings' && (
        <Settings onClose={closeOverlay} />
      )}

      {overlay === 'widget-store' && (
        <WidgetStore onClose={closeOverlay} />
      )}

      {overlay === 'extension-store' && (
        <ExtensionStore onClose={closeOverlay} />
      )}
    </div>
  );
};

export default App;
