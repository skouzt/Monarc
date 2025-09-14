/* eslint-disable no-console */

import { Store } from 'vuex';
import { readdirSync, readFileSync, rename, writeFile } from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  app,
  BrowserView,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  MenuItem,
  nativeImage,
  protocol,
  shell,
  screen,
  systemPreferences,
} from 'electron';
import collect from 'collect.js';
import { is } from 'electron-util';

import localshortcut from 'electron-localshortcut';
import autoUpdater from './lib/auto-updater';
import constants from './constants';
import menu from './lib/menu';
import promisify from './lib/promisify';
import fetch from './lib/fetch';
import View from './lib/view';

const { openProcessManager } = require('electron-process-manager');

const isTesting = process.env.NODE_ENV === 'test';
const startTime = new Date().getTime();
const globalObject = global as Monarc.API.GlobalObject;

/*
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  globalObject.__static = path.resolve(__dirname, '../static');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.exit();
}

let shuttingDown: boolean = isTesting;

if (process.env.NODE_ENV === 'development') {
  app.setPath('userData', constants.devUserData);
} else if (isTesting) {
  app.setPath('userData', constants.testUserData);
}

const storagePath: string = path.join(app.getPath('userData'), 'Monarc-state');
const langPath: string = path.join(app.getPath('userData'), 'Monarc-lang');

let MonarcStateSaveHandler: any = null;
let setLanguage = false;

const autoHideMenuBarSetting: boolean = is.macos;
const swipeGesture: boolean = is.macos
  ? systemPreferences.isSwipeTrackingFromScrollEventsEnabled()
  : false;

const winURL: string = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}`
  : `file://${__dirname}/index.html`;
const cpURL: string = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}/cp.html`
  : `file://${__dirname}/cp.html`;

// ./lib/session.ts
const { default: session } = require('./lib/session');

// ../shared/store/mainStore.ts
const { default: mainStore } = require('../shared/store/mainStore');
mainStore.register(storagePath, swipeGesture);
const store: Store<any> = mainStore.getStore();
const windows: Electron.BrowserWindow[] = mainStore.getWindows();
const views: View[] = [];

// ./api/Monarc-extension.ts
const { default: MonarcExtension } = require('./api/Monarc-extension');

function MonarcStateSave(soft = true, windowCount = Object.keys(windows).length): void {
  if (!soft) {
    let count = 0;
    Object.keys(windows).forEach((key) => {
      const id = parseInt(key, 10);
      const window = windows[id];
      window.once('closed', () => {
        count += 1;
        if (count === windowCount) {
          if (setLanguage) {
            // don't count in 'command-palette'
            mainStore.bumpWindowIds(windowCount - 1);
          }
        }
      });
      window.close();
      // https://github.com/electron/electron/issues/22290
      (window as any).removeAllListeners('close');
    });
  }
  if (setLanguage) {
    return;
  }
  mainStore.saveMonarcState(soft)
    .then((state) => {
      if (state) {
        promisify(writeFile, storagePath, JSON.stringify(state)).then(() => {
          if (MonarcStateSaveHandler === null) {
            shuttingDown = true;
            app.quit();
          }
        });
      }
    });
}

// eslint-disable-next-line max-len
function createWindow(options?: Electron.BrowserWindowConstructorOptions, callback?: (eventName: string) => void): Electron.BrowserWindow {
  let mainWindow: Electron.BrowserWindow;
  const defaultOption: Record<string, any> = {
    autoHideMenuBar: autoHideMenuBarSetting,
    frame: !is.windows,
    fullscreenWindowTitle: true,
    minWidth: 320,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      worldSafeExecuteJavaScript: true,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      webviewTag: true,
    },
  };
  if (options && Object.keys(options).length !== 0) {
    mainWindow = new BrowserWindow(Object.assign({}, defaultOption, options));
  } else {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow(Object.assign({}, defaultOption, {
      width: 1080,
      height: 720,
    }));
  }

  mainWindow.loadURL(winURL);
  for (let index = 1; index < 9; index += 1) {
    localshortcut.register(mainWindow, `CmdOrCtrl+${index}`, () => {
      mainWindow.webContents.send('tab-click', index - 1);
    });
  }
  if (!is.macos) {
    /*
    * On Windows and Linux, there're two shortcuts registered
    * to jump to the next and previous open tab.
    * However, it's not possible to add multiple accelerators in
    * Electron currently; therefore, we need to register another one here.
    * Ref: https://github.com/electron/electron/issues/5256
    */
    localshortcut.register(mainWindow, 'Ctrl+Tab', () => {
      mainWindow.webContents.send('tab-select', 'next');
    });
    localshortcut.register(mainWindow, 'Ctrl+Shift+Tab', () => {
      mainWindow.webContents.send('tab-select', 'previous');
    });
  }
  // register 'Escape' shortcut
  localshortcut.register(mainWindow, 'Escape', () => {
    mainWindow.webContents.send('escape-full-screen');
  });
  // special case: go to the last tab
  localshortcut.register(mainWindow, 'CmdOrCtrl+9', () => {
    mainWindow.webContents.send('tab-click', -1);
  });
  // register the shortcut for opening the tab closed recently
  localshortcut.register(mainWindow, 'CmdOrCtrl+Shift+T', () => {
    mainWindow.webContents.send('restore-recently-closed-tab');
  });

  menu.init();

  /*
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    webPreferences.nativeWindowOpen = false;
    webPreferences.enableBlinkFeatures = 'OverlayScrollbars';
    webPreferences.nodeIntegrationInSubFrames = true;

    const backgroundRegExp = new RegExp(/^Monarc-extension:\/\/.+\/.*background.*\.html$/);
    if (params.src.startsWith('Monarc-extension://')) {
      if (params.src.match(backgroundRegExp)) {
        webPreferences.preload = path.join(constants.MonarcPreloadPath, 'extension-preload.js');
      } else {
        webPreferences.preload = path.join(constants.MonarcPreloadPath, 'popup-preload.js');
      }
    }
  });
  */

  mainWindow.on('close', () => {
    // https://github.com/electron/electron/issues/22290
    (mainWindow as any).removeAllListeners('will-attach-webview');
  });
  mainWindow.on('closed', () => ((mainWindow as any) = null));

  if (!isTesting) {
    // the first window
    if (MonarcStateSaveHandler === null) {
      // save app-state every 5 mins
      MonarcStateSaveHandler = setInterval(MonarcStateSave, 1000 * 60 * 5);

      // reset the setLanguage variable
      if (setLanguage) {
        setLanguage = false;
      }
    }
  }
  if (callback) {
    (mainWindow as any).callback = callback;
  } else {
    (mainWindow as any).callback = (eventName) => {
      ipcMain.once(eventName, (event: Electron.IpcMainEvent) => {
        event.sender.send(eventName.substr(4), { url: 'about:newtab', follow: true });
      });
    };
  }
  return mainWindow;
}

