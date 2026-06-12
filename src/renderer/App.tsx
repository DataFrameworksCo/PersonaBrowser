import React, { useState, useEffect } from 'react';
import TabBar from './components/TabBar/TabBar';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import PersonaSwitcher from './components/PersonaSwitcher/PersonaSwitcher';
import Settings from './components/Settings/Settings';
import WidgetStore from './components/WidgetStore/WidgetStore';
import ExtensionStore from './components/ExtensionStore/ExtensionStore';
import CommandCenter from './components/CommandCenter/CommandCenter';
import HistoryPanel from './components/HistoryPanel/HistoryPanel';
import DownloadsPanel from './components/DownloadsPanel/DownloadsPanel';
import AppIcon from './components/ui/AppIcon';
import { useBrowser } from './contexts/BrowserContext';
import { UpdateState } from '../shared/types';

type OverlayPage = 'settings' | 'widget-store' | 'extension-store' | 'command-center' | 'history' | 'downloads' | null;

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

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openOverlay('command-center');
      }
      if (modifier && event.key === ',') {
        event.preventDefault();
        openOverlay('settings');
      }
      if (modifier && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('persona:focus-address'));
      }
      if (event.key === 'Escape') {
        if (showPersonaSwitcher) closePersonaSwitcher();
        if (overlay) closeOverlay();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [overlay, showPersonaSwitcher]);

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
    <div className="app-shell">
      {shouldShowUpdateBanner && updateState && (
        <div className="update-banner">
          <div className="update-banner-message">
            <span className="update-banner-icon"><AppIcon name="sparkles" size={14} /></span>
            <span>{updateMessage}</span>
          </div>
          {updateState.status === 'downloaded' && (
            <button
              onClick={() => window.persona.installUpdate()}
              className="update-banner-action"
            >
              Install Now
            </button>
          )}
          <button
            onClick={() => setUpdateState(null)}
            className="update-banner-close"
          >
            <AppIcon name="x" size={14} />
          </button>
        </div>
      )}

      <div className="app-chrome">
        <TabBar />
        <Toolbar
          onOpenSettings={() => openOverlay('settings')}
          onOpenExtensions={() => openOverlay('extension-store')}
          onOpenCommandCenter={() => openOverlay('command-center')}
          onOpenHistory={() => openOverlay('history')}
          onOpenDownloads={() => openOverlay('downloads')}
          onTogglePersonaSwitcher={() => showPersonaSwitcher ? closePersonaSwitcher() : openPersonaSwitcher()}
          onToggleSidebar={handleToggleSidebar}
        />
      </div>

      <div className="app-content">
        <div id="web-content-placeholder" className="web-content-surface" />

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

      {overlay === 'command-center' && (
        <CommandCenter onClose={closeOverlay} />
      )}

      {overlay === 'history' && (
        <HistoryPanel onClose={closeOverlay} />
      )}

      {overlay === 'downloads' && (
        <DownloadsPanel onClose={closeOverlay} />
      )}
    </div>
  );
};

export default App;
