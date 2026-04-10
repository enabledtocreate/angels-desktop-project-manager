const { dbRun, dbAll } = require('../src/database');
const {
  normalizeProjectType,
  buildModuleRegistry,
  resolveProjectType,
  getModuleDefinition,
} = require('../src/project-profiles');

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
  await addColumnIfMissing('projects', 'project_type', "TEXT DEFAULT 'general'");

  await dbRun(`
    CREATE TABLE IF NOT EXISTS project_modules (
      project_id TEXT NOT NULL,
      module_key TEXT NOT NULL,
      module_group TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT DEFAULT '',
      enabled INTEGER DEFAULT 0,
      is_core INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      settings_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, module_key),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS entity_relationships (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_entity_type TEXT NOT NULL,
      source_entity_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      target_entity_type TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      metadata_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing('project_md_documents', 'title', "TEXT DEFAULT ''");
  await addColumnIfMissing('project_md_documents', 'module_key', "TEXT DEFAULT ''");
  await addColumnIfMissing('project_md_documents', 'template_name', "TEXT DEFAULT ''");
  await addColumnIfMissing('project_md_documents', 'template_version', "TEXT DEFAULT ''");
  await addColumnIfMissing('project_md_documents', 'source_of_truth', "TEXT DEFAULT 'database'");

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_project_modules_project_group ON project_modules(project_id, module_group, sort_order)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_entity_relationships_project_source ON entity_relationships(project_id, source_entity_type, source_entity_id)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_entity_relationships_project_target ON entity_relationships(project_id, target_entity_type, target_entity_id)`);

  const projects = await dbAll('SELECT id, project_type, workspace_plugins, integrations FROM projects');
  for (const project of projects) {
    let legacyPlugins = [];
    try {
      legacyPlugins = JSON.parse(project.workspace_plugins || '[]');
    } catch {
      legacyPlugins = [];
    }

    let integrations = {};
    try {
      integrations = JSON.parse(project.integrations || '{}') || {};
    } catch {
      integrations = {};
    }

    const inferredProjectType = resolveProjectType(
      project.project_type,
      [],
      legacyPlugins,
      project.project_type || 'general'
    );

    await dbRun('UPDATE projects SET project_type = ? WHERE id = ?', [normalizeProjectType(inferredProjectType), project.id]);

    const registry = buildModuleRegistry(inferredProjectType, {
      enabledModuleKeys: [
        ...legacyPlugins,
        ...(integrations && Object.keys(integrations).length ? ['integrations'] : []),
      ],
    });

    for (const module of registry) {
      await dbRun(`
        INSERT INTO project_modules
        (project_id, module_key, module_group, label, description, enabled, is_core, sort_order, settings_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(project_id, module_key) DO UPDATE SET
          module_group = excluded.module_group,
          label = excluded.label,
          description = excluded.description,
          enabled = excluded.enabled,
          is_core = excluded.is_core,
          sort_order = excluded.sort_order,
          updated_at = CURRENT_TIMESTAMP
      `, [
        project.id,
        module.moduleKey,
        module.group,
        module.label,
        module.description,
        module.enabled ? 1 : 0,
        module.core ? 1 : 0,
        module.sortOrder,
        JSON.stringify(module.settings || {}),
      ]);
    }
  }

  const documents = await dbAll('SELECT project_id, doc_type FROM project_md_documents');
  for (const document of documents) {
    const definition = getModuleDefinition(document.doc_type);
    await dbRun(`
      UPDATE project_md_documents
         SET title = COALESCE(NULLIF(title, ''), ?),
             module_key = COALESCE(NULLIF(module_key, ''), ?),
             template_name = COALESCE(NULLIF(template_name, ''), ?),
             source_of_truth = COALESCE(NULLIF(source_of_truth, ''), 'database')
       WHERE project_id = ? AND doc_type = ?
    `, [
      definition ? definition.label : String(document.doc_type || '').toUpperCase(),
      definition ? definition.key : document.doc_type,
      definition && definition.documentType ? `${String(definition.documentType).toUpperCase()}.template.md` : '',
      document.project_id,
      document.doc_type,
    ]);
  }
}

module.exports = { up };
