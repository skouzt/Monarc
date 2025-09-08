    const { contextBridge, ipcRenderer } = require('electron');

    type ElectronAPI = {
    // Window controls
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;

    // Webview controls
    loadURL: (url: string) => Promise<void>;

    // Browser navigation
    goBack: () => Promise<void>;
    goForward: () => Promise<void>;
    reload: () => Promise<void>;

    // Browser-related tasks
    clearCache: () => Promise<void>;
    getPageTitle: () => Promise<string>;

    // Platform & environment
    getPlatform: () => Promise<NodeJS.Platform>;
    getIsDev: () => Promise<boolean>;
    };

    const electronAPI: ElectronAPI = {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),

    loadURL: (url: string) => ipcRenderer.invoke('load-url', url),

    goBack: () => ipcRenderer.invoke('go-back'),
    goForward: () => ipcRenderer.invoke('go-forward'),
    reload: () => ipcRenderer.invoke('reload-page'),

    clearCache: () => ipcRenderer.invoke('clear-cache'),
    getPageTitle: () => ipcRenderer.invoke('get-page-title'),

    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getIsDev: () => ipcRenderer.invoke('get-is-dev'),
    };

    contextBridge.exposeInMainWorld('electronAPI', electronAPI);

    declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
    }
