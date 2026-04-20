const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, 'public');

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function createRequest(baseUrl) {
  return async function request(route, options = {}) {
    const response = await fetch(`${baseUrl}${route}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let body = text;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return { response, body };
  };
}

let tempRoot;
let workspaceRoot;
let stateDir;
let dataDir;
let request;
let serverHandle;
let dbModule;
let workspaceDocs;

test.before(async () => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apm-prd-'));
  workspaceRoot = path.join(tempRoot, 'workspace');
  stateDir = path.join(tempRoot, 'state');
  dataDir = path.join(workspaceRoot, 'data');
  fs.mkdirSync(workspaceRoot, { recursive: true });
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'Alpha'), { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'Beta'), { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'Beta', 'docs'), { recursive: true });
  fs.writeFileSync(path.join(workspaceRoot, 'Beta', 'docs', 'guide.html'), '<html><body>Guide</body></html>', 'utf8');

  writeJson(path.join(dataDir, 'projects.json'), [{
    id: 'legacy-project-1',
    type: 'folder',
    path: 'Alpha',
    name: 'Legacy Alpha',
    description: 'Imported project',
    parentId: null,
    serverId: 'cred-legacy-1',
    openInCursor: true,
    openInCursorAdmin: false,
    primaryAction: 'cursor',
    pinned: true,
    imagePath: null,
    imageUrl: null,
    category: 'Legacy',
    tags: ['imported', 'alpha'],
    links: [{ type: 'url', description: 'Docs', url: 'https://example.com/docs' }],
    dateAdded: '2026-03-01T00:00:00.000Z',
    mappingGroups: [{
      id: 'deploy',
      name: 'Deploy',
      uploadMappings: [{ localPath: 'Alpha/dist', remotePath: '/var/www/alpha', overwrite: true, askBeforeOverwrite: false }],
      downloadMappings: [{ remotePath: '/var/www/alpha/.env', localPath: 'Alpha/.env' }],
    }],
  }]);

  writeJson(path.join(dataDir, 'credentials.json'), [{
    id: 'cred-legacy-1',
    name: 'Legacy Host',
    host: 'sftp.example.test',
    port: 22,
    user: 'deploy',
    password: 'secret',
    keyPath: 'C:\\keys\\legacy.pem',
  }]);

  fs.writeFileSync(path.join(dataDir, 'app.log'), 'legacy log entry\n', 'utf8');

  process.env.APM_DEFAULT_PROJECTS_ROOT = workspaceRoot;
  process.env.APM_STATE_DIR = stateDir;
  process.env.APM_PUBLIC_DIR = publicDir;
  process.env.APM_PORT = '0';

  const serverModule = require(path.join(repoRoot, 'server.js'));
  dbModule = require(path.join(repoRoot, 'src', 'database.js'));
  workspaceDocs = require(path.join(repoRoot, 'src', 'workspace-docs.js'));
  serverHandle = await serverModule.startServer(0);
  request = createRequest(`http://127.0.0.1:${serverHandle.port}`);
});

test.after(async () => {
  if (serverHandle && serverHandle.server) await closeServer(serverHandle.server);
  if (dbModule) await dbModule.closeDatabase();
  delete process.env.APM_DEFAULT_PROJECTS_ROOT;
  delete process.env.APM_STATE_DIR;
  delete process.env.APM_PUBLIC_DIR;
  delete process.env.APM_PORT;
  if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('bootstraps SQLite from legacy JSON and preserves schema needed for roadmap phases', async () => {
  const { body: roots } = await request('/api/roots');
  assert.equal(roots.projectsRoot, workspaceRoot);
  assert.equal(roots.dataDir, dataDir);

  const { body: projects } = await request('/api/projects');
  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, 'Legacy Alpha');
  assert.equal(projects[0].absolutePath, path.join(workspaceRoot, 'Alpha'));
  assert.equal(projects[0].serverId, 'cred-legacy-1');
  assert.equal(projects[0].primaryAction, 'cursor');
  assert.equal(projects[0].pendingFragmentCount, 0);
  assert.equal(projects[0].mappingGroups[0].downloadMappings[0].remotePath, '/var/www/alpha/.env');
  const projectDataManifestPath = path.join(dataDir, 'projects', 'PROJECT_MANIFEST.md');
  assert.equal(fs.existsSync(projectDataManifestPath), true);
  const projectDataManifest = fs.readFileSync(projectDataManifestPath, 'utf8');
  assert.match(projectDataManifest, /legacy-project-1/);
  assert.match(projectDataManifest, /Legacy Alpha/);
  assert.equal(
    fs.existsSync(path.join(dataDir, 'projects', 'legacy-project-1', 'standards', 'software', 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md')),
    true
  );

  const { body: credentials } = await request('/api/credentials');
  assert.equal(credentials.length, 1);
  assert.equal(credentials[0].name, 'Legacy Host');
  assert.equal(credentials[0].passwordMasked, '********');
  assert.equal(credentials[0].keyPath, 'C:\\keys\\legacy.pem');

  const projectColumns = await dbModule.dbAll('PRAGMA table_info(projects)');
  const taskColumns = await dbModule.dbAll('PRAGMA table_info(tasks)');
  const documentColumns = await dbModule.dbAll('PRAGMA table_info(project_md_documents)');
  const templateFileColumns = await dbModule.dbAll('PRAGMA table_info(project_template_files)');
  const moduleColumns = await dbModule.dbAll('PRAGMA table_info(project_modules)');
  const featureColumns = await dbModule.dbAll('PRAGMA table_info(feature_items)');
  const bugColumns = await dbModule.dbAll('PRAGMA table_info(bug_items)');
  assert(projectColumns.some((column) => column.name === 'mapping_groups'));
  assert(projectColumns.some((column) => column.name === 'primary_action'));
  assert(projectColumns.some((column) => column.name === 'project_type'));
  assert(taskColumns.some((column) => column.name === 'start_date'));
  assert(taskColumns.some((column) => column.name === 'dependency_ids'));
  assert(taskColumns.some((column) => column.name === 'category'));
  assert(taskColumns.some((column) => column.name === 'work_item_type'));
  assert(documentColumns.some((column) => column.name === 'module_key'));
  assert(documentColumns.some((column) => column.name === 'source_of_truth'));
  assert(templateFileColumns.some((column) => column.name === 'template_version'));
  assert(templateFileColumns.some((column) => column.name === 'source_md5'));
  assert(moduleColumns.some((column) => column.name === 'purpose_summary'));
  assert(featureColumns.some((column) => column.name === 'work_item_type'));
  assert(bugColumns.some((column) => column.name === 'work_item_type'));

  const migrations = await dbModule.dbAll('SELECT name FROM migrations ORDER BY name');
  assert.deepEqual(migrations.map((row) => row.name), [
    '001_initial_schema.sql',
    '002_phase_foundation.js',
    '003_encrypt_credentials.js',
    '004_project_primary_action.js',
    '005_phase4_integrations.js',
    '006_phase5_workspace_docs.js',
    '007_bug_behavior_split.js',
    '008_project_md_reconciliation.js',
    '009_prd_fragments.js',
    '010_prd_fragment_merge_cleanup.js',
    '011_prd_editor_state.js',
    '012_roadmap_fragments.js',
    '013_task_backed_work_items.js',
    '014_roadmap_phase_flow.js',
    '015_task_categories.js',
    '016_core_project_model.js',
    '017_typed_work_items.js',
      '018_module_affinity_and_ai_context.js',
      '019_module_purpose_summary.js',
      '020_changelog_module.js',
    '021_document_item_metadata.js',
    '022_document_ref_backfill.js',
    '023_refresh_generated_titles.js',
    '024_prd_legacy_detail_normalization.js',
    '025_rename_ux_ui_to_experience_design.js',
    '026_bug_association_hints.js',
    '027_bug_fragment_body_cleanup.js',
    '028_project_template_files.js',
  ]);
  });

test('project APIs enforce current PRD expectations for validation, browsing, persistence, and project-root relocation', async () => {
  let result = await request('/api/browse?path=..');
  assert.equal(result.response.status, 403);

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ type: 'url', url: 'notaurl', name: 'Broken URL' }),
  });
  assert.equal(result.response.status, 400);

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Beta',
      name: 'Beta Project',
      description: 'API-created project',
      category: 'Client',
      tags: ['beta', 'client'],
      primaryAction: 'vscode',
      links: [{ type: 'url', description: 'Board', url: 'https://example.com/board', action: 'chrome' }],
    }),
  });
  assert.equal(result.response.status, 200);
  const created = result.body;
  assert.equal(created.name, 'Beta Project');
  assert.equal(created.path, 'Beta');
  assert.equal(created.primaryAction, 'vscode');
  assert.equal(created.links[0].action, 'chrome');

  result = await request(`/api/projects/${created.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      pinned: true,
      serverId: 'cred-legacy-1',
      parentId: 'legacy-project-1',
      primaryAction: 'chrome',
      integrations: {
        projectFamily: {
          offeredInheritance: { aiDirectives: true, standards: true },
          inheritedFromParent: { aiDirectives: true },
        },
      },
      mappingGroups: [{
        id: 'release',
        name: 'Release',
        uploadMappings: [{ localPath: 'Beta/dist', remotePath: '/srv/beta', overwrite: false, askBeforeOverwrite: true }],
        downloadMappings: [{ remotePath: '/srv/beta/.env', localPath: 'Beta/.env' }],
      }],
      links: [
        { type: 'url', description: 'Board', url: 'https://example.com/board', action: 'chrome' },
        { type: 'file', description: 'Docs', url: 'Beta/docs', action: 'vscode' },
      ],
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.pinned, true);
  assert.equal(result.body.serverId, 'cred-legacy-1');
  assert.equal(result.body.parentId, 'legacy-project-1');
  assert.equal(result.body.primaryAction, 'chrome');
  assert.equal(result.body.integrations.projectFamily.offeredInheritance.aiDirectives, true);
  assert.equal(result.body.integrations.projectFamily.offeredInheritance.standards, true);
  assert.equal(result.body.integrations.projectFamily.inheritedFromParent.aiDirectives, true);
  assert.equal(result.body.links[1].action, 'vscode');
  assert.equal(result.body.mappingGroups[0].downloadMappings[0].localPath, 'Beta/.env');

  result = await request('/api/projects');
  const saved = result.body.find((project) => project.id === created.id);
  assert.equal(saved.primaryAction, 'chrome');
  assert.equal(saved.links[0].action, 'chrome');
  assert.equal(saved.links[1].action, 'vscode');
  assert.equal(saved.mappingGroups[0].name, 'Release');
  assert.equal(saved.uploadMappings[0].remotePath, '/srv/beta');
  assert.equal(saved.parentId, 'legacy-project-1');
  const parentProject = result.body.find((project) => project.id === 'legacy-project-1');
  assert.equal(parentProject.isParentProject, true);
  const childSummary = parentProject.childProjects.find((project) => project.id === created.id);
  assert.equal(childSummary.integrations.projectFamily.inheritedFromParent.aiDirectives, true);

  result = await request('/api/projects/legacy-project-1/relationships', {
    method: 'POST',
    body: JSON.stringify({
      sourceEntityType: 'project',
      sourceEntityId: 'legacy-project-1',
      relationshipType: 'depends_on_project',
      targetEntityType: 'project',
      targetEntityId: created.id,
      metadata: { note: 'Parent dashboard relationship editor smoke test.' },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.relationshipType, 'depends_on_project');
  assert.equal(result.body.metadata.note, 'Parent dashboard relationship editor smoke test.');

  result = await request('/api/projects/legacy-project-1/relationships?sourceEntityType=project');
  assert.equal(result.response.status, 200);
  assert(result.body.some((entry) => entry.relationshipType === 'depends_on_project' && entry.targetEntityId === created.id));
  assert.equal(parentProject.childCount, 1);
  assert.equal(parentProject.descendantCount, 1);
  assert(parentProject.childProjects.some((child) => child.id === created.id));
  assert.equal(parentProject.familyRollup.childProjectCount, 1);
  assert.equal(parentProject.familyRollup.descendantProjectCount, 1);

  result = await request('/api/projects/legacy-project-1', {
    method: 'PUT',
    body: JSON.stringify({ parentId: created.id }),
  });
  assert.equal(result.response.status, 400);

  result = await request('/api/git-info?path=Beta');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.isRepo, false);

  result = await request('/api/open-vscode', { method: 'POST', body: JSON.stringify({}) });
  assert.equal(result.response.status, 400);

  result = await request('/api/open-chrome', { method: 'POST', body: JSON.stringify({}) });
  assert.equal(result.response.status, 400);

  result = await request('/api/open-chrome', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta/docs/guide.html' }),
  });
  assert.equal(result.response.status, 200);
  assert.match(result.body.target, /^file:\/\//);

  const relocatedRoot = path.join(tempRoot, 'workspace-relocated');
  fs.mkdirSync(path.join(relocatedRoot, 'Alpha'), { recursive: true });
  fs.mkdirSync(path.join(relocatedRoot, 'Beta'), { recursive: true });
  fs.mkdirSync(path.join(relocatedRoot, 'Beta', 'docs'), { recursive: true });
  fs.writeFileSync(path.join(relocatedRoot, 'Beta', 'docs', 'guide.html'), '<html><body>Guide</body></html>', 'utf8');

  result = await request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ projects: { projectRoot: relocatedRoot } }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.projects.projectRoot, relocatedRoot);
  assert.equal(result.body.projects.dataDir, path.join(relocatedRoot, 'data'));
  assert.equal(result.body.projects.movedDataDir, true);

  assert.equal(fs.existsSync(path.join(workspaceRoot, 'data')), false);
  assert.equal(fs.existsSync(path.join(relocatedRoot, 'data', 'app.db')), true);
  assert.equal(fs.readFileSync(path.join(relocatedRoot, 'data', 'app.log'), 'utf8').includes('legacy log entry'), true);
  assert.equal(fs.existsSync(path.join(relocatedRoot, 'data', 'projects.json')), true);
  assert.equal(fs.existsSync(path.join(relocatedRoot, 'data', 'credentials.json')), true);

  result = await request('/api/roots');
  assert.equal(result.body.projectsRoot, relocatedRoot);
  assert.equal(result.body.dataDir, path.join(relocatedRoot, 'data'));

  result = await request('/api/browse?path=Beta');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.absolute, path.join(relocatedRoot, 'Beta'));

  result = await request('/api/browse?path=Beta/docs&includeFiles=1');
  assert.equal(result.response.status, 200);
  assert.equal(Array.isArray(result.body.files), true);
  assert(result.body.files.some((file) => file.name === 'guide.html'));

  result = await request('/api/projects');
  const relocatedProject = result.body.find((project) => project.id === 'legacy-project-1');
  assert.equal(relocatedProject.absolutePath, path.join(relocatedRoot, 'Alpha'));
  assert.equal(relocatedProject.projectType, 'general');

  result = await request('/api/project-types');
  assert.equal(result.response.status, 200);
  assert(result.body.some((projectType) => projectType.key === 'general'));
  assert(result.body.some((projectType) => projectType.key === 'software'));

  result = await request(`/api/projects/${created.id}/modules`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.projectType, 'general');
  assert(result.body.modules.some((module) => module.moduleKey === 'roadmap' && module.enabled));
  const featuresModule = result.body.modules.find((module) => module.moduleKey === 'features');
  assert.equal(featuresModule, undefined);

  result = await request(`/api/projects/${created.id}/modules`, {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'bugs', 'prd', 'architecture'],
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.projectType, 'software');
  assert(result.body.enabledModules.includes('features'));
  assert(result.body.workspacePlugins.includes('prd'));
});

test('core project model exposes typed project profiles, module registry defaults, document metadata, and generic relationships', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Alpha',
      name: 'Software Gamma',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'bugs', 'prd', 'architecture', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const softwareProject = result.body;
  assert.equal(softwareProject.projectType, 'software');
  assert(softwareProject.enabledModules.includes('database_schema'));
  assert(softwareProject.modules.some((module) => module.moduleKey === 'features' && module.enabled));
  assert(softwareProject.modules.some((module) => module.moduleKey === 'roadmap' && module.core));

  result = await request(`/api/projects/${softwareProject.id}/modules`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.projectType, 'software');
  const architectureModule = result.body.modules.find((module) => module.moduleKey === 'architecture');
  assert(architectureModule);
  assert.equal(architectureModule.enabled, true);
  assert.equal(architectureModule.hierarchyGroup, 'System Design');
  assert.match(architectureModule.purposeSummary, /system shape/i);
  const boardModule = result.body.modules.find((module) => module.moduleKey === 'board');
  assert(boardModule);
  assert.equal(boardModule.core, true);

  result = await request(`/api/projects/${softwareProject.id}/roadmap`);
  assert.equal(result.response.status, 200);
  const roadmapDocument = await dbModule.dbGet(
    'SELECT doc_type, title, module_key, template_name, source_of_truth FROM project_md_documents WHERE project_id = ? AND doc_type = ?',
    [softwareProject.id, 'roadmap']
  );
  assert.equal(roadmapDocument.doc_type, 'roadmap');
  assert.equal(roadmapDocument.title, 'Roadmap');
  assert.equal(roadmapDocument.module_key, 'roadmap');
  assert.equal(roadmapDocument.template_name, 'ROADMAP.template.md');
  assert.equal(roadmapDocument.source_of_truth, 'database');

  result = await request(`/api/projects/${softwareProject.id}/workspace-plugins`, {
    method: 'PUT',
    body: JSON.stringify({
      enabledPlugins: ['features', 'bugs', 'prd'],
      cleanupPlugins: [],
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request(`/api/projects/${softwareProject.id}/relationships`, {
    method: 'POST',
    body: JSON.stringify({
      sourceEntityType: 'module',
      sourceEntityId: 'features',
      relationshipType: 'depends_on',
      targetEntityType: 'module',
      targetEntityId: 'roadmap',
      metadata: { rationale: 'Features are planned through roadmap phases.' },
    }),
  });
  assert.equal(result.response.status, 200);
  const relationship = result.body;
  assert.equal(relationship.relationshipType, 'depends_on');
  assert.equal(relationship.metadata.rationale, 'Features are planned through roadmap phases.');

  result = await request(`/api/projects/${softwareProject.id}/relationships?sourceEntityType=module&sourceEntityId=features`);
  assert.equal(result.response.status, 200);
  assert(result.body.some((entry) => entry.id === relationship.id));
  assert(result.body.some((entry) => entry.targetEntityId === 'roadmap'));

  result = await request(`/api/projects/${softwareProject.id}/relationships/${relationship.id}`, { method: 'DELETE' });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);

  result = await request(`/api/projects/${softwareProject.id}/relationships?sourceEntityType=module&sourceEntityId=features`);
  assert.equal(result.response.status, 200);
  assert(!result.body.some((entry) => entry.id === relationship.id));

  result = await request(`/api/projects/${softwareProject.id}/modules`, {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'general',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations'],
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.projectType, 'general');
  assert.equal(result.body.workspacePlugins.length, 0);
  assert(!result.body.enabledModules.includes('features'));
});

test('AI environment module syncs a managed document and persists structured editor state', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Alpha',
      name: 'AI Guided Project',
      projectType: 'general',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  result = await request(`/api/projects/${project.id}/modules`, {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'general',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'ai_environment'],
    }),
  });
  assert.equal(result.response.status, 200);
  assert(result.body.enabledModules.includes('ai_environment'));

  result = await request(`/api/projects/${project.id}/ai-environment`);
  assert.equal(result.response.status, 200);
  assert.match(result.body.markdown, /Guide AI agents working on AI Guided Project\./);
  assert(result.body.editorState.requiredBehaviors.length >= 1);
  assert(result.body.editorState.termDictionary.length >= 1);

  result = await request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      ai: {
        fragmentsDirectiveProjectId: project.id,
        shutdownLockedAppBeforeBuildDirectiveEnabled: true,
        profiles: [
          {
            id: 'ai-profile-global',
            name: 'Global baseline',
            scope: 'global',
            projectType: '',
            content: 'Always read the Project Brief before changing downstream modules.',
          },
          {
            id: 'ai-profile-general',
            name: 'General project guidance',
            scope: 'project_type',
            projectType: 'general',
            content: 'General projects should prioritize shared planning modules first.',
          },
          {
            id: 'ai-profile-manual',
            name: 'Manual escalation policy',
            scope: 'manual',
            projectType: '',
            content: 'Raise a clear note when assumptions could affect live data.',
          },
        ],
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ai.profiles.length, 3);
  assert.equal(result.body.ai.fragmentsDirectiveProjectId, project.id);
  assert.equal(result.body.ai.shutdownLockedAppBeforeBuildDirectiveEnabled, true);

  result = await request(`/api/projects/${project.id}/ai-environment`, {
    method: 'PUT',
    body: JSON.stringify({
      editorState: {
        selectedProfileIds: ['ai-profile-manual'],
        overview: {
          mission: 'Keep AI work aligned with the project model.',
          operatingModel: 'Read the brief first, then update modules and fragments deliberately.',
          communicationStyle: 'Be concise and explicit.',
        },
        requiredBehaviors: [{ id: 'rb-1', title: 'Read before acting', description: 'Review the root project context first.' }],
        moduleUpdateRules: [{ id: 'mur-1', title: 'Update impacted modules', description: 'Track module follow-up when features or bugs change scope.' }],
        dataPhrasingRules: [{ id: 'dpr-1', title: 'Use stable identifiers', description: 'Keep phrasing deterministic for automation.' }],
        avoidRules: [{ id: 'ar-1', title: 'Do not bypass fragments', description: 'Use fragments where the workflow expects them.' }],
        handoffChecklist: [{ id: 'hc-1', title: 'Summarize affected modules', description: 'Tell the next agent what changed.' }],
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.overview.mission, 'Keep AI work aligned with the project model.');
  assert.equal(result.body.editorState.moduleUpdateRules[0].title, 'Update impacted modules');
  assert.deepEqual(result.body.editorState.selectedProfileIds, ['ai-profile-manual']);

  result = await request(`/api/projects/${project.id}/ai-environment`);
  assert.equal(result.response.status, 200);
  const currentRoots = await request('/api/roots');
  assert.match(result.body.markdown, /## 1\. Mission/);
  assert.match(result.body.markdown, /## 4\. APM Term Dictionary/);
  assert.match(result.body.markdown, /## 7\. Directive Template References/);
  assert.match(result.body.markdown, /## 8\. Locked System Directives/);
  assert.match(result.body.markdown, /Use the configured fragments path/);
  assert.match(result.body.markdown, /Fragments generated for this project must be placed in/);
  assert.equal(
    result.body.softwareStandardsPath,
    path.join(currentRoots.body.dataDir, 'projects', project.id, 'standards', 'software', 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md')
  );
  assert.match(result.body.markdown, /templates\/ROADMAP\.template\.md/);
  assert.match(result.body.markdown, /## 9\. Module Directive Index/);
  assert.match(result.body.markdown, /### 9\.1 Roadmap/);
  assert.match(result.body.markdown, /#### 9\.1\.1 Use active roadmap and feature context/);
  assert.match(result.body.markdown, /## 6\. Applied Shared Profiles/);
  assert.match(result.body.markdown, /\| Term \| Definition \| Stable ID \| Source Refs \|/);
  assert.match(result.body.markdown, /\| APM \| Angel's Project Manager/);
  assert.match(result.body.markdown, /Global baseline/);
  assert.match(result.body.markdown, /General project guidance/);
  assert.match(result.body.markdown, /Manual escalation policy/);
  assert.match(result.body.markdown, /Shut down locked running application processes before rebuilds/);

  const aiDocRow = await dbModule.dbGet(
    'SELECT doc_type, module_key, template_name FROM project_md_documents WHERE project_id = ? AND doc_type = ?',
    [project.id, 'ai_environment']
  );
  assert.equal(aiDocRow.doc_type, 'ai_environment');
  assert.equal(aiDocRow.module_key, 'ai_environment');
  assert.equal(aiDocRow.template_name, 'AI_ENVIRONMENT.template.md');

  const aiDocPath = path.join(currentRoots.body.projectsRoot, 'Alpha', 'docs', 'AI_ENVIRONMENT.md');
  assert.equal(fs.existsSync(aiDocPath), true);
  assert.match(fs.readFileSync(aiDocPath, 'utf8'), /Keep AI work aligned with the project model\./);

  const aiProfilesRow = await dbModule.dbGet(
    'SELECT value FROM app_settings WHERE key = ?',
    ['ai.profiles']
  );
  assert.match(aiProfilesRow.value, /Global baseline/);
  assert.match(aiProfilesRow.value, /Manual escalation policy/);
});

test('project list ui preferences persist through app settings and reload from the database', async () => {
  let result = await request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      ui: {
        projectListSortMode: 'dateAdded',
        projectListViewMode: 'grid',
        projectListGroupMode: 'category',
        showStableIds: false,
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ui.projectListSortMode, 'dateAdded');
  assert.equal(result.body.ui.projectListViewMode, 'grid');
  assert.equal(result.body.ui.projectListGroupMode, 'category');
  assert.equal(result.body.ui.showStableIds, false);

  result = await request('/api/settings');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ui.projectListSortMode, 'dateAdded');
  assert.equal(result.body.ui.projectListViewMode, 'grid');
  assert.equal(result.body.ui.projectListGroupMode, 'category');
  assert.equal(result.body.ui.showStableIds, false);

  const storedSettings = await dbModule.dbAll(
    `SELECT key, value
     FROM app_settings
     WHERE key IN ('ui.projectListSortMode', 'ui.projectListViewMode', 'ui.projectListGroupMode', 'ui.showStableIds')
     ORDER BY key ASC`
  );
  assert.deepEqual(
    storedSettings.map((row) => [row.key, row.value]),
    [
      ['ui.projectListGroupMode', 'category'],
      ['ui.projectListSortMode', 'dateAdded'],
      ['ui.projectListViewMode', 'grid'],
      ['ui.showStableIds', '0'],
    ]
  );
});

test('file system browse route lists directories and files for the picker modal', async () => {
  const targetPath = path.join(workspaceRoot, 'Beta', 'docs');
  const result = await request(`/api/fs/browse?path=${encodeURIComponent(targetPath)}&includeFiles=1`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.absolutePath, targetPath);
  assert.equal(result.body.parentPath, path.join(workspaceRoot, 'Beta'));
  assert(result.body.entries.some((entry) => entry.type === 'file' && entry.name === 'guide.html'));
});

test('file watcher routes register watches and stream file events', async () => {
  const roots = await request('/api/roots');
  const watchDir = path.join(roots.body.projectsRoot, 'Alpha', 'watch-target');
  fs.mkdirSync(watchDir, { recursive: true });
  const watchId = `watch-${Date.now()}`;

  let result = await request('/api/file-watcher/watches', {
    method: 'POST',
    body: JSON.stringify({
      watchId,
      paths: [watchDir],
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.watch.watchId, watchId);

  result = await request('/api/file-watcher/watches');
  assert.equal(result.response.status, 200);
  assert(result.body.watches.some((entry) => entry.watchId === watchId));

  const streamedEvent = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for file watch event')), 8000);
    const req = http.get({
      host: '127.0.0.1',
      port: serverHandle.port,
      path: `/api/file-watcher/stream?watchId=${encodeURIComponent(watchId)}`,
      headers: {
        Accept: 'text/event-stream',
      },
    }, (res) => {
      let buffer = '';
      let readyReceived = false;
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        buffer += chunk;
        while (buffer.includes('\n\n')) {
          const separatorIndex = buffer.indexOf('\n\n');
          const rawEvent = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          const lines = rawEvent.split('\n');
          const eventName = lines.find((line) => line.startsWith('event:'))?.replace(/^event:\s*/, '').trim();
          const dataLine = lines.find((line) => line.startsWith('data:'))?.replace(/^data:\s*/, '');
          const payload = dataLine ? JSON.parse(dataLine) : null;
          if (eventName === 'ready' && !readyReceived) {
            readyReceived = true;
            fs.writeFileSync(path.join(watchDir, 'watch-test.txt'), 'watch me', 'utf8');
          }
          if (eventName === 'file' && payload && payload.eventType === 'add') {
            clearTimeout(timeout);
            req.destroy();
            resolve(payload);
            return;
          }
        }
      });
    });
    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  assert.equal(streamedEvent.watchId, watchId);
  assert.equal(path.basename(streamedEvent.absolutePath), 'watch-test.txt');

  result = await request(`/api/file-watcher/watches/${watchId}`, {
    method: 'DELETE',
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
});

test('file watcher service lazy-loads chokidar for packaged CommonJS startup', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'src', 'file-watcher.js'), 'utf8');
  assert(source.includes("import('chokidar')"));
  assert(!source.includes("require('chokidar')"));
});

test('next workspace restores project-level SFTP controls and server association UI', () => {
  const integrationsWorkspace = fs.readFileSync(
    path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'integrations-workspace.js'),
    'utf8'
  );
  const sftpModal = fs.readFileSync(
    path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'sftp-modal.js'),
    'utf8'
  );
  const projectSettingsModal = fs.readFileSync(
    path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-settings-modal.js'),
    'utf8'
  );

  assert.match(integrationsWorkspace, /Open SFTP workspace/);
  assert.match(integrationsWorkspace, /SftpModal/);
  assert.match(sftpModal, /Run Uploads/);
  assert.match(sftpModal, /Run Downloads/);
  assert.match(projectSettingsModal, /Linked SFTP Servers/);
  assert.match(projectSettingsModal, /Default SFTP Server/);
  assert.match(projectSettingsModal, /serverIds/);
});

test('software designer shell is served with side navigation and module placeholder surfaces', async () => {
  const result = await request('/');
  assert.equal(result.response.status, 200);
  const exportedFrontendPath = path.join(repoRoot, 'next-app', 'out', 'index.html');

  if (fs.existsSync(exportedFrontendPath)) {
    assert.match(result.body, /<title>Angel(?:&#x27;|')s Project Manager<\/title>/);
    assert.match(result.body, /_next\//);
  } else {
    assert.match(result.body, /id="workspace-designer-nav"/);
    assert.match(result.body, /id="workspace-designer-title"/);
    assert.match(result.body, /id="task-workspace-title"/);
    assert.match(result.body, /id="module-designer-surface"/);
    assert.match(result.body, /id="project-settings-software-modules"/);
    assert.match(result.body, /id="modal-fragment-preview"/);
    assert.match(result.body, /id="fragment-preview-body"/);
    assert.doesNotMatch(result.body, /project-settings-plugin-features/);
    assert.doesNotMatch(result.body, /id="workspace-plugin-manager"/);

    const stylesheet = fs.readFileSync(path.join(publicDir, 'styles.css'), 'utf8');
    assert.match(stylesheet, /\.workspace-designer-sidebar\s*\{[\s\S]*overflow-y:\s*auto;/);
  }
});

test('nextjs migration pass 2 workspace exists with Next.js, React, Tailwind, and shell scripts', () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(rootPackage.scripts['next:dev'], 'npm --prefix next-app run dev');
  assert.equal(rootPackage.scripts['next:build'], 'npm --prefix next-app run build');
  assert.equal(rootPackage.scripts['next:start'], 'npm --prefix next-app run start');

  const nextPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'next-app', 'package.json'), 'utf8'));
  assert.equal(nextPackage.dependencies.react != null, true);
  assert.equal(nextPackage.dependencies['react-dom'] != null, true);
  assert.equal(nextPackage.dependencies.next != null, true);
  assert.equal(nextPackage.devDependencies.tailwindcss != null, true);

  const nextLayout = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'layout.js'), 'utf8');
  const nextPage = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'page.js'), 'utf8');
  const shell = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'migration-app-shell.js'), 'utf8');
  const globalsCss = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'globals.css'), 'utf8');
  const tailwindConfig = fs.readFileSync(path.join(repoRoot, 'next-app', 'tailwind.config.js'), 'utf8');

  assert.match(nextLayout, /Angel's Project Manager/);
  assert.match(nextPage, /ProjectsWorkspacePage|MigrationAppShell/);
  assert.match(shell, /Next\.js Migration Shell/);
  assert.match(shell, /Core Workspace/);
  assert.match(shell, /Software Designer/);
  assert.match(globalsCss, /@tailwind base;/);
  assert.match(tailwindConfig, /content:/);
});

test('nextjs migration pass 3 backend route registration is split into domain modules', () => {
  const serverAppSource = fs.readFileSync(path.join(repoRoot, 'src', 'server-app.js'), 'utf8');
  const coreRoutes = fs.readFileSync(path.join(repoRoot, 'src', 'server', 'routes', 'core-routes.js'), 'utf8');
  const projectRoutes = fs.readFileSync(path.join(repoRoot, 'src', 'server', 'routes', 'project-routes.js'), 'utf8');
  const workItemRoutes = fs.readFileSync(path.join(repoRoot, 'src', 'server', 'routes', 'work-item-routes.js'), 'utf8');
  const softwareRoutes = fs.readFileSync(path.join(repoRoot, 'src', 'server', 'routes', 'software-routes.js'), 'utf8');

  assert.match(serverAppSource, /require\('\.\/server\/routes\/core-routes'\)/);
  assert.match(serverAppSource, /require\('\.\/server\/routes\/project-routes'\)/);
  assert.match(serverAppSource, /require\('\.\/server\/routes\/work-item-routes'\)/);
  assert.match(serverAppSource, /require\('\.\/server\/routes\/software-routes'\)/);
  assert.match(serverAppSource, /const routeContext = \{/);
  assert.match(serverAppSource, /registerCoreRoutes\(app, routeContext\)/);
  assert.match(serverAppSource, /registerProjectRoutes\(app, routeContext\)/);
  assert.match(serverAppSource, /registerWorkItemRoutes\(app, routeContext\)/);
  assert.match(serverAppSource, /registerSoftwareRoutes\(app, routeContext\)/);

  assert.match(coreRoutes, /\/api\/settings/);
  assert.match(coreRoutes, /\/api\/browse/);
  assert.match(projectRoutes, /\/api\/projects/);
  assert.match(projectRoutes, /\/api\/projects\/:id\/rollups/);
  assert.match(projectRoutes, /buildProjectFamilyRollupDetails/);
  assert.match(projectRoutes, /\/api\/projects\/:id\/modules/);
  assert.match(workItemRoutes, /\/api\/projects\/:id\/tasks/);
  assert.match(workItemRoutes, /\/api\/projects\/:id\/work-items/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/roadmap/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/prd/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/database-schema/);
});

test('electron cutover serves the exported next frontend through the existing desktop backend path', () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const configSource = fs.readFileSync(path.join(repoRoot, 'src', 'config.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(repoRoot, 'src', 'server-app.js'), 'utf8');
  const nextConfig = fs.readFileSync(path.join(repoRoot, 'next-app', 'next.config.mjs'), 'utf8');

  assert.equal(rootPackage.scripts.start, 'npm run next:build && electron .');
  assert.equal(rootPackage.scripts.build, 'npm run next:build && npm run test && npm run logs:archive-current && electron-builder --win portable && npm run build:shortcuts');
  assert.equal(rootPackage.scripts['build:dir'], 'npm run next:build && npm run test && npm run logs:archive-current && electron-builder --dir');
  assert(rootPackage.build.files.includes('next-app/out/**/*'));
  assert.match(configSource, /const FRONTEND_DIR = path\.resolve\(process\.env\.APM_FRONTEND_DIR \|\| path\.join\(APP_DIR, 'next-app', 'out'\)\);/);
  assert.match(configSource, /function getFrontendDir\(\)/);
  assert.match(serverSource, /const frontendDir = config\.getFrontendDir\(\);/);
  assert.match(serverSource, /const hasFrontendBuild = fs\.existsSync\(frontendDir\) && fs\.existsSync\(path\.join\(frontendDir, 'index\.html'\)\);/);
  assert.match(serverSource, /if \(hasFrontendBuild\) \{\s*app\.use\(express\.static\(frontendDir\)\);/);
  assert.match(serverSource, /res\.sendFile\(path\.join\(hasFrontendBuild \? frontendDir : config\.getPublicDir\(\), 'index\.html'\)\);/);
  assert.match(nextConfig, /output: 'export'/);
  assert.match(nextConfig, /unoptimized: true/);
});

test('nextjs migration pass 4 shared ui primitives exist and the migration shell composes them', () => {
  const jsconfig = fs.readFileSync(path.join(repoRoot, 'next-app', 'jsconfig.json'), 'utf8');
  const shell = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'migration-app-shell.js'), 'utf8');
  const actionButton = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'action-button.js'), 'utf8');
  const surfaceCard = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'surface-card.js'), 'utf8');
  const statusBadge = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'status-badge.js'), 'utf8');
  const sectionShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'section-shell.js'), 'utf8');
  const dialogFrame = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'dialog-frame.js'), 'utf8');
  const navSection = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'nav-section.js'), 'utf8');
  const infoTile = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'info-tile.js'), 'utf8');

  assert.equal(jsconfig.includes('"@/*"'), true);
  assert.match(shell, /ActionButton/);
  assert.match(shell, /SurfaceCard/);
  assert.match(shell, /StatusBadge/);
  assert.match(shell, /SectionShell/);
  assert.match(shell, /DialogFrame/);
  assert.match(shell, /InfoTile/);
  assert.match(actionButton, /variants = \{/);
  assert.match(surfaceCard, /tone = 'panel'/);
  assert.match(statusBadge, /foundation/);
  assert.match(sectionShell, /actions/);
  assert.match(dialogFrame, /Ready For Migration|DialogFrame/);
  assert.match(navSection, /ActionButton/);
  assert.match(infoTile, /SurfaceCard/);
});

test('nextjs migration pass 5 core project workspace loads projects and renders a selected project shell', () => {
  const page = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'page.js'), 'utf8');
  const layout = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'layout.js'), 'utf8');
  const globalsCss = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'globals.css'), 'utf8');
  const appFrame = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-frame.js'), 'utf8');
  const appThemeProvider = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-theme-provider.js'), 'utf8');
  const appSettingsModal = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-settings-modal.js'), 'utf8');
  const appToolbar = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-toolbar.js'), 'utf8');
  const workspacePage = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'projects-workspace-page.js'), 'utf8');
  const apiClient = fs.readFileSync(path.join(repoRoot, 'next-app', 'lib', 'api-client.js'), 'utf8');
  const useProjects = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'projects', 'hooks', 'use-projects.js'), 'utf8');
  const projectList = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'projects', 'components', 'project-list.js'), 'utf8');
  const projectCard = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'projects', 'components', 'project-card.js'), 'utf8');
  const workspaceShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-workspace-shell.js'), 'utf8');
  const softwareModuleSurface = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'components', 'software-module-surface.js'), 'utf8');
  const projectSettingsModal = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-settings-modal.js'), 'utf8');
  const coreNav = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'core-nav.js'), 'utf8');
  const projectBriefWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-brief-workspace.js'), 'utf8');
  const tailwindConfig = fs.readFileSync(path.join(repoRoot, 'next-app', 'tailwind.config.js'), 'utf8');

  assert.match(page, /ProjectsWorkspacePage/);
  assert.match(layout, /AppFrame/);
  assert.match(layout, /AppThemeProvider/);
  assert.match(appFrame, /windowMinimize/);
  assert.match(appFrame, /windowMaximize/);
  assert.match(appFrame, /windowClose/);
  assert.match(appFrame, /useState\(false\)/);
  assert.match(appFrame, /setHasElectronControls/);
  assert.match(appFrame, /Angel&apos;s Project Manager/);
  assert.match(appThemeProvider, /COLOR_SCHEME_KEY/);
  assert.match(appThemeProvider, /window\.electronAPI\?\.setTheme/);
  assert.match(appThemeProvider, /document\.documentElement\.dataset\.scheme/);
  assert.match(appThemeProvider, /showStableIds/);
  assert.match(appThemeProvider, /dataset\.showStableIds/);
  assert.match(appSettingsModal, /Desktop app settings/);
  assert.match(appSettingsModal, /fetchJson\('\/api\/settings'\)/);
  assert.match(appSettingsModal, /fetchJson\('\/api\/credentials'\)/);
  assert.match(appSettingsModal, /Application Settings/);
  assert.match(appSettingsModal, /Appearance/);
  assert.match(appSettingsModal, /Data Directory/);
  assert.match(appSettingsModal, /Log Directory/);
  assert.match(appSettingsModal, /UI skins/);
  assert.match(appSettingsModal, /Show document and canvas IDs/);
  assert.match(appSettingsModal, /setColorScheme/);
  assert.match(globalsCss, /\.app-titlebar/);
  assert.match(globalsCss, /\.app-shell-scroll/);
  assert.match(globalsCss, /-webkit-app-region: drag/);
  assert.match(globalsCss, /html\[data-scheme='cyan-glow'\]/);
  assert.match(globalsCss, /html\[data-scheme='dark-blue'\]/);
  assert.match(globalsCss, /html\[data-scheme='app-icon'\]/);
  assert.match(globalsCss, /html\[data-show-stable-ids='false'\] \.apm-stable-id/);
  assert.match(globalsCss, /\.theme-swatch--app-icon/);
  assert.match(globalsCss, /\[class\*='text-white'\]/);
  assert.match(globalsCss, /\[class\*='bg-accent'\]/);
  assert.match(appToolbar, /placeholder="Search name, description, tags\.\.\."/);
  assert.match(appToolbar, /File/);
  assert.match(appToolbar, /View Logs/);
  assert.match(appToolbar, /Restart App/);
  assert.match(appToolbar, /Sort/);
  assert.match(appToolbar, /Group/);
  assert.match(appToolbar, /ToolbarMenu/);
  assert.match(appToolbar, /pointerdown/);
  assert.match(appToolbar, /menuBarRef/);
  assert.match(appToolbar, /statusMessage/);
  assert.match(appToolbar, /showOrganizer/);
  assert.match(workspacePage, /useProjects/);
  assert.match(workspacePage, /AppToolbar/);
  assert.match(workspacePage, /AppSettingsModal/);
  assert.match(workspacePage, /isSettingsModalOpen/);
  assert.match(workspacePage, /sortMode/);
  assert.match(workspacePage, /viewMode/);
  assert.match(workspacePage, /groupMode/);
  assert.match(workspacePage, /ProjectList/);
  assert.match(workspacePage, /selectedProject \?/);
  assert.match(workspacePage, /toolbarStatus/);
  assert.match(workspacePage, /matchesProject/);
  assert.match(workspacePage, /buildVisibleProjectHierarchy/);
  assert.match(workspacePage, /ProjectWorkspaceShell/);
  assert.match(workspacePage, /selectedProjectSurfaceKey/);
  assert.match(workspacePage, /onSelectProject=\{handleSelectProject\}/);
  assert.match(workspacePage, /showOrganizer=\{!selectedProject\}/);
  assert.match(workspacePage, /handleTogglePin/);
  assert.match(workspacePage, /projectSettingsProject/);
  assert.match(workspacePage, /handleSaveProjectSettings/);
  assert.match(workspacePage, /fetchJson\('\/api\/settings'\)/);
  assert.match(workspacePage, /projectListSortMode/);
  assert.match(workspacePage, /projectListViewMode/);
  assert.match(workspacePage, /projectListGroupMode/);
  assert.doesNotMatch(workspacePage, /max-w-7xl/);
  assert.match(apiClient, /fetchJson/);
  assert.match(apiClient, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(useProjects, /fetchJson\('\/api\/projects'\)/);
  assert.match(useProjects, /fetchJson\('\/api\/roots'\)/);
  assert.match(useProjects, /async function updateProject/);
  assert.match(useProjects, /fetchJson\(`\/api\/projects\/\$\{projectId\}`/);
  assert.match(useProjects, /const nextProjects = await fetchJson\('\/api\/projects'\)/);
  assert.match(useProjects, /return null;/);
  assert.match(projectList, /Project workspace list/);
  assert.match(projectList, /splitPinnedGroups/);
  assert.match(projectList, /PinBadgeIcon/);
  assert.match(projectList, /No projects match the current search/);
  assert.match(projectList, /Projects/);
  assert.match(projectCard, /getProjectKind/);
  assert.match(projectCard, /tagToneClass/);
  assert.match(projectCard, /Software Project/);
  assert.match(projectCard, /General Project/);
  assert.match(projectCard, /ProjectLinkIcons/);
  assert.match(projectCard, /Project settings/);
  assert.match(projectCard, /project-card-children/);
  assert.match(projectCard, /project-card-children-summary/);
  assert.match(projectCard, /Expand or collapse this project family/);
  assert.match(projectCard, /Child Projects/);
  assert.match(projectCard, /Pin project/);
  assert.match(projectCard, /onTogglePin/);
  assert.match(projectCard, /tagNames/);
  assert.match(projectCard, /absolute right-0 top-0/);
  assert.doesNotMatch(projectCard, /core modules/);
  assert.match(projectCard, /role="button"/);
  assert.match(projectSettingsModal, /Project settings are grouped to match the workspace hierarchy/);
  assert.match(projectSettingsModal, /Core project identity/);
  assert.match(projectSettingsModal, /Project Family/);
  assert.match(projectSettingsModal, /offeredInheritance/);
  assert.match(projectSettingsModal, /inheritedFromParent/);
  assert.match(projectSettingsModal, /Parent Project/);
  assert.match(projectSettingsModal, /Module selection/);
  assert.match(projectSettingsModal, /Default Program \/ Browser/);
  assert.match(projectSettingsModal, /VS Code/);
  assert.match(projectSettingsModal, /Cursor/);
  assert.match(projectSettingsModal, /Chrome/);
  assert.match(projectSettingsModal, /Choose image/);
  assert.match(projectSettingsModal, /Apply crop/);
  assert.match(workspaceShell, /CoreNav/);
  assert.match(workspaceShell, /ParentDashboardWorkspace/);
  assert.match(workspaceShell, /RollupDetailPanel/);
  assert.match(workspaceShell, /project-workspace-breadcrumb/);
  assert.match(workspaceShell, /project\.parentSummary/);
  assert.match(workspaceShell, /ProjectFamilyInheritanceSummary/);
  assert.match(workspaceShell, /parent-dashboard-inheritance/);
  assert.match(workspaceShell, /Parent offers and child opt-ins/);
  assert.match(workspaceShell, /No inherited settings enabled/);
  assert.match(workspaceShell, /PROJECT_RELATIONSHIP_TYPES/);
  assert.match(workspaceShell, /parent-dashboard-relationships/);
  assert.match(workspaceShell, /Cross-Project Relationships/);
  assert.match(workspaceShell, /Add Relationship/);
  assert.match(workspaceShell, /\/api\/projects\/\$\{project\.id\}\/relationships/);
  assert.match(workspaceShell, /\/api\/projects\/\$\{project\.id\}\/rollups/);
  assert.match(workspaceShell, /useFileWatcher/);
  assert.match(workspaceShell, /project-fragments:\$\{projectId\}/);
  assert.match(workspaceShell, /refreshRollups/);
  assert.match(softwareModuleSurface, /ModuleExtensionCard/);
  assert.match(softwareModuleSurface, /Parent Extension/);
  assert.match(softwareModuleSurface, /Child Extension/);
  assert.match(softwareModuleSurface, /Project Family Extension/);
  assert.match(workspaceShell, /onSelectProject\?\.\(item\.projectId, item\.moduleKey/);
  assert.match(workspaceShell, /parent_dashboard/);
  assert.match(workspaceShell, /Project Workspace/);
  assert.match(workspaceShell, /Back to Projects/);
  assert.match(workspaceShell, /ProjectSettingsModal/);
  assert.match(workspaceShell, /overflow-y-auto/);
  assert.match(workspaceShell, /grid gap-6 xl:grid-cols-\[320px_minmax\(0,1fr\)\]/);
  assert.match(workspaceShell, /Open project settings/);
  assert.match(workspaceShell, /<ProjectLinkIcons links=\{project\.links\} \/>/);
  assert.match(workspaceShell, /ProjectBriefWorkspace/);
  assert.match(workspaceShell, /preferredCoreView = null/);
  assert.match(workspaceShell, /showParentDashboard/);
  assert.match(workspaceShell, /project_brief_root/);
  assert.match(coreNav, /Foundation/);
  assert.match(coreNav, /Parent Dashboard/);
  assert.match(coreNav, /showParentDashboard/);
  assert.match(coreNav, /Project Brief/);
  assert.match(coreNav, /Roadmap/);
  assert.match(coreNav, /Records/);
  assert.match(coreNav, /Integrations/);
  assert.doesNotMatch(coreNav, /Settings/);
  assert.match(projectBriefWorkspace, /Project Brief is the root of the document system/);
  assert.match(projectBriefWorkspace, /What branches from Project Brief/);
  assert.match(projectBriefWorkspace, /Alt\+Shift\+Enter/);
  assert.match(projectBriefWorkspace, /StatisticsDisclosure/);
  assert.match(projectBriefWorkspace, /No software branches are enabled yet/);
  assert.match(tailwindConfig, /\.\/features\/\*\*\/\*\.\{js,jsx\}/);
});

test('nextjs migration pass 6 software workspace groups enabled modules and renders a selected software module shell', () => {
  const moduleHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'hooks', 'use-project-modules.js'), 'utf8');
  const moduleNav = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'components', 'software-module-nav.js'), 'utf8');
  const moduleSurface = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'components', 'software-module-surface.js'), 'utf8');
  const workspaceShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-workspace-shell.js'), 'utf8');

  assert.match(moduleHook, /fetchJson\(`\/api\/projects\/\$\{projectId\}\/modules`\)/);
  assert.match(moduleNav, /Software Workspace groups the product, requirements, system design, and decision branches/);
  assert.match(moduleNav, /purposeSummary/);
  assert.match(moduleNav, /pendingFragmentCount/);
  assert.match(moduleNav, /software-module-button-fragment-count/);
  assert.match(moduleNav, /hierarchyGroup/);
  assert.match(moduleNav, /hierarchyOrder/);
  assert.match(moduleNav, /hierarchyDepth/);
  assert.match(moduleNav, /Product Delivery/);
  assert.match(moduleNav, /module\.moduleKey/);
  assert.match(moduleSurface, /Software Branch/);
  assert.match(moduleSurface, /Branch group:/);
  assert.match(moduleSurface, /module\.description/);
  assert.match(moduleSurface, /dependencyCount/);
  assert.match(workspaceShell, /useProjectModules/);
  assert.match(workspaceShell, /softwareModules = useMemo/);
  assert.match(workspaceShell, /SoftwareModuleNav/);
  assert.match(workspaceShell, /SoftwareModuleSurface/);
  assert.match(workspaceShell, /Software<\/p>|Software'/);
});

test('nextjs migration pass 7 roadmap workspace loads live roadmap state and exposes phase editing actions', () => {
  const roadmapHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'roadmap', 'hooks', 'use-roadmap.js'), 'utf8');
  const roadmapWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'roadmap', 'components', 'roadmap-workspace.js'), 'utf8');
  const phaseCard = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'roadmap', 'components', 'roadmap-phase-card.js'), 'utf8');
  const phaseForm = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'roadmap', 'components', 'roadmap-phase-form.js'), 'utf8');
  const workspaceShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-workspace-shell.js'), 'utf8');

  assert.match(roadmapHook, /fetchJson\(`\/api\/projects\/\$\{project\.id\}\/roadmap`\)/);
  assert.match(roadmapHook, /roadmap\/phases/);
  assert.match(roadmapHook, /createPhase/);
  assert.match(roadmapHook, /updatePhase/);
  assert.match(roadmapHook, /deletePhase/);
  assert.match(roadmapHook, /mergeFragment/);
  assert.match(roadmapHook, /integrateFragment/);
  assert.match(roadmapWorkspace, /Roadmap workspace/);
  assert.match(roadmapWorkspace, /Add phase/);
  assert.match(roadmapWorkspace, /Load Fragments/);
  assert.match(roadmapWorkspace, /RoadmapPhaseForm/);
  assert.match(roadmapWorkspace, /Roadmap fragments/);
  assert.match(roadmapWorkspace, /FragmentBrowserModal/);
  assert.match(phaseCard, /Tasks:/);
  assert.match(phaseCard, /Features:/);
  assert.match(phaseForm, /Create a roadmap phase/);
  assert.match(phaseForm, /Comes after/);
  assert.match(workspaceShell, /RoadmapWorkspace/);
  assert.match(workspaceShell, /case 'roadmap_core'/);
});

test('nextjs migration pass 8 prd workspace loads structured document state and exposes save flow', () => {
  const prdHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'prd', 'hooks', 'use-prd.js'), 'utf8');
  const prdWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'prd', 'components', 'prd-workspace.js'), 'utf8');
  const workspaceShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-workspace-shell.js'), 'utf8');

  assert.match(prdHook, /fetchJson\(`\/api\/projects\/\$\{project\.id\}\/prd`\)/);
  assert.match(prdHook, /fetchJson\(`\/api\/projects\/\$\{project\.id\}\/prd\/fragments`\)/);
  assert.match(prdHook, /savePrd/);
  assert.match(prdHook, /mergeFragment/);
  assert.match(prdHook, /integrateFragment/);
  assert.match(prdHook, /method: 'PUT'/);
  assert.match(prdWorkspace, /PRD workspace/);
  assert.match(prdWorkspace, /Save PRD/);
  assert.match(prdWorkspace, /Load Fragments/);
  assert.match(prdWorkspace, /FragmentBrowserModal/);
  assert.match(prdWorkspace, /structured editor state/);
  assert.match(prdWorkspace, /StructuredEntryListEditor/);
  assert.match(prdWorkspace, /StructuredTextListEditor/);
  assert.match(workspaceShell, /PrdWorkspace/);
  assert.match(workspaceShell, /case 'prd'/);
});

test('nextjs migration pass 9 database schema workspace loads schema model state and exposes structured editing flow', () => {
  const schemaHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'hooks', 'use-database-schema.js'), 'utf8');
  const schemaWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'components', 'database-schema-workspace.js'), 'utf8');
  const schemaVisualizer = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'components', 'schema-visualizer.js'), 'utf8');
  const schemaNode = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'components', 'schema-table-node.js'), 'utf8');
  const schemaInspector = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'components', 'schema-inspector-panel.js'), 'utf8');
  const globalsCss = fs.readFileSync(path.join(repoRoot, 'next-app', 'app', 'globals.css'), 'utf8');
  const workspaceShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-workspace-shell.js'), 'utf8');

  assert.match(schemaHook, /fetchJson\(`\/api\/projects\/\$\{project\.id\}\/database-schema`\)/);
  assert.match(schemaHook, /saveDatabaseSchema/);
  assert.match(schemaHook, /importDatabaseSchemaFragment/);
  assert.match(schemaHook, /consumeDatabaseSchemaFragment/);
  assert.match(schemaHook, /database-schema\/fragments/);
  assert.match(schemaHook, /method: 'PUT'/);
  assert.match(schemaWorkspace, /Database Schema workspace/);
  assert.match(schemaWorkspace, /Schema Visualizer/);
  assert.match(schemaWorkspace, /Table and relationship diagram/);
  assert.match(schemaWorkspace, /Upload fragment/);
  assert.match(schemaWorkspace, /Load Fragments/);
  assert.match(schemaWorkspace, /FragmentBrowserModal/);
  assert.match(schemaWorkspace, /handleNodePositionChange/);
  assert.match(schemaWorkspace, /SchemaVisualizer/);
  assert.match(schemaInspector, /Table Inspector/);
  assert.match(schemaInspector, /Relationship Inspector/);
  assert.match(schemaInspector, /FIELD_TYPE_OPTIONS/);
  assert.match(schemaInspector, /Seen/);
  assert.match(schemaVisualizer, /ReactFlow/);
  assert.match(schemaVisualizer, /MarkerType\.ArrowClosed/);
  assert.match(schemaVisualizer, /1 : \*/);
  assert.match(schemaVisualizer, /type: 'step'/);
  assert.match(schemaVisualizer, /entity\.position/);
  assert.match(schemaNode, /Position\.Left/);
  assert.match(schemaNode, /field\.type/);
  assert.match(globalsCss, /@xyflow\/react\/dist\/style\.css/);
  assert.match(workspaceShell, /DatabaseSchemaWorkspace/);
  assert.match(workspaceShell, /case 'database_schema'/);
  const dialogFrame = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'dialog-frame.js'), 'utf8');
  assert.match(dialogFrame, /max-h-\[calc\(100vh-2rem\)\]/);
  assert.match(dialogFrame, /overflow-y-auto/);
});

test('logging stack uses structured TSV files with archiving and log management endpoints', () => {
  const logger = fs.readFileSync(path.join(repoRoot, 'src', 'logger.js'), 'utf8');
  const configSource = fs.readFileSync(path.join(repoRoot, 'src', 'config.js'), 'utf8');
  const mainSource = fs.readFileSync(path.join(repoRoot, 'main.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(repoRoot, 'src', 'server-app.js'), 'utf8');
  const appSettingsModal = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-settings-modal.js'), 'utf8');
  const packageJson = fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8');

  assert.match(logger, /current\.log\.tsv/);
  assert.match(logger, /Archive/);
  assert.match(logger, /const HEADER = \[/);
  assert.match(logger, /'timestamp'/);
  assert.match(logger, /'level'/);
  assert.match(logger, /'requestId'/);
  assert.match(logger, /log\.archive\.created/);
  assert.match(configSource, /logger\.writeLog/);
  assert.match(configSource, /getLogsDir/);
  assert.match(mainSource, /logger\.writeLog/);
  assert.match(serverSource, /app\.get\('\/api\/logs'/);
  assert.match(serverSource, /app\.post\('\/api\/logs\/archive-current'/);
  assert.match(serverSource, /app\.post\('\/api\/view-logs'/);
  assert.match(serverSource, /x-request-id/);
  assert.doesNotMatch(appSettingsModal, /Archive Current Log/);
  assert.doesNotMatch(appSettingsModal, /Open Logs Folder/);
  assert.match(appSettingsModal, /Data Directory/);
  assert.match(appSettingsModal, /Log Directory/);
  assert.match(packageJson, /"logs:archive-current": "node scripts\/archive-current-log\.js"/);
});

test('nextjs migration sweep wires remaining software and core workspaces into the project designer shell', () => {
  const workspaceShell = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-workspace-shell.js'), 'utf8');
  const coreNav = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'core-nav.js'), 'utf8');
  const architectureHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'architecture', 'hooks', 'use-architecture.js'), 'utf8');
  const architectureWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'architecture', 'components', 'architecture-workspace.js'), 'utf8');
  const domainModelsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'domain-models', 'components', 'domain-models-workspace.js'), 'utf8');
  const projectFamilyDocumentContext = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-family-document-context.js'), 'utf8');
  const adrWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'adr', 'components', 'adr-workspace.js'), 'utf8');
  const changelogWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'changelog', 'components', 'changelog-workspace.js'), 'utf8');
  const featuresHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'features', 'hooks', 'use-features.js'), 'utf8');
  const featuresWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'features', 'components', 'features-workspace.js'), 'utf8');
  const bugsHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'bugs', 'hooks', 'use-bugs.js'), 'utf8');
  const bugsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'bugs', 'components', 'bugs-workspace.js'), 'utf8');
  const workItemsHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'hooks', 'use-work-items.js'), 'utf8');
  const workItemsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'work-items-workspace.js'), 'utf8');
  const kanbanWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'kanban-workspace.js'), 'utf8');
  const ganttWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'gantt-workspace.js'), 'utf8');
  const documentsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'documents-workspace.js'), 'utf8');
  const integrationsHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'hooks', 'use-integrations.js'), 'utf8');
  const integrationsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'integrations-workspace.js'), 'utf8');
  const settingsHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'hooks', 'use-project-settings.js'), 'utf8');
  const settingsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'settings-workspace.js'), 'utf8');
  const moduleDocumentWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'components', 'module-document-workspace.js'), 'utf8');
  const moduleDocumentHook = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'hooks', 'use-module-document.js'), 'utf8');
  const softwareRoutes = fs.readFileSync(path.join(repoRoot, 'src', 'server', 'routes', 'software-routes.js'), 'utf8');
  const projectProfiles = fs.readFileSync(path.join(repoRoot, 'src', 'project-profiles.js'), 'utf8');

  assert.equal(fs.existsSync(path.join(repoRoot, 'docs', 'Document-Hierarchy-Spec.md')), false);
  assert.match(projectProfiles, /project_brief/);
  assert.match(projectProfiles, /hierarchyGroup/);
  assert.match(projectProfiles, /hierarchyOrder/);
  assert.match(projectProfiles, /purposeSummary/);
  assert.match(projectProfiles, /parentExtensionSummary/);
  assert.match(projectProfiles, /childExtensionSummary/);
  assert.match(projectProfiles, /hierarchyDepth/);
  assert.doesNotMatch(coreNav, /Settings/);
  assert.match(architectureHook, /\/api\/projects\/\$\{project\.id\}\/architecture/);
  assert.match(architectureHook, /\/api\/projects\/\$\{project\.id\}\/architecture\/fragments/);
  assert.match(architectureWorkspace, /Architecture workspace/);
  assert.match(architectureWorkspace, /Component flow/);
  assert.match(architectureWorkspace, /ReactFlow/);
  assert.match(architectureWorkspace, /Add component/);
  assert.match(architectureWorkspace, /Load Fragments/);
  assert.match(architectureWorkspace, /ProjectFamilyDocumentContext/);
  assert.match(domainModelsWorkspace, /ProjectFamilyDocumentContext/);
  assert.match(projectFamilyDocumentContext, /Project Family Context/);
  assert.match(projectFamilyDocumentContext, /Parent orchestration/);
  assert.match(projectFamilyDocumentContext, /Child autonomous/);
  assert.match(adrWorkspace, /ADR workspace/);
  assert.match(adrWorkspace, /Related Architecture Elements/);
  assert.match(adrWorkspace, /Load Fragments/);
  assert.match(changelogWorkspace, /Change log workspace/);
  assert.match(changelogWorkspace, /Target Item ID/);
  assert.match(changelogWorkspace, /Load Fragments/);
  assert.match(featuresHook, /\/api\/projects\/\$\{project\.id\}\/features/);
  assert.match(featuresHook, /\/api\/projects\/\$\{project\.id\}\/features\/fragments/);
  assert.match(featuresWorkspace, /Features workspace/);
  assert.match(featuresWorkspace, /Create feature/);
  assert.match(featuresWorkspace, /Load Fragments/);
  assert.match(bugsHook, /\/api\/projects\/\$\{project\.id\}\/bugs/);
  assert.match(bugsHook, /\/api\/projects\/\$\{project\.id\}\/bugs\/fragments/);
  assert.match(bugsWorkspace, /Bugs workspace/);
  assert.match(bugsWorkspace, /Create bug/);
  assert.match(bugsWorkspace, /Load Fragments/);
  assert.match(moduleDocumentHook, /\/api\/projects\/\$\{project\.id\}\/module-documents\/\$\{moduleKey\}/);
  assert.match(moduleDocumentWorkspace, /Load Fragments/);
  assert.match(moduleDocumentWorkspace, /starter editor is deliberately simple/);
  assert.match(moduleDocumentWorkspace, /ModuleDocumentExtensionNote/);
  assert.match(moduleDocumentWorkspace, /Parent document role/);
  assert.match(moduleDocumentWorkspace, /Child document role/);
  assert.match(workItemsHook, /\/api\/projects\/\$\{project\.id\}\/work-items/);
  assert.match(workItemsWorkspace, /Work items workspace/);
  assert.match(kanbanWorkspace, /Kanban workspace/);
  assert.match(ganttWorkspace, /Gantt workspace/);
  assert.match(documentsWorkspace, /Documents workspace/);
  assert.match(documentsWorkspace, /PROJECT_BRIEF\.md/);
  assert.match(documentsWorkspace, /Expected project documents/);
  assert.match(documentsWorkspace, /Project Brief acting as the root/);
  assert.match(integrationsHook, /\/api\/integrations\/catalog/);
  assert.match(integrationsWorkspace, /Integrations workspace/);
  assert.match(settingsHook, /fetchJson\('\/api\/settings'\)/);
  assert.match(settingsWorkspace, /Project settings workspace/);
  assert.match(workspaceShell, /ArchitectureWorkspace/);
  assert.match(workspaceShell, /AdrWorkspace/);
  assert.match(workspaceShell, /FeaturesWorkspace/);
  assert.match(workspaceShell, /BugsWorkspace/);
  assert.match(workspaceShell, /ChangelogWorkspace/);
  assert.match(workspaceShell, /KanbanWorkspace/);
  assert.match(workspaceShell, /GanttWorkspace/);
  assert.match(workspaceShell, /WorkItemsWorkspace/);
  assert.match(workspaceShell, /DocumentsWorkspace/);
  assert.match(workspaceShell, /IntegrationsWorkspace/);
  assert.match(workspaceShell, /ModuleDocumentWorkspace/);
  assert.match(workspaceShell, /ProjectSettingsModal/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/features\/fragments/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/bugs\/fragments/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/architecture\/fragments/);
  assert.match(softwareRoutes, /\/api\/projects\/:id\/module-documents\/:moduleKey\/fragments/);
});

test('client fragment helpers keep PRD fragments isolated from feature module state', () => {
  const appSource = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');
  assert.match(appSource, /function getPrdFragments\(\)\s*\{\s*return phase5State\.prd && Array\.isArray\(phase5State\.prd\.fragments\)/);
  assert.doesNotMatch(appSource, /phase5State\.features && Array\.isArray\(phase5State\.features\.fragments\)/);
  assert.match(appSource, /const fragmentLabel = fragment\.code \|\| fragment\.id \|\| 'PRD fragment'/);
  assert.match(appSource, /Linked feature: \$\{getFeatureDisplayLabel\(fragment\.featureId\)\}/);
});

test('database schema designer exposes structured entity, field, relationship, index, and constraint editors', () => {
  const appSource = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');
  const schemaGeneratorSection = (appSource.match(/function buildClientDatabaseSchemaGeneratedMermaid[\s\S]*?function buildClientDatabaseSchemaMarkdown/) || [''])[0];
  assert.match(appSource, /data-schema-add-entity/);
  assert.match(appSource, /data-schema-column-field/);
  assert.match(appSource, /data-schema-add-relationship/);
  assert.match(appSource, /data-schema-index-field/);
  assert.match(appSource, /data-schema-constraint-field/);
  assert.match(appSource, /Generated DBML/);
  assert.match(appSource, /Generated Mermaid/);
  assert.doesNotMatch(appSource, /: "\\$\{escapeMermaidLabel/);
  assert.match(appSource, /facts\.push\('FK'\)/);
  assert.match(appSource, /facts\.push\('UK'\)/);
  assert.match(schemaGeneratorSection, /return lines\.join\('\\n'\);/);
  assert.doesNotMatch(schemaGeneratorSection, /\[\.\.\.new Set\(lines\)\]\.join\('\\n'\)/);
});

test('database schema workspace exposes human-readable sync labels and close-the-loop actions', () => {
  const schemaWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'components', 'database-schema-workspace.js'), 'utf8');
  assert.match(schemaWorkspace, /function formatSyncLabel/);
  assert.match(schemaWorkspace, /Version Match, Content Mismatch/);
  assert.match(schemaWorkspace, /Mark runtime updated/);
  assert.match(schemaWorkspace, /Adopt observed as intended/);
  assert.match(schemaWorkspace, /No object-level drift is currently detected/);
});

test('mermaid vendor module and chunk assets are served as JavaScript modules instead of falling through to index html', async () => {
  let result = await request('/vendor/mermaid.mjs');
  assert.equal(result.response.status, 200);
  assert.match(String(result.response.headers.get('content-type') || ''), /javascript/i);
  assert.match(String(result.body), /import.*\.\/chunks\/mermaid\.esm\.min\//);

  result = await request('/vendor/chunks/mermaid.esm.min/chunk-ASAHGCDZ.mjs');
  assert.equal(result.response.status, 200);
  assert.match(String(result.response.headers.get('content-type') || ''), /javascript/i);
  assert.doesNotMatch(String(result.body), /<html/i);
});

test('architecture and database schema modules are editable through the shared document pipeline', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Beta',
      name: 'Software Designer Docs',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'bugs', 'prd', 'architecture', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  result = await request(`/api/projects/${project.id}/architecture`);
  assert.equal(result.response.status, 200);
  assert.match(result.body.markdown, /# Architecture: Software Designer Docs/);

  result = await request(`/api/projects/${project.id}/database-schema`);
  assert.equal(result.response.status, 200);
  assert.match(result.body.markdown, /# Database Schema: Software Designer Docs/);

  result = await request(`/api/projects/${project.id}/architecture`, {
    method: 'PUT',
    body: JSON.stringify({
      editorState: {
        overview: {
          systemPurpose: 'Design a software project as a product, not just a document set.',
          architecturalVision: 'Use a database-first project designer with generated markdown outputs.',
          architecturalStyle: 'Local-first desktop app with modular software design surfaces.',
          versionDate: '2026-03-29T12:00:00.000Z',
        },
        components: [{ title: 'Designer Workspace', description: 'Hosts roadmap, architecture, schema, and PRD design surfaces.', versionDate: '2026-03-29T12:00:00.000Z' }],
        componentConnections: [{ source: 'Designer Workspace', target: 'Local API', label: 'invokes', versionDate: '2026-03-29T12:00:00.000Z' }],
        boundaries: [{ title: 'Core vs Software', description: 'Keep roadmap/kanban/gantt core and software modules specialized.', versionDate: '2026-03-29T12:00:00.000Z' }],
        integrations: [],
        runtimeScenarios: [{ title: 'Design sync', description: 'Saving architecture updates the database-first document state and regenerates markdown.', versionDate: '2026-03-29T12:00:00.000Z' }],
        operationalConcerns: [{ title: 'Document reconciliation', description: 'Regenerate markdown if the database is newer or the file is missing.', versionDate: '2026-03-29T12:00:00.000Z' }],
        decisions: [{ title: 'Database-first documents', description: 'SQLite is canonical and markdown is generated/reconciled.', versionDate: '2026-03-29T12:00:00.000Z' }],
        constraints: [],
        deployment: {
          runtimeTopology: 'Electron shell + local Express API + SQLite database.',
          environmentNotes: 'Generated markdown lives in the project docs folder.',
          versionDate: '2026-03-29T12:00:00.000Z',
        },
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.match(result.body.markdown, /Designer Workspace/);
  assert.match(result.body.markdown, /## 3\. Technology Stack/);
  assert.match(result.body.markdown, /## 5\. Workflows/);
  assert.match(result.body.markdown, /## 8\. Cross-Cutting Concerns/);
  assert.match(result.body.markdown, /Designer Workspace -> Local API \(invokes\)/);
  assert.match(result.body.mermaid, /Designer Workspace/);
  assert.match(result.body.mermaid, /Local API/);
  assert.match(result.body.mermaid, /invokes/);

  result = await request(`/api/projects/${project.id}/database-schema`, {
    method: 'PUT',
    body: JSON.stringify({
      mermaid: 'erDiagram\n  STALE ||--o{ VALUE : old',
      dbml: 'Project "Stale" {\n  database_type: "Generic"\n}\n\nTable stale {\n  id text\n}',
      editorState: {
        overview: {
          purpose: 'Model project documents, modules, work items, and sync metadata.',
          storageStrategy: 'Keep SQLite canonical and regenerate markdown artifacts when needed.',
          versionDate: '2026-03-29T12:05:00.000Z',
        },
        entities: [],
        relationships: [],
        constraints: [],
        indexes: [],
        migrations: [{ title: 'Enable design modules', description: 'No new table needed; reuse the shared document metadata pipeline.', versionDate: '2026-03-29T12:05:00.000Z' }],
        synchronizationRules: [{ title: 'DB-first rule', description: 'If markdown is missing or stale, regenerate it from SQLite.', versionDate: '2026-03-29T12:05:00.000Z' }],
        openQuestions: [],
        schemaModel: {
          entities: [
            {
              id: 'project_md_documents',
              name: 'project_md_documents',
              kind: 'table',
              status: 'active',
              notes: 'Tracks generated markdown, checksums, and sync metadata.',
              fields: [
                { id: 'project_md_documents.project_id', name: 'project_id', type: 'text', nullable: false, primaryKey: true, unique: false, defaultValue: '', status: 'active', notes: 'Owning project id.' },
                { id: 'project_md_documents.doc_type', name: 'doc_type', type: 'text', nullable: false, primaryKey: true, unique: false, defaultValue: '', status: 'active', notes: 'Managed document type.' },
                { id: 'project_md_documents.module_key', name: 'module_key', type: 'text', nullable: true, primaryKey: false, unique: false, defaultValue: '', status: 'active', notes: 'Associated module key.' },
              ],
            },
            {
              id: 'project_modules',
              name: 'project_modules',
              kind: 'table',
              status: 'active',
              notes: 'Stores enabled module state per project.',
              fields: [
                { id: 'project_modules.project_id', name: 'project_id', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', referencesEntityId: 'project_md_documents', referencesFieldId: 'project_md_documents.project_id', status: 'active', notes: 'Owning project id.' },
                { id: 'project_modules.module_key', name: 'module_key', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', status: 'active', notes: 'Enabled module key.' },
              ],
            },
          ],
          relationships: [
            { id: 'rel_project_modules_documents', fromEntityId: 'project_modules', fromFieldId: 'project_modules.project_id', toEntityId: 'project_md_documents', toFieldId: 'project_md_documents.project_id', cardinality: 'many-to-one', status: 'active', notes: 'Both records are scoped to the same project.' },
          ],
          indexes: [
            { id: 'idx_project_modules_project', entityId: 'project_modules', name: 'project_modules_project_key', fields: ['project_id', 'module_key'], unique: true, status: 'active', notes: 'Fast module lookups per project.' },
          ],
          constraints: [
            { id: 'pk_project_md_documents', entityId: 'project_md_documents', name: 'project_md_documents_pk', type: 'primary_key', definition: '(project_id, doc_type)', status: 'active', notes: 'Composite primary key for managed docs.' },
          ],
        },
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.match(result.body.markdown, /project_md_documents/);
  assert.match(result.body.markdown, /#### Fields/);
  assert.match(result.body.markdown, /module_key/);
  assert.match(result.body.dbml, /Table project_md_documents/);
  assert.match(result.body.dbml, /Ref: project_modules\.project_id < project_md_documents\.project_id/);
  assert.doesNotMatch(result.body.dbml, /Table stale/);

  const projectDocsDir = path.join(project.absolutePath, 'docs');
  const rootsForSchema = await request('/api/roots');
  const projectTemplatesDir = path.join(rootsForSchema.body.dataDir, 'projects', project.id, 'templates');
  const projectWorkspaceDir = path.join(project.absolutePath, '.apm', '_WORKSPACE');
  const projectFragmentsDir = path.join(rootsForSchema.body.dataDir, 'projects', project.id, 'fragments');
  const architectureDocPath = path.join(projectDocsDir, 'ARCHITECTURE.md');
  const schemaDocPath = path.join(projectDocsDir, 'DATABASE_SCHEMA.md');
  const schemaDbmlPath = path.join(projectDocsDir, 'DATABASE_SCHEMA.dbml');
  const architectureTemplatePath = path.join(projectTemplatesDir, 'ARCHITECTURE.template.md');
  const schemaTemplatePath = path.join(projectTemplatesDir, 'DATABASE_SCHEMA.template.md');
  const schemaFragmentTemplatePath = path.join(projectFragmentsDir, 'DATABASE_SCHEMA_FRAGMENT.template.md');
  const workspaceTodoPath = path.join(projectWorkspaceDir, 'TODO.md');
  assert.equal(fs.existsSync(architectureDocPath), true);
  assert.equal(fs.existsSync(schemaDocPath), true);
  assert.equal(fs.existsSync(schemaDbmlPath), true);
  assert.equal(fs.existsSync(architectureTemplatePath), true);
  assert.equal(fs.existsSync(schemaTemplatePath), true);
  assert.equal(fs.existsSync(schemaFragmentTemplatePath), true);
  assert.equal(fs.existsSync(workspaceTodoPath), true);

  const architectureFile = fs.readFileSync(architectureDocPath, 'utf8');
  const schemaFile = fs.readFileSync(schemaDocPath, 'utf8');
  const schemaDbmlFile = fs.readFileSync(schemaDbmlPath, 'utf8');
  assert.match(architectureFile, /Designer Workspace/);
  assert.match(architectureFile, /## 2\. Architecture Registry/);
  assert.match(architectureFile, /## 5\. Workflows/);
  assert.match(architectureFile, /## 7\. Persistence and State/);
  assert.match(schemaFile, /project_md_documents/);
  assert.match(schemaDbmlFile, /Project "Software Designer Docs"/);
  const schemaFragmentTemplateFile = fs.readFileSync(schemaFragmentTemplatePath, 'utf8');
  assert.match(schemaFragmentTemplateFile, /DATABASE_SCHEMA_FRAGMENT\.template\.md/);
  assert.match(schemaFragmentTemplateFile, /## DBML/);
  assert.match(schemaFragmentTemplateFile, /Do not invent tables, fields, keys, defaults, indexes, or constraints/);
  const architectureTemplateFile = fs.readFileSync(architectureTemplatePath, 'utf8');
  assert.match(architectureTemplateFile, /### 1\.3 Architectural Style/);
  assert.match(architectureTemplateFile, /### 4\.2 Component Connections/);
  assert.match(architectureTemplateFile, /### 5\.2 Architecture Workflows/);
  assert.match(architectureTemplateFile, /Template Version: `2\.0`/);

  const adrTemplateFile = fs.readFileSync(path.join(repoRoot, 'templates', 'ADR.template.md'), 'utf8');
  assert.match(adrTemplateFile, /## 2\. Decision Metadata/);
  assert.match(adrTemplateFile, /## 8\. Related Architecture Elements/);
  assert.match(adrTemplateFile, /Template Version: `2\.0`/);

  const architectureRow = await dbModule.dbGet(
    'SELECT module_key, template_name, source_of_truth, editor_state FROM project_md_documents WHERE project_id = ? AND doc_type = ?',
    [project.id, 'architecture']
  );
  assert.equal(architectureRow.module_key, 'architecture');
  assert.equal(architectureRow.template_name, 'ARCHITECTURE.template.md');
  assert.equal(architectureRow.source_of_truth, 'database');
  assert.match(architectureRow.editor_state, /Designer Workspace/);
  assert.match(architectureRow.editor_state, /componentConnections/);

  const schemaRow = await dbModule.dbGet(
    'SELECT module_key, template_name, source_of_truth, editor_state FROM project_md_documents WHERE project_id = ? AND doc_type = ?',
    [project.id, 'database_schema']
  );
  assert.equal(schemaRow.module_key, 'database_schema');
  assert.equal(schemaRow.template_name, 'DATABASE_SCHEMA.template.md');
  assert.equal(schemaRow.source_of_truth, 'database');
  assert.match(schemaRow.editor_state, /project_md_documents/);
});

test('database schema fragment import populates schema state and generates md and dbml outputs', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Alpha',
      name: 'Schema Import Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;
  const projectDocsDir = path.join(project.absolutePath, 'docs');
  fs.mkdirSync(projectDocsDir, { recursive: true });
  const uploadedFragmentPath = path.join(projectDocsDir, 'DATABASE_SCHEMA_FRAGMENT_20260329_233000000.md');

  const fragmentMarkdown = [
    '# Database Schema Fragment: Angel\'s Project Manager Import Fixture',
    '',
    '> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'database_schema_fragment',
      version: 1,
      fragment: {
        id: 'schema-fragment-apm-fixture',
        projectId: project.id,
        code: 'DBFRAG-001',
        title: 'Angel\'s Project Manager observed SQLite schema',
        payload: {
          source: {
            sourceType: 'sqlite_database',
            sourceLabel: 'Angel\'s Project Manager app.db',
            dialect: 'sqlite',
            observedAt: '2026-03-29T23:30:00.000Z',
            schemaFingerprint: 'apm-app-schema-fixture',
            confidence: 'observed',
          },
          summary: 'Observed SQLite schema for Angel\'s Project Manager, intended to seed the Database Schema module.',
          entities: [
            {
              id: 'projects',
              name: 'projects',
              kind: 'table',
              status: 'observed',
              notes: 'Stores project metadata, root paths, mappings, and project typing.',
              fields: [
                { id: 'projects.id', name: 'id', type: 'text', nullable: false, primaryKey: true, unique: true, defaultValue: '', status: 'observed', notes: 'Project identifier.' },
                { id: 'projects.name', name: 'name', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', status: 'observed', notes: 'Human-readable project name.' },
                { id: 'projects.project_type', name: 'project_type', type: 'text', nullable: true, primaryKey: false, unique: false, defaultValue: "'general'", status: 'observed', notes: 'Derived project type profile.' },
              ],
            },
            {
              id: 'tasks',
              name: 'tasks',
              kind: 'table',
              status: 'observed',
              notes: 'Core work-item table backing roadmap, board, and software work items.',
              fields: [
                { id: 'tasks.id', name: 'id', type: 'text', nullable: false, primaryKey: true, unique: true, defaultValue: '', status: 'observed', notes: 'Task/work-item identifier.' },
                { id: 'tasks.project_id', name: 'project_id', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', referencesEntityId: 'projects', referencesFieldId: 'projects.id', status: 'observed', notes: 'Owning project.' },
                { id: 'tasks.title', name: 'title', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', status: 'observed', notes: 'Work-item title.' },
                { id: 'tasks.work_item_type', name: 'work_item_type', type: 'text', nullable: true, primaryKey: false, unique: false, defaultValue: "'core_task'", status: 'observed', notes: 'Typed work-item discriminator.' },
              ],
            },
            {
              id: 'project_md_documents',
              name: 'project_md_documents',
              kind: 'table',
              status: 'observed',
              notes: 'Tracks database-first markdown documents and file reconciliation metadata.',
              fields: [
                { id: 'project_md_documents.project_id', name: 'project_id', type: 'text', nullable: false, primaryKey: true, unique: false, defaultValue: '', referencesEntityId: 'projects', referencesFieldId: 'projects.id', status: 'observed', notes: 'Owning project.' },
                { id: 'project_md_documents.doc_type', name: 'doc_type', type: 'text', nullable: false, primaryKey: true, unique: false, defaultValue: '', status: 'observed', notes: 'Managed document type key.' },
                { id: 'project_md_documents.module_key', name: 'module_key', type: 'text', nullable: true, primaryKey: false, unique: false, defaultValue: "''", status: 'observed', notes: 'Module associated with the managed document.' },
              ],
            },
          ],
          relationships: [
            { id: 'rel_tasks_project', fromEntityId: 'tasks', fromFieldId: 'tasks.project_id', toEntityId: 'projects', toFieldId: 'projects.id', cardinality: 'many-to-one', status: 'observed', notes: 'Tasks belong to a single project.' },
            { id: 'rel_docs_project', fromEntityId: 'project_md_documents', fromFieldId: 'project_md_documents.project_id', toEntityId: 'projects', toFieldId: 'projects.id', cardinality: 'many-to-one', status: 'observed', notes: 'Managed documents belong to a single project.' },
          ],
          indexes: [
            { id: 'idx_tasks_project', entityId: 'tasks', name: 'tasks_project_id', fields: ['project_id'], unique: false, status: 'inferred', notes: 'Project-scoped task lookups are expected frequently.' },
          ],
          constraints: [
            { id: 'pk_project_md_documents', entityId: 'project_md_documents', name: 'project_md_documents_pk', type: 'primary_key', definition: '(project_id, doc_type)', status: 'observed', notes: 'Composite primary key for managed documents.' },
          ],
          migrationNotes: [
            { title: 'JSON to SQLite persistence migration', description: 'Projects, credentials, and work items were moved into SQLite as the canonical source of truth.', status: 'observed' },
          ],
          openQuestions: [
            { id: 'schema-open-001', question: 'Should project_md_documents become a generalized artifact table later?', impact: 'May affect future non-markdown document modules.', proposedFollowUp: 'Review when additional project-type documents are added.' },
          ],
          dbml: [
            "Project \"Angel's Project Manager\" {",
            '  database_type: "Generic"',
            '}',
            '',
            'Table projects {',
            '  id text [pk, unique, not null]',
            '  name text [not null]',
            "  project_type text [default: 'general']",
            '}',
            '',
            'Table tasks {',
            '  id text [pk, unique, not null]',
            '  project_id text [not null]',
            '  title text [not null]',
            "  work_item_type text [default: 'core_task']",
            '}',
            '',
            'Table project_md_documents {',
            '  project_id text [pk, not null]',
            '  doc_type text [pk, not null]',
            '  module_key text',
            '}',
            '',
            'Ref: tasks.project_id > projects.id',
            'Ref: project_md_documents.project_id > projects.id',
          ].join('\\n'),
          mermaid: [
            'erDiagram',
            '  PROJECTS ||--o{ TASKS : owns',
            '  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : owns',
          ].join('\\n'),
        },
      },
    }, null, 2),
    '-->',
    '',
    '## Import Summary',
    '',
    'Observed SQLite schema for Angel\'s Project Manager, intended to seed the Database Schema module.',
    '',
    '## Source Metadata',
    '',
    '- Source Type: sqlite_database',
    '- Dialect: sqlite',
    '- Confidence: observed',
    '',
    '## Observed Schema Summary',
    '',
    '- 3 entities captured for the import smoke test.',
    '- 2 relationships captured.',
    '',
    '## Entities',
    '',
    '### 1. projects',
    '',
    '- Status: observed',
    '',
    '## Relationships',
    '',
    '### 1. tasks.project_id -> projects.id',
    '',
    '## Indexes and Constraints',
    '',
    '### 1. project_md_documents primary key',
    '',
    '## Migration Notes',
    '',
    '- JSON to SQLite persistence migration captured.',
    '',
    '## Open Questions',
    '',
    '- Should project_md_documents become a generalized artifact table later?',
    '',
    '## DBML',
    '',
    '```dbml',
    "Project \"Angel's Project Manager\" {",
    '  database_type: "Generic"',
    '}',
    '',
    'Table projects {',
    '  id text [pk, unique, not null]',
    '  name text [not null]',
    "  project_type text [default: 'general']",
    '}',
    '```',
    '',
    '## Mermaid',
    '',
    '```mermaid',
    'erDiagram',
    '  PROJECTS ||--o{ TASKS : owns',
    '  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : owns',
    '```',
    '',
    '## Merge Guidance',
    '',
    '- Import this fragment into the Database Schema module.',
  ].join('\n');

  fs.writeFileSync(uploadedFragmentPath, fragmentMarkdown, 'utf8');

  result = await request(`/api/projects/${project.id}/database-schema/import-fragment`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: 'DATABASE_SCHEMA_FRAGMENT_20260329_233000000.md',
      markdown: fragmentMarkdown,
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(uploadedFragmentPath), true);
  assert.match(result.body.markdown, /Observed SQLite schema for Angel's Project Manager/);
  assert.match(result.body.markdown, /### 1\.3 Sync Status/);
  assert.match(result.body.markdown, /- Sync Status: in_sync/);
  assert.match(result.body.markdown, /- Drift Severity: low/);
  assert.match(result.body.markdown, /- Change Source: observed_import/);
  assert.match(result.body.markdown, /- Pending Migration Status: none/);
  assert.match(result.body.markdown, /- Recommended Action: none/);
  assert.match(result.body.markdown, /project_md_documents/);
  assert.match(result.body.dbml, /\/\/ Intended Version: 1/);
  assert.match(result.body.dbml, /\/\/ Observed Version: 1/);
  assert.match(result.body.dbml, /\/\/ Sync Status: in_sync/);
  assert.match(result.body.dbml, /\/\/ Drift Severity: low/);
  assert.match(result.body.dbml, /\/\/ Change Source: observed_import/);
  assert.match(result.body.dbml, /\/\/ Pending Migration Status: none/);
  assert.match(result.body.dbml, /\/\/ Recommended Action: none/);
  assert.match(result.body.dbml, /Table projects/);
  assert.match(result.body.dbml, /Ref: tasks\.project_id < projects\.id/);
  assert.equal(result.body.editorState.importSource.sourceType, 'sqlite_database');
  assert.equal(result.body.editorState.syncTracking.intendedVersion, 1);
  assert.equal(result.body.editorState.syncTracking.observedVersion, 1);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'in_sync');
  assert.equal(result.body.editorState.syncTracking.driftSeverity, 'low');
  assert.equal(result.body.editorState.syncTracking.changeSource, 'observed_import');
  assert.equal(result.body.editorState.syncTracking.pendingMigrationStatus, 'none');
  assert.equal(result.body.editorState.syncTracking.recommendedAction, 'none');
  assert.equal(Array.isArray(result.body.editorState.syncTracking.actionItems), true);
  assert.equal(result.body.editorState.syncTracking.actionItems.length, 0);
  assert.equal(result.body.editorState.openQuestions.length, 1);

  const schemaDocPath = path.join(projectDocsDir, 'DATABASE_SCHEMA.md');
  const schemaDbmlPath = path.join(projectDocsDir, 'DATABASE_SCHEMA.dbml');
  assert.equal(fs.existsSync(schemaDocPath), true);
  assert.equal(fs.existsSync(schemaDbmlPath), true);
  const schemaDoc = fs.readFileSync(schemaDocPath, 'utf8');
  const schemaDbml = fs.readFileSync(schemaDbmlPath, 'utf8');
  assert.match(schemaDoc, /### 1\.3 Sync Status/);
  assert.match(schemaDoc, /- Sync Status: in_sync/);
  assert.match(schemaDoc, /- Drift Severity: low/);
  assert.match(schemaDoc, /- Change Source: observed_import/);
  assert.match(schemaDoc, /- Pending Migration Status: none/);
  assert.match(schemaDoc, /- Recommended Action: none/);
  assert.match(schemaDoc, /## 7\. Open Questions/);
  assert.match(schemaDoc, /Angel's Project Manager app\.db/);
  assert.match(schemaDbml, /\/\/ Sync Status: in_sync/);
  assert.match(schemaDbml, /\/\/ Drift Severity: low/);
  assert.match(schemaDbml, /\/\/ Change Source: observed_import/);
  assert.match(schemaDbml, /\/\/ Pending Migration Status: none/);
  assert.match(schemaDbml, /\/\/ Recommended Action: none/);
  assert.match(schemaDbml, /\/\/ Action Item Count: 0/);
  assert.match(schemaDbml, /Table project_md_documents/);
});

test('database schema fragment import rejects uploads that do not comply with the fragment template shape', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Beta',
      name: 'Schema Validation Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  const invalidFragment = [
    '# Database Schema Fragment: Invalid Fixture',
    '',
    '> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'database_schema_fragment',
      version: 1,
      fragment: {
        id: 'invalid-schema-fragment',
        projectId: project.id,
        code: 'DBFRAG-BAD-001',
        title: 'Invalid schema fragment',
        payload: {
          source: {
            sourceType: 'totally_invalid_source',
            sourceLabel: 'Broken source',
            dialect: 'sqlite',
            observedAt: '',
            schemaFingerprint: 'broken',
            confidence: 'observed',
          },
          summary: 'Broken payload missing required arrays and sections.',
          entities: [],
          relationships: [],
          indexes: [],
          constraints: [],
          migrationNotes: [],
          openQuestions: [],
          dbml: '',
          mermaid: 'erDiagram',
        },
      },
    }, null, 2),
    '-->',
    '',
    '## Import Summary',
    '',
    'Broken fixture.',
    '',
    '## Source Metadata',
    '',
    '- Source Type: invalid',
    '',
    '## Observed Schema Summary',
    '',
    '- No data.',
    '',
    '## Entities',
    '',
    'None.',
  ].join('\n');

  result = await request(`/api/projects/${project.id}/database-schema/import-fragment`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: 'DATABASE_SCHEMA_FRAGMENT_invalid.md',
      markdown: invalidFragment,
    }),
  });
  assert.equal(result.response.status, 400);
  assert.match(String(result.body.error || ''), /sourceType|missing required section|DBML fenced block/i);
});

