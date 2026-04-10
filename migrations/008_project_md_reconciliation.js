const { dbRun, dbAll } = require('../src/database');

async function up() {
  const columns = await dbAll('PRAGMA table_info(project_md_documents)');
  if (!columns.some((column) => column.name === 'file_path')) {
    await dbRun(`ALTER TABLE project_md_documents ADD COLUMN file_path TEXT`);
  }
  if (!columns.some((column) => column.name === 'file_updated_at')) {
    await dbRun(`ALTER TABLE project_md_documents ADD COLUMN file_updated_at TEXT`);
  }
  if (!columns.some((column) => column.name === 'file_md5')) {
    await dbRun(`ALTER TABLE project_md_documents ADD COLUMN file_md5 TEXT DEFAULT ''`);
  }
  if (!columns.some((column) => column.name === 'db_md5')) {
    await dbRun(`ALTER TABLE project_md_documents ADD COLUMN db_md5 TEXT DEFAULT ''`);
  }
}

module.exports = { up };
