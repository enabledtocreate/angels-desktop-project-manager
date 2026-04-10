const electronMain = require('electron');
if (!electronMain || typeof electronMain === 'string' || !electronMain.app) {
  throw new Error('Electron main-process APIs are unavailable. Start the desktop app without ELECTRON_RUN_AS_NODE=1.');
}
const { app, BrowserWindow, globalShortcut, ipcMain } = electronMain;
const path = require('path');
const fs = require('fs');
const appState = require('./src/app-state');
const logger = require('./src/logger');

const PORT = 3847;
const APP_DIR = __dirname;
const DEFAULT_THEME_BG = '#0c1222';
const DEBUG_STARTUP = process.env.APM_DEBUG_STARTUP === '1';

let serverHandle = null;

function initializeRuntimePaths() {
  if (!process.env.APM_STATE_DIR) {
    process.env.APM_STATE_DIR = app.getPath('userData');
  }
  if (!process.env.APM_DEFAULT_PROJECTS_ROOT) {
    const portableRoot = process.env.PORTABLE_EXECUTABLE_DIR;
    process.env.APM_DEFAULT_PROJECTS_ROOT = portableRoot
      ? path.resolve(portableRoot)
      : app.isPackaged
        ? path.dirname(app.getPath('exe'))
        : APP_DIR;
  }
}

initializeRuntimePaths();

function getDataDir() {
  return appState.getDataDir();
}

function getLogFile() {
  return logger.getCurrentLogFile(appState.getLogsDir());
}

function ensureDataDir() {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function logToFile(message, err) {
  try {
    ensureDataDir();
    logger.writeLog(appState.getLogsDir(), {
      level: err ? 'ERROR' : 'INFO',
      source: 'electron',
      eventType: err ? 'electron.error' : 'electron.event',
      message,
      error: err ? (err.stack || err.message || String(err)) : '',
    });
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

function debugLog(message, err) {
  if (DEBUG_STARTUP) {
    logToFile(message, err);
  }
}

process.on('uncaughtException', (err) => {
  logToFile('uncaughtException', err);
  console.error('uncaughtException:', err);
});

process.on('unhandledRejection', (reason) => {
  logToFile('unhandledRejection', String(reason));
  console.error('unhandledRejection:', reason);
});

function configureRuntimePaths() {
  initializeRuntimePaths();
  debugLog(
    `configureRuntimePaths stateDir=${process.env.APM_STATE_DIR} projectRoot=${appState.getProjectRoot()} dataDir=${appState.getDataDir()} dbPath=${appState.getDbPath()}`
  );
}

async function startBackend() {
  configureRuntimePaths();
  debugLog('startBackend begin');
  const { startServer } = require('./server');
  serverHandle = await startServer(PORT);
  debugLog('startBackend success');
}

async function stopBackend() {
  if (!serverHandle || !serverHandle.server) return;
  await new Promise((resolve, reject) => {
    serverHandle.server.close((err) => (err ? reject(err) : resolve()));
  });
  serverHandle = null;
}

function createWindow() {
  const iconPath = path.join(APP_DIR, 'public', 'icon.png');
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 640,
    minHeight: 480,
    title: "Angel's Project Manager",
    backgroundColor: DEFAULT_THEME_BG,
    frame: false,
    ...(fs.existsSync(iconPath) && { icon: iconPath }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(APP_DIR, 'preload.js'),
    },
    show: false,
  });

  debugLog(`createWindow loadURL http://localhost:${PORT}`);
  win.loadURL(`http://localhost:${PORT}`);
  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logToFile(`did-fail-load code=${errorCode} description=${errorDescription}`);
  });
  win.webContents.on('render-process-gone', (event, details) => {
    logToFile(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });

  const openDevTools = () => {
    try {
      win.webContents.openDevTools();
    } catch (err) {
      logToFile('openDevTools failed', err);
    }
  };

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      event.preventDefault();
      openDevTools();
    }
  });

  win.on('closed', () => {
    debugLog('window closed');
    app.quit();
  });
}

app.on('will-finish-launching', () => {
  debugLog('app will-finish-launching');
});

app.on('ready', () => {
  debugLog('app ready');
});

app.on('quit', () => {
  debugLog('app quit');
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  logToFile('single-instance-lock denied; quitting early');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length) {
    const window = windows[0];
    if (window.isMinimized()) window.restore();
    window.focus();
  }
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.quit();
});

ipcMain.handle('set-theme', (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && payload && payload.backgroundColor) {
    win.setBackgroundColor(payload.backgroundColor);
  }
});

ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    return win.isMaximized();
  }
  return false;
});

ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('window-is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isMaximized() : false;
});

app.whenReady().then(async () => {
  debugLog('app.whenReady');
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win.webContents) {
      try {
        win.webContents.openDevTools();
      } catch (err) {
        logToFile('F12 openDevTools failed', err);
      }
    }
  });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win.webContents) {
      try {
        win.webContents.openDevTools();
      } catch (err) {
        logToFile('Ctrl+Shift+I openDevTools failed', err);
      }
    }
  });

  try {
    await startBackend();
    createWindow();
  } catch (err) {
    logToFile('Backend startup failed', err);
    console.error('Backend startup failed:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('before-quit', async (event) => {
  if (!serverHandle) return;
  event.preventDefault();
  try {
    await stopBackend();
  } catch (err) {
    logToFile('Failed to stop backend cleanly', err);
  } finally {
    serverHandle = null;
    app.exit();
  }
});
