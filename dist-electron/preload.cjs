"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { contextBridge, ipcRenderer } = require('electron');
const electronAPI = {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    loadURL: (url) => ipcRenderer.invoke('load-url', url),
    goBack: () => ipcRenderer.invoke('go-back'),
    goForward: () => ipcRenderer.invoke('go-forward'),
    reload: () => ipcRenderer.invoke('reload-page'),
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    getPageTitle: () => ipcRenderer.invoke('get-page-title'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getIsDev: () => ipcRenderer.invoke('get-is-dev'),
};
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
