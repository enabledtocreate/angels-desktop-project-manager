const fs = require('fs');
const path = require('path');

const APP_DIR = path.resolve(__dirname, '..');

function getStateDir() {
  return path.resolve(process.env.APM_STATE_DIR || path.join(APP_DIR, '.app-state'));
}

function getSettingsFile() {
  return path.join(getStateDir(), 'settings.json');
}

function ensureStateDir() {
  const stateDir = getStateDir();
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
}

function readSettings() {
  ensureStateDir();
  const settingsFile = getSettingsFile();
  if (!fs.existsSync(settingsFile)) return {};
  try {
    const raw = fs.readFileSync(settingsFile, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSettings(nextSettings) {
  ensureStateDir();
  fs.writeFileSync(getSettingsFile(), JSON.stringify(nextSettings, null, 2));
}

function getDefaultProjectRoot() {
  return path.resolve(process.env.APM_DEFAULT_PROJECTS_ROOT || APP_DIR);
}

function getProjectRoot() {
  if (process.env.APM_PROJECTS_ROOT) return path.resolve(process.env.APM_PROJECTS_ROOT);
  const settings = readSettings();
  if (settings.projectRoot) return path.resolve(settings.projectRoot);
  return getDefaultProjectRoot();
}

function getDataDir(projectRoot = getProjectRoot()) {
  if (process.env.APM_DATA_DIR) return path.resolve(process.env.APM_DATA_DIR);
  const settings = readSettings();
  if (settings.dataDir) return path.resolve(settings.dataDir);
  return path.resolve(projectRoot, 'data');
}

function getDefaultLogsDir(dataDir = getDataDir()) {
  return path.resolve(dataDir, 'logs');
}

function getLogsDir(dataDir = getDataDir()) {
  if (process.env.APM_LOGS_DIR) return path.resolve(process.env.APM_LOGS_DIR);
  const settings = readSettings();
  if (settings.logsDir) return path.resolve(settings.logsDir);
  return getDefaultLogsDir(dataDir);
}

function getDbPath(dataDir = getDataDir()) {
  if (process.env.APM_DB_PATH) return path.resolve(process.env.APM_DB_PATH);
  return path.resolve(dataDir, 'app.db');
}

function isDirectoryEmpty(dirPath) {
  if (!fs.existsSync(dirPath)) return true;
  return fs.readdirSync(dirPath).length === 0;
}

function moveDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return false;

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });

  try {
    fs.renameSync(sourceDir, targetDir);
    return true;
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    fs.cpSync(sourceDir, targetDir, { recursive: true, force: false });
    fs.rmSync(sourceDir, { recursive: true, force: true });
    return true;
  }
}

function assertMutableRuntimePaths() {
  const blocked = ['APM_PROJECTS_ROOT', 'APM_DATA_DIR', 'APM_DB_PATH', 'APM_LOGS_DIR'].filter((name) => process.env[name]);
  if (blocked.length !== 0) {
    throw new Error(`Cannot change Project Root while runtime path overrides are set: ${blocked.join(', ')}`);
  }
}

function setProjectRoot(nextRoot) {
  assertMutableRuntimePaths();

  const resolvedRoot = path.resolve(String(nextRoot || '').trim());
  if (!resolvedRoot) throw new Error('Project Root is required');

  if (fs.existsSync(resolvedRoot) && !fs.statSync(resolvedRoot).isDirectory()) {
    throw new Error('Project Root must be a directory');
  }

  fs.mkdirSync(resolvedRoot, { recursive: true });

  const previousRoot = getProjectRoot();
  const previousDataDir = getDataDir(previousRoot);
  const nextDataDir = getDataDir(resolvedRoot);
  const source = path.resolve(previousDataDir);
  const target = path.resolve(nextDataDir);
  let movedDataDir = false;

  if (source !== target && fs.existsSync(source)) {
    if (fs.existsSync(target)) {
      if (!fs.statSync(target).isDirectory()) throw new Error('Target data path is not a directory');
      if (!isDirectoryEmpty(target)) {
        throw new Error('Target Project Root already contains a non-empty data folder');
      }
      fs.rmSync(target, { recursive: true, force: true });
    }
    movedDataDir = moveDirectory(source, target);
  } else if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const currentSettings = readSettings();
  writeSettings({ ...currentSettings, projectRoot: resolvedRoot, dataDir: target });

  return {
    previousRoot,
    projectRoot: resolvedRoot,
    previousDataDir: source,
    dataDir: target,
    movedDataDir,
  };
}

function setDataDir(nextDataDir) {
  assertMutableRuntimePaths();

  const resolvedDataDir = path.resolve(String(nextDataDir || '').trim());
  if (!resolvedDataDir) throw new Error('Data Directory is required');

  const previousDataDir = getDataDir();
  const source = path.resolve(previousDataDir);
  const target = path.resolve(resolvedDataDir);
  let movedDataDir = false;

  if (source !== target && fs.existsSync(source)) {
    if (fs.existsSync(target)) {
      if (!fs.statSync(target).isDirectory()) throw new Error('Target data directory is not a directory');
      if (!isDirectoryEmpty(target)) {
        throw new Error('Target data directory already exists and is not empty');
      }
      fs.rmSync(target, { recursive: true, force: true });
    }
    movedDataDir = moveDirectory(source, target);
  } else if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const currentSettings = readSettings();
  writeSettings({ ...currentSettings, dataDir: resolvedDataDir });

  return {
    previousDataDir: source,
    dataDir: target,
    movedDataDir,
    settings: readSettings(),
  };
}

function setLogsDir(nextLogsDir) {
  assertMutableRuntimePaths();

  const resolvedLogsDir = path.resolve(String(nextLogsDir || '').trim());
  if (!resolvedLogsDir) throw new Error('Log Directory is required');

  const previousLogsDir = getLogsDir();
  const source = path.resolve(previousLogsDir);
  const target = path.resolve(resolvedLogsDir);
  let movedLogsDir = false;

  if (source !== target && fs.existsSync(source)) {
    if (fs.existsSync(target)) {
      if (!fs.statSync(target).isDirectory()) throw new Error('Target log directory is not a directory');
      if (!isDirectoryEmpty(target)) {
        throw new Error('Target log directory already exists and is not empty');
      }
      fs.rmSync(target, { recursive: true, force: true });
    }
    movedLogsDir = moveDirectory(source, target);
  } else if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const currentSettings = readSettings();
  writeSettings({ ...currentSettings, logsDir: resolvedLogsDir });

  return {
    previousLogsDir: source,
    logsDir: target,
    movedLogsDir,
    settings: readSettings(),
  };
}

module.exports = {
  APP_DIR,
  ensureStateDir,
  getStateDir,
  getSettingsFile,
  readSettings,
  writeSettings,
  getDefaultProjectRoot,
  getProjectRoot,
  getDataDir,
  getDefaultLogsDir,
  getLogsDir,
  getDbPath,
  setProjectRoot,
  setDataDir,
  setLogsDir,
};
