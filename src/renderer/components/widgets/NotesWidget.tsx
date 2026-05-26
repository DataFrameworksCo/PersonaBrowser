import React, { useState, useEffect } from 'react';
import AppIcon from '../ui/AppIcon';

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
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-panel-row">
          <div>
            <div className="widget-kicker">Capture</div>
            <div className="widget-title">Fast notes</div>
          </div>
          <span className="widget-pill">
            <AppIcon name="note" size={12} />
            Local
          </span>
        </div>
      </div>
      <textarea
        className="widget-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Quick notes..."
      />
    </div>
  );
};

export default NotesWidget;
