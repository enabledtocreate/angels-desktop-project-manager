const fs = require('fs');
const path = require('path');

const CURRENT_LOG_NAME = 'current.log.tsv';
const ARCHIVE_DIR_NAME = 'Archive';
const HEADER = [
  'timestamp',
  'level',
  'requestId',
  'source',
  'eventType',
  'action',
  'message',
  'details',
  'error',
].join('\t');

function escapeField(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function getLogsDir(baseDir) {
  return path.resolve(baseDir);
}

function getArchivedLogsDir(logsDir) {
  return path.join(getLogsDir(logsDir), ARCHIVE_DIR_NAME);
}

function getCurrentLogFile(logsDir) {
  return path.join(getLogsDir(logsDir), CURRENT_LOG_NAME);
}

function ensureLogDirs(logsDir) {
  const resolvedLogsDir = getLogsDir(logsDir);
  const archiveDir = getArchivedLogsDir(resolvedLogsDir);
  if (!fs.existsSync(resolvedLogsDir)) fs.mkdirSync(resolvedLogsDir, { recursive: true });
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
  return { logsDir: resolvedLogsDir, archiveDir, currentLogFile: getCurrentLogFile(resolvedLogsDir) };
}

function ensureCurrentLogHeader(logsDir) {
  const { currentLogFile } = ensureLogDirs(logsDir);
  if (!fs.existsSync(currentLogFile) || fs.statSync(currentLogFile).size === 0) {
    fs.writeFileSync(currentLogFile, `${HEADER}\n`, 'utf8');
  }
  return currentLogFile;
}

function writeLog(logsDir, entry = {}) {
  const currentLogFile = ensureCurrentLogHeader(logsDir);
  const line = [
    new Date().toISOString(),
    escapeField(String(entry.level || 'INFO').toUpperCase()),
    escapeField(entry.requestId || ''),
    escapeField(entry.source || 'system'),
    escapeField(entry.eventType || 'event'),
    escapeField(entry.action || ''),
    escapeField(entry.message || ''),
    escapeField(entry.details || ''),
    escapeField(entry.error || ''),
  ].join('\t');
  fs.appendFileSync(currentLogFile, `${line}\n`, 'utf8');
  return currentLogFile;
}

function formatArchiveName(date = new Date()) {
  const stamp = date.toISOString().replace(/[:.]/g, '-');
  return `log-${stamp}.tsv`;
}

function archiveCurrentLog(logsDir, reason = 'manual') {
  const { archiveDir, currentLogFile } = ensureLogDirs(logsDir);
  if (!fs.existsSync(currentLogFile) || fs.statSync(currentLogFile).size <= HEADER.length + 1) {
    ensureCurrentLogHeader(logsDir);
    writeLog(logsDir, {
      level: 'INFO',
      source: 'logger',
      eventType: 'log.archive.skipped',
      action: reason,
      message: 'Skipped log archive because the current log had no entries.',
    });
    return null;
  }

  const archivePath = path.join(archiveDir, formatArchiveName());
  fs.renameSync(currentLogFile, archivePath);
  ensureCurrentLogHeader(logsDir);
  writeLog(logsDir, {
    level: 'INFO',
    source: 'logger',
    eventType: 'log.archive.created',
    action: reason,
    message: 'Archived current log file.',
    details: archivePath,
  });
  return archivePath;
}

module.exports = {
  HEADER,
  CURRENT_LOG_NAME,
  ARCHIVE_DIR_NAME,
  getLogsDir,
  getArchivedLogsDir,
  getCurrentLogFile,
  ensureLogDirs,
  ensureCurrentLogHeader,
  writeLog,
  archiveCurrentLog,
};
