"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // ----- Window Controls -----
    minimize: () => electron_1.ipcRenderer.invoke("window-minimize"),
    maximize: () => electron_1.ipcRenderer.invoke("window-maximize"),
    close: () => electron_1.ipcRenderer.invoke("window-close"),
    isMaximized: () => electron_1.ipcRenderer.invoke("window-is-maximized"),
    // ----- BrowserView Controls -----
    loadUrl: (url) => electron_1.ipcRenderer.invoke("browserview-load-url", url),
    goBack: () => electron_1.ipcRenderer.invoke("browserview-go-back"),
    goForward: () => electron_1.ipcRenderer.invoke("browserview-go-forward"),
    reload: () => electron_1.ipcRenderer.invoke("browserview-reload"),
    stop: () => electron_1.ipcRenderer.invoke("browserview-stop"),
    // ----- BrowserView State -----
    canGoBack: () => electron_1.ipcRenderer.invoke("browserview-can-go-back"),
    canGoForward: () => electron_1.ipcRenderer.invoke("browserview-can-go-forward"),
    getUrl: () => electron_1.ipcRenderer.invoke("browserview-get-url"),
    getTitle: () => electron_1.ipcRenderer.invoke("get-page-title"),
    // ----- Cache & Misc -----
    clearCache: () => electron_1.ipcRenderer.invoke("clear-cache"),
    getPlatform: () => electron_1.ipcRenderer.invoke("get-platform"),
    isDev: () => electron_1.ipcRenderer.invoke("get-is-dev"),
    // ----- Event Listeners -----
    onLoadingStart: (callback) => electron_1.ipcRenderer.on("browserview-loading-start", callback),
    onLoadingFinish: (callback) => electron_1.ipcRenderer.on("browserview-loading-finish", callback),
    onNavigate: (callback) => electron_1.ipcRenderer.on("browserview-navigate", callback),
    onTitleUpdated: (callback) => electron_1.ipcRenderer.on("browserview-title-updated", callback),
    onLoadFailed: (callback) => electron_1.ipcRenderer.on("browserview-load-failed", callback),
    onDomReady: (callback) => electron_1.ipcRenderer.on("browserview-dom-ready", callback),
    onNavigationState: (callback) => electron_1.ipcRenderer.on("browserview-navigation-state", callback),
});
