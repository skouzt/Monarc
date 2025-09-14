/* eslint-disable import/prefer-default-export */

import { Config } from 'electron';

interface BrowserState extends Monarc.Store.State {
  browser: Monarc.Store.State;
}

export const getters = {
  pid(state: BrowserState): number {
    return state.browser.tabId;
  },
  tabs(state: BrowserState): Monarc.Store.TabObject[] {
    return state.browser.tabs;
  },
  tabsOrder(state: BrowserState): number[][] {
    return state.browser.tabsOrder;
  },
  currentTabIndexes(state: BrowserState): number[] {
    return state.browser.currentTabIndexes;
  },
  searchEngine(state: BrowserState): Monarc.Store.SearchEngineObject[] {
    return state.browser.searchEngine;
  },
  currentSearchEngine(state: BrowserState): Monarc.Store.SearchEngineObject {
    return state.browser.currentSearchEngine;
  },
  autoFetch(state: BrowserState): boolean {
    return state.browser.autoFetch;
  },
  homepage(state: BrowserState): string {
    return state.browser.homepage;
  },
  pdfViewer(state: BrowserState): string {
    return state.browser.pdfViewer;
  },
  tabConfig(state: BrowserState): Monarc.Store.TabConfig {
    return state.browser.tabConfig;
  },
  lang(state: BrowserState): string {
    return state.browser.lang;
  },
  proxyConfig(state: BrowserState): Config {
    return state.browser.proxyConfig;
  },
  auth(state: BrowserState): { username: string; password: string } {
    return state.browser.auth;
  },
  downloads(state: BrowserState): Monarc.Store.DownloadItem[] {
    return state.browser.downloads;
  },
  history(state: BrowserState): Monarc.Store.TabHistory[] {
    return state.browser.history;
  },
  lastOpenedTabs(state: BrowserState): Monarc.Store.LastOpenedTabObject[] {
    return state.browser.lastOpenedTabs;
  },
  permissions(state: BrowserState): any {
    return state.browser.permissions;
  },
  certificates(state: BrowserState): Monarc.Store.Certificates {
    return state.browser.certificates;
  },
  windows(state: BrowserState): Monarc.Store.MonarcBrowserWindowProperty[] {
    return state.browser.windows;
  },
  extensionInfoDict(state: BrowserState): Monarc.Store.ExtensionInfoDict {
    return state.browser.extensionInfoDict;
  },
};
