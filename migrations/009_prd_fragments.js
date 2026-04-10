const { dbRun } = require('../src/database');

async function up() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS prd_fragments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      feature_id TEXT,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      markdown TEXT DEFAULT '',
      mermaid TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      merged INTEGER DEFAULT 0,
      merged_at TEXT,
      file_name TEXT,
      file_path TEXT,
      file_updated_at TEXT,
      file_md5 TEXT DEFAULT '',
      db_md5 TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`CREATE UNIQUE INDEX IF NOT EXISTS idx_prd_fragments_project_feature ON prd_fragments(project_id, feature_id)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_prd_fragments_project_merged ON prd_fragments(project_id, merged, updated_at DESC)`);
}

module.exports = { up };
