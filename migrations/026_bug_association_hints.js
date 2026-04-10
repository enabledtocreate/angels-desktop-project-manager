const { dbAll, dbRun } = require('../src/database');

async function addColumnIfMissing(tableName, columnName, definition) {
  const columns = await dbAll(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => String(column.name || '').trim().toLowerCase() === String(columnName || '').trim().toLowerCase())) {
    await dbRun(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function up() {
  await addColumnIfMissing('bug_items', 'association_hints', "TEXT DEFAULT ''");
}

module.exports = { up };
