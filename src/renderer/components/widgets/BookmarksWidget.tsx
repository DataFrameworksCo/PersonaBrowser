import React, { useState, useEffect } from 'react';
import { useBrowser } from '../../contexts/BrowserContext';
import AppIcon from '../ui/AppIcon';

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
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-panel-row">
          <div>
            <div className="widget-kicker">Launchpad</div>
            <div className="widget-title">Favorite destinations</div>
          </div>
          <span className="widget-pill">
            <AppIcon name="bookmark" size={12} />
            {bookmarks.length}
          </span>
        </div>
      </div>
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          className="widget-bookmark-row"
          onClick={() => navigateTo(bm.url)}
        >
          <div className="widget-bookmark-icon"><AppIcon name="bookmark" size={14} /></div>
          <div className="widget-bookmark-meta">
            <div className="widget-bookmark-title">{bm.title}</div>
            <div className="widget-bookmark-url">{bm.url.replace(/^https?:\/\//, '')}</div>
          </div>
          <button
            className="widget-icon-button"
            onClick={(e) => { e.stopPropagation(); removeBookmark(bm.id); }}
          >
            <AppIcon name="x" size={12} />
          </button>
        </div>
      ))}

      {showAdd ? (
        <form onSubmit={addBookmark} className="widget-stack">
          <input
            className="widget-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            autoFocus
          />
          <input
            className="widget-input"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL"
          />
          <div className="widget-grid-2">
            <button type="submit" className="widget-button">
              Add
            </button>
            <button type="button" className="widget-button secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="widget-button secondary"
          onClick={() => setShowAdd(true)}
        >
          <AppIcon name="plus" size={14} />
          Add Bookmark
        </button>
      )}
    </div>
  );
};

export default BookmarksWidget;
