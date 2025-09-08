import { app, BrowserWindow, ipcMain, WebContents } from 'electron';
import * as path from 'path';
import { isDev } from './util.js';
import { pollResources } from './resourceManager.js';
import { getPreloadPath } from './pathResolver.js';
import { ipcHandle } from './util.js';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: getPreloadPath()
    },
    show: false,
    backgroundColor: '#22000000',
    backgroundMaterial: 'acrylic',
    
    visualEffectState: 'active'
  });

  // Load dev server or built index.html
  if (isDev()) {
    void mainWindow.loadURL('http://localhost:5123');
  } else {
    void mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    if (isDev()) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Start resource polling
  pollResources(mainWindow);

  // Window controls refactored to use ipcHandle
  ipcHandle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcHandle('window-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcHandle('window-close', () => {
    mainWindow?.close();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security
app.on('web-contents-created', (_event, contents: WebContents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);

      // Only allow dev server during dev, block others
      if (parsedUrl.origin !== 'http://localhost:5123' && !isDev()) {
        navigationEvent.preventDefault();
      }
    } catch {
      navigationEvent.preventDefault();
    }
  });
});

// Dev-only flags
if (isDev()) {
  app.commandLine.appendSwitch('--ignore-certificate-errors');
}