test('database schema intended saves increment intended version and leave observed version behind until runtime catches up', async () => {
  const { body: currentRoots } = await request('/api/roots');
  fs.mkdirSync(path.join(currentRoots.projectsRoot, 'Gamma'), { recursive: true });
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Gamma',
      name: 'Schema Versioning Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  const fragmentMarkdown = [
    '# Database Schema Fragment: Versioning Fixture',
    '',
    '> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'database_schema_fragment',
      version: 1,
      fragment: {
        id: 'schema-versioning-fixture',
        projectId: project.id,
        code: 'DBFRAG-VERSION-001',
        title: 'Schema versioning fixture',
        payload: {
          source: {
            sourceType: 'sqlite_database',
            sourceLabel: 'Versioning fixture',
            dialect: 'sqlite',
            observedAt: '2026-04-02T23:30:00.000Z',
            schemaFingerprint: 'schema-versioning-fixture',
            confidence: 'observed',
          },
          summary: 'Observed schema snapshot used to seed version tracking.',
          entities: [
            {
              id: 'projects',
              name: 'projects',
              kind: 'table',
              status: 'observed',
              notes: 'Base projects table.',
              fields: [
                { id: 'projects.id', name: 'id', type: 'text', nullable: false, primaryKey: true, unique: true, defaultValue: '', status: 'observed', notes: 'Primary key.' },
                { id: 'projects.name', name: 'name', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', status: 'observed', notes: 'Project name.' },
              ],
            },
          ],
          relationships: [],
          indexes: [],
          constraints: [],
          migrationNotes: [],
          openQuestions: [],
          dbml: [
            'Project "Versioning Fixture" {',
            '  database_type: "Generic"',
            '}',
            '',
            'Table projects {',
            '  id text [pk, unique, not null]',
            '  name text [not null]',
            '}',
          ].join('\\n'),
          mermaid: 'erDiagram',
        },
      },
    }, null, 2),
    '-->',
    '',
    '## Import Summary',
    '',
    'Observed schema snapshot used to seed version tracking.',
    '',
    '## Source Metadata',
    '',
    '- Source Type: sqlite_database',
    '- Dialect: sqlite',
    '- Confidence: observed',
    '',
    '## Observed Schema Summary',
    '',
    '- 1 entity captured.',
    '',
    '## Entities',
    '',
    '### 1. projects',
    '',
    '- Status: observed',
    '',
    '## Relationships',
    '',
    '- None.',
    '',
    '## Indexes and Constraints',
    '',
    '- None.',
    '',
    '## Migration Notes',
    '',
    '- None.',
    '',
    '## Open Questions',
    '',
    '- None.',
    '',
    '## DBML',
    '',
    '```dbml',
    'Project "Versioning Fixture" {',
    '  database_type: "Generic"',
    '}',
    '',
    'Table projects {',
    '  id text [pk, unique, not null]',
    '  name text [not null]',
    '}',
    '```',
    '',
    '## Mermaid',
    '',
    '```mermaid',
    'erDiagram',
    '```',
    '',
    '## Merge Guidance',
    '',
    '- Import this fragment into the Database Schema module.',
  ].join('\n');

  result = await request(`/api/projects/${project.id}/database-schema/import-fragment`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: 'DATABASE_SCHEMA_FRAGMENT_20260402_versioning.md',
      markdown: fragmentMarkdown,
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.syncTracking.intendedVersion, 1);
  assert.equal(result.body.editorState.syncTracking.observedVersion, 1);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'in_sync');

  const updatedEditorState = JSON.parse(JSON.stringify(result.body.editorState));
  updatedEditorState.schemaModel.entities[0].fields.push({
    id: 'projects.category',
    name: 'category',
    type: 'text',
    nullable: true,
    primaryKey: false,
    unique: false,
    defaultValue: '',
    referencesEntityId: '',
    referencesFieldId: '',
    status: 'draft',
    notes: 'Intended-only field not yet present in the runtime database.',
  });

  result = await request(`/api/projects/${project.id}/database-schema`, {
    method: 'PUT',
    body: JSON.stringify({
      editorState: updatedEditorState,
      mermaid: result.body.mermaid,
      dbml: result.body.dbml,
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.syncTracking.intendedVersion, 2);
  assert.equal(result.body.editorState.syncTracking.observedVersion, 1);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'intended_ahead');
  assert.equal(result.body.editorState.syncTracking.driftSeverity, 'medium');
  assert.equal(result.body.editorState.syncTracking.changeSource, 'intended_edit');
  assert.equal(result.body.editorState.syncTracking.pendingMigrationStatus, 'migration_required');
  assert.equal(result.body.editorState.syncTracking.recommendedAction, 'apply_intended_to_runtime');
  assert.equal(result.body.editorState.syncTracking.actionItems.some((item) => item.actionType === 'add_field_in_runtime' && /projects\.category/.test(item.objectName || '')), true);
  const entityDrift = result.body.editorState.syncTracking.driftDetails.entities.find((entry) => entry.id === 'projects');
  assert(entityDrift);
  assert.equal(entityDrift.driftStatus, 'mismatch');
  const fieldDrift = entityDrift.fields.find((entry) => entry.id === 'projects.category');
  assert(fieldDrift);
  assert.equal(fieldDrift.driftStatus, 'intended_only');
  assert.match(result.body.markdown, /- Sync Status: intended_ahead/);
  assert.match(result.body.markdown, /- Drift Severity: medium/);
  assert.match(result.body.markdown, /- Change Source: intended_edit/);
  assert.match(result.body.markdown, /- Pending Migration Status: migration_required/);
  assert.match(result.body.markdown, /- Recommended Action: apply_intended_to_runtime/);
  assert.match(result.body.markdown, /### 1\.3\.1 Recommended Work Items/);
  assert.match(result.body.markdown, /Add runtime field: projects\.category/);
  assert.match(result.body.dbml, /\/\/ Intended Version: 2/);
  assert.match(result.body.dbml, /\/\/ Observed Version: 1/);
  assert.match(result.body.dbml, /\/\/ Sync Status: intended_ahead/);
  assert.match(result.body.dbml, /\/\/ Drift Severity: medium/);
  assert.match(result.body.dbml, /\/\/ Change Source: intended_edit/);
  assert.match(result.body.dbml, /\/\/ Pending Migration Status: migration_required/);
  assert.match(result.body.dbml, /\/\/ Recommended Action: apply_intended_to_runtime/);
  assert.match(result.body.dbml, /\/\/ Action Item Count: /);
  assert.match(result.body.dbml, /\/\/ Action Item 1:/);

  result = await request(`/api/projects/${project.id}/database-schema/sync-actions`, {
    method: 'POST',
    body: JSON.stringify({ action: 'mark_runtime_updated' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'in_sync');
  assert.equal(result.body.editorState.syncTracking.pendingMigrationStatus, 'none');
  assert.equal(result.body.editorState.syncTracking.recommendedAction, 'none');
  assert.equal(result.body.editorState.syncTracking.observedVersion, 2);
  assert.equal(result.body.editorState.syncTracking.auditHistory.some((entry) => entry.action === 'mark_runtime_updated'), true);
  assert.match(result.body.markdown, /### 1\.3\.2 Sync Audit History/);
  assert.match(result.body.markdown, /Marked runtime schema as updated from intended version 2\./);
  assert.match(result.body.dbml, /\/\/ Last Sync Event: Marked runtime schema as updated from intended version 2\./);
});

test('database schema sync actions can adopt an observed schema into the intended design when runtime is ahead', async () => {
  const { body: currentRoots } = await request('/api/roots');
  fs.mkdirSync(path.join(currentRoots.projectsRoot, 'Delta'), { recursive: true });
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Delta',
      name: 'Schema Adoption Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  const buildFragment = (code, observedAt, extraFieldLine, extraFieldPayload = null) => [
    `# Database Schema Fragment: ${code}`,
    '',
    '> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'database_schema_fragment',
      version: 1,
      fragment: {
        id: code,
        projectId: project.id,
        code,
        title: code,
        payload: {
          source: {
            sourceType: 'sqlite_database',
            sourceLabel: code,
            dialect: 'sqlite',
            observedAt,
            schemaFingerprint: code,
            confidence: 'observed',
          },
          summary: `Observed schema snapshot ${code}.`,
          entities: [
            {
              id: 'projects',
              name: 'projects',
              kind: 'table',
              status: 'observed',
              notes: 'Projects table.',
              fields: [
                { id: 'projects.id', name: 'id', type: 'text', nullable: false, primaryKey: true, unique: true, defaultValue: '', status: 'observed', notes: 'Primary key.' },
                { id: 'projects.name', name: 'name', type: 'text', nullable: false, primaryKey: false, unique: false, defaultValue: '', status: 'observed', notes: 'Project name.' },
                ...(extraFieldPayload ? [extraFieldPayload] : []),
              ],
            },
          ],
          relationships: [],
          indexes: [],
          constraints: [],
          migrationNotes: [],
          openQuestions: [],
          dbml: [
            'Project "Schema Adoption Project" {',
            '  database_type: "Generic"',
            '}',
            '',
            'Table projects {',
            '  id text [pk, unique, not null]',
            '  name text [not null]',
            ...(extraFieldLine ? [extraFieldLine] : []),
            '}',
          ].join('\\n'),
          mermaid: 'erDiagram',
        },
      },
    }, null, 2),
    '-->',
    '',
    '## Import Summary',
    '',
    `Observed schema snapshot ${code}.`,
    '',
    '## Source Metadata',
    '',
    '- Source Type: sqlite_database',
    '- Dialect: sqlite',
    '- Confidence: observed',
    '',
    '## Observed Schema Summary',
    '',
    '- 1 entity captured.',
    '',
    '## Entities',
    '',
    '### 1. projects',
    '',
    '- Status: observed',
    '',
    '## Relationships',
    '',
    '- None.',
    '',
    '## Indexes and Constraints',
    '',
    '- None.',
    '',
    '## Migration Notes',
    '',
    '- None.',
    '',
    '## Open Questions',
    '',
    '- None.',
    '',
    '## DBML',
    '',
    '```dbml',
    'Project "Schema Adoption Project" {',
    '  database_type: "Generic"',
    '}',
    '',
    'Table projects {',
    '  id text [pk, unique, not null]',
    '  name text [not null]',
    ...(extraFieldLine ? [extraFieldLine] : []),
    '}',
    '```',
    '',
    '## Mermaid',
    '',
    '```mermaid',
    'erDiagram',
    '```',
    '',
    '## Merge Guidance',
    '',
    '- Import this fragment into the Database Schema module.',
  ].join('\n');

  result = await request(`/api/projects/${project.id}/database-schema/import-fragment`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: 'DATABASE_SCHEMA_FRAGMENT_seed.md',
      markdown: buildFragment('DBFRAG-ADOPT-001', '2026-04-03T00:00:00.000Z', ''),
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'in_sync');

  result = await request(`/api/projects/${project.id}/database-schema/import-fragment`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: 'DATABASE_SCHEMA_FRAGMENT_observed_ahead.md',
      markdown: buildFragment(
        'DBFRAG-ADOPT-002',
        '2026-04-03T00:05:00.000Z',
        '  purpose_summary text',
        { id: 'projects.purpose_summary', name: 'purpose_summary', type: 'text', nullable: true, primaryKey: false, unique: false, defaultValue: '', status: 'observed', notes: 'Observed-only field.' }
      ),
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'observed_ahead');
  assert.equal(result.body.editorState.syncTracking.recommendedAction, 'reconcile_runtime_to_intended');
  assert.equal(result.body.editorState.syncTracking.actionItems.some((item) => item.actionType === 'document_field_in_intended' && /projects\.purpose_summary/.test(item.objectName || '')), true);

  result = await request(`/api/projects/${project.id}/database-schema/sync-actions`, {
    method: 'POST',
    body: JSON.stringify({ action: 'adopt_observed_as_intended' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.syncTracking.syncStatus, 'in_sync');
  assert.equal(result.body.editorState.syncTracking.intendedVersion, 2);
  assert.equal(result.body.editorState.syncTracking.observedVersion, 2);
  assert.equal(result.body.editorState.syncTracking.auditHistory.some((entry) => entry.action === 'adopt_observed_as_intended'), true);
  assert.match(result.body.markdown, /`purpose_summary`/);
  assert.match(result.body.markdown, /Adopted observed schema into the intended design at version 2\./);
});

test('database schema fragment browser lists discoverable files and consuming a fragment deletes it', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Alpha',
      name: 'Schema Fragment Browser Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;
  const projectDocsDir = path.join(project.absolutePath, 'docs');
  const rootsForFragmentBrowser = await request('/api/roots');
  const projectFragmentsDir = path.join(rootsForFragmentBrowser.body.dataDir, 'projects', project.id, 'fragments');
  fs.mkdirSync(projectFragmentsDir, { recursive: true });
  fs.mkdirSync(projectDocsDir, { recursive: true });
  const fragmentFileName = 'DATABASE_SCHEMA_FRAGMENT_20260331_010101010.md';
  const fragmentPath = path.join(projectFragmentsDir, fragmentFileName);
  const sharedFragmentFileName = 'DATABASE_SCHEMA_FRAGMENT_20260331_020202020.md';
  const roots = await request('/api/roots');
  const sharedFragmentsDir = path.join(roots.body.dataDir, 'projects', 'shared', 'fragments');
  const sharedFragmentPath = path.join(sharedFragmentsDir, sharedFragmentFileName);
  const malformedSharedFragmentFileName = 'DATABASE_SCHEMA_FRAGMENT_20260331_030303030.md';
  const malformedSharedFragmentPath = path.join(sharedFragmentsDir, malformedSharedFragmentFileName);

  const fragmentMarkdown = [
    '# Database Schema Fragment: Browser Fixture',
    '',
    '> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'database_schema_fragment',
      version: 1,
      fragment: {
        id: 'schema-browser-fixture',
        projectId: project.id,
        code: 'DBFRAG-002',
        title: 'Browser fixture',
        payload: {
          source: {
            sourceType: 'dbml',
            sourceLabel: 'Fixture',
            dialect: 'generic',
            observedAt: '2026-03-31T01:01:01.010Z',
            schemaFingerprint: 'browser-fixture',
            confidence: 'observed',
          },
          summary: 'Fixture fragment for load-fragments coverage.',
          entities: [],
          relationships: [],
          indexes: [],
          constraints: [],
          migrationNotes: [],
          openQuestions: [],
          dbml: 'Project "Fixture" {\\n  database_type: "Generic"\\n}',
          mermaid: 'erDiagram',
        },
      },
    }, null, 2),
    '-->',
    '',
    '## Import Summary',
    '',
    'Fixture fragment for load-fragments coverage.',
    '',
    '## Source Metadata',
    '',
    '- Source Type: dbml',
    '',
    '## Observed Schema Summary',
    '',
    '- No entities captured for this lightweight browser fixture.',
    '',
    '## Entities',
    '',
    '- None for this fixture.',
    '',
    '## Relationships',
    '',
    '- None for this fixture.',
    '',
    '## Indexes and Constraints',
    '',
    '- None for this fixture.',
    '',
    '## Migration Notes',
    '',
    '- None for this fixture.',
    '',
    '## Open Questions',
    '',
    '- None for this fixture.',
    '',
    '## DBML',
    '',
    '```dbml',
    'Project "Fixture" {',
    '  database_type: "Generic"',
    '}',
    '```',
    '',
    '## Mermaid',
    '',
    '```mermaid',
    'erDiagram',
    '```',
    '',
    '## Merge Guidance',
    '',
    '- Import this fragment into the Database Schema module.',
  ].join('\n');
  fs.writeFileSync(fragmentPath, fragmentMarkdown, 'utf8');
  fs.mkdirSync(sharedFragmentsDir, { recursive: true });
  fs.writeFileSync(sharedFragmentPath, fragmentMarkdown.replace(/DBFRAG-002/g, 'DBFRAG-003').replace(/Browser fixture/g, 'Shared browser fixture'), 'utf8');
  fs.writeFileSync(
    malformedSharedFragmentPath,
    fragmentMarkdown
      .replace(/DBFRAG-002/g, 'DBFRAG-004')
      .replace(/Browser fixture/g, 'Malformed shared browser fixture')
      .replace('"mermaid": "erDiagram"', '"mermaid": "erDiagram"}')
      .replace('"mermaid":"erDiagram"', '"mermaid":"erDiagram"}'),
    'utf8'
  );

  try {
    result = await request(`/api/projects/${project.id}/database-schema/fragments`);
    assert.equal(result.response.status, 200);
    assert.match(String(result.body.paths.projectFragmentsDir || ''), /projects/);
    assert.match(String(result.body.paths.sharedFragmentsDir || ''), /projects/);
    const discoveredFragment = result.body.fragments.find((fragment) => fragment.code === 'DBFRAG-002');
    assert(discoveredFragment);
    assert.equal(discoveredFragment.fileName, fragmentFileName);
    assert.equal(discoveredFragment.sourceScope, 'project');

    const sharedFragment = result.body.fragments.find((fragment) => fragment.code === 'DBFRAG-003');
    assert(sharedFragment);
    assert.equal(sharedFragment.fileName, sharedFragmentFileName);
    assert.equal(sharedFragment.sourceScope, 'shared');
    const malformedSharedFragment = result.body.fragments.find((fragment) => fragment.code === 'DBFRAG-004');
    assert(malformedSharedFragment);
    assert.equal(malformedSharedFragment.fileName, malformedSharedFragmentFileName);
    assert.equal(malformedSharedFragment.sourceScope, 'shared');
    assert.match(String(malformedSharedFragment.parseWarning || ''), /recovery mode/i);

    result = await request(`/api/projects/${project.id}/database-schema/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({ fileName: fragmentFileName }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(fs.existsSync(fragmentPath), false);

    result = await request(`/api/projects/${project.id}/database-schema/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({ fileName: sharedFragmentFileName, sourceScope: 'shared' }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(fs.existsSync(sharedFragmentPath), false);

    result = await request(`/api/projects/${project.id}/database-schema/fragments`);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.fragments.length >= 2, true);
    const integratedFragment = result.body.fragments.find((fragment) => fragment.code === 'DBFRAG-002' && fragment.status === 'integrated');
    assert(integratedFragment);
    assert.equal(Boolean(integratedFragment.integratedAt), true);
    const integratedSharedFragment = result.body.fragments.find((fragment) => fragment.code === 'DBFRAG-003');
    assert(integratedSharedFragment);
  } finally {
    if (fs.existsSync(sharedFragmentPath)) fs.unlinkSync(sharedFragmentPath);
    if (fs.existsSync(malformedSharedFragmentPath)) fs.unlinkSync(malformedSharedFragmentPath);
  }
});

test('module dependency model auto-enables prerequisites, records module relationships, and cascades dependent removals', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Alpha',
      name: 'Dependency Graph Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'database_schema'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;
  assert(project.enabledModules.includes('database_schema'));
  assert(project.enabledModules.includes('architecture'));
  assert(project.enabledModules.includes('functional_spec'));
  assert(project.enabledModules.includes('prd'));
  assert(project.enabledModules.includes('features'));
  assert(project.enabledModules.includes('bugs'));

  result = await request(`/api/projects/${project.id}/modules`);
  assert.equal(result.response.status, 200);
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'database_schema' && relationship.targetEntityId === 'architecture'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'database_schema' && relationship.targetEntityId === 'functional_spec'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'architecture' && relationship.targetEntityId === 'functional_spec'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'functional_spec' && relationship.targetEntityId === 'prd'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'prd' && relationship.targetEntityId === 'project_brief'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'features' && relationship.targetEntityId === 'work_items'));

  const storedRelationships = await dbModule.dbAll(
    `SELECT source_entity_id, target_entity_id
     FROM entity_relationships
     WHERE project_id = ?
       AND source_entity_type = 'module'
       AND target_entity_type = 'module'
       AND relationship_type = 'depends_on'
       AND id LIKE 'system-module-dep-%'
     ORDER BY source_entity_id, target_entity_id`,
    [project.id]
  );
  assert(storedRelationships.some((row) => row.source_entity_id === 'database_schema' && row.target_entity_id === 'architecture'));

  result = await request(`/api/projects/${project.id}/modules`, {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations'],
    }),
  });
  assert.equal(result.response.status, 200);
  assert(!result.body.enabledModules.includes('database_schema'));
  assert(!result.body.enabledModules.includes('architecture'));
  assert(!result.body.enabledModules.includes('functional_spec'));
  assert(!result.body.enabledModules.includes('prd'));
  assert(!result.body.enabledModules.includes('features'));

  result = await request(`/api/projects/${project.id}/modules`);
  assert.equal(result.response.status, 200);
  assert(!result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'database_schema'));
  assert(!result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'architecture'));
  assert(!result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'functional_spec'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'roadmap' && relationship.targetEntityId === 'project_brief'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'work_items' && relationship.targetEntityId === 'project_brief'));
  assert(result.body.dependencies.some((relationship) => relationship.sourceEntityId === 'board' && relationship.targetEntityId === 'work_items'));
});

