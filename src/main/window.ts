import { BrowserWindow, app } from 'electron';
import path from 'path';

export function createMainWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: false,
    },
    icon: undefined,
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    // Wait for webpack to finish building
    const rendererPath = path.join(__dirname, '../../dist/renderer/index.html');
    win.loadFile(rendererPath);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return win;
}
