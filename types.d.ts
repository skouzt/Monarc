// G:\monarc\src\types.d.ts

import { BrowserWindow, BrowserView } from 'electron';

// =============================================
// Main Process Types (Used by main.ts)
// =============================================

// Define the IPC channels used for main-to-renderer communication
export type IpcChannel =
  | 'window-minimize'
  | 'window-maximize'
  | 'window-close'
  | 'browserview-load-url'
  | 'browserview-go-back'
  | 'browserview-go-forward'
  | 'browserview-reload'
  | 'browserview-stop'
  | 'browserview-can-go-back'
  | 'browserview-can-go-forward'
  | 'browserview-get-url'
  | 'clear-cache'
  | 'get-page-title'
  | 'get-platform'
  | 'get-is-dev'
  | 'browserview-loading-start'
  | 'browserview-loading-finish'
  | 'browserview-navigate'
  | 'browserview-title-updated'
  | 'browserview-load-failed'
  | 'browserview-dom-ready';

// BrowserView error type
export interface BrowserViewError {
  errorCode: number;
  errorDescription: string;
  validatedURL?: string;
}

// Define the shape of the main process functions
export function createWindow(): void;
export function pollResources(mainWindow: BrowserWindow): void;
export function isDev(): boolean;
export function createBrowserView(): void;
export function resizeBrowserView(): void;
export function setupBrowserViewEvents(): void;

// =============================================
// Renderer Process API (Used by preload.ts)
// =============================================

// Define the API exposed by the preload script to the renderer
interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // BrowserView controls
  browserviewLoadUrl: (url: string) => Promise<void>;
  browserviewGoBack: () => Promise<void>;
  browserviewGoForward: () => Promise<void>;
  browserviewReload: () => Promise<void>;
  browserviewStop: () => Promise<void>;
  
  // BrowserView navigation state
  browserviewCanGoBack: () => Promise<boolean>;
  browserviewCanGoForward: () => Promise<boolean>;
  browserviewGetURL: () => Promise<string>;

  // Browser-related tasks
  clearCache: () => Promise<void>;
  getPageTitle: () => Promise<string>;

  // Platform & environment
  getPlatform: () => Promise<NodeJS.Platform>;
  getIsDev: () => Promise<boolean>;

  // BrowserView event listeners
  onBrowserviewLoadingStart: (callback: () => void) => () => void;
  onBrowserviewLoadingFinish: (callback: () => void) => () => void;
  onBrowserviewNavigate: (callback: (url: string) => void) => () => void;
  onBrowserviewTitleUpdated: (callback: (title: string) => void) => () => void;
  onBrowserviewLoadFailed: (callback: (error: BrowserViewError) => void) => () => void;
  onBrowserviewDomReady: (callback: () => void) => () => void;
}

// =============================================
// Resource Manager Types
// =============================================

// Define the types for the resource statistics data
export type ResourceStatistics = {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
};

export type StaticData = {
  totalStorage: number;
  cpuModel: string;
  totalMemoryGB: number;
};

// Define the type for the IPC function that sends data to the renderer
export interface IpcRendererSend {
  (channel: 'statistics', ...args: ResourceStatistics[]): void;
}

// =============================================
// BrowserView Manager Types (Used by React components)
// =============================================

export interface BrowserViewManagerProps {
  currentUrl: string;
  onLoadingChange?: (loading: boolean) => void;
  onUrlChange?: (url: string) => void;
  onTitleChange?: (title: string) => void;
  onError?: (error: BrowserViewError) => void;
  onDomReady?: () => void;
}

export interface BrowserViewNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
  isLoading: boolean;
}

// =============================================
// Global Window Interfaces
// =============================================

// Declare the global `window` object with our custom APIs
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ipcWebContentsSend: IpcRendererSend;
  }

  // Declare Electron modules for type safety
  declare module 'electron' {
    interface BrowserView {
      webContents: Electron.WebContents;
      setBounds(bounds: Electron.Rectangle): void;
      setAutoResize(options: Electron.AutoResizeOptions): void;
    }
  }
}

// =============================================
// Component Prop Types
// =============================================

export interface HeaderProps {
  currentUrl: string;
  setCurrentUrl: (url: string) => void;
  isLoading: boolean;
  onBackClick?: () => void;
  onForwardClick?: () => void;
  onReloadClick?: () => void;
  onStopClick?: () => void;
  onHomeClick?: () => void;
}

export interface BrowserContentProps {
  currentUrl: string;
  isLoading: boolean;
  bookmarks: Array<{
    name: string;
    url: string;
    icon: string;
  }>;
  onBookmarkClick?: (url: string) => void;
  setIsLoading?: (loading: boolean) => void;
  setCurrentUrl?: (url: string) => void;
  onTabUpdate?: (url: string, title: string) => void;
}

export interface NewTabPageProps {
  bookmarks: Array<{
    name: string;
    url: string;
    icon: string;
  }>;
  onBookmarkClick?: (url: string) => void;
}

// =============================================
// Tab Management Types
// =============================================

export interface Tab {
  id: number;
  url: string;
  title: string;
  favicon?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
}

export interface TabManager {
  tabs: Tab[];
  currentTabId: number;
  addTab: (url: string) => void;
  closeTab: (tabId: number) => void;
  switchTab: (tabId: number) => void;
  updateTab: (tabId: number, updates: Partial<Tab>) => void;
}

// =============================================
// Utility Types
// =============================================

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;