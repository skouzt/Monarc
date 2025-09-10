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
  
  globalObject.monarc = context.monarc;
  globalObject.chrome = globalObject.monarc;
  globalObject.ipcRenderer = ipcRenderer;

  ipcRenderer.once(`monarc-extension-${hostname}-going-removed`, () => {
    // remove all the registered things related to this extension
    Object.values(globalObject.monarc.webRequest).forEach(v => (v as any).removeAllListeners());
    globalObject.monarc.contextMenus.removeAll(() => {
      // removeBackgroundPages of src/main/api/monarc-extension.ts
      ipcRenderer.send(`monarc-extension-${hostname}-local-shortcut-unregister`);
      // removeBackgroundPages of src/main/api/listeners.ts
      ipcRenderer.send(`remove-monarc-extension-${hostname}`);
      // removeBackgroundPages of src/main/api/monarc-extension.ts
      ipcRenderer.send(`monarc-extension-${hostname}-clean-done`);
    });
  });

  ipcRenderer.on('monarc-runtime-send-message', (_, external, message, sender) => {
    if (external) {
      globalObject.monarc.runtime.onMessageExternal.emit(message, sender);
    } else {
      globalObject.monarc.runtime.onMessage.emit(message, sender);
    }
  });

  ipcRenderer.on('monarc-runtime-before-connect', (_, extensionId, connectInfo, responseScriptType, webContentsId) => {
    globalObject.monarc.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId
    );
  });

  ipcRenderer.on('monarc-browser-action-clicked', (_, clickedTab) => {
    globalObject.monarc.tabs.get(clickedTab.id, tab => globalObject.monarc.browserAction.onClicked.emit(tab));
  });

  ipcRenderer.on('monarc-page-action-clicked', (_, clickedTab) => {
    globalObject.monarc.tabs.get(clickedTab.id, tab => globalObject.monarc.pageAction.onClicked.emit(tab));
  });

  ipcRenderer.on('monarc-commands-triggered', (_, command) => {
    globalObject.monarc.commands.onCommand.emit(command);
  });
});

process.once('exit', () => {
  globalObject.monarc.runtime.port.disconnect();
});