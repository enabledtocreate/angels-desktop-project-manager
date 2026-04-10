const { dbAll, dbRun } = require('../src/database');

async function hasColumn(tableName, columnName) {
  const columns = await dbAll(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function up() {
  if (!(await hasColumn('tasks', 'category'))) {
    await dbRun(`ALTER TABLE tasks ADD COLUMN category TEXT`);
  }

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_project_category ON tasks(project_id, category)`);
}

module.exports = { up };
