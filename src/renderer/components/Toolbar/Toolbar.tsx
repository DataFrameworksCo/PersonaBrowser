import React, { useState, useRef, useEffect } from 'react';
import { useBrowser } from '../../contexts/BrowserContext';
import { usePersona } from '../../contexts/PersonaContext';
import './Toolbar.css';

interface ToolbarProps {
  onOpenSettings: () => void;
  onTogglePersonaSwitcher: () => void;
  onToggleSidebar: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onOpenSettings, onTogglePersonaSwitcher, onToggleSidebar }) => {
  const {
    activeTab,
    addressValue,
    setAddressValue,
    navigateTo,
    goBack,
    goForward,
    reload,
  } = useBrowser();
  const { activePersona } = usePersona();

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSecure = activeTab?.url?.startsWith('https://') ?? false;
  const isLoading = activeTab?.isLoading ?? false;

  const getPrivacyScore = (): { score: number; level: 'high' | 'medium' | 'low' } => {
    if (!activeTab?.url || activeTab.url.startsWith('data:')) return { score: 100, level: 'high' };
    if (isSecure) return { score: 85, level: 'high' };
    return { score: 40, level: 'low' };
  };

  const { score, level } = getPrivacyScore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(addressValue);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsFocused(true);
    inputRef.current?.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Restore to actual URL if user didn't navigate
    if (activeTab && !activeTab.url.startsWith('data:') && activeTab.url !== 'persona://newtab') {
      setAddressValue(activeTab.url);
    }
  };

  const displayUrl = isFocused
    ? addressValue
    : (activeTab?.url?.startsWith('data:') ? '' : activeTab?.url === 'persona://newtab' ? '' : activeTab?.url ?? '');

  return (
    <div className="toolbar">
      <div className="toolbar-nav-group">
        <button
          className="toolbar-btn"
          onClick={goBack}
          disabled={!activeTab?.canGoBack}
          title="Back"
        >
          ←
        </button>
        <button
          className="toolbar-btn"
          onClick={goForward}
          disabled={!activeTab?.canGoForward}
          title="Forward"
        >
          →
        </button>
        <button
          className="toolbar-btn"
          onClick={reload}
          title={isLoading ? 'Stop' : 'Reload'}
        >
          {isLoading ? '✕' : '⟳'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <div className="toolbar-address-bar">
          <span className={`toolbar-lock-icon ${isSecure ? 'secure' : ''}`}>
            {isSecure ? '🔒' : '⚠️'}
          </span>
          <input
            ref={inputRef}
            className="toolbar-address-input"
            type="text"
            value={isFocused ? addressValue : displayUrl}
            onChange={(e) => setAddressValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search or enter URL..."
            spellCheck={false}
            autoComplete="off"
          />
          {activeTab?.url && !activeTab.url.startsWith('data:') && !isFocused && (
            <span className={`toolbar-privacy-score ${level}`} title={`Privacy score: ${score}`}>
              {score}
            </span>
          )}
        </div>
      </form>

      <div className="toolbar-right">
        <button
          className="toolbar-persona-badge"
          onClick={onTogglePersonaSwitcher}
          title="Switch persona"
          style={{ borderColor: activePersona?.color ?? undefined }}
        >
          <div
            className="toolbar-persona-dot"
            style={{ background: activePersona?.color ?? '#808080' }}
          />
          <span>{activePersona?.icon ?? '🌐'}</span>
          <span>{activePersona?.name ?? 'Personal'}</span>
        </button>

        <button className="toolbar-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          ▤
        </button>

        <button className="toolbar-btn" onClick={onOpenSettings} title="Settings">
          ⚙
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
