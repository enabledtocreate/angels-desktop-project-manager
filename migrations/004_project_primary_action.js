const { dbAll, dbRun } = require('../src/database');

async function hasColumn(tableName, columnName) {
  const columns = await dbAll(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function up() {
  if (!(await hasColumn('projects', 'primary_action'))) {
    await dbRun("ALTER TABLE projects ADD COLUMN primary_action TEXT DEFAULT 'auto'");
  }
}

module.exports = { up };
