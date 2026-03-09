const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const kill = require('kill-port');

const PORT = 3847;
const APP_DIR = __dirname;
const DATA_DIR = path.join(APP_DIR, 'data');
const LOG_FILE = path.join(DATA_DIR, 'app.log');
let serverProcess = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function logToFile(msg, err) {
  try {
    ensureDataDir();
    const ts = new Date().toISOString();
    const line = err ? `[Electron] ${ts} ${msg} ${err.stack || err.message || String(err)}\n` : `[Electron] ${ts} ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

process.on('uncaughtException', (err) => {
  logToFile('uncaughtException', err);
  console.error('uncaughtException:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logToFile('unhandledRejection', String(reason));
  console.error('unhandledRejection:', reason);
});

function killPortThenStart() {
  return kill(PORT, 'tcp').catch(() => {}).then(() => {
    serverProcess = spawn('node', [path.join(APP_DIR, 'server.js')], {
      cwd: APP_DIR,
      stdio: 'pipe',
      env: process.env,
    });
    serverProcess.stderr.on('data', (d) => {
      const text = d.toString();
      process.stderr.write(text);
      logToFile('Server stderr', new Error(text));
    });
    serverProcess.on('error', (err) => {
      logToFile('Server process error', err);
      console.error('Server error:', err);
    });
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        logToFile('Server exited with code ' + code);
        console.error('Server exited:', code);
      }
    });
  });
}

const DEFAULT_THEME_BG = '#0c1222';

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 640,
    minHeight: 480,
    title: "Angel's Project Manager",
    backgroundColor: DEFAULT_THEME_BG,
    frame: false,
    ...(fs.existsSync(path.join(APP_DIR, 'public', 'icon.png')) && { icon: path.join(APP_DIR, 'public', 'icon.png') }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(APP_DIR, 'preload.js'),
    },
    show: false,
  });

  win.loadURL(`http://localhost:${PORT}`);
  win.once('ready-to-show', () => win.show());

  // F12 and Ctrl+Shift+I open DevTools
  const openDevTools = () => {
    try {
      win.webContents.openDevTools();
    } catch (e) {
      logToFile('openDevTools failed', e);
    }
  };
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      event.preventDefault();
      openDevTools();
    }
  });

  win.on('closed', () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    app.quit();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length) {
    const w = wins[0];
    if (w.isMinimized()) w.restore();
    w.focus();
  }
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.quit();
});

// Sets the window content-area background (loading/gaps).
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

app.whenReady().then(() => {
  // Register F12 to open DevTools for the focused window
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win.webContents) {
      try {
        win.webContents.openDevTools();
      } catch (e) {
        logToFile('F12 openDevTools failed', e);
      }
    }
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win.webContents) {
      try {
        win.webContents.openDevTools();
      } catch (e) {
        logToFile('Ctrl+Shift+I openDevTools failed', e);
      }
    }
  });

  killPortThenStart().then(() => {
    // Give the server time to start listening before loading the window
    setTimeout(createWindow, 1200);
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
