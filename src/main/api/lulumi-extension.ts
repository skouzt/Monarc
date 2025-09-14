/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */

import { app, BrowserWindow, ipcMain, webContents } from 'electron';
import { Buffer } from 'buffer';
import { Store } from 'vuex';
import localshortcut from 'electron-localshortcut';
import * as fs from 'fs';
import * as path from 'path';
import { customAlphabet } from 'nanoid';
import * as urllib from 'url';
import * as mimeTypes from 'mime-types';

import config from '../constants';
import './listeners';

// ../../shared/store/mainStore.ts
const { default: mainStore } = require('../../shared/store/mainStore');
const store: Store<any> = mainStore.getStore();

const objectValues = object => Object.keys(object).map(key => object[key]);

// extensionId => manifest
const manifestMap: Monarc.API.ManifestMap = {};
// name => manifest
const manifestNameMap: Monarc.API.ManifestNameMap = {};
// manage the background pages
const backgroundPages: Monarc.API.BackgroundPages = {};
let renderProcessPreferences: Monarc.API.ManifestObject[] = [];

const generateExtensionIdFromName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 32);

// Create or get manifest object from |srcDirectory|.
const getManifestFromPath: (srcDirectory: string) => Monarc.API.ManifestObject | null =
  (srcDirectory: string): Monarc.API.ManifestObject | null => {
    let manifest: Monarc.API.ManifestObject;
    let manifestContent: string;

    try {
      manifestContent = fs.readFileSync(path.join(srcDirectory, 'manifest.json'), 'utf8');
    } catch (readError) {
      console.warn(`Reading ${path.join(srcDirectory, 'manifest.json')} failed.`);
      console.warn(readError.stack || readError);
      throw readError;
    }

    try {
      manifest = JSON.parse(manifestContent);
    } catch (parseError) {
      console.warn(`Parsing ${path.join(srcDirectory, 'manifest.json')} failed.`);
      console.warn(parseError.stack || parseError);
      throw parseError;
    }

    if (!manifestNameMap[manifest.name]) {
      const extensionId = generateExtensionIdFromName();
      manifestNameMap[manifest.name] = manifest;
      manifestMap[extensionId] = manifestNameMap[manifest.name];

      let messages = {};
      let lang = '';
      try {
        lang = fs.readFileSync(path.join(app.getPath('userData'), 'Monarc-lang'), 'utf8');
      } catch (langError) {
        lang = `"${manifest.default_locale}"`;
        console.error(`(Monarc-browser) ${langError}`);
      }
      if (lang) {
        lang = JSON.parse(lang);
        try {
          messages = JSON.parse(fs.readFileSync(
            path.join(srcDirectory, '_locales', lang.replace('-', '_'), 'messages.json'), 'utf8'
          ));
        } catch (readError) {
          console.warn(`${manifest.name}: Reading messages.json failed.`);
          console.warn(readError.stack || readError);
        }
      }
      messages = Object.assign({
        '@@extension_id': { message: extensionId },
        '@@ui_locale': { message: lang || 'en' },
      }, messages);

      Object.assign(manifest, {
        srcDirectory,
        extensionId,
        messages,
        startPage: urllib.format({
          protocol: 'Monarc-extension',
          slashes: true,
          hostname: extensionId,
          pathname: manifest.devtools_page,
        }),
      });
      return manifest;
    }

    if (manifest && manifest.name) {
      console.warn(`Attempted to load extension "${manifest.name}" that has already been loaded.`);
      return null;
    }
    console.warn('Unable to parse this extension!');
    return null;
  };

const startBackgroundPages = (manifest: Monarc.API.ManifestObject) => {
  if (backgroundPages[manifest.extensionId] || !manifest.background) {
    return;
  }

  let html: Buffer = Buffer.from('');
  let name: string;
  if (manifest.background.page) {
    name = manifest.background.page;
    html = fs.readFileSync(path.join(manifest.srcDirectory, manifest.background.page));
  } else {
    name = '_generated_background_page.html';
    if (manifest.background.scripts) {
      const scripts = manifest.background.scripts.map(script => `<script src="${script}"></script>`).join('');
      html = Buffer.from(`<html><body>${scripts}</body></html>`, 'utf8');
    }
  }

  const contents = (webContents as any).create({
    commandLineSwitches: ['--background-page'],
    isBackgroundPage: true,
    partition: 'persist:__Monarc_extension',
    preload: path.join(config.MonarcPreloadPath, 'extension-preload.js'),
    webSecurity: false,
  });
  backgroundPages[manifest.extensionId] = { html, name, webContentsId: contents.id };
  contents.loadURL(urllib.format({
    protocol: 'Monarc-extension',
    slashes: true,
    hostname: manifest.extensionId,
    pathname: name,
  }));
};