// register the method to BrowserWindow
(BrowserWindow as any).createWindow = createWindow;

// register 'Monarc' and 'Monarc-extension' as standard protocols that are secure
protocol.registerSchemesAsPrivileged([
  { scheme: 'Monarc', privileges: { standard: true, secure: true } },
  { scheme: 'Monarc-extension', privileges: { standard: true, secure: true } },
]);

app.whenReady().then(() => {
  // autoUpdater
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.init();
    autoUpdater.listen(windows);
  }

  // session related operations
  session.onWillDownload(windows, constants.MonarcPDFJSPath);
  session.setPermissionRequestHandler(windows);
  session.registerScheme(constants.MonarcPagesCustomProtocol);
  session.registerCertificateVerifyProc();
  session.registerWebRequestListeners();

  // load persisted extensions
  MonarcExtension.loadExtensions();

  // load Monarc-state
  let data: any = '""';
  try {
    data = readFileSync(storagePath, 'utf8');
  } catch (readError) {
    console.error(`(Monarc-browser) Could not read data from ${storagePath}, ${readError}`);
  }
  try {
    data = JSON.parse(data);
  } catch (parseError) {
    console.error(`(Monarc-browser) Could not parse data from ${storagePath}, ${parseError}`);
  } finally {
    if (data) {
      store.dispatch('setMonarcState', data);
      session.registerProxy(store.getters.proxyConfig);
    }
    try {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;

      globalObject.commandPalette = new BrowserWindow({
        width: width / 2,
        height: height / 1.94,
        show: false,
        frame: false,
        alwaysOnTop: true,
        fullscreenable: false,
        resizable: false,
        webPreferences: {
          partition: 'command-palette',
          nodeIntegration: true,
        },
      });

      globalObject.commandPalette.setVisibleOnAllWorkspaces(false);
      globalObject.commandPalette.loadURL(cpURL);
      globalShortcut.register('CmdOrCtrl+Shift+K', () => {
        if (globalObject.commandPalette.isVisible()) {
          globalObject.commandPalette.hide();
        } else {
          globalObject.commandPalette.show();
          globalObject.commandPalette.webContents.send('send-focus');
        }
      });
      globalObject.commandPalette.on('blur', () => globalObject.commandPalette.hide());
      createWindow();
    } catch (createWindowError) {
      console.error(`(Monarc-browser) Could not create a window: ${createWindowError}`);
      app.exit(1);
    }
  }
});

