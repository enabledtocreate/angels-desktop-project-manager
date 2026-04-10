const { dbAll, dbRun } = require('../src/database');

async function hasColumn(tableName, columnName) {
  const columns = await dbAll(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function up() {
  if (!(await hasColumn('roadmap_phases', 'after_phase_id'))) {
    await dbRun(`ALTER TABLE roadmap_phases ADD COLUMN after_phase_id TEXT`);
  }

  if (!(await hasColumn('roadmap_phases', 'archived'))) {
    await dbRun(`ALTER TABLE roadmap_phases ADD COLUMN archived INTEGER DEFAULT 0`);
  }

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_roadmap_phases_project_archive ON roadmap_phases(project_id, archived, sort_order)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_roadmap_phases_after ON roadmap_phases(project_id, after_phase_id)`);
}

module.exports = { up };