const removeBackgroundPages = (manifest) => {
  const extension = backgroundPages[manifest.extensionId];
  if (extension) {
    const toBeRemovedwebContents =
      (webContents.fromId(extension.webContentsId) as Electron.WebContents);

    ipcMain.once(`Monarc-extension-${manifest.extensionId}-clean-done`, () => {
      (toBeRemovedwebContents as any).destroy();
      delete backgroundPages[manifest.extensionId];
    });
    // notify the extension that itself is going to be removed
    toBeRemovedwebContents.send(`Monarc-extension-${manifest.extensionId}-going-removed`);
  } else {
    // because the extension doesn't have any background page, we should just send an IPC message
    const browserWindow = BrowserWindow.getFocusedWindow();
    if (browserWindow !== null) {
      browserWindow.webContents.send('remove-non-bg-Monarc-extension', manifest.extensionId);
    }
  }
};

const registerLocalCommands = (window: Electron.BrowserWindow, manifest: any): void => {
  const { commands } = manifest;
  if (commands) {
    Object.keys(commands).forEach((command) => {
      const { suggested_key: suggestedKey } = commands[command];
      if (suggestedKey) {
        localshortcut.register(window, suggestedKey.default, () => {
          if (commands[command].suggested_key) {
            const browserWindow = BrowserWindow.getFocusedWindow();
            if (command === '_execute_page_action') {
              if (browserWindow !== null) {
                browserWindow.webContents.send('Monarc-commands-execute-page-action', manifest.extensionId);
              }
            } else if (command === '_execute_browser_action') {
              if (browserWindow !== null) {
                browserWindow.webContents.send('Monarc-commands-execute-browser-action', manifest.extensionId);
              }
            } else {
              const extension = backgroundPages[manifest.extensionId];
              if (extension) {
                const wc = webContents.fromId(extension.webContentsId);
                if (wc) {
                  wc.send('Monarc-commands-triggered', command);
                }
              }
            }
          }
        });
        ipcMain.once(`Monarc-extension-${manifest.extensionId}-local-shortcut-unregister`, () => {
          localshortcut.unregister(window, suggestedKey.default);
        });
      }
    });
  }
};

const injectContentScripts = (manifest: Monarc.API.ManifestObject) => {
  if (manifest.content_scripts) {
    const readArrayOfFiles = relativePath => ({
      url: urllib.format({
        protocol: 'Monarc-extension',
        slashes: true,
        hostname: manifest.extensionId,
        pathname: relativePath,
      }),
      code: String(fs.readFileSync(path.join(manifest.srcDirectory, relativePath))),
    });
    const contentScriptToEntry = script => ({
      all_frames: script.all_frames,
      matches: script.matches,
      js: script.js ? script.js.map(readArrayOfFiles) : [],
      css: script.css ? script.css.map(readArrayOfFiles) : [],
      runAt: script.run_at || 'document_idle',
    });

    try {
      manifest.content_scripts = manifest.content_scripts.map(contentScriptToEntry);
    } catch (readError) {
      console.error('Failed to read content scripts', readError);
    }
  }
};

const removeRenderProcessPreferences = (manifest) => {
  renderProcessPreferences = renderProcessPreferences.filter(el => el.extensionId !== manifest.extensionId);
};

const manifestToExtensionInfo = (manifest: Monarc.API.ManifestObject): chrome.management.ExtensionInfo => ({
  description: manifest.description || '',
  enabled: false,
  hostPermissions: [],
  id: manifest.extensionId,
  installType: 'development',
  isApp: false,
  mayDisable: false,
  name: manifest.name,
  offlineEnabled: false,
  optionsUrl: manifest.options_page || '',
  permissions: [],
  shortName: '',
  type: 'extension',
  version: manifest.version,
});

// load the extensions for the window
const loadExtension = (manifest: Monarc.API.ManifestObject) => {
  startBackgroundPages(manifest);
  injectContentScripts(manifest);

  const extensionInfo = manifestToExtensionInfo(manifest);
  store.dispatch('addExtension', {
    extensionInfo,
  });

  renderProcessPreferences.push(manifest);
  store.dispatch('updateExtension', {
    enabled: true,
    extensionid: extensionInfo.id,
  });

  return true;
};

