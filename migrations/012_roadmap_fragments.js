const { dbRun } = require('../src/database');

async function up() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS roadmap_fragments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_feature_id TEXT,
      source_phase_id TEXT,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      markdown TEXT NOT NULL DEFAULT '',
      mermaid TEXT NOT NULL DEFAULT '',
      payload_json TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      merged INTEGER NOT NULL DEFAULT 0,
      merged_at TEXT,
      integrated_at TEXT,
      file_name TEXT,
      file_path TEXT,
      file_updated_at TEXT,
      file_md5 TEXT NOT NULL DEFAULT '',
      db_md5 TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await dbRun(`CREATE UNIQUE INDEX IF NOT EXISTS idx_roadmap_fragments_project_feature ON roadmap_fragments(project_id, source_feature_id) WHERE source_feature_id IS NOT NULL`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_roadmap_fragments_project_status ON roadmap_fragments(project_id, merged, updated_at DESC)`);
}

module.exports = { up };
