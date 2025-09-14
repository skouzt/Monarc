/* eslint-disable max-len */

import { ipcRenderer } from 'electron';

import injectTo from '../renderer/api/inject-to';

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.includes('--guest-instance-id='));
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1
    ),
    10
  );
}

const globalObject = global as any;

process.once('loaded', () => {
  const { hostname } = globalObject.location; // hostname equals extensionId
  const context: any = {};
  globalObject.scriptType = 'event';
  injectTo(guestInstanceId, hostname, globalObject.scriptType, context);
  globalObject.Monarc = context.Monarc;
  globalObject.chrome = globalObject.Monarc;

  globalObject.ipcRenderer = ipcRenderer;

  ipcRenderer.once(`Monarc-extension-${hostname}-going-removed`, () => {
    // remove all the registered things related to this extension
    Object.values(globalObject.Monarc.webRequest).forEach(v => (v as any).removeAllListeners());
    globalObject.Monarc.contextMenus.removeAll(() => {
      // removeBackgroundPages of src/main/api/Monarc-extension.ts
      ipcRenderer.send(`Monarc-extension-${hostname}-local-shortcut-unregister`);
      // removeBackgroundPages of src/main/api/listeners.ts
      ipcRenderer.send(`remove-Monarc-extension-${hostname}`);
      // removeBackgroundPages of src/main/api/Monarc-extension.ts
      ipcRenderer.send(`Monarc-extension-${hostname}-clean-done`);
    });
  });
  ipcRenderer.on('Monarc-runtime-send-message', (_, external, message, sender) => {
    if (external) {
      globalObject.Monarc.runtime.onMessageExternal.emit(message, sender);
    } else {
      globalObject.Monarc.runtime.onMessage.emit(message, sender);
    }
  });
  ipcRenderer.on('Monarc-runtime-before-connect', (_, extensionId, connectInfo, responseScriptType, webContentsId) => {
    globalObject.Monarc.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId
    );
  });
  ipcRenderer.on('Monarc-browser-action-clicked', (_, clickedTab) => {
    globalObject.Monarc.tabs.get(clickedTab.id, tab => globalObject.Monarc.browserAction.onClicked.emit(tab));
  });
  ipcRenderer.on('Monarc-page-action-clicked', (_, clickedTab) => {
    globalObject.Monarc.tabs.get(clickedTab.id, tab => globalObject.Monarc.pageAction.onClicked.emit(tab));
  });
  ipcRenderer.on('Monarc-commands-triggered', (_, command) => {
    globalObject.Monarc.commands.onCommand.emit(command);
  });
});

process.once('exit', () => {
  globalObject.Monarc.runtime.port.disconnect();
});
