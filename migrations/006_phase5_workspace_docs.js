const { dbRun, dbAll } = require('../src/database');

async function up() {
  const projectColumns = await dbAll('PRAGMA table_info(projects)');
  if (!projectColumns.some((column) => column.name === 'workspace_plugins')) {
    await dbRun(`ALTER TABLE projects ADD COLUMN workspace_plugins TEXT DEFAULT '[]'`);
  }

  const taskColumns = await dbAll('PRAGMA table_info(tasks)');
  if (!taskColumns.some((column) => column.name === 'roadmap_phase_id')) {
    await dbRun(`ALTER TABLE tasks ADD COLUMN roadmap_phase_id TEXT`);
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS roadmap_phases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT DEFAULT '',
      goal TEXT DEFAULT '',
      status TEXT DEFAULT 'planned',
      target_date TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS feature_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      status TEXT DEFAULT 'planned',
      roadmap_phase_id TEXT,
      task_id TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS bug_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      severity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      task_id TEXT,
      completed INTEGER DEFAULT 0,
      regressed INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS project_md_documents (
      project_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      markdown TEXT DEFAULT '',
      mermaid TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, doc_type),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_roadmap_phases_project_sort ON roadmap_phases(project_id, sort_order)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_feature_items_project_archived ON feature_items(project_id, archived, updated_at DESC)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_bug_items_project_archived ON bug_items(project_id, archived, updated_at DESC)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_project_phase ON tasks(project_id, roadmap_phase_id, sort_order)`);
}

module.exports = { up };
