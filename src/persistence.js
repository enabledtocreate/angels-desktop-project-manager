const path = require('path');
const { dbRun, dbGet, dbAll, reopenDatabase, closeDatabase } = require('./database');
const config = require('./config');
const { normalizeDocumentEditorStateForStorage, backfillDocumentEditorStateFromChangelog } = require('./workspace-docs');
const { readSettings, setProjectRoot, setDataDir, setLogsDir, getProjectRoot, getDataDir, getLogsDir } = require('./app-state');
const { runMigrations } = require('../migrations/migrate');
const { migrateData } = require('../migrate-data');
const { encryptSecret, decryptSecret } = require('./secrets');
const {
  parseJson,
  normalizeLinks,
  normalizeUploadMappings,
  normalizeMappingGroups,
  normalizeProjectPrimaryAction,
  normalizeWorkspacePlugins,
  normalizeProjectIntegrations,
  normalizeTaskPayload,
  normalizeWorkItemType,
  legacyItemTypeFromWorkItemType,
} = require('./model-utils');
const {
  normalizeProjectType,
  buildModuleRegistry,
  moduleKeysToLegacyWorkspacePlugins,
  resolveProjectType,
  getModuleDefinition,
  getModuleDependencyKeys,
} = require('./project-profiles');

let bootstrapPromise = null;

function resolveStoredProjectAbsolutePath(projectPath) {
  if (!projectPath) return null;
  if (path.isAbsolute(projectPath)) return path.resolve(projectPath);
  return config.resolveSafe(projectPath);
}

function hydrateProjectModule(row) {
  const definition = getModuleDefinition(row.module_key);
  return {
    projectId: row.project_id,
    moduleKey: row.module_key,
    label: row.label || definition?.label || row.module_key,
    description: row.description || '',
    purposeSummary: row.purpose_summary || definition?.purposeSummary || row.description || '',
    group: row.module_group || definition?.group || 'core',
    enabled: Boolean(row.enabled),
    core: Boolean(row.is_core),
    sortOrder: Number(row.sort_order || 0),
    settings: parseJson(row.settings_json, {}),
    documentType: definition?.documentType || null,
    legacyWorkspacePlugin: definition?.legacyWorkspacePlugin || null,
    dependsOn: definition?.dependsOn || [],
    hierarchyGroup: definition?.hierarchyGroup || null,
    hierarchyOrder: Number.isFinite(Number(definition?.hierarchyOrder)) ? Number(definition.hierarchyOrder) : 0,
    hierarchyDepth: Number.isFinite(Number(definition?.hierarchyDepth)) ? Number(definition.hierarchyDepth) : 0,
    hierarchyParent: definition?.hierarchyParent || null,
  };
}

function hydrateProject(row, moduleRows = []) {
  const uploadMappings = normalizeUploadMappings(parseJson(row.upload_mappings, []));
  const mappingGroups = normalizeMappingGroups(parseJson(row.mapping_groups, []), uploadMappings);
  const primaryGroup = mappingGroups[0];
  const isFolderProject = (row.type || 'folder') === 'folder';
  const absolutePath = row.absolute_path || (isFolderProject && row.path ? resolveStoredProjectAbsolutePath(row.path) : null);
  const integrations = normalizeProjectIntegrations(parseJson(row.integrations, {}));
  const requestedProjectType = normalizeProjectType(row.project_type);
  const fallbackRegistry = buildModuleRegistry(requestedProjectType, {
    enabledModuleKeys: [
      ...parseJson(row.workspace_plugins, []),
      ...(integrations && Object.keys(integrations).length ? ['integrations'] : []),
    ],
    existingModules: moduleRows.map((module) => hydrateProjectModule(module)),
  });
  const modules = moduleRows.length
    ? fallbackRegistry.map((module) => {
        const existing = moduleRows.find((rowModule) => rowModule.module_key === module.moduleKey);
        return existing ? hydrateProjectModule(existing) : module;
      })
    : fallbackRegistry;
  const enabledModules = modules.filter((module) => module.enabled).map((module) => module.moduleKey);
  const workspacePlugins = moduleKeysToLegacyWorkspacePlugins(enabledModules);

  return {
    id: row.id,
    path: row.path,
    absolutePath,
    name: row.name,
    description: row.description || '',
    parentId: row.parent_id,
    serverId: row.server_id,
    imagePath: row.image_path,
    openInCursor: Boolean(row.open_in_cursor),
    category: row.category,
    tags: parseJson(row.tags, []),
    links: normalizeLinks(parseJson(row.links, [])),
    dateAdded: row.date_added,
    type: row.type || 'folder',
    openInCursorAdmin: Boolean(row.open_in_cursor_admin),
    url: row.url,
    pinned: Boolean(row.pinned),
    imageUrl: row.image_url,
    primaryAction: normalizeProjectPrimaryAction(row.primary_action),
    projectType: requestedProjectType,
    workspacePlugins,
    enabledModules,
    modules,
    uploadMappings: primaryGroup ? primaryGroup.uploadMappings.slice() : uploadMappings,
    mappingGroups,
    integrations,
  };
}

function hydrateCredential(row) {
  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    user: row.user,
    password: decryptSecret(row.password || null),
    keyPath: row.keyPath ?? row.key_path ?? null,
  };
}

function hydrateTask(row) {
  const workItemType = normalizeWorkItemType(row.work_item_type || row.item_type || 'core_task');
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || '',
    category: row.category || null,
    status: row.status || 'todo',
    priority: row.priority || 'medium',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    startDate: row.start_date,
    endDate: row.end_date,
    roadmapPhaseId: row.roadmap_phase_id,
    planningBucket: row.planning_bucket || 'considered',
    workItemType,
    itemType: legacyItemTypeFromWorkItemType(workItemType),
    dependencyIds: parseJson(row.dependency_ids, []),
    progress: Number(row.progress || 0),
    milestone: Boolean(row.milestone),
    sortOrder: Number(row.sort_order || 0),
  };
}

function mapFeatureStatusToTaskStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done') return 'done';
  if (normalized === 'in_progress') return 'in_progress';
  return 'todo';
}

function mapTaskStatusToFeatureStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done') return 'done';
  if (normalized === 'in_progress') return 'in_progress';
  return 'planned';
}

function mapBugStatusToTaskStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['done', 'resolved', 'closed'].includes(normalized)) return 'done';
  if (['in_progress', 'blocked', 'fixed', 'verifying', 'regressed'].includes(normalized)) return 'in_progress';
  if (['open', 'triaged'].includes(normalized)) return 'todo';
  return 'todo';
}

function normalizeBugStatus(status, fallback = 'open') {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === 'done') return 'resolved';
  if (['open', 'triaged', 'in_progress', 'blocked', 'fixed', 'verifying', 'resolved', 'closed', 'regressed'].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function isCompletedBugStatus(status) {
  return ['resolved', 'closed'].includes(normalizeBugStatus(status));
}

function isRegressedBugStatus(status) {
  return normalizeBugStatus(status) === 'regressed';
}

function isArchivedBugState(status, planningBucket, archived = false, completed = false) {
  if (archived || completed) return true;
  if (String(planningBucket || '').trim().toLowerCase() === 'archived') return true;
  return isCompletedBugStatus(status);
}

function mapTaskStatusToBugStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done') return 'resolved';
  if (normalized === 'in_progress') return 'in_progress';
  return 'open';
}

async function bootstrapStorage(options = {}) {
  const { force = false } = options;
  if (!bootstrapPromise || force) {
    bootstrapPromise = (async () => {
      config.ensureDataDir();
      await reopenDatabase();
      await runMigrations();
      await migrateData({ onlyIfEmpty: true, dataDir: getDataDir() });
      await rewriteProjectAbsolutePaths();
    })();
  }
  return bootstrapPromise;
}

async function readProjectModuleRows(projectIds = []) {
  const ids = Array.isArray(projectIds) ? projectIds.filter(Boolean) : [];
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return dbAll(
    `SELECT * FROM project_modules WHERE project_id IN (${placeholders}) ORDER BY sort_order ASC, module_key ASC`,
    ids
  );
}

async function readProjectModules(projectId) {
  const rows = await dbAll(
    'SELECT * FROM project_modules WHERE project_id = ? ORDER BY sort_order ASC, module_key ASC',
    [projectId]
  );
  return rows.map(hydrateProjectModule);
}

