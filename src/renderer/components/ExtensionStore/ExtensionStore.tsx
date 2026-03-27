import React from 'react';
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
  const handleOpenStore = (url?: string) => {
    if (url) {
      window.persona.navigateTo('', url);
      onClose();
    }
  };

  const privacyExtensions = FEATURED_EXTENSIONS.filter((e) => e.privacyFocused);
  const otherExtensions = FEATURED_EXTENSIONS.filter((e) => !e.privacyFocused);

  return (
    <div className="ext-store-overlay">
      <div className="ext-store-header">
        <button className="ext-store-back" onClick={onClose}>←</button>
        <span className="ext-store-title">Extension Store</span>
      </div>
      <div className="ext-store-content">
        <div className="ext-store-notice">
          <strong>Note:</strong> Extensions open the Chrome Web Store in a new tab. Electron-based browsers have limited extension support compared to Chrome — extensions that rely on Chrome-specific APIs may not work fully. Privacy extensions like uBlock Origin work best.
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