if (process.env.TEST_ENV !== 'e2e') {
  app.on('remote-require', (event, webContents) => {
    console.error(
      `(Monarc-browser) Invalid module to require at webContents ${webContents.id}`
    );
    event.preventDefault();
  });
  app.on('remote-get-global', (event: Electron.IpcMainEvent, webContents, globalName) => {
    if (globalName === 'commandPalette') {
      event.returnValue = globalObject.commandPalette;
    } else {
      console.error(
        `(Monarc-browser) Invalid object to get at webContents ${webContents.id}`
      );
      event.preventDefault();
    }
  });
}

app.on('login', (event, webContents, request, authInfo, callback) => {
  const { auth } = store.getters;
  if (auth.username && auth.password) {
    callback(auth.username, auth.password);
  } else {
    dialog.showMessageBox(null!, {
      type: 'warning',
      buttons: ['OK'],
      title: 'Require authentication',
      // eslint-disable-next-line max-len
      message: 'The server requires a username and password. You can set them in "Preferences / Auth".',
      detail: `Server: ${request.url}\nRealm: ${authInfo.realm}`,
    });
  }
});

app.on('window-all-closed', () => {
  if (isTesting || !is.macos) {
    app.quit();
  }
});

app.on('activate', () => {
  if (Object.keys(windows).length === 0) {
    createWindow();
  }
});

app.on('before-quit', (event: Electron.Event) => {
  if (shuttingDown) {
    return;
  }
  event.preventDefault();
  mainStore.updateWindowStates();
  if (MonarcStateSaveHandler !== null) {
    clearInterval(MonarcStateSaveHandler);
    MonarcStateSaveHandler = null;
  }
  MonarcStateSave(false);
});

// https://github.com/electron/electron/pull/12782
app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  for (let id = 0; id < Object.keys(windows).length; id += 1) {
    const window = windows[id] as Electron.BrowserWindow;
    if (window.getTitle() !== 'command-palette') {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
      return;
    }
  }
});

