// src/renderer/api-factory.ts
import { ipcRenderer, contextBridge } from "electron"
import type { WebContents } from "electron"

// Monarc store types (adjust if you use Pinia instead of Vuex)
import type { TabObject, BrowserWindowProperty } from "@/types/store"

// --- Utility ---
function getBuiltInTabIndex(tabs: TabObject[], index: number): number {
  return tabs.findIndex(tab => tab.index === index)
}

function findOrDummy(tabs: TabObject[], tabId: number, dummy: TabObject): TabObject {
  if (tabId === -1) return dummy
  return tabs.find(t => t.id === tabId) ?? dummy
}

// --- API Factory ---
export function createApi(store: any) {
  const tabs = {
    get(tabId: number): TabObject {
      return findOrDummy(store.tabs, tabId, store.dummyTabObject)
    },
    create(url?: string): void {
      ipcRenderer.send("tabs-create", { url })
    },
    update(tabId: number, url: string): void {
      ipcRenderer.send("tabs-update", { tabId, url })
    },
    remove(tabId: number): void {
      ipcRenderer.send("tabs-remove", { tabId })
    },
    reload(tabId: number): void {
      ipcRenderer.send("tabs-reload", { tabId })
    },
  }

  const windows = {
    get(windowId: number): BrowserWindowProperty | undefined {
      if (windowId === store.window.id) {
        return { ...store.window, tabs: store.tabs }
      }
      return undefined
    },
  }

  const runtime = {
    sendMessage(channel: string, payload: any): void {
      ipcRenderer.send(channel, payload)
    },
    onMessage(channel: string, cb: (payload: any) => void): void {
      ipcRenderer.on(channel, (_e, data) => cb(data))
    },
  }

  return {
    tabs,
    windows,
    runtime,
  }
}

// --- Expose to Renderer ---
// preload.ts should call this
export function initializeExtensionApi(store: any) {
  const api = createApi(store)
  contextBridge.exposeInMainWorld("monarcAPI", api)
}
