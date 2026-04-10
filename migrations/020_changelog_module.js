const { dbRun, dbAll } = require('../src/database');
const { getModuleDefinition } = require('../src/project-profiles');

async function up() {
  const definition = getModuleDefinition('changelog');
  if (!definition) return;

  const projects = await dbAll(`SELECT id, project_type FROM projects WHERE LOWER(COALESCE(project_type, 'general')) = 'software'`);
  for (const project of projects) {
    await dbRun(`
      INSERT INTO project_modules
      (project_id, module_key, module_group, label, description, enabled, is_core, sort_order, settings_json, purpose_summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, module_key) DO UPDATE SET
        module_group = excluded.module_group,
        label = excluded.label,
        description = excluded.description,
        purpose_summary = COALESCE(NULLIF(project_modules.purpose_summary, ''), excluded.purpose_summary),
        updated_at = CURRENT_TIMESTAMP
    `, [
      project.id,
      definition.key,
      definition.group,
      definition.label,
      definition.description,
      1,
      definition.core ? 1 : 0,
      Number.isFinite(Number(definition.hierarchyOrder)) ? Number(definition.hierarchyOrder) : 0,
      '{}',
      definition.purposeSummary || definition.description || '',
    ]);
  }
}

module.exports = { up };