// load windowProperties
ipcMain.on('get-window-properties', (event: Electron.IpcMainEvent) => {
  const windowProperties: any = [];
  const baseDir = path.dirname(storagePath);
  const collection = collect(readdirSync(baseDir, 'utf8'));
  let windowPropertyFilenames =
    collection.filter(v => (v.match(/Monarc-state-window-\d+/) !== null));
  if (windowPropertyFilenames.isNotEmpty()) {
    windowPropertyFilenames = windowPropertyFilenames.sort((a, b) => (
      (b.split('-') as any).pop() - (a.split('-') as any).pop()
    ));
    windowPropertyFilenames.all().forEach((windowPropertyFilename) => {
      const windowPropertyFile = path.join(baseDir, windowPropertyFilename);
      const windowProperty = JSON.parse(readFileSync(windowPropertyFile, 'utf8'));
      windowProperty.path = windowPropertyFile;
      windowProperty.mtime = startTime;
      windowProperties.push(windowProperty);
    });
  }
  event.returnValue = windowProperties;
});
// restore windowProperties
ipcMain.on('restore-window-property', (event: Electron.Event, windowProperty: any) => {
  const options: Electron.BrowserWindowConstructorOptions = {};
  const { window } = windowProperty;
  const windowState: string = window.state;
  options.width = window.width;
  options.height = window.height;
  options.x = window.left;
  options.y = window.top;

  const tmpWindow = createWindow(options, (eventName) => {
    ipcMain.once(eventName, (event2: Electron.IpcMainEvent) => {
      event2.sender.send(eventName.substr(4), null);
      windowProperty.tabs.forEach((tab, index) => {
        tmpWindow.webContents.send(
          'new-tab', { url: tab.url, follow: index === windowProperty.currentTabIndex }
        );
      });
      const windowPropertyFilename = path.basename(windowProperty.path);
      const windowPropertyTmp = path.resolve(app.getPath('temp'), windowPropertyFilename);
      rename(windowProperty.path, windowPropertyTmp, (renameError) => {
        if (renameError) {
          console.error(`(Monarc-browser) ${renameError}`);
        }
      });
    });
  });
  if (window.focused) {
    tmpWindow.focus();
  }
  if (windowState === 'minimized') {
    tmpWindow.minimize();
  } else if (windowState === 'maximized') {
    tmpWindow.maximize();
  } else if (windowState === 'fullscreen') {
    tmpWindow.setFullScreen(true);
  }
});

// open ProcessManager
ipcMain.on('open-process-manager', () => {
  openProcessManager();
});

// return the number of BrowserWindow
ipcMain.on('get-window-count', (event: Electron.IpcMainEvent) => {
  event.returnValue = Object.keys(windows).length;
});

// create a BrowserView
ipcMain.on('create-browser-view', (event, data) => {
  const { tabId, tabIndex, url }: { tabId: number; tabIndex: number; url: string } = data;

  const window = windows[data.windowId] as Electron.BrowserWindow;
  if (window) {
    views.push(new View(window, tabIndex, tabId, url));
  }
});

// destroy a BrowserView
ipcMain.on('destroy-browser-view', (event, browserViewId) => {
  const browserView = views.find(view => (view.id === browserViewId));
  if (browserView) {
    browserView.destroy();
  }
});

// resize a BrowserView
ipcMain.on('resize-browser-view', (event, browserViewId) => {
  const browserView = views.find(view => (view.id === browserViewId));
  if (browserView) {
    browserView.fitWindow();
  }
});

// focus a BrowserView
ipcMain.on('focus-browser-view', (event, data) => {
  const { browserViewId }: { browserViewId: number } = data;

  const window = windows[data.windowId] as Electron.BrowserWindow;
  if (window) {
    window.setBrowserView(BrowserView.fromId(browserViewId));
  }
});

// show the certificate
ipcMain.on('show-certificate',
  (event: Electron.IpcMainEvent, certificate: Electron.Certificate, message: string) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    if (browserWindow) {
      dialog.showCertificateTrustDialog(browserWindow, {
        certificate,
        message,
      }).then();
    }
  });

// focus the window
ipcMain.on('focus-window', (event, windowId) => {
  const window = windows[windowId] as Electron.BrowserWindow;
  if (window) {
    window.focus();
  }
});

// set the title for the focused BrowserWindow
ipcMain.on('set-browser-window-title', (event, data) => {
  const window = windows[data.windowId] as Electron.BrowserWindow;
  if (window) {
    window.setTitle(data.title);
  }
});

// show the item on host
ipcMain.on('show-item-in-folder', (event, itemPath) => {
  if (itemPath) {
    shell.showItemInFolder(itemPath);
  }
});

// open the item on host
ipcMain.on('open-path', (event, itemPath) => {
  if (itemPath) {
    shell.openPath(itemPath);
  }
});

