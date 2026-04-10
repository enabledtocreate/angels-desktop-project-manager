const { dbAll, dbRun } = require('../src/database');

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
  await addColumnIfMissing('projects', 'upload_mappings', "TEXT DEFAULT '[]'");
  await addColumnIfMissing('projects', 'mapping_groups', "TEXT DEFAULT '[]'");
  await addColumnIfMissing('projects', 'primary_action', "TEXT DEFAULT 'auto'");

  await dbRun(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT,
      assigned_to TEXT,
      start_date TEXT,
      end_date TEXT,
      dependency_ids TEXT DEFAULT '[]',
      progress INTEGER DEFAULT 0,
      milestone INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing('tasks', 'start_date', 'TEXT');
  await addColumnIfMissing('tasks', 'end_date', 'TEXT');
  await addColumnIfMissing('tasks', 'dependency_ids', "TEXT DEFAULT '[]'");
  await addColumnIfMissing('tasks', 'progress', 'INTEGER DEFAULT 0');
  await addColumnIfMissing('tasks', 'milestone', 'INTEGER DEFAULT 0');
  await addColumnIfMissing('tasks', 'sort_order', 'INTEGER DEFAULT 0');

  await dbRun('CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(pinned)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(project_id, sort_order)');
}

module.exports = { up };
