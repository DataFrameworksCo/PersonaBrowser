import React, { useState, useEffect } from 'react';
import AppIcon from '../ui/AppIcon';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-panel-row">
          <div>
            <div className="widget-kicker">Now</div>
            <div className="widget-title">Local time</div>
          </div>
          <span className="widget-pill">
            <AppIcon name="clock" size={12} />
            Live
          </span>
        </div>
      </div>
      <div className="widget-panel" style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '30px',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}>
          {h}:{m}<span style={{ opacity: 0.45, fontSize: '22px', marginLeft: 2 }}>:{s}</span>
        </div>
        <div className="widget-subtitle" style={{ marginTop: 8, letterSpacing: '0.04em' }}>
          {days[time.getDay()]}, {months[time.getMonth()]} {time.getDate()}, {time.getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
