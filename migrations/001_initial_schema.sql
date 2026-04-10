CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  path TEXT,
  absolute_path TEXT,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  server_id TEXT,
  image_path TEXT,
  open_in_cursor INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT DEFAULT '[]',
  links TEXT DEFAULT '[]',
  date_added TEXT,
  type TEXT DEFAULT 'folder',
  open_in_cursor_admin INTEGER DEFAULT 0,
  url TEXT,
  pinned INTEGER DEFAULT 0,
  image_url TEXT,
  primary_action TEXT DEFAULT 'auto',
  upload_mappings TEXT DEFAULT '[]',
  mapping_groups TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 22,
  user TEXT NOT NULL,
  password TEXT,
  key_path TEXT
);

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
);

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(pinned);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(project_id, sort_order);