// load preference things into global when users accessing 'Monarc' protocol
ipcMain.on('Monarc-scheme-loaded', (event, val) => {
  let type: string = val.substr(`${constants.MonarcPagesCustomProtocol}://`.length).split('/')[0];
  const data: Monarc.Scheme.MonarcObject = {} as Monarc.Scheme.MonarcObject;

  if (process.env.NODE_ENV === 'development' && val.startsWith('http://localhost:')) {
    if (require('url').parse(val).pathname === '/about.html') {
      type = 'about';
    }
  }
  if (type === 'about') {
    const { versions } = process;

    data.Monarc = [
      {
        key: 'Monarc',
        value: app.getVersion(),
      },
      {
        key: 'rev',
        value: constants.MonarcRev,
      },
      {
        key: 'Electron',
        value: versions.electron,
      },
      {
        key: 'Node',
        value: versions.node,
      },
      {
        key: 'libchromiumcontent',
        value: versions.chrome,
      },
      {
        key: 'V8',
        value: versions.v8,
      },
      {
        key: 'os.platform',
        value: os.platform(),
      },
      {
        key: 'os.release',
        value: os.release(),
      },
      {
        key: 'os.arch',
        value: os.arch(),
      },
      {
        key: 'userData',
        value: app.getPath('userData'),
      },
    ];
    data.preferences = [
      ['Search Engine Provider', 'search'],
      ['Homepage', 'homepage'],
      ['PDFViewer', 'pdfViewer'],
      ['Tab', 'tab'],
      ['Language', 'language'],
      ['Proxy', 'proxy'],
      ['Auth', 'auth'],
    ];
    data.about = [
      [`${constants.MonarcPagesCustomProtocol}://about/#/about`, 'about'],
      [`${constants.MonarcPagesCustomProtocol}://about/#/Monarc`, 'Monarc'],
      [`${constants.MonarcPagesCustomProtocol}://about/#/preferences`, 'preferences'],
      [`${constants.MonarcPagesCustomProtocol}://about/#/downloads`, 'downloads'],
      [`${constants.MonarcPagesCustomProtocol}://about/#/history`, 'history'],
      [`${constants.MonarcPagesCustomProtocol}://about/#/extensions`, 'extensions'],
    ];
  }
  event.returnValue = data;
});

// about:* pages are eager to getting preference datas
ipcMain.on('guest-want-data', (event: Electron.IpcMainEvent, type: string) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    switch (type) {
      case 'searchEngineProvider':
        window.webContents.send('get-search-engine-provider', webContentsId);
        break;
      case 'homepage':
        window.webContents.send('get-homepage', webContentsId);
        break;
      case 'pdfViewer':
        window.webContents.send('get-pdf-viewer', webContentsId);
        break;
      case 'tabConfig':
        window.webContents.send('get-tab-config', webContentsId);
        break;
      case 'lang':
        window.webContents.send('get-lang', webContentsId);
        break;
      case 'proxyConfig':
        window.webContents.send('get-proxy-config', webContentsId);
        break;
      case 'auth':
        window.webContents.send('get-auth', webContentsId);
        break;
      case 'downloads':
        window.webContents.send('get-downloads', webContentsId);
        break;
      case 'history':
        window.webContents.send('get-history', webContentsId);
        break;
      case 'extensions':
        break;
      default:
        break;
    }
  });
});

