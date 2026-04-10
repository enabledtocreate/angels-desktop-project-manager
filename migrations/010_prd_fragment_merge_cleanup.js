const { dbRun, dbAll } = require('../src/database');

async function up() {
  const columns = await dbAll('PRAGMA table_info(prd_fragments)');
  if (!columns.some((column) => column.name === 'merged_file_name')) {
    await dbRun(`ALTER TABLE prd_fragments ADD COLUMN merged_file_name TEXT`);
  }
}

module.exports = { up };
