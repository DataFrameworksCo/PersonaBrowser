import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme } from '../../shared/types';

interface ThemeContextValue {
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  accentColor: '#e94560',
  setTheme: () => {},
  setAccentColor: () => {},
});

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '233, 69, 96';
  const numericValue = Number.parseInt(normalized, 16);
  const r = (numericValue >> 16) & 255;
  const g = (numericValue >> 8) & 255;
  const b = numericValue & 255;
  return `${r}, ${g}, ${b}`;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [accentColor, setAccentColorState] = useState('#e94560');

  useEffect(() => {
    window.persona.getSettings().then((settings) => {
      setThemeState(settings.theme);
      setAccentColorState(settings.accentColor);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(accentColor));
  }, [accentColor]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    window.persona.setSetting('theme', newTheme);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
    window.persona.setSetting('accentColor', color);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
