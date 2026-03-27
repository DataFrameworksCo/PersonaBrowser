import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { PersonaProvider } from './contexts/PersonaContext';
import { BrowserProvider } from './contexts/BrowserContext';
import './styles/global.css';

// Initialize theme before render
const savedTheme = 'dark'; // Default, will be overridden by ThemeContext
document.documentElement.setAttribute('data-theme', savedTheme);

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <ThemeProvider>
    <PersonaProvider>
      <BrowserProvider>
        <App />
      </BrowserProvider>
    </PersonaProvider>
  </ThemeProvider>
);
