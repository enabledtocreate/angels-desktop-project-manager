const { dbRun } = require('../src/database');

async function up() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS project_template_files (
      project_id TEXT NOT NULL,
      template_name TEXT NOT NULL,
      template_kind TEXT NOT NULL DEFAULT 'document',
      template_version TEXT DEFAULT '',
      template_last_updated TEXT DEFAULT '',
      source_md5 TEXT DEFAULT '',
      target_md5 TEXT DEFAULT '',
      target_path TEXT DEFAULT '',
      target_updated_at TEXT DEFAULT '',
      replaced INTEGER DEFAULT 0,
      missing INTEGER DEFAULT 0,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, template_name),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
}

module.exports = { up };
