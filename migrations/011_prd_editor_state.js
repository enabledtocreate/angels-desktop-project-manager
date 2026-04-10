const { dbRun, dbAll } = require('../src/database');

async function up() {
  const columns = await dbAll('PRAGMA table_info(project_md_documents)');
  if (!columns.some((column) => column.name === 'editor_state')) {
    await dbRun(`ALTER TABLE project_md_documents ADD COLUMN editor_state TEXT DEFAULT ''`);
  }
}

module.exports = { up };
