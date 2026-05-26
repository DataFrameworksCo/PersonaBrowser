import React, { useEffect, useState } from 'react';
import { Extension } from '../../../shared/types';
import { useBrowser } from '../../contexts/BrowserContext';
import AppIcon from '../ui/AppIcon';
import './ExtensionStore.css';

interface Props {
  onClose: () => void;
}

interface ExtensionDef {
  name: string;
  description: string;
  icon: string;
  version: string;
  privacyFocused: boolean;
  storeUrl?: string;
  category: string;
}

const FEATURED_EXTENSIONS: ExtensionDef[] = [
  {
    name: 'uBlock Origin',
    description: 'Efficient and powerful ad blocker with wide-spectrum content filtering. One of the best privacy extensions available.',
    icon: '🛡️',
    version: '1.57.0',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
    category: 'Privacy',
  },
  {
    name: 'Privacy Badger',
    description: 'Automatically learns to block invisible trackers using heuristics. Made by EFF.',
    icon: '🦡',
    version: '2024.1',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp',
    category: 'Privacy',
  },
  {
    name: 'Bitwarden',
    description: 'Free and open-source password manager. Sync passwords across devices securely.',
    icon: '🔐',
    version: '2024.2',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb',
    category: 'Security',
  },
  {
    name: 'ClearURLs',
    description: 'Removes tracking parameters from URLs to protect your privacy when sharing links.',
    icon: '🔗',
    version: '1.26.1',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/clearurls/lckanjgmijmafbedlpokirnhbfgdele',
    category: 'Privacy',
  },
  {
    name: 'Dark Reader',
    description: 'Enables dark mode on every website. Eye-care extension for night browsing.',
    icon: '🌙',
    version: '4.9.84',
    privacyFocused: false,
    storeUrl: 'https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh',
    category: 'Productivity',
  },
  {
    name: 'Decentraleyes',
    description: 'Protects against tracking via free, centralized content delivery networks.',
    icon: '🌐',
    version: '2.0.19',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/decentraleyes/ldpochfccmkkmhdbclfhpagapcfdljkj',
    category: 'Privacy',
  },
  {
    name: 'HTTPS Everywhere',
    description: 'Automatically switches thousands of sites from insecure HTTP to secure HTTPS.',
    icon: '🔒',
    version: '2021.7.13',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/https-everywhere/gcbommkclmclpchllfjekcdonpmejbdp',
    category: 'Security',
  },
  {
    name: 'Cookie AutoDelete',
    description: 'Automatically delete unused cookies from closed tabs to prevent tracking.',
    icon: '🍪',
    version: '3.8.2',
    privacyFocused: true,
    storeUrl: 'https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh',
    category: 'Privacy',
  },
];