test('FR-017 stores credentials locally in encrypted form while preserving key-based auth fields and masked responses', async () => {
  let result = await request('/api/credentials', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Extra Host',
      host: 'files.example.test',
      port: 2222,
      user: 'ops',
      password: 'hidden',
      keyPath: 'C:\\keys\\ops.pem',
    }),
  });
  assert.equal(result.response.status, 200);
  const created = result.body;
  assert.equal(created.keyPath, 'C:\\keys\\ops.pem');

  result = await request(`/api/credentials/${created.id}`, {
    method: 'PUT',
    body: JSON.stringify({ host: 'files-2.example.test' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.host, 'files-2.example.test');
  assert.equal(result.body.keyPath, 'C:\\keys\\ops.pem');

  const row = await dbModule.dbGet('SELECT password, key_path FROM credentials WHERE id = ?', [created.id]);
  assert.equal(row.key_path, 'C:\\keys\\ops.pem');
  assert.notEqual(row.password, 'hidden');
  assert.match(row.password, /^enc:v1:/);

  const importedRow = await dbModule.dbGet('SELECT password FROM credentials WHERE id = ?', ['cred-legacy-1']);
  assert.notEqual(importedRow.password, 'secret');
  assert.match(importedRow.password, /^enc:v1:/);

  result = await request('/api/credentials');
  const saved = result.body.find((credential) => credential.id === created.id);
  assert.equal(saved.passwordMasked, '********');
  assert.equal(saved.keyPath, 'C:\\keys\\ops.pem');
});

test('task APIs provide a database-backed phase 1 foundation with phase 3 timeline fields', async () => {
  const project = (await request('/api/projects')).body[0];

  let result = await request(`/api/projects/${project.id}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Initial planning',
      description: 'Set up the board',
      category: 'Planning',
      priority: 'high',
      status: 'todo',
    }),
  });
  assert.equal(result.response.status, 200);
  const task = result.body;
  assert.equal(task.title, 'Initial planning');
  assert.equal(task.category, 'Planning');
  assert.equal(task.sortOrder, 0);

  result = await request(`/api/projects/${project.id}/tasks/${task.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'in_progress',
      category: 'Delivery',
      startDate: '2026-03-20',
      endDate: '2026-03-24',
      dueDate: '2026-03-25',
      dependencyIds: ['dep-1', 'dep-2'],
      progress: 60,
      milestone: true,
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'in_progress');
  assert.equal(result.body.category, 'Delivery');
  assert.equal(result.body.progress, 60);
  assert.deepEqual(result.body.dependencyIds, ['dep-1', 'dep-2']);
  assert.equal(result.body.milestone, true);

  result = await request(`/api/projects/${project.id}/tasks`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.length, 1);
  assert.equal(result.body[0].startDate, '2026-03-20');
  assert.equal(result.body[0].category, 'Delivery');

  result = await request(`/api/projects/${project.id}/tasks/${task.id}`, { method: 'DELETE' });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
});

test('typed work items expose a unified core work-item view while keeping software feature and bug extensions synchronized', async () => {
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: 'Beta',
      name: 'Typed Work Item Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'bugs', 'prd'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  result = await request(`/api/projects/${project.id}/workspace-plugins`, {
    method: 'PUT',
    body: JSON.stringify({
      enabledPlugins: ['features', 'bugs', 'prd'],
      cleanupPlugins: [],
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request(`/api/projects/${project.id}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'General planning item',
      description: 'A core task only.',
      category: 'Planning',
      planningBucket: 'considered',
    }),
  });
  assert.equal(result.response.status, 200);
  const genericTask = result.body;
  assert.equal(genericTask.workItemType, 'core_task');
  assert.equal(genericTask.itemType, 'task');

  result = await request(`/api/projects/${project.id}/features`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Typed feature',
      summary: 'Feature backed by a core work item.',
      category: 'Product',
      planningBucket: 'planned',
      dependencyIds: [genericTask.id],
      progress: 15,
    }),
  });
  assert.equal(result.response.status, 200);
  const feature = result.body;
  assert.equal(feature.workItemType, 'software_feature');
  assert.equal(feature.itemType, 'feature');
  assert.equal(feature.taskId.startsWith('task-'), true);

  result = await request(`/api/projects/${project.id}/bugs`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Typed bug',
      currentBehavior: 'Broken behavior',
      expectedBehavior: 'Working behavior',
      severity: 'high',
      planningBucket: 'planned',
      dependencyIds: [genericTask.id],
      progress: 5,
    }),
  });
  assert.equal(result.response.status, 200);
  const bug = result.body;
  assert.equal(bug.workItemType, 'software_bug');
  assert.equal(bug.itemType, 'bug');
  assert.equal(bug.taskId.startsWith('task-'), true);

  result = await request(`/api/projects/${project.id}/work-items`);
  assert.equal(result.response.status, 200);
  const workItems = result.body;
  const genericWorkItem = workItems.find((item) => item.id === genericTask.id);
  const featureWorkItem = workItems.find((item) => item.workItemId === feature.taskId);
  const bugWorkItem = workItems.find((item) => item.workItemId === bug.taskId);
  assert(genericWorkItem);
  assert.equal(genericWorkItem.workItemType, 'core_task');
  assert.equal(genericWorkItem.extensionType, null);
  assert(featureWorkItem);
  assert.equal(featureWorkItem.workItemType, 'software_feature');
  assert.equal(featureWorkItem.extensionType, 'software_feature');
  assert.equal(featureWorkItem.extensionId, feature.id);
  assert.equal(featureWorkItem.category, 'Product');
  assert.deepEqual(featureWorkItem.dependencyIds, [genericTask.id]);
  assert(bugWorkItem);
  assert.equal(bugWorkItem.workItemType, 'software_bug');
  assert.equal(bugWorkItem.extensionType, 'software_bug');
  assert.equal(bugWorkItem.extensionId, bug.id);
  assert.equal(bugWorkItem.expectedBehavior, 'Working behavior');

  result = await request(`/api/projects/${project.id}/tasks/${feature.taskId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Typed feature updated through base task',
      description: 'Updated from the core task side.',
      category: 'Delivery',
      status: 'in_progress',
      progress: 60,
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.workItemType, 'software_feature');

  result = await request(`/api/projects/${project.id}/features`);
  assert.equal(result.response.status, 200);
  const syncedFeature = result.body.features.find((item) => item.id === feature.id);
  assert(syncedFeature);
  assert.equal(syncedFeature.title, 'Typed feature updated through base task');
  assert.equal(syncedFeature.summary, 'Updated from the core task side.');
  assert.equal(syncedFeature.category, 'Delivery');
  assert.equal(syncedFeature.progress, 60);

  result = await request(`/api/projects/${project.id}/work-items/${bug.taskId}`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.workItemType, 'software_bug');
  assert.equal(result.body.extensionId, bug.id);
  assert.equal(result.body.currentBehavior, 'Broken behavior');

  const typedTaskRows = await dbModule.dbAll(
    'SELECT id, item_type, work_item_type FROM tasks WHERE id IN (?, ?, ?)',
    [genericTask.id, feature.taskId, bug.taskId]
  );
  const byId = new Map(typedTaskRows.map((row) => [row.id, row]));
  assert.equal(byId.get(genericTask.id).work_item_type, 'core_task');
  assert.equal(byId.get(genericTask.id).item_type, 'task');
  assert.equal(byId.get(feature.taskId).work_item_type, 'software_feature');
  assert.equal(byId.get(feature.taskId).item_type, 'feature');
  assert.equal(byId.get(bug.taskId).work_item_type, 'software_bug');
  assert.equal(byId.get(bug.taskId).item_type, 'bug');
});

test('bug lifecycle states persist through refresh and regenerate BUGS markdown', async () => {
  const { body: roots } = await request('/api/roots');
  const projectFolder = `Gamma-${Date.now()}`;
  fs.mkdirSync(path.join(roots.projectsRoot, projectFolder), { recursive: true });
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: projectFolder,
      name: 'Bug Lifecycle Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'bugs'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  result = await request(`/api/projects/${project.id}/workspace-plugins`, {
    method: 'PUT',
    body: JSON.stringify({
      enabledPlugins: ['bugs'],
      cleanupPlugins: [],
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request(`/api/projects/${project.id}/bugs`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Lifecycle preservation bug',
      currentBehavior: 'The bug status falls back after refresh.',
      expectedBehavior: 'The bug status should remain blocked until work can resume.',
      status: 'blocked',
      severity: 'high',
      planningBucket: 'planned',
      category: 'Workflow',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'blocked');

  const bugId = result.body.id;

  result = await request(`/api/projects/${project.id}/bugs/${bugId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Lifecycle preservation bug',
      currentBehavior: 'A fix exists but validation is still running.',
      expectedBehavior: 'The issue should remain in verifying until the fix is confirmed.',
      status: 'verifying',
      severity: 'high',
      planningBucket: 'planned',
      category: 'Workflow',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'verifying');

  result = await request(`/api/projects/${project.id}/bugs`);
  assert.equal(result.response.status, 200);
  const bug = result.body.bugs.find((item) => item.id === bugId);
  assert(bug);
  assert.equal(bug.status, 'verifying');
  assert.match(result.body.markdown, /## 1\. Bug Workflow/);
  assert.match(result.body.markdown, /Lifecycle Status: Verifying \(`verifying`\)/);
  assert.match(result.body.markdown, /Planning Bucket: Planned \(`planned`\)/);
});

test('resolved bugs are archived out of BUGS markdown and create workspace follow-up notes', async () => {
  const { body: roots } = await request('/api/roots');
  const projectFolder = `Delta-${Date.now()}`;
  fs.mkdirSync(path.join(roots.projectsRoot, projectFolder), { recursive: true });
  let result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      type: 'folder',
      path: projectFolder,
      name: 'Bug Archive Project',
      projectType: 'software',
      enabledModules: ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'bugs'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  result = await request(`/api/projects/${project.id}/workspace-plugins`, {
    method: 'PUT',
    body: JSON.stringify({
      enabledPlugins: ['bugs'],
      cleanupPlugins: [],
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request(`/api/projects/${project.id}/bugs`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Archive me after fix',
      currentBehavior: 'The fixed bug still shows in active markdown.',
      expectedBehavior: 'Resolved bugs should move to archive follow-up notes.',
      status: 'resolved',
      severity: 'medium',
      planningBucket: 'planned',
      category: 'Workflow',
      associationHints: '@prd-bug-archive',
    }),
  });
  assert.equal(result.response.status, 200);
  const archivedBugId = result.body.id;
  const archivedBugCode = result.body.code;

  result = await request(`/api/projects/${project.id}/bugs`);
  assert.equal(result.response.status, 200);
  const archivedBug = result.body.bugs.find((item) => item.id === archivedBugId);
  assert(archivedBug);
  assert.equal(archivedBug.archived, true);
  assert.equal(archivedBug.planningBucket, 'archived');
  assert.doesNotMatch(result.body.markdown, new RegExp(`### 2\\.\\d+ ${archivedBugCode}:`));
  assert.doesNotMatch(result.body.markdown, /## Archived Bugs/);
  assert.match(result.body.markdown, /## 1\. Bug Workflow/);
  assert.match(result.body.markdown, /## 2\. Active Bugs/);

  const workspaceNotePath = path.join(
    roots.projectsRoot,
    projectFolder,
    '.apm',
    '_WORKSPACE',
    `${archivedBugCode}_ARCHIVED.md`
  );
  assert.equal(fs.existsSync(workspaceNotePath), true);
  const workspaceNote = fs.readFileSync(workspaceNotePath, 'utf8');
  assert.match(workspaceNote, /Generate the appropriate fragments/);
  assert.match(workspaceNote, /@prd-bug-archive/);

  result = await request(`/api/projects/${project.id}/bugs/${archivedBugId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Archive me after fix',
      currentBehavior: 'The issue returned after the initial fix.',
      expectedBehavior: 'The bug should return to the active list.',
      status: 'regressed',
      planningBucket: 'planned',
      category: 'Workflow',
      associationHints: '@prd-bug-archive',
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request(`/api/projects/${project.id}/bugs`);
  assert.equal(result.response.status, 200);
  const activeBug = result.body.bugs.find((item) => item.id === archivedBugId);
  assert(activeBug);
  assert.equal(activeBug.archived, false);
  assert.equal(fs.existsSync(workspaceNotePath), false);
  assert.match(result.body.markdown, new RegExp(`### 2\\.\\d+ ${archivedBugCode}: Archive me after fix`));
  assert.match(result.body.markdown, /Association Hints: @prd-bug-archive/);
});

test('phase 5 workspace docs keep tasks as the source of truth while generating roadmap, feature, bug, and PRD markdown artifacts', async () => {
  const { body: roots } = await request('/api/roots');
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  let result = await request(`/api/projects/${project.id}/workspace-plugins`, {
    method: 'PUT',
    body: JSON.stringify({
      enabledPlugins: ['features', 'bugs', 'prd'],
      cleanupPlugins: [],
    }),
  });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.workspacePlugins, ['features', 'bugs', 'prd']);

  result = await request(`/api/projects/${project.id}/roadmap/phases`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Phase 5 foundation',
      goal: 'Stand up managed docs',
      summary: 'Create roadmap-driven markdown artifacts.',
      status: 'in_progress',
      targetDate: '2026-04-01',
    }),
  });
  assert.equal(result.response.status, 200);
  const phase = result.body;
  assert.match(phase.code, /^PHASE-/);

  result = await request(`/api/projects/${project.id}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Wire roadmap tab',
      status: 'in_progress',
      roadmapPhaseId: phase.id,
      startDate: '2026-03-26',
      endDate: '2026-03-28',
    }),
  });
  assert.equal(result.response.status, 200);
  const roadmapTask = result.body;
  assert.equal(roadmapTask.roadmapPhaseId, phase.id);

  result = await request(`/api/projects/${project.id}/features`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Roadmap tab',
      summary: 'Built-in roadmap planning surface.',
      status: 'planned',
      category: 'UX',
      priority: 'high',
      assignedTo: 'Alex',
      dueDate: '2026-03-30',
      startDate: '2026-03-26',
      endDate: '2026-03-29',
      dependencyIds: [roadmapTask.id],
      progress: 35,
      milestone: true,
      roadmapPhaseId: phase.id,
      planningBucket: 'phase',
    }),
  });
  assert.equal(result.response.status, 200);
  const feature = result.body;
  assert.match(feature.code, /^FEAT-/);
  assert.equal(feature.category, 'UX');
  assert.equal(feature.assignedTo, 'Alex');
  assert.equal(feature.dueDate, '2026-03-30');
  assert.deepEqual(feature.dependencyIds, [roadmapTask.id]);
  assert.equal(feature.milestone, true);

  result = await request(`/api/projects/${project.id}/bugs`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Roadmap sync bug',
      currentBehavior: 'Generated docs drift from tasks.',
      expectedBehavior: 'Generated docs should always reflect task state.',
      status: 'open',
      severity: 'high',
      category: 'Reliability',
      roadmapPhaseId: phase.id,
      planningBucket: 'phase',
      assignedTo: 'Sam',
      dueDate: '2026-03-31',
      startDate: '2026-03-27',
      endDate: '2026-03-31',
      dependencyIds: [roadmapTask.id],
      progress: 20,
      milestone: false,
      regressed: true,
    }),
  });
  assert.equal(result.response.status, 200);
  const bug = result.body;
  assert.match(bug.code, /^BUG-/);
  assert.equal(bug.category, 'Reliability');
  assert.equal(bug.roadmapPhaseId, phase.id);
  assert.equal(bug.assignedTo, 'Sam');
  assert.equal(bug.dueDate, '2026-03-31');
  assert.deepEqual(bug.dependencyIds, [roadmapTask.id]);
  assert.equal(bug.regressed, true);

  result = await request(`/api/projects/${project.id}/prd`, {
    method: 'PUT',
    body: JSON.stringify({
      mermaid: 'flowchart TD\n  product["Product"] --> roadmap["Roadmap"]',
      editorState: {
        executiveSummary: {
          text: 'Phase 5 planning surface.',
          versionDate: '2026-03-27T12:00:00.000Z',
        },
        productOverview: {
          productName: 'Legacy Alpha',
          vision: 'Build a managed planning workspace.',
          targetAudiences: [{ text: 'Developers', versionDate: '2026-03-27T12:05:00.000Z' }],
          keyValueProps: [{ text: 'Database-backed planning artifacts', versionDate: '2026-03-27T12:10:00.000Z' }],
          versionDate: '2026-03-27T12:10:00.000Z',
        },
        functionalRequirements: {
          workflows: [{ title: 'Create roadmap item', description: 'User creates a phase and task plan.', versionDate: '2026-03-27T12:15:00.000Z' }],
          userActions: [],
          systemBehaviors: [],
          versionDate: '2026-03-27T12:15:00.000Z',
        },
        nonFunctionalRequirements: {
          usability: 'The workspace should stay editable inside the app.',
          reliability: '',
          accessibility: '',
          security: '',
          performance: '',
          versionDate: '2026-03-27T12:20:00.000Z',
        },
        technicalArchitecture: [],
        implementationPlan: {
          sequencing: [],
          dependencies: [],
          milestones: [],
          versionDate: '2026-03-27T12:25:00.000Z',
        },
        successMetrics: [],
        risksMitigations: [],
        futureEnhancements: [],
        appliedFragments: [],
        conclusion: 'Initial PRD seeded from test coverage.',
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.match(result.body.markdown, /Phase 5 planning surface/);
  assert.equal(result.body.fragments.some((fragment) => fragment.featureId === feature.id), true);
  assert.equal(result.body.editorState.executiveSummary.text, 'Phase 5 planning surface.');

  const roadmapState = (await request(`/api/projects/${project.id}/roadmap`)).body;
  assert.equal(roadmapState.phases.length, 1);
  assert.equal(roadmapState.tasks.some((task) => task.roadmapPhaseId === phase.id), true);
  assert.equal(roadmapState.features[0].taskId != null, true);
  assert.equal(roadmapState.bugs[0].taskId != null, true);
  assert.equal(roadmapState.templateVersion != null, true);
  assert.match(roadmapState.markdown, /Managed document\. Must comply with template ROADMAP\.template\.md\./);
  assert.match(roadmapState.markdown, /Wire roadmap tab/);

  const featuresState = (await request(`/api/projects/${project.id}/features`)).body;
  assert.equal(featuresState.features.length, 1);
  assert.equal(featuresState.fragments.some((fragment) => fragment.featureId === feature.id), true);
  assert.match(featuresState.markdown, /AI Agent instruction: When this feature is implemented, create or update the matching PRD fragment in the database first/);

  const bugsState = (await request(`/api/projects/${project.id}/bugs`)).body;
  assert.equal(bugsState.bugs.length, 1);
  assert.match(bugsState.markdown, /Regressed: Yes/);
  assert.match(bugsState.markdown, /#### Current Behavior/);
  assert.match(bugsState.markdown, /#### Expected Behavior/);

  const prdState = (await request(`/api/projects/${project.id}/prd`)).body;
  const featurePrdFragment = prdState.fragments.find((fragment) => fragment.featureId === feature.id);
  assert.match(prdState.markdown, /Phase 5 planning surface/);
  assert(featurePrdFragment);
  assert.match(featurePrdFragment.markdown, /AI agents should update this fragment instead of editing PRD\.md directly\./);

  const alphaDocsDir = path.join(roots.projectsRoot, 'Alpha', 'docs');
  const alphaTemplatesDir = path.join(roots.dataDir, 'projects', project.id, 'templates');
  const alphaSoftwareStandardsDir = path.join(roots.dataDir, 'projects', project.id, 'standards', 'software');
  const alphaFragmentsDir = path.join(roots.dataDir, 'projects', project.id, 'fragments');
  assert.equal(fs.existsSync(path.join(alphaDocsDir, 'ROADMAP.md')), true);
  assert.equal(fs.existsSync(path.join(alphaDocsDir, 'FEATURES.md')), true);
  assert.equal(fs.existsSync(path.join(alphaDocsDir, 'BUGS.md')), true);
  assert.equal(fs.existsSync(path.join(alphaDocsDir, 'PRD.md')), true);
  assert.equal(fs.existsSync(path.join(alphaTemplatesDir, 'ROADMAP.template.md')), true);
  assert.equal(fs.existsSync(path.join(alphaTemplatesDir, 'FEATURES.template.md')), true);
  assert.equal(fs.existsSync(path.join(alphaTemplatesDir, 'BUGS.template.md')), true);
  assert.equal(fs.existsSync(path.join(alphaTemplatesDir, 'PRD.template.md')), true);
  assert.equal(fs.existsSync(path.join(alphaTemplatesDir, 'FUNCTIONAL_SPEC.template.md')), true);
  assert.equal(fs.existsSync(path.join(alphaSoftwareStandardsDir, 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md')), true);
  assert.equal(fs.existsSync(path.join(alphaFragmentsDir, featurePrdFragment.fileName)), true);
  for (const templateName of Object.values(workspaceDocs.FRAGMENT_TEMPLATE_NAMES)) {
    assert.equal(fs.existsSync(path.join(alphaFragmentsDir, templateName)), true);
  }
  const generatedRoadmapTemplate = fs.readFileSync(path.join(alphaTemplatesDir, 'ROADMAP.template.md'), 'utf8');
  assert.match(generatedRoadmapTemplate, /## Version/);
  assert.match(generatedRoadmapTemplate, /Template Version: `2\.1`/);
  assert.match(generatedRoadmapTemplate, /## Model Context Protocol/);
  assert.match(generatedRoadmapTemplate, /### Phases/);
  assert.match(generatedRoadmapTemplate, /### Planned Features/);
  assert.match(generatedRoadmapTemplate, /### Considered Features/);
  const generatedFunctionalSpecTemplate = fs.readFileSync(path.join(alphaTemplatesDir, 'FUNCTIONAL_SPEC.template.md'), 'utf8');
  assert.match(generatedFunctionalSpecTemplate, /Template Version: `2\.0`/);
  assert.match(generatedFunctionalSpecTemplate, /## Functional Flowchart Action Vocabulary/);
  assert.match(generatedFunctionalSpecTemplate, /### Node Types/);
  assert.match(generatedFunctionalSpecTemplate, /Decision: Describes a conditional branch/);
  assert.match(generatedFunctionalSpecTemplate, /### Connection Types/);
  assert.match(generatedFunctionalSpecTemplate, /Create Draft Edge/);

  const templateRegistryRows = await dbModule.dbAll(
    'SELECT template_name, template_kind, template_version, source_md5, target_md5, target_path FROM project_template_files WHERE project_id = ?',
    [project.id]
  );
  assert(templateRegistryRows.some((row) => row.template_name === 'FUNCTIONAL_SPEC.template.md' && row.template_version === '2.0'));
  assert(templateRegistryRows.some((row) => row.template_name === 'FUNCTIONAL_SPEC_FRAGMENT.template.md' && row.template_kind === 'fragment'));
  assert(templateRegistryRows.every((row) => row.source_md5 && row.target_md5 && row.target_path));

  const roadmapFile = fs.readFileSync(path.join(alphaDocsDir, 'ROADMAP.md'), 'utf8');
  assert.match(roadmapFile, /```mermaid/);
  assert.match(roadmapFile, /PHASE-/);
  assert.match(roadmapFile, /ROADMAP_FRAGMENT\.template\.md/);

  const roadmapFragment = {
    id: 'roadmap-fragment-test-1',
    projectId: project.id,
    sourceFeatureId: feature.id,
    sourcePhaseId: phase.id,
    code: 'RMAPFRAG-001',
    title: 'Advance roadmap structure',
    markdown: '## Executive Summary\n\nPropose a release hardening phase and advance the linked feature.\n',
    mermaid: 'flowchart TD\n  fragment["Roadmap Fragment"] --> phase["Release hardening"]',
    payload: {
      summary: 'Add a release hardening phase and advance the feature status.',
      phaseChanges: [{
        name: 'Release hardening',
        goal: 'Stabilize delivery before rollout.',
        summary: 'Finalize hardening tasks and release readiness.',
        status: 'planned',
        targetDate: '2026-05-01',
      }],
      featureAssignments: [{
        featureId: feature.id,
        roadmapPhaseId: phase.id,
        status: 'in_progress',
        note: 'Advance the roadmap feature after planning review.',
      }],
      taskAssignments: [{
        taskId: roadmapTask.id,
        roadmapPhaseId: phase.id,
        note: 'Keep the linked task aligned with the active phase.',
      }],
    },
    status: 'draft',
    merged: false,
    mergedAt: null,
    integratedAt: null,
    fileName: 'ROADMAP_FRAGMENT_20260328_000000_000.md',
    createdAt: '2026-03-28T00:00:00.000Z',
    updatedAt: '2026-03-28T00:00:00.000Z',
  };
  fs.writeFileSync(
    path.join(alphaFragmentsDir, roadmapFragment.fileName),
    workspaceDocs.renderRoadmapFragmentMarkdown(project, roadmapFragment),
    'utf8'
  );
  const fragmentTime = new Date(Date.now() + 10000);
  fs.utimesSync(path.join(alphaFragmentsDir, roadmapFragment.fileName), fragmentTime, fragmentTime);

  const roadmapAfterFragmentDiscovery = (await request(`/api/projects/${project.id}/roadmap`)).body;
  assert.equal(roadmapAfterFragmentDiscovery.fragments.length, 1);
  assert.equal(roadmapAfterFragmentDiscovery.features.filter((item) => !item.archived).length >= 1, true);

  result = await request(`/api/projects/${project.id}/roadmap/fragments/${roadmapAfterFragmentDiscovery.fragments[0].id}/integrate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragment.status, 'integrated');
  assert.equal(result.body.features.features[0].status, 'in_progress');
  assert.equal(result.body.roadmap.phases.length, 2);

  const bugDocPath = path.join(alphaDocsDir, 'BUGS.md');
  const bugDocMarkdown = fs.readFileSync(bugDocPath, 'utf8');
  const parsedManagedBugDoc = workspaceDocs.parseManagedBlock(bugDocMarkdown);
  assert(parsedManagedBugDoc);
  assert.equal(parsedManagedBugDoc.bugs.length, 1);
  const managedMatch = bugDocMarkdown.match(/<!-- APM:DATA\s*([\s\S]*?)\s*-->/);
  assert(managedMatch);
  const managedPayload = JSON.parse(managedMatch[1]);
  const expectedImportedCurrentBehavior = managedPayload.bugs[0].currentBehavior;
  managedPayload.bugs[0].expectedBehavior = 'The regenerated bug document should sync back into SQLite.';
  const updatedBugMarkdown = bugDocMarkdown.replace(managedMatch[0], `<!-- APM:DATA\n${JSON.stringify(managedPayload, null, 2)}\n-->`);
  fs.writeFileSync(bugDocPath, updatedBugMarkdown, 'utf8');
  const now = new Date();
  const newer = new Date(now.getTime() + 5000);
  fs.utimesSync(bugDocPath, newer, newer);

  const importedBugsState = (await request(`/api/projects/${project.id}/bugs`)).body;
  assert.equal(importedBugsState.bugs[0].currentBehavior, expectedImportedCurrentBehavior);

  result = await request(`/api/projects/${project.id}/prd/fragments/${featurePrdFragment.id}/merge`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragment.merged, true);
  assert.match(result.body.prd.markdown, /## 10\. Applied Fragments/);
  assert.equal(fs.existsSync(path.join(alphaFragmentsDir, featurePrdFragment.fileName)), false);

  const prdAfterMerge = (await request(`/api/projects/${project.id}/prd`)).body;
  const mergedFeatureFragment = prdAfterMerge.fragments.find((fragment) => fragment.id === featurePrdFragment.id);
  assert(mergedFeatureFragment);
  assert.equal(mergedFeatureFragment.merged, true);
  assert.equal(fs.existsSync(path.join(alphaFragmentsDir, featurePrdFragment.fileName)), false);
  assert.match(prdAfterMerge.markdown, /Status: merged/);

  result = await request(`/api/projects/${project.id}/prd/fragments/${featurePrdFragment.id}/integrate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragment.status, 'integrated');
  assert.equal(result.body.features.features[0].archived, true);
  assert.match(result.body.prd.markdown, /## 9\. Future Enhancements/);
  assert.match(result.body.prd.markdown, /Status: integrated/);
  assert.doesNotMatch(result.body.prd.markdown, /```text/);
  assert.doesNotMatch(result.body.prd.markdown, /Store PRD fragment files under/);

  const bugDocRow = await dbModule.dbGet('SELECT file_path, file_updated_at, file_md5, db_md5 FROM project_md_documents WHERE project_id = ? AND doc_type = ?', [project.id, 'bugs']);
  assert.equal(bugDocRow.file_path.endsWith(path.join('Alpha', 'docs', 'BUGS.md')), true);
  assert.equal(Boolean(bugDocRow.file_updated_at), true);
  assert.equal(Boolean(bugDocRow.file_md5), true);
  assert.equal(Boolean(bugDocRow.db_md5), true);

  const fragmentRow = await dbModule.dbGet('SELECT feature_id, file_name, merged_file_name, file_path, file_updated_at, file_md5, db_md5, merged, status FROM prd_fragments WHERE project_id = ? AND feature_id = ?', [project.id, feature.id]);
  assert.equal(fragmentRow.feature_id, feature.id);
  assert.equal(fragmentRow.file_name, featurePrdFragment.fileName);
  assert.equal(fragmentRow.merged_file_name, featurePrdFragment.fileName);
  assert.equal(fragmentRow.file_path, null);
  assert.equal(fragmentRow.file_updated_at, null);
  assert.equal(fragmentRow.file_md5, '');
  assert.equal(Boolean(fragmentRow.db_md5), true);
  assert.equal(fragmentRow.merged, 1);
  assert.equal(fragmentRow.status, 'integrated');

  const prdRow = await dbModule.dbGet('SELECT editor_state FROM project_md_documents WHERE project_id = ? AND doc_type = ?', [project.id, 'prd']);
  const parsedEditorState = JSON.parse(prdRow.editor_state);
  assert.equal(parsedEditorState.executiveSummary.text, 'Phase 5 planning surface.');
  assert.equal(parsedEditorState.appliedFragments.some((item) => item.status === 'integrated'), true);
  assert.equal(parsedEditorState.futureEnhancements.some((item) => item && item.featureId === feature.id), false);
  const integratedAuditEntry = parsedEditorState.appliedFragments.find((item) => item && item.fragmentId === featurePrdFragment.id);
  assert(integratedAuditEntry);
  assert.equal(integratedAuditEntry.sourceFeatureStatus, 'implemented');
  assert.equal(Boolean(integratedAuditEntry.summary), true);

  const roadmapTemplateRepo = path.join(repoRoot, 'templates', 'ROADMAP.template.md');
  assert.equal(fs.existsSync(roadmapTemplateRepo), true);
  const repoRoadmapTemplate = fs.readFileSync(roadmapTemplateRepo, 'utf8');
  assert.equal(repoRoadmapTemplate, generatedRoadmapTemplate);
  assert.equal(fs.existsSync(path.join(repoRoot, 'templates', 'PRD_FRAGMENT.template.md')), true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'templates', 'DATABASE_SCHEMA_FRAGMENT.template.md')), true);
});

test('imported shared PRD fragments are persisted once, source-cleaned, and rewritten to the project fragment directory', async () => {
  const { body: roots } = await request('/api/roots');
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const sharedFragmentsDir = path.join(roots.dataDir, 'projects', 'shared', 'fragments');
  const projectFragmentsDir = path.join(roots.dataDir, 'projects', project.id, 'fragments');
  fs.mkdirSync(sharedFragmentsDir, { recursive: true });
  fs.mkdirSync(projectFragmentsDir, { recursive: true });

  const fileName = 'PRD_FRAGMENT_20260402_import_cleanup_001.md';
  const sharedFragmentPath = path.join(sharedFragmentsDir, fileName);
  fs.writeFileSync(sharedFragmentPath, [
    '# PRD Fragment: PRDFRAG-IMPORT-001 - Imported cleanup test',
    '',
    '## Executive Summary',
    '',
    'This fragment was dropped into the shared folder and should be imported once.',
    '',
    '## Product Overview',
    '',
    '### Product Vision',
    '',
    'Keep fragment intake deterministic.',
    '',
  ].join('\n'), 'utf8');

  let result = await request(`/api/projects/${project.id}/prd/fragments`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragments.filter((fragment) => fragment.code === 'PRDFRAG-IMPORT-001').length, 1);
  assert.equal(fs.existsSync(sharedFragmentPath), false);
  assert.equal(fs.existsSync(path.join(projectFragmentsDir, fileName)), true);

  result = await request(`/api/projects/${project.id}/prd/fragments`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragments.filter((fragment) => fragment.code === 'PRDFRAG-IMPORT-001').length, 1);

  const duplicateCount = await dbModule.dbGet(
    'SELECT COUNT(*) AS count FROM prd_fragments WHERE project_id = ? AND code = ?',
    [project.id, 'PRDFRAG-IMPORT-001']
  );
  assert.equal(duplicateCount.count, 1);
});

test('PRD load tolerates and imports managed PRD fragment files that use markdown body content', async () => {
  const { body: roots } = await request('/api/roots');
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const projectFragmentsDir = path.join(roots.dataDir, 'projects', project.id, 'fragments');
  fs.mkdirSync(projectFragmentsDir, { recursive: true });

  const fileName = 'PRD_FRAGMENT_20260403_managed_body_shape_001.md';
  const fragmentPath = path.join(projectFragmentsDir, fileName);
  fs.writeFileSync(fragmentPath, [
    '# PRD Fragment: PRDFRAG-MANAGED-001 - Managed body shape import test',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'prd_fragment',
      version: 1,
      fragment: {
        id: 'PRDFRAG-MANAGED-001-v1',
        code: 'PRDFRAG-MANAGED-001',
        title: 'Managed body shape import test',
        summary: 'Managed PRD fragment should import even when the body lives in markdown instead of fragment.markdown.',
        revision: 1,
        lineageKey: 'PRDFRAG-MANAGED-001',
        status: 'draft',
      },
    }, null, 2),
    '-->',
    '',
    '## Executive Summary',
    '',
    'Managed PRD fragment should import even when the body lives in markdown instead of fragment.markdown.',
    '',
    '## Functional Requirements',
    '',
    '- Keep PRD fragment import tolerant of current fragment file shapes.',
    '',
  ].join('\n'), 'utf8');

  let result = await request(`/api/projects/${project.id}/prd`);
  assert.equal(result.response.status, 200);

  result = await request(`/api/projects/${project.id}/prd/fragments`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragments.some((fragment) => fragment.code === 'PRDFRAG-MANAGED-001'), true);
});

test('merging a structured PRD fragment updates the main PRD editor state instead of only applied-fragment history', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const fragment = await persistence.savePrdFragment({
    projectId: project.id,
    title: 'Structured PRD baseline merge test',
    markdown: [
      '## Executive Summary',
      '',
      'This merge should update the canonical PRD content.',
      '',
      '## Product Overview',
      '',
      '### Product Vision',
      '',
      'Create a local-first planning workspace for builders.',
      '',
      '### Target Audiences',
      '',
      '- Solo builders',
      '- Technical leads',
      '',
      '### Key Value Propositions',
      '',
      '- Keep planning and docs aligned',
      '- Support safe AI collaboration',
      '',
      '## Functional Requirements',
      '',
      '### Current Application Workflows',
      '',
      '- Users manage projects and planning in one desktop workspace.',
      '',
      '### User Actions',
      '',
      '- Move roadmap items between planning buckets.',
      '',
      '### System Behaviors',
      '',
      '- The app regenerates managed markdown from SQLite.',
      '',
      '## Non-Functional Requirements',
      '',
      '### Usability',
      '',
      'The product should make roadmap and PRD work feel connected.',
      '',
      '### Reliability',
      '',
      'The product should recover from missing docs.',
      '',
      '### Accessibility',
      '',
      'The product should preserve readable layouts and explicit controls.',
      '',
      '### Security',
      '',
      'The product should encrypt secrets at rest.',
      '',
      '### Performance',
      '',
      'The product should stay responsive for local-first usage.',
      '',
      '## Technical Shape',
      '',
      '- Electron desktop shell',
      '- Express API layer',
      '- SQLite source of truth',
      '',
      '## Implementation Plan',
      '',
      '### Sequencing',
      '',
      '- Stabilize the database-first foundation first.',
      '',
      '### Dependencies',
      '',
      '- PRD quality depends on roadmap accuracy.',
      '',
      '### Milestones',
      '',
      '- Complete first-iteration PRD alignment.',
      '',
      '## Success Metrics',
      '',
      '- Users can trust the PRD to reflect the app.',
      '',
      '## Risks and Mitigations',
      '',
      '### Document Drift',
      '',
      '- Mitigation: regenerate docs from SQLite.',
      '',
      '## Merge Guidance',
      '',
      '- Merge this into the PRD baseline.',
      '',
    ].join('\n'),
    mermaid: 'flowchart TD\n  fragment["Structured PRD Fragment"] --> prd["PRD.md"]',
    status: 'draft',
    merged: false,
  });

  const result = await request(`/api/projects/${project.id}/prd/fragments/${fragment.id}/merge`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.fragment.merged, true);
  assert.equal(result.body.prd.editorState.executiveSummary.text, 'This merge should update the canonical PRD content.');
  assert.equal(result.body.prd.editorState.productOverview.vision, 'Create a local-first planning workspace for builders.');
  assert.deepEqual(
    result.body.prd.editorState.productOverview.targetAudiences.map((item) => item.text),
    ['Solo builders', 'Technical leads']
  );
  assert.equal(result.body.prd.editorState.nonFunctionalRequirements.security, 'The product should encrypt secrets at rest.');
  assert.equal(result.body.prd.editorState.technicalArchitecture[0].title, 'Electron desktop shell');
  assert(
    result.body.prd.editorState.implementationPlan.sequencing.some((entry) => (
      entry.title === 'Stabilize the database-first foundation first'
      || entry.description === 'Stabilize the database-first foundation first.'
    ))
  );
  assert.equal(result.body.prd.editorState.risksMitigations[0].risk, 'Document Drift');
  assert.equal(result.body.prd.editorState.risksMitigations[0].mitigation, 'regenerate docs from SQLite.');
  assert.match(result.body.prd.markdown, /Create a local-first planning workspace for builders\./);
  assert.match(result.body.prd.markdown, /Users can trust the PRD to reflect the app\./);
});

test('long PRD functional requirement details stay in description fields instead of becoming truncated titles', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const fragment = await persistence.savePrdFragment({
    projectId: project.id,
    title: 'Long functional requirement import',
    markdown: [
      '## Functional Requirements',
      '',
      '### Current Application Workflows',
      '',
      '- The application should let users manage requirements, architecture, and persistence details from one coordinated workspace without needing to manually reconcile duplicate records between modules.',
      '',
    ].join('\n'),
    mermaid: '',
    status: 'draft',
  });

  const result = await request(`/api/projects/${project.id}/prd/fragments/${fragment.id}/merge`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.prd.editorState.functionalRequirements.workflows[0].title, 'Should let users manage requirements');
  assert.match(
    result.body.prd.editorState.functionalRequirements.workflows[0].description,
    /manage requirements, architecture, and persistence details from one coordinated workspace/i
  );
});

test('merged PRD fragment files are deleted from the docs folder and stay deleted after sync', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const fragment = await persistence.savePrdFragment({
    projectId: project.id,
    title: 'Merged file cleanup regression',
    markdown: '## Executive Summary\n\nCleanup test fragment.',
    mermaid: 'flowchart TD\n  cleanup["Cleanup"] --> prd["PRD.md"]',
    status: 'draft',
    merged: false,
  });
  const writeResult = workspaceDocs.writePrdFragmentDocument(project, fragment);
  const writtenFragmentPath = writeResult.snapshot.docPath;
  await persistence.savePrdFragment({
    ...fragment,
    fileName: path.basename(writtenFragmentPath),
    filePath: writtenFragmentPath,
    fileUpdatedAt: writeResult.snapshot.updatedAt,
    fileMd5: writeResult.snapshot.md5,
    dbMd5: writeResult.snapshot.md5,
  });
  assert.equal(fs.existsSync(writtenFragmentPath), true);

  const mergeResult = await request(`/api/projects/${project.id}/prd/fragments/${fragment.id}/merge`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(mergeResult.response.status, 200);
  assert.equal(mergeResult.body.fragment.merged, true);
  assert.equal(fs.existsSync(writtenFragmentPath), false);

  const prdResult = await request(`/api/projects/${project.id}/prd`);
  assert.equal(prdResult.response.status, 200);
  assert.equal(fs.existsSync(writtenFragmentPath), false);
});

test('stale duplicate PRD fragment files are cleaned up when the database already has the integrated canonical record', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const staleFileName = 'PRD_FRAGMENT_20260403_stale_duplicate_001.md';
  const staleFragmentPath = path.join(projectFragmentsDir, staleFileName);

  await persistence.savePrdFragment({
    id: 'PRDFRAG-CLEANUP-001-v1',
    projectId: project.id,
    code: 'PRDFRAG-CLEANUP-001',
    title: 'Stale cleanup regression',
    markdown: '## Executive Summary\n\nCanonical PRD fragment already integrated.',
    mermaid: '',
    status: 'integrated',
    merged: true,
    mergedAt: new Date().toISOString(),
    fileName: 'PRD_FRAGMENT_20260403_canonical_001.md',
    filePath: null,
    fileUpdatedAt: null,
    fileMd5: '',
    dbMd5: 'canonical-md5',
  });

  fs.writeFileSync(staleFragmentPath, [
    '# PRD Fragment: PRDFRAG-CLEANUP-001 - Stale cleanup regression',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'prd_fragment',
      version: 1,
      fragment: {
        id: 'PRDFRAG-CLEANUP-001-v1',
        code: 'PRDFRAG-CLEANUP-001',
        title: 'Stale cleanup regression',
        summary: 'This stale on-disk copy should be deleted because the integrated DB record is already canonical.',
        revision: 1,
        lineageKey: 'PRDFRAG-CLEANUP-001',
        status: 'draft',
      },
    }, null, 2),
    '-->',
    '',
    '## Executive Summary',
    '',
    'This stale on-disk copy should be deleted because the integrated DB record is already canonical.',
    '',
  ].join('\n'), 'utf8');
  const oldTimestamp = new Date(Date.now() - 60_000);
  fs.utimesSync(staleFragmentPath, oldTimestamp, oldTimestamp);

  const result = await request(`/api/projects/${project.id}/prd`);
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(staleFragmentPath), false);
});

test('archived PRD fragments keep history but clean up their on-disk file', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const fragment = await persistence.savePrdFragment({
    projectId: project.id,
    code: 'PRDFRAG-ARCHIVE-001',
    title: 'Archived PRD fragment cleanup',
    markdown: '## Executive Summary\n\nArchived PRD fragment should not keep a live file around.',
    mermaid: '',
    status: 'draft',
    merged: false,
  });
  const writeResult = workspaceDocs.writePrdFragmentDocument(project, fragment);
  const writtenFragmentPath = writeResult.snapshot.docPath;
  await persistence.savePrdFragment({
    ...fragment,
    status: 'archived',
    fileName: path.basename(writtenFragmentPath),
    filePath: writtenFragmentPath,
    fileUpdatedAt: writeResult.snapshot.updatedAt,
    fileMd5: writeResult.snapshot.md5,
    dbMd5: writeResult.snapshot.md5,
  });
  assert.equal(fs.existsSync(writtenFragmentPath), true);

  const result = await request(`/api/projects/${project.id}/prd/fragments`);
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(writtenFragmentPath), false);
  const archivedFragment = result.body.fragments.find((entry) => entry.code === 'PRDFRAG-ARCHIVE-001');
  assert(archivedFragment);
  assert.equal(String(archivedFragment.status), 'archived');

  const fragmentRow = await dbModule.dbGet(
    'SELECT file_path, status, merged FROM prd_fragments WHERE project_id = ? AND code = ?',
    [project.id, 'PRDFRAG-ARCHIVE-001']
  );
  assert.equal(fragmentRow.file_path, null);
  assert.equal(fragmentRow.status, 'archived');
  assert.equal(fragmentRow.merged, 0);
});

test('loading PRD backfills blank editor state from already integrated fragments in the database', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const fragment = await persistence.savePrdFragment({
    projectId: project.id,
    title: 'Integrated PRD rehydrate test',
    markdown: [
      '## Executive Summary',
      '',
      'This content should be restored from the stored fragment.',
      '',
      '## Product Overview',
      '',
      '### Product Vision',
      '',
      'Restore the PRD from integrated fragments when editor state is blank.',
      '',
      '### Target Audiences',
      '',
      '- Builders',
      '',
      '### Key Value Propositions',
      '',
      '- Recover canonical PRD content from SQLite-backed fragments.',
      '',
      '## Functional Requirements',
      '',
      '### Current Application Workflows',
      '',
      '- Loading the PRD should repair older broken merge state.',
      '',
      '## Non-Functional Requirements',
      '',
      '### Reliability',
      '',
      'Repair should work without manual fragment recreation.',
      '',
      '## Success Metrics',
      '',
      '- PRD content reappears after sync.',
      '',
    ].join('\n'),
    mermaid: 'flowchart TD\n  fragment["Integrated fragment"] --> prd["PRD"]',
    status: 'integrated',
    merged: true,
    mergedAt: '2099-03-28T12:00:00.000Z',
    updatedAt: '2099-03-28T12:00:00.000Z',
  });

  await persistence.saveProjectDocument(project.id, 'prd', {
    markdown: '',
    mermaid: 'flowchart TD\n  product["Product"] --> value["Value"]',
    editorState: {
      executiveSummary: { text: '', versionDate: '2026-03-28T12:05:00.000Z' },
      productOverview: { productName: project.name, vision: '', targetAudiences: [], keyValueProps: [], versionDate: '2026-03-28T12:05:00.000Z' },
      functionalRequirements: { workflows: [], userActions: [], systemBehaviors: [], versionDate: '2026-03-28T12:05:00.000Z' },
      nonFunctionalRequirements: { usability: '', reliability: '', accessibility: '', security: '', performance: '', versionDate: '2026-03-28T12:05:00.000Z' },
      technicalArchitecture: [],
      implementationPlan: { sequencing: [], dependencies: [], milestones: [], versionDate: '2026-03-28T12:05:00.000Z' },
      successMetrics: [],
      risksMitigations: [],
      futureEnhancements: [],
      appliedFragments: [{ fragmentId: fragment.id, title: fragment.title, status: 'integrated' }],
      conclusion: '',
    },
  });

  const result = await request(`/api/projects/${project.id}/prd`);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.executiveSummary.text, 'This content should be restored from the stored fragment.');
  assert.equal(result.body.editorState.productOverview.vision, 'Restore the PRD from integrated fragments when editor state is blank.');
  assert.equal(result.body.editorState.nonFunctionalRequirements.reliability, 'Repair should work without manual fragment recreation.');
  assert.match(result.body.markdown, /Recover canonical PRD content from SQLite-backed fragments\./);
});

test('managed markdown parser safely round-trips Mermaid arrows inside the comment payload', () => {
  const bugs = [{
    id: 'bug-1',
    projectId: 'project-1',
    code: 'BUG-001',
    title: 'Arrow payload',
    summary: 'Mermaid arrows should not break the managed block.',
    currentBehavior: 'The payload parser stops early.',
    expectedBehavior: 'The payload should survive read/write intact.',
    severity: 'high',
    status: 'open',
    taskId: null,
    completed: false,
    regressed: false,
    archived: false,
    createdAt: '2026-03-27T00:00:00.000Z',
    updatedAt: '2026-03-27T00:00:00.000Z',
  }];
  const mermaid = workspaceDocs.renderBugsMermaid(bugs);
  assert.match(mermaid, /-->/);
  const markdown = workspaceDocs.renderBugsMarkdown({ name: 'Parser Test' }, bugs, mermaid);
  const parsed = workspaceDocs.parseManagedBlock(markdown);
  assert(parsed);
  assert.equal(parsed.bugs.length, 1);
  assert.match(parsed.mermaid, /-->/);
});

test('phase 4 integrations persist encrypted settings, support GitHub/webhook flows, and execute custom plugins', async () => {
  const mockRequests = {
    issue: null,
    pull: null,
    plugin: null,
    authHeaders: [],
  };

  const mockServer = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const bodyChunks = [];
    req.on('data', (chunk) => bodyChunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(bodyChunks).toString('utf8');
      let body = null;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }
      }

      if (req.headers.authorization) mockRequests.authHeaders.push(req.headers.authorization);

      const json = (status, payload) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      };

      if (req.method === 'GET' && url.pathname === '/repos/apm/phase4-repo') {
        return json(200, { id: 1, full_name: 'apm/phase4-repo', html_url: 'https://github.example/apm/phase4-repo' });
      }
      if (req.method === 'GET' && url.pathname === '/repos/apm/phase4-repo/issues') {
        return json(200, [{ number: 101, title: 'Existing issue', html_url: 'https://github.example/issues/101' }]);
      }
      if (req.method === 'GET' && url.pathname === '/repos/apm/phase4-repo/pulls') {
        return json(200, [{ number: 12, title: 'Existing PR', html_url: 'https://github.example/pulls/12' }]);
      }
      if (req.method === 'POST' && url.pathname === '/repos/apm/phase4-repo/issues') {
        mockRequests.issue = body;
        return json(201, { number: 102, title: body.title, html_url: 'https://github.example/issues/102' });
      }
      if (req.method === 'POST' && url.pathname === '/repos/apm/phase4-repo/pulls') {
        mockRequests.pull = body;
        return json(201, { number: 13, title: body.title, html_url: 'https://github.example/pulls/13' });
      }
      if (req.method === 'POST' && url.pathname === '/plugin-forward') {
        mockRequests.plugin = { headers: req.headers, body };
        return json(200, { forwarded: true });
      }

      json(404, { error: 'Not found' });
    });
  });

  await new Promise((resolve, reject) => {
    mockServer.listen(0, '127.0.0.1', (err) => (err ? reject(err) : resolve()));
  });

  try {
    const mockBaseUrl = `http://127.0.0.1:${mockServer.address().port}`;
    let result = await request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        integrations: {
          githubApiBaseUrl: mockBaseUrl,
          githubToken: 'gh-test-token',
          webhookSecret: 'phase4-secret',
        },
      }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.integrations.githubApiBaseUrl, mockBaseUrl);
    assert.equal(result.body.integrations.githubTokenMasked, '********');
    assert.equal(result.body.integrations.webhookSecretConfigured, true);

    const githubTokenRow = await dbModule.dbGet('SELECT value FROM app_settings WHERE key = ?', ['integrations.githubToken']);
    const webhookSecretRow = await dbModule.dbGet('SELECT value FROM app_settings WHERE key = ?', ['integrations.webhookSecret']);
    assert.match(githubTokenRow.value, /^enc:v1:/);
    assert.match(webhookSecretRow.value, /^enc:v1:/);

    const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
    assert(project);

    result = await request(`/api/projects/${project.id}/integrations`, {
      method: 'PUT',
      body: JSON.stringify({
        github: {
          enabled: true,
          owner: 'apm',
          repo: 'phase4-repo',
        },
        webhooks: {
          autoCreateTasks: true,
          taskStatus: 'in_progress',
          taskPrefix: 'Webhook',
          endpoints: [{ id: 'default', name: 'Default webhook' }],
        },
        plugins: [{
          id: 'notify-build',
          name: 'Notify Build',
          type: 'webhook_forward',
          targetUrl: `${mockBaseUrl}/plugin-forward`,
          method: 'POST',
          headers: { 'x-plugin-token': 'phase4' },
          includeProjectContext: true,
        }],
      }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.github.owner, 'apm');
    assert.equal(result.body.plugins[0].id, 'notify-build');

    result = await request(`/api/github/projects/${project.id}/summary`);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.connected, true);
    assert.equal(result.body.repository.owner, 'apm');
    assert.equal(result.body.issues.length, 1);
    assert.equal(result.body.pullRequests.length, 1);

    result = await request(`/api/github/projects/${project.id}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Create issue from app', body: 'Issue body' }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.number, 102);
    assert.deepEqual(mockRequests.issue, { title: 'Create issue from app', body: 'Issue body' });

    result = await request(`/api/github/projects/${project.id}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Ship phase 4', head: 'feature/phase4', base: 'main', body: 'PR body' }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.number, 13);
    assert.deepEqual(mockRequests.pull, { title: 'Ship phase 4', body: 'PR body', head: 'feature/phase4', base: 'main' });
    assert(mockRequests.authHeaders.includes('Bearer gh-test-token'));

    result = await request(`/api/projects/${project.id}/integrations/notify-build/execute`, {
      method: 'POST',
      body: JSON.stringify({ trigger: 'manual' }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(mockRequests.plugin.headers['x-plugin-token'], 'phase4');
    assert.equal(mockRequests.plugin.body.project.id, project.id);
    assert.equal(mockRequests.plugin.body.request.trigger, 'manual');

    result = await request(`/api/webhooks/${project.id}/default`, {
      method: 'POST',
      headers: { 'x-apm-webhook-secret': 'wrong-secret' },
      body: JSON.stringify({ type: 'deploy.failed' }),
    });
    assert.equal(result.response.status, 401);

    result = await request(`/api/webhooks/${project.id}/default`, {
      method: 'POST',
      headers: { 'x-apm-webhook-secret': 'phase4-secret' },
      body: JSON.stringify({ type: 'deploy.failed', title: 'Investigate deployment' }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.task.status, 'in_progress');
    assert.match(result.body.task.title, /^Webhook: Investigate deployment$/);

    result = await request(`/api/projects/${project.id}/integration-events?limit=10`);
    assert.equal(result.response.status, 200);
    assert(result.body.some((event) => event.eventType === 'issue.created'));
    assert(result.body.some((event) => event.eventType === 'pull_request.created'));
    assert(result.body.some((event) => event.eventType === 'plugin.executed'));
    assert(result.body.some((event) => event.eventType === 'deploy.failed'));
  } finally {
    await closeServer(mockServer);
  }
});

test('phase 4 git workflow supports branch management, push/pull, and merge conflict resolution', async () => {
  const { body: roots } = await request('/api/roots');
  const betaPath = path.join(roots.projectsRoot, 'Beta');
  const remoteRepoPath = path.join(tempRoot, 'phase4-remote.git');
  const remoteWorkPath = path.join(tempRoot, 'phase4-remote-work');

  if (!fs.existsSync(path.join(betaPath, '.git'))) {
    runGit(['init'], betaPath);
    runGit(['config', 'user.name', 'APM Test'], betaPath);
    runGit(['config', 'user.email', 'apm-test@example.com'], betaPath);
    fs.writeFileSync(path.join(betaPath, 'conflict.txt'), 'base\n', 'utf8');
    runGit(['add', 'conflict.txt'], betaPath);
    runGit(['commit', '-m', 'Initial commit'], betaPath);
  }

  const baseBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], betaPath);

  if (!fs.existsSync(remoteRepoPath)) {
    runGit(['init', '--bare', remoteRepoPath], tempRoot);
  }
  try {
    runGit(['remote', 'add', 'origin', remoteRepoPath], betaPath);
  } catch {}
  runGit(['push', '-u', 'origin', baseBranch], betaPath);
  runGit(['symbolic-ref', 'HEAD', `refs/heads/${baseBranch}`], remoteRepoPath);

  let result = await request('/api/git/fetch', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', remote: 'origin' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.isRepo, true);

  const featureBranch = 'phase4-feature';
  result = await request('/api/git/branches', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', name: featureBranch, checkout: true }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.branch, featureBranch);

  fs.writeFileSync(path.join(betaPath, 'conflict.txt'), 'feature change\n', 'utf8');
  runGit(['add', 'conflict.txt'], betaPath);
  runGit(['commit', '-m', 'Feature change'], betaPath);

  result = await request('/api/git/push', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', remote: 'origin', branch: featureBranch, setUpstream: true }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.branch, featureBranch);

  result = await request('/api/git/checkout', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', branch: baseBranch }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.branch, baseBranch);

  fs.writeFileSync(path.join(betaPath, 'conflict.txt'), 'mainline change\n', 'utf8');
  runGit(['add', 'conflict.txt'], betaPath);
  runGit(['commit', '-m', 'Mainline change'], betaPath);

  result = await request('/api/git/merge', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', branch: featureBranch }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.conflict, true);
  assert(result.body.info.conflictedFiles.includes('conflict.txt'));

  result = await request('/api/git/merge', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', strategy: 'ours', files: ['conflict.txt'], complete: true }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.mergeInProgress, false);
  assert.deepEqual(result.body.conflictedFiles, []);

  if (fs.existsSync(remoteWorkPath)) {
    fs.rmSync(remoteWorkPath, { recursive: true, force: true });
  }
  runGit(['clone', '--branch', baseBranch, remoteRepoPath, remoteWorkPath], tempRoot);
  runGit(['config', 'user.name', 'Remote APM Test'], remoteWorkPath);
  runGit(['config', 'user.email', 'remote-apm-test@example.com'], remoteWorkPath);
  fs.writeFileSync(path.join(remoteWorkPath, 'remote-only.txt'), 'remote update\n', 'utf8');
  runGit(['add', 'remote-only.txt'], remoteWorkPath);
  runGit(['commit', '-m', 'Remote update'], remoteWorkPath);
  runGit(['push', 'origin', baseBranch], remoteWorkPath);

  result = await request('/api/git/pull', {
    method: 'POST',
    body: JSON.stringify({ path: 'Beta', remote: 'origin', branch: baseBranch }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(path.join(betaPath, 'remote-only.txt')), true);

  result = await request('/api/git/branches?path=Beta');
  assert.equal(result.response.status, 200);
  assert(result.body.branches.some((branch) => branch.name === featureBranch));
});

test('AI environment markdown always includes locked system directives for fragments', async () => {
  const project = {
    id: 'legacy-project-1',
    name: 'Legacy Alpha',
    projectType: 'general',
  };
  const editorState = workspaceDocs.defaultAiEnvironmentEditorState(project);
  const markdown = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, editorState, {
    sharedProfiles: [],
    fragmentsDirectiveProjectId: project.id,
    fragmentsRootDir: 'C:\\APM\\Fragments',
    shutdownLockedAppBeforeBuildDirectiveEnabled: true,
  });

  assert.match(markdown, /## 1\. Mission/);
  assert.match(markdown, /## 4\. APM Term Dictionary/);
  assert.match(markdown, /## 7\. Directive Template References/);
  assert.match(markdown, /## 8\. Locked System Directives/);
  assert.match(markdown, /Use the configured fragments path/);
  assert.match(markdown, /live runtime SQLite database/);
  assert.match(markdown, /## 9\. Module Directive Index/);
  assert.match(markdown, /### 9\.1 Roadmap/);
  assert.match(markdown, /#### 9\.1\.1 Use active roadmap and feature context/);
  assert.match(markdown, /Create ADR records for architectural decisions/);
  assert.match(markdown, /Shut down locked running application processes before rebuilds/);
  assert.match(markdown, /Record document-impacting changes in the Change Log/);
  assert.match(markdown, /Keep generated stored titles short and storage-safe/);
  assert.match(markdown, /keep titles and other short stored fields as short as the database allows/i);
  assert.match(markdown, /Use module-standard document wording/);
  assert.match(markdown, /software standards reference registry/);
  assert.match(markdown, /Create stable human-readable ids for persisted items/);
  assert.match(markdown, /apm\.shared\.stable-id\.naming/);
  assert.match(markdown, /short lowercase kebab-case identifier scoped by module or item type/);
  assert.match(markdown, /Parent Project/);
  assert.match(markdown, /Project Family/);
  assert.match(markdown, /Cross-Project Relationship/);
  assert.match(markdown, /Preserve project-family autonomy and explicit references/);
  assert.match(markdown, /apm\.shared\.project-family\.autonomy/);
  assert.match(markdown, /Generate regression tests for bug fixes/);
  assert.match(markdown, /apm\.module\.bugs\.regression-test-followup/);
  assert.match(markdown, /Paths:/);
  assert.match(markdown, /Project Fragments Path/);
  assert.match(markdown, /templates\/CHANGELOG\.template\.md/);
  assert.match(markdown, /\| Stable ID \|/);
  assert.match(markdown, /ai-environment-term-dictionary-apm/);
  assert.match(markdown, /apm\.module\.changelog\.traceability/);
  assert.match(markdown, /Module and template directives are authoritative/);
  assert.match(markdown, /app\.db/);
  assert.match(markdown, /C:\\APM\\Fragments/);
  assert.doesNotMatch(markdown, /No locked system directives defined\./);
});

test('AI environment build-lock shutdown directive is optional', () => {
  const project = {
    id: 'legacy-project-1',
    name: 'Legacy Alpha',
    projectType: 'general',
  };
  const editorState = workspaceDocs.defaultAiEnvironmentEditorState(project);
  const markdown = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, editorState, {
    sharedProfiles: [],
    fragmentsDirectiveProjectId: project.id,
    fragmentsRootDir: 'C:\\APM\\Fragments',
    shutdownLockedAppBeforeBuildDirectiveEnabled: false,
  });

  assert.doesNotMatch(markdown, /Shut down locked running application processes before rebuilds/);
});

test('AI environment optional directives can be disabled while required directives remain emitted', () => {
  const project = {
    id: 'legacy-project-1',
    name: 'Legacy Alpha',
    projectType: 'general',
  };
  const editorState = {
    ...workspaceDocs.defaultAiEnvironmentEditorState(project),
    disabledDirectiveIds: [
      'apm.module.architecture.adr-capture',
      'apm.shared.fragments.path',
    ],
  };
  const markdown = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, editorState, {
    sharedProfiles: [],
    fragmentsDirectiveProjectId: project.id,
    fragmentsRootDir: 'C:\\APM\\Fragments',
    shutdownLockedAppBeforeBuildDirectiveEnabled: true,
  });

  assert.doesNotMatch(markdown, /Create ADR records when architectural decisions are made/);
  assert.match(markdown, /Use the configured fragments path/);
});

test('AI environment custom instructions strip embedded managed suggestion blocks', () => {
  const project = {
    id: 'legacy-project-1',
    name: 'Legacy Alpha',
    projectType: 'general',
  };
  const noisyCustomInstructions = [
    '# AI Environment Suggestion: Sample',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'ai_environment',
      version: 1,
      editorState: {
        customInstructions: 'Project Scope\n- Keep this concise.',
      },
    }, null, 2),
    '-->',
    '',
    '## Custom Instructions',
    '',
    'This visible fallback should not duplicate the managed payload.',
  ].join('\n');
  const normalized = workspaceDocs.normalizeDocumentEditorStateForStorage(project, 'ai_environment', {
    ...workspaceDocs.defaultAiEnvironmentEditorState(project),
    customInstructions: noisyCustomInstructions,
  });
  const markdown = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, normalized);

  assert.equal(normalized.customInstructions, 'Project Scope\n- Keep this concise.');
  assert.doesNotMatch(markdown, /APM:DATA/);
  assert.doesNotMatch(markdown, /AI Environment Suggestion/);
});

test('PRD markdown does not render untitled placeholders for description-only detail entries', () => {
  const project = { id: 'prd-render-test', name: 'Render Test' };
  const editorState = {
    functionalRequirements: {
      workflows: [
        {
          title: '',
          description: 'The application keeps the full requirement detail in the description when no short title exists.',
          sourceRefs: ['FEAT-001'],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
      ],
    },
  };
  const markdown = workspaceDocs.renderPrdEditorStateMarkdown(project, editorState, []);
  assert.doesNotMatch(markdown, /Untitled entry/);
  assert.match(markdown, /APM-ID: prd-functional-requirements-workflows-the-application-keeps-the-full-requirement-detail/);
  assert.match(markdown, /APM-REFS: FEAT-001/);
  assert.match(markdown, /APM-LAST-UPDATED: 2026-04-04/);
  assert.match(markdown, /#### 3\.1\.1 Keeps the full requirement detail/i);
  assert.match(markdown, /The application keeps the full requirement detail in the description/);
});

test('legacy PRD detail entries are normalized into short titles with preserved descriptions', () => {
  const project = { id: 'project-1', name: 'Angel PM' };
  const editorState = workspaceDocs.normalizeDocumentEditorStateForStorage(project, 'prd', {
    executiveSummary: { text: '', versionDate: '' },
    productOverview: { productName: project.name, vision: '', targetAudiences: [], keyValueProps: [], versionDate: '' },
    functionalRequirements: { workflows: [], userActions: [], systemBehaviors: [], versionDate: '' },
    nonFunctionalRequirements: { usability: '', reliability: '', accessibility: '', security: '', performance: '', versionDate: '' },
    technicalArchitecture: [
      'Operational project artifacts such as templates and AI scratch files should live under `.apm`, not inside the human-facing docs output.',
    ],
    implementationPlan: {
      sequencing: [],
      dependencies: [],
      milestones: [
        'The active roadmap milestone remains Phase 1 completion, targeted for 2026-05-01.',
      ],
      versionDate: '',
    },
    successMetrics: [
      {
        title: 'Users can configure and test an SFTP connection without leaving the application.',
        description: '',
      },
    ],
    risksMitigations: [],
    futureEnhancements: [],
    appliedFragments: [],
    conclusion: '',
  });

  assert.equal(
    editorState.technicalArchitecture[0].title,
    'Operational project artifacts such as templates'
  );
  assert.equal(
    editorState.technicalArchitecture[0].description,
    'Operational project artifacts such as templates and AI scratch files should live under `.apm`, not inside the human-facing docs output.'
  );
  assert.equal(
    editorState.implementationPlan.milestones[0].title,
    'Active roadmap milestone remains Phase 1'
  );
  assert.equal(
    editorState.implementationPlan.milestones[0].description,
    'The active roadmap milestone remains Phase 1 completion, targeted for 2026-05-01.'
  );
  assert.equal(
    editorState.successMetrics[0].title,
    'Configure and test an SFTP connection'
  );
  assert.equal(
    editorState.successMetrics[0].description,
    'Users can configure and test an SFTP connection without leaving the application.'
  );
});

test('PRD markdown uses hierarchical numbering for functional requirement detail items', () => {
  const project = { id: 'project-1', name: 'Angel PM' };
  const markdown = workspaceDocs.renderPrdEditorStateMarkdown(project, {
    executiveSummary: { text: 'Summary', versionDate: '' },
    productOverview: { productName: project.name, vision: 'Vision', targetAudiences: [], keyValueProps: [], versionDate: '' },
    functionalRequirements: {
      workflows: [{ title: 'Organize projects', description: 'Users can organize projects.' }],
      userActions: [{ title: 'Save PRD', description: 'Users can save the PRD.' }],
      systemBehaviors: [{ title: 'Persist state', description: 'The system persists state.' }],
      versionDate: '',
    },
    nonFunctionalRequirements: { usability: '', reliability: '', accessibility: '', security: '', performance: '', versionDate: '' },
    technicalArchitecture: [],
    implementationPlan: { sequencing: [], dependencies: [], milestones: [], versionDate: '' },
    successMetrics: [],
    risksMitigations: [],
    futureEnhancements: [],
    appliedFragments: [],
    conclusion: '',
  }, []);

  assert.match(markdown, /#### 3\.1\.1 Organize projects/);
  assert.match(markdown, /#### 3\.2\.1 Save PRD/);
  assert.match(markdown, /#### 3\.3\.1 Persist state/);
});

test('loose PRD fragment detection tolerates utf8 bom-prefixed markdown files', () => {
  const serverAppSource = fs.readFileSync(path.join(repoRoot, 'src', 'server-app.js'), 'utf8');
  const workspaceDocsSource = fs.readFileSync(path.join(repoRoot, 'src', 'workspace-docs.js'), 'utf8');
  assert.match(serverAppSource, /replace\(\/\^\\uFEFF\/,\s*''\)/);
  assert.match(workspaceDocsSource, /replace\(\/\^\\uFEFF\/,\s*''\)/);
});

test('PRD markdown includes work item refs for non-functional requirement metadata', () => {
  const project = { id: 'project-1', name: 'Angel PM' };
  const editorState = workspaceDocs.normalizeDocumentEditorStateForStorage(project, 'prd', {
    nonFunctionalRequirements: {
      usability: 'The product should stay learnable for first-time users.',
      itemIds: {
        usability: 'prd-non-functional-requirements-usability',
      },
      itemSourceRefs: {
        usability: ['FEAT-001', 'BUG-002'],
      },
    },
  });

  const markdown = workspaceDocs.renderPrdEditorStateMarkdown(project, editorState, []);
  assert.match(markdown, /APM-ID: prd-non-functional-requirements-usability/);
  assert.match(markdown, /APM-REFS: FEAT-001, BUG-002/);
});

test('saving a managed document backfills stable document item ids into editor state', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  await persistence.saveProjectDocument(project.id, 'architecture', {
    markdown: '',
    mermaid: '',
    editorState: {
      overview: {
        summary: 'Architecture summary.',
        versionDate: '2026-04-04T00:00:00.000Z',
      },
      techStack: [
        {
          title: 'Next.js',
          description: 'Frontend application shell.',
          sourceRefs: ['FEAT-010'],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
      ],
      components: [],
      componentConnections: [],
      boundaries: [],
      externalDependencies: [],
      subArchitectures: [],
      applicationWorkflows: [],
      architectureWorkflows: [],
      moduleInteractions: [],
      persistenceStrategy: {
        summary: '',
        dataStores: [],
        sourceOfTruth: '',
        synchronizationNotes: '',
        versionDate: '2026-04-04T00:00:00.000Z',
      },
      crossCuttingConcerns: [],
      decisions: [],
      constraints: [],
      deployment: {
        runtimeTopology: '',
        environmentNotes: '',
        versionDate: '2026-04-04T00:00:00.000Z',
      },
      openQuestions: [],
      fragmentHistory: [],
    },
  });

  const stored = await persistence.readProjectDocument(project.id, 'architecture');
  assert.equal(stored.editorState.techStack[0].stableId, 'architecture-tech-stack-next-js');
  assert.deepEqual(stored.editorState.techStack[0].sourceRefs, ['FEAT-010']);
  assert.equal(stored.editorState.overview.itemIds.systemPurpose, 'architecture-overview-system-purpose-system-purpose');
  assert.equal(stored.editorState.structure.itemIds.primaryArchitecture, 'architecture-structure-primary-architecture-primary-architecture');
  assert.equal(stored.editorState.persistenceStrategy.itemIds.summary, 'architecture-persistence-strategy-summary-persistence-strategy');
  assert.equal(stored.editorState.deployment.itemIds.runtimeTopology, 'architecture-deployment-runtime-topology-runtime-topology');
});

test('saving PRD through the API backfills stable ids into legacy detail items', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const result = await request(`/api/projects/${project.id}/prd`, {
    method: 'PUT',
    body: JSON.stringify({
      editorState: {
        executiveSummary: {
          text: 'Summary.',
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        productOverview: {
          productName: project.name,
          vision: 'Vision.',
          targetAudiences: [],
          keyValueProps: [],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        functionalRequirements: {
          workflows: [
            {
              title: '',
              description: 'The application saves PRD updates through the managed editor pipeline.',
              versionDate: '2026-04-04T00:00:00.000Z',
              sourceRefs: ['FEAT-PRD-001'],
            },
          ],
          userActions: [],
          systemBehaviors: [],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        nonFunctionalRequirements: {
          usability: '',
          reliability: '',
          accessibility: '',
          security: '',
          performance: '',
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        technicalArchitecture: [],
        implementationPlan: {
          sequencing: [],
          dependencies: [],
          milestones: [],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        successMetrics: [],
        risksMitigations: [],
        futureEnhancements: [],
        appliedFragments: [],
        conclusion: 'Conclusion.',
      },
    }),
  });

  assert.equal(result.response.status, 200);
  assert.match(result.body.editorState.functionalRequirements.workflows[0].stableId, /^prd-functional-requirements-workflows-/);
  assert.equal(result.body.editorState.functionalRequirements.workflows[0].title, 'Saves PRD updates through the managed editor pipeline.');

  const stored = await persistence.readProjectDocument(project.id, 'prd');
  assert.match(stored.editorState.functionalRequirements.workflows[0].stableId, /^prd-functional-requirements-workflows-/);
  assert.deepEqual(stored.editorState.functionalRequirements.workflows[0].sourceRefs, ['FEAT-PRD-001']);
  assert.equal(stored.editorState.functionalRequirements.workflows[0].title, 'Saves PRD updates through the managed editor pipeline.');
});

test('saving PRD through the API backfills stable ids for text-list and non-functional items', async () => {
  const persistence = require(path.join(repoRoot, 'src', 'persistence.js'));
  const project = (await request('/api/projects')).body.find((item) => item.id === 'legacy-project-1');
  assert(project);

  const result = await request(`/api/projects/${project.id}/prd`, {
    method: 'PUT',
    body: JSON.stringify({
      editorState: {
        executiveSummary: {
          text: 'Summary.',
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        productOverview: {
          productName: project.name,
          vision: 'Vision.',
          targetAudiences: [{ text: 'Product owners and planners.' }],
          keyValueProps: [{ text: 'Creates a consistent workflow for managed docs.' }],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        functionalRequirements: {
          workflows: [],
          userActions: [],
          systemBehaviors: [],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        nonFunctionalRequirements: {
          usability: 'The interface should remain understandable during heavy documentation work.',
          reliability: 'Managed document saves should recover cleanly from partial failures.',
          accessibility: 'Keyboard navigation should remain available for structured editors.',
          security: 'Stored project data should not be exposed outside configured roots.',
          performance: 'Core document screens should remain responsive during normal editing.',
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        technicalArchitecture: [],
        implementationPlan: {
          sequencing: [],
          dependencies: [],
          milestones: [],
          versionDate: '2026-04-04T00:00:00.000Z',
        },
        successMetrics: [],
        risksMitigations: [],
        futureEnhancements: [],
        appliedFragments: [],
        conclusion: 'Conclusion.',
      },
    }),
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.body.editorState.productOverview.targetAudiences[0].stableId, 'prd-product-overview-target-audience-product-owners-and-planners');
  assert.equal(result.body.editorState.productOverview.keyValueProps[0].stableId, 'prd-product-overview-key-value-propositions-creates-a-consistent-workflow-for-managed-docs');
  assert.equal(result.body.editorState.executiveSummary.stableId, 'prd-executive-summary-executive-summary');
  assert.equal(result.body.editorState.productOverview.itemIds.productName, 'prd-product-overview-product-name-product-name');
  assert.equal(result.body.editorState.productOverview.itemIds.vision, 'prd-product-overview-product-vision-product-vision');
  assert.equal(result.body.editorState.nonFunctionalRequirements.itemIds.usability, 'prd-non-functional-requirements-usability-usability');
  assert.equal(result.body.editorState.nonFunctionalRequirements.itemIds.performance, 'prd-non-functional-requirements-performance-performance');

  const stored = await persistence.readProjectDocument(project.id, 'prd');
  assert.equal(stored.editorState.executiveSummary.stableId, 'prd-executive-summary-executive-summary');
  assert.equal(stored.editorState.productOverview.itemIds.productName, 'prd-product-overview-product-name-product-name');
  assert.equal(stored.editorState.productOverview.itemIds.vision, 'prd-product-overview-product-vision-product-vision');
  assert.equal(stored.editorState.productOverview.targetAudiences[0].stableId, 'prd-product-overview-target-audience-product-owners-and-planners');
  assert.equal(stored.editorState.productOverview.keyValueProps[0].stableId, 'prd-product-overview-key-value-propositions-creates-a-consistent-workflow-for-managed-docs');
  assert.equal(stored.editorState.nonFunctionalRequirements.itemIds.reliability, 'prd-non-functional-requirements-reliability-reliability');
});

test('AI environment markdown includes a locked project workspace directive for folder projects', () => {
  const projectRoot = path.join(tempRoot, 'workspace-directive-project');
  fs.mkdirSync(projectRoot, { recursive: true });
  const project = {
    id: 'workspace-directive-project',
    name: 'Workspace Directive Project',
    type: 'folder',
    path: projectRoot,
    absolutePath: projectRoot,
    projectType: 'general',
  };
  const editorState = workspaceDocs.defaultAiEnvironmentEditorState(project);
  const markdown = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, editorState, {
    sharedProfiles: [],
  });

  assert.match(markdown, /## 8\. Locked System Directives/);
  assert.match(markdown, /Use the project workspace folder for volatile AI work/);
  assert.match(markdown, /\.apm\\_WORKSPACE|\.apm\/_WORKSPACE/);
  assert.match(markdown, /TODO lists, draft plans, scratch notes, and temporary working files/);
});

test('AI environment markdown omits application-only directives for non-selected projects', () => {
  const project = {
    id: 'legacy-project-1',
    name: 'Legacy Alpha',
    projectType: 'general',
  };
  const editorState = workspaceDocs.defaultAiEnvironmentEditorState(project);
  const markdown = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, editorState, {
    sharedProfiles: [],
    fragmentsDirectiveProjectId: 'some-other-project',
  });

  assert.match(markdown, /Use the configured fragments path/);
  assert.doesNotMatch(markdown, /live runtime SQLite database/);
  assert.doesNotMatch(markdown, /Application directives are emitted to the configured Directive Project/);
  assert.match(markdown, /Record document-impacting changes in the Change Log/);
  assert.match(markdown, /Keep generated stored titles short and storage-safe/);
  assert.match(markdown, /## 9\. Module Directive Index/);
  assert.match(markdown, /## 6\. Applied Shared Profiles/);
});

test('roadmap and features markdown only render active unfinished feature work', () => {
  const project = { id: 'project-1', name: 'Language Check' };
  const phases = [{ id: 'phase-1', code: 'P1', name: 'Phase 1', status: 'planned' }];
  const features = [
    { id: 'f1', code: 'FEAT-001', title: 'Planned feature', status: 'planned', archived: false, roadmapPhaseId: 'phase-1', planningBucket: 'planned' },
    { id: 'f2', code: 'FEAT-002', title: 'Implemented feature', status: 'done', archived: true, roadmapPhaseId: 'phase-1', planningBucket: 'planned' },
  ];

  const roadmapMarkdown = workspaceDocs.renderRoadmapMarkdown(project, phases, [], features, [], 'graph TD');
  const featuresMarkdown = workspaceDocs.renderFeaturesMarkdown(project, phases, features, 'graph TD');

  assert.match(roadmapMarkdown, /active planned entries in FEATURES\.md/);
  assert.match(roadmapMarkdown, /archived work is omitted/);
  assert.match(featuresMarkdown, /## Planned Features/);
  assert.match(featuresMarkdown, /FEAT-001: Planned feature/);
  assert.doesNotMatch(featuresMarkdown, /## Implemented Features/);
  assert.doesNotMatch(featuresMarkdown, /FEAT-002: Implemented feature/);
  assert.doesNotMatch(featuresMarkdown, /## Active Features/);
  assert.doesNotMatch(featuresMarkdown, /## Archived Features/);
});

test('template inventory includes document and fragment templates for every document-oriented module', () => {
  for (const definition of Object.values(workspaceDocs.DOC_TYPES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, 'templates', definition.templateName)), true);
  }

  for (const templateName of Object.values(workspaceDocs.FRAGMENT_TEMPLATE_NAMES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, 'templates', templateName)), true);
  }
});

test('software standards registry is available from the top-level standards directory', () => {
  assert.equal(workspaceDocs.SOFTWARE_STANDARDS_REFERENCE_REGISTRY_NAME, 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md');
  assert.equal(fs.existsSync(workspaceDocs.getSoftwareStandardsRegistrySourcePath()), true);
  assert.equal(
    path.normalize(workspaceDocs.getSoftwareStandardsRegistrySourcePath()),
    path.join(repoRoot, 'standards', 'software', 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md')
  );
});

test('software standards source directory syncs into the project data standards folder', () => {
  const project = {
    id: 'standards-sync-project',
    type: 'folder',
    absolutePath: path.join(workspaceRoot, 'StandardsSyncProject'),
  };

  fs.mkdirSync(project.absolutePath, { recursive: true });
  const syncedRegistryPath = workspaceDocs.syncSoftwareStandardsForProject(project);
  const projectSoftwareStandardsDir = workspaceDocs.getProjectSoftwareStandardsDir(project);

  assert.equal(path.normalize(syncedRegistryPath), path.join(projectSoftwareStandardsDir, 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md'));
  assert.equal(fs.existsSync(projectSoftwareStandardsDir), true);
  assert.equal(fs.existsSync(syncedRegistryPath), true);
  assert.equal(
    fs.readFileSync(syncedRegistryPath, 'utf8'),
    fs.readFileSync(path.join(repoRoot, 'standards', 'software', 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md'), 'utf8')
  );
});

test('app toolbar menu anchors dropdowns relative to each menu button', () => {
  const appToolbar = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-toolbar.js'), 'utf8');
  assert.match(appToolbar, /toolbar-menu-\$\{String\(label\)\.toLowerCase\(\)\} relative app-no-drag/);
  assert.match(appToolbar, /app-menu-bar-inner relative z-20/);
});

test('project settings groups modules under AI and Software inside a Modules category', () => {
  const projectSettingsModal = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'project-settings-modal.js'), 'utf8');
  assert.match(projectSettingsModal, /key: 'modules', label: 'Modules'/);
  assert.match(projectSettingsModal, /const availableAiModules = useMemo/);
  assert.match(projectSettingsModal, /const availableSoftwareModules = useMemo/);
  assert.match(projectSettingsModal, /Modules/);
  assert.match(projectSettingsModal, /Modules that define how AI should read and operate within the project/);
  assert.match(projectSettingsModal, /Modules that define product, requirements, system design, and validation work for software projects/);
});

test('AI environment workspace exposes save path, fragments path, and custom instructions', () => {
  const aiWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'ai', 'components', 'ai-environment-workspace.js'), 'utf8');
  assert.match(aiWorkspace, /Custom Instructions/);
  assert.match(aiWorkspace, /AI_ENVIRONMENT\.md:/);
  assert.match(aiWorkspace, /Fragments Path:/);
  assert.match(aiWorkspace, /Project Fragments:/);
  assert.match(aiWorkspace, /Runtime Database:/);
  assert.match(aiWorkspace, /Software Standards:/);
  assert.match(aiWorkspace, /Load Fragments/);
  assert.match(aiWorkspace, /APM Term Dictionary/);
  assert.match(aiWorkspace, /AI_SECTION_GUIDES/);
  assert.match(aiWorkspace, /AI Section Guide/);
  assert.match(aiWorkspace, /Custom Instruction Review Buffer/);
  assert.match(aiWorkspace, /Resolved Paths/);
  assert.match(aiWorkspace, /pathHints/);
  assert.match(aiWorkspace, /code-owned directive instead of leaving it in this freeform buffer/);
  assert.match(aiWorkspace, /termDictionary/);
  assert.match(aiWorkspace, /Directive Hierarchy/);
  assert.match(aiWorkspace, /function groupDirectivesByModule/);
  assert.match(aiWorkspace, /moduleGroups/);
  assert.match(aiWorkspace, /expandedDirectiveModules/);
  assert.match(aiWorkspace, /expandedDirectiveDescriptions/);
  assert.match(aiWorkspace, /Expand Module/);
  assert.match(aiWorkspace, /Collapse Module/);
  assert.match(aiWorkspace, /ai-directive-group/);
  assert.match(aiWorkspace, /ai-directive-item/);
  assert.match(aiWorkspace, /aria-controls/);
  assert.match(aiWorkspace, /disabled directives disappear from generated documents/);
  assert.match(aiWorkspace, /toggleDirective/);
  assert.match(aiWorkspace, /Fragment-first directive updates/);
  assert.match(aiWorkspace, /AI directive changes should be loaded through AI Environment fragments/);
  assert.match(aiWorkspace, /ProjectFamilyDocumentContext/);
  assert.doesNotMatch(aiWorkspace, /Upload Directives/);
  assert.doesNotMatch(aiWorkspace, /Imported directives from/);
});

test('file watcher hook exposes an EventSource-backed reusable client helper', () => {
  const hookSource = fs.readFileSync(path.join(repoRoot, 'next-app', 'hooks', 'use-file-watcher.js'), 'utf8');
  const fragmentHookSource = fs.readFileSync(path.join(repoRoot, 'next-app', 'hooks', 'use-fragment-file-watcher.js'), 'utf8');
  const moduleDocumentHookSource = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'hooks', 'use-module-document.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(repoRoot, 'src', 'server-app.js'), 'utf8');
  assert.match(hookSource, /new EventSource/);
  assert.match(hookSource, /status/);
  assert.match(hookSource, /clearEvents/);
  assert.match(fragmentHookSource, /project-fragments:\$\{projectId\}/);
  assert.match(fragmentHookSource, /useFileWatcher/);
  assert.match(fragmentHookSource, /debounceMs/);
  assert.match(moduleDocumentHookSource, /useFragmentFileWatcher/);
  assert.match(serverSource, /ensureProjectFragmentWatcher/);
  assert.match(serverSource, /project-fragments:\$\{project\.id\}/);
});

test('structured list editors surface stable ids underneath saved items', () => {
  const entryEditor = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'structured-entry-list-editor.js'), 'utf8');
  const textEditor = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'structured-text-list-editor.js'), 'utf8');
  assert.match(entryEditor, /ID: \{entry\.stableId \|\| 'pending-save'\}/);
  assert.match(textEditor, /ID: \{entry\.stableId \|\| 'pending-save'\}/);
});

test('functional spec workspace exposes a visual flow canvas with node controls', () => {
  const functionalSpecWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'functional-spec-workspace.js'), 'utf8');
  const functionalFlowNode = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'functional-flow-node.js'), 'utf8');
  const flowchartInterface = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'flowchart', 'functional-flowchart-interface.js'), 'utf8');
  const reactFlowImplementation = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'flowchart', 'react-flowchart-implementation.js'), 'utf8');
  const reactCanvasImplementation = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'flowchart', 'react-canvas-flowchart-implementation.js'), 'utf8');
  const flowchartRendererUtils = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'flowchart', 'flowchart-renderer-utils.js'), 'utf8');
  const workflowNodeVisuals = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'functional-spec', 'components', 'flowchart', 'workflow-node-visuals.js'), 'utf8');
  const workspaceDocs = fs.readFileSync(path.join(repoRoot, 'src', 'workspace-docs.js'), 'utf8');
  const nextPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'next-app', 'package.json'), 'utf8'));
  assert.match(functionalSpecWorkspace, /FunctionalFlowchartCanvas/);
  assert.match(functionalSpecWorkspace, /ProjectFamilyDocumentContext/);
  assert.doesNotMatch(functionalSpecWorkspace, /@xyflow\/react/);
  assert.match(functionalSpecWorkspace, /function FunctionalSpecTextArea/);
  assert.match(functionalSpecWorkspace, /function FunctionalAreaTree/);
  assert.match(functionalSpecWorkspace, /function WorkflowActionPalette/);
  assert.match(functionalSpecWorkspace, /function FlowCanvasGroup/);
  assert.match(functionalSpecWorkspace, /Unattached Functional Notes/);
  assert.match(functionalSpecWorkspace, /Prefer modeling user actions, validation, interface expectations, and edge cases directly in the flowchart/);
  assert.match(functionalSpecWorkspace, /Unattached User Actions and System Responses/);
  assert.match(functionalSpecWorkspace, /Unattached Validation Rules/);
  assert.match(functionalSpecWorkspace, /Unattached Interface Expectations/);
  assert.match(functionalSpecWorkspace, /Unattached Edge Cases/);
  assert.match(functionalSpecWorkspace, /Unattached Open Questions/);
  assert.match(functionalSpecWorkspace, /draggable/);
  assert.match(functionalSpecWorkspace, /NODE_DRAG_DATA_TYPE/);
  assert.match(functionalSpecWorkspace, /Clean Visible Layouts/);
  assert.match(functionalSpecWorkspace, /Hook Points/);
  assert.match(functionalSpecWorkspace, /xl:grid-cols-\[320px_minmax\(0,1fr\)\]/);
  assert.match(functionalSpecWorkspace, /deleteNodePreservingEdges/);
  assert.match(functionalSpecWorkspace, /onCreateNode/);
  assert.match(functionalSpecWorkspace, /onDeleteNode/);
  assert.match(functionalSpecWorkspace, /onRemoveEdge/);
  assert.match(flowchartInterface, /FLOWCHART_RENDERERS/);
  assert.match(flowchartInterface, /renderer = FLOWCHART_RENDERERS\.reactCanvas/);
  assert.match(flowchartInterface, /showZoomControls = true/);
  assert.match(flowchartInterface, /showPanControls = true/);
  assert.match(flowchartInterface, /enableWheelZoom = true/);
  assert.match(flowchartInterface, /enableDragPan = true/);
  assert.match(flowchartInterface, /trapWheelScroll = true/);
  assert.match(flowchartInterface, /minZoom = 0\.35/);
  assert.match(flowchartInterface, /maxZoom = 2\.5/);
  assert.match(flowchartInterface, /ReactFlowchartImplementation/);
  assert.match(flowchartInterface, /ReactCanvasFlowchartImplementation/);
  assert.doesNotMatch(flowchartInterface, /TldrawFlowchartImplementation/);
  assert.match(reactFlowImplementation, /@xyflow\/react/);
  assert.match(reactFlowImplementation, /ReactFlow/);
  assert.match(reactFlowImplementation, /MarkerType/);
  assert.match(reactFlowImplementation, /MiniMap/);
  assert.match(reactFlowImplementation, /onNodeDrag/);
  assert.match(reactCanvasImplementation, /ReactCanvasFlowchartImplementation/);
  assert.match(reactCanvasImplementation, /<svg/);
  assert.match(reactCanvasImplementation, /onConnectNodes/);
  assert.match(reactCanvasImplementation, /nodeHandlePoint/);
  assert.doesNotMatch(reactCanvasImplementation, /nodeCenter/);
  assert.match(reactCanvasImplementation, /sourceHandle/);
  assert.match(reactCanvasImplementation, /targetHandle/);
  assert.match(reactCanvasImplementation, /connectionDraft/);
  assert.match(reactCanvasImplementation, /danglingParams/);
  assert.match(reactCanvasImplementation, /beginConnectionFromDraftEdge/);
  assert.match(reactCanvasImplementation, /onRemoveEdge/);
  assert.match(reactCanvasImplementation, /onDeleteNode/);
  assert.match(reactCanvasImplementation, /handleDrop/);
  assert.match(reactCanvasImplementation, /onDrop/);
  assert.match(reactCanvasImplementation, /handleDirections/);
  assert.match(reactCanvasImplementation, /handleDirectionKey/);
  assert.match(reactCanvasImplementation, /directionTrianglePoints/);
  assert.match(reactCanvasImplementation, /function HandleDirectionMarker/);
  assert.match(reactCanvasImplementation, /transform=\{`translate\(\$\{point\.x\} \$\{point\.y\}\)`\}/);
  assert.match(reactCanvasImplementation, /directions\.incoming/);
  assert.match(reactCanvasImplementation, /directions\.outgoing/);
  assert.match(reactCanvasImplementation, /directions=\{inputDirections\}/);
  assert.match(reactCanvasImplementation, /directions=\{outputDirections\}/);
  assert.match(reactCanvasImplementation, /fill="white"/);
  assert.match(reactCanvasImplementation, /tabIndex=\{0\}/);
  assert.match(reactCanvasImplementation, /onKeyDown=\{handleKeyDown\}/);
  assert.match(reactCanvasImplementation, /ArrowLeft/);
  assert.match(reactCanvasImplementation, /ArrowRight/);
  assert.match(reactCanvasImplementation, /ArrowUp/);
  assert.match(reactCanvasImplementation, /ArrowDown/);
  assert.match(reactCanvasImplementation, /Connection type/);
  assert.match(reactCanvasImplementation, /EDGE_TYPES\.map/);
  assert.match(reactCanvasImplementation, /Unconnected/);
  assert.match(reactCanvasImplementation, /Zoom in flowchart/);
  assert.match(reactCanvasImplementation, /Zoom out flowchart/);
  assert.match(reactCanvasImplementation, /Reset flowchart zoom/);
  assert.match(reactCanvasImplementation, /Pan flowchart left/);
  assert.match(reactCanvasImplementation, /Pan flowchart right/);
  assert.match(reactCanvasImplementation, /beginPan/);
  assert.match(reactCanvasImplementation, /panStep/);
  assert.match(reactCanvasImplementation, /handleWheel/);
  assert.match(reactCanvasImplementation, /enableWheelZoom/);
  assert.match(reactCanvasImplementation, /trapWheelScroll/);
  assert.match(reactCanvasImplementation, /addEventListener\('wheel'/);
  assert.match(reactCanvasImplementation, /passive: false/);
  assert.match(reactCanvasImplementation, /preventDefault/);
  assert.match(reactCanvasImplementation, /stopPropagation/);
  assert.match(reactCanvasImplementation, /enableDragPan/);
  assert.match(reactCanvasImplementation, /cursor-grab/);
  assert.match(flowchartRendererUtils, /export const EDGE_TYPES/);
  assert.match(flowchartRendererUtils, /CONNECTION_HANDLES/);
  assert.match(flowchartRendererUtils, /function nodeHandlePoint/);
  assert.match(functionalSpecWorkspace, /sourceHandle/);
  assert.match(functionalSpecWorkspace, /targetHandle/);
  assert.match(functionalSpecWorkspace, /replaceDraft/);
  assert.match(functionalSpecWorkspace, /draft: Boolean/);
  assert.match(workspaceDocs, /sourceHandle/);
  assert.match(workspaceDocs, /targetHandle/);
  assert.match(workspaceDocs, /Connection Status: Unconnected draft/);
  assert.match(workspaceDocs, /## 6\. User Actions and System Responses/);
  assert.match(workspaceDocs, /Functional Flowchart Action Vocabulary/);
  assert.match(workspaceDocs, /Create Draft Edge: Create an unattached connection/);
  assert.match(workspaceDocs, /## 7\. Validation Rules/);
  assert.match(workspaceDocs, /## 8\. Interface Expectations/);
  assert.match(workspaceDocs, /## 9\. Edge Cases/);
  assert.match(workspaceDocs, /## 10\. Open Questions/);
  assert.match(workspaceDocs, /## 11\. Applied Fragments/);
  assert.match(workspaceDocs, /Boolean\(source \|\| target\)/);
  assert.equal(Boolean(nextPackage.dependencies.tldraw), false);
  assert.match(functionalFlowNode, /NodeResizer/);
  assert.match(functionalFlowNode, /WorkflowNodeIcon/);
  assert.match(functionalFlowNode, /Handle/);
  assert.match(workflowNodeVisuals, /decision/);
});

test('app theme provider forwards global client errors to the backend logger endpoint', () => {
  const appThemeProvider = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'app-theme-provider.js'), 'utf8');
  assert.match(appThemeProvider, /window\.addEventListener\('error'/);
  assert.match(appThemeProvider, /window\.addEventListener\('unhandledrejection'/);
  assert.match(appThemeProvider, /api\/log-client-error/);
  assert.match(appThemeProvider, /navigator\?\.sendBeacon/);
});

test('SFTP workspace surfaces mapping feedback and opens transfer progress for mapping runs', () => {
  const sftpModal = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'sftp-modal.js'), 'utf8');
  const integrationsWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'workspace', 'components', 'integrations-workspace.js'), 'utf8');
  const serverApp = fs.readFileSync(path.join(repoRoot, 'src', 'server-app.js'), 'utf8');
  assert.match(sftpModal, /Add Upload/);
  assert.match(sftpModal, /Add Download/);
  assert.match(sftpModal, /Rename upload group/);
  assert.match(sftpModal, /Rename download group/);
  assert.match(sftpModal, /kindArrow/);
  assert.match(sftpModal, /kindLabel/);
  assert.match(sftpModal, /Choose a file or folder, then use Add From Selection to create a mapping with visible feedback/);
  assert.match(sftpModal, /border-sky-300 bg-sky-50 text-sky-950/);
  assert.match(sftpModal, /Upload Progress/);
  assert.match(sftpModal, /Running mapped uploads/);
  assert.match(sftpModal, /Cancel Run/);
  assert.match(sftpModal, /Hide/);
  assert.match(sftpModal, /AbortController/);
  assert.match(sftpModal, /processed: index \+ 1/);
  assert.match(sftpModal, /buildUploadMappingFromSelection/);
  assert.match(sftpModal, /buildDownloadMappingFromSelection/);
  assert.match(serverApp, /sftp\.upload\.start/);
  assert.match(serverApp, /sftp\.upload\.complete/);
  assert.match(serverApp, /sftp\.download\.start/);
  assert.match(serverApp, /sftp\.download\.complete/);
  assert.match(integrationsWorkspace, /SFTP status updates from mapping actions and transfer runs will appear here/);
});

test('SFTP mapping rules preserve file and folder replacement semantics', async () => {
  const mappingRules = require(path.join(repoRoot, 'src', 'sftp-mapping-rules.js'));

  const fileToFileUpload = mappingRules.buildUploadMappingFromSelection({
    sourceSelection: { path: 'Project/dist/app.js', type: 'file' },
    targetSelection: { path: '/srv/app/app.js', type: 'file' },
    currentRemotePath: '/srv/app',
  });
  assert.equal(fileToFileUpload.remotePath, '/srv/app/app.js');
  assert.equal(fileToFileUpload.overwrite, true);

  const folderToFolderUpload = mappingRules.buildUploadMappingFromSelection({
    sourceSelection: { path: 'Project/dist', type: 'dir' },
    targetSelection: { path: '/srv/app/current', type: 'dir' },
    currentRemotePath: '/srv/app',
  });
  assert.equal(folderToFolderUpload.remotePath, '/srv/app/current');

  const fileToFolderUpload = mappingRules.buildUploadMappingFromSelection({
    sourceSelection: { path: 'Project/dist/app.js', type: 'file' },
    targetSelection: { path: '/srv/app/current', type: 'dir' },
    currentRemotePath: '/srv/app',
  });
  assert.equal(fileToFolderUpload.remotePath, '/srv/app/current/app.js');

  const fileToFileDownload = mappingRules.buildDownloadMappingFromSelection({
    sourceSelection: { path: '/srv/app/app.js', type: 'file' },
    targetSelection: { path: 'Project/app.js', type: 'file' },
    currentLocalPath: 'Project',
  });
  assert.equal(fileToFileDownload.localPath, 'Project/app.js');

  const folderToFolderDownload = mappingRules.buildDownloadMappingFromSelection({
    sourceSelection: { path: '/srv/app/current', type: 'dir' },
    targetSelection: { path: 'Project/current', type: 'dir' },
    currentLocalPath: 'Project',
  });
  assert.equal(folderToFolderDownload.localPath, 'Project/current');

  const fileToFolderDownload = mappingRules.buildDownloadMappingFromSelection({
    sourceSelection: { path: '/srv/app/app.js', type: 'file' },
    targetSelection: { path: 'Project/current', type: 'dir' },
    currentLocalPath: 'Project',
  });
  assert.equal(fileToFolderDownload.localPath, 'Project/current/app.js');
});

test('downloading a directory replaces the target folder before writing new contents', async () => {
  const { downloadRemoteToLocal } = require(path.join(repoRoot, 'src', 'sftp-utils.js'));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apm-sftp-download-'));
  const targetDir = path.join(tempDir, 'current');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'stale.txt'), 'old', 'utf8');

  const fakeSftp = {
    stat(remote, callback) {
      if (remote === '/remote/current') {
        callback(null, { isDirectory: () => true });
        return;
      }
      callback(null, { isDirectory: () => false });
    },
    readdir(remote, callback) {
      if (remote === '/remote/current') {
        callback(null, [{ filename: 'fresh.txt', attrs: { isDirectory: () => false } }]);
        return;
      }
      callback(new Error(`Unexpected readdir: ${remote}`));
    },
    readFile(remote, callback) {
      if (remote === '/remote/current/fresh.txt') {
        callback(null, Buffer.from('fresh', 'utf8'));
        return;
      }
      callback(new Error(`Unexpected readFile: ${remote}`));
    },
  };

  await new Promise((resolve, reject) => {
    downloadRemoteToLocal(fakeSftp, '/remote/current', targetDir, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  assert.equal(fs.existsSync(path.join(targetDir, 'fresh.txt')), true);
  assert.equal(fs.readFileSync(path.join(targetDir, 'fresh.txt'), 'utf8'), 'fresh');
  assert.equal(fs.existsSync(path.join(targetDir, 'stale.txt')), false);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('document editors expose linked work item tags for source refs', () => {
  const entryEditor = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'structured-entry-list-editor.js'), 'utf8');
  const textEditor = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'structured-text-list-editor.js'), 'utf8');
  const prdWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'prd', 'components', 'prd-workspace.js'), 'utf8');
  const architectureWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'architecture', 'components', 'architecture-workspace.js'), 'utf8');
  const adrWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'adr', 'components', 'adr-workspace.js'), 'utf8');
  const moduleWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'software', 'components', 'module-document-workspace.js'), 'utf8');
  const changelogWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'changelog', 'components', 'changelog-workspace.js'), 'utf8');
  const workItemTags = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'work-item-reference-tags.js'), 'utf8');
  assert.match(entryEditor, /WorkItemReferenceTags/);
  assert.match(textEditor, /WorkItemReferenceTags/);
  assert.match(prdWorkspace, /useProjectWorkItemLookup/);
  assert.match(prdWorkspace, /nonFunctionalItemSourceRefs/);
  assert.match(architectureWorkspace, /DocumentFieldMeta/);
  assert.match(adrWorkspace, /DocumentFieldMeta/);
  assert.match(moduleWorkspace, /DocumentFieldMeta/);
  assert.match(changelogWorkspace, /DocumentFieldMeta/);
  assert.match(workItemTags, /ReadableTextBlock/);
  assert.match(workItemTags, /This read-only view summarizes the linked work item/);
});

test('changelog backfill restores missing source refs onto matching document item ids', () => {
  const project = { id: 'project-1', name: 'Angel PM' };
  const userActionId = 'prd-functional-requirements-user-actions-save-prd';
  const usabilityId = 'prd-non-functional-requirements-usability';
  const editorState = {
    functionalRequirements: {
      userActions: [
        {
          title: 'Save PRD',
          description: 'Persist the current PRD state.',
          stableId: userActionId,
          sourceRefs: [],
        },
      ],
    },
    nonFunctionalRequirements: {
      usability: 'The interface should stay approachable.',
      itemIds: {
        usability: usabilityId,
      },
      itemSourceRefs: {},
    },
  };
  const changelogState = {
    entries: [
      {
        workItemCodes: 'FEAT-010, BUG-002',
        targetDoc: 'PRD',
        targetItemId: userActionId,
      },
      {
        workItemCodes: 'FEAT-011',
        targetDoc: 'PRD',
        targetItemId: usabilityId,
      },
    ],
  };

  const backfilled = workspaceDocs.backfillDocumentEditorStateFromChangelog(project, 'prd', editorState, changelogState);
  assert.deepEqual(backfilled.functionalRequirements.userActions[0].sourceRefs, ['FEAT-010', 'BUG-002']);
  assert.deepEqual(backfilled.nonFunctionalRequirements.itemSourceRefs.usability, ['FEAT-011']);
});

test('generic module detail normalization backfills missing titles from descriptions', () => {
  const project = { id: 'project-1', name: 'Angel PM' };
  const normalized = workspaceDocs.normalizeDocumentEditorStateForStorage(project, 'architecture', {
    techStack: [
      {
        title: '',
        description: 'React and Next.js power the current application shell.',
      },
    ],
  });

  assert.equal(normalized.techStack[0].title, 'React and Next.js power the current application shell.');
});

test('fragment action labels use active fragment counts instead of total history counts', () => {
  const prdWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'prd', 'components', 'prd-workspace.js'), 'utf8');
  const featuresWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'features', 'components', 'features-workspace.js'), 'utf8');
  const databaseSchemaWorkspace = fs.readFileSync(path.join(repoRoot, 'next-app', 'features', 'database-schema', 'components', 'database-schema-workspace.js'), 'utf8');
  assert.match(prdWorkspace, /activeFragmentCount/);
  assert.match(featuresWorkspace, /activeFragmentCount/);
  assert.match(databaseSchemaWorkspace, /activeFragmentCount/);
});

test('fragment browser modal shows revision and superseded metadata', () => {
  const fragmentBrowser = fs.readFileSync(path.join(repoRoot, 'next-app', 'components', 'ui', 'fragment-browser-modal.js'), 'utf8');
  assert.match(fragmentBrowser, /Revision: v/);
  assert.match(fragmentBrowser, /Superseded by/);
  assert.match(fragmentBrowser, /Superseded/);
});

test('AI environment fragments can be discovered and consumed from fragment directories', async () => {
  let result = await request('/api/projects/legacy-project-1/modules', {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'general',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'ai_environment'],
    }),
  });
  assert.equal(result.response.status, 200);
  result = await request('/api/projects');
  assert.equal(result.response.status, 200);
  const project = result.body.find((entry) => entry.id === 'legacy-project-1');
  assert(project);
  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const fragmentPath = path.join(projectFragmentsDir, 'AI_ENVIRONMENT_SUGGESTED_20260402_030000000.md');
  const importedState = {
    ...workspaceDocs.defaultAiEnvironmentEditorState(project),
    customInstructions: 'Imported custom instruction from fragment.',
    requiredBehaviors: [
      {
        id: 'ai-required-imported',
        title: 'Imported behavior',
        description: 'Imported from a directive fragment.',
      },
    ],
  };
  const importedMarkdownBody = workspaceDocs.renderAiEnvironmentEditorStateMarkdown(project, importedState, {
    sharedProfiles: [],
    fragmentsDirectiveProjectId: project.id,
    fragmentsRootDir: path.join(workspaceRoot, 'data', 'projects'),
  });
  const importedMarkdown = workspaceDocs.renderAiEnvironmentMarkdown(
    project,
    importedMarkdownBody,
    'flowchart TD\n  ai["AI Environment"] --> imported["Imported Directive"]',
    importedState
  );
  fs.writeFileSync(fragmentPath, importedMarkdown, 'utf8');

  result = await request(`/api/projects/${project.id}/ai-environment/fragments`);
  assert.equal(result.response.status, 200);
  const discovered = result.body.fragments.find((fragment) => fragment.fileName === path.basename(fragmentPath));
  assert(discovered);
  assert.equal(discovered.sourceScope, 'project');

  result = await request(`/api/projects/${project.id}/ai-environment/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(fragmentPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(fragmentPath), false);
  assert.match(String(result.body.aiEnvironment?.editorState?.customInstructions || ''), /Imported custom instruction from fragment\./);
  assert.equal(
    result.body.aiEnvironment?.editorState?.requiredBehaviors?.some((item) => item.title === 'Imported behavior'),
    true
  );
  assert.equal(
    result.body.aiEnvironment?.editorState?.fragmentHistory?.some((item) => item.code === 'AI_ENVIRONMENT_SUGGESTED_20260402_030000000'),
    true
  );
});

test('generic software document modules can discover and consume fragments', async () => {
  let result = await request('/api/projects/legacy-project-1/modules', {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'functional_spec'],
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request('/api/projects');
  const project = result.body.find((entry) => entry.id === 'legacy-project-1');
  assert(project);

  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const fragmentPath = path.join(projectFragmentsDir, 'FUNCTIONAL_SPEC_FRAGMENT_20260402_040000000.md');
  fs.writeFileSync(fragmentPath, [
    '# Functional Spec Fragment: Authentication Flow',
    '',
    '## Executive Summary',
    '',
    'Define the expected behavior for authentication and session validation.',
    '',
    '## Logical Flow Updates',
    '',
    '- User signs in with local credentials.',
    '- System validates the session before protected actions.',
    '',
    '## Flow Endpoints and Return Points',
    '',
    '- Sign-in request accepted.',
    '',
    '## Open Questions',
    '',
    '- Should stale sessions force re-authentication immediately?',
    '',
  ].join('\n'), 'utf8');

  result = await request(`/api/projects/${project.id}/module-documents/functional_spec/fragments`);
  assert.equal(result.response.status, 200);
  assert(result.body.fragments.some((fragment) => fragment.fileName === path.basename(fragmentPath)));

  result = await request(`/api/projects/${project.id}/module-documents/functional_spec/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(fragmentPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(fragmentPath), false);
  assert.match(String(result.body.document?.editorState?.overview?.summary || ''), /authentication and session validation/i);
  assert.equal(result.body.document?.editorState?.logicalFlows?.length > 0, true);
  assert.match(String(result.body.document?.editorState?.logicalFlows?.[0]?.description || ''), /User signs in/i);
  assert.equal(result.body.document?.editorState?.flowEndpoints?.length > 0, true);
  assert.match(String(result.body.document?.editorState?.openQuestions?.[0]?.description || ''), /re-authentication immediately/i);

  result = await request('/api/roots');
  const changelogProjectFolder = 'ChangelogModuleProject';
  fs.mkdirSync(path.join(result.body.projectsRoot, changelogProjectFolder), { recursive: true });

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Changelog Module Project',
      path: changelogProjectFolder,
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'changelog'],
    }),
  });
  assert.equal(result.response.status, 200);
  const changelogProject = result.body;
  const changelogProjectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(changelogProject);
  const changelogFragmentPath = path.join(changelogProjectFragmentsDir, 'CHANGELOG_FRAGMENT_20260404_010000000.md');
  fs.writeFileSync(changelogFragmentPath, [
    '# Change Log Fragment: PRD update traceability',
    '',
    '## Executive Summary',
    '',
    'Capture the PRD update in a human-readable change trail.',
    '',
    '## Change Details',
    '',
    '- Work Item Codes: FEAT-001, BUG-004',
    '- Change Date: 2026-04-04',
    '- Operation: update',
    '- Target Document: PRD',
    '- Target Section: 10.1',
    '- Target Item ID: prd-future-enhancement-reference',
    '- Fragment Code: PRDFRAG-TRACE-001',
    '',
    'This change records that the PRD section now references planned work through structured feature and bug codes.',
    '',
    '## Open Questions',
    '',
    '- Should the changelog expose clickable work item links in the UI?',
    '',
  ].join('\n'), 'utf8');

  result = await request(`/api/projects/${changelogProject.id}/module-documents/changelog/fragments`);
  assert.equal(result.response.status, 200);
  assert(result.body.fragments.some((fragment) => fragment.fileName === path.basename(changelogFragmentPath)));

  result = await request(`/api/projects/${changelogProject.id}/module-documents/changelog/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(changelogFragmentPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(changelogFragmentPath), false);
  assert.equal(result.body.document?.editorState?.entries?.[0]?.targetItemId, 'prd-future-enhancement-reference');
  assert.equal(result.body.document?.editorState?.entries?.[0]?.targetSectionNumber, '10.1');
  assert.match(String(result.body.document?.editorState?.entries?.[0]?.workItemCodes || ''), /FEAT-001/);
});

test('functional spec module saves structured logical behavior with stable ids', async () => {
  let result = await request('/api/roots');
  const projectFolderName = 'FunctionalSpecStructuredProject';
  fs.mkdirSync(path.join(result.body.projectsRoot, projectFolderName), { recursive: true });

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Functional Spec Structured Project',
      path: projectFolderName,
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'functional_spec'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  result = await request(`/api/projects/${project.id}/module-documents/functional_spec`, {
    method: 'PUT',
    body: JSON.stringify({
      editorState: {
        overview: {
          summary: 'Define how document saves should behave.',
        },
        logicalFlows: [
          {
            title: 'Save managed document state',
            description: 'Validate editor state, persist it, regenerate markdown, and return the updated result.',
          },
        ],
        flowEndpoints: [
          {
            title: 'Open settings panel',
            description: 'Entry point triggered from the main application menu.',
          },
        ],
        userActionsAndSystemResponses: [
          {
            title: 'User clicks Save',
            description: 'System persists the change and shows a saved-state confirmation.',
          },
        ],
        validationRules: [
          {
            title: 'Require writable project path',
            description: 'The flow should stop if the target workspace cannot be written.',
          },
        ],
        interfaceExpectations: [],
        edgeCases: [],
        openQuestions: [
          {
            title: 'Save failures',
            description: 'Should the save flow retry automatically or only offer manual retry?',
          },
        ],
      },
    }),
  });
  assert.equal(result.response.status, 200);
  assert.match(String(result.body.markdown || ''), /## 3\. Logical Workflows/);
  assert.match(String(result.body.markdown || ''), /### 1\.1 Functional Flowchart Action Vocabulary/);
  assert.match(String(result.body.markdown || ''), /Decision: Conditional branch/);
  assert.match(String(result.body.markdown || ''), /Connect Nodes: Create a typed connection/);
  assert.match(String(result.body.markdown || ''), /## 5\. Flow Endpoints and Return Points/);
  assert.equal(Boolean(result.body.editorState?.overview?.stableId), true);
  assert.equal(Boolean(result.body.editorState?.logicalFlows?.[0]?.stableId), true);
  assert.equal(Boolean(result.body.editorState?.flowEndpoints?.[0]?.stableId), true);
  assert.equal(Boolean(result.body.editorState?.userActionsAndSystemResponses?.[0]?.stableId), true);
});

test('functional spec fragments can add visual flow graphs through operations', async () => {
  const project = { id: 'functional-flow-ops-project', name: 'Functional Flow Ops Project' };
  const initialState = workspaceDocs.defaultModuleDocumentEditorState(project, 'functional_spec');
  const operations = workspaceDocs.extractDocumentFragmentOperations(`
<!-- APM:OPERATIONS
[
  {
    "operation": "add",
    "targetSection": "logical-flows",
    "item": {
      "id": "functional-flow-review-fragment",
      "stableId": "functional-spec-logical-flows-review-fragment",
      "title": "Review Fragment",
      "description": "Review a pending fragment before consuming it."
    }
  },
  {
    "operation": "add",
    "targetSection": "flow-visuals",
    "item": {
      "id": "functional-flow-visual-review-fragment",
      "flowId": "functional-flow-review-fragment",
      "flowStableId": "functional-spec-logical-flows-review-fragment",
      "nodes": [
        {
          "id": "functional-node-review-fragment-start",
          "type": "start",
          "label": "Review Requested",
          "description": "The user opens a pending fragment for review."
        },
        {
          "id": "functional-node-review-fragment-return",
          "type": "return",
          "label": "Return Review State",
          "description": "The UI displays the fragment review state."
        }
      ],
      "edges": [
        {
          "id": "functional-edge-review-fragment-start-return",
          "source": "functional-node-review-fragment-start",
          "target": "functional-node-review-fragment-return",
          "type": "returns_to",
          "label": "review state"
        }
      ]
    }
  }
]
-->
  `);
  const nextState = workspaceDocs.applyDocumentFragmentOperations(project, 'functional_spec', initialState, operations);
  const markdown = workspaceDocs.renderModuleDocumentEditorStateMarkdown(project, 'functional_spec', nextState);

  assert.equal(nextState.logicalFlows[0].stableId, 'functional-spec-logical-flows-review-fragment');
  assert.equal(nextState.flowVisuals[0].nodes.length, 2);
  assert.equal(nextState.flowVisuals[0].edges[0].type, 'returns_to');
  assert.match(markdown, /## 4\. Flow Nodes and Connections/);
  assert.match(markdown, /Review Requested/);
  assert.match(markdown, /review state/);
});

test('fragment discovery migrates older managed fragment payloads and detects content-aware files', () => {
  const fragmentDir = fs.mkdtempSync(path.join(tempRoot, 'legacy-fragments-'));
  const fragmentPath = path.join(fragmentDir, 'LEGACY_FUNCTIONAL_FLOW.md');
  fs.writeFileSync(fragmentPath, [
    '# Functional Spec Fragment: Legacy Flow',
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'functional_spec_fragment',
      version: 0,
      id: 'legacy-functional-flow',
      code: 'LEGACY-FUNC-FLOW',
      title: 'Legacy Functional Flow',
      status: 'draft',
    }, null, 2),
    '-->',
    '',
    '## Executive Summary',
    '',
    'Legacy fragment shape without a nested fragment object.',
  ].join('\n'), 'utf8');

  const files = workspaceDocs.listFragmentFilesForModuleInDir(fragmentDir, 'functional_spec', /^FUNCTIONAL_SPEC_FRAGMENT_.*\.md$/i);
  const snapshot = workspaceDocs.readManagedFileSnapshot(fragmentPath);

  assert.deepEqual(files, [fragmentPath]);
  assert.equal(snapshot.managed.version, 1);
  assert.equal(snapshot.managed.fragment.code, 'LEGACY-FUNC-FLOW');
  assert.equal(snapshot.managed.fragment.title, 'Legacy Functional Flow');
  assert.equal(snapshot.managed.fragment.lineageKey, 'LEGACY-FUNC-FLOW');
  assert.equal(typeof workspaceDocs.FRAGMENT_MANAGED_PAYLOAD_MIGRATORS[0], 'function');
});

test('functional spec normalization prevents duplicate derived endpoint anchors', () => {
  const project = { id: 'functional-duplicate-anchor-project', name: 'Functional Duplicate Anchor Project' };
  const editorState = {
    overview: { summary: 'Describe duplicate endpoint cleanup.' },
    logicalFlows: [
      {
        id: 'functional-flow-review-fragment',
        stableId: 'functional-spec-logical-flows-review-fragment',
        title: 'Review Fragment',
        description: 'Review a pending fragment before consuming it.',
      },
    ],
    flowVisuals: [
      {
        flowId: 'functional-flow-review-fragment',
        flowStableId: 'functional-spec-logical-flows-review-fragment',
        nodes: [
          {
            id: 'functional-node-review-fragment-return',
            stableId: 'functional-spec-flow-node-return-review-state',
            type: 'return',
            label: 'Return Review State',
            description: 'The UI displays the fragment review state.',
          },
        ],
        edges: [],
      },
    ],
    flowEndpoints: [
      {
        id: 'derived-endpoint-functional-node-review-fragment-return',
        stableId: 'functional-spec-flow-node-return-review-state',
        title: 'Review Fragment: Return Review State',
        description: 'The UI displays the fragment review state.',
      },
      {
        id: 'derived-endpoint-functional-node-review-fragment-return',
        stableId: 'functional-spec-flow-node-return-review-state-endpoint',
        title: 'Review Fragment: Return Review State',
        description: 'The UI displays the fragment review state.',
      },
      {
        title: 'Review Fragment: Return Review State',
        description: 'Explicit return point for review completion.',
      },
    ],
  };
  const normalized = workspaceDocs.normalizeDocumentEditorStateForStorage(project, 'functional_spec', editorState);
  const markdown = workspaceDocs.renderModuleDocumentEditorStateMarkdown(project, 'functional_spec', normalized);
  const ids = [...markdown.matchAll(/APM-ID:\s*([^\r\n]+)/g)].map((match) => match[1].trim());
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.equal(normalized.flowEndpoints.length, 2);
  assert.equal(normalized.flowEndpoints[0].stableId, 'functional-spec-flow-node-return-review-state-endpoint');
  assert.deepEqual(duplicates, []);
});

test('domain model catalog does not duplicate model update anchors', () => {
  const project = { id: 'domain-model-anchor-project', name: 'Domain Model Anchor Project' };
  const editorState = {
    overview: { summary: 'Describe model anchors.' },
    models: [
      {
        id: 'domain-model-fragment-request',
        stableId: 'domain-models-model-fragment-request',
        name: 'Fragment Request',
        summary: 'A proposed document update.',
        description: 'A proposed document update.',
        modelType: 'command',
        fields: [],
        relationships: [],
        rules: [],
        examples: [],
      },
    ],
    projections: [],
  };
  const markdown = workspaceDocs.renderModuleDocumentEditorStateMarkdown(project, 'domain_models', editorState);
  const ids = [...markdown.matchAll(/APM-ID:\s*([^\r\n]+)/g)].map((match) => match[1].trim());
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.deepEqual(duplicates, []);
  assert.equal(ids.filter((id) => id === 'domain-models-model-fragment-request').length, 1);
});

test('architecture fragments support phase-1 document operations against stable item ids', async () => {
  let result = await request('/api/roots');
  const projectFolderName = 'ArchitectureOpsProject';
  fs.mkdirSync(path.join(result.body.projectsRoot, projectFolderName), { recursive: true });

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Architecture Ops Project',
      path: projectFolderName,
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'architecture'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  const initialArchitectureState = {
    ...workspaceDocs.defaultArchitectureEditorState(project),
    techStack: [
      { title: 'React', description: 'Primary UI library.', sourceRefs: ['OLD-REF'] },
      { title: 'Next.js', description: 'App shell and routing.' },
    ],
    externalDependencies: [
      { title: 'SQLite', description: 'Runtime persistence store.' },
      { title: 'Electron', description: 'Desktop application shell.' },
    ],
    boundaries: [
      { title: 'Desktop Runtime Boundary', description: 'Local desktop shell boundary.' },
    ],
    applicationWorkflows: [],
  };

  result = await request(`/api/projects/${project.id}/architecture`, {
    method: 'PUT',
    body: JSON.stringify({ editorState: initialArchitectureState }),
  });
  assert.equal(result.response.status, 200);
  const architectureState = result.body.editorState;
  const reactId = architectureState.techStack.find((entry) => entry.title === 'React').stableId;
  const nextId = architectureState.techStack.find((entry) => entry.title === 'Next.js').stableId;
  const sqliteId = architectureState.externalDependencies.find((entry) => entry.title === 'SQLite').stableId;
  const boundaryId = architectureState.boundaries[0].stableId;

  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const fragmentPath = path.join(projectFragmentsDir, 'ARCHITECTURE_FRAGMENT_20260404_020000000.md');
  fs.writeFileSync(fragmentPath, [
    '# Architecture Fragment: Phase 1 ops',
    '',
    '<!-- APM:OPERATIONS',
    JSON.stringify([
      {
        operation: 'update',
        targetSection: 'tech-stack',
        targetItemId: nextId,
        description: 'App shell, routing, and managed document surface.',
      },
      {
        operation: 'link',
        targetSection: 'tech-stack',
        targetItemId: nextId,
        sourceRefs: ['FEAT-ARCH-001'],
      },
      {
        operation: 'unlink',
        targetSection: 'tech-stack',
        targetItemId: reactId,
        sourceRefs: ['OLD-REF'],
      },
      {
        operation: 'move',
        fromSection: 'external-dependencies',
        targetSection: 'tech-stack',
        targetItemId: sqliteId,
        afterItemId: nextId,
      },
      {
        operation: 'reorder',
        targetSection: 'tech-stack',
        orderedIds: [nextId, sqliteId, reactId],
      },
      {
        operation: 'remove',
        targetSection: 'boundaries',
        targetItemId: boundaryId,
      },
      {
        operation: 'add',
        targetSection: 'application-workflows',
        item: {
          title: 'Save PRD Workflow',
          description: 'User saves PRD state, backend persists it, and markdown regenerates.',
        },
        sourceRefs: ['FEAT-PRD-001'],
      },
    ], null, 2),
    '-->',
    '',
    '## Executive Summary',
    '',
    'Apply phase 1 structured document operations to Architecture.',
  ].join('\n'), 'utf8');

  result = await request(`/api/projects/${project.id}/architecture/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(fragmentPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(fragmentPath), false);
  const nextArchitecture = result.body.architecture.editorState;
  assert.deepEqual(nextArchitecture.techStack.map((entry) => entry.title), ['Next.js', 'SQLite', 'React']);
  assert.equal(nextArchitecture.techStack[0].description, 'App shell, routing, and managed document surface.');
  assert(nextArchitecture.techStack[0].sourceRefs.includes('FEAT-ARCH-001'));
  assert.equal(nextArchitecture.techStack[2].sourceRefs.includes('OLD-REF'), false);
  assert.equal(nextArchitecture.externalDependencies.some((entry) => entry.title === 'SQLite'), false);
  assert.equal(nextArchitecture.boundaries.length, 0);
  assert.equal(nextArchitecture.applicationWorkflows.some((entry) => entry.title === 'Save PRD Workflow'), true);
});

