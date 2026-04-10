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
  await addColumnIfMissing('feature_items', 'affected_module_keys', "TEXT DEFAULT '[]'");
  await addColumnIfMissing('bug_items', 'affected_module_keys', "TEXT DEFAULT '[]'");

  await dbRun(`
    UPDATE feature_items
       SET affected_module_keys = '[]'
     WHERE affected_module_keys IS NULL OR TRIM(affected_module_keys) = ''
  `);

  await dbRun(`
    UPDATE bug_items
       SET affected_module_keys = '[]'
     WHERE affected_module_keys IS NULL OR TRIM(affected_module_keys) = ''
  `);
}

module.exports = { up };
