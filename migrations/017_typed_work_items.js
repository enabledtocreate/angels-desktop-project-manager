const { dbRun, dbAll } = require('../src/database');

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
  await addColumnIfMissing('tasks', 'work_item_type', "TEXT DEFAULT 'core_task'");
  await addColumnIfMissing('feature_items', 'work_item_type', "TEXT DEFAULT 'software_feature'");
  await addColumnIfMissing('bug_items', 'work_item_type', "TEXT DEFAULT 'software_bug'");

  await dbRun(`
    UPDATE tasks
       SET work_item_type = CASE
         WHEN item_type = 'feature' THEN 'software_feature'
         WHEN item_type = 'bug' THEN 'software_bug'
         ELSE 'core_task'
       END
     WHERE work_item_type IS NULL
        OR work_item_type = ''
        OR work_item_type IN ('task', 'feature', 'bug')
  `);

  await dbRun(`
    UPDATE feature_items
       SET work_item_type = 'software_feature'
     WHERE work_item_type IS NULL OR work_item_type = ''
  `);

  await dbRun(`
    UPDATE bug_items
       SET work_item_type = 'software_bug'
     WHERE work_item_type IS NULL OR work_item_type = ''
  `);

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_project_work_item_type ON tasks(project_id, work_item_type, updated_at DESC)`);
}

module.exports = { up };