async function syncProjectModules(projectInput) {
  const projectType = resolveProjectType(
    projectInput.projectType,
    Array.isArray(projectInput.enabledModules) ? projectInput.enabledModules : [],
    normalizeWorkspacePlugins(projectInput.workspacePlugins),
    projectInput.projectType || 'general'
  );
  const existingModules = await readProjectModules(projectInput.id);
  const registry = buildModuleRegistry(projectType, {
    enabledModuleKeys: [
      ...(Array.isArray(projectInput.enabledModules) ? projectInput.enabledModules : []),
      ...normalizeWorkspacePlugins(projectInput.workspacePlugins),
      ...existingModules.filter((module) => module.enabled).map((module) => module.moduleKey),
    ],
    existingModules,
  });

  for (const module of registry) {
    await dbRun(`
      INSERT INTO project_modules
      (project_id, module_key, module_group, label, description, purpose_summary, enabled, is_core, sort_order, settings_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, module_key) DO UPDATE SET
        module_group = excluded.module_group,
        label = excluded.label,
        description = excluded.description,
        purpose_summary = excluded.purpose_summary,
        enabled = excluded.enabled,
        is_core = excluded.is_core,
        sort_order = excluded.sort_order,
        settings_json = excluded.settings_json,
        updated_at = CURRENT_TIMESTAMP
    `, [
      projectInput.id,
      module.moduleKey,
      module.group,
      module.label,
      module.description,
      module.purposeSummary || module.description || '',
      module.enabled ? 1 : 0,
      module.core ? 1 : 0,
      module.sortOrder,
      JSON.stringify(module.settings || {}),
    ]);
  }

  const keepKeys = registry.map((module) => module.moduleKey);
  const existingOnly = existingModules.map((module) => module.moduleKey).filter((key) => !keepKeys.includes(key));
  if (existingOnly.length) {
    const placeholders = existingOnly.map(() => '?').join(', ');
    await dbRun(
      `DELETE FROM project_modules WHERE project_id = ? AND module_key IN (${placeholders})`,
      [projectInput.id, ...existingOnly]
    );
  }

  const storedModules = await readProjectModules(projectInput.id);
  await syncProjectModuleRelationships(projectInput.id, storedModules);
  return storedModules;
}

async function syncProjectModuleRelationships(projectId, moduleRows = null) {
  const modules = Array.isArray(moduleRows) ? moduleRows : await readProjectModules(projectId);
  const enabledModules = modules.filter((module) => module && module.enabled);
  const enabledKeys = new Set(enabledModules.map((module) => module.moduleKey));
  const keepIds = [];

  for (const module of enabledModules) {
    const dependencies = getModuleDependencyKeys(module.moduleKey).filter((dependencyKey) => enabledKeys.has(dependencyKey));
    for (const dependencyKey of dependencies) {
      const relationshipId = `system-module-dep-${projectId}-${module.moduleKey}-${dependencyKey}`;
      keepIds.push(relationshipId);
      await saveEntityRelationship({
        id: relationshipId,
        projectId,
        sourceEntityType: 'module',
        sourceEntityId: module.moduleKey,
        relationshipType: 'depends_on',
        targetEntityType: 'module',
        targetEntityId: dependencyKey,
        metadata: {
          managedBy: 'project_modules',
          projectType: modules.find((entry) => entry.moduleKey === module.moduleKey)?.group === 'software' ? 'software' : 'general',
        },
      });
    }
  }

  const managedRelationships = await dbAll(
    `SELECT id FROM entity_relationships
     WHERE project_id = ?
       AND source_entity_type = 'module'
       AND target_entity_type = 'module'
       AND relationship_type = 'depends_on'
       AND id LIKE 'system-module-dep-%'`,
    [projectId]
  );

  for (const relationship of managedRelationships) {
    if (!keepIds.includes(relationship.id)) {
      await deleteEntityRelationship(projectId, relationship.id);
    }
  }
}

async function readProjects() {
  const rows = await dbAll('SELECT * FROM projects ORDER BY pinned DESC, name ASC');
  const moduleRows = await readProjectModuleRows(rows.map((row) => row.id));
  return rows.map((row) => hydrateProject(row, moduleRows.filter((module) => module.project_id === row.id)));
}

async function getProjectById(projectId) {
  const row = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!row) return null;
  const moduleRows = await readProjectModules(projectId);
  return hydrateProject(row, moduleRows.map((module) => ({
    project_id: module.projectId,
    module_key: module.moduleKey,
    label: module.label,
    description: module.description,
    purpose_summary: module.purposeSummary || '',
    module_group: module.group,
    enabled: module.enabled ? 1 : 0,
    is_core: module.core ? 1 : 0,
    sort_order: module.sortOrder,
    settings_json: JSON.stringify(module.settings || {}),
  })));
}

async function saveProject(project) {
  const mappingGroups = normalizeMappingGroups(project.mappingGroups, project.uploadMappings);
  const primaryGroup = mappingGroups[0];
  const uploadMappings = primaryGroup ? primaryGroup.uploadMappings : normalizeUploadMappings(project.uploadMappings);
  const integrations = normalizeProjectIntegrations(project.integrations);
  const projectType = resolveProjectType(
    project.projectType,
    Array.isArray(project.enabledModules) ? project.enabledModules : [],
    normalizeWorkspacePlugins(project.workspacePlugins),
    project.projectType || 'general'
  );
  const modules = buildModuleRegistry(projectType, {
    enabledModuleKeys: [
      ...(Array.isArray(project.enabledModules) ? project.enabledModules : []),
      ...normalizeWorkspacePlugins(project.workspacePlugins),
    ],
    existingModules: Array.isArray(project.modules) ? project.modules : [],
  });
  const enabledModules = modules.filter((module) => module.enabled).map((module) => module.moduleKey);
  const workspacePlugins = moduleKeysToLegacyWorkspacePlugins(enabledModules);

  await dbRun(`
    INSERT OR REPLACE INTO projects
    (id, path, absolute_path, name, description, parent_id, server_id, image_path,
     open_in_cursor, category, tags, links, date_added, type, open_in_cursor_admin,
     url, pinned, image_url, primary_action, project_type, workspace_plugins, upload_mappings, mapping_groups, integrations)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    project.id,
    project.path ?? null,
    project.absolutePath ?? null,
    project.name,
    project.description ?? '',
    project.parentId ?? null,
    project.serverId ?? null,
    project.imagePath ?? null,
    project.openInCursor ? 1 : 0,
    project.category ?? null,
    JSON.stringify(project.tags || []),
    JSON.stringify(normalizeLinks(project.links)),
    project.dateAdded ?? new Date().toISOString(),
    project.type ?? ((project.url && /^https?:\/\//i.test(String(project.url))) ? 'url' : 'folder'),
    project.openInCursorAdmin ? 1 : 0,
    project.url ?? null,
    project.pinned ? 1 : 0,
    project.imageUrl ?? null,
    normalizeProjectPrimaryAction(project.primaryAction),
    projectType,
    JSON.stringify(workspacePlugins),
    JSON.stringify(uploadMappings),
    JSON.stringify(mappingGroups),
    JSON.stringify(integrations),
  ]);

  await syncProjectModules({
    ...project,
    projectType,
    workspacePlugins,
    enabledModules,
    modules,
  });

  return getProjectById(project.id);
}

async function deleteProject(projectId) {
  await dbRun('DELETE FROM projects WHERE id = ?', [projectId]);
}

async function readCredentials() {
  const rows = await dbAll('SELECT * FROM credentials ORDER BY name ASC');
  return rows.map(hydrateCredential);
}

async function getCredentialById(id) {
  const row = await dbGet('SELECT * FROM credentials WHERE id = ?', [id]);
  return row ? hydrateCredential(row) : null;
}

async function saveCredential(credential) {
  await dbRun(`
    INSERT OR REPLACE INTO credentials
    (id, name, host, port, user, password, key_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    credential.id,
    credential.name,
    credential.host,
    credential.port ?? 22,
    credential.user,
    encryptSecret(credential.password ?? null),
    credential.keyPath ?? null,
  ]);

  return getCredentialById(credential.id);
}

async function deleteCredential(credentialId) {
  await dbRun('DELETE FROM credentials WHERE id = ?', [credentialId]);
}

async function readProjectTasks(projectId) {
  const rows = await dbAll(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC',
    [projectId]
  );
  return rows.map(hydrateTask);
}

async function readProjectWorkItems(projectId) {
  const [tasks, features, bugs] = await Promise.all([
    readProjectTasks(projectId),
    readFeatureItems(projectId, { includeArchived: true }),
    readBugItems(projectId, { includeArchived: true }),
  ]);

  const byTaskId = new Map();
  for (const feature of features) {
    if (feature.taskId) byTaskId.set(feature.taskId, { ...feature, extensionType: 'software_feature', workItemType: 'software_feature' });
  }
  for (const bug of bugs) {
    if (bug.taskId) byTaskId.set(bug.taskId, { ...bug, extensionType: 'software_bug', workItemType: 'software_bug' });
  }

  return tasks.map((task) => {
    const extended = byTaskId.get(task.id);
    if (!extended) {
      return {
        ...task,
        workItemId: task.id,
        extensionId: null,
        extensionType: null,
      };
    }
    return {
      ...task,
      ...extended,
      workItemId: task.id,
      extensionId: extended.id,
      baseTaskId: task.id,
      extensionType: extended.extensionType,
      workItemType: extended.workItemType,
      itemType: legacyItemTypeFromWorkItemType(extended.workItemType),
    };
  });
}

async function getWorkItemById(projectId, workItemId) {
  const task = await getTaskById(projectId, workItemId);
  if (!task) return null;
  const [features, bugs] = await Promise.all([
    readFeatureItems(projectId, { includeArchived: true }),
    readBugItems(projectId, { includeArchived: true }),
  ]);
  const feature = features.find((item) => item.taskId === task.id) || null;
  const bug = bugs.find((item) => item.taskId === task.id) || null;

  if (feature && feature.taskId === task.id) {
    return {
      ...task,
      ...feature,
      workItemId: task.id,
      extensionId: feature.id,
      baseTaskId: task.id,
      extensionType: 'software_feature',
      workItemType: 'software_feature',
      itemType: 'feature',
    };
  }
  if (bug && bug.taskId === task.id) {
    return {
      ...task,
      ...bug,
      workItemId: task.id,
      extensionId: bug.id,
      baseTaskId: task.id,
      extensionType: 'software_bug',
      workItemType: 'software_bug',
      itemType: 'bug',
    };
  }
  return {
    ...task,
    workItemId: task.id,
    extensionId: null,
    baseTaskId: task.id,
    extensionType: null,
  };
}