test('PRD fragments support phase-1 document operations against stable item ids', async () => {
  let result = await request('/api/roots');
  const projectFolderName = 'PrdOpsProject';
  fs.mkdirSync(path.join(result.body.projectsRoot, projectFolderName), { recursive: true });

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'PRD Ops Project',
      path: projectFolderName,
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'prd'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;

  const initialPrdState = {
    executiveSummary: { text: 'Initial PRD summary.' },
    productOverview: {
      productName: project.name,
      vision: 'Track and update product requirements cleanly.',
      targetAudiences: [],
      keyValueProps: [],
    },
    functionalRequirements: {
      workflows: [],
      userActions: [
        {
          title: 'Save PRD',
          description: 'User saves PRD content from the editor.',
        },
      ],
      systemBehaviors: [],
    },
    nonFunctionalRequirements: {},
    technicalArchitecture: [],
    implementationPlan: {
      sequencing: [],
      dependencies: [],
      milestones: [],
    },
    successMetrics: [],
    risksMitigations: [],
    futureEnhancements: [],
    appliedFragments: [],
    conclusion: 'Initial conclusion.',
  };

  result = await request(`/api/projects/${project.id}/prd`, {
    method: 'PUT',
    body: JSON.stringify({ editorState: initialPrdState }),
  });
  assert.equal(result.response.status, 200);
  const prdState = result.body.editorState;
  const savePrdId = prdState.functionalRequirements.userActions[0].stableId;

  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const fragmentPath = path.join(projectFragmentsDir, 'PRD_FRAGMENT_20260404_030000000.md');
  fs.writeFileSync(fragmentPath, [
    '# PRD Fragment: PRDFRAG-OPS-001 - Targeted PRD updates',
    '',
    '<!-- APM:OPERATIONS',
    JSON.stringify([
      {
        operation: 'update',
        targetSection: 'functional-requirements-user-actions',
        targetItemId: savePrdId,
        description: 'User saves PRD content from the editor and receives a clear persisted-state confirmation.',
        sourceRefs: ['FEAT-010'],
      },
      {
        operation: 'link',
        targetSection: 'functional-requirements-user-actions',
        targetItemId: savePrdId,
        sourceRefs: ['BUG-002'],
      },
      {
        operation: 'add',
        targetSection: 'future-enhancements',
        item: {
          title: 'Observability Dashboard',
          description: 'Expose document update health and fragment processing status in a single place.',
        },
        sourceRefs: ['FEAT-011'],
      },
    ], null, 2),
    '-->',
    '',
    '## Executive Summary',
    '',
    'Apply targeted PRD updates by stable id.',
  ].join('\n'), 'utf8');

  result = await request(`/api/projects/${project.id}/prd/fragments`);
  assert.equal(result.response.status, 200);
  const fragment = result.body.fragments.find((entry) => entry.code === 'PRDFRAG-OPS-001');
  assert(fragment);

  result = await request(`/api/projects/${project.id}/prd/fragments/${fragment.id}/integrate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  const nextPrdState = result.body.prd.editorState;
  const savePrdEntry = nextPrdState.functionalRequirements.userActions.find((entry) => entry.stableId === savePrdId);
  assert(savePrdEntry);
  assert.match(String(savePrdEntry.description || ''), /persisted-state confirmation/i);
  assert(savePrdEntry.sourceRefs.includes('FEAT-010'));
  assert(savePrdEntry.sourceRefs.includes('BUG-002'));
  assert.equal(nextPrdState.futureEnhancements.some((entry) => entry.title === 'Observability Dashboard'), true);
});

test('fragment version metadata is preserved across discovery, dedupe, and archived history', async () => {
  const projectFolderName = 'VersionedGenericFragmentProject';
  let result = await request('/api/roots');
  const activeProjectsRoot = result.body.projectsRoot;
  fs.mkdirSync(path.join(activeProjectsRoot, projectFolderName), { recursive: true });

  result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Versioned Generic Fragment Project',
      path: projectFolderName,
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'functional_spec'],
    }),
  });
  assert.equal(result.response.status, 200);
  const project = result.body;
  assert(project);

  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const sharedFragmentsDir = workspaceDocs.ensureSharedFragmentsDir();
  const revisionOnePath = path.join(projectFragmentsDir, 'FUNCTIONAL_SPEC_FRAGMENT_20260403_050000000.md');
  const revisionTwoProjectPath = path.join(projectFragmentsDir, 'FUNCTIONAL_SPEC_FRAGMENT_20260403_060000000.md');
  const revisionTwoSharedDuplicatePath = path.join(sharedFragmentsDir, 'FUNCTIONAL_SPEC_FRAGMENT_20260403_060000000.md');

  const buildManagedFragment = ({ fileHeading, code, revision, lineageKey, supersedesCode = '', supersedesRevision = null, summary }) => [
    `# ${fileHeading}`,
    '',
    '<!-- APM:DATA',
    JSON.stringify({
      docType: 'functional_spec_fragment',
      version: 1,
      fragment: {
        id: `${code}-v${revision}`,
        code,
        title: fileHeading,
        summary,
        revision,
        lineageKey,
        supersedesCode,
        supersedesRevision,
        status: 'draft',
      },
    }, null, 2),
    '-->',
    '',
    '## Executive Summary',
    '',
    summary,
    '',
    '## Logical Flow Updates',
    '',
    `Revision ${revision} working content for ${code}.`,
  ].join('\n');

  fs.writeFileSync(revisionOnePath, buildManagedFragment({
    fileHeading: 'Functional Spec Fragment: Authentication Flow v1',
    code: 'FSFRAG-AUTH-001',
    revision: 1,
    lineageKey: 'FSFRAG-AUTH-001',
    summary: 'First revision of the authentication functional spec fragment.',
  }), 'utf8');

  const revisionTwoMarkdown = buildManagedFragment({
    fileHeading: 'Functional Spec Fragment: Authentication Flow v2',
    code: 'FSFRAG-AUTH-001',
    revision: 2,
    lineageKey: 'FSFRAG-AUTH-001',
    supersedesCode: 'FSFRAG-AUTH-001',
    supersedesRevision: 1,
    summary: 'Second revision of the authentication functional spec fragment.',
  });
  fs.writeFileSync(revisionTwoProjectPath, revisionTwoMarkdown, 'utf8');
  fs.writeFileSync(revisionTwoSharedDuplicatePath, revisionTwoMarkdown, 'utf8');

  result = await request(`/api/projects/${project.id}/module-documents/functional_spec/fragments`);
  assert.equal(result.response.status, 200);
  const authFragments = result.body.fragments.filter((fragment) => fragment.code === 'FSFRAG-AUTH-001');
  assert.equal(authFragments.length, 2);
  const revisionOne = authFragments.find((fragment) => fragment.revision === 1);
  const revisionTwo = authFragments.find((fragment) => fragment.revision === 2);
  assert(revisionOne);
  assert(revisionTwo);
  assert.equal(revisionOne.isSuperseded, true);
  assert.equal(revisionOne.supersededByCode, 'FSFRAG-AUTH-001');
  assert.equal(revisionOne.supersededByRevision, 2);
  assert.equal(revisionTwo.isLatestRevision, true);
  assert.equal(revisionTwo.sourceScope, 'project');

  result = await request(`/api/projects/${project.id}/module-documents/functional_spec/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(revisionTwoProjectPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  const postConsumeFragments = result.body.fragments.filter((fragment) => fragment.code === 'FSFRAG-AUTH-001');
  const archivedRevisionTwo = postConsumeFragments.find((fragment) => fragment.revision === 2 && String(fragment.status) === 'integrated');
  assert(archivedRevisionTwo);
  assert.equal(archivedRevisionTwo.lineageKey, 'FSFRAG-AUTH-001');
  assert.equal(fs.existsSync(revisionTwoProjectPath), false);
});

test('features and bugs can discover and consume module fragments', async () => {
  let result = await request('/api/projects/legacy-project-1/modules', {
    method: 'PUT',
    body: JSON.stringify({
      projectType: 'software',
      enabledModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'bugs', 'prd'],
    }),
  });
  assert.equal(result.response.status, 200);

  result = await request('/api/projects');
  const project = result.body.find((entry) => entry.id === 'legacy-project-1');
  assert(project);

  const projectFragmentsDir = workspaceDocs.ensureProjectFragmentsDir(project);
  const featureFragmentPath = path.join(projectFragmentsDir, 'FEATURES_FRAGMENT_20260402_041000000.md');
  const bugFragmentPath = path.join(projectFragmentsDir, 'BUGS_FRAGMENT_20260402_041500000.md');

  fs.writeFileSync(featureFragmentPath, [
    '# Feature Fragment: Bulk Import Dashboard',
    '',
    '## Executive Summary',
    '',
    'Add a dashboard flow for importing records in batches.',
    '',
    '## Planned Feature Updates',
    '',
    '- Add UI for selecting import source files.',
    '',
  ].join('\n'), 'utf8');

  fs.writeFileSync(bugFragmentPath, [
    '# Bug Fragment: Session timeout error',
    '',
    '## Executive Summary',
    '',
    'Timeout handling is currently inconsistent when a session expires.',
    '',
    '## Expected vs Current Behavior',
    '',
    '### Current Behavior',
    '',
    'Users hit protected actions and only then see a timeout failure.',
    '',
    '### Expected Behavior',
    '',
    'The application should redirect or prompt before the protected action fails.',
    '',
  ].join('\n'), 'utf8');

  result = await request(`/api/projects/${project.id}/features/fragments`);
  assert.equal(result.response.status, 200);
  assert(result.body.fragments.some((fragment) => fragment.fileName === path.basename(featureFragmentPath)));

  result = await request(`/api/projects/${project.id}/features/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(featureFragmentPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(featureFragmentPath), false);
  assert(result.body.features.features.some((feature) => feature.title === 'Bulk Import Dashboard'));

  result = await request(`/api/projects/${project.id}/features/fragments`);
  assert.equal(result.response.status, 200);
  assert(result.body.fragments.some((fragment) => fragment.title === 'Bulk Import Dashboard' && String(fragment.status).toLowerCase() === 'integrated'));

  result = await request(`/api/projects/${project.id}/bugs/fragments`);
  assert.equal(result.response.status, 200);
  assert(result.body.fragments.some((fragment) => fragment.fileName === path.basename(bugFragmentPath)));

  result = await request(`/api/projects/${project.id}/bugs/fragments/consume`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: path.basename(bugFragmentPath),
      sourceScope: 'project',
    }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(fs.existsSync(bugFragmentPath), false);
  const importedBug = result.body.bugs.bugs.find((bug) => bug.title === 'Session timeout error');
  assert(importedBug);
  assert.equal(importedBug.currentBehavior, 'Users hit protected actions and only then see a timeout failure.');
  assert.equal(importedBug.expectedBehavior, 'The application should redirect or prompt before the protected action fails.');
  assert.doesNotMatch(importedBug.currentBehavior, /Bug Fragment:/);

  result = await request(`/api/projects/${project.id}/bugs/fragments`);
  assert.equal(result.response.status, 200);
  assert(result.body.fragments.some((fragment) => fragment.title === 'Session timeout error' && String(fragment.status).toLowerCase() === 'integrated'));
});

test.todo('FR-019 verifies startup and initialization stay within the PRD performance budget');
test.todo('NFR-002 adds automated accessibility coverage for keyboard navigation and screen-reader flows');

