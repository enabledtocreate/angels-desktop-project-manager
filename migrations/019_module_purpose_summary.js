const { dbRun, dbAll } = require('../src/database');
const { getModuleDefinition } = require('../src/project-profiles');

async function hasColumn(tableName, columnName) {
  const columns = await dbAll(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (!(await hasColumn(tableName, columnName))) {
    await dbRun(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function up() {
  await addColumnIfMissing('project_modules', 'purpose_summary', "TEXT DEFAULT ''");

  const rows = await dbAll('SELECT project_id, module_key, description, purpose_summary FROM project_modules');
  for (const row of rows) {
    const definition = getModuleDefinition(row.module_key);
    const nextSummary = row.purpose_summary || definition?.purposeSummary || row.description || '';
    await dbRun(
      'UPDATE project_modules SET purpose_summary = ? WHERE project_id = ? AND module_key = ?',
      [nextSummary, row.project_id, row.module_key]
    );
  }
}

module.exports = { up };
