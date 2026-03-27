import React, { useState } from 'react';
import { Theme, SearchEngine } from '../../../shared/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useBrowser } from '../../contexts/BrowserContext';
import { usePersona } from '../../contexts/PersonaContext';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'privacy' | 'search' | 'personas' | 'about';

const THEMES: { id: Theme; name: string; bar: string; body: string }[] = [
  { id: 'dark', name: 'Dark', bar: '#16213e', body: '#1a1a2e' },
  { id: 'light', name: 'Light', bar: '#ffffff', body: '#f5f5f7' },
  { id: 'midnight', name: 'Midnight', bar: '#0a0a1a', body: '#050510' },
  { id: 'forest', name: 'Forest', bar: '#122415', body: '#0d1f0f' },
  { id: 'ocean', name: 'Ocean', bar: '#072535', body: '#041821' },
];

const ACCENT_COLORS = [
  '#e94560', '#4A9EFF', '#4AFF91', '#B44AFF', '#FF9F4A',
  '#FF4AE8', '#00D4FF', '#4ADE80', '#FACC15', '#FB923C',
];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="toggle-slider" />
  </label>
);

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const { settings, updateSettings } = useBrowser();
  const { personas, createPersona, deletePersona } = usePersona();

  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaColor, setNewPersonaColor] = useState('#4A9EFF');
  const [newPersonaIcon, setNewPersonaIcon] = useState('🌐');

  if (!settings) return null;

  const navItems: { id: SettingsTab; icon: string; label: string }[] = [
    { id: 'appearance', icon: '🎨', label: 'Appearance' },
    { id: 'privacy', icon: '🔒', label: 'Privacy & Security' },
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'personas', icon: '👤', label: 'Personas' },
    { id: 'about', icon: 'ℹ️', label: 'About' },
  ];

  const renderAppearance = () => (
    <div className="settings-section">
      <div className="settings-section-title">Appearance</div>
      <div className="settings-section-desc">Customize how Persona Browser looks</div>

      <div className="settings-group">
        <div style={{ padding: '12px 18px 4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Theme
        </div>
        <div className="themes-grid">
          {THEMES.map((t) => (
            <div
              key={t.id}
              className={`theme-card ${theme === t.id ? 'selected' : ''}`}
              onClick={() => setTheme(t.id)}
            >
              <div className="theme-preview">
                <div className="theme-preview-bar" style={{ background: t.bar }} />
                <div className="theme-preview-body" style={{ background: t.body }} />
              </div>
              <span className="theme-name">{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div style={{ padding: '12px 18px 4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Accent Color
        </div>
        <div className="accent-colors">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              className={`accent-color-btn ${accentColor === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => setAccentColor(color)}
              title={color}
            />
          ))}
          <input
            className="accent-custom-color"
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            title="Custom color"
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="settings-section">
      <div className="settings-section-title">Privacy & Security</div>
      <div className="settings-section-desc">Control your privacy and security settings</div>

      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Tracker Blocking</div>
            <div className="settings-row-desc">Block known tracking scripts and pixels across all personas</div>
          </div>
          <Toggle
            checked={settings.trackerBlocking}
            onChange={(v) => updateSettings('trackerBlocking', v)}
          />
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">HTTPS-Only Mode</div>
            <div className="settings-row-desc">Warn when visiting sites that don't use HTTPS</div>
          </div>
          <Toggle
            checked={settings.httpsOnly}
            onChange={(v) => updateSettings('httpsOnly', v)}
          />
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Privacy Level</div>
            <div className="settings-row-desc">Standard blocks common trackers; Strict blocks more aggressively</div>
          </div>
          <select
            className="settings-select"
            value={settings.privacyLevel}
            onChange={(e) => updateSettings('privacyLevel', e.target.value as any)}
          >
            <option value="standard">Standard</option>
            <option value="strict">Strict</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="settings-section">
      <div className="settings-section-title">Search</div>
      <div className="settings-section-desc">Choose your default search engine</div>

      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Default Search Engine</div>
            <div className="settings-row-desc">Used when you type a search query in the address bar</div>
          </div>
          <select
            className="settings-select"
            value={settings.defaultSearchEngine}
            onChange={(e) => updateSettings('defaultSearchEngine', e.target.value as SearchEngine)}
          >
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="brave">Brave Search</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPersonas = () => (
    <div className="settings-section">
      <div className="settings-section-title">Personas</div>
      <div className="settings-section-desc">Manage your isolated browsing profiles</div>

      <div className="settings-group" style={{ marginBottom: '16px' }}>
        {personas.map((persona) => (
          <div key={persona.id} className="settings-row">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${persona.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, marginRight: 4, flexShrink: 0,
            }}>
              {persona.icon}
            </div>
            <div className="settings-row-info">
              <div className="settings-row-label">{persona.name}</div>
              <div className="settings-row-desc">
                {persona.isPersistent ? 'Persistent profile' : 'Incognito (non-persistent)'}
                {' · '}
                <span style={{ color: persona.color }}>{persona.color}</span>
              </div>
            </div>
            {personas.length > 1 && (
              <button
                onClick={() => deletePersona(persona.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '12px',
                  background: 'rgba(239,68,68,0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="settings-group">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Create New Persona
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newPersonaIcon}
              onChange={(e) => setNewPersonaIcon(e.target.value)}
              placeholder="Icon (emoji)"
              style={{
                width: '60px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '7px 10px',
                fontSize: '16px',
                color: 'var(--text-primary)',
                outline: 'none',
                textAlign: 'center',
                fontFamily: 'var(--font)',
              }}
            />
            <input
              value={newPersonaName}
              onChange={(e) => setNewPersonaName(e.target.value)}
              placeholder="Persona name"
              style={{
                flex: 1,
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '7px 10px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font)',
              }}
            />
            <input
              type="color"
              value={newPersonaColor}
              onChange={(e) => setNewPersonaColor(e.target.value)}
              style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 'var(--border-radius-sm)', padding: 2, cursor: 'pointer', background: 'var(--input-bg)' }}
            />
          </div>
          <button
            onClick={async () => {
              if (!newPersonaName.trim()) return;
              await createPersona(newPersonaName.trim(), newPersonaColor, newPersonaIcon || '🌐');
              setNewPersonaName('');
              setNewPersonaColor('#4A9EFF');
              setNewPersonaIcon('🌐');
            }}
            style={{
              padding: '9px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity var(--transition)',
              fontFamily: 'var(--font)',
            }}
          >
            Create Persona
          </button>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="settings-section">
      <div className="settings-section-title">About Persona Browser</div>
      <div className="settings-section-desc">Privacy-focused browser with isolated profiles</div>

      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Version</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>1.0.0</span>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Built with</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Electron + React</span>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Privacy Philosophy</div>
            <div className="settings-row-desc">Each persona is completely isolated — separate cookies, localStorage, cache, and history. No cross-persona tracking.</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'appearance': return renderAppearance();
      case 'privacy': return renderPrivacy();
      case 'search': return renderSearch();
      case 'personas': return renderPersonas();
      case 'about': return renderAbout();
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onClose}>←</button>
        <span className="settings-header-title">Settings</span>
      </div>
      <div className="settings-body">
        <nav className="settings-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="settings-nav-item-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="settings-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