async function getTaskById(projectId, taskId) {
  const row = await dbGet('SELECT * FROM tasks WHERE project_id = ? AND id = ?', [projectId, taskId]);
  return row ? hydrateTask(row) : null;
}

async function nextTaskSortOrder(projectId) {
  const row = await dbGet('SELECT COALESCE(MAX(sort_order), -1) AS sortOrder FROM tasks WHERE project_id = ?', [projectId]);
  return row ? Number(row.sortOrder) + 1 : 0;
}

async function saveTask(taskInput) {
  const task = normalizeTaskPayload(taskInput);

  await dbRun(`
    INSERT INTO tasks
    (id, project_id, title, description, category, status, priority, created_at, updated_at,
     due_date, assigned_to, start_date, end_date, roadmap_phase_id, planning_bucket, item_type, work_item_type, dependency_ids, progress, milestone, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      status = excluded.status,
      priority = excluded.priority,
      updated_at = excluded.updated_at,
      due_date = excluded.due_date,
      assigned_to = excluded.assigned_to,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      roadmap_phase_id = excluded.roadmap_phase_id,
      planning_bucket = excluded.planning_bucket,
      item_type = excluded.item_type,
      work_item_type = excluded.work_item_type,
      dependency_ids = excluded.dependency_ids,
      progress = excluded.progress,
      milestone = excluded.milestone,
      sort_order = excluded.sort_order
  `, [
    task.id,
    task.projectId,
    task.title,
    task.description,
    task.category,
    task.status,
    task.priority,
    task.createdAt,
    task.updatedAt,
    task.dueDate,
    task.assignedTo,
    task.startDate,
    task.endDate,
    task.roadmapPhaseId,
    task.planningBucket,
    task.itemType,
    task.workItemType,
    JSON.stringify(task.dependencyIds || []),
    task.progress,
    task.milestone ? 1 : 0,
    task.sortOrder ?? 0,
  ]);

  if (task.workItemType === 'software_feature') {
    await dbRun(`
      UPDATE feature_items
         SET title = ?,
             summary = ?,
             status = ?,
             roadmap_phase_id = ?,
             work_item_type = ?,
             archived = ?,
             updated_at = ?
       WHERE project_id = ? AND task_id = ?
    `, [
      task.title,
      task.description || '',
      mapTaskStatusToFeatureStatus(task.status),
      task.roadmapPhaseId,
      task.workItemType,
      task.planningBucket === 'archived' ? 1 : 0,
      task.updatedAt,
      task.projectId,
      task.id,
    ]);
  } else if (task.workItemType === 'software_bug') {
    await dbRun(`
      UPDATE bug_items
         SET title = ?,
             summary = ?,
             current_behavior = ?,
             status = ?,
             severity = ?,
             work_item_type = ?,
             completed = ?,
             archived = ?,
             updated_at = ?
       WHERE project_id = ? AND task_id = ?
    `, [
      task.title,
      task.description || '',
      task.description || '',
      mapTaskStatusToBugStatus(task.status),
      task.priority || 'medium',
      task.workItemType,
      task.status === 'done' ? 1 : 0,
      (task.planningBucket === 'archived' || task.status === 'done') ? 1 : 0,
      task.updatedAt,
      task.projectId,
      task.id,
    ]);
  }

  return getTaskById(task.projectId, task.id);
}

async function deleteTask(projectId, taskId) {
  await dbRun('DELETE FROM feature_items WHERE project_id = ? AND task_id = ?', [projectId, taskId]);
  await dbRun('DELETE FROM bug_items WHERE project_id = ? AND task_id = ?', [projectId, taskId]);
  await dbRun('DELETE FROM tasks WHERE project_id = ? AND id = ?', [projectId, taskId]);
}

function hydrateRoadmapPhase(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code,
    name: row.name,
    summary: row.summary || '',
    goal: row.goal || '',
    status: row.status || 'planned',
    targetDate: row.target_date,
    afterPhaseId: row.after_phase_id || null,
    archived: Boolean(row.archived),
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hydrateFeatureItem(row) {
  const taskTitle = row.task_title !== undefined ? row.task_title : row.title;
  const taskDescription = row.task_description !== undefined ? row.task_description : row.summary;
  const taskStatus = row.task_status !== undefined ? row.task_status : row.status;
  const taskCreatedAt = row.task_created_at || row.created_at;
  const taskUpdatedAt = row.task_updated_at || row.updated_at;
  const workItemType = normalizeWorkItemType(row.task_work_item_type || row.work_item_type || row.task_item_type || 'software_feature', 'software_feature');
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code,
    title: taskTitle,
    summary: taskDescription || '',
    description: taskDescription || '',
    category: row.task_category || null,
    priority: row.task_priority || 'medium',
    dueDate: row.task_due_date || null,
    assignedTo: row.task_assigned_to || null,
    startDate: row.task_start_date || null,
    endDate: row.task_end_date || null,
    status: mapTaskStatusToFeatureStatus(taskStatus || 'todo'),
    taskStatus: taskStatus || 'todo',
    roadmapPhaseId: row.task_roadmap_phase_id || row.roadmap_phase_id,
    taskId: row.task_id,
    planningBucket: row.task_planning_bucket || 'considered',
    workItemType,
    itemType: legacyItemTypeFromWorkItemType(workItemType),
    dependencyIds: parseJson(row.task_dependency_ids, []),
    affectedModuleKeys: parseJson(row.affected_module_keys, []),
    progress: Number(row.task_progress || 0),
    milestone: Boolean(row.task_milestone),
    sortOrder: Number(row.task_sort_order || 0),
    archived: Boolean(row.archived),
    createdAt: taskCreatedAt,
    updatedAt: taskUpdatedAt,
  };
}

function hydrateBugItem(row) {
  const taskTitle = row.task_title !== undefined ? row.task_title : row.title;
  const taskDescription = row.task_description !== undefined ? row.task_description : (row.current_behavior || row.summary);
  const taskStatus = row.task_status !== undefined ? row.task_status : row.status;
  const mappedStatus = normalizeBugStatus(row.status || mapTaskStatusToBugStatus(taskStatus), 'open');
  const planningBucket = row.task_planning_bucket || row.planning_bucket || 'considered';
  const completed = row.completed !== undefined && row.completed !== null ? Boolean(row.completed) : isCompletedBugStatus(mappedStatus);
  const regressed = row.regressed !== undefined && row.regressed !== null ? Boolean(row.regressed) : isRegressedBugStatus(mappedStatus);
  const archived = isArchivedBugState(mappedStatus, planningBucket, Boolean(row.archived), completed);
  const workItemType = normalizeWorkItemType(row.task_work_item_type || row.work_item_type || row.task_item_type || 'software_bug', 'software_bug');
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code,
    title: taskTitle,
    summary: taskDescription || '',
    currentBehavior: taskDescription || row.summary || '',
    expectedBehavior: row.expected_behavior || '',
    category: row.task_category || null,
    severity: row.severity || 'medium',
    dueDate: row.task_due_date || null,
    assignedTo: row.task_assigned_to || null,
    startDate: row.task_start_date || null,
    endDate: row.task_end_date || null,
    status: mappedStatus,
    taskStatus: taskStatus || 'todo',
    taskId: row.task_id,
    roadmapPhaseId: row.task_roadmap_phase_id || null,
    planningBucket: archived ? 'archived' : planningBucket,
    workItemType,
    itemType: legacyItemTypeFromWorkItemType(workItemType),
    dependencyIds: parseJson(row.task_dependency_ids, []),
    affectedModuleKeys: parseJson(row.affected_module_keys, []),
    associationHints: String(row.association_hints || '').trim(),
    progress: Number(row.task_progress || 0),
    milestone: Boolean(row.task_milestone),
    sortOrder: Number(row.task_sort_order || 0),
    completed,
    regressed,
    archived,
    createdAt: row.task_created_at || row.created_at,
    updatedAt: row.task_updated_at || row.updated_at,
  };
}

