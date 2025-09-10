/* eslint-disable no-console */

import { app, BrowserWindow, ipcMain, webContents, session } from "electron";
import { Buffer } from "buffer";
import * as fs from "fs";
import * as path from "path";
import { customAlphabet } from "nanoid";
import * as urllib from "url";
import * as mimeTypes from "mime-types";

// -------------------------
// Types
// -------------------------
interface ExtensionManifest {
  name: string;
  version: string;
  description?: string;
  default_locale?: string;
  background?: {
    page?: string;
    scripts?: string[];
  };
  content_scripts?: {
    matches: string[];
    js?: string[];
    css?: string[];
    run_at?: string;
    all_frames?: boolean;
  }[];
  options_page?: string;
  devtools_page?: string;
  srcDirectory?: string;
  extensionId?: string;
  messages?: Record<string, { message: string }>;
  startPage?: string;
}

interface ContentScript {
  all_frames?: boolean;
  matches: string[];
  js?: Array<{ url: string; code: string }>;
  css?: Array<{ url: string; code: string }>;
  run_at?: string;
}

interface BackgroundPage {
  html: Buffer;
  name: string;
  webContentsId: number;
}

// -------------------------
// Internal State
// -------------------------
const manifestMap: Record<string, ExtensionManifest> = {};
const manifestNameMap: Record<string, ExtensionManifest> = {};
const backgroundPages: Record<string, BackgroundPage> = {};
let renderProcessPreferences: ExtensionManifest[] = [];

const generateExtensionId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 32);
const EXT_PROTOCOL = "monarc-extension";
const EXT_STORE_FILE = path.join(app.getPath("userData"), "monarc-extensions.json");

// -------------------------
// Utility Functions
// -------------------------
function isValidManifest(manifest: any): manifest is ExtensionManifest {
  return (
    typeof manifest === 'object' &&
    typeof manifest.name === 'string' &&
    typeof manifest.version === 'string' &&
    manifest.name.length > 0 &&
    manifest.version.length > 0
  );
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// -------------------------
// Manifest Loading
// -------------------------
function getManifestFromPath(srcDirectory: string): ExtensionManifest | null {
  if (!srcDirectory || !fs.existsSync(srcDirectory)) {
    console.error(`[Monarc] Extension directory does not exist: ${srcDirectory}`);
    return null;
  }

  const manifestPath = path.join(srcDirectory, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`[Monarc] manifest.json not found in: ${srcDirectory}`);
    return null;
  }

  let manifest: any;

  try {
    const manifestContent = fs.readFileSync(manifestPath, "utf8");
    manifest = JSON.parse(manifestContent);
  } catch (err) {
    console.error(`[Monarc] Failed to parse manifest at ${srcDirectory}:`, err);
    return null;
  }

  if (!isValidManifest(manifest)) {
    console.error(`[Monarc] Invalid manifest format in ${srcDirectory}`);
    return null;
  }

  if (manifestNameMap[manifest.name]) {
    console.warn(`[Monarc] Extension "${manifest.name}" already loaded.`);
    return null;
  }

  const extensionId = generateExtensionId();
  manifest.extensionId = extensionId;
  manifest.srcDirectory = srcDirectory;

  manifest.messages = {
    "@@extension_id": { message: extensionId },
    "@@ui_locale": { message: manifest.default_locale || "en" },
  };

  if (manifest.devtools_page) {
    manifest.startPage = urllib.format({
      protocol: EXT_PROTOCOL,
      slashes: true,
      hostname: extensionId,
      pathname: manifest.devtools_page,
    });
  }

  manifestMap[extensionId] = manifest;
  manifestNameMap[manifest.name] = manifest;
  return manifest;
}

