const { dbRun, dbAll } = require('../src/database');

async function up() {
  const projectColumns = await dbAll('PRAGMA table_info(projects)');
  if (!projectColumns.some((column) => column.name === 'integrations')) {
    await dbRun(`ALTER TABLE projects ADD COLUMN integrations TEXT DEFAULT '{}'`);
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      is_secret INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS integration_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source TEXT NOT NULL,
      event_type TEXT NOT NULL,
      delivery_status TEXT DEFAULT 'received',
      payload TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_integration_events_project_created ON integration_events(project_id, created_at DESC)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_integration_events_source ON integration_events(source)`);
}

module.exports = { up };
