import React from 'react';
import AppIcon from '../ui/AppIcon';

const WeatherWidget: React.FC = () => {
  return (
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-panel-row">
          <div>
            <div className="widget-kicker">Ambient</div>
            <div className="widget-title">Weather snapshot</div>
          </div>
          <span className="widget-pill">
            <AppIcon name="cloud" size={12} />
            Preview
          </span>
        </div>
      </div>
      <div className="widget-panel" style={{ textAlign: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 8 }}>
          <div className="widget-bookmark-icon" style={{ width: 54, height: 54 }}>
            <AppIcon name="cloud" size={24} />
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>--°</div>
        <div className="widget-subtitle" style={{ marginTop: 8 }}>
          Add an API key in Settings to enable live conditions and forecast cards.
        </div>
      </div>
      <div className="widget-grid-2">
        {['Mon', 'Tue', 'Wed', 'Thu'].map((day) => (
          <div key={day} className="widget-panel" style={{ textAlign: 'center', padding: '10px' }}>
            <div className="widget-kicker">{day}</div>
            <div style={{ color: 'var(--accent)', margin: '6px 0' }}><AppIcon name="cloud" size={16} /></div>
            <div className="widget-subtitle">--°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