const ExtensionStore: React.FC<Props> = ({ onClose }) => {
  const { createTab } = useBrowser();
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([]);
  const [busyExtensionId, setBusyExtensionId] = useState<string | null>(null);

  useEffect(() => {
    window.persona.getInstalledExtensions().then(setInstalledExtensions);
  }, []);

  const handleOpenStore = async (url?: string) => {
    if (url) {
      await createTab(undefined, url);
      onClose();
    }
  };

  const installExtension = async () => {
    try {
      const installed = await window.persona.installExtension();
      setInstalledExtensions((current) => [...current.filter((entry) => entry.id !== installed.id), installed]);
    } catch {
      // ignore canceled installs
    }
  };

  const setEnabled = async (extensionId: string, enabled: boolean) => {
    setBusyExtensionId(extensionId);
    try {
      const nextInstalled = await window.persona.setExtensionEnabled(extensionId, enabled);
      setInstalledExtensions(nextInstalled);
    } finally {
      setBusyExtensionId(null);
    }
  };

  const removeExtension = async (extensionId: string) => {
    setBusyExtensionId(extensionId);
    try {
      const nextInstalled = await window.persona.removeExtension(extensionId);
      setInstalledExtensions(nextInstalled);
    } finally {
      setBusyExtensionId(null);
    }
  };

  const privacyExtensions = FEATURED_EXTENSIONS.filter((e) => e.privacyFocused);
  const otherExtensions = FEATURED_EXTENSIONS.filter((e) => !e.privacyFocused);

  return (
    <div className="ext-store-overlay">
      <div className="ext-store-header">
        <button className="ext-store-back" onClick={onClose}><AppIcon name="chevron-left" size={16} /></button>
        <span className="ext-store-title">Extension Store</span>
        <button className="ext-load-btn" onClick={installExtension}>
          <AppIcon name="plus" size={14} />
          Load Unpacked
        </button>
      </div>
      <div className="ext-store-content">
        <div className="ext-store-notice">
          <strong>Note:</strong> Persona Browser now supports loading unpacked Chromium extensions into persistent personas. Chrome Web Store links are still useful for discovery, but install by downloading an unpacked extension folder and using <em>Load Unpacked</em>.
        </div>

        <div className="ext-section-title">Installed Extensions</div>
        <div className="ext-grid">
          {installedExtensions.length === 0 && (
            <div className="ext-empty-state">
              <div className="ext-empty-icon"><AppIcon name="layout" size={24} /></div>
              <div className="ext-empty-title">No extensions loaded yet</div>
              <div className="ext-empty-copy">Load unpacked extensions to enable blockers, password managers, and productivity tools in persistent personas.</div>
            </div>
          )}

          {installedExtensions.map((extension) => (
            <div key={extension.id} className="ext-card installed">
              <div className="ext-card-icon">
                {extension.icon ? <img src={extension.icon} alt="" className="ext-card-image" /> : extension.name.slice(0, 1)}
              </div>
              <div className="ext-card-body">
                <div className="ext-card-name">{extension.name}</div>
                <div className="ext-card-desc">{extension.description || 'Installed unpacked extension'}</div>
                <div className="ext-card-footer">
                  <span className="ext-card-version">v{extension.version}</span>
                  <span className={`ext-card-state ${extension.enabled ? 'enabled' : 'disabled'}`}>
                    {extension.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="ext-card-actions">
                  <button
                    className="ext-card-btn store"
                    onClick={() => setEnabled(extension.id, !extension.enabled)}
                    disabled={busyExtensionId === extension.id}
                  >
                    {extension.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    className="ext-card-btn store"
                    onClick={() => window.persona.revealExtensionInFolder(extension.id)}
                  >
                    Reveal Folder
                  </button>
                  <button
                    className="ext-card-btn danger"
                    onClick={() => removeExtension(extension.id)}
                    disabled={busyExtensionId === extension.id}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ext-section-title">🛡️ Privacy & Security</div>
        <div className="ext-grid">
          {privacyExtensions.map((ext) => (
            <div key={ext.name} className="ext-card">
              <div className="ext-card-icon">{ext.icon}</div>
              <div className="ext-card-body">
                <div className="ext-card-name">{ext.name}</div>
                <div className="ext-card-desc">{ext.description}</div>
                <div className="ext-card-footer">
                  <span className="ext-card-version">v{ext.version}</span>
                  {ext.privacyFocused && (
                    <span className="ext-card-privacy-badge">Privacy</span>
                  )}
                  <button
                    className="ext-card-btn store"
                    onClick={() => handleOpenStore(ext.storeUrl)}
                    style={{ marginLeft: 'auto' }}
                  >
                    Chrome Store ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {otherExtensions.length > 0 && (
          <>
            <div className="ext-section-title">🔧 Productivity</div>
            <div className="ext-grid">
              {otherExtensions.map((ext) => (
                <div key={ext.name} className="ext-card">
                  <div className="ext-card-icon">{ext.icon}</div>
                  <div className="ext-card-body">
                    <div className="ext-card-name">{ext.name}</div>
                    <div className="ext-card-desc">{ext.description}</div>
                    <div className="ext-card-footer">
                      <span className="ext-card-version">v{ext.version}</span>
                      <button
                        className="ext-card-btn store"
                        onClick={() => handleOpenStore(ext.storeUrl)}
                        style={{ marginLeft: 'auto' }}
                      >
                        Chrome Store ↗
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExtensionStore;
