import React, { useState } from 'react';
import { usePersona } from '../../contexts/PersonaContext';
import { useBrowser } from '../../contexts/BrowserContext';
import './PersonaSwitcher.css';

const PERSONA_ICONS = ['💼', '🏠', '🎮', '🕵️', '🎨', '📚', '🏋️', '🎵', '🌍', '🔬', '💰', '🛒'];

interface Props {
  onClose: () => void;
}

const PersonaSwitcher: React.FC<Props> = ({ onClose }) => {
  const { personas, activePersonaId, switchPersona, createPersona, deletePersona } = usePersona();
  const { createTab } = useBrowser();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4A9EFF');
  const [newIcon, setNewIcon] = useState('🌐');

  const handleSwitch = async (id: string) => {
    await switchPersona(id);
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createPersona(newName.trim(), newColor, newIcon);
    setNewName('');
    setNewColor('#4A9EFF');
    setNewIcon('🌐');
    setShowForm(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (personas.length <= 1) return;
    await deletePersona(id);
  };

  return (
    <>
      <div className="persona-switcher-overlay" onClick={onClose} />
      <div className="persona-switcher-panel">
        <div className="persona-switcher-header">
          <span className="persona-switcher-title">Personas</span>
          <button className="persona-switcher-close" onClick={onClose}>✕</button>
        </div>

        <div className="persona-list">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`persona-item ${persona.id === activePersonaId ? 'active' : ''}`}
              onClick={() => handleSwitch(persona.id)}
            >
              <div
                className="persona-item-icon"
                style={{
                  background: `${persona.color}22`,
                  color: persona.color,
                }}
              >
                {persona.icon}
              </div>
              <div className="persona-item-info">
                <div className="persona-item-name">{persona.name}</div>
                <div className="persona-item-type">
                  {persona.isPersistent ? 'Persistent' : 'Incognito'}
                </div>
              </div>
              {persona.id === activePersonaId && (
                <span
                  className="persona-item-badge"
                  style={{ background: persona.color }}
                >
                  Active
                </span>
              )}
              {persona.id !== activePersonaId && personas.length > 1 && (
                <button
                  className="persona-item-delete"
                  onClick={(e) => handleDelete(e, persona.id)}
                  title="Delete persona"
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="persona-switcher-footer">
          {!showForm ? (
            <button className="persona-add-btn" onClick={() => setShowForm(true)}>
              <span>+</span> New Persona
            </button>
          ) : (
            <form className="persona-form" onSubmit={handleCreate}>
              <div className="persona-form-title">Create New Persona</div>

              <div className="icon-picker">
                {PERSONA_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${newIcon === icon ? 'selected' : ''}`}
                    onClick={() => setNewIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <div className="persona-form-row">
                <input
                  className="persona-form-input"
                  type="text"
                  placeholder="Persona name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <input
                  className="persona-form-color"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  title="Choose accent color"
                />
              </div>

              <div className="persona-form-actions">
                <button type="submit" className="persona-form-submit">Create</button>
                <button
                  type="button"
                  className="persona-form-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default PersonaSwitcher;
