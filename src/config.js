const path = require('path');
const fs = require('fs');
const {
  APP_DIR,
  getProjectRoot,
  getDataDir,
  getLogsDir: getAppLogsDir,
} = require('./app-state');
const logger = require('./logger');

const PUBLIC_DIR = path.resolve(process.env.APM_PUBLIC_DIR || path.join(APP_DIR, 'public'));
const FRONTEND_DIR = path.resolve(process.env.APM_FRONTEND_DIR || path.join(APP_DIR, 'next-app', 'out'));
const DEFAULT_PORT = parseInt(process.env.APM_PORT || '3847', 10);
const SFTP_MANIFEST = '.sftp-manifest';

function getProjectsRoot() {
  return getProjectRoot();
}

function getPublicDir() {
  return PUBLIC_DIR;
}

function getFrontendDir() {
  return FRONTEND_DIR;
}

function sanitizeDataFolderName(value, fallback = 'project') {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;
}

function getProjectsDataDir() {
  return path.join(getDataDir(), 'projects');
}

function getProjectDataDir(projectId) {
  return path.join(getProjectsDataDir(), sanitizeDataFolderName(projectId));
}

function getSharedProjectDataDir() {
  return path.join(getProjectsDataDir(), 'shared');
}

function getProjectImagesDir(projectId = '') {
  return projectId
    ? path.join(getProjectDataDir(projectId), 'project-images')
    : path.join(getSharedProjectDataDir(), 'project-images');
}

function getLogsDir() {
  return getAppLogsDir(getDataDir());
}

function getArchivedLogsDir() {
  return logger.getArchivedLogsDir(getLogsDir());
}

function getLogFile() {
  return logger.getCurrentLogFile(getLogsDir());
}

function ensureDataDir() {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

function isSubPath(parentPath, childPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function log(message, err) {
  ensureDataDir();
  logger.writeLog(getLogsDir(), {
    level: err ? 'ERROR' : 'INFO',
    source: 'server',
    eventType: err ? 'error' : 'event',
    message: message || '',
    error: err ? (err.stack || err.message || String(err)) : '',
  });
}

function logEntry(entry) {
  ensureDataDir();
  logger.writeLog(getLogsDir(), entry);
}

function resolveSafe(userPath) {
  const projectsRoot = getProjectsRoot();
  const resolved = path.resolve(projectsRoot, userPath);
  if (!isSubPath(projectsRoot, resolved)) return null;
  return resolved;
}

const exported = {
  APP_DIR,
  PUBLIC_DIR,
  DEFAULT_PORT,
  SFTP_MANIFEST,
  getProjectsRoot,
  getDataDir,
  getProjectsDataDir,
  getProjectDataDir,
  getSharedProjectDataDir,
  getPublicDir,
  getFrontendDir,
  getProjectImagesDir,
  getLogsDir,
  getArchivedLogsDir,
  getLogFile,
  ensureDataDir,
  log,
  logEntry,
  resolveSafe,
};

Object.defineProperties(exported, {
  PROJECTS_ROOT: { enumerable: true, get: getProjectsRoot },
  DATA_DIR: { enumerable: true, get: getDataDir },
  PROJECT_IMAGES_DIR: { enumerable: true, get: getProjectImagesDir },
  LOGS_DIR: { enumerable: true, get: getLogsDir },
  FRONTEND_DIR: { enumerable: true, get: getFrontendDir },
  LOG_FILE: { enumerable: true, get: getLogFile },
});

module.exports = exported;
