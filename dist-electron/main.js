import { app, BrowserWindow, ipcMain, BrowserView } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { isDev } from "./util.js";
// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow = null;
let browserView = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        frame: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
    });
    // Load your React app
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
    }
    // Create BrowserView
    createBrowserView();
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        if (isDev()) {
            mainWindow?.webContents.openDevTools();
        }
    });
    mainWindow.on('closed', () => {
        browserView = null;
        mainWindow = null;
    });
    // Handle window resize to resize BrowserView
    mainWindow.on('resize', () => {
        resizeBrowserView();
    });
    // Window control handlers
    ipcMain.handle('window-minimize', () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });
    ipcMain.handle('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            else {
                mainWindow.maximize();
            }
        }
    });
    ipcMain.handle('window-close', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });
    // BrowserView control handlers
    ipcMain.handle('browserview-load-url', async (event, url) => {
        if (browserView) {
            await browserView.webContents.loadURL(url);
        }
    });
    ipcMain.handle('browserview-go-back', () => {
        if (browserView && browserView.webContents.canGoBack()) {
            browserView.webContents.goBack();
        }
    });
    ipcMain.handle('browserview-go-forward', () => {
        if (browserView && browserView.webContents.canGoForward()) {
            browserView.webContents.goForward();
        }
    });
    ipcMain.handle('browserview-reload', () => {
        if (browserView) {
            browserView.webContents.reload();
        }
    });
    ipcMain.handle('browserview-stop', () => {
        if (browserView) {
            browserView.webContents.stop();
        }
    });
    // BrowserView navigation state
    ipcMain.handle('browserview-can-go-back', () => {
        return browserView ? browserView.webContents.canGoBack() : false;
    });
    ipcMain.handle('browserview-can-go-forward', () => {
        return browserView ? browserView.webContents.canGoForward() : false;
    });
    ipcMain.handle('browserview-get-url', () => {
        return browserView ? browserView.webContents.getURL() : '';
    });
    // Existing handlers
    ipcMain.handle('clear-cache', async () => {
        if (browserView) {
            await browserView.webContents.session.clearCache();
        }
    });
    ipcMain.handle('get-page-title', () => {
        return browserView ? browserView.webContents.getTitle() : '';
    });
    ipcMain.handle('get-platform', () => {
        return process.platform;
    });
    ipcMain.handle('get-is-dev', () => {
        return isDev();
    });
    // Window state handlers for macOS traffic lights
    ipcMain.handle('window-is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
    });
    // Add more IPC handlers as needed...
}
function createBrowserView() {
    if (!mainWindow)
        return;
    // Remove existing BrowserView if any
    if (browserView) {
        mainWindow.removeBrowserView(browserView);
        browserView = null;
    }
    // Create new BrowserView
    browserView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            allowRunningInsecureContent: isDev(),
        }
    });
    mainWindow.setBrowserView(browserView);
    resizeBrowserView();
    // Set up event listeners for the BrowserView
    setupBrowserViewEvents();
}
function resizeBrowserView() {
    if (!mainWindow || !browserView)
        return;
    const [width, height] = mainWindow.getContentSize();
    const headerHeight = 48; // Match the header height (3rem = 48px)
    browserView.setBounds({
        x: 0,
        y: headerHeight,
        width: width,
        height: height - headerHeight
    });
}
function setupBrowserViewEvents() {
    if (!browserView)
        return;
    const webContents = browserView.webContents;
    webContents.on('did-start-loading', () => {
        mainWindow?.webContents.send('browserview-loading-start');
    });
    webContents.on('did-finish-load', () => {
        mainWindow?.webContents.send('browserview-loading-finish');
    });
    webContents.on('did-navigate', (event, url) => {
        mainWindow?.webContents.send('browserview-navigate', url);
    });
    webContents.on('page-title-updated', (event, title) => {
        mainWindow?.webContents.send('browserview-title-updated', title);
    });
    webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        mainWindow?.webContents.send('browserview-load-failed', { errorCode, errorDescription });
    });
    webContents.on('dom-ready', () => {
        mainWindow?.webContents.send('browserview-dom-ready');
    });
    // Listen for navigation state changes to update back/forward buttons
    webContents.on('did-navigate', () => {
        updateNavigationState();
    });
    webContents.on('did-navigate-in-page', () => {
        updateNavigationState();
    });
}
function updateNavigationState() {
    if (!browserView)
        return;
    const canGoBack = browserView.webContents.canGoBack();
    const canGoForward = browserView.webContents.canGoForward();
    mainWindow?.webContents.send('browserview-navigation-state', {
        canGoBack,
        canGoForward
    });
}
// App lifecycle
app.whenReady().then(() => {
    // Dev flags
    if (isDev()) {
        app.commandLine.appendSwitch('--ignore-certificate-errors');
        app.commandLine.appendSwitch('--disable-web-security');
        app.commandLine.appendSwitch('--allow-running-insecure-content');
    }
    createWindow();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
