/* eslint-disable max-len */

import { BrowserWindow, dialog, ipcMain, webContents, IpcMainEvent } from 'electron';

const windows = require('../../shared/store/mainStore').default.getWindows();

ipcMain.on('open-dev-tools', (event, webContentsId) => {
  if (webContentsId) {
    webContents.fromId(webContentsId).openDevTools();
  }
});
ipcMain.on('add-Monarc-extension', (event: IpcMainEvent) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (browserWindow) {
    dialog.showOpenDialog(browserWindow, { properties: ['openDirectory'] }).then((res) => {
      if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
        const dir: string = res.filePaths[0];
        let name = '';
        let result = 'OK';
        try {
          if (dir) {
            // an array of directory paths chosen by the user will be returned, but we only want one path
            name = ((BrowserWindow as any) as Monarc.BrowserWindow).addMonarcExtension(dir);
          }
        } catch (readError) {
          result = readError.message;
        }

        Object.keys(windows).forEach((key) => {
          const id = parseInt(key, 10);
          const window = windows[id];
          window.webContents.send('add-Monarc-extension-result', {
            name,
            result,
          });
        });
        event.sender.send('add-Monarc-extension-result', {
          name,
          result,
        });
      }
    });
  }
});
ipcMain.on('remove-Monarc-extension', (event, extensionId) => {
  let result = 'OK';
  try {
    const ret: string = ((BrowserWindow as any) as Monarc.BrowserWindow).removeMonarcExtension(extensionId);
    ipcMain.once(`remove-Monarc-extension-${extensionId}`, () => {
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('remove-Monarc-extension-result', {
          extensionId,
          result,
        });
      });
      event.sender.send('remove-Monarc-extension-result', {
        extensionId,
        result,
      });
    });
    if (ret === '') {
      result = `ENOENT: Extension ${extensionId} not found!`;
    }
  } catch (removeError) {
    result = removeError.message;
  }
});