// the Monarc-extension can map a extension URL request to real file path
const MonarcExtensionHandler = (request, callback) => {
  const parsed = urllib.parse(decodeURIComponent(request.url));
  if (!parsed.hostname || !parsed.pathname) {
    return callback();
  }

  const manifest = manifestMap[parsed.hostname];
  if (!manifest) {
    return callback();
  }

  const page = backgroundPages[parsed.hostname];
  if (page && parsed.pathname === `/${page.name}`) {
    return callback({
      mimeType: 'text/html',
      data: page.html,
    });
  }

  fs.readFile(path.join(manifest.srcDirectory, parsed.pathname), (err, data) => {
    if (err) {
      return callback(-6); // FILE_NOT_FOUND
    }
    return callback({
      data,
      mimeType: mimeTypes.lookup(path.basename(parsed.pathname!)),
    });
  });

  return true;
};

app.on(('session-created' as any), (sess: Electron.Session) => {
  sess.protocol.registerBufferProtocol('Monarc-extension', MonarcExtensionHandler, (error) => {
    if (error) {
      console.error(`Unable to register Monarc-extension protocol: ${error}`);
    }
  });
});

// the persistent path of "Monarc Extensions" preference file
const loadedExtensionsPath: string = path.join(app.getPath('userData'), 'Monarc-extensions');

app.on('will-quit', () => {
  try {
    const loadedExtensions = objectValues(manifestMap).map(manifest => manifest.srcDirectory);
    if (loadedExtensions.length > 0) {
      try {
        fs.mkdirSync(path.dirname(loadedExtensionsPath));
      } catch (error) {
        // Ignore error
      }
      fs.writeFileSync(loadedExtensionsPath, JSON.stringify(loadedExtensions));
    } else {
      fs.unlinkSync(loadedExtensionsPath);
    }
  } catch (error) {
    // Ignore error
  }
});

app.whenReady().then(() => {
  // the public API to add/remove extensions
  ((BrowserWindow as any) as Monarc.BrowserWindow).addMonarcExtension = (srcDirectory: string): string => {
    const manifest = getManifestFromPath(srcDirectory);
    if (manifest !== null) {
      loadExtension(manifest);
      return manifest.name;
    }

    return '';
  };

  ((BrowserWindow as any) as Monarc.BrowserWindow).removeMonarcExtension = (extensionId: string): string => {
    const manifest = manifestMap[extensionId];
    if (manifest) {
      removeBackgroundPages(manifest);
      removeRenderProcessPreferences(manifest);
      delete manifestMap[manifest.extensionId];
      delete manifestNameMap[manifest.name];
      store.dispatch('removeExtension', {
        extensionId,
      });
      return manifest.name;
    }
    return '';
  };

  ((BrowserWindow as any) as Monarc.BrowserWindow).getMonarcExtensions = (): any => {
    const extensions = {};
    Object.keys(manifestNameMap).forEach((name) => {
      const manifest = manifestNameMap[name];
      if (manifest) {
        extensions[name] = { name: manifest.name, version: manifest.version };
      }
    });
    return extensions;
  };
});

// we can not use protocol or BrowserWindow until app is ready,
// and hopefully, this function will be called after app is ready
const loadExtensions: () => void = () => {
  try {
    const loadedExtensions = JSON.parse(fs.readFileSync(loadedExtensionsPath, 'utf8'));
    if (Array.isArray(loadedExtensions)) {
      for (const srcDirectory of loadedExtensions) {
        // start background pages and set content scripts
        const manifest = getManifestFromPath(srcDirectory);
        if (manifest !== null) {
          loadExtension(manifest);
        }
      }
    }
  } catch (error) {
    // ignore error
  }
};

function getManifestMap(): any {
  return manifestMap;
}

// get manifestMap
ipcMain.on('get-manifest-map', (event) => {
  event.returnValue = manifestMap;
});

// get manifestNameMap
ipcMain.on('get-manifest-name-map', (event) => {
  event.returnValue = manifestNameMap;
});

// get backgroundPages
ipcMain.on('get-background-pages', (event) => {
  event.returnValue = backgroundPages;
});

// get renderProcessPreferences
ipcMain.on('get-render-process-preferences', (event) => {
  event.returnValue = renderProcessPreferences;
});

export default {
  getManifestMap,
  registerLocalCommands,
  loadExtensions,
};
