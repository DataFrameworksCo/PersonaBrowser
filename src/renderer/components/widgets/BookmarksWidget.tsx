import React, { useState } from 'react';
import { useBrowser } from '../../contexts/BrowserContext';
import AppIcon from '../ui/AppIcon';

const BookmarksWidget: React.FC = () => {
  const { bookmarks, addBookmark, removeBookmark, createTab } = useBrowser();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addCustomBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    await addBookmark({
      title: newTitle.trim(),
      url: newUrl.trim(),
    });
    setNewTitle('');
    setNewUrl('');
    setShowAdd(false);
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
      {bookmarks.slice(0, 6).map((bookmark) => (
        <div
          key={bookmark.id}
          className="widget-bookmark-row"
          onClick={() => createTab(bookmark.personaId, bookmark.url)}
        >
          <div className="widget-bookmark-icon"><AppIcon name="bookmark" size={14} /></div>
          <div className="widget-bookmark-meta">
            <div className="widget-bookmark-title">{bookmark.title}</div>
            <div className="widget-bookmark-url">{bookmark.url.replace(/^https?:\/\//, '')}</div>
          </div>
          <button
            className="widget-icon-button"
            onClick={(e) => { e.stopPropagation(); void removeBookmark(bookmark.id); }}
          >
            <AppIcon name="x" size={12} />
          </button>
        </div>
      ))}

      {showAdd ? (
        <form onSubmit={(e) => { void addCustomBookmark(e); }} className="widget-stack">
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
