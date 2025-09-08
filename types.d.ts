// G:\monarc\src\types.d.ts

import { BrowserWindow } from 'electron';

// =============================================
// Main Process Types (Used by main.ts)
// =============================================

// Define the IPC channels used for main-to-renderer communication.
export type IpcChannel =
  | 'window-minimize'
  | 'window-maximize'
  | 'window-close';

// Define the shape of the main process functions.
export function createWindow(): void;
export function pollResources(mainWindow: BrowserWindow): void;
export function isDev(): boolean;

// =============================================
// Renderer Process API (Used by preload.ts)
// =============================================

// Define the API exposed by the preload script to the renderer.
export type ElectronAPI = {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  loadURL: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  clearCache: () => Promise<void>;
  getPageTitle: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  getIsDev: () => Promise<boolean>;
};

// =============================================
// Resource Manager Types
// =============================================

// Define the types for the resource statistics data.
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

// Define the type for the IPC function that sends data to the renderer.
export interface IpcRendererSend {
  (channel: 'statistics', ...args: ResourceStatistics[]): void;
}

// =============================================
// Global Window Interfaces
// =============================================

// Declare the global `window` object with our custom APIs.
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ipcWebContentsSend: IpcRendererSend;
  }
}