import React, { useMemo, useState } from 'react';
import AppIcon from '../ui/AppIcon';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = 'persona-todo-items';

const TodoWidget: React.FC = () => {
  const [items, setItems] = useState<TodoItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as TodoItem[] : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState('');

  const persist = (nextItems: TodoItem[]) => {
    setItems(nextItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch {
      // ignore persistence failures
    }
  };

  const completedCount = useMemo(() => items.filter((item) => item.done).length, [items]);
  const completionLabel = items.length === 0 ? 'No tasks yet' : `${completedCount}/${items.length} complete`;

  const addItem = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    persist([{ id: `${Date.now()}`, text, done: false }, ...items]);
    setDraft('');
  };

  return (
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-panel-row">
          <div>
            <div className="widget-kicker">Today</div>
            <div className="widget-title">Keep momentum</div>
          </div>
          <span className="widget-pill">
            <AppIcon name="checklist" size={12} />
            {completionLabel}
          </span>
        </div>
      </div>

      <form className="widget-panel-row" onSubmit={addItem}>
        <input
          className="widget-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task..."
        />
        <button className="widget-button" type="submit">
          <AppIcon name="plus" size={14} />
          Add
        </button>
      </form>

      <div className="widget-todo-list">
        {items.length === 0 ? (
          <div className="widget-panel">
            <div className="widget-subtitle">Capture a few priorities here so each persona has a working checklist.</div>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`widget-todo-item ${item.done ? 'done' : ''}`}>
              <button
                className="widget-todo-check"
                onClick={() => persist(items.map((entry) => (
                  entry.id === item.id ? { ...entry, done: !entry.done } : entry
                )))}
                title={item.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.done && <AppIcon name="checklist" size={12} strokeWidth={2.2} />}
              </button>
              <div className="widget-todo-text">{item.text}</div>
              <button
                className="widget-icon-button"
                onClick={() => persist(items.filter((entry) => entry.id !== item.id))}
                title="Remove task"
              >
                <AppIcon name="trash" size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
