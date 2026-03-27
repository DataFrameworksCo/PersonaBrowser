import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Persona } from '../../shared/types';

interface PersonaContextValue {
  personas: Persona[];
  activePersonaId: string;
  activePersona: Persona | null;
  switchPersona: (id: string) => Promise<void>;
  createPersona: (name: string, color: string, icon: string) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;
  refreshPersonas: () => Promise<void>;
}

const PersonaContext = createContext<PersonaContextValue>({
  personas: [],
  activePersonaId: 'personal',
  activePersona: null,
  switchPersona: async () => {},
  createPersona: async () => {},
  deletePersona: async () => {},
  refreshPersonas: async () => {},
});

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState('personal');

  const refreshPersonas = useCallback(async () => {
    const [list, settings] = await Promise.all([
      window.persona.getPersonas(),
      window.persona.getSettings(),
    ]);
    setPersonas(list);
    setActivePersonaId(settings.activePersonaId);
  }, []);

  useEffect(() => {
    refreshPersonas();
  }, [refreshPersonas]);

  const switchPersona = useCallback(async (id: string) => {
    await window.persona.switchPersona(id);
    setActivePersonaId(id);
  }, []);

  const createPersona = useCallback(async (name: string, color: string, icon: string) => {
    await window.persona.createPersona(name, color, icon);
    await refreshPersonas();
  }, [refreshPersonas]);

  const deletePersona = useCallback(async (id: string) => {
    await window.persona.deletePersona(id);
    await refreshPersonas();
  }, [refreshPersonas]);

  const activePersona = personas.find((p) => p.id === activePersonaId) ?? null;

  return (
    <PersonaContext.Provider
      value={{
        personas,
        activePersonaId,
        activePersona,
        switchPersona,
        createPersona,
        deletePersona,
        refreshPersonas,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => useContext(PersonaContext);
