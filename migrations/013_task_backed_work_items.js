const { dbAll, dbGet, dbRun } = require('../src/database');

function mapFeatureStatusToTaskStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done') return 'done';
  if (normalized === 'in_progress') return 'in_progress';
  return 'todo';
}

function mapBugStatusToTaskStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done' || normalized === 'resolved' || normalized === 'closed') return 'done';
  if (normalized === 'in_progress') return 'in_progress';
  return 'todo';
}

async function hasColumn(tableName, columnName) {
  const columns = await dbAll(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (!(await hasColumn(tableName, columnName))) {
    await dbRun(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureTaskForFeature(feature) {
  const taskId = feature.task_id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const existingTask = await dbGet('SELECT id FROM tasks WHERE id = ?', [taskId]);
  const createdAt = feature.created_at || new Date().toISOString();
  const updatedAt = feature.updated_at || createdAt;
  await dbRun(`
    INSERT INTO tasks
    (id, project_id, title, description, status, priority, created_at, updated_at, roadmap_phase_id, dependency_ids, progress, milestone, sort_order, planning_bucket, item_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      roadmap_phase_id = excluded.roadmap_phase_id,
      updated_at = excluded.updated_at,
      planning_bucket = excluded.planning_bucket,
      item_type = excluded.item_type
  `, [
    taskId,
    feature.project_id,
    feature.title || 'Untitled feature',
    feature.summary || '',
    mapFeatureStatusToTaskStatus(feature.status),
    'medium',
    existingTask ? createdAt : createdAt,
    updatedAt,
    feature.roadmap_phase_id || null,
    '[]',
    mapFeatureStatusToTaskStatus(feature.status) === 'done' ? 100 : (mapFeatureStatusToTaskStatus(feature.status) === 'in_progress' ? 50 : 0),
    0,
    0,
    feature.archived ? 'archived' : (feature.roadmap_phase_id ? 'phase' : 'considered'),
    'feature',
  ]);
  if (!feature.task_id) {
    await dbRun('UPDATE feature_items SET task_id = ? WHERE id = ?', [taskId, feature.id]);
  }
}

async function ensureTaskForBug(bug) {
  const taskId = bug.task_id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const existingTask = await dbGet('SELECT id FROM tasks WHERE id = ?', [taskId]);
  const createdAt = bug.created_at || new Date().toISOString();
  const updatedAt = bug.updated_at || createdAt;
  const currentBehavior = bug.current_behavior || bug.summary || '';
  await dbRun(`
    INSERT INTO tasks
    (id, project_id, title, description, status, priority, created_at, updated_at, roadmap_phase_id, dependency_ids, progress, milestone, sort_order, planning_bucket, item_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      updated_at = excluded.updated_at,
      planning_bucket = excluded.planning_bucket,
      item_type = excluded.item_type
  `, [
    taskId,
    bug.project_id,
    bug.title || 'Untitled bug',
    currentBehavior,
    mapBugStatusToTaskStatus(bug.status),
    bug.severity === 'high' ? 'high' : (bug.severity === 'low' ? 'low' : 'medium'),
    existingTask ? createdAt : createdAt,
    updatedAt,
    null,
    '[]',
    bug.completed ? 100 : (mapBugStatusToTaskStatus(bug.status) === 'in_progress' ? 50 : 0),
    0,
    0,
    bug.archived ? 'archived' : 'considered',
    'bug',
  ]);
  if (!bug.task_id) {
    await dbRun('UPDATE bug_items SET task_id = ? WHERE id = ?', [taskId, bug.id]);
  }
}

async function up() {
  await addColumnIfMissing('tasks', 'planning_bucket', "TEXT DEFAULT 'considered'");
  await addColumnIfMissing('tasks', 'item_type', "TEXT DEFAULT 'task'");

  const features = await dbAll('SELECT * FROM feature_items');
  for (const feature of features) {
    await ensureTaskForFeature(feature);
  }

  const bugs = await dbAll('SELECT * FROM bug_items');
  for (const bug of bugs) {
    await ensureTaskForBug(bug);
  }

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_project_bucket ON tasks(project_id, planning_bucket, updated_at DESC)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_project_type ON tasks(project_id, item_type, updated_at DESC)`);
}

module.exports = { up };
