const { contextBridge, ipcRenderer } = require("electron");
const electronAPI = {
    loadUrl: (url) => ipcRenderer.invoke("browserview-load-url", url),
    onTitleUpdated: (callback) => {
        const listener = (_event, title) => callback(title);
        ipcRenderer.on("browserview-title-updated", listener);
        return () => ipcRenderer.removeListener("browserview-title-updated", listener);
    },
    getPlatform: () => process.platform, // expose safely
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
export {};