ipcMain.on('Monarc-env-app-name', (event, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-env-app-name', {
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-env-app-version', (event, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-env-app-version', {
      suffix,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-browser-action-set-icon', (event, extensionId, startPage, details, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-browser-action-set-icon', {
      extensionId,
      startPage,
      details,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-browser-action-set-badge-text', (event, extensionId, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-browser-action-set-badge-text', {
      extensionId,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-browser-action-set-badge-background-color', (event, extensionId, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-browser-action-set-badge-background-color', {
      extensionId,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-browser-action-add-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-browser-action-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-browser-action-remove-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-browser-action-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-browser-action-emit-on-message', (event, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-browser-action-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-page-action-set-icon', (event, extensionId, startPage, details, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-page-action-set-icon', {
      extensionId,
      startPage,
      details,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-page-action-show', (event, tabId, extensionId, enabled) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-page-action-show', {
      tabId,
      extensionId,
      enabled,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-page-action-hide', (event, tabId, extensionId, enabled) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-page-action-hide', {
      tabId,
      extensionId,
      enabled,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-page-action-add-listener-on-clicked', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-page-action-add-listener-on-clicked', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-page-action-remove-listener-on-clicked', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-page-action-remove-listener-on-clicked', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-page-action-emit-on-clicked', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-page-action-emit-on-clicked', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-commands-add-listener-on-command', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-commands-add-listener-on-command', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-commands-remove-listener-on-command', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-commands-remove-listener-on-command', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-commands-emit-on-command', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-commands-emit-on-command', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-alarms-get', (event, name, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-get', {
      name,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-get-all', (event, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-get-all', {
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-clear', (event, name, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-clear', {
      name,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-clear-all', (event, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-clear-all', {
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-create', (event, name, alarmInfo) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-create', {
      name,
      alarmInfo,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-add-listener-on-alarm', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-add-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-remove-listener-on-alarm', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-remove-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-alarms-emit-on-alarm', (event, alarm) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-alarms-emit-on-alarm', {
      alarm,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-runtime-send-message', (event, extensionId, message, external) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-send-message', {
      extensionId,
      message,
      external,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-runtime-add-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-runtime-remove-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-runtime-emit-on-message', (event, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-runtime-add-listener-on-message-external', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-add-listener-on-message-external', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-runtime-remove-listener-on-message-external', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-remove-listener-on-message-external', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-runtime-emit-on-message-external', (event, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-runtime-emit-on-message-external', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-tabs-get', (event, tabId, suffix) => {
  // event.sender.send('Monarc-tabs-get-result', store.getters.tabs.find(tab => (tab.id === tabId)));
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-get', {
      tabId,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-get-current', (event, guestInstanceId, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-get-current', {
      guestInstanceId,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-duplicate', (event, tabId, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-duplicate', {
      tabId,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-query', (event, queryInfo, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-query', {
      queryInfo,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-update', (event, tabId, updateProperties, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-update', {
      tabId,
      updateProperties,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-reload', (event, tabId, reloadProperties, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-reload', {
      tabId,
      reloadProperties,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-create', (event, createProperties, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-create', {
      createProperties,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-remove', (event, tabIds, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-remove', {
      tabIds,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-detect-language', (event, tabId, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-detect-language', {
      tabId,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-detect-language-result', (event, value, suffix, webContentsId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-detect-language-result', {
      value,
      suffix,
      webContentsId,
    });
  });
});
ipcMain.on('Monarc-tabs-execute-script', (event, tabId, details, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-execute-script', {
      tabId,
      details,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-insert-css', (event, tabId, details, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-insert-css', {
      tabId,
      details,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-send-message', (event, tabId, message, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-send-message', {
      tabId,
      message,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-add-listener-on-activated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-add-listener-on-activated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-remove-listener-on-activated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-remove-listener-on-activated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-emit-on-activated', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-emit-on-activated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-add-listener-on-updated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-add-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-remove-listener-on-updated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-remove-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-emit-on-updated', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-emit-on-updated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-add-listener-on-created', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-add-listener-on-created', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-remove-listener-on-created', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-emit-on-created', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-emit-on-created', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-add-listener-on-removed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-add-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-remove-listener-on-removed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-tabs-emit-on-removed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-tabs-emit-on-removed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-windows-get', (event, windowId, getInfo, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-windows-get', {
      windowId,
      getInfo,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-windows-get-current', (event, getInfo, guestInstanceId, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-windows-get-current', {
      getInfo,
      guestInstanceId,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-windows-get-all', (event, getInfo, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-windows-get-all', {
      getInfo,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-storage-add-listener-on-changed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-storage-add-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-storage-remove-listener-on-changed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-storage-remove-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-storage-emit-on-changed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-storage-emit-on-changed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-context-menus-create', (event, menuItems, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-context-menus-create', {
      menuItems,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-context-menus-remove', (event, menuItems, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-context-menus-remove', {
      menuItems,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-context-menus-remove-all', (event, menuItems, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-context-menus-remove-all', {
      menuItems,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('Monarc-web-navigation-get-frame', (event, details, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-get-frame', {
      details,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-get-frame-result', (event, details, suffix, webContentsId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-get-frame-result', {
      details,
      suffix,
      webContentsId,
    });
  });
});
ipcMain.on('Monarc-web-navigation-get-all-frames', (event, details, suffix) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-get-all-frames', {
      details,
      suffix,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-get-all-frames-result', (event, details, suffix, webContentsId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-get-all-frames-result', {
      details,
      suffix,
      webContentsId,
    });
  });
});
ipcMain.on('Monarc-web-navigation-add-listener-on-before-navigate', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-add-listener-on-before-navigate', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-remove-listener-on-before-navigate', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-remove-listener-on-before-navigate', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-emit-on-before-navigate', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-emit-on-before-navigate', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-add-listener-on-committed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-add-listener-on-committed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-remove-listener-on-committed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-remove-listener-on-committed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-emit-on-committed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-emit-on-committed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-add-listener-on-dom-content-loaded', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-add-listener-on-dom-content-loaded', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-remove-listener-on-dom-content-loaded', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-remove-listener-on-dom-content-loaded', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-emit-on-dom-content-loaded', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-emit-on-dom-content-loaded', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-add-listener-on-completed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-add-listener-on-completed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-remove-listener-on-completed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-remove-listener-on-completed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-emit-on-completed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-emit-on-completed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-add-listener-on-created-navigation-target', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-add-listener-on-created-navigation-target', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-remove-listener-on-created-navigation-target', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-remove-listener-on-created-navigation-target', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('Monarc-web-navigation-emit-on-created-navigation-target', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('Monarc-web-navigation-emit-on-created-navigation-target', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
