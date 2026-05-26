import React, { useState, useEffect } from 'react';
import TabBar from './components/TabBar/TabBar';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import PersonaSwitcher from './components/PersonaSwitcher/PersonaSwitcher';
import Settings from './components/Settings/Settings';
import WidgetStore from './components/WidgetStore/WidgetStore';
import ExtensionStore from './components/ExtensionStore/ExtensionStore';
import { useBrowser } from './contexts/BrowserContext';
import { UpdateState } from '../shared/types';

type OverlayPage = 'settings' | 'widget-store' | 'extension-store' | null;

const App: React.FC = () => {
  const [overlay, setOverlay] = useState<OverlayPage>(null);
  const [showPersonaSwitcher, setShowPersonaSwitcher] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const { sidebarOpen, toggleSidebar } = useBrowser();

  useEffect(() => {
    const offUpdateStateChanged = window.persona.onUpdateStateChanged((nextState) => {
      setUpdateState((currentState) => {
        if (nextState.status === 'not-available') return null;
        if (nextState.status === 'checking' && currentState?.status === 'downloaded') {
          return currentState;
        }
        return nextState;
      });
    });

    return () => {
      offUpdateStateChanged();
    };
  }, []);

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

  const shouldShowUpdateBanner = updateState !== null
    && ['available', 'downloading', 'downloaded', 'error'].includes(updateState.status);

  const updateLabel = updateState?.version
    ? `Version ${updateState.version}`
    : 'A new version';

  const updateMessage = (() => {
    if (!updateState) return '';

    if (updateState.status === 'downloaded') {
      return `${updateLabel} is ready to install.`;
    }

    if (updateState.status === 'downloading') {
      const progressLabel = typeof updateState.progressPercent === 'number'
        ? ` (${Math.round(updateState.progressPercent)}%)`
        : '';
      return `${updateLabel} is downloading${progressLabel}.`;
    }

    if (updateState.status === 'available') {
      return `${updateLabel} is available. Downloading now.`;
    }

    if (updateState.status === 'error') {
      return updateState.message
        ? `Update check failed: ${updateState.message}`
        : 'Update check failed.';
    }

    return '';
  })();

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
      {shouldShowUpdateBanner && updateState && (
        <div style={{
          background: 'var(--accent, #e94560)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '6px 16px',
          fontSize: 13,
          zIndex: 9999,
        }}>
          <span>{updateMessage}</span>
          {updateState.status === 'downloaded' && (
            <button
              onClick={() => window.persona.installUpdate()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
                padding: '3px 12px',
                fontSize: 13,
              }}
            >
              Install Now
            </button>
          )}
          <button
            onClick={() => setUpdateState(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            x
          </button>
        </div>
      )}

      <TabBar />
      <Toolbar
        onOpenSettings={() => openOverlay('settings')}
        onTogglePersonaSwitcher={() => showPersonaSwitcher ? closePersonaSwitcher() : openPersonaSwitcher()}
        onToggleSidebar={handleToggleSidebar}
      />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          id="web-content-placeholder"
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden',
          }}
        />

        <Sidebar onOpenWidgetStore={() => openOverlay('widget-store')} />
      </div>

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
