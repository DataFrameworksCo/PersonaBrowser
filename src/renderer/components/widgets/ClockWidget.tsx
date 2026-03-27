import React, { useState, useEffect } from 'react';

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
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        fontSize: '28px',
        fontWeight: 200,
        letterSpacing: '2px',
        color: 'var(--text-primary)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
      }}>
        {h}:{m}<span style={{ opacity: 0.5, fontSize: '22px' }}>:{s}</span>
      </div>
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginTop: '4px',
        letterSpacing: '0.05em',
      }}>
        {days[time.getDay()]}, {months[time.getMonth()]} {time.getDate()}, {time.getFullYear()}
      </div>
    </div>
  );
};

export default ClockWidget;