ipcMain.on('set-current-search-engine-provider', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setCurrentSearchEngineProvider', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-search-engine-provider', event.sender.id);
  });
});
ipcMain.on('set-homepage', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setHomepage', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-homepage', event.sender.id);
  });
});
ipcMain.on('set-pdf-viewer', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setPDFViewer', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-pdf-viewer', event.sender.id);
  });
});
ipcMain.on('set-tab-config', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setTabConfig', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-tab-config', event.sender.id);
  });
});
ipcMain.on('set-lang', (eventOne: Electron.IpcMainEvent, val) => {
  const webContentsId: number = eventOne.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('request-permission', {
      webContentsId,
      permission: 'setLanguage',
      label: val.label,
    });
  });
  ipcMain.once(`response-permission-${eventOne.sender.id}`, (eventTwo, data) => {
    if (data.accept) {
      store.dispatch('setLang', val);
      promisify(writeFile, langPath, JSON.stringify(val.lang))
        .then(() => {
          setLanguage = true;
          menu.setLocale(val.lang);
          app.quit();
        });
    }
  });
});
ipcMain.on('set-proxy-config', (event: Electron.IpcMainEvent, val) => {
  session.registerProxy(val);
  store.dispatch('setProxyConfig', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-proxy-config', event.sender.id);
  });
});
ipcMain.on('set-auth', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setAuth', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-auth', event.sender.id);
  });
});
ipcMain.on('set-downloads', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setDownloads', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-downloads', event.sender.id);
  });
});
ipcMain.on('set-history', (event: Electron.IpcMainEvent, val) => {
  store.dispatch('setHistory', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-history', event.sender.id);
  });
});

// listen to new-Monarc-window event
ipcMain.on('new-Monarc-window', (event: Electron.IpcMainEvent, data) => {
  if (data.url) {
    event.returnValue = createWindow({
      width: 800,
      height: 500,
    }, (eventName) => {
      ipcMain.once(eventName, (event2: Electron.IpcMainEvent) => {
        event2.sender.send(eventName.substr(4), { url: data.url, follow: data.follow });
      });
    });
  }
});

// load the lang file
ipcMain.on('request-lang', (event: Electron.IpcMainEvent) => {
  let lang = '';
  try {
    lang = readFileSync(langPath, 'utf8');
  } catch (langError) {
    console.error(`(Monarc-browser) ${langError}`);
    lang = app.getLocaleCountryCode();
    if (lang === 'TW') {
      lang = '"zh-TW"';
    } else if (lang === 'CN') {
      lang = '"zh-CN"';
    } else {
      lang = '"en-US"';
    }
  }
  event.returnValue = JSON.parse(lang);
});

// load extension objects for each BrowserWindow instance
ipcMain.on('register-local-commands', (event: Electron.IpcMainEvent) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    if (window.getTitle() !== 'command-palette') {
      Object.keys(MonarcExtension.getManifestMap()).forEach((manifest) => {
        MonarcExtension.registerLocalCommands(window, MonarcExtension.getManifestMap()[manifest]);
      });
    }
  });
  event.sender.send('registered-local-commands', MonarcExtension.getManifestMap());
});

ipcMain.on('fetch-search-suggestions',
  (event: Electron.IpcMainEvent, url: string, timestamp: number) => {
    fetch(url, (result) => {
      event.sender.send(`fetch-search-suggestions-${timestamp}`, result);
    });
  });

ipcMain.on('popup', (event: Electron.IpcMainEvent, popupObject: any) => {
  const popupMenu = new Menu();
  popupObject.menuItems.forEach((popupMenuItem) => {
    if (popupMenuItem.icon) {
      if (popupMenuItem.type === 'base64') {
        popupMenuItem.icon = nativeImage.createFromDataURL(popupMenuItem.icon).resize({
          width: 14,
          height: 14,
        });
        delete popupMenuItem.type;
      }
    }
    if (popupMenuItem.click) {
      if (popupMenuItem.click === 'open-history') {
        popupMenuItem.click = () => (event.sender.send('open-history'));
      } else if (popupMenuItem.click === 'go-to-index') {
        const { index } = popupMenuItem;
        delete popupMenuItem.index;
        popupMenuItem.click = () => {
          event.sender.send('go-to-index', index);
        };
      }
    }
    popupMenu.append(new MenuItem(popupMenuItem));
  });
  popupMenu.popup({
    window: BrowserWindow.fromId(popupObject.windowId),
    x: popupObject.x,
    y: popupObject.y,
  });
});

// reload each BrowserView when we plug in our cable
globalObject.isOnline = true;
ipcMain.on('online-status-changed', (event, status: boolean) => {
  if (status) {
    if (!globalObject.isOnline) {
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('reload');
      });
      globalObject.isOnline = true;
    }
  } else {
    globalObject.isOnline = false;
  }
});
