/* eslint-disable no-undef */

/// <reference types="electron" />

import { ComponentCustomProperties } from 'vue';

interface BrowserWindow {
  static createWindow(
    options?: Electron.BrowserWindowConstructorOptions,
    callback?: (eventName: string) => void
  ): Electron.BrowserWindow;
}

interface Remote extends Electron.Remote {
  BrowserWindow: BrowserWindow & typeof Electron.BrowserWindow;
}

interface MonarcElectron {
  clipboard: Electron.Clipboard;
  crashReporter: Electron.CrashReporter;
  desktopCapturer: Electron.DesktopCapturer;
  ipcRenderer: Electron.IpcRenderer;
  nativeImage: typeof Electron.NativeImage;
  remote: Remote;
  screen: Electron.Screen;
  shell: Electron.Shell;
  webFrame: Electron.WebFrame;
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $electron: MonarcElectron;
  }
}
