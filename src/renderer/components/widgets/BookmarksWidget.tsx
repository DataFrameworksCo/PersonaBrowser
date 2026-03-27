import React, { useState, useEffect } from 'react';
import { useBrowser } from '../../contexts/BrowserContext';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com', favicon: '' },
  { id: '2', title: 'Hacker News', url: 'https://news.ycombinator.com', favicon: '' },
  { id: '3', title: 'DuckDuckGo', url: 'https://duckduckgo.com', favicon: '' },
];

const BookmarksWidget: React.FC = () => {
  const { navigateTo } = useBrowser();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const stored = localStorage.getItem('persona-bookmarks');
      return stored ? JSON.parse(stored) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('persona-bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  const addBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      url: newUrl.trim().startsWith('http') ? newUrl.trim() : 'https://' + newUrl.trim(),
    };
    setBookmarks((prev) => [...prev, bookmark]);
    setNewTitle('');
    setNewUrl('');
    setShowAdd(false);
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 6px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tab-active-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          onClick={() => navigateTo(bm.url)}
        >
          <span style={{ fontSize: '13px' }}>🔖</span>
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bm.title}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); removeBookmark(bm.id); }}
            style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0, transition: 'opacity var(--transition)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            ✕
          </button>
        </div>
      ))}

      {showAdd ? (
        <form onSubmit={addBookmark} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            autoFocus
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="submit" style={{ flex: 1, padding: '4px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
              Add
            </button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '4px 8px', background: 'var(--tab-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '5px',
            borderRadius: '6px',
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
            fontSize: '11px',
            cursor: 'pointer',
            background: 'transparent',
            marginTop: '2px',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          + Add Bookmark
        </button>
      )}
    </div>
  );
};

export default BookmarksWidget;