function hydratePrdFragment(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    featureId: row.feature_id,
    code: row.code,
    title: row.title,
    markdown: row.markdown || '',
    mermaid: row.mermaid || '',
    status: row.status || 'draft',
    merged: Boolean(row.merged),
    mergedAt: row.merged_at || null,
    mergedFileName: row.merged_file_name || null,
    fileName: row.file_name || null,
    filePath: row.file_path || null,
    fileUpdatedAt: row.file_updated_at || null,
    fileMd5: row.file_md5 || '',
    dbMd5: row.db_md5 || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hydrateRoadmapFragment(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceFeatureId: row.source_feature_id || null,
    sourcePhaseId: row.source_phase_id || null,
    code: row.code,
    title: row.title,
    markdown: row.markdown || '',
    mermaid: row.mermaid || '',
    payload: parseJson(row.payload_json, null),
    status: row.status || 'draft',
    merged: Boolean(row.merged),
    mergedAt: row.merged_at || null,
    integratedAt: row.integrated_at || null,
    fileName: row.file_name || null,
    filePath: row.file_path || null,
    fileUpdatedAt: row.file_updated_at || null,
    fileMd5: row.file_md5 || '',
    dbMd5: row.db_md5 || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function nextDocumentTrackingCode(projectId, tableName, prefix) {
  const row = await dbGet(`SELECT code FROM ${tableName} WHERE project_id = ? ORDER BY rowid DESC LIMIT 1`, [projectId]);
  const nextNumber = row && row.code
    ? Number(String(row.code).replace(/^[A-Z-]+/, '')) + 1
    : 1;
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

async function readRoadmapPhases(projectId, options = {}) {
  const includeArchived = !!options.includeArchived;
  const rows = await dbAll(
    `SELECT * FROM roadmap_phases WHERE project_id = ? ${includeArchived ? '' : 'AND archived = 0'} ORDER BY archived ASC, sort_order ASC, created_at ASC`,
    [projectId]
  );
  return rows.map(hydrateRoadmapPhase);
}

async function getRoadmapPhaseById(projectId, phaseId) {
  const row = await dbGet('SELECT * FROM roadmap_phases WHERE project_id = ? AND id = ?', [projectId, phaseId]);
  return row ? hydrateRoadmapPhase(row) : null;
}

async function nextRoadmapPhaseSortOrder(projectId) {
  const row = await dbGet('SELECT COALESCE(MAX(sort_order), -1) AS sortOrder FROM roadmap_phases WHERE project_id = ?', [projectId]);
  return row ? Number(row.sortOrder) + 1 : 0;
}

async function saveRoadmapPhase(phaseInput) {
  const existing = phaseInput.id ? await getRoadmapPhaseById(phaseInput.projectId, phaseInput.id) : null;
  const now = new Date().toISOString();
  const phase = {
    id: phaseInput.id || `phase-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId: phaseInput.projectId,
    code: existing ? existing.code : await nextDocumentTrackingCode(phaseInput.projectId, 'roadmap_phases', 'PHASE'),
    name: String(phaseInput.name || existing?.name || '').trim(),
    summary: String(phaseInput.summary ?? existing?.summary ?? ''),
    goal: String(phaseInput.goal ?? existing?.goal ?? ''),
    status: String(phaseInput.status || existing?.status || 'planned').trim() || 'planned',
    targetDate: phaseInput.targetDate ?? existing?.targetDate ?? null,
    afterPhaseId: phaseInput.afterPhaseId !== undefined ? (phaseInput.afterPhaseId || null) : (existing?.afterPhaseId || null),
    archived: phaseInput.archived !== undefined ? !!phaseInput.archived : !!existing?.archived,
    sortOrder: Number.isFinite(Number(phaseInput.sortOrder ?? existing?.sortOrder)) ? Number(phaseInput.sortOrder ?? existing?.sortOrder) : 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await dbRun(`
    INSERT INTO roadmap_phases
    (id, project_id, code, name, summary, goal, status, target_date, after_phase_id, archived, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      name = excluded.name,
      summary = excluded.summary,
      goal = excluded.goal,
      status = excluded.status,
      target_date = excluded.target_date,
      after_phase_id = excluded.after_phase_id,
      archived = excluded.archived,
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at
  `, [
    phase.id,
    phase.projectId,
    phase.code,
    phase.name,
    phase.summary,
    phase.goal,
    phase.status,
    phase.targetDate,
    phase.afterPhaseId,
    phase.archived ? 1 : 0,
    phase.sortOrder,
    phase.createdAt,
    phase.updatedAt,
  ]);

  return getRoadmapPhaseById(phase.projectId, phase.id);
}

async function deleteRoadmapPhase(projectId, phaseId) {
  await dbRun('UPDATE tasks SET roadmap_phase_id = NULL WHERE project_id = ? AND roadmap_phase_id = ?', [projectId, phaseId]);
  await dbRun('UPDATE feature_items SET roadmap_phase_id = NULL WHERE project_id = ? AND roadmap_phase_id = ?', [projectId, phaseId]);
  await dbRun('UPDATE roadmap_phases SET after_phase_id = NULL WHERE project_id = ? AND after_phase_id = ?', [projectId, phaseId]);
  await dbRun('DELETE FROM roadmap_phases WHERE project_id = ? AND id = ?', [projectId, phaseId]);
}

async function readRoadmapFragments(projectId, options = {}) {
  const includeMerged = !!options.includeMerged;
  const rows = await dbAll(
    `SELECT * FROM roadmap_fragments WHERE project_id = ? ${includeMerged ? '' : 'AND merged = 0'} ORDER BY merged ASC, datetime(updated_at) DESC, rowid DESC`,
    [projectId]
  );
  return rows.map(hydrateRoadmapFragment);
}

async function getRoadmapFragmentById(projectId, fragmentId) {
  const row = await dbGet('SELECT * FROM roadmap_fragments WHERE project_id = ? AND id = ?', [projectId, fragmentId]);
  return row ? hydrateRoadmapFragment(row) : null;
}

async function getRoadmapFragmentByCode(projectId, code) {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) return null;
  const row = await dbGet(
    'SELECT * FROM roadmap_fragments WHERE project_id = ? AND lower(trim(code)) = lower(trim(?)) ORDER BY datetime(updated_at) DESC, rowid DESC LIMIT 1',
    [projectId, normalizedCode]
  );
  return row ? hydrateRoadmapFragment(row) : null;
}

async function saveRoadmapFragment(fragmentInput) {
  const existing = fragmentInput.id
    ? await getRoadmapFragmentById(fragmentInput.projectId, fragmentInput.id)
    : await getRoadmapFragmentByCode(fragmentInput.projectId, fragmentInput.code || null);
  const now = new Date().toISOString();
  const fragment = {
    id: fragmentInput.id || existing?.id || `roadmap-fragment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId: fragmentInput.projectId,
    sourceFeatureId: fragmentInput.sourceFeatureId !== undefined ? fragmentInput.sourceFeatureId : (existing?.sourceFeatureId || null),
    sourcePhaseId: fragmentInput.sourcePhaseId !== undefined ? fragmentInput.sourcePhaseId : (existing?.sourcePhaseId || null),
    code: String(fragmentInput.code || existing?.code || '').trim()
      || await nextDocumentTrackingCode(fragmentInput.projectId, 'roadmap_fragments', 'RMAPFRAG'),
    title: String(fragmentInput.title || existing?.title || '').trim(),
    markdown: String(fragmentInput.markdown ?? existing?.markdown ?? ''),
    mermaid: String(fragmentInput.mermaid ?? existing?.mermaid ?? ''),
    payload: fragmentInput.payload !== undefined ? fragmentInput.payload : (existing?.payload || null),
    status: String(fragmentInput.status || existing?.status || 'draft').trim() || 'draft',
    merged: fragmentInput.merged !== undefined ? !!fragmentInput.merged : !!existing?.merged,
    mergedAt: fragmentInput.mergedAt !== undefined ? fragmentInput.mergedAt : (existing?.mergedAt || null),
    integratedAt: fragmentInput.integratedAt !== undefined ? fragmentInput.integratedAt : (existing?.integratedAt || null),
    fileName: fragmentInput.fileName !== undefined ? fragmentInput.fileName : (existing?.fileName || null),
    filePath: fragmentInput.filePath !== undefined ? fragmentInput.filePath : (existing?.filePath || null),
    fileUpdatedAt: fragmentInput.fileUpdatedAt !== undefined ? fragmentInput.fileUpdatedAt : (existing?.fileUpdatedAt || null),
    fileMd5: fragmentInput.fileMd5 !== undefined ? fragmentInput.fileMd5 : (existing?.fileMd5 || ''),
    dbMd5: fragmentInput.dbMd5 !== undefined ? fragmentInput.dbMd5 : (existing?.dbMd5 || ''),
    createdAt: existing?.createdAt || now,
    updatedAt: fragmentInput.updatedAt || now,
  };

  await dbRun(`
    INSERT INTO roadmap_fragments
    (id, project_id, source_feature_id, source_phase_id, code, title, markdown, mermaid, payload_json, status, merged, merged_at, integrated_at, file_name, file_path, file_updated_at, file_md5, db_md5, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      source_feature_id = excluded.source_feature_id,
      source_phase_id = excluded.source_phase_id,
      code = excluded.code,
      title = excluded.title,
      markdown = excluded.markdown,
      mermaid = excluded.mermaid,
      payload_json = excluded.payload_json,
      status = excluded.status,
      merged = excluded.merged,
      merged_at = excluded.merged_at,
      integrated_at = excluded.integrated_at,
      file_name = excluded.file_name,
      file_path = excluded.file_path,
      file_updated_at = excluded.file_updated_at,
      file_md5 = excluded.file_md5,
      db_md5 = excluded.db_md5,
      updated_at = excluded.updated_at
  `, [
    fragment.id,
    fragment.projectId,
    fragment.sourceFeatureId,
    fragment.sourcePhaseId,
    fragment.code,
    fragment.title,
    fragment.markdown,
    fragment.mermaid,
    JSON.stringify(fragment.payload || null),
    fragment.status,
    fragment.merged ? 1 : 0,
    fragment.mergedAt,
    fragment.integratedAt,
    fragment.fileName,
    fragment.filePath,
    fragment.fileUpdatedAt,
    fragment.fileMd5,
    fragment.dbMd5,
    fragment.createdAt,
    fragment.updatedAt,
  ]);

  return getRoadmapFragmentById(fragment.projectId, fragment.id);
}

async function deleteRoadmapFragment(projectId, fragmentId) {
  await dbRun('DELETE FROM roadmap_fragments WHERE project_id = ? AND id = ?', [projectId, fragmentId]);
}

async function readFeatureItems(projectId, options = {}) {
  const includeArchived = !!options.includeArchived;
  const rows = await dbAll(
    `SELECT f.*,
            t.title AS task_title,
            t.description AS task_description,
            t.category AS task_category,
            t.priority AS task_priority,
            t.status AS task_status,
            t.due_date AS task_due_date,
            t.assigned_to AS task_assigned_to,
            t.start_date AS task_start_date,
            t.end_date AS task_end_date,
            t.roadmap_phase_id AS task_roadmap_phase_id,
            t.planning_bucket AS task_planning_bucket,
            t.item_type AS task_item_type,
            t.work_item_type AS task_work_item_type,
            t.dependency_ids AS task_dependency_ids,
            t.progress AS task_progress,
            t.milestone AS task_milestone,
            t.sort_order AS task_sort_order,
            t.created_at AS task_created_at,
            t.updated_at AS task_updated_at
       FROM feature_items f
       LEFT JOIN tasks t ON t.id = f.task_id
      WHERE f.project_id = ? ${includeArchived ? '' : 'AND f.archived = 0'}
      ORDER BY f.archived ASC, datetime(COALESCE(t.updated_at, f.updated_at)) DESC, f.rowid DESC`,
    [projectId]
  );
  return rows.map(hydrateFeatureItem);
}

async function getFeatureItemById(projectId, featureId) {
  const row = await dbGet(`
    SELECT f.*,
           t.title AS task_title,
           t.description AS task_description,
           t.category AS task_category,
           t.priority AS task_priority,
           t.status AS task_status,
           t.due_date AS task_due_date,
           t.assigned_to AS task_assigned_to,
           t.start_date AS task_start_date,
           t.end_date AS task_end_date,
           t.roadmap_phase_id AS task_roadmap_phase_id,
           t.planning_bucket AS task_planning_bucket,
           t.item_type AS task_item_type,
           t.work_item_type AS task_work_item_type,
           t.dependency_ids AS task_dependency_ids,
           t.progress AS task_progress,
           t.milestone AS task_milestone,
           t.sort_order AS task_sort_order,
           t.created_at AS task_created_at,
           t.updated_at AS task_updated_at
      FROM feature_items f
      LEFT JOIN tasks t ON t.id = f.task_id
     WHERE f.project_id = ? AND f.id = ?
  `, [projectId, featureId]);
  return row ? hydrateFeatureItem(row) : null;
}

async function saveFeatureItem(featureInput) {
  const existing = featureInput.id ? await getFeatureItemById(featureInput.projectId, featureInput.id) : null;
  const now = new Date().toISOString();
  const taskId = existing?.taskId
    || ((featureInput.id && featureInput.taskId) ? featureInput.taskId : null)
    || `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const archived = featureInput.archived !== undefined ? !!featureInput.archived : !!existing?.archived;
  const planningBucket = archived
    ? 'archived'
    : (featureInput.planningBucket
    ?? existing?.planningBucket
    ?? (featureInput.roadmapPhaseId ? 'phase' : 'considered'));
  const roadmapPhaseId = planningBucket === 'phase'
    ? (featureInput.roadmapPhaseId ?? existing?.roadmapPhaseId ?? null)
    : null;
  const taskStatus = mapFeatureStatusToTaskStatus(featureInput.status ?? featureInput.taskStatus ?? existing?.status ?? existing?.taskStatus ?? 'planned');
  await saveTask({
    id: taskId,
    projectId: featureInput.projectId,
    title: featureInput.title ?? existing?.title ?? '',
    description: featureInput.summary ?? featureInput.description ?? existing?.summary ?? existing?.description ?? '',
    category: featureInput.category ?? existing?.category ?? null,
    status: taskStatus,
    roadmapPhaseId,
    planningBucket,
    workItemType: 'software_feature',
    priority: featureInput.priority ?? existing?.priority ?? 'medium',
    createdAt: existing?.createdAt || now,
    assignedTo: featureInput.assignedTo ?? existing?.assignedTo ?? null,
    dueDate: featureInput.dueDate ?? existing?.dueDate ?? null,
    startDate: featureInput.startDate ?? existing?.startDate ?? null,
    endDate: featureInput.endDate ?? existing?.endDate ?? null,
    dependencyIds: featureInput.dependencyIds ?? existing?.dependencyIds ?? [],
    progress: featureInput.progress ?? existing?.progress ?? ((taskStatus === 'done') ? 100 : ((taskStatus === 'in_progress') ? 50 : 0)),
    milestone: featureInput.milestone ?? existing?.milestone ?? false,
    sortOrder: featureInput.sortOrder ?? existing?.sortOrder ?? 0,
  });
  const feature = {
    id: featureInput.id || `feature-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId: featureInput.projectId,
    code: existing ? existing.code : await nextDocumentTrackingCode(featureInput.projectId, 'feature_items', 'FEAT'),
    title: String(featureInput.title || existing?.title || '').trim(),
    summary: String(featureInput.summary ?? featureInput.description ?? existing?.summary ?? existing?.description ?? ''),
    status: mapTaskStatusToFeatureStatus(taskStatus),
    roadmapPhaseId,
    taskId,
    workItemType: 'software_feature',
    affectedModuleKeys: Array.isArray(featureInput.affectedModuleKeys)
      ? featureInput.affectedModuleKeys.map((item) => String(item || '').trim()).filter(Boolean)
      : (existing?.affectedModuleKeys || []),
    archived,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await dbRun(`
    INSERT INTO feature_items
    (id, project_id, code, title, summary, status, roadmap_phase_id, task_id, work_item_type, affected_module_keys, archived, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      status = excluded.status,
      roadmap_phase_id = excluded.roadmap_phase_id,
      task_id = excluded.task_id,
      work_item_type = excluded.work_item_type,
      affected_module_keys = excluded.affected_module_keys,
      archived = excluded.archived,
      updated_at = excluded.updated_at
  `, [
    feature.id,
    feature.projectId,
    feature.code,
    feature.title,
    feature.summary,
    feature.status,
    feature.roadmapPhaseId,
    feature.taskId,
    feature.workItemType,
    JSON.stringify(feature.affectedModuleKeys || []),
    feature.archived ? 1 : 0,
    feature.createdAt,
    feature.updatedAt,
  ]);

  return getFeatureItemById(feature.projectId, feature.id);
}

async function deleteFeatureItem(projectId, featureId) {
  const existing = await getFeatureItemById(projectId, featureId);
  await dbRun('DELETE FROM feature_items WHERE project_id = ? AND id = ?', [projectId, featureId]);
  if (existing && existing.taskId) {
    await deleteTask(projectId, existing.taskId);
  }
}

async function readPrdFragments(projectId, options = {}) {
  const includeMerged = !!options.includeMerged;
  const rows = await dbAll(
    `SELECT * FROM prd_fragments WHERE project_id = ? ${includeMerged ? '' : 'AND merged = 0'} ORDER BY merged ASC, datetime(updated_at) DESC, rowid DESC`,
    [projectId]
  );
  return rows.map(hydratePrdFragment);
}

async function getPrdFragmentById(projectId, fragmentId) {
  const row = await dbGet('SELECT * FROM prd_fragments WHERE project_id = ? AND id = ?', [projectId, fragmentId]);
  return row ? hydratePrdFragment(row) : null;
}

async function getPrdFragmentByFeatureId(projectId, featureId) {
  if (!featureId) return null;
  const row = await dbGet('SELECT * FROM prd_fragments WHERE project_id = ? AND feature_id = ?', [projectId, featureId]);
  return row ? hydratePrdFragment(row) : null;
}

async function getPrdFragmentByCode(projectId, code) {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) return null;
  const row = await dbGet(
    'SELECT * FROM prd_fragments WHERE project_id = ? AND lower(trim(code)) = lower(trim(?)) ORDER BY datetime(updated_at) DESC, rowid DESC LIMIT 1',
    [projectId, normalizedCode]
  );
  return row ? hydratePrdFragment(row) : null;
}

async function savePrdFragment(fragmentInput) {
  const existing = fragmentInput.id
    ? await getPrdFragmentById(fragmentInput.projectId, fragmentInput.id)
    : await getPrdFragmentByFeatureId(fragmentInput.projectId, fragmentInput.featureId || null)
      || await getPrdFragmentByCode(fragmentInput.projectId, fragmentInput.code || null);
  const now = new Date().toISOString();
  const fragment = {
    id: fragmentInput.id || existing?.id || `prd-fragment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId: fragmentInput.projectId,
    featureId: fragmentInput.featureId !== undefined ? fragmentInput.featureId : (existing?.featureId || null),
    code: String(fragmentInput.code || existing?.code || '').trim()
      || await nextDocumentTrackingCode(fragmentInput.projectId, 'prd_fragments', 'PRDFRAG'),
    title: String(fragmentInput.title || existing?.title || '').trim(),
    markdown: String(fragmentInput.markdown ?? existing?.markdown ?? ''),
    mermaid: String(fragmentInput.mermaid ?? existing?.mermaid ?? ''),
    status: String(fragmentInput.status || existing?.status || 'draft').trim() || 'draft',
    merged: fragmentInput.merged !== undefined ? !!fragmentInput.merged : !!existing?.merged,
    mergedAt: fragmentInput.mergedAt !== undefined ? fragmentInput.mergedAt : (existing?.mergedAt || null),
    mergedFileName: fragmentInput.mergedFileName !== undefined ? fragmentInput.mergedFileName : (existing?.mergedFileName || null),
    fileName: fragmentInput.fileName !== undefined ? fragmentInput.fileName : (existing?.fileName || null),
    filePath: fragmentInput.filePath !== undefined ? fragmentInput.filePath : (existing?.filePath || null),
    fileUpdatedAt: fragmentInput.fileUpdatedAt !== undefined ? fragmentInput.fileUpdatedAt : (existing?.fileUpdatedAt || null),
    fileMd5: fragmentInput.fileMd5 !== undefined ? fragmentInput.fileMd5 : (existing?.fileMd5 || ''),
    dbMd5: fragmentInput.dbMd5 !== undefined ? fragmentInput.dbMd5 : (existing?.dbMd5 || ''),
    createdAt: existing?.createdAt || now,
    updatedAt: fragmentInput.updatedAt || now,
  };

  await dbRun(`
    INSERT INTO prd_fragments
    (id, project_id, feature_id, code, title, markdown, mermaid, status, merged, merged_at, merged_file_name, file_name, file_path, file_updated_at, file_md5, db_md5, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      feature_id = excluded.feature_id,
      code = excluded.code,
      title = excluded.title,
      markdown = excluded.markdown,
      mermaid = excluded.mermaid,
      status = excluded.status,
      merged = excluded.merged,
      merged_at = excluded.merged_at,
      merged_file_name = excluded.merged_file_name,
      file_name = excluded.file_name,
      file_path = excluded.file_path,
      file_updated_at = excluded.file_updated_at,
      file_md5 = excluded.file_md5,
      db_md5 = excluded.db_md5,
      updated_at = excluded.updated_at
  `, [
    fragment.id,
    fragment.projectId,
    fragment.featureId,
    fragment.code,
    fragment.title,
    fragment.markdown,
    fragment.mermaid,
    fragment.status,
    fragment.merged ? 1 : 0,
    fragment.mergedAt,
    fragment.mergedFileName,
    fragment.fileName,
    fragment.filePath,
    fragment.fileUpdatedAt,
    fragment.fileMd5,
    fragment.dbMd5,
    fragment.createdAt,
    fragment.updatedAt,
  ]);

  return getPrdFragmentById(fragment.projectId, fragment.id);
}

async function deletePrdFragment(projectId, fragmentId) {
  await dbRun('DELETE FROM prd_fragments WHERE project_id = ? AND id = ?', [projectId, fragmentId]);
}

async function readBugItems(projectId, options = {}) {
  const includeArchived = !!options.includeArchived;
  const rows = await dbAll(
    `SELECT b.*,
            t.title AS task_title,
            t.description AS task_description,
            t.category AS task_category,
            t.priority AS task_priority,
            t.status AS task_status,
            t.due_date AS task_due_date,
            t.assigned_to AS task_assigned_to,
            t.start_date AS task_start_date,
            t.end_date AS task_end_date,
            t.roadmap_phase_id AS task_roadmap_phase_id,
            t.planning_bucket AS task_planning_bucket,
            t.item_type AS task_item_type,
            t.work_item_type AS task_work_item_type,
            t.dependency_ids AS task_dependency_ids,
            t.progress AS task_progress,
            t.milestone AS task_milestone,
            t.sort_order AS task_sort_order,
            t.created_at AS task_created_at,
            t.updated_at AS task_updated_at
       FROM bug_items b
       LEFT JOIN tasks t ON t.id = b.task_id
      WHERE b.project_id = ? ${includeArchived ? '' : 'AND b.archived = 0'}
      ORDER BY b.archived ASC, datetime(COALESCE(t.updated_at, b.updated_at)) DESC, b.rowid DESC`,
    [projectId]
  );
  return rows.map(hydrateBugItem);
}

async function getBugItemById(projectId, bugId) {
  const row = await dbGet(`
    SELECT b.*,
           t.title AS task_title,
           t.description AS task_description,
           t.category AS task_category,
           t.priority AS task_priority,
           t.status AS task_status,
           t.due_date AS task_due_date,
           t.assigned_to AS task_assigned_to,
           t.start_date AS task_start_date,
           t.end_date AS task_end_date,
           t.roadmap_phase_id AS task_roadmap_phase_id,
           t.planning_bucket AS task_planning_bucket,
           t.item_type AS task_item_type,
           t.work_item_type AS task_work_item_type,
           t.dependency_ids AS task_dependency_ids,
           t.progress AS task_progress,
           t.milestone AS task_milestone,
           t.sort_order AS task_sort_order,
           t.created_at AS task_created_at,
           t.updated_at AS task_updated_at
      FROM bug_items b
      LEFT JOIN tasks t ON t.id = b.task_id
     WHERE b.project_id = ? AND b.id = ?
  `, [projectId, bugId]);
  return row ? hydrateBugItem(row) : null;
}

async function saveBugItem(bugInput) {
  const existing = bugInput.id ? await getBugItemById(bugInput.projectId, bugInput.id) : null;
  const now = new Date().toISOString();
  const normalizedBugStatus = normalizeBugStatus(
    bugInput.status ?? bugInput.taskStatus ?? existing?.status ?? existing?.taskStatus ?? 'open',
    'open'
  );
  const taskId = existing?.taskId
    || ((bugInput.id && bugInput.taskId) ? bugInput.taskId : null)
    || `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const explicitCompleted = bugInput.completed !== undefined ? !!bugInput.completed : undefined;
  const explicitArchived = bugInput.archived !== undefined ? !!bugInput.archived : undefined;
  const inputPlanningBucket = bugInput.planningBucket ?? existing?.planningBucket ?? 'considered';
  const hasExplicitActiveStateChange = (
    bugInput.status !== undefined
    || bugInput.taskStatus !== undefined
    || bugInput.planningBucket !== undefined
    || bugInput.roadmapPhaseId !== undefined
  )
    && !isCompletedBugStatus(normalizedBugStatus)
    && String(inputPlanningBucket || '').trim().toLowerCase() !== 'archived';
  const completed = explicitCompleted !== undefined
    ? explicitCompleted
    : ((bugInput.status !== undefined || bugInput.taskStatus !== undefined)
      ? isCompletedBugStatus(normalizedBugStatus)
      : !!existing?.completed);
  const archived = explicitArchived !== undefined
    ? explicitArchived
    : (hasExplicitActiveStateChange
      ? false
      : isArchivedBugState(normalizedBugStatus, inputPlanningBucket, !!existing?.archived, completed));
  const statusWasExplicitlySet = bugInput.status !== undefined || bugInput.taskStatus !== undefined;
  const planningBucket = archived
    ? 'archived'
    : inputPlanningBucket;
  const roadmapPhaseId = planningBucket === 'phase'
    ? (bugInput.roadmapPhaseId ?? existing?.roadmapPhaseId ?? null)
    : null;
  const taskStatus = mapBugStatusToTaskStatus(normalizedBugStatus);
  await saveTask({
    id: taskId,
    projectId: bugInput.projectId,
    title: bugInput.title ?? existing?.title ?? '',
    description: bugInput.currentBehavior ?? bugInput.summary ?? existing?.currentBehavior ?? existing?.summary ?? '',
    category: bugInput.category ?? existing?.category ?? null,
    status: taskStatus,
    roadmapPhaseId,
    planningBucket,
    workItemType: 'software_bug',
    priority: bugInput.severity ?? existing?.severity ?? 'medium',
    createdAt: existing?.createdAt || now,
    assignedTo: bugInput.assignedTo ?? existing?.assignedTo ?? null,
    dueDate: bugInput.dueDate ?? existing?.dueDate ?? null,
    startDate: bugInput.startDate ?? existing?.startDate ?? null,
    endDate: bugInput.endDate ?? existing?.endDate ?? null,
    dependencyIds: bugInput.dependencyIds ?? existing?.dependencyIds ?? [],
    progress: bugInput.progress ?? existing?.progress ?? (completed ? 100 : (taskStatus === 'in_progress' ? 50 : 0)),
    milestone: bugInput.milestone ?? existing?.milestone ?? false,
    sortOrder: bugInput.sortOrder ?? existing?.sortOrder ?? 0,
  });
  const bug = {
    id: bugInput.id || `bug-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId: bugInput.projectId,
    code: existing ? existing.code : await nextDocumentTrackingCode(bugInput.projectId, 'bug_items', 'BUG'),
    title: String(bugInput.title || existing?.title || '').trim(),
    summary: String(bugInput.summary ?? bugInput.currentBehavior ?? existing?.summary ?? existing?.currentBehavior ?? ''),
    currentBehavior: String(bugInput.currentBehavior ?? existing?.currentBehavior ?? bugInput.summary ?? existing?.summary ?? ''),
    expectedBehavior: String(bugInput.expectedBehavior ?? existing?.expectedBehavior ?? ''),
    severity: String(bugInput.severity || existing?.severity || 'medium').trim() || 'medium',
    status: normalizedBugStatus,
    taskId,
    workItemType: 'software_bug',
    affectedModuleKeys: Array.isArray(bugInput.affectedModuleKeys)
      ? bugInput.affectedModuleKeys.map((item) => String(item || '').trim()).filter(Boolean)
      : (existing?.affectedModuleKeys || []),
    associationHints: String(bugInput.associationHints ?? existing?.associationHints ?? '').trim(),
    completed,
    regressed: bugInput.regressed !== undefined
      ? !!bugInput.regressed
      : (statusWasExplicitlySet ? isRegressedBugStatus(normalizedBugStatus) : !!existing?.regressed),
    archived,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await dbRun(`
    INSERT INTO bug_items
    (id, project_id, code, title, summary, current_behavior, expected_behavior, severity, status, task_id, work_item_type, affected_module_keys, association_hints, completed, regressed, archived, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      current_behavior = excluded.current_behavior,
      expected_behavior = excluded.expected_behavior,
      severity = excluded.severity,
      status = excluded.status,
      task_id = excluded.task_id,
      work_item_type = excluded.work_item_type,
      affected_module_keys = excluded.affected_module_keys,
      association_hints = excluded.association_hints,
      completed = excluded.completed,
      regressed = excluded.regressed,
      archived = excluded.archived,
      updated_at = excluded.updated_at
  `, [
    bug.id,
    bug.projectId,
    bug.code,
    bug.title,
    bug.summary,
    bug.currentBehavior,
    bug.expectedBehavior,
    bug.severity,
    bug.status,
    bug.taskId,
    bug.workItemType,
    JSON.stringify(bug.affectedModuleKeys || []),
    bug.associationHints,
    bug.completed ? 1 : 0,
    bug.regressed ? 1 : 0,
    bug.archived ? 1 : 0,
    bug.createdAt,
    bug.updatedAt,
  ]);

  return getBugItemById(bug.projectId, bug.id);
}

async function deleteBugItem(projectId, bugId) {
  const existing = await getBugItemById(projectId, bugId);
  await dbRun('DELETE FROM bug_items WHERE project_id = ? AND id = ?', [projectId, bugId]);
  if (existing && existing.taskId) {
    await deleteTask(projectId, existing.taskId);
  }
}

async function readProjectDocument(projectId, docType) {
  const row = await dbGet('SELECT * FROM project_md_documents WHERE project_id = ? AND doc_type = ?', [projectId, docType]);
  return row ? {
    projectId: row.project_id,
    docType: row.doc_type,
    title: row.title || '',
    moduleKey: row.module_key || row.doc_type,
    templateName: row.template_name || '',
    templateVersion: row.template_version || '',
    sourceOfTruth: row.source_of_truth || 'database',
    markdown: row.markdown || '',
    mermaid: row.mermaid || '',
    editorState: parseJson(row.editor_state, null),
    updatedAt: row.updated_at,
    filePath: row.file_path || null,
    fileUpdatedAt: row.file_updated_at || null,
    fileMd5: row.file_md5 || '',
    dbMd5: row.db_md5 || '',
  } : null;
}

async function readProjectTemplateFiles(projectId) {
  const rows = await dbAll(
    'SELECT * FROM project_template_files WHERE project_id = ? ORDER BY template_kind, template_name',
    [projectId]
  );
  return rows.map((row) => ({
    projectId: row.project_id,
    templateName: row.template_name,
    templateKind: row.template_kind || 'document',
    templateVersion: row.template_version || '',
    templateLastUpdated: row.template_last_updated || '',
    sourceMd5: row.source_md5 || '',
    targetMd5: row.target_md5 || '',
    targetPath: row.target_path || '',
    targetUpdatedAt: row.target_updated_at || '',
    replaced: Boolean(row.replaced),
    missing: Boolean(row.missing),
    syncedAt: row.synced_at || '',
  }));
}

async function recordProjectTemplateFiles(projectId, records = []) {
  const list = Array.isArray(records) ? records : [];
  for (const record of list) {
    if (!record || !record.templateName) continue;
    await dbRun(`
      INSERT INTO project_template_files (
        project_id,
        template_name,
        template_kind,
        template_version,
        template_last_updated,
        source_md5,
        target_md5,
        target_path,
        target_updated_at,
        replaced,
        missing,
        synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id, template_name) DO UPDATE SET
        template_kind = excluded.template_kind,
        template_version = excluded.template_version,
        template_last_updated = excluded.template_last_updated,
        source_md5 = excluded.source_md5,
        target_md5 = excluded.target_md5,
        target_path = excluded.target_path,
        target_updated_at = excluded.target_updated_at,
        replaced = excluded.replaced,
        missing = excluded.missing,
        synced_at = excluded.synced_at
    `, [
      projectId,
      record.templateName,
      record.templateKind || 'document',
      record.templateVersion || '',
      record.templateLastUpdated || '',
      record.sourceMd5 || '',
      record.targetMd5 || '',
      record.targetPath || '',
      record.targetUpdatedAt || '',
      record.replaced ? 1 : 0,
      record.missing ? 1 : 0,
      record.syncedAt || new Date().toISOString(),
    ]);
  }
  return readProjectTemplateFiles(projectId);
}

async function saveProjectDocument(projectId, docType, input = {}) {
  const updatedAt = input.updatedAt || new Date().toISOString();
  const definition = getModuleDefinition(input.moduleKey || docType);
  const project = await getProjectById(projectId);
  const changelogDocument = String(docType || '').trim().toLowerCase() === 'changelog'
    ? null
    : await readProjectDocument(projectId, 'changelog');
  const normalizedEditorState = input.editorState && typeof input.editorState === 'object'
    ? normalizeDocumentEditorStateForStorage(
        project,
        docType,
        backfillDocumentEditorStateFromChangelog(project, docType, input.editorState, changelogDocument?.editorState || null)
      )
    : null;
  await dbRun(`
    INSERT INTO project_md_documents (project_id, doc_type, title, module_key, template_name, template_version, source_of_truth, markdown, mermaid, editor_state, updated_at, file_path, file_updated_at, file_md5, db_md5)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, doc_type) DO UPDATE SET
      title = excluded.title,
      module_key = excluded.module_key,
      template_name = excluded.template_name,
      template_version = excluded.template_version,
      source_of_truth = excluded.source_of_truth,
      markdown = excluded.markdown,
      mermaid = excluded.mermaid,
      editor_state = excluded.editor_state,
      updated_at = excluded.updated_at,
      file_path = excluded.file_path,
      file_updated_at = excluded.file_updated_at,
      file_md5 = excluded.file_md5,
      db_md5 = excluded.db_md5
  `, [
    projectId,
    docType,
    input.title || definition?.label || String(docType || '').toUpperCase(),
    input.moduleKey || definition?.key || docType,
    input.templateName || (definition?.documentType ? `${String(definition.documentType).toUpperCase()}.template.md` : ''),
    input.templateVersion || '',
      input.sourceOfTruth || 'database',
      input.markdown || '',
      input.mermaid || '',
      normalizedEditorState ? JSON.stringify(normalizedEditorState) : '',
      updatedAt,
    input.filePath || null,
    input.fileUpdatedAt || null,
    input.fileMd5 || '',
    input.dbMd5 || '',
  ]);

  return readProjectDocument(projectId, docType);
}

async function readEntityRelationships(projectId, filters = {}) {
  const where = ['project_id = ?'];
  const params = [projectId];
  if (filters.sourceEntityType) {
    where.push('source_entity_type = ?');
    params.push(filters.sourceEntityType);
  }
  if (filters.sourceEntityId) {
    where.push('source_entity_id = ?');
    params.push(filters.sourceEntityId);
  }
  if (filters.targetEntityType) {
    where.push('target_entity_type = ?');
    params.push(filters.targetEntityType);
  }
  if (filters.targetEntityId) {
    where.push('target_entity_id = ?');
    params.push(filters.targetEntityId);
  }
  if (filters.relationshipType) {
    where.push('relationship_type = ?');
    params.push(filters.relationshipType);
  }

  const rows = await dbAll(`
    SELECT * FROM entity_relationships
    WHERE ${where.join(' AND ')}
    ORDER BY datetime(updated_at) DESC, rowid DESC
  `, params);

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    relationshipType: row.relationship_type,
    targetEntityType: row.target_entity_type,
    targetEntityId: row.target_entity_id,
    metadata: parseJson(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function saveEntityRelationship(input = {}) {
  const now = new Date().toISOString();
  const relationship = {
    id: input.id || `relationship-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId: input.projectId,
    sourceEntityType: String(input.sourceEntityType || '').trim(),
    sourceEntityId: String(input.sourceEntityId || '').trim(),
    relationshipType: String(input.relationshipType || '').trim(),
    targetEntityType: String(input.targetEntityType || '').trim(),
    targetEntityId: String(input.targetEntityId || '').trim(),
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  await dbRun(`
    INSERT INTO entity_relationships
    (id, project_id, source_entity_type, source_entity_id, relationship_type, target_entity_type, target_entity_id, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      source_entity_type = excluded.source_entity_type,
      source_entity_id = excluded.source_entity_id,
      relationship_type = excluded.relationship_type,
      target_entity_type = excluded.target_entity_type,
      target_entity_id = excluded.target_entity_id,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at
  `, [
    relationship.id,
    relationship.projectId,
    relationship.sourceEntityType,
    relationship.sourceEntityId,
    relationship.relationshipType,
    relationship.targetEntityType,
    relationship.targetEntityId,
    JSON.stringify(relationship.metadata),
    relationship.createdAt,
    relationship.updatedAt,
  ]);

  const [stored] = await readEntityRelationships(relationship.projectId, { sourceEntityType: relationship.sourceEntityType, sourceEntityId: relationship.sourceEntityId, relationshipType: relationship.relationshipType, targetEntityType: relationship.targetEntityType, targetEntityId: relationship.targetEntityId });
  return stored || relationship;
}

async function deleteEntityRelationship(projectId, relationshipId) {
  await dbRun('DELETE FROM entity_relationships WHERE project_id = ? AND id = ?', [projectId, relationshipId]);
}

async function deleteProjectDocument(projectId, docType) {
  await dbRun('DELETE FROM project_md_documents WHERE project_id = ? AND doc_type = ?', [projectId, docType]);
}

async function readAppSettings(options = {}) {
  const { includeSecrets = false } = options;
  const rows = await dbAll('SELECT key, value, is_secret FROM app_settings ORDER BY key ASC');
  const map = new Map(rows.map((row) => [row.key, row]));
  const githubToken = map.get('integrations.githubToken');
  const webhookSecret = map.get('integrations.webhookSecret');
  let aiProfiles = [];
  try {
    aiProfiles = JSON.parse(map.get('ai.profiles')?.value || '[]');
    if (!Array.isArray(aiProfiles)) aiProfiles = [];
  } catch {
    aiProfiles = [];
  }
  const fragmentsDirectiveProjectId = map.get('ai.fragmentsDirectiveProjectId')?.value || '';
  const shutdownLockedAppBeforeBuildDirectiveEnabled = map.get('ai.shutdownLockedAppBeforeBuildDirectiveEnabled')?.value === '1';

  return {
    ui: {
      projectListSortMode: map.get('ui.projectListSortMode')?.value || 'alphabetical',
      projectListViewMode: map.get('ui.projectListViewMode')?.value || 'list',
      projectListGroupMode: map.get('ui.projectListGroupMode')?.value || 'none',
      showStableIds: map.get('ui.showStableIds')?.value !== '0',
    },
    ai: {
      profiles: aiProfiles,
      fragmentsDirectiveProjectId,
      shutdownLockedAppBeforeBuildDirectiveEnabled,
    },
    integrations: {
      githubApiBaseUrl: map.get('integrations.githubApiBaseUrl')?.value || 'https://api.github.com',
      githubToken: includeSecrets ? decryptSecret(githubToken?.value || null) : undefined,
      githubTokenMasked: githubToken && decryptSecret(githubToken.value || null) ? '********' : null,
      webhookSecret: includeSecrets ? decryptSecret(webhookSecret?.value || null) : undefined,
      webhookSecretConfigured: Boolean(webhookSecret && decryptSecret(webhookSecret.value || null)),
    },
  };
}

async function saveAppSettings(settingsInput = {}) {
  const current = await readAppSettings({ includeSecrets: true });
  const inputIntegrations = settingsInput.integrations || {};
  const inputUi = settingsInput.ui || {};
  const inputAi = settingsInput.ai || {};
  const next = {
    ui: {
      ...current.ui,
      ...inputUi,
    },
    ai: {
      ...current.ai,
      ...inputAi,
    },
    integrations: {
      ...current.integrations,
      ...inputIntegrations,
    },
  };

  const rows = [
    ['ui.projectListSortMode', next.ui.projectListSortMode || 'alphabetical', 0],
    ['ui.projectListViewMode', next.ui.projectListViewMode || 'list', 0],
    ['ui.projectListGroupMode', next.ui.projectListGroupMode || 'none', 0],
    ['ui.showStableIds', next.ui.showStableIds === false ? '0' : '1', 0],
    ['ai.profiles', JSON.stringify(Array.isArray(next.ai.profiles) ? next.ai.profiles : []), 0],
    ['ai.fragmentsDirectiveProjectId', next.ai.fragmentsDirectiveProjectId || '', 0],
    ['ai.shutdownLockedAppBeforeBuildDirectiveEnabled', next.ai.shutdownLockedAppBeforeBuildDirectiveEnabled ? '1' : '0', 0],
    ['integrations.githubApiBaseUrl', next.integrations.githubApiBaseUrl || 'https://api.github.com', 0],
  ];

  if (Object.prototype.hasOwnProperty.call(inputIntegrations, 'githubToken')) {
    rows.push(['integrations.githubToken', encryptSecret(next.integrations.githubToken || null), 1]);
  }
  if (Object.prototype.hasOwnProperty.call(inputIntegrations, 'webhookSecret')) {
    rows.push(['integrations.webhookSecret', encryptSecret(next.integrations.webhookSecret || null), 1]);
  }

  for (const [key, value, isSecret] of rows) {
    await dbRun(`
      INSERT INTO app_settings (key, value, is_secret, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, is_secret = excluded.is_secret, updated_at = CURRENT_TIMESTAMP
    `, [key, value, isSecret]);
  }

  return readAppSettings();
}

async function recordIntegrationEvent(event) {
  const id = event.id || `integration-event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await dbRun(`
    INSERT INTO integration_events (id, project_id, source, event_type, delivery_status, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    event.projectId,
    event.source,
    event.eventType,
    event.deliveryStatus || 'received',
    JSON.stringify(event.payload || {}),
    event.createdAt || new Date().toISOString(),
  ]);
  return id;
}

async function readIntegrationEvents(projectId, limit = 20) {
  const rows = await dbAll(`
    SELECT * FROM integration_events
    WHERE project_id = ?
    ORDER BY datetime(created_at) DESC, rowid DESC
    LIMIT ?
  `, [projectId, limit]);

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    source: row.source,
    eventType: row.event_type,
    deliveryStatus: row.delivery_status,
    payload: parseJson(row.payload, {}),
    createdAt: row.created_at,
  }));
}

async function rewriteProjectAbsolutePaths() {
  const rows = await dbAll(`
    SELECT id, path, type
    FROM projects
    WHERE path IS NOT NULL
      AND (type IS NULL OR type = 'folder')
  `);

  for (const row of rows) {
    const absolutePath = resolveStoredProjectAbsolutePath(row.path);
    await dbRun('UPDATE projects SET absolute_path = ? WHERE id = ?', [
      absolutePath,
      row.id,
    ]);
  }
}

async function updateProjectRoot(nextRoot) {
  await bootstrapStorage();
  await closeDatabase();
  const result = setProjectRoot(nextRoot);
  bootstrapPromise = null;
  await bootstrapStorage({ force: true });
  await rewriteProjectAbsolutePaths();

  return {
    ...result,
    projectRoot: getProjectRoot(),
    dataDir: getDataDir(),
    settings: readSettings(),
  };
}

async function updateDataDir(nextDataDir) {
  await bootstrapStorage();
  await closeDatabase();
  const result = setDataDir(nextDataDir);
  bootstrapPromise = null;
  await bootstrapStorage({ force: true });
  return {
    ...result,
    projectRoot: getProjectRoot(),
    dataDir: getDataDir(),
    settings: readSettings(),
  };
}

async function updateLogsDir(nextLogsDir) {
  await bootstrapStorage();
  const result = setLogsDir(nextLogsDir);
  return {
    ...result,
    projectRoot: getProjectRoot(),
    dataDir: getDataDir(),
    logsDir: getLogsDir(),
    settings: readSettings(),
  };
}

module.exports = {
  bootstrapStorage,
  updateProjectRoot,
  readProjects,
  getProjectById,
  saveProject,
  deleteProject,
  readProjectModules,
  syncProjectModules,
  readCredentials,
  getCredentialById,
  saveCredential,
  deleteCredential,
  readProjectTasks,
  readProjectWorkItems,
  getTaskById,
  getWorkItemById,
  nextTaskSortOrder,
  saveTask,
  deleteTask,
  readRoadmapPhases,
  getRoadmapPhaseById,
  nextRoadmapPhaseSortOrder,
  saveRoadmapPhase,
  deleteRoadmapPhase,
  readRoadmapFragments,
  getRoadmapFragmentById,
  saveRoadmapFragment,
  deleteRoadmapFragment,
  readFeatureItems,
  getFeatureItemById,
  saveFeatureItem,
  deleteFeatureItem,
  readPrdFragments,
  getPrdFragmentById,
  getPrdFragmentByFeatureId,
  savePrdFragment,
  deletePrdFragment,
  readBugItems,
  getBugItemById,
  saveBugItem,
  deleteBugItem,
  readProjectDocument,
  readProjectTemplateFiles,
  recordProjectTemplateFiles,
  saveProjectDocument,
  deleteProjectDocument,
  readEntityRelationships,
  saveEntityRelationship,
  deleteEntityRelationship,
  readAppSettings,
  saveAppSettings,
  recordIntegrationEvent,
  readIntegrationEvents,
  updateDataDir,
  updateLogsDir,
};
