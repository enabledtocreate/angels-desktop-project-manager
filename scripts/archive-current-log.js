const { getLogsDir } = require('../src/app-state');
const logger = require('../src/logger');

const logsDir = getLogsDir();
const archivedPath = logger.archiveCurrentLog(logsDir, 'build');

if (archivedPath) {
  console.log(`Archived current log to ${archivedPath}`);
} else {
  console.log('No current log entries to archive.');
}
