import React, { useState, useEffect } from 'react';

const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem('persona-notes') ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('persona-notes', notes);
    } catch {
      // ignore
    }
  }, [notes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '120px' }}>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Quick notes..."
        style={{
          flex: 1,
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '8px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          resize: 'none',
          lineHeight: 1.5,
          outline: 'none',
          fontFamily: 'var(--font)',
          transition: 'border-color var(--transition)',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
};

export default NotesWidget;