// -------------------------
// Background Pages
// -------------------------
function startBackgroundPage(manifest: ExtensionManifest): void {
  if (!manifest.background || !manifest.extensionId || backgroundPages[manifest.extensionId]) {
    return;
  }

  let html: Buffer;
  let name: string;

  try {
    if (manifest.background.page) {
      name = manifest.background.page;
      const pagePath = path.join(manifest.srcDirectory!, name);
      if (!fs.existsSync(pagePath)) {
        console.error(`[Monarc] Background page not found: ${pagePath}`);
        return;
      }
      html = fs.readFileSync(pagePath);
    } else if (manifest.background.scripts && manifest.background.scripts.length > 0) {
      name = "_generated_background_page.html";
      const scripts = manifest.background.scripts
        .map((s) => `<script src="${s}"></script>`)
        .join("");
      html = Buffer.from(`<html><body>${scripts}</body></html>`, "utf8");
    } else {
      console.warn(`[Monarc] No background page or scripts defined for ${manifest.name}`);
      return;
    }

    const contents = (webContents as any).create({
      isBackgroundPage: true,
      partition: "persist:monarc_extension",
      preload: path.join(__dirname, "extension-preload.js"),
      webSecurity: false,
    });

    backgroundPages[manifest.extensionId] = {
      html,
      name,
      webContentsId: contents.id,
    };

    const url = urllib.format({
      protocol: EXT_PROTOCOL,
      slashes: true,
      hostname: manifest.extensionId,
      pathname: name,
    });

    contents.loadURL(url);
  } catch (err) {
    console.error(`[Monarc] Failed to start background page for ${manifest.name}:`, err);
  }
}

// -------------------------
// Content Scripts
// -------------------------
function injectContentScripts(manifest: ExtensionManifest): void {
  if (!manifest.content_scripts || !manifest.srcDirectory) return;

  const readFile = (relativePath: string): { url: string; code: string } | null => {
    try {
      const filePath = path.join(manifest.srcDirectory!, relativePath);
      if (!fs.existsSync(filePath)) {
        console.warn(`[Monarc] Content script file not found: ${filePath}`);
        return null;
      }

      return {
        url: urllib.format({
          protocol: EXT_PROTOCOL,
          slashes: true,
          hostname: manifest.extensionId!,
          pathname: relativePath,
        }),
        code: fs.readFileSync(filePath, 'utf8'),
      };
    } catch (err) {
      console.error(`[Monarc] Failed to read content script ${relativePath}:`, err);
      return null;
    }
  };

  manifest.content_scripts = manifest.content_scripts.map((script): ContentScript => ({
    all_frames: script.all_frames,
    matches: script.matches,
    js: script.js ? script.js.map(readFile).filter(Boolean) as Array<{ url: string; code: string }> : [],
    css: script.css ? script.css.map(readFile).filter(Boolean) as Array<{ url: string; code: string }> : [],
    run_at: script.run_at || "document_idle",
  }));
}

// -------------------------
// Protocol Handler
// -------------------------
function monarcExtensionHandler(request: any, callback: (response?: any) => void): void {
  try {
    const parsed = urllib.parse(decodeURIComponent(request.url));
    if (!parsed.hostname || !parsed.pathname) {
      return callback({ statusCode: 400 });
    }

    const manifest = manifestMap[parsed.hostname];
    if (!manifest || !manifest.srcDirectory) {
      return callback({ statusCode: 404 });
    }

    const bgPage = backgroundPages[parsed.hostname];
    if (bgPage && parsed.pathname === `/${bgPage.name}`) {
      return callback({ 
        mimeType: "text/html", 
        data: bgPage.html 
      });
    }

    const filePath = path.join(manifest.srcDirectory, parsed.pathname);
    
    // Security check: ensure the file is within the extension directory
    if (!filePath.startsWith(manifest.srcDirectory)) {
      console.warn(`[Monarc] Attempted directory traversal: ${filePath}`);
      return callback({ statusCode: 403 });
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.warn(`[Monarc] File not found: ${filePath}`);
        return callback({ statusCode: 404 });
      }
      
      const mimeType = mimeTypes.lookup(path.basename(filePath)) || 'application/octet-stream';
      callback({ 
        data, 
        mimeType 
      });
    });
  } catch (err) {
    console.error(`[Monarc] Protocol handler error:`, err);
    callback({ statusCode: 500 });
  }
}

// -------------------------
// Storage Management
// -------------------------
function saveExtensionStore(): void {
  try {
    const loadedDirs = Object.values(manifestMap)
      .map((m) => m.srcDirectory)
      .filter(Boolean);
    
    if (loadedDirs.length > 0) {
      ensureDirectoryExists(EXT_STORE_FILE);
      fs.writeFileSync(EXT_STORE_FILE, JSON.stringify(loadedDirs, null, 2));
    } else if (fs.existsSync(EXT_STORE_FILE)) {
      fs.unlinkSync(EXT_STORE_FILE);
    }
  } catch (err) {
    console.error("[Monarc] Failed to save extension store:", err);
  }
}

