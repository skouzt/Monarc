/* eslint-disable max-len */
import { ipcRenderer } from 'electron';
import injectTo from '../renderer/api/inject-to';
const resizeSensor = require('css-element-queries/src/ResizeSensor');

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
  const context: Monarc.Preload.Context = { monarc: {} };
  globalObject.scriptType = 'popup';
  injectTo(guestInstanceId, hostname, globalObject.scriptType, context);
  
  globalObject.monarc = context.monarc;
  globalObject.chrome = globalObject.monarc;
  globalObject.ipcRenderer = ipcRenderer;
  globalObject.ResizeSensor = resizeSensor;

  ipcRenderer.on('monarc-runtime-before-connect', (event, extensionId, connectInfo, responseScriptType, webContentsId) => {
    globalObject.monarc.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId
    );
  });
});

process.once('exit', () => {
  globalObject.monarc.runtime.port.disconnect();
});