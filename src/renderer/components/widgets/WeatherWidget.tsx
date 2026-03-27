import React from 'react';

const WeatherWidget: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 0',
      color: 'var(--text-secondary)',
    }}>
      <div style={{ fontSize: '36px' }}>⛅</div>
      <div style={{ fontSize: '22px', fontWeight: 300, color: 'var(--text-primary)' }}>--°</div>
      <div style={{ fontSize: '11px', textAlign: 'center', lineHeight: 1.5 }}>
        Add an API key in Settings<br />to enable weather
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {['Mon', 'Tue', 'Wed', 'Thu'].map((day) => (
          <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day}</span>
            <span style={{ fontSize: '14px' }}>🌤</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>--°</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