function loadExtensionStore(): void {
  try {
    if (!fs.existsSync(EXT_STORE_FILE)) return;
    
    const loaded = JSON.parse(fs.readFileSync(EXT_STORE_FILE, "utf8"));
    if (Array.isArray(loaded)) {
      for (const dir of loaded) {
        if (typeof dir === 'string') {
          MonarcExtensions.addExtension(dir);
        }
      }
    }
  } catch (err) {
    console.warn("[Monarc] Failed to load extension store:", err);
  }
}

// -------------------------
// Public API
// -------------------------
export const MonarcExtensions = {
  addExtension(srcDirectory: string): string {
    try {
      const manifest = getManifestFromPath(srcDirectory);
      if (!manifest) return "";

      startBackgroundPage(manifest);
      injectContentScripts(manifest);

      renderProcessPreferences.push(manifest);
      saveExtensionStore();
      
      console.log(`[Monarc] Extension "${manifest.name}" loaded successfully`);
      return manifest.name;
    } catch (err) {
      console.error(`[Monarc] Failed to add extension from ${srcDirectory}:`, err);
      return "";
    }
  },

  removeExtension(extensionId: string): string {
    try {
      const manifest = manifestMap[extensionId];
      if (!manifest) {
        console.warn(`[Monarc] Extension with ID ${extensionId} not found`);
        return "";
      }

      // Remove background page
      const page = backgroundPages[extensionId];
      if (page) {
        const wc = webContents.fromId(page.webContentsId);
        if (wc && !wc.isDestroyed()) {
          wc.destroy();
        }
        delete backgroundPages[extensionId];
      }

      renderProcessPreferences = renderProcessPreferences.filter(
        (m) => m.extensionId !== extensionId
      );
      
      const extensionName = manifest.name;
      delete manifestMap[extensionId];
      delete manifestNameMap[extensionName];

      saveExtensionStore();
      
      console.log(`[Monarc] Extension "${extensionName}" removed successfully`);
      return extensionName;
    } catch (err) {
      console.error(`[Monarc] Failed to remove extension ${extensionId}:`, err);
      return "";
    }
  },

  removeExtensionByName(extensionName: string): string {
    const manifest = manifestNameMap[extensionName];
    if (!manifest || !manifest.extensionId) {
      console.warn(`[Monarc] Extension "${extensionName}" not found`);
      return "";
    }
    return this.removeExtension(manifest.extensionId);
  },

  getExtensions() {
    return Object.values(manifestNameMap).map((m) => ({
      id: m.extensionId!,
      name: m.name,
      version: m.version,
      description: m.description,
    }));
  },

  getExtensionById(extensionId: string): ExtensionManifest | null {
    return manifestMap[extensionId] || null;
  },

  getExtensionByName(extensionName: string): ExtensionManifest | null {
    return manifestNameMap[extensionName] || null;
  },

  isExtensionLoaded(extensionName: string): boolean {
    return !!manifestNameMap[extensionName];
  },

  getRenderProcessPreferences(): ExtensionManifest[] {
    return [...renderProcessPreferences];
  }
};

// -------------------------
// App Hooks
// -------------------------
app.whenReady().then(async () => {
  try {
    await session.defaultSession.protocol.registerBufferProtocol(
      EXT_PROTOCOL,
      monarcExtensionHandler
    );
    console.log("[Monarc] Extension protocol registered successfully");
  } catch (error) {
    console.error("[Monarc] Failed to register extension protocol:", error);
  }

  // Restore previously loaded extensions
  loadExtensionStore();
});

app.on("will-quit", () => {
  // Clean up background pages
  Object.keys(backgroundPages).forEach(extensionId => {
    const page = backgroundPages[extensionId];
    const wc = webContents.fromId(page.webContentsId);
    if (wc && !wc.isDestroyed()) {
      wc.destroy();
    }
  });
  
  saveExtensionStore();
});

// Handle app crashes gracefully
process.on('uncaughtException', (err) => {
  console.error('[Monarc] Uncaught exception:', err);
  saveExtensionStore();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Monarc] Unhandled rejection at:', promise, 'reason:', reason);
});