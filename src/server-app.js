const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const { Client } = require('ssh2');
const config = require('./config');
const {
  normalizeLinks,
  defaultMappingGroups,
  normalizeMappingGroups,
  normalizeProjectPrimaryAction,
  normalizeWorkspacePlugins,
  normalizeProjectIntegrations,
  normalizeTaskPayload,
  parseGitRemoteUrl,
} = require('./model-utils');
const {
  normalizeProjectType,
  listProjectTypes,
  buildModuleRegistry,
  moduleKeysToLegacyWorkspacePlugins,
  resolveProjectType,
  resolveEnabledModuleSelection,
} = require('./project-profiles');
const {
  bootstrapStorage,
  updateProjectRoot,
  updateDataDir,
  updateLogsDir,
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
  saveProjectDocument,
  deleteProjectDocument,
  readEntityRelationships,
  saveEntityRelationship,
  deleteEntityRelationship,
  readAppSettings,
  saveAppSettings,
  recordIntegrationEvent,
  readIntegrationEvents,
} = require('./persistence');
const {
  createSshConfig,
  computeDirHashSync,
  uploadLocalToRemote,
  downloadRemoteToLocal,
  runGit,
} = require('./sftp-utils');
const {
  getGitInfo,
  listBranches,
  createBranch,
  checkoutBranch,
  fetchBranch,
  pullBranch,
  pushBranch,
  mergeBranch,
  abortMerge,
  resolveMergeConflicts,
  isGitRepository,
} = require('./git-utils');
const {
  getGitHubSummary,
  createGitHubIssue,
  createGitHubPullRequest,
} = require('./github-client');
const { FileWatcherService } = require('./file-watcher');
const {
  ensureProjectDocsDir,
  ensureProjectWorkspaceDir,
  getProjectDocPath,
  getProjectSoftwareStandardsRegistryPath,
  getTemplateMetadata,
  readProjectManagedDocument,
  computeMd5,
  syncArchivedBugWorkspaceNotes,
  renderRoadmapMermaid,
  renderFeaturesMermaid,
  renderBugsMermaid,
  defaultPrdMarkdown,
  renderRoadmapMarkdown,
  renderFeaturesMarkdown,
  renderBugsMarkdown,
  renderPrdEditorStateMarkdown,
  renderPrdMarkdown,
  extractDocumentFragmentOperations,
  applyDocumentFragmentOperations,
  defaultModuleDocumentEditorState,
  renderModuleDocumentEditorStateMarkdown,
  defaultArchitectureEditorState,
  defaultArchitectureMermaid,
  renderArchitectureEditorStateMarkdown,
  renderArchitectureMarkdown,
  defaultAiEnvironmentEditorState,
  renderAiEnvironmentEditorStateMarkdown,
  renderAiEnvironmentMarkdown,
  defaultDatabaseSchemaEditorState,
  defaultDatabaseSchemaMermaid,
  normalizeDatabaseSchemaSyncTracking,
  renderDatabaseSchemaEditorStateMarkdown,
  renderDatabaseSchemaMarkdown,
  renderDatabaseSchemaDbml,
  renderPrdFragmentMarkdown,
  renderRoadmapFragmentMarkdown,
  syncRoadmapFragmentTemplateForProject,
  writePrdFragmentDocument,
  writeRoadmapFragmentDocument,
  writeDatabaseSchemaDbmlFile,
  readPrdFragmentDocument,
  readRoadmapFragmentDocument,
  writeProjectDocument,
  listProjectDocFiles,
  listProjectFragmentFiles,
  ensureProjectFragmentsDir,
  getFragmentsRootDir,
  ensureSharedFragmentsDir,
  readManagedFileSnapshot,
  parseManagedBlock,
  normalizeDocumentEditorStateForStorage,
} = require('./workspace-docs');
const registerCoreRoutes = require('./server/routes/core-routes');
const registerProjectRoutes = require('./server/routes/project-routes');
const registerWorkItemRoutes = require('./server/routes/work-item-routes');
const registerSoftwareRoutes = require('./server/routes/software-routes');

function createApp() {
  const app = express();
  const fileWatcherService = new FileWatcherService({
    logger: (message) => config.log(message),
  });
  app.locals.fileWatcherService = fileWatcherService;
  const mermaidDistDir = path.dirname(require.resolve('mermaid/dist/mermaid.esm.min.mjs'));
  const frontendDir = config.getFrontendDir();
  const hasFrontendBuild = fs.existsSync(frontendDir) && fs.existsSync(path.join(frontendDir, 'index.html'));
  const setModuleContentType = (res, filePath) => {
    if (String(filePath || '').endsWith('.mjs')) {
      res.type('application/javascript');
    }
  };
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => {
    if (!String(req.path || '').startsWith('/api/')) return next();
    const startedAt = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
      config.logEntry({
        level,
        requestId,
        source: 'server',
        eventType: 'http.request',
        action: `${req.method} ${req.path}`,
        message: `${req.method} ${req.path} -> ${res.statusCode}`,
        details: JSON.stringify({ statusCode: res.statusCode, durationMs }),
      });
    });
    next();
  });
  if (hasFrontendBuild) {
    app.use(express.static(frontendDir));
  }
  app.use(express.static(config.getPublicDir()));
  app.use('/vendor', express.static(mermaidDistDir, { setHeaders: setModuleContentType }));
  app.get('/vendor/mermaid.mjs', (req, res) => {
    setModuleContentType(res, 'mermaid.mjs');
    res.sendFile(require.resolve('mermaid/dist/mermaid.esm.min.mjs'));
  });

  async function buildSettingsResponse() {
    const appSettings = await readAppSettings();
    return {
      projects: {
        projectRoot: config.getProjectsRoot(),
        dataDir: config.getDataDir(),
        logsDir: config.getLogsDir(),
        fragmentsRootDir: path.join(config.getDataDir(), 'Fragments'),
      },
      ui: appSettings.ui,
      ai: appSettings.ai,
      integrations: appSettings.integrations,
    };
  }

  function resolveProjectPath(targetPath) {
    const resolved = config.resolveSafe(targetPath);
    if (!resolved) throw new Error('Path not allowed');
    return resolved;
  }

  function resolveGitPath(targetPath) {
    if (!targetPath) throw new Error('path required');
    const resolved = resolveProjectPath(targetPath);
    if (!isGitRepository(resolved)) throw new Error('Path is not a git repository');
    return resolved;
  }

  function sanitizeProject(project) {
    return project ? { ...project, integrations: normalizeProjectIntegrations(project.integrations) } : project;
  }

  function normalizeRequestedProjectType(body = {}, fallback = 'general') {
    return resolveProjectType(
      body.projectType,
      Array.isArray(body.enabledModules) ? body.enabledModules : [],
      normalizeWorkspacePlugins(body.workspacePlugins),
      fallback
    );
  }

  function ensureWorkspaceProject(project) {
    if (!project) throw new Error('Project not found');
    if (project.type !== 'folder' || !project.absolutePath) {
      config.log(`phase5: workspace project unavailable for project ${project ? project.id : 'unknown'} path=${project ? project.path : ''} absolute=${project ? project.absolutePath : ''}`);
      throw new Error('Phase 5 documents are only available for folder projects right now.');
    }
    ensureProjectDocsDir(project);
    ensureProjectWorkspaceDir(project);
    config.log(`phase5: workspace project ready ${project.id} -> ${project.absolutePath}`);
    return project;
  }

  function compareIsoDate(left, right) {
    const leftTime = Date.parse(left || '');
    const rightTime = Date.parse(right || '');
    if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) return 0;
    if (!Number.isFinite(leftTime)) return -1;
    if (!Number.isFinite(rightTime)) return 1;
    if (leftTime === rightTime) return 0;
    return leftTime > rightTime ? 1 : -1;
  }

  function isFileNewerThanDatabase(storedDocument, fileSnapshot) {
    if (!fileSnapshot) return false;
    if (!storedDocument) return true;
    const knownFileUpdatedAt = storedDocument.fileUpdatedAt || null;
    const knownFileMd5 = storedDocument.fileMd5 || '';
    if (!knownFileUpdatedAt && !knownFileMd5) return compareIsoDate(fileSnapshot.updatedAt, storedDocument.updatedAt) > 0;
    if (compareIsoDate(fileSnapshot.updatedAt, knownFileUpdatedAt) > 0) return true;
    if (compareIsoDate(fileSnapshot.updatedAt, knownFileUpdatedAt) === 0 && knownFileMd5 && fileSnapshot.md5 !== knownFileMd5) return true;
    return false;
  }

  function shouldRewriteDocumentFile(storedDocument, fileSnapshot, dbMd5) {
    if (!fileSnapshot) return true;
    if (fileSnapshot.md5 !== dbMd5) return true;
    if (storedDocument && storedDocument.fileMd5 && storedDocument.fileMd5 !== fileSnapshot.md5) return true;
    return false;
  }

  async function importRoadmapDocumentFromFile(project, fileSnapshot) {
    if (!fileSnapshot || !fileSnapshot.managed || !Array.isArray(fileSnapshot.managed.phases)) {
      throw new Error('ROADMAP.md is missing its managed phase data.');
    }
    const existing = await readRoadmapPhases(project.id);
    const incoming = fileSnapshot.managed.phases
      .filter((phase) => phase && typeof phase === 'object')
      .map((phase, index) => ({
        ...phase,
        projectId: project.id,
        sortOrder: Number.isFinite(Number(phase.sortOrder)) ? Number(phase.sortOrder) : index,
      }));
    const incomingIds = new Set(incoming.map((phase) => phase.id).filter(Boolean));
    for (const phase of existing) {
      if (!incomingIds.has(phase.id)) await deleteRoadmapPhase(project.id, phase.id);
    }
    for (const phase of incoming) {
      await saveRoadmapPhase(phase);
    }
    config.log(`phase5: imported roadmap document into database for project ${project.id} from ${fileSnapshot.docPath}`);
  }

  async function importRoadmapFragmentFromFile(project, existingFragment, fileSnapshot) {
    const managedFragment = fileSnapshot && fileSnapshot.managed && fileSnapshot.managed.fragment;
    if (!managedFragment || typeof managedFragment.markdown !== 'string') {
      throw new Error('ROADMAP fragment file is missing its managed fragment data.');
    }
    await saveRoadmapFragment({
      id: managedFragment.id || (existingFragment && existingFragment.id),
      projectId: project.id,
      sourceFeatureId: managedFragment.sourceFeatureId !== undefined ? managedFragment.sourceFeatureId : (existingFragment && existingFragment.sourceFeatureId),
      sourcePhaseId: managedFragment.sourcePhaseId !== undefined ? managedFragment.sourcePhaseId : (existingFragment && existingFragment.sourcePhaseId),
      code: managedFragment.code || (existingFragment && existingFragment.code),
      title: managedFragment.title || (existingFragment && existingFragment.title) || 'Roadmap fragment',
      markdown: managedFragment.markdown,
      mermaid: managedFragment.mermaid || '',
      payload: managedFragment.payload || null,
      status: managedFragment.status || (existingFragment && existingFragment.status) || 'draft',
      merged: managedFragment.merged !== undefined ? !!managedFragment.merged : !!(existingFragment && existingFragment.merged),
      mergedAt: managedFragment.mergedAt !== undefined ? managedFragment.mergedAt : (existingFragment && existingFragment.mergedAt),
      integratedAt: managedFragment.integratedAt !== undefined ? managedFragment.integratedAt : (existingFragment && existingFragment.integratedAt),
      fileName: managedFragment.fileName || (existingFragment && existingFragment.fileName) || path.basename(fileSnapshot.docPath),
      filePath: fileSnapshot.docPath,
      fileUpdatedAt: fileSnapshot.updatedAt,
      fileMd5: fileSnapshot.md5,
      dbMd5: fileSnapshot.md5,
    });
    config.log(`phase5: imported roadmap fragment for project ${project.id} from ${fileSnapshot.docPath}`);
  }

  function getCanonicalProjectFragmentPath(project, fileName) {
    if (!project || !fileName) return null;
    return path.join(ensureProjectFragmentsDir(project), path.basename(String(fileName)));
  }

  function cleanupImportedFragmentSourceFile(project, sourcePath, canonicalFileName, logLabel) {
    if (!sourcePath || !canonicalFileName) return false;
    const canonicalPath = getCanonicalProjectFragmentPath(project, canonicalFileName);
    if (!canonicalPath) return false;
    const resolvedSourcePath = path.resolve(sourcePath);
    const resolvedCanonicalPath = path.resolve(canonicalPath);
    if (resolvedSourcePath === resolvedCanonicalPath) return false;
    return tryDeleteFile(sourcePath, logLabel);
  }

  async function importFeaturesDocumentFromFile(project, fileSnapshot) {
    if (!fileSnapshot || !fileSnapshot.managed || !Array.isArray(fileSnapshot.managed.features)) {
      throw new Error('FEATURES.md is missing its managed feature data.');
    }
    const existing = await readFeatureItems(project.id, { includeArchived: true });
    const incoming = fileSnapshot.managed.features
      .filter((feature) => feature && typeof feature === 'object')
      .map((feature) => ({
        ...feature,
        projectId: project.id,
      }));
    const incomingIds = new Set(incoming.map((feature) => feature.id).filter(Boolean));
    for (const feature of existing) {
      if (!incomingIds.has(feature.id)) await deleteFeatureItem(project.id, feature.id);
    }
    for (const feature of incoming) {
      await saveFeatureItem(feature);
    }
    config.log(`phase5: imported features document into database for project ${project.id} from ${fileSnapshot.docPath}`);
  }

  async function importBugsDocumentFromFile(project, fileSnapshot) {
    if (!fileSnapshot || !fileSnapshot.managed || !Array.isArray(fileSnapshot.managed.bugs)) {
      throw new Error('BUGS.md is missing its managed bug data.');
    }
    const existing = await readBugItems(project.id, { includeArchived: true });
    const incoming = fileSnapshot.managed.bugs
      .filter((bug) => bug && typeof bug === 'object')
      .map((bug) => ({
        ...bug,
        projectId: project.id,
      }));
    const incomingIds = new Set(incoming.map((bug) => bug.id).filter(Boolean));
    for (const bug of existing) {
      if (!incomingIds.has(bug.id)) await deleteBugItem(project.id, bug.id);
    }
    for (const bug of incoming) {
      await saveBugItem(bug);
    }
    config.log(`phase5: imported bugs document into database for project ${project.id} from ${fileSnapshot.docPath}`);
  }

  async function importPrdDocumentFromFile(project, fileSnapshot) {
    if (!fileSnapshot || !fileSnapshot.managed || typeof fileSnapshot.managed.markdown !== 'string') {
      throw new Error('PRD.md is missing its managed PRD data.');
    }
    await saveProjectDocument(project.id, 'prd', {
      markdown: fileSnapshot.managed.markdown,
      mermaid: fileSnapshot.managed.mermaid || 'flowchart TD\n  product["Product"] --> value["Value"]',
      editorState: fileSnapshot.managed.editorState || null,
      filePath: fileSnapshot.docPath,
      fileUpdatedAt: fileSnapshot.updatedAt,
      fileMd5: fileSnapshot.md5,
      dbMd5: fileSnapshot.md5,
    });
    config.log(`phase5: imported prd document into database for project ${project.id} from ${fileSnapshot.docPath}`);
  }

  async function importStructuredModuleDocumentFromFile(project, fileSnapshot, docType, defaultMermaidFactory) {
    if (!fileSnapshot || !fileSnapshot.managed || typeof fileSnapshot.managed.markdown !== 'string') {
      throw new Error(`${String(docType).toUpperCase()}.md is missing its managed document data.`);
    }
    await saveProjectDocument(project.id, docType, {
      markdown: fileSnapshot.managed.markdown,
      mermaid: fileSnapshot.managed.mermaid || defaultMermaidFactory(project),
      editorState: fileSnapshot.managed.editorState || null,
      filePath: fileSnapshot.docPath,
      fileUpdatedAt: fileSnapshot.updatedAt,
      fileMd5: fileSnapshot.md5,
      dbMd5: fileSnapshot.md5,
    });
    config.log(`phase5: imported ${docType} document into database for project ${project.id} from ${fileSnapshot.docPath}`);
  }

  async function maybeImportDocumentFile(project, docType, importer) {
    const storedDocument = await readProjectDocument(project.id, docType);
    const fileSnapshot = readProjectManagedDocument(project, docType);
    if (!fileSnapshot) return { storedDocument, fileSnapshot: null };
    if (!fileSnapshot.managed) {
      config.log(`phase5: ${docType} file exists but managed block is missing or invalid at ${fileSnapshot.docPath}`);
      return { storedDocument, fileSnapshot };
    }
    if (isFileNewerThanDatabase(storedDocument, fileSnapshot)) {
      await importer(project, fileSnapshot);
    }
    return {
      storedDocument: await readProjectDocument(project.id, docType),
      fileSnapshot: readProjectManagedDocument(project, docType),
    };
  }

  async function discoverRoadmapFragmentsFromDisk(project) {
    const fragmentPaths = [
      ...listProjectFragmentFiles(project, /^ROADMAP_FRAGMENT_.*\.md$/i),
      ...listProjectDocFiles(project, /^ROADMAP_FRAGMENT_.*\.md$/i),
    ];
    for (const filePath of fragmentPaths) {
      const snapshot = readManagedFileSnapshot(filePath);
      if (!snapshot || !snapshot.managed || snapshot.managed.docType !== 'roadmap_fragment') continue;
      const fragmentId = snapshot.managed.fragment && snapshot.managed.fragment.id;
      const existing = fragmentId ? await getRoadmapFragmentById(project.id, fragmentId) : null;
      const storedDocument = existing ? {
        updatedAt: existing.updatedAt,
        fileUpdatedAt: existing.fileUpdatedAt,
        fileMd5: existing.fileMd5,
      } : null;
      if (!existing || isFileNewerThanDatabase(storedDocument, snapshot)) {
        await importRoadmapFragmentFromFile(project, existing, snapshot);
        const managedFragment = snapshot.managed && snapshot.managed.fragment;
        cleanupImportedFragmentSourceFile(
          project,
          snapshot.docPath,
          (managedFragment && managedFragment.fileName) || path.basename(snapshot.docPath),
          `phase5: imported roadmap fragment cleanup ${project.id}`
        );
      }
    }
  }

  async function finalizeDocumentSync(project, docType, finalFileMarkdown, dbDocumentInput) {
    let storedDocument = await readProjectDocument(project.id, docType);
    let fileSnapshot = readProjectManagedDocument(project, docType);
    const dbMd5 = computeMd5(finalFileMarkdown);

    if (shouldRewriteDocumentFile(storedDocument, fileSnapshot, dbMd5)) {
      fileSnapshot = writeProjectDocument(project, docType, finalFileMarkdown);
    }

    storedDocument = await saveProjectDocument(project.id, docType, {
      ...dbDocumentInput,
      filePath: fileSnapshot ? fileSnapshot.docPath : (storedDocument && storedDocument.filePath) || getProjectDocPath(project, docType),
      fileUpdatedAt: fileSnapshot ? fileSnapshot.updatedAt : (storedDocument && storedDocument.fileUpdatedAt) || null,
      fileMd5: fileSnapshot ? fileSnapshot.md5 : (storedDocument && storedDocument.fileMd5) || '',
      dbMd5,
    });

    return { storedDocument, fileSnapshot, dbMd5 };
  }

  function buildDefaultRoadmapFragmentPayload(project) {
    return {
      summary: `Proposed roadmap updates for ${project.name}.`,
      phaseChanges: [],
      featureAssignments: [],
      taskAssignments: [],
    };
  }

  function renderDefaultRoadmapFragmentBody(project, payload = {}) {
    const phaseChanges = Array.isArray(payload.phaseChanges) ? payload.phaseChanges : [];
    const featureAssignments = Array.isArray(payload.featureAssignments) ? payload.featureAssignments : [];
    const taskAssignments = Array.isArray(payload.taskAssignments) ? payload.taskAssignments : [];
    return [
      '## Executive Summary',
      '',
      payload.summary || `Proposed roadmap updates for ${project.name}.`,
      '',
      '## Proposed Phase Changes',
      '',
      ...(phaseChanges.length
        ? phaseChanges.flatMap((phase) => [
            `### ${phase.code || 'NEW_PHASE'}: ${phase.name || 'New Phase'}`,
            '',
            `- Goal: ${phase.goal || 'Add a goal for this phase.'}`,
            `- Status: ${phase.status || 'planned'}`,
            `- Target Date: ${phase.targetDate || 'TBD'}`,
            '',
            phase.summary || 'Describe what this phase should contain.',
            '',
          ])
        : ['- No phase changes proposed yet.', '']),
      '## Proposed Feature Assignments',
      '',
      ...(featureAssignments.length
        ? featureAssignments.map((assignment) => `- Feature ${assignment.featureId || 'FEAT-XXX'} -> ${assignment.roadmapPhaseCode || assignment.roadmapPhaseId || 'Unassigned'}${assignment.note ? ` (${assignment.note})` : ''}`)
        : ['- No feature moves proposed yet.']),
      '',
      '## Proposed Task Assignments',
      '',
      ...(taskAssignments.length
        ? taskAssignments.map((assignment) => `- Task ${assignment.taskId || 'task-id'} -> ${assignment.roadmapPhaseCode || assignment.roadmapPhaseId || 'Unassigned'}${assignment.note ? ` (${assignment.note})` : ''}`)
        : ['- No task moves proposed yet.']),
      '',
      '## Integration Guidance',
      '',
      '- AI agents should update this roadmap fragment instead of editing ROADMAP.md directly.',
      `- Store roadmap fragment files under data/Fragments/${project.id}/.`,
      '- The roadmap module consumes this fragment and applies the approved changes to the application database.',
      '- Prefer stable feature IDs, task IDs, and existing phase IDs when possible.',
    ].join('\n');
  }

  function renderDefaultPrdFragmentBody(feature, context = {}) {
    const phaseLabel = context.phase ? `${context.phase.code}: ${context.phase.name}` : 'Unassigned';
    const taskLabel = context.task ? context.task.title : 'None';
    return [
      '## Executive Summary',
      '',
      `This fragment captures the PRD changes needed for ${feature.code}: ${feature.title}.`,
      '',
      '## Functional Requirements',
      '',
      `- Source Feature: ${feature.code}: ${feature.title}`,
      `- Status: ${feature.status || 'planned'}`,
      `- Roadmap Phase: ${phaseLabel}`,
      `- Linked Task: ${taskLabel}`,
      `- Feature Summary: ${feature.summary || 'Add implementation details for this feature.'}`,
      '',
      '## User Experience Requirements',
      '',
      '- Describe the user-facing workflow, edge cases, and interface expectations introduced by this feature.',
      '',
      '## Data and Integration Notes',
      '',
      '- Describe any SQLite schema, generated markdown, plugin, integration, or API updates required by this feature.',
      '',
      '## Acceptance Criteria',
      '',
      '- Define the outcomes that must exist in the main PRD once this fragment is merged.',
      '',
      '## Merge Guidance',
      '',
      '- AI agents should update this fragment instead of editing PRD.md directly.',
      `- Store PRD fragment files under data/Fragments/${feature.projectId || 'project'}/.`,
      '- The PRD module consumes this fragment and merges it into the main PRD when approved.',
      '',
    ].join('\n');
  }

  function renderDefaultPrdFragmentMermaid(feature) {
    return [
      'flowchart TD',
      `  feature_${String(feature.code || feature.id).replace(/[^A-Za-z0-9]+/g, '_')}["${String(feature.code || 'FEATURE').replace(/"/g, '\\"')}: ${String(feature.title || '').replace(/"/g, '\\"')}"]`,
      '  feature_update["PRD Fragment"]',
      '  feature_update --> prd["PRD.md"]',
      `  feature_${String(feature.code || feature.id).replace(/[^A-Za-z0-9]+/g, '_')} --> feature_update`,
      ].join('\n');
    }

  function buildDefaultPrdEditorState(project) {
    const now = new Date().toISOString();
    return {
      executiveSummary: {
        text: '',
        versionDate: now,
      },
      productOverview: {
        productName: project.name,
        vision: '',
        targetAudiences: [],
        keyValueProps: [],
        versionDate: now,
      },
      functionalRequirements: {
        workflows: [],
        userActions: [],
        systemBehaviors: [],
        versionDate: now,
      },
      nonFunctionalRequirements: {
        usability: '',
        reliability: '',
        accessibility: '',
        security: '',
        performance: '',
        versionDate: now,
      },
      technicalArchitecture: [],
      implementationPlan: {
        sequencing: [],
        dependencies: [],
        milestones: [],
        versionDate: now,
      },
      successMetrics: [],
      risksMitigations: [],
      futureEnhancements: [],
      appliedFragments: [],
      conclusion: '',
    };
  }

  function normalizeStructuredTitleValue(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isLikelyDerivedStructuredTitle(title, description) {
    const rawTitle = String(title || '').trim();
    const rawDescription = String(description || '').trim();
    if (!rawTitle || !rawDescription) return false;
    const normalizedTitle = normalizeStructuredTitleValue(rawTitle);
    const normalizedDescription = normalizeStructuredTitleValue(rawDescription);
    if (!normalizedTitle || !normalizedDescription || !normalizedDescription.startsWith(normalizedTitle)) return false;
    const titleWordCount = normalizedTitle.split(' ').filter(Boolean).length;
    return rawTitle.endsWith('.')
      || rawTitle.endsWith('!')
      || rawTitle.endsWith('?')
      || rawTitle.length >= 80
      || titleWordCount >= 8;
  }

  function sanitizePrdDetailEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      if (!isLikelyDerivedStructuredTitle(entry.title, entry.description)) return entry;
      return {
        ...entry,
        title: '',
      };
    });
  }

  function sanitizePrdEditorStateTitles(editorState) {
    const base = editorState && typeof editorState === 'object'
      ? editorState
      : buildDefaultPrdEditorState({ name: 'Product' });
    return {
      ...base,
      functionalRequirements: {
        ...(base.functionalRequirements || {}),
        workflows: sanitizePrdDetailEntries(base.functionalRequirements?.workflows),
        userActions: sanitizePrdDetailEntries(base.functionalRequirements?.userActions),
        systemBehaviors: sanitizePrdDetailEntries(base.functionalRequirements?.systemBehaviors),
      },
      technicalArchitecture: sanitizePrdDetailEntries(base.technicalArchitecture),
      implementationPlan: {
        ...(base.implementationPlan || {}),
        sequencing: sanitizePrdDetailEntries(base.implementationPlan?.sequencing),
        dependencies: sanitizePrdDetailEntries(base.implementationPlan?.dependencies),
        milestones: sanitizePrdDetailEntries(base.implementationPlan?.milestones),
      },
      successMetrics: sanitizePrdDetailEntries(base.successMetrics),
      futureEnhancements: sanitizePrdDetailEntries(base.futureEnhancements),
    };
  }

  function normalizePrdFragmentHeading(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function summarizePrdFragmentMarkdown(markdown, fallback = '') {
    const lines = String(markdown || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^#{1,6}\s+/.test(line))
      .filter((line) => !/^```/.test(line))
      .filter((line) => !/^[-*]\s+(Source Feature|Status|Roadmap Phase|Linked Task|Feature Summary|Mitigation):/i.test(line))
      .filter((line) => !/^(AI agents should|Store PRD fragment files under|The PRD module consumes|Integrate this fragment through)/i.test(line));
    return lines[0] || fallback || 'No fragment summary.';
  }

  function isImplementedFeatureState(feature) {
    if (!feature || typeof feature !== 'object') return false;
    if (feature.archived) return true;
    const normalizedStatus = String(feature.status || '').trim().toLowerCase();
    return ['done', 'completed', 'implemented', 'archived'].includes(normalizedStatus);
  }

  function getFeatureAuditStatus(feature) {
    if (!feature || typeof feature !== 'object') return '';
    return isImplementedFeatureState(feature) ? 'implemented' : (feature.status || 'planned');
  }

  function buildAppliedPrdFragmentEntry(fragment, status, feature = null) {
    const timestamp = new Date().toISOString();
    return {
      fragmentId: fragment.id,
      title: fragment.title,
      sourceFeatureId: fragment.featureId || null,
      sourceFeatureStatus: getFeatureAuditStatus(feature),
      status,
      integratedAt: status === 'integrated' ? timestamp : null,
      versionDate: timestamp,
      summary: summarizePrdFragmentMarkdown(fragment.markdown, fragment.title),
      notes: '',
      fileName: fragment.fileName || fragment.mergedFileName || null,
    };
  }

  function trimPrdFragmentLines(lines) {
    const nextLines = Array.isArray(lines) ? lines.slice() : [];
    while (nextLines.length && !String(nextLines[0] || '').trim()) nextLines.shift();
    while (nextLines.length && !String(nextLines[nextLines.length - 1] || '').trim()) nextLines.pop();
    return nextLines;
  }

  function collectPrdFragmentSections(markdown) {
    const sections = [];
    const stack = [];
    let currentSection = null;

    function flushCurrent() {
      if (!currentSection) return;
      sections.push({
        titles: currentSection.titles.slice(),
        normalizedTitles: currentSection.normalizedTitles.slice(),
        lines: trimPrdFragmentLines(currentSection.lines),
      });
      currentSection = null;
    }

    for (const rawLine of String(markdown || '').split(/\r?\n/)) {
      const headingMatch = rawLine.match(/^(#{2,6})\s+(.+?)\s*$/);
      if (headingMatch) {
        flushCurrent();
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        stack.push({
          level,
          title,
          normalizedTitle: normalizePrdFragmentHeading(title),
        });
        currentSection = {
          titles: stack.map((item) => item.title),
          normalizedTitles: stack.map((item) => item.normalizedTitle),
          lines: [],
        };
        continue;
      }

      if (currentSection) currentSection.lines.push(rawLine);
    }

    flushCurrent();
    return sections;
  }

  function findPrdFragmentSection(sections, candidatePaths = []) {
    const normalizedCandidates = candidatePaths.map((pathParts) => pathParts.map(normalizePrdFragmentHeading).join(' > '));
    return sections.find((section) => normalizedCandidates.includes(section.normalizedTitles.join(' > '))) || null;
  }

  function listPrdFragmentChildSections(sections, parentPath) {
    const normalizedParent = parentPath.map(normalizePrdFragmentHeading);
    return sections.filter((section) => (
      section.normalizedTitles.length === normalizedParent.length + 1
      && normalizedParent.every((part, index) => section.normalizedTitles[index] === part)
    ));
  }

  function extractPrdFragmentBulletItems(lines) {
    const items = [];
    let current = null;
    for (const line of Array.isArray(lines) ? lines : []) {
      const bulletMatch = String(line || '').match(/^\s*(?:[-*]|\d+\.)\s+(.+?)\s*$/);
      if (bulletMatch) {
        if (current) items.push(current);
        current = bulletMatch[1].trim();
        continue;
      }

      const trimmed = String(line || '').trim();
      if (current && trimmed) {
        current = `${current} ${trimmed}`.trim();
        continue;
      }

      if (current && !trimmed) {
        items.push(current);
        current = null;
      }
    }

    if (current) items.push(current);
    return items.filter(Boolean);
  }

  function extractPrdFragmentParagraphs(lines) {
    const text = trimPrdFragmentLines(lines).join('\n').trim();
    if (!text) return [];
    return text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean);
  }

  function createPrdFragmentDetailEntry(text, versionDate) {
    const normalized = String(text || '').trim();
    if (!normalized) return null;
    const titleMatch = normalized.match(/^([^:]{1,120}):\s+(.+)$/);
    if (titleMatch) {
      return {
        title: titleMatch[1].trim(),
        description: titleMatch[2].trim(),
        versionDate,
      };
    }
    if (normalized.length <= 90) {
      return {
        title: normalized,
        description: '',
        versionDate,
      };
    }
    return {
      title: '',
      description: normalized,
      versionDate,
    };
  }

  function createPrdFragmentTextEntries(lines, versionDate) {
    const items = extractPrdFragmentBulletItems(lines);
    if (items.length) {
      return items.map((text) => ({ text, versionDate }));
    }
    return extractPrdFragmentParagraphs(lines).map((text) => ({ text, versionDate }));
  }

  function createPrdFragmentDetailEntries(lines, versionDate, sourceRefs = []) {
    const items = extractPrdFragmentBulletItems(lines);
    const sourceItems = items.length ? items : extractPrdFragmentParagraphs(lines);
    return sourceItems
      .map((item) => {
        const entry = createPrdFragmentDetailEntry(item, versionDate);
        if (!entry) return null;
        return {
          ...entry,
          sourceRefs: Array.isArray(sourceRefs) ? sourceRefs.slice() : [],
        };
      })
      .filter(Boolean);
  }

  function applyStructuredPrdFragmentState(editorState, fragment, feature = null) {
      const state = editorState && typeof editorState === 'object'
        ? JSON.parse(JSON.stringify(editorState))
        : buildDefaultPrdEditorState({ name: 'Product' });
      const versionDate = new Date().toISOString();
      const sourceRefs = feature && feature.code ? [feature.code] : [];
      const operations = extractDocumentFragmentOperations(fragment && fragment.markdown, fragment, {
        versionDate,
        sourceRefs,
      });
      if (operations.length) {
        return applyDocumentFragmentOperations(null, 'prd', state, operations, {
          defaultVersionDate: versionDate,
          defaultSourceRefs: sourceRefs,
        });
      }
      const sections = collectPrdFragmentSections(fragment && fragment.markdown);

    const executiveSummarySection = findPrdFragmentSection(sections, [['Executive Summary']]);
    const productVisionSection = findPrdFragmentSection(sections, [['Product Overview', 'Product Vision']]);
    const targetAudiencesSection = findPrdFragmentSection(sections, [['Product Overview', 'Target Audiences'], ['Product Overview', 'Target Audience']]);
    const keyValueSection = findPrdFragmentSection(sections, [['Product Overview', 'Key Value Propositions']]);
    const workflowsSection = findPrdFragmentSection(sections, [['Functional Requirements', 'Current Application Workflows'], ['Functional Requirements', 'Workflows']]);
    const userActionsSection = findPrdFragmentSection(sections, [['Functional Requirements', 'User Actions']]);
    const systemBehaviorsSection = findPrdFragmentSection(sections, [['Functional Requirements', 'System Behaviors']]);
    const usabilitySection = findPrdFragmentSection(sections, [['Non-Functional Requirements', 'Usability']]);
    const reliabilitySection = findPrdFragmentSection(sections, [['Non-Functional Requirements', 'Reliability']]);
    const accessibilitySection = findPrdFragmentSection(sections, [['Non-Functional Requirements', 'Accessibility']]);
    const securitySection = findPrdFragmentSection(sections, [['Non-Functional Requirements', 'Security']]);
    const performanceSection = findPrdFragmentSection(sections, [['Non-Functional Requirements', 'Performance']]);
    const technicalShapeSection = findPrdFragmentSection(sections, [['Technical Shape'], ['Technical Architecture']]);
    const sequencingSection = findPrdFragmentSection(sections, [['Implementation Plan', 'Sequencing']]);
    const dependenciesSection = findPrdFragmentSection(sections, [['Implementation Plan', 'Dependencies']]);
    const milestonesSection = findPrdFragmentSection(sections, [['Implementation Plan', 'Milestones']]);
    const successMetricsSection = findPrdFragmentSection(sections, [['Success Metrics']]);
    const risksSection = findPrdFragmentSection(sections, [['Risks and Mitigations']]);

    const productOverviewChanged = !!(productVisionSection || targetAudiencesSection || keyValueSection);
    const functionalChanged = !!(workflowsSection || userActionsSection || systemBehaviorsSection);
    const nonFunctionalChanged = !!(usabilitySection || reliabilitySection || accessibilitySection || securitySection || performanceSection);
    const implementationChanged = !!(sequencingSection || dependenciesSection || milestonesSection);
    const technicalChanged = !!technicalShapeSection;
    const successChanged = !!successMetricsSection;
    const riskChanged = !!risksSection;
    const hasStructuredUpdates = productOverviewChanged || functionalChanged || nonFunctionalChanged || implementationChanged || technicalChanged || successChanged || riskChanged;

    if (hasStructuredUpdates && executiveSummarySection) {
      const summaryText = extractPrdFragmentParagraphs(executiveSummarySection.lines).join('\n\n').trim();
      if (summaryText) {
        state.executiveSummary = {
          ...(state.executiveSummary || {}),
          text: summaryText,
          versionDate,
        };
      }
    }

    if (productOverviewChanged) {
      const nextProductOverview = {
        ...(state.productOverview || {}),
        versionDate,
      };
      if (productVisionSection) {
        const vision = extractPrdFragmentParagraphs(productVisionSection.lines).join('\n\n').trim();
        if (vision) nextProductOverview.vision = vision;
      }
      if (targetAudiencesSection) {
        const targetAudiences = createPrdFragmentTextEntries(targetAudiencesSection.lines, versionDate);
        if (targetAudiences.length) nextProductOverview.targetAudiences = targetAudiences;
      }
      if (keyValueSection) {
        const keyValueProps = createPrdFragmentTextEntries(keyValueSection.lines, versionDate);
        if (keyValueProps.length) nextProductOverview.keyValueProps = keyValueProps;
      }
      state.productOverview = nextProductOverview;
    }

    if (functionalChanged) {
        const nextFunctionalRequirements = {
          ...(state.functionalRequirements || {}),
          versionDate,
        };
        if (workflowsSection) {
          const workflows = createPrdFragmentDetailEntries(workflowsSection.lines, versionDate, sourceRefs);
          if (workflows.length) nextFunctionalRequirements.workflows = workflows;
        }
        if (userActionsSection) {
          const userActions = createPrdFragmentDetailEntries(userActionsSection.lines, versionDate, sourceRefs);
          if (userActions.length) nextFunctionalRequirements.userActions = userActions;
        }
        if (systemBehaviorsSection) {
          const systemBehaviors = createPrdFragmentDetailEntries(systemBehaviorsSection.lines, versionDate, sourceRefs);
          if (systemBehaviors.length) nextFunctionalRequirements.systemBehaviors = systemBehaviors;
        }
        state.functionalRequirements = nextFunctionalRequirements;
      }

    if (nonFunctionalChanged) {
      const nextNonFunctionalRequirements = {
        ...(state.nonFunctionalRequirements || {}),
        versionDate,
      };
      if (usabilitySection) nextNonFunctionalRequirements.usability = extractPrdFragmentParagraphs(usabilitySection.lines).join('\n\n').trim();
      if (reliabilitySection) nextNonFunctionalRequirements.reliability = extractPrdFragmentParagraphs(reliabilitySection.lines).join('\n\n').trim();
      if (accessibilitySection) nextNonFunctionalRequirements.accessibility = extractPrdFragmentParagraphs(accessibilitySection.lines).join('\n\n').trim();
      if (securitySection) nextNonFunctionalRequirements.security = extractPrdFragmentParagraphs(securitySection.lines).join('\n\n').trim();
      if (performanceSection) nextNonFunctionalRequirements.performance = extractPrdFragmentParagraphs(performanceSection.lines).join('\n\n').trim();
      state.nonFunctionalRequirements = nextNonFunctionalRequirements;
    }

      if (technicalChanged) {
        const technicalArchitecture = createPrdFragmentDetailEntries(technicalShapeSection.lines, versionDate, sourceRefs);
        if (technicalArchitecture.length) state.technicalArchitecture = technicalArchitecture;
      }

    if (implementationChanged) {
        const nextImplementationPlan = {
          ...(state.implementationPlan || {}),
          versionDate,
        };
        if (sequencingSection) {
          const sequencing = createPrdFragmentDetailEntries(sequencingSection.lines, versionDate, sourceRefs);
          if (sequencing.length) nextImplementationPlan.sequencing = sequencing;
        }
        if (dependenciesSection) {
          const dependencies = createPrdFragmentDetailEntries(dependenciesSection.lines, versionDate, sourceRefs);
          if (dependencies.length) nextImplementationPlan.dependencies = dependencies;
        }
        if (milestonesSection) {
          const milestones = createPrdFragmentDetailEntries(milestonesSection.lines, versionDate, sourceRefs);
          if (milestones.length) nextImplementationPlan.milestones = milestones;
        }
        state.implementationPlan = nextImplementationPlan;
      }

      if (successChanged) {
        const successMetrics = createPrdFragmentDetailEntries(successMetricsSection.lines, versionDate, sourceRefs);
        if (successMetrics.length) state.successMetrics = successMetrics;
      }

    if (riskChanged) {
      const riskSections = listPrdFragmentChildSections(sections, ['Risks and Mitigations']);
      const risksMitigations = riskSections.length
        ? riskSections.map((section) => {
            const bulletItems = extractPrdFragmentBulletItems(section.lines);
            const mitigationItem = bulletItems.find((item) => /^Mitigation:/i.test(item));
            const mitigation = mitigationItem
              ? mitigationItem.replace(/^Mitigation:\s*/i, '').trim()
              : extractPrdFragmentParagraphs(section.lines).join('\n\n').trim();
              return {
                risk: section.titles[section.titles.length - 1],
                mitigation,
                versionDate,
                sourceRefs,
              };
            }).filter((entry) => entry.risk || entry.mitigation)
          : createPrdFragmentDetailEntries(risksSection.lines, versionDate, sourceRefs)
            .map((entry) => ({
              risk: entry.title,
              mitigation: entry.description,
              versionDate,
              sourceRefs,
            }))
            .filter((entry) => entry.risk || entry.mitigation);

      if (risksMitigations.length) state.risksMitigations = risksMitigations;
    }

    return state;
  }

    function integratePrdFragmentState(editorState, fragment, feature = null) {
      const state = applyStructuredPrdFragmentState(editorState, fragment, feature);
    const nextApplied = Array.isArray(state.appliedFragments) ? state.appliedFragments.slice() : [];
    const existingIndex = nextApplied.findIndex((item) => item && item.fragmentId === fragment.id);
    const nextEntry = buildAppliedPrdFragmentEntry(fragment, 'integrated', feature);
    if (existingIndex >= 0) nextApplied[existingIndex] = { ...nextApplied[existingIndex], ...nextEntry };
    else nextApplied.push(nextEntry);
    state.appliedFragments = nextApplied;
    state.futureEnhancements = Array.isArray(state.futureEnhancements) ? state.futureEnhancements.slice() : [];
    if (feature) {
      state.futureEnhancements = state.futureEnhancements.filter((item) => item && item.featureId !== feature.id);
        if (!isImplementedFeatureState(feature)) {
          state.futureEnhancements.push({
            id: `future-${feature.id}`,
            title: `${feature.code}: ${feature.title}`,
            description: feature.summary || 'Imported from merged PRD fragment.',
            featureId: feature.id,
            status: 'planned',
            versionDate: new Date().toISOString(),
            sourceRefs: feature.code ? [feature.code] : [],
          });
        }
    }
    return state;
  }

    function markPrdFragmentMergedState(editorState, fragment, feature = null) {
      const state = applyStructuredPrdFragmentState(editorState, fragment, feature);
    const nextApplied = Array.isArray(state.appliedFragments) ? state.appliedFragments.slice() : [];
    const existingIndex = nextApplied.findIndex((item) => item && item.fragmentId === fragment.id);
    const nextEntry = buildAppliedPrdFragmentEntry(fragment, 'merged', feature);
    if (existingIndex >= 0) nextApplied[existingIndex] = { ...nextApplied[existingIndex], ...nextEntry };
    else nextApplied.push(nextEntry);
    state.appliedFragments = nextApplied;
    if (feature && !isImplementedFeatureState(feature)) {
      state.futureEnhancements = Array.isArray(state.futureEnhancements) ? state.futureEnhancements.slice() : [];
        if (!state.futureEnhancements.some((item) => item && item.featureId === feature.id)) {
          state.futureEnhancements.push({
            id: `future-${feature.id}`,
            title: `${feature.code}: ${feature.title}`,
            description: feature.summary || 'Imported from merged PRD fragment.',
            featureId: feature.id,
            status: 'planned',
            versionDate: new Date().toISOString(),
            sourceRefs: feature.code ? [feature.code] : [],
          });
        }
    }
    return state;
  }

  function prdStateHasCoreContent(editorState) {
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    const productOverview = state.productOverview && typeof state.productOverview === 'object' ? state.productOverview : {};
    const functionalRequirements = state.functionalRequirements && typeof state.functionalRequirements === 'object' ? state.functionalRequirements : {};
    const nonFunctionalRequirements = state.nonFunctionalRequirements && typeof state.nonFunctionalRequirements === 'object' ? state.nonFunctionalRequirements : {};
    const implementationPlan = state.implementationPlan && typeof state.implementationPlan === 'object' ? state.implementationPlan : {};

    return Boolean(
      String(state.executiveSummary && state.executiveSummary.text || '').trim()
      || String(productOverview.vision || '').trim()
      || (Array.isArray(productOverview.targetAudiences) && productOverview.targetAudiences.length)
      || (Array.isArray(productOverview.keyValueProps) && productOverview.keyValueProps.length)
      || (Array.isArray(functionalRequirements.workflows) && functionalRequirements.workflows.length)
      || (Array.isArray(functionalRequirements.userActions) && functionalRequirements.userActions.length)
      || (Array.isArray(functionalRequirements.systemBehaviors) && functionalRequirements.systemBehaviors.length)
      || String(nonFunctionalRequirements.usability || '').trim()
      || String(nonFunctionalRequirements.reliability || '').trim()
      || String(nonFunctionalRequirements.accessibility || '').trim()
      || String(nonFunctionalRequirements.security || '').trim()
      || String(nonFunctionalRequirements.performance || '').trim()
      || (Array.isArray(state.technicalArchitecture) && state.technicalArchitecture.length)
      || (Array.isArray(implementationPlan.sequencing) && implementationPlan.sequencing.length)
      || (Array.isArray(implementationPlan.dependencies) && implementationPlan.dependencies.length)
      || (Array.isArray(implementationPlan.milestones) && implementationPlan.milestones.length)
      || (Array.isArray(state.successMetrics) && state.successMetrics.length)
      || (Array.isArray(state.risksMitigations) && state.risksMitigations.length)
    );
  }

  function shouldBackfillPrdFromFragments(editorState, fragments) {
    const mergeableFragments = Array.isArray(fragments)
      ? fragments.filter((fragment) => fragment && (fragment.merged || ['merged', 'integrated'].includes(String(fragment.status || '').toLowerCase())))
      : [];
    if (!mergeableFragments.length) return false;
    return !prdStateHasCoreContent(editorState);
  }

  async function rebuildPrdEditorStateFromFragments(project, editorState, fragments) {
    const baseState = editorState && typeof editorState === 'object'
      ? JSON.parse(JSON.stringify(editorState))
      : buildDefaultPrdEditorState(project);
    const features = await readFeatureItems(project.id, { includeArchived: true });
    const featureById = new Map(features.map((feature) => [feature.id, feature]));
    const sortedFragments = (Array.isArray(fragments) ? fragments.slice() : [])
      .filter((fragment) => fragment && (fragment.merged || ['merged', 'integrated'].includes(String(fragment.status || '').toLowerCase())))
      .sort((left, right) => {
        const leftTime = Date.parse(left.mergedAt || left.updatedAt || left.createdAt || '');
        const rightTime = Date.parse(right.mergedAt || right.updatedAt || right.createdAt || '');
        if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) return 0;
        if (!Number.isFinite(leftTime)) return -1;
        if (!Number.isFinite(rightTime)) return 1;
        return leftTime - rightTime;
      });

    let nextState = baseState;
    for (const fragment of sortedFragments) {
      const feature = fragment.featureId ? featureById.get(fragment.featureId) || null : null;
      if (String(fragment.status || '').toLowerCase() === 'integrated') {
        nextState = integratePrdFragmentState(nextState, fragment, feature);
      } else {
        nextState = markPrdFragmentMergedState(nextState, fragment, feature);
      }
    }
    return nextState;
  }

  async function upsertPrdFragmentForFeature(project, feature) {
    const [existingFragment, phases, tasks] = await Promise.all([
      getPrdFragmentByFeatureId(project.id, feature.id),
      readRoadmapPhases(project.id),
      readProjectTasks(project.id),
    ]);
    const phase = phases.find((item) => item.id === feature.roadmapPhaseId);
    const task = tasks.find((item) => item.id === feature.taskId);
    const existingStatus = existingFragment && existingFragment.status ? String(existingFragment.status) : '';
    const savedFragment = await savePrdFragment({
      id: existingFragment ? existingFragment.id : undefined,
      projectId: project.id,
      featureId: feature.id,
      title: `${feature.code}: ${feature.title}`,
      markdown: existingFragment && existingFragment.markdown
        ? existingFragment.markdown
        : renderDefaultPrdFragmentBody(feature, { phase, task }),
      mermaid: existingFragment && existingFragment.mermaid
        ? existingFragment.mermaid
        : renderDefaultPrdFragmentMermaid(feature),
      status: ['merged', 'integrated'].includes(existingStatus)
        ? existingStatus
        : (feature.archived ? 'archived' : existingStatus || (feature.status === 'done' ? 'ready_to_merge' : 'draft')),
      merged: existingFragment ? existingFragment.merged : false,
      mergedAt: existingFragment ? existingFragment.mergedAt : null,
      fileName: existingFragment ? existingFragment.fileName : null,
      filePath: existingFragment ? existingFragment.filePath : null,
      fileUpdatedAt: existingFragment ? existingFragment.fileUpdatedAt : null,
      fileMd5: existingFragment ? existingFragment.fileMd5 : '',
      dbMd5: existingFragment ? existingFragment.dbMd5 : '',
    });
    return savedFragment;
  }

  function renderRoadmapPrdFragmentBody(project, context = {}) {
    const phases = Array.isArray(context.phases) ? context.phases.filter((phase) => !phase.archived) : [];
    const features = Array.isArray(context.features) ? context.features : [];
    const bugs = Array.isArray(context.bugs) ? context.bugs : [];
    return [
      '## Executive Summary',
      '',
      `This fragment captures PRD updates that should stay aligned with the roadmap for ${project.name}.`,
      '',
      '## Roadmap Change Summary',
      '',
      ...(phases.length
        ? phases.map((phase) => `- ${phase.code}: ${phase.name} (${phase.status})`)
        : ['- No active phases captured yet.']),
      '',
      '## Feature Planning Impact',
      '',
      ...(features.length
        ? features.map((feature) => `- ${feature.code}: ${feature.title} [${feature.planningBucket || 'considered'}]`)
        : ['- No feature planning changes captured yet.']),
      '',
      '## Bug Planning Impact',
      '',
      ...(bugs.length
        ? bugs.map((bug) => `- ${bug.code}: ${bug.title} [${bug.planningBucket || 'considered'}]`)
        : ['- No bug planning changes captured yet.']),
      '',
      '## PRD Update Guidance',
      '',
      '- AI agents should read the roadmap, linked features, linked bugs, and phase sequencing before changing implementation scope.',
      '- Update this fragment instead of editing PRD.md directly.',
      `- Store PRD fragment files under data/Fragments/${project.id}/.`,
      '- When implementation changes are approved, merge or integrate this fragment through the PRD module.',
      '',
    ].join('\n');
  }

  function renderRoadmapPrdFragmentMermaid(project, phases = []) {
    const activePhases = Array.isArray(phases) ? phases.filter((phase) => !phase.archived) : [];
    const lines = ['flowchart TD', `  roadmap["${String(project.name).replace(/"/g, '\\"')} Roadmap"]`, '  fragment["PRD Fragment"]', '  fragment --> prd["PRD.md"]'];
    activePhases.forEach((phase) => {
      const nodeId = `phase_${String(phase.code || phase.id).replace(/[^A-Za-z0-9]+/g, '_')}`;
      lines.push(`  roadmap --> ${nodeId}["${String(`${phase.code}: ${phase.name}`).replace(/"/g, '\\"')}"]`);
      lines.push(`  ${nodeId} --> fragment`);
    });
    return lines.join('\n');
  }

  async function upsertRoadmapPrdFragment(project, context = {}) {
    if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('prd')) return null;
    const fragments = await readPrdFragments(project.id, { includeMerged: true });
    const existing = fragments.find((fragment) => !fragment.featureId && fragment.title === 'Roadmap Planning Sync') || null;
    return savePrdFragment({
      id: existing ? existing.id : undefined,
      projectId: project.id,
      featureId: null,
      title: 'Roadmap Planning Sync',
      markdown: renderRoadmapPrdFragmentBody(project, context),
      mermaid: renderRoadmapPrdFragmentMermaid(project, context.phases || []),
      status: existing && existing.status ? existing.status : 'draft',
      merged: existing ? existing.merged : false,
      mergedAt: existing ? existing.mergedAt : null,
      mergedFileName: existing ? existing.mergedFileName : null,
      fileName: existing ? existing.fileName : null,
      filePath: existing ? existing.filePath : null,
      fileUpdatedAt: existing ? existing.fileUpdatedAt : null,
      fileMd5: existing ? existing.fileMd5 : '',
      dbMd5: existing ? existing.dbMd5 : '',
    });
  }

  async function importPrdFragmentFromFile(project, fragment, fileSnapshot) {
    const managedFragment = fileSnapshot && fileSnapshot.managed && fileSnapshot.managed.fragment;
    const resolvedMarkdown = typeof managedFragment?.markdown === 'string' && managedFragment.markdown.trim()
      ? managedFragment.markdown
      : String(fileSnapshot?.markdown || '').trim();
    if (!managedFragment || !resolvedMarkdown) {
      throw new Error('PRD fragment file is missing its managed fragment data.');
    }
    await savePrdFragment({
      id: (fragment && fragment.id) || managedFragment.id,
      projectId: project.id,
      featureId: managedFragment.featureId !== undefined ? managedFragment.featureId : (fragment && fragment.featureId),
      code: managedFragment.code || (fragment && fragment.code),
      title: managedFragment.title || (fragment && fragment.title),
      markdown: resolvedMarkdown,
      mermaid: managedFragment.mermaid || '',
      status: managedFragment.status || (fragment && fragment.status),
      merged: managedFragment.merged !== undefined ? !!managedFragment.merged : !!(fragment && fragment.merged),
      mergedAt: managedFragment.mergedAt !== undefined ? managedFragment.mergedAt : (fragment && fragment.mergedAt),
      fileName: managedFragment.fileName || (fragment && fragment.fileName),
      filePath: fileSnapshot.docPath,
      fileUpdatedAt: fileSnapshot.updatedAt,
      fileMd5: fileSnapshot.md5,
      dbMd5: fileSnapshot.md5,
    });
    config.log(`phase5: imported prd fragment ${(managedFragment.id || (fragment && fragment.id) || '<new>')} for project ${project.id} from ${fileSnapshot.docPath}`);
    cleanupImportedFragmentSourceFile(
      project,
      fileSnapshot.docPath,
      managedFragment.fileName || path.basename(fileSnapshot.docPath),
      `phase5: imported prd fragment cleanup ${managedFragment.id || (fragment && fragment.id) || '<new>'}`
    );
  }

  function extractLoosePrdFragmentDetails(markdown, fileName = '') {
    const text = String(markdown || '').replace(/^\uFEFF/, '');
    const headingMatch = text.match(/^#\s*PRD Fragment:\s*([A-Z0-9_-]+)\s*[-:]\s*(.+)$/im);
    if (!headingMatch) return null;
    const code = String(headingMatch[1] || '').trim();
    const title = String(headingMatch[2] || '').trim() || fileName.replace(/\.md$/i, '');
    if (!code) return null;
    return {
      code,
      title,
      markdown: text.trim(),
      status: 'draft',
      merged: false,
      mergedAt: null,
      fileName,
    };
  }

  async function importLoosePrdFragmentFromFile(project, fragment, fileSnapshot) {
    const looseFragment = extractLoosePrdFragmentDetails(fileSnapshot?.markdown || '', path.basename(fileSnapshot?.docPath || ''));
    if (!looseFragment) return false;
    await savePrdFragment({
      id: fragment?.id,
      projectId: project.id,
      featureId: fragment?.featureId || null,
      code: looseFragment.code,
      title: looseFragment.title,
      markdown: looseFragment.markdown,
      mermaid: fragment?.mermaid || '',
      status: fragment?.status || looseFragment.status,
      merged: fragment?.merged || false,
      mergedAt: fragment?.mergedAt || null,
      fileName: looseFragment.fileName || fragment?.fileName || null,
      filePath: fileSnapshot.docPath,
      fileUpdatedAt: fileSnapshot.updatedAt,
      fileMd5: fileSnapshot.md5,
      dbMd5: fileSnapshot.md5,
    });
    config.log(`phase5: imported loose prd fragment ${(looseFragment.code || '<new>')} for project ${project.id} from ${fileSnapshot.docPath}`);
    cleanupImportedFragmentSourceFile(
      project,
      fileSnapshot.docPath,
      looseFragment.fileName || path.basename(fileSnapshot.docPath),
      `phase5: imported loose prd fragment cleanup ${looseFragment.code || '<new>'}`
    );
    return true;
  }

  async function cleanupDuplicatePrdFragments(project) {
    const fragments = await readPrdFragments(project.id, { includeMerged: true });
    const seenCodes = new Set();
    for (const fragment of fragments) {
      const normalizedCode = String(fragment?.code || '').trim().toLowerCase();
      if (!normalizedCode) continue;
      if (seenCodes.has(normalizedCode)) {
        await deletePrdFragment(project.id, fragment.id);
        config.log(`phase5: removed duplicate prd fragment ${fragment.id} for project ${project.id} (code ${fragment.code})`);
        continue;
      }
      seenCodes.add(normalizedCode);
    }
  }

  async function discoverPrdFragmentsFromDisk(project) {
    const sharedFragmentsDir = ensureSharedFragmentsDir();
    const fragmentPaths = [
      ...listProjectFragmentFiles(project, /^PRD_FRAGMENT_.*\.md$/i),
      ...listProjectDocFiles(project, /^PRD_FRAGMENT_.*\.md$/i),
      ...(sharedFragmentsDir && fs.existsSync(sharedFragmentsDir)
        ? fs.readdirSync(sharedFragmentsDir)
          .filter((entry) => /^PRD_FRAGMENT_.*\.md$/i.test(entry))
          .map((entry) => path.join(sharedFragmentsDir, entry))
        : []),
    ];
    for (const filePath of fragmentPaths) {
      let snapshot = null;
      try {
        snapshot = readManagedFileSnapshot(filePath);
      } catch (error) {
        config.log(`phase5: failed to read prd fragment file ${filePath} for project ${project.id}: ${error.message}`);
        continue;
      }
      if (!snapshot) continue;
      const isManaged = snapshot.managed && snapshot.managed.docType === 'prd_fragment';
      const fragmentId = isManaged ? snapshot.managed.fragment && snapshot.managed.fragment.id : null;
      const looseDetails = !isManaged ? extractLoosePrdFragmentDetails(snapshot.markdown || '', path.basename(filePath)) : null;
      if (!isManaged && !looseDetails) continue;
      const existing = fragmentId ? await getPrdFragmentById(project.id, fragmentId) : null;
      const existingByCode = !existing && looseDetails?.code
        ? (await readPrdFragments(project.id, { includeMerged: true })).find((fragment) => String(fragment?.code || '').trim().toLowerCase() === looseDetails.code.toLowerCase())
        : null;
      const resolvedExisting = existing || existingByCode || null;
      const storedDocument = resolvedExisting ? {
        updatedAt: resolvedExisting.updatedAt,
        fileUpdatedAt: resolvedExisting.fileUpdatedAt,
        fileMd5: resolvedExisting.fileMd5,
      } : null;
      if (!resolvedExisting || isFileNewerThanDatabase(storedDocument, snapshot)) {
        try {
          if (isManaged) {
            await importPrdFragmentFromFile(project, resolvedExisting, snapshot);
          } else {
            await importLoosePrdFragmentFromFile(project, resolvedExisting, snapshot);
          }
        } catch (error) {
          config.log(`phase5: skipped prd fragment import for ${filePath} in project ${project.id}: ${error.message}`);
        }
        continue;
      }

      const resolvedStatus = String(resolvedExisting?.status || '').trim().toLowerCase();
      const isResolvedArchived = resolvedStatus === 'archived' || resolvedStatus === 'integrated' || resolvedStatus === 'merged' || !!resolvedExisting?.merged;
      const canonicalFilePath = resolvedExisting?.filePath ? path.resolve(resolvedExisting.filePath) : '';
      const discoveredFilePath = snapshot?.docPath ? path.resolve(snapshot.docPath) : '';
      const shouldDeleteStaleCopy = isResolvedArchived
        && discoveredFilePath
        && (!canonicalFilePath || canonicalFilePath !== discoveredFilePath);

      if (shouldDeleteStaleCopy) {
        tryDeleteFile(
          snapshot.docPath,
          `phase5: stale prd fragment file cleanup ${resolvedExisting.id || resolvedExisting.code || path.basename(snapshot.docPath)}`
        );
      }
    }
  }

  async function syncPrdFragment(project, fragment) {
    let storedFragment = fragment || null;
    if (!storedFragment && fragment && fragment.id) {
      storedFragment = await getPrdFragmentById(project.id, fragment.id);
    }
    if (!storedFragment) return null;
    let fileSnapshot = readPrdFragmentDocument(project, storedFragment);
    if (fileSnapshot && fileSnapshot.managed && isFileNewerThanDatabase(storedFragment, fileSnapshot)) {
      await importPrdFragmentFromFile(project, storedFragment, fileSnapshot);
      storedFragment = await getPrdFragmentById(project.id, storedFragment.id);
      fileSnapshot = readPrdFragmentDocument(project, storedFragment);
    }

    const fragmentStatus = String(storedFragment.status || '').trim().toLowerCase();
    const isTerminalFragment = storedFragment.merged || fragmentStatus === 'archived' || fragmentStatus === 'integrated' || fragmentStatus === 'merged';

    if (isTerminalFragment) {
      if (fileSnapshot && fileSnapshot.docPath) {
        tryDeleteFile(fileSnapshot.docPath, `phase5: merged prd fragment sync ${storedFragment.id}`);
      }
      storedFragment = await savePrdFragment({
        ...storedFragment,
        mergedFileName: storedFragment.mergedFileName || storedFragment.fileName || (fileSnapshot ? path.basename(fileSnapshot.docPath) : null),
        filePath: null,
        fileUpdatedAt: null,
        fileMd5: '',
        dbMd5: storedFragment.dbMd5 || '',
      });
      return storedFragment;
    }

    const fragmentMarkdown = renderPrdFragmentMarkdown(project, storedFragment);
    const dbMd5 = computeMd5(fragmentMarkdown);
    let writeResult = null;
    if (shouldRewriteDocumentFile(storedFragment, fileSnapshot, dbMd5)) {
      writeResult = writePrdFragmentDocument(project, storedFragment);
      fileSnapshot = writeResult.snapshot;
    }

    storedFragment = await savePrdFragment({
      ...storedFragment,
      fileName: (writeResult && writeResult.fileName) || storedFragment.fileName || (fileSnapshot ? path.basename(fileSnapshot.docPath) : null),
      filePath: fileSnapshot ? fileSnapshot.docPath : storedFragment.filePath,
      fileUpdatedAt: fileSnapshot ? fileSnapshot.updatedAt : null,
      fileMd5: fileSnapshot ? fileSnapshot.md5 : '',
      dbMd5,
    });
    return storedFragment;
  }

  async function syncPrdFragmentsForProject(project) {
    await discoverPrdFragmentsFromDisk(project);
    await cleanupDuplicatePrdFragments(project);
    const features = await readFeatureItems(project.id, { includeArchived: true });
    for (const feature of features) {
      const fragment = await upsertPrdFragmentForFeature(project, feature);
      await syncPrdFragment(project, fragment);
    }
    const fragments = await readPrdFragments(project.id, { includeMerged: true });
    const fragmentByFeatureId = new Map(features.map((feature) => [feature.id, true]));
    const synchronized = [];
    for (const fragment of fragments) {
      if (fragment.featureId && !fragmentByFeatureId.has(fragment.featureId)) {
        synchronized.push(await syncPrdFragment(project, fragment));
        continue;
      }
      if (!fragment.featureId) synchronized.push(await syncPrdFragment(project, fragment));
    }
    await cleanupMergedPrdFragmentFiles(project);
    const current = await readPrdFragments(project.id, { includeMerged: true });
    return current;
  }

  function buildMergedPrdSection(fragment) {
    const mergedBody = String(fragment.markdown || '')
      .replace(/^###### /gm, '####### ')
      .replace(/^##### /gm, '###### ')
      .replace(/^#### /gm, '##### ')
      .replace(/^### /gm, '#### ')
      .replace(/^## /gm, '### ');
    return [
      `### ${fragment.code}: ${fragment.title}`,
      '',
      `- Source Fragment: ${fragment.fileName || fragment.id}`,
      `- Merged At: ${new Date().toISOString()}`,
      '',
      mergedBody.trim(),
      '',
    ].join('\n');
  }

  function mergePrdFragmentMarkdown(existingMarkdown, fragment) {
    const markerStart = `<!-- APM:PRD-FRAGMENT ${fragment.id} START -->`;
    const markerEnd = `<!-- APM:PRD-FRAGMENT ${fragment.id} END -->`;
    if (String(existingMarkdown || '').includes(markerStart)) return String(existingMarkdown || '').trim();
    const sectionHeader = '## Applied PRD Fragments';
    const sectionBody = [
      markerStart,
      buildMergedPrdSection(fragment),
      markerEnd,
    ].join('\n');
    if (!String(existingMarkdown || '').includes(sectionHeader)) {
      return [String(existingMarkdown || '').trim(), '', sectionHeader, '', sectionBody, ''].join('\n').trim();
    }
    return `${String(existingMarkdown || '').trim()}\n\n${sectionBody}\n`.trim();
  }

  function tryDeleteFile(filePath, logLabel) {
    if (!filePath) return false;
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        config.log(`${logLabel}: deleted ${filePath}`);
        return true;
      }
    } catch (error) {
      config.log(`${logLabel}: failed to delete ${filePath}: ${error.message || error}`);
    }
    return false;
  }

  async function cleanupMergedPrdFragmentFiles(project) {
    const fragments = await readPrdFragments(project.id, { includeMerged: true });
    for (const fragment of fragments.filter((item) => item.merged)) {
      const docsDir = ensureProjectDocsDir(project);
      const fragmentsDir = ensureProjectFragmentsDir(project);
      const candidatePaths = [
        fragment.filePath || null,
        fragmentsDir && fragment.fileName ? path.join(fragmentsDir, fragment.fileName) : null,
        fragmentsDir && fragment.mergedFileName ? path.join(fragmentsDir, fragment.mergedFileName) : null,
        docsDir && fragment.fileName ? path.join(docsDir, fragment.fileName) : null,
        docsDir && fragment.mergedFileName ? path.join(docsDir, fragment.mergedFileName) : null,
      ].filter(Boolean);
      const uniquePaths = [...new Set(candidatePaths)];
      let deleted = false;
      for (const candidatePath of uniquePaths) {
        deleted = tryDeleteFile(candidatePath, `phase5: merged prd fragment cleanup ${fragment.id}`) || deleted;
      }
      if (deleted) {
        await savePrdFragment({
          ...fragment,
          mergedFileName: fragment.mergedFileName || fragment.fileName || (uniquePaths[0] ? path.basename(uniquePaths[0]) : null),
          filePath: null,
          fileUpdatedAt: null,
          fileMd5: '',
        });
      }
    }
  }

  async function syncRoadmapFragment(project, fragment) {
    let storedFragment = fragment || null;
    if (!storedFragment && fragment && fragment.id) {
      storedFragment = await getRoadmapFragmentById(project.id, fragment.id);
    }
    if (!storedFragment) throw new Error('Roadmap fragment not found');

    let fileSnapshot = storedFragment.filePath ? readRoadmapFragmentDocument(project, storedFragment) : null;
    const storedDocMeta = {
      updatedAt: storedFragment.updatedAt,
      fileUpdatedAt: storedFragment.fileUpdatedAt,
      fileMd5: storedFragment.fileMd5,
    };

    if (fileSnapshot && isFileNewerThanDatabase(storedDocMeta, fileSnapshot)) {
      await importRoadmapFragmentFromFile(project, storedFragment, fileSnapshot);
      storedFragment = await getRoadmapFragmentById(project.id, storedFragment.id);
    }

    const fragmentMarkdown = renderRoadmapFragmentMarkdown(project, storedFragment);
    const dbMd5 = computeMd5(fragmentMarkdown);
    let writeResult = null;
    if (shouldRewriteDocumentFile(storedDocMeta, fileSnapshot, dbMd5)) {
      writeResult = writeRoadmapFragmentDocument(project, storedFragment);
      fileSnapshot = writeResult.snapshot;
    }

    storedFragment = await saveRoadmapFragment({
      ...storedFragment,
      fileName: (writeResult && writeResult.fileName) || storedFragment.fileName || (fileSnapshot ? path.basename(fileSnapshot.docPath) : null),
      filePath: fileSnapshot ? fileSnapshot.docPath : storedFragment.filePath,
      fileUpdatedAt: fileSnapshot ? fileSnapshot.updatedAt : null,
      fileMd5: fileSnapshot ? fileSnapshot.md5 : '',
      dbMd5,
    });
    return storedFragment;
  }

  async function syncRoadmapFragmentsForProject(project) {
    await discoverRoadmapFragmentsFromDisk(project);
    const fragments = await readRoadmapFragments(project.id, { includeMerged: true });
    for (const fragment of fragments) {
      await syncRoadmapFragment(project, fragment);
    }
    return readRoadmapFragments(project.id, { includeMerged: true });
  }

  async function applyRoadmapFragment(project, fragment) {
    const payload = fragment && fragment.payload && typeof fragment.payload === 'object'
      ? fragment.payload
      : null;
    if (!payload) throw new Error('Roadmap fragment payload is missing.');

    const [phases, tasks, features] = await Promise.all([
      readRoadmapPhases(project.id),
      readProjectTasks(project.id),
      readFeatureItems(project.id, { includeArchived: true }),
    ]);

    const phaseById = new Map(phases.map((phase) => [phase.id, phase]));
    const phaseByCode = new Map(phases.map((phase) => [phase.code, phase]));

    const phaseChanges = Array.isArray(payload.phaseChanges) ? payload.phaseChanges : [];
    for (const change of phaseChanges) {
      if (!change || typeof change !== 'object') continue;
      const existing = (change.id && phaseById.get(change.id))
        || (change.code && phaseByCode.get(change.code))
        || null;
      const saved = await saveRoadmapPhase({
        projectId: project.id,
        id: existing ? existing.id : undefined,
        name: change.name || (existing && existing.name) || 'New Phase',
        summary: change.summary !== undefined ? change.summary : (existing && existing.summary) || '',
        goal: change.goal !== undefined ? change.goal : (existing && existing.goal) || '',
        status: change.status || (existing && existing.status) || 'planned',
        targetDate: change.targetDate !== undefined ? change.targetDate : (existing && existing.targetDate) || null,
        sortOrder: Number.isFinite(Number(change.sortOrder))
          ? Number(change.sortOrder)
          : (existing ? existing.sortOrder : await nextRoadmapPhaseSortOrder(project.id)),
      });
      phaseById.set(saved.id, saved);
      phaseByCode.set(saved.code, saved);
    }

    const featureById = new Map(features.map((feature) => [feature.id, feature]));
    const featureAssignments = Array.isArray(payload.featureAssignments) ? payload.featureAssignments : [];
    for (const assignment of featureAssignments) {
      if (!assignment || typeof assignment !== 'object' || !assignment.featureId) continue;
      const feature = featureById.get(assignment.featureId);
      if (!feature) continue;
      const phase = (assignment.roadmapPhaseId && phaseById.get(assignment.roadmapPhaseId))
        || (assignment.roadmapPhaseCode && phaseByCode.get(assignment.roadmapPhaseCode))
        || null;
      const savedFeature = await saveFeatureItem({
        ...feature,
        projectId: project.id,
        roadmapPhaseId: phase ? phase.id : null,
        archived: assignment.archived !== undefined ? !!assignment.archived : feature.archived,
        status: assignment.status || feature.status,
      });
      featureById.set(savedFeature.id, savedFeature);
    }

    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const taskAssignments = Array.isArray(payload.taskAssignments) ? payload.taskAssignments : [];
    for (const assignment of taskAssignments) {
      if (!assignment || typeof assignment !== 'object' || !assignment.taskId) continue;
      const task = taskById.get(assignment.taskId);
      if (!task) continue;
      const phase = (assignment.roadmapPhaseId && phaseById.get(assignment.roadmapPhaseId))
        || (assignment.roadmapPhaseCode && phaseByCode.get(assignment.roadmapPhaseCode))
        || null;
      const savedTask = await saveTask({
        ...task,
        projectId: project.id,
        roadmapPhaseId: phase ? phase.id : null,
      });
      taskById.set(savedTask.id, savedTask);
    }
  }

  async function buildRoadmapState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'roadmap');
    const [phases, tasks, features, bugs, fragments] = await Promise.all([
      readRoadmapPhases(project.id, { includeArchived: true }),
      readProjectTasks(project.id),
      readFeatureItems(project.id, { includeArchived: true }),
      readBugItems(project.id, { includeArchived: true }),
      readRoadmapFragments(project.id, { includeMerged: true }),
    ]);
    const templateMeta = getTemplateMetadata('ROADMAP.template.md');
    const mermaid = stored && stored.mermaid
      ? stored.mermaid
      : renderRoadmapMermaid(phases, tasks, features, bugs);
    return {
      phases,
      tasks,
      features,
      bugs,
      fragments,
      templateVersion: templateMeta.version || '',
      templateLastUpdated: templateMeta.lastUpdated || '',
      mermaid,
      markdown: renderRoadmapMarkdown(project, phases, tasks, features, bugs, mermaid, templateMeta),
    };
  }

  async function syncRoadmapDocument(project, options = {}) {
    config.log(`phase5: syncing roadmap document for project ${project.id}`);
    syncRoadmapFragmentTemplateForProject(project);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'roadmap', importRoadmapDocumentFromFile);
    }
    await syncRoadmapFragmentsForProject(project);
    const state = await buildRoadmapState(project);
    const markdown = renderRoadmapMarkdown(project, state.phases, state.tasks, state.features, state.bugs, state.mermaid, {
      version: state.templateVersion,
      lastUpdated: state.templateLastUpdated,
    });
    const syncResult = await finalizeDocumentSync(project, 'roadmap', markdown, {
      markdown,
      mermaid: state.mermaid,
    });
    config.log(`phase5: roadmap document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  async function buildFeaturesState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'features');
    const [phases, features, fragments] = await Promise.all([
      readRoadmapPhases(project.id),
      readFeatureItems(project.id, { includeArchived: true }),
      readPrdFragments(project.id, { includeMerged: true }),
    ]);
    const mermaid = stored && stored.mermaid
      ? stored.mermaid
      : renderFeaturesMermaid(phases, features);
    return {
      features,
      phases,
      fragments,
      editorState: stored && stored.editorState ? stored.editorState : { fragmentHistory: [] },
      mermaid,
      markdown: renderFeaturesMarkdown(project, phases, features, mermaid),
    };
  }

  async function syncFeaturesDocument(project, options = {}) {
    config.log(`phase5: syncing features document for project ${project.id}`);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'features', importFeaturesDocumentFromFile);
    }
    await syncPrdFragmentsForProject(project);
    const state = await buildFeaturesState(project);
    const markdown = renderFeaturesMarkdown(project, state.phases, state.features, state.mermaid);
    const syncResult = await finalizeDocumentSync(project, 'features', markdown, {
      markdown,
      mermaid: state.mermaid,
      editorState: state.editorState || { fragmentHistory: [] },
    });
    config.log(`phase5: features document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  async function buildBugsState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'bugs');
    const [bugs, phases] = await Promise.all([
      readBugItems(project.id, { includeArchived: true }),
      readRoadmapPhases(project.id),
    ]);
    const mermaid = renderBugsMermaid(bugs);
    return {
      bugs,
      phases,
      editorState: stored && stored.editorState ? stored.editorState : { fragmentHistory: [] },
      mermaid,
      markdown: renderBugsMarkdown(project, bugs, mermaid),
    };
  }

  async function syncBugsDocument(project, options = {}) {
    config.log(`phase5: syncing bugs document for project ${project.id}`);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'bugs', importBugsDocumentFromFile);
    }
    const state = await buildBugsState(project);
    const markdown = renderBugsMarkdown(project, state.bugs, state.mermaid);
    const syncResult = await finalizeDocumentSync(project, 'bugs', markdown, {
      markdown,
      mermaid: state.mermaid,
      editorState: state.editorState || { fragmentHistory: [] },
    });
    syncArchivedBugWorkspaceNotes(project, state.bugs);
    config.log(`phase5: bugs document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  async function buildPrdState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'prd');
    const fragments = await readPrdFragments(project.id, { includeMerged: true });
    let editorState = stored && stored.editorState ? stored.editorState : buildDefaultPrdEditorState(project);
    if (shouldBackfillPrdFromFragments(editorState, fragments)) {
      editorState = await rebuildPrdEditorStateFromFragments(project, editorState, fragments);
    }
    const normalizedEditorState = normalizeDocumentEditorStateForStorage(project, 'prd', editorState);
    if (JSON.stringify(normalizedEditorState) !== JSON.stringify(editorState)) {
      editorState = normalizedEditorState;
    }
    const sanitizedEditorState = sanitizePrdEditorStateTitles(editorState);
    if (JSON.stringify(sanitizedEditorState) !== JSON.stringify(editorState)) {
      editorState = sanitizedEditorState;
    }
    if (stored && JSON.stringify(stored.editorState || null) !== JSON.stringify(editorState)) {
      await saveProjectDocument(project.id, 'prd', {
        markdown: renderPrdEditorStateMarkdown(project, editorState, fragments),
        mermaid: stored && stored.mermaid ? stored.mermaid : 'flowchart TD\n  product["Product"] --> value["Value"]',
        editorState,
      });
    }
    const markdown = renderPrdEditorStateMarkdown(project, editorState, fragments);
    return {
      markdown: markdown || (stored && stored.markdown) || defaultPrdMarkdown(project).replace(/\{\{PROJECT_NAME\}\}/g, project.name),
      mermaid: stored && stored.mermaid ? stored.mermaid : 'flowchart TD\n  product["Product"] --> value["Value"]',
      editorState,
      fragments,
    };
  }

  async function syncPrdDocument(project, options = {}) {
    config.log(`phase5: syncing prd document for project ${project.id}`);
    await syncPrdFragmentsForProject(project);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'prd', importPrdDocumentFromFile);
    }
    const state = await buildPrdState(project);
    const markdownBody = renderPrdEditorStateMarkdown(project, state.editorState, state.fragments);
    const markdown = renderPrdMarkdown(project, markdownBody, state.mermaid, state.editorState);
    const syncResult = await finalizeDocumentSync(project, 'prd', markdown, {
      markdown: markdownBody,
      mermaid: state.mermaid,
      editorState: state.editorState,
    });
    config.log(`phase5: prd document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  function defaultGenericModuleMermaid(project, docType) {
    const label = String(docType || '')
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return `flowchart TD\n  project["${String(project?.name || 'Project').replace(/"/g, '\\"')}"] --> module["${label}"]`;
  }

  async function buildGenericModuleDocumentState(project, docType) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, docType);
    const editorState = stored && stored.editorState ? stored.editorState : defaultModuleDocumentEditorState(project, docType);
    const markdownBody = renderModuleDocumentEditorStateMarkdown(project, docType, editorState);
    return {
      markdown: markdownBody,
      mermaid: stored && stored.mermaid ? stored.mermaid : defaultGenericModuleMermaid(project, docType),
      editorState,
    };
  }

  async function syncGenericModuleDocument(project, docType, options = {}) {
    config.log(`phase5: syncing ${docType} document for project ${project.id}`);
    if (!options.skipImport) {
      await maybeImportDocumentFile(
        project,
        docType,
        (targetProject, fileSnapshot) => importStructuredModuleDocumentFromFile(
          targetProject,
          fileSnapshot,
          docType,
          (innerProject) => defaultGenericModuleMermaid(innerProject, docType)
        )
      );
    }
    const state = await buildGenericModuleDocumentState(project, docType);
    const markdownBody = renderModuleDocumentEditorStateMarkdown(project, docType, state.editorState);
    const syncResult = await finalizeDocumentSync(project, docType, markdownBody, {
      markdown: markdownBody,
      mermaid: state.mermaid,
      editorState: state.editorState,
    });
    config.log(`phase5: ${docType} document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return {
      ...state,
      markdown: markdownBody,
    };
  }

  function isProjectModuleEnabled(project, moduleKey) {
    if (!project) return false;
    if (Array.isArray(project.modules) && project.modules.length) {
      return project.modules.some((module) => module && module.moduleKey === moduleKey && module.enabled);
    }
    return Array.isArray(project.enabledModules) && project.enabledModules.includes(moduleKey);
  }

  async function buildArchitectureState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'architecture');
    const editorState = stored && stored.editorState ? stored.editorState : defaultArchitectureEditorState(project);
    const markdownBody = renderArchitectureEditorStateMarkdown(project, editorState);
    return {
      markdown: markdownBody,
      mermaid: stored && stored.mermaid ? stored.mermaid : defaultArchitectureMermaid(project, editorState),
      editorState,
    };
  }

  async function syncArchitectureDocument(project, options = {}) {
    config.log(`phase5: syncing architecture document for project ${project.id}`);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'architecture', (targetProject, fileSnapshot) => importStructuredModuleDocumentFromFile(targetProject, fileSnapshot, 'architecture', defaultArchitectureMermaid));
    }
    const state = await buildArchitectureState(project);
    const markdownBody = renderArchitectureEditorStateMarkdown(project, state.editorState);
    const markdown = renderArchitectureMarkdown(project, markdownBody, state.mermaid, state.editorState);
    const syncResult = await finalizeDocumentSync(project, 'architecture', markdown, {
      markdown: markdownBody,
      mermaid: state.mermaid,
      editorState: state.editorState,
    });
    config.log(`phase5: architecture document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  async function buildAiEnvironmentState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'ai_environment');
    const editorState = stored && stored.editorState ? stored.editorState : defaultAiEnvironmentEditorState(project);
    const appSettings = await readAppSettings();
    const sharedProfiles = Array.isArray(appSettings?.ai?.profiles) ? appSettings.ai.profiles : [];
    const fragmentsDirectiveProjectId = appSettings?.ai?.fragmentsDirectiveProjectId || '';
    const fragmentsRootDir = getFragmentsRootDir();
    const runtimeDatabasePath = path.join(config.getDataDir(), 'app.db');
    const documentPath = getProjectDocPath(project, 'ai_environment');
    const softwareStandardsPath = getProjectSoftwareStandardsRegistryPath(project);
    const markdownBody = renderAiEnvironmentEditorStateMarkdown(project, editorState, {
      sharedProfiles,
      fragmentsDirectiveProjectId,
      fragmentsRootDir,
    });
    return {
      markdown: markdownBody,
      mermaid: stored && stored.mermaid
        ? stored.mermaid
        : 'flowchart TD\n  ai["AI Environment"] --> brief["Project Brief"]\n  ai --> modules["Affected Modules"]\n  ai --> fragments["Managed Fragments"]',
      editorState,
      sharedProfiles,
      fragmentsDirectiveProjectId,
      fragmentsRootDir,
      runtimeDatabasePath,
      documentPath,
      softwareStandardsPath,
    };
  }

  async function syncAiEnvironmentDocument(project, options = {}) {
    config.log(`phase5: syncing ai environment document for project ${project.id}`);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'ai_environment', (targetProject, fileSnapshot) => importStructuredModuleDocumentFromFile(
        targetProject,
        fileSnapshot,
        'ai_environment',
        () => 'flowchart TD\n  ai["AI Environment"] --> brief["Project Brief"]\n  ai --> modules["Affected Modules"]\n  ai --> fragments["Managed Fragments"]'
      ));
    }
    const state = await buildAiEnvironmentState(project);
    const markdownBody = renderAiEnvironmentEditorStateMarkdown(project, state.editorState, {
      sharedProfiles: state.sharedProfiles,
      fragmentsDirectiveProjectId: state.fragmentsDirectiveProjectId,
      fragmentsRootDir: state.fragmentsRootDir,
    });
    const markdown = renderAiEnvironmentMarkdown(project, markdownBody, state.mermaid, state.editorState);
    const syncResult = await finalizeDocumentSync(project, 'ai_environment', markdown, {
      markdown: markdownBody,
      mermaid: state.mermaid,
      editorState: state.editorState,
    });
    config.log(`phase5: ai environment document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  async function buildDatabaseSchemaState(project) {
    ensureWorkspaceProject(project);
    const stored = await readProjectDocument(project.id, 'database_schema');
    const editorState = normalizeDatabaseSchemaStateEditorState(
      project,
      stored && stored.editorState ? stored.editorState : defaultDatabaseSchemaEditorState(project)
    );
    const markdownBody = renderDatabaseSchemaEditorStateMarkdown(project, editorState);
    const dbml = renderDatabaseSchemaDbml(project, editorState);
    return {
      markdown: markdownBody,
      mermaid: stored && stored.mermaid ? stored.mermaid : defaultDatabaseSchemaMermaid(project),
      editorState,
      dbml,
    };
  }

  function normalizeSchemaImportSource(source = {}) {
    return {
      sourceType: String(source.sourceType || 'mixed'),
      sourceLabel: String(source.sourceLabel || ''),
      dialect: String(source.dialect || ''),
      observedAt: String(source.observedAt || ''),
      schemaFingerprint: String(source.schemaFingerprint || ''),
      confidence: String(source.confidence || 'mixed'),
    };
  }

  function normalizeDatabaseSchemaStateEditorState(project, editorState) {
    const defaultState = defaultDatabaseSchemaEditorState(project);
    const base = editorState && typeof editorState === 'object' ? editorState : defaultState;
    return {
      ...defaultState,
      ...base,
      overview: {
        ...defaultState.overview,
        ...(base.overview && typeof base.overview === 'object' ? base.overview : {}),
      },
      importSource: base.importSource || null,
      observedSchemaModel: base.observedSchemaModel && typeof base.observedSchemaModel === 'object'
        ? base.observedSchemaModel
        : null,
      syncTracking: normalizeDatabaseSchemaSyncTracking(base.syncTracking),
      schemaModel: base.schemaModel && typeof base.schemaModel === 'object'
        ? base.schemaModel
        : defaultState.schemaModel,
    };
  }

  function hasSchemaModelContent(schemaModel) {
    return !!(
      schemaModel
      && typeof schemaModel === 'object'
      && (
        (Array.isArray(schemaModel.entities) && schemaModel.entities.length)
        || (Array.isArray(schemaModel.relationships) && schemaModel.relationships.length)
        || (Array.isArray(schemaModel.indexes) && schemaModel.indexes.length)
        || (Array.isArray(schemaModel.constraints) && schemaModel.constraints.length)
      )
    );
  }

  function buildComparableDatabaseSchemaModel(schemaModel) {
    const model = schemaModel && typeof schemaModel === 'object' ? schemaModel : {};
    const normalizeField = (field) => ({
      id: String(field?.id || ''),
      name: String(field?.name || ''),
      type: String(field?.type || ''),
      nullable: field?.nullable === undefined ? null : !!field.nullable,
      primaryKey: !!field?.primaryKey,
      unique: !!field?.unique,
      defaultValue: String(field?.defaultValue || ''),
      referencesEntityId: String(field?.referencesEntityId || ''),
      referencesFieldId: String(field?.referencesFieldId || ''),
    });
    const normalizeEntity = (entity) => ({
      id: String(entity?.id || ''),
      name: String(entity?.name || ''),
      kind: String(entity?.kind || ''),
      fields: (Array.isArray(entity?.fields) ? entity.fields : [])
        .map(normalizeField)
        .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })),
    });
    const normalizeRelationship = (relationship) => ({
      id: String(relationship?.id || ''),
      fromEntityId: String(relationship?.fromEntityId || ''),
      fromFieldId: String(relationship?.fromFieldId || ''),
      toEntityId: String(relationship?.toEntityId || ''),
      toFieldId: String(relationship?.toFieldId || ''),
      cardinality: String(relationship?.cardinality || ''),
    });
    const normalizeIndex = (indexEntry) => ({
      id: String(indexEntry?.id || ''),
      entityId: String(indexEntry?.entityId || ''),
      name: String(indexEntry?.name || ''),
      fields: (Array.isArray(indexEntry?.fields) ? indexEntry.fields : []).map((field) => String(field || '')).sort(),
      unique: !!indexEntry?.unique,
    });
    const normalizeConstraint = (constraint) => ({
      id: String(constraint?.id || ''),
      entityId: String(constraint?.entityId || ''),
      name: String(constraint?.name || ''),
      type: String(constraint?.type || ''),
      definition: String(constraint?.definition || ''),
    });
    return {
      entities: (Array.isArray(model.entities) ? model.entities : [])
        .map(normalizeEntity)
        .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })),
      relationships: (Array.isArray(model.relationships) ? model.relationships : [])
        .map(normalizeRelationship)
        .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })),
      indexes: (Array.isArray(model.indexes) ? model.indexes : [])
        .map(normalizeIndex)
        .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })),
      constraints: (Array.isArray(model.constraints) ? model.constraints : [])
        .map(normalizeConstraint)
        .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })),
    };
  }

  function computeDatabaseSchemaModelHash(schemaModel) {
    if (!hasSchemaModelContent(schemaModel)) return '';
    return computeMd5(JSON.stringify(buildComparableDatabaseSchemaModel(schemaModel)));
  }

  function computeDatabaseSchemaDriftDetails(intendedSchemaModel, observedSchemaModel) {
    const intended = buildComparableDatabaseSchemaModel(intendedSchemaModel);
    const observed = buildComparableDatabaseSchemaModel(observedSchemaModel);

    const compareCollections = (leftItems, rightItems, options = {}) => {
      const keyFor = options.keyFor || ((item) => String(item?.id || ''));
      const compareItem = options.compareItem || ((left, right) => JSON.stringify(left) === JSON.stringify(right));
      const buildDetail = options.buildDetail || ((item, driftStatus) => ({
        id: keyFor(item),
        name: item?.name || keyFor(item),
        driftStatus,
      }));

      const rightByKey = new Map((rightItems || []).map((item) => [keyFor(item), item]));
      const details = [];
      for (const leftItem of leftItems || []) {
        const key = keyFor(leftItem);
        const rightItem = rightByKey.get(key);
        if (!rightItem) {
          details.push(buildDetail(leftItem, 'intended_only', null));
          continue;
        }
        details.push(buildDetail(leftItem, compareItem(leftItem, rightItem) ? 'in_sync' : 'mismatch', rightItem));
        rightByKey.delete(key);
      }
      for (const rightItem of rightByKey.values()) {
        details.push(buildDetail(rightItem, 'observed_only', null));
      }
      return details.sort((left, right) => String(left.name || left.id || '').localeCompare(String(right.name || right.id || ''), undefined, { numeric: true, sensitivity: 'base' }));
    };

    const entityDetails = compareCollections(intended.entities, observed.entities, {
      buildDetail: (entity, driftStatus, observedEntity) => {
        const fieldDetails = compareCollections(entity?.fields || [], observedEntity?.fields || [], {
          buildDetail: (field, fieldDriftStatus) => ({
            id: String(field?.id || ''),
            name: String(field?.name || field?.id || ''),
            driftStatus: fieldDriftStatus,
          }),
        });
        const fieldMismatch = fieldDetails.some((field) => field.driftStatus !== 'in_sync');
        const normalizedEntityStatus = driftStatus === 'in_sync' && fieldMismatch ? 'mismatch' : driftStatus;
        return {
          id: String(entity?.id || ''),
          name: String(entity?.name || entity?.id || ''),
          driftStatus: normalizedEntityStatus,
          fields: fieldDetails,
        };
      },
    });

    const relationshipDetails = compareCollections(intended.relationships, observed.relationships, {
      buildDetail: (relationship, driftStatus) => ({
        id: String(relationship?.id || ''),
        name: String(relationship?.id || ''),
        driftStatus,
      }),
    });
    const indexDetails = compareCollections(intended.indexes, observed.indexes, {
      buildDetail: (indexEntry, driftStatus) => ({
        id: String(indexEntry?.id || ''),
        name: String(indexEntry?.name || indexEntry?.id || ''),
        driftStatus,
      }),
    });
    const constraintDetails = compareCollections(intended.constraints, observed.constraints, {
      buildDetail: (constraint, driftStatus) => ({
        id: String(constraint?.id || ''),
        name: String(constraint?.name || constraint?.id || ''),
        driftStatus,
      }),
    });

    return {
      entities: entityDetails,
      relationships: relationshipDetails,
      indexes: indexDetails,
      constraints: constraintDetails,
    };
  }

  function buildDatabaseSchemaActionItems({ syncStatus, driftDetails, intendedPresent, observedPresent }) {
    const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
    const items = [];
    const pushItem = (item) => {
      if (!item || !item.id || !item.title) return;
      items.push({
        priority: 'medium',
        category: 'reconciliation',
        actionType: 'review',
        objectType: 'schema',
        objectId: '',
        objectName: '',
        summary: '',
        ...item,
      });
    };
    const byDriftStatus = (status) => String(status || 'in_sync');
    const relationLabel = (entry) => String(entry?.name || entry?.id || 'relationship');
    const listFor = (entries = []) => entries.filter((entry) => byDriftStatus(entry?.driftStatus) !== 'in_sync');

    if (!intendedPresent && observedPresent) {
      pushItem({
        id: 'schema-define-intended',
        title: 'Adopt the observed schema into the intended design',
        summary: 'The runtime schema exists, but the intended schema is still empty. Promote the observed snapshot into the design-side document before making more changes.',
        priority: 'high',
        category: 'documentation',
        actionType: 'define_intended_schema',
      });
    }
    if (intendedPresent && !observedPresent) {
      pushItem({
        id: 'schema-capture-observed',
        title: 'Capture the runtime schema for comparison',
        summary: 'The intended schema exists without an observed snapshot. Import the live runtime schema so drift can be compared reliably.',
        priority: 'high',
        category: 'capture',
        actionType: 'capture_runtime_schema',
      });
    }

    const entityItems = listFor(driftDetails.entities).flatMap((entity) => {
      const details = [];
      const entityStatus = byDriftStatus(entity.driftStatus);
      const fieldEntries = listFor(entity.fields || []);
      if (syncStatus === 'intended_ahead') {
        if (entityStatus === 'intended_only') {
          details.push({
            id: `entity:${entity.id}:create-runtime`,
            title: `Create runtime entity: ${entity.name}`,
            summary: 'This entity exists in the intended schema but not in the observed runtime schema.',
            priority: 'high',
            category: 'migration',
            actionType: 'create_entity_in_runtime',
            objectType: 'entity',
            objectId: entity.id,
            objectName: entity.name,
          });
        } else if (entityStatus === 'mismatch') {
          details.push({
            id: `entity:${entity.id}:update-runtime`,
            title: `Update runtime entity: ${entity.name}`,
            summary: 'Entity structure differs between intended and observed schema. Apply the intended changes to runtime and re-capture the observed snapshot.',
            priority: 'high',
            category: 'migration',
            actionType: 'update_entity_in_runtime',
            objectType: 'entity',
            objectId: entity.id,
            objectName: entity.name,
          });
        } else if (entityStatus === 'observed_only') {
          details.push({
            id: `entity:${entity.id}:review-observed-only`,
            title: `Review runtime-only entity: ${entity.name}`,
            summary: 'This entity only exists in the observed runtime schema. Decide whether to document it or remove it from runtime.',
            priority: 'medium',
            category: 'reconciliation',
            actionType: 'review_observed_only_entity',
            objectType: 'entity',
            objectId: entity.id,
            objectName: entity.name,
          });
        }
        fieldEntries.forEach((field) => {
          const fieldStatus = byDriftStatus(field.driftStatus);
          const actionType = fieldStatus === 'intended_only'
            ? 'add_field_in_runtime'
            : fieldStatus === 'observed_only'
              ? 'review_runtime_only_field'
              : 'update_field_in_runtime';
          details.push({
            id: `field:${entity.id}:${field.id}:${actionType}`,
            title: `${fieldStatus === 'intended_only' ? 'Add' : fieldStatus === 'observed_only' ? 'Review' : 'Update'} runtime field: ${entity.name}.${field.name}`,
            summary: fieldStatus === 'intended_only'
              ? 'The field is present in the intended schema but missing from the runtime schema.'
              : fieldStatus === 'observed_only'
                ? 'The field only exists in the observed runtime schema.'
                : 'The field exists on both sides but the definitions differ.',
            priority: fieldStatus === 'observed_only' ? 'medium' : 'high',
            category: fieldStatus === 'observed_only' ? 'reconciliation' : 'migration',
            actionType,
            objectType: 'field',
            objectId: field.id,
            objectName: `${entity.name}.${field.name}`,
          });
        });
      } else if (syncStatus === 'observed_ahead') {
        if (entityStatus === 'observed_only') {
          details.push({
            id: `entity:${entity.id}:document-observed`,
            title: `Document observed entity: ${entity.name}`,
            summary: 'This entity exists in runtime but not in the intended schema. Bring the design-side schema forward or explicitly reject the runtime change.',
            priority: 'high',
            category: 'documentation',
            actionType: 'document_entity_in_intended',
            objectType: 'entity',
            objectId: entity.id,
            objectName: entity.name,
          });
        } else if (entityStatus === 'mismatch' || entityStatus === 'intended_only') {
          details.push({
            id: `entity:${entity.id}:reconcile-docs`,
            title: `Reconcile intended entity: ${entity.name}`,
            summary: 'The runtime and intended definitions do not match. Update the intended schema or open a migration follow-up.',
            priority: 'high',
            category: 'documentation',
            actionType: 'reconcile_entity_in_intended',
            objectType: 'entity',
            objectId: entity.id,
            objectName: entity.name,
          });
        }
        fieldEntries.forEach((field) => {
          const fieldStatus = byDriftStatus(field.driftStatus);
          details.push({
            id: `field:${entity.id}:${field.id}:document`,
            title: `${fieldStatus === 'observed_only' ? 'Document' : 'Reconcile'} field: ${entity.name}.${field.name}`,
            summary: fieldStatus === 'observed_only'
              ? 'The runtime field is missing from the intended schema.'
              : 'The field differs between intended and observed schema and needs documentation-side reconciliation.',
            priority: 'medium',
            category: 'documentation',
            actionType: fieldStatus === 'observed_only' ? 'document_field_in_intended' : 'reconcile_field_in_intended',
            objectType: 'field',
            objectId: field.id,
            objectName: `${entity.name}.${field.name}`,
          });
        });
      } else if (entityStatus !== 'in_sync' || fieldEntries.length) {
        details.push({
          id: `entity:${entity.id}:manual-review`,
          title: `Manually review entity drift: ${entity.name}`,
          summary: 'Versions or content are out of alignment. Review this entity and its fields before applying a migration or overwriting documentation.',
          priority: 'high',
          category: 'reconciliation',
          actionType: 'manual_review_entity',
          objectType: 'entity',
          objectId: entity.id,
          objectName: entity.name,
        });
      }
      return details;
    });

    const relationshipItems = listFor(driftDetails.relationships).map((relationship) => ({
      id: `relationship:${relationship.id}:${syncStatus}`,
      title: `${syncStatus === 'intended_ahead' ? 'Align runtime relationship' : syncStatus === 'observed_ahead' ? 'Document observed relationship' : 'Review relationship drift'}: ${relationLabel(relationship)}`,
      summary: syncStatus === 'intended_ahead'
        ? 'The intended relationship has not been fully applied to the runtime schema.'
        : syncStatus === 'observed_ahead'
          ? 'The observed runtime relationship is ahead of the intended schema document.'
          : 'The relationship differs between intended and observed schema and needs manual review.',
      priority: 'medium',
      category: syncStatus === 'observed_ahead' ? 'documentation' : syncStatus === 'intended_ahead' ? 'migration' : 'reconciliation',
      actionType: syncStatus === 'observed_ahead' ? 'document_relationship' : syncStatus === 'intended_ahead' ? 'apply_relationship' : 'review_relationship',
      objectType: 'relationship',
      objectId: relationship.id,
      objectName: relationLabel(relationship),
    }));

    const indexItems = listFor(driftDetails.indexes).map((indexEntry) => ({
      id: `index:${indexEntry.id}:${syncStatus}`,
      title: `${syncStatus === 'observed_ahead' ? 'Document observed index' : syncStatus === 'intended_ahead' ? 'Apply runtime index' : 'Review index drift'}: ${indexEntry.name}`,
      summary: 'Index metadata differs between intended and observed schema.',
      priority: 'low',
      category: syncStatus === 'observed_ahead' ? 'documentation' : syncStatus === 'intended_ahead' ? 'migration' : 'reconciliation',
      actionType: syncStatus === 'observed_ahead' ? 'document_index' : syncStatus === 'intended_ahead' ? 'apply_index' : 'review_index',
      objectType: 'index',
      objectId: indexEntry.id,
      objectName: indexEntry.name,
    }));

    const constraintItems = listFor(driftDetails.constraints).map((constraint) => ({
      id: `constraint:${constraint.id}:${syncStatus}`,
      title: `${syncStatus === 'observed_ahead' ? 'Document observed constraint' : syncStatus === 'intended_ahead' ? 'Apply runtime constraint' : 'Review constraint drift'}: ${constraint.name}`,
      summary: 'Constraint metadata differs between intended and observed schema.',
      priority: 'medium',
      category: syncStatus === 'observed_ahead' ? 'documentation' : syncStatus === 'intended_ahead' ? 'migration' : 'reconciliation',
      actionType: syncStatus === 'observed_ahead' ? 'document_constraint' : syncStatus === 'intended_ahead' ? 'apply_constraint' : 'review_constraint',
      objectType: 'constraint',
      objectId: constraint.id,
      objectName: constraint.name,
    }));

    [...entityItems, ...relationshipItems, ...indexItems, ...constraintItems].forEach(pushItem);
    const deduped = [...new Map(items.map((item) => [item.id, item])).values()];
    return deduped.sort((left, right) => {
      const priorityCompare = (priorityRank[left.priority] ?? 99) - (priorityRank[right.priority] ?? 99);
      if (priorityCompare !== 0) return priorityCompare;
      return String(left.title || '').localeCompare(String(right.title || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  function appendDatabaseSchemaSyncAuditEntry(syncTracking, entry) {
    const existing = Array.isArray(syncTracking?.auditHistory) ? syncTracking.auditHistory : [];
    const nextEntry = {
      id: entry?.id || `schema-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: entry?.timestamp || new Date().toISOString(),
      action: String(entry?.action || '').trim(),
      changeSource: String(entry?.changeSource || '').trim(),
      fromSyncStatus: String(entry?.fromSyncStatus || '').trim(),
      toSyncStatus: String(entry?.toSyncStatus || '').trim(),
      summary: String(entry?.summary || '').trim(),
    };
    return [nextEntry, ...existing].slice(0, 25);
  }

  function compareDatabaseSchemaSyncState(editorState) {
    const normalized = normalizeDatabaseSchemaStateEditorState(null, editorState);
    const syncTracking = normalizeDatabaseSchemaSyncTracking(normalized.syncTracking);
    const intendedHash = computeDatabaseSchemaModelHash(normalized.schemaModel);
    const observedHash = computeDatabaseSchemaModelHash(normalized.observedSchemaModel);
    const intendedVersion = syncTracking.intendedVersion;
    const observedVersion = syncTracking.observedVersion;
    const intendedPresent = !!intendedHash;
    const observedPresent = !!observedHash;

    let syncStatus = 'unverified';
    let driftSeverity = 'low';
    let pendingMigrationStatus = 'comparison_required';
    let recommendedAction = 'capture_or_compare';
    let actionSummary = 'Capture an observed schema or define the intended schema to begin tracking drift.';
    let driftSummary = 'No schema comparison has been recorded yet.';
    const driftDetails = computeDatabaseSchemaDriftDetails(normalized.schemaModel, normalized.observedSchemaModel);

    if (intendedPresent && observedPresent) {
      if (intendedVersion === observedVersion && intendedHash === observedHash) {
        syncStatus = 'in_sync';
        driftSeverity = 'low';
        pendingMigrationStatus = 'none';
        recommendedAction = 'none';
        actionSummary = 'No migration work is currently required.';
        driftSummary = 'Intended schema and observed schema are aligned.';
      } else if (intendedVersion === observedVersion && intendedHash !== observedHash) {
        syncStatus = 'version_match_content_mismatch';
        driftSeverity = 'high';
        pendingMigrationStatus = 'manual_reconciliation_required';
        recommendedAction = 'review_drift_and_reconcile';
        actionSummary = 'Versions match, but content differs. Review drift details before applying migrations or consuming fragments.';
        driftSummary = 'Intended and observed schemas share the same version but differ in content.';
      } else if (intendedVersion > observedVersion) {
        syncStatus = 'intended_ahead';
        driftSeverity = 'medium';
        pendingMigrationStatus = 'migration_required';
        recommendedAction = 'apply_intended_to_runtime';
        actionSummary = 'Apply the intended schema changes to the runtime database, then capture a new observed schema snapshot.';
        driftSummary = 'Intended schema is ahead of the observed runtime schema.';
      } else if (observedVersion > intendedVersion) {
        syncStatus = 'observed_ahead';
        driftSeverity = 'medium';
        pendingMigrationStatus = 'documentation_update_required';
        recommendedAction = 'reconcile_runtime_to_intended';
        actionSummary = 'Update the intended schema documentation to match the runtime database, or create/consume fragments that explain the runtime changes.';
        driftSummary = 'Observed runtime schema is ahead of the intended schema document.';
      } else if (intendedHash !== observedHash) {
        syncStatus = 'partial_mismatch';
        driftSeverity = 'high';
        pendingMigrationStatus = 'manual_reconciliation_required';
        recommendedAction = 'review_drift_and_reconcile';
        actionSummary = 'Some schema objects are aligned while others are not. Review the per-object drift list and reconcile the differences.';
        driftSummary = 'Intended and observed schemas differ and need reconciliation.';
      }
    } else if (intendedPresent && !observedPresent) {
      syncStatus = 'intended_ahead';
      driftSeverity = 'medium';
      pendingMigrationStatus = 'observation_required';
      recommendedAction = 'capture_runtime_schema';
      actionSummary = 'Capture the runtime schema to compare it against the intended design.';
      driftSummary = 'Intended schema exists, but no observed runtime schema snapshot has been captured yet.';
    } else if (!intendedPresent && observedPresent) {
      syncStatus = 'observed_ahead';
      driftSeverity = 'medium';
      pendingMigrationStatus = 'documentation_required';
      recommendedAction = 'define_intended_schema';
      actionSummary = 'Document the intended schema so the observed runtime snapshot has a design-side counterpart.';
      driftSummary = 'Observed runtime schema exists, but intended schema has not been documented yet.';
    }

    const actionItems = buildDatabaseSchemaActionItems({
      syncStatus,
      driftDetails,
      intendedPresent,
      observedPresent,
    });

    return {
      ...syncTracking,
      intendedHash,
      observedHash,
      syncStatus,
      driftSeverity,
      pendingMigrationStatus,
      recommendedAction,
      actionSummary,
      lastComparedAt: new Date().toISOString(),
      driftSummary,
      driftDetails,
      actionItems,
      auditHistory: Array.isArray(syncTracking.auditHistory) ? syncTracking.auditHistory : [],
    };
  }

  function buildDatabaseSchemaNarrativeStateFromModel(schemaModel, existingState) {
    const model = schemaModel && typeof schemaModel === 'object' ? schemaModel : {};
    const entities = Array.isArray(model.entities) ? model.entities : [];
    const relationships = Array.isArray(model.relationships) ? model.relationships : [];
    const indexes = Array.isArray(model.indexes) ? model.indexes : [];
    const constraints = Array.isArray(model.constraints) ? model.constraints : [];
    return {
      ...existingState,
      entities: entities.map((entity) => buildSchemaDetailEntry(
        `${entity.name || entity.id || 'Unnamed entity'}${entity.kind ? ` (${entity.kind})` : ''}`,
        [
          entity.notes || '',
          ...(Array.isArray(entity.fields) ? entity.fields : []).map((field) => {
            const facts = stringifyFieldFacts(field);
            return `- ${field.name || field.id || 'field'}${facts.length ? `: ${facts.join('; ')}` : ''}${field.notes ? ` (${field.notes})` : ''}`;
          }),
        ].filter(Boolean).join('\n')
      )),
      relationships: relationships.map((relationship) => buildSchemaDetailEntry(
        relationship.id || `${relationship.fromEntityId || 'unknown'} -> ${relationship.toEntityId || 'unknown'}`,
        [
          `From: ${relationship.fromEntityId || '?'}${relationship.fromFieldId ? `.${relationship.fromFieldId}` : ''}`,
          `To: ${relationship.toEntityId || '?'}${relationship.toFieldId ? `.${relationship.toFieldId}` : ''}`,
          relationship.cardinality ? `Cardinality: ${relationship.cardinality}` : '',
          relationship.status ? `Status: ${relationship.status}` : '',
          relationship.notes || '',
        ].filter(Boolean).join('\n')
      )),
      indexes: indexes.map((index) => buildSchemaDetailEntry(
        index.name || index.id || 'Unnamed index',
        [
          `Entity: ${index.entityId || 'unknown'}`,
          Array.isArray(index.fields) && index.fields.length ? `Fields: ${index.fields.join(', ')}` : '',
          index.unique !== undefined && index.unique !== null ? `Unique: ${index.unique ? 'yes' : 'no'}` : '',
          index.status ? `Status: ${index.status}` : '',
          index.notes || '',
        ].filter(Boolean).join('\n')
      )),
      constraints: constraints.map((constraint) => buildSchemaDetailEntry(
        constraint.name || constraint.id || 'Unnamed constraint',
        [
          `Entity: ${constraint.entityId || 'unknown'}`,
          constraint.type ? `Type: ${constraint.type}` : '',
          constraint.definition ? `Definition: ${constraint.definition}` : '',
          constraint.status ? `Status: ${constraint.status}` : '',
          constraint.notes || '',
        ].filter(Boolean).join('\n')
      )),
      migrations: Array.isArray(model.migrationNotes)
        ? model.migrationNotes.map((note) => buildSchemaDetailEntry(
            note.title || 'Migration note',
            [
              note.description || '',
              note.status ? `Status: ${note.status}` : '',
            ].filter(Boolean).join('\n')
          ))
        : existingState.migrations,
      openQuestions: Array.isArray(model.openQuestions)
        ? model.openQuestions.map((question) => buildSchemaDetailEntry(
            question.id || question.question || 'Open question',
            [
              question.question || '',
              question.impact ? `Impact: ${question.impact}` : '',
              question.proposedFollowUp ? `Follow-up: ${question.proposedFollowUp}` : '',
            ].filter(Boolean).join('\n')
          ))
        : existingState.openQuestions,
      dbml: String(existingState.dbml || ''),
      schemaModel: model,
    };
  }

  function applyIntendedSchemaVersioning(project, existingState, draftState) {
    const currentState = normalizeDatabaseSchemaStateEditorState(project, existingState);
    const nextState = normalizeDatabaseSchemaStateEditorState(project, {
      ...currentState,
      ...draftState,
      overview: {
        ...currentState.overview,
        ...(draftState?.overview && typeof draftState.overview === 'object' ? draftState.overview : {}),
      },
      schemaModel: draftState?.schemaModel && typeof draftState.schemaModel === 'object'
        ? draftState.schemaModel
        : currentState.schemaModel,
      observedSchemaModel: draftState?.observedSchemaModel && typeof draftState.observedSchemaModel === 'object'
        ? draftState.observedSchemaModel
        : currentState.observedSchemaModel,
      importSource: draftState?.importSource !== undefined ? draftState.importSource : currentState.importSource,
      syncTracking: {
        ...currentState.syncTracking,
        ...(draftState?.syncTracking && typeof draftState.syncTracking === 'object' ? draftState.syncTracking : {}),
      },
    });
    const previousSync = normalizeDatabaseSchemaSyncTracking(currentState.syncTracking);
    const nextIntendedHash = computeDatabaseSchemaModelHash(nextState.schemaModel);
    const intendedChanged = nextIntendedHash !== previousSync.intendedHash;
    const nextIntendedVersion = nextIntendedHash
      ? (intendedChanged ? Math.max(previousSync.intendedVersion, 0) + 1 : previousSync.intendedVersion)
      : 0;
    nextState.syncTracking = compareDatabaseSchemaSyncState({
      ...nextState,
      syncTracking: {
        ...previousSync,
        intendedVersion: nextIntendedVersion,
        changeSource: 'intended_edit',
        intendedUpdatedAt: intendedChanged && nextIntendedHash ? new Date().toISOString() : previousSync.intendedUpdatedAt,
      },
    });
    if (intendedChanged) {
      nextState.syncTracking.auditHistory = appendDatabaseSchemaSyncAuditEntry(nextState.syncTracking, {
        action: 'intended_schema_updated',
        changeSource: 'intended_edit',
        fromSyncStatus: previousSync.syncStatus,
        toSyncStatus: nextState.syncTracking.syncStatus,
        summary: `Updated intended schema to version ${nextState.syncTracking.intendedVersion}.`,
      });
    }
    return nextState;
  }

  function applyObservedSchemaImport(project, existingState, importedState) {
    const currentState = normalizeDatabaseSchemaStateEditorState(project, existingState);
    const importedEditorState = normalizeDatabaseSchemaStateEditorState(project, importedState);
    const previousSync = normalizeDatabaseSchemaSyncTracking(currentState.syncTracking);
    const nextState = {
      ...currentState,
      importSource: importedEditorState.importSource || currentState.importSource,
      observedSchemaModel: importedEditorState.schemaModel,
      syncTracking: previousSync,
    };

    if (!hasSchemaModelContent(currentState.schemaModel)) {
      nextState.overview = importedEditorState.overview;
      nextState.entities = importedEditorState.entities;
      nextState.relationships = importedEditorState.relationships;
      nextState.constraints = importedEditorState.constraints;
      nextState.indexes = importedEditorState.indexes;
      nextState.migrations = importedEditorState.migrations;
      nextState.synchronizationRules = importedEditorState.synchronizationRules;
      nextState.openQuestions = importedEditorState.openQuestions;
      nextState.dbml = importedEditorState.dbml;
      nextState.schemaModel = importedEditorState.schemaModel;
    }

    const nextObservedHash = computeDatabaseSchemaModelHash(importedEditorState.schemaModel);
    const observedChanged = nextObservedHash !== previousSync.observedHash;
    const nextObservedVersion = nextObservedHash
      ? (observedChanged ? Math.max(previousSync.observedVersion, 0) + 1 : previousSync.observedVersion)
      : 0;

    const seededIntended = !previousSync.intendedHash && hasSchemaModelContent(nextState.schemaModel);
    const nextIntendedHash = computeDatabaseSchemaModelHash(nextState.schemaModel);
    const nextIntendedVersion = seededIntended
      ? Math.max(previousSync.intendedVersion, 0) + 1
      : previousSync.intendedVersion;

    nextState.syncTracking = compareDatabaseSchemaSyncState({
      ...nextState,
      syncTracking: {
        ...previousSync,
        intendedVersion: nextIntendedVersion,
        observedVersion: nextObservedVersion,
        changeSource: 'observed_import',
        intendedUpdatedAt: seededIntended ? new Date().toISOString() : previousSync.intendedUpdatedAt,
        observedCapturedAt: importedEditorState.importSource?.observedAt || new Date().toISOString(),
      },
    });
    if (observedChanged || seededIntended) {
      nextState.syncTracking.auditHistory = appendDatabaseSchemaSyncAuditEntry(nextState.syncTracking, {
        action: 'observed_schema_captured',
        changeSource: 'observed_import',
        fromSyncStatus: previousSync.syncStatus,
        toSyncStatus: nextState.syncTracking.syncStatus,
        summary: `Captured observed schema at version ${nextState.syncTracking.observedVersion}${seededIntended ? ' and seeded the intended schema.' : '.'}`,
      });
    }
    return nextState;
  }

  function applyDatabaseSchemaSyncAction(project, existingState, actionType) {
    const currentState = normalizeDatabaseSchemaStateEditorState(project, existingState);
    const previousSync = normalizeDatabaseSchemaSyncTracking(currentState.syncTracking);
    const now = new Date().toISOString();
    const normalizedAction = String(actionType || '').trim().toLowerCase();

    if (normalizedAction === 'refresh_comparison') {
      const nextSync = compareDatabaseSchemaSyncState(currentState);
      nextSync.auditHistory = appendDatabaseSchemaSyncAuditEntry(nextSync, {
        action: 'refresh_comparison',
        changeSource: previousSync.changeSource || 'unknown',
        fromSyncStatus: previousSync.syncStatus,
        toSyncStatus: nextSync.syncStatus,
        summary: 'Recompared intended and observed schema state.',
      });
      return {
        ...currentState,
        syncTracking: nextSync,
      };
    }

    if (normalizedAction === 'mark_runtime_updated') {
      if (!hasSchemaModelContent(currentState.schemaModel)) {
        throw new Error('Cannot mark runtime updated without an intended schema.');
      }
      const nextState = {
        ...currentState,
        observedSchemaModel: currentState.schemaModel,
      };
      const nextSync = compareDatabaseSchemaSyncState({
        ...nextState,
        syncTracking: {
          ...previousSync,
          observedVersion: Math.max(previousSync.observedVersion, previousSync.intendedVersion),
          changeSource: 'migration_applied',
          observedCapturedAt: now,
        },
      });
      nextSync.auditHistory = appendDatabaseSchemaSyncAuditEntry(nextSync, {
        action: 'mark_runtime_updated',
        changeSource: 'migration_applied',
        fromSyncStatus: previousSync.syncStatus,
        toSyncStatus: nextSync.syncStatus,
        summary: `Marked runtime schema as updated from intended version ${nextSync.intendedVersion}.`,
      });
      return {
        ...nextState,
        syncTracking: nextSync,
      };
    }

    if (normalizedAction === 'adopt_observed_as_intended') {
      if (!hasSchemaModelContent(currentState.observedSchemaModel)) {
        throw new Error('Cannot adopt observed schema without an observed snapshot.');
      }
      const adoptedModel = currentState.observedSchemaModel;
      const nextState = buildDatabaseSchemaNarrativeStateFromModel(adoptedModel, {
        ...currentState,
        schemaModel: adoptedModel,
        dbml: currentState.dbml,
      });
      const nextSync = compareDatabaseSchemaSyncState({
        ...nextState,
        syncTracking: {
          ...previousSync,
          intendedVersion: Math.max(previousSync.intendedVersion, previousSync.observedVersion),
          changeSource: 'intended_edit',
          intendedUpdatedAt: now,
        },
      });
      nextSync.auditHistory = appendDatabaseSchemaSyncAuditEntry(nextSync, {
        action: 'adopt_observed_as_intended',
        changeSource: 'intended_edit',
        fromSyncStatus: previousSync.syncStatus,
        toSyncStatus: nextSync.syncStatus,
        summary: `Adopted observed schema into the intended design at version ${nextSync.intendedVersion}.`,
      });
      return {
        ...nextState,
        syncTracking: nextSync,
      };
    }

    throw new Error(`Unsupported database schema sync action: ${actionType}`);
  }

  function buildSchemaDetailEntry(title, description) {
    return {
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      versionDate: new Date().toISOString(),
    };
  }

  function stringifyFieldFacts(field = {}) {
    const facts = [];
    if (field.type) facts.push(`Type: ${field.type}`);
    if (field.nullable !== undefined && field.nullable !== null && field.nullable !== '') facts.push(`Nullable: ${field.nullable ? 'yes' : 'no'}`);
    if (field.primaryKey) facts.push('Primary key');
    if (field.unique) facts.push('Unique');
    if (field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== '') {
      facts.push(`Default: ${String(field.defaultValue).trim()}`);
    }
    if (field.referencesEntityId && field.referencesFieldId) {
      facts.push(`References: ${field.referencesEntityId}.${field.referencesFieldId}`);
    }
    return facts;
  }

  function validateDatabaseSchemaFragmentDocument(markdown) {
    const text = String(markdown || '');
    if (!text.trim()) {
      throw new Error('Database schema fragment is empty.');
    }
    if (!/> Managed document\. Must comply with template DATABASE_SCHEMA_FRAGMENT\.template\.md\./.test(text)) {
      throw new Error('Database schema fragment must include the required compliance note for DATABASE_SCHEMA_FRAGMENT.template.md.');
    }

    const requiredSections = [
      '## Import Summary',
      '## Source Metadata',
      '## Observed Schema Summary',
      '## Entities',
      '## Relationships',
      '## Indexes and Constraints',
      '## Migration Notes',
      '## Open Questions',
      '## DBML',
      '## Mermaid',
      '## Merge Guidance',
    ];
    let lastIndex = -1;
    for (const section of requiredSections) {
      const index = text.indexOf(section);
      if (index === -1) {
        throw new Error(`Database schema fragment is missing required section: ${section}.`);
      }
      if (index < lastIndex) {
        throw new Error(`Database schema fragment sections are out of order near: ${section}.`);
      }
      lastIndex = index;
    }
    if (!/## DBML[\s\S]*```dbml[\s\S]+?```/i.test(text)) {
      throw new Error('Database schema fragment must include a valid ## DBML fenced block.');
    }
    if (!/## Mermaid[\s\S]*```mermaid[\s\S]+?```/i.test(text)) {
      throw new Error('Database schema fragment must include a valid ## Mermaid fenced block.');
    }

    const managed = parseManagedBlock(text);
    if (!managed || managed.docType !== 'database_schema_fragment') {
      throw new Error('Database schema fragment is missing a valid managed block with docType "database_schema_fragment".');
    }
    if (!managed.fragment || typeof managed.fragment !== 'object') {
      throw new Error('Database schema fragment managed block must include a fragment object.');
    }
    const payload = managed.fragment.payload;
    if (!payload || typeof payload !== 'object') {
      throw new Error('Database schema fragment managed block must include fragment.payload.');
    }

    const requireString = (value, label) => {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Database schema fragment requires ${label} to be a non-empty string.`);
      }
    };
    const requireOptionalString = (value, label) => {
      if (value !== undefined && value !== null && typeof value !== 'string') {
        throw new Error(`Database schema fragment requires ${label} to be a string when provided.`);
      }
    };
    const requireArray = (value, label) => {
      if (!Array.isArray(value)) {
        throw new Error(`Database schema fragment requires ${label} to be an array.`);
      }
    };

    const source = payload.source;
    if (!source || typeof source !== 'object') {
      throw new Error('Database schema fragment requires payload.source.');
    }
    const allowedSourceTypes = new Set(['sqlite_database', 'schema_sql', 'dbml', 'migration_files', 'orm_code', 'mixed']);
    const allowedConfidence = new Set(['observed', 'mixed', 'inferred']);
    requireString(source.sourceType, 'payload.source.sourceType');
    if (!allowedSourceTypes.has(source.sourceType)) {
      throw new Error(`Database schema fragment sourceType "${source.sourceType}" is not allowed.`);
    }
    requireString(source.sourceLabel, 'payload.source.sourceLabel');
    requireString(source.dialect, 'payload.source.dialect');
    requireOptionalString(source.observedAt, 'payload.source.observedAt');
    requireString(source.schemaFingerprint, 'payload.source.schemaFingerprint');
    requireString(source.confidence, 'payload.source.confidence');
    if (!allowedConfidence.has(source.confidence)) {
      throw new Error(`Database schema fragment confidence "${source.confidence}" is not allowed.`);
    }

    requireString(payload.summary, 'payload.summary');
    requireArray(payload.entities, 'payload.entities');
    requireArray(payload.relationships, 'payload.relationships');
    requireArray(payload.indexes, 'payload.indexes');
    requireArray(payload.constraints, 'payload.constraints');
    requireArray(payload.migrationNotes, 'payload.migrationNotes');
    requireArray(payload.openQuestions, 'payload.openQuestions');
    requireString(payload.dbml, 'payload.dbml');
    requireString(payload.mermaid, 'payload.mermaid');

    payload.entities.forEach((entity, index) => {
      if (!entity || typeof entity !== 'object') throw new Error(`Database schema fragment entity[${index}] must be an object.`);
      requireString(entity.id, `payload.entities[${index}].id`);
      requireString(entity.name, `payload.entities[${index}].name`);
      requireString(entity.kind, `payload.entities[${index}].kind`);
      requireString(entity.status, `payload.entities[${index}].status`);
      requireOptionalString(entity.notes, `payload.entities[${index}].notes`);
      requireArray(entity.fields, `payload.entities[${index}].fields`);
      entity.fields.forEach((field, fieldIndex) => {
        if (!field || typeof field !== 'object') throw new Error(`Database schema fragment field[${index}][${fieldIndex}] must be an object.`);
        requireString(field.id, `payload.entities[${index}].fields[${fieldIndex}].id`);
        requireString(field.name, `payload.entities[${index}].fields[${fieldIndex}].name`);
        requireString(field.type, `payload.entities[${index}].fields[${fieldIndex}].type`);
        requireOptionalString(field.defaultValue, `payload.entities[${index}].fields[${fieldIndex}].defaultValue`);
        requireOptionalString(field.referencesEntityId, `payload.entities[${index}].fields[${fieldIndex}].referencesEntityId`);
        requireOptionalString(field.referencesFieldId, `payload.entities[${index}].fields[${fieldIndex}].referencesFieldId`);
        requireString(field.status, `payload.entities[${index}].fields[${fieldIndex}].status`);
        requireOptionalString(field.notes, `payload.entities[${index}].fields[${fieldIndex}].notes`);
        if (field.nullable !== '' && field.nullable !== undefined && field.nullable !== null && typeof field.nullable !== 'boolean') {
          throw new Error(`Database schema fragment field ${field.name} nullable must be boolean when provided.`);
        }
        if (field.primaryKey !== '' && field.primaryKey !== undefined && field.primaryKey !== null && typeof field.primaryKey !== 'boolean') {
          throw new Error(`Database schema fragment field ${field.name} primaryKey must be boolean when provided.`);
        }
        if (field.unique !== '' && field.unique !== undefined && field.unique !== null && typeof field.unique !== 'boolean') {
          throw new Error(`Database schema fragment field ${field.name} unique must be boolean when provided.`);
        }
      });
    });

    payload.relationships.forEach((relationship, index) => {
      if (!relationship || typeof relationship !== 'object') throw new Error(`Database schema fragment relationship[${index}] must be an object.`);
      requireString(relationship.id, `payload.relationships[${index}].id`);
      requireString(relationship.fromEntityId, `payload.relationships[${index}].fromEntityId`);
      requireString(relationship.fromFieldId, `payload.relationships[${index}].fromFieldId`);
      requireString(relationship.toEntityId, `payload.relationships[${index}].toEntityId`);
      requireString(relationship.toFieldId, `payload.relationships[${index}].toFieldId`);
      requireString(relationship.cardinality, `payload.relationships[${index}].cardinality`);
      requireString(relationship.status, `payload.relationships[${index}].status`);
      requireOptionalString(relationship.notes, `payload.relationships[${index}].notes`);
    });

    payload.indexes.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') throw new Error(`Database schema fragment index[${index}] must be an object.`);
      requireString(entry.id, `payload.indexes[${index}].id`);
      requireString(entry.entityId, `payload.indexes[${index}].entityId`);
      requireString(entry.name, `payload.indexes[${index}].name`);
      requireArray(entry.fields, `payload.indexes[${index}].fields`);
      requireString(entry.status, `payload.indexes[${index}].status`);
      requireOptionalString(entry.notes, `payload.indexes[${index}].notes`);
      if (entry.unique !== '' && entry.unique !== undefined && entry.unique !== null && typeof entry.unique !== 'boolean') {
        throw new Error(`Database schema fragment index ${entry.name} unique must be boolean when provided.`);
      }
    });

    payload.constraints.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') throw new Error(`Database schema fragment constraint[${index}] must be an object.`);
      requireString(entry.id, `payload.constraints[${index}].id`);
      requireString(entry.entityId, `payload.constraints[${index}].entityId`);
      requireString(entry.name, `payload.constraints[${index}].name`);
      requireString(entry.type, `payload.constraints[${index}].type`);
      requireString(entry.definition, `payload.constraints[${index}].definition`);
      requireString(entry.status, `payload.constraints[${index}].status`);
      requireOptionalString(entry.notes, `payload.constraints[${index}].notes`);
    });

    payload.migrationNotes.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') throw new Error(`Database schema fragment migrationNotes[${index}] must be an object.`);
      requireString(entry.title, `payload.migrationNotes[${index}].title`);
      requireString(entry.description, `payload.migrationNotes[${index}].description`);
      requireString(entry.status, `payload.migrationNotes[${index}].status`);
    });

    payload.openQuestions.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') throw new Error(`Database schema fragment openQuestions[${index}] must be an object.`);
      requireString(entry.id, `payload.openQuestions[${index}].id`);
      requireString(entry.question, `payload.openQuestions[${index}].question`);
      requireString(entry.impact, `payload.openQuestions[${index}].impact`);
      requireString(entry.proposedFollowUp, `payload.openQuestions[${index}].proposedFollowUp`);
    });

    return { managed, payload };
  }

  function buildDatabaseSchemaEditorStateFromFragment(project, fragmentDoc) {
    const { managed, payload: fragmentPayload } = validateDatabaseSchemaFragmentDocument(fragmentDoc.markdown || '');

    const nextState = defaultDatabaseSchemaEditorState(project);
    const source = normalizeSchemaImportSource(fragmentPayload.source || {});
    const entities = Array.isArray(fragmentPayload.entities) ? fragmentPayload.entities : [];
    const relationships = Array.isArray(fragmentPayload.relationships) ? fragmentPayload.relationships : [];
    const indexes = Array.isArray(fragmentPayload.indexes) ? fragmentPayload.indexes : [];
    const constraints = Array.isArray(fragmentPayload.constraints) ? fragmentPayload.constraints : [];
    const migrationNotes = Array.isArray(fragmentPayload.migrationNotes) ? fragmentPayload.migrationNotes : [];
    const openQuestions = Array.isArray(fragmentPayload.openQuestions) ? fragmentPayload.openQuestions : [];

    nextState.importSource = source;
    nextState.overview.purpose = String(fragmentPayload.summary || `Imported schema fragment for ${project.name}.`);
    nextState.overview.storageStrategy = [
      source.dialect ? `Primary dialect: ${source.dialect}.` : '',
      source.sourceType ? `Imported from ${source.sourceType.replace(/_/g, ' ')}.` : '',
      source.confidence ? `Confidence: ${source.confidence}.` : '',
    ].filter(Boolean).join(' ');
    nextState.overview.versionDate = new Date().toISOString();
    nextState.entities = entities.map((entity) => buildSchemaDetailEntry(
      `${entity.name || entity.id || 'Unnamed entity'}${entity.kind ? ` (${entity.kind})` : ''}`,
      [
        entity.notes || '',
        ...(Array.isArray(entity.fields) ? entity.fields : []).map((field) => {
          const facts = stringifyFieldFacts(field);
          return `- ${field.name || field.id || 'field'}${facts.length ? `: ${facts.join('; ')}` : ''}${field.notes ? ` (${field.notes})` : ''}`;
        }),
      ].filter(Boolean).join('\n')
    ));
    nextState.relationships = relationships.map((relationship) => buildSchemaDetailEntry(
      relationship.id || `${relationship.fromEntityId || 'unknown'} -> ${relationship.toEntityId || 'unknown'}`,
      [
        `From: ${relationship.fromEntityId || '?'}${relationship.fromFieldId ? `.${relationship.fromFieldId}` : ''}`,
        `To: ${relationship.toEntityId || '?'}${relationship.toFieldId ? `.${relationship.toFieldId}` : ''}`,
        relationship.cardinality ? `Cardinality: ${relationship.cardinality}` : '',
        relationship.status ? `Status: ${relationship.status}` : '',
        relationship.notes || '',
      ].filter(Boolean).join('\n')
    ));
    nextState.indexes = indexes.map((index) => buildSchemaDetailEntry(
      index.name || index.id || 'Unnamed index',
      [
        `Entity: ${index.entityId || 'unknown'}`,
        Array.isArray(index.fields) && index.fields.length ? `Fields: ${index.fields.join(', ')}` : '',
        index.unique !== undefined && index.unique !== null ? `Unique: ${index.unique ? 'yes' : 'no'}` : '',
        index.status ? `Status: ${index.status}` : '',
        index.notes || '',
      ].filter(Boolean).join('\n')
    ));
    nextState.constraints = constraints.map((constraint) => buildSchemaDetailEntry(
      constraint.name || constraint.id || 'Unnamed constraint',
      [
        `Entity: ${constraint.entityId || 'unknown'}`,
        constraint.type ? `Type: ${constraint.type}` : '',
        constraint.definition ? `Definition: ${constraint.definition}` : '',
        constraint.status ? `Status: ${constraint.status}` : '',
        constraint.notes || '',
      ].filter(Boolean).join('\n')
    ));
    nextState.migrations = migrationNotes.map((note) => buildSchemaDetailEntry(
      note.title || 'Migration note',
      [
        note.description || '',
        note.status ? `Status: ${note.status}` : '',
      ].filter(Boolean).join('\n')
    ));
    nextState.openQuestions = openQuestions.map((question) => buildSchemaDetailEntry(
      question.id || question.question || 'Open question',
      [
        question.question || '',
        question.impact ? `Impact: ${question.impact}` : '',
        question.proposedFollowUp ? `Follow-up: ${question.proposedFollowUp}` : '',
      ].filter(Boolean).join('\n')
    ));
    nextState.synchronizationRules = [
      buildSchemaDetailEntry('Database-first schema model', 'The manager database becomes the source of truth after this fragment is merged or imported.'),
      buildSchemaDetailEntry('Generated artifacts', 'Regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml from the stored schema model when files are missing or stale.'),
      buildSchemaDetailEntry('Imported fragment provenance', `Imported from ${source.sourceLabel || 'uploaded fragment'} (${source.sourceType || 'mixed'}).`),
    ];
    nextState.dbml = String(fragmentPayload.dbml || '').trim();
    nextState.schemaModel = {
      source,
      summary: String(fragmentPayload.summary || ''),
      entities,
      relationships,
      indexes,
      constraints,
      migrationNotes,
      openQuestions,
      mermaid: String(fragmentPayload.mermaid || '').trim(),
    };
    return {
      editorState: nextState,
      fragmentPayload,
      fragmentManaged: managed.fragment || null,
    };
  }

  async function syncDatabaseSchemaDocument(project, options = {}) {
    config.log(`phase5: syncing database schema document for project ${project.id}`);
    if (!options.skipImport) {
      await maybeImportDocumentFile(project, 'database_schema', (targetProject, fileSnapshot) => importStructuredModuleDocumentFromFile(targetProject, fileSnapshot, 'database_schema', defaultDatabaseSchemaMermaid));
    }
    const state = await buildDatabaseSchemaState(project);
    const markdownBody = renderDatabaseSchemaEditorStateMarkdown(project, state.editorState);
    const markdown = renderDatabaseSchemaMarkdown(project, markdownBody, state.mermaid, state.editorState);
    const syncResult = await finalizeDocumentSync(project, 'database_schema', markdown, {
      markdown: markdownBody,
      mermaid: state.mermaid,
      editorState: state.editorState,
    });
    writeDatabaseSchemaDbmlFile(project, state.dbml);
    config.log(`phase5: database schema document synced for project ${project.id} at ${(syncResult.fileSnapshot && syncResult.fileSnapshot.docPath) || 'no-file'}`);
    return state;
  }

  async function syncRoadmapDependentDocuments(project, options = {}) {
    const roadmapState = await syncRoadmapDocument(project, options);
    const roadmapFragment = await upsertRoadmapPrdFragment(project, {
      phases: roadmapState.phases,
      features: roadmapState.features,
      bugs: roadmapState.bugs,
    });
    if (roadmapFragment) {
      await syncPrdDocument(project, options);
    }
    return roadmapState;
  }

  async function removeWorkspacePluginArtifacts(project, pluginId, clearGenerated) {
    if (!clearGenerated) return;
    const normalized = String(pluginId || '').trim().toLowerCase();
    if (normalized === 'bugs') {
      const bugs = await readBugItems(project.id, { includeArchived: true });
      for (const bug of bugs) await deleteBugItem(project.id, bug.id);
      await deleteProjectDocument(project.id, 'bugs');
    } else if (normalized === 'features') {
      const features = await readFeatureItems(project.id, { includeArchived: true });
      for (const feature of features) await deleteFeatureItem(project.id, feature.id);
      const fragments = await readPrdFragments(project.id, { includeMerged: true });
      for (const fragment of fragments) {
        if (fragment.featureId) {
          await deletePrdFragment(project.id, fragment.id);
          try {
            if (fragment.filePath && fs.existsSync(fragment.filePath)) fs.unlinkSync(fragment.filePath);
          } catch (_) {}
        }
      }
      await deleteProjectDocument(project.id, 'features');
    } else if (normalized === 'prd') {
      await deleteProjectDocument(project.id, 'prd');
    }

    try {
      const docPath = getProjectDocPath(project, normalized);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    } catch (_) {}
  }

  async function removeProjectModuleArtifacts(project, moduleKey, clearGenerated) {
    const normalized = String(moduleKey || '').trim().toLowerCase();
    if (['bugs', 'features', 'prd'].includes(normalized)) {
      await removeWorkspacePluginArtifacts(project, normalized, clearGenerated);
      return;
    }
    if (!clearGenerated) return;
    if (['architecture', 'database_schema', 'ai_environment'].includes(normalized)) {
      const docType = normalized === 'database_schema' ? 'database_schema' : normalized;
      await deleteProjectDocument(project.id, docType);
      try {
        const docPath = getProjectDocPath(project, docType);
        if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
        if (normalized === 'database_schema') {
          const dbmlPath = path.join(ensureProjectDocsDir(project), 'DATABASE_SCHEMA.dbml');
          if (fs.existsSync(dbmlPath)) fs.unlinkSync(dbmlPath);
        }
      } catch (_) {}
    }
  }

  const routeContext = {
    fs,
    path,
    config,
    normalizeLinks,
    defaultMappingGroups,
    normalizeMappingGroups,
    normalizeProjectPrimaryAction,
    normalizeWorkspacePlugins,
    normalizeProjectIntegrations,
    normalizeTaskPayload,
    normalizeProjectType,
    listProjectTypes,
    buildModuleRegistry,
    moduleKeysToLegacyWorkspacePlugins,
    resolveEnabledModuleSelection,
    readProjects,
    getProjectById,
    saveProject,
    deleteProject,
    readProjectModules,
    readProjectTasks,
    readProjectWorkItems,
    getTaskById,
    getWorkItemById,
    nextTaskSortOrder,
    saveTask,
    deleteTask,
    getRoadmapPhaseById,
    nextRoadmapPhaseSortOrder,
    saveRoadmapPhase,
    deleteRoadmapPhase,
    readRoadmapFragments,
    getRoadmapFragmentById,
    saveRoadmapFragment,
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
    saveProjectDocument,
    readEntityRelationships,
    saveEntityRelationship,
    deleteEntityRelationship,
    saveAppSettings,
    buildSettingsResponse,
    fileWatcherService,
    updateProjectRoot,
    updateDataDir,
    updateLogsDir,
    sanitizeProject,
    normalizeRequestedProjectType,
    ensureWorkspaceProject,
    removeWorkspacePluginArtifacts,
    removeProjectModuleArtifacts,
    upsertPrdFragmentForFeature,
    syncPrdFragmentsForProject,
    cleanupMergedPrdFragmentFiles,
    syncRoadmapFragmentsForProject,
    applyRoadmapFragment,
    syncRoadmapDocument,
    buildFeaturesState,
    syncFeaturesDocument,
    buildBugsState,
    syncBugsDocument,
    buildPrdState,
    syncPrdDocument,
    buildGenericModuleDocumentState,
    syncGenericModuleDocument,
    buildDefaultPrdEditorState,
    integratePrdFragmentState,
    markPrdFragmentMergedState,
    isProjectModuleEnabled,
    syncArchitectureDocument,
    syncAiEnvironmentDocument,
    buildDatabaseSchemaEditorStateFromFragment,
    applyIntendedSchemaVersioning,
    applyObservedSchemaImport,
    applyDatabaseSchemaSyncAction,
    syncDatabaseSchemaDocument,
    syncRoadmapDependentDocuments,
    tryDeleteFile,
    listProjectDocFiles,
    listProjectFragmentFiles,
    ensureProjectFragmentsDir,
    getFragmentsRootDir,
    ensureSharedFragmentsDir,
    readManagedFileSnapshot,
    renderPrdEditorStateMarkdown,
    normalizeDocumentEditorStateForStorage,
    renderModuleDocumentEditorStateMarkdown,
    extractDocumentFragmentOperations,
    applyDocumentFragmentOperations,
    defaultModuleDocumentEditorState,
    defaultArchitectureEditorState,
    defaultArchitectureMermaid,
    renderArchitectureEditorStateMarkdown,
    defaultAiEnvironmentEditorState,
    renderAiEnvironmentEditorStateMarkdown,
    defaultDatabaseSchemaEditorState,
    defaultDatabaseSchemaMermaid,
    renderDatabaseSchemaEditorStateMarkdown,
  };

  registerCoreRoutes(app, routeContext);
  registerProjectRoutes(app, routeContext);
  registerWorkItemRoutes(app, routeContext);
  registerSoftwareRoutes(app, routeContext);

  app.get('/api/git-info', (req, res) => {
    try {
      const reqPath = req.query.path;
      if (!reqPath) return res.status(400).json({ error: 'path required' });
      const resolved = resolveProjectPath(reqPath);
      res.json(getGitInfo(resolved));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.get('/api/git/branches', (req, res) => {
    try {
      const resolved = resolveGitPath(req.query.path);
      res.json({ branches: listBranches(resolved), info: getGitInfo(resolved) });
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.post('/api/git/branches', (req, res) => {
    try {
      const resolved = resolveGitPath(req.body && req.body.path);
      res.json(createBranch(resolved, req.body && req.body.name, req.body && req.body.from, !!(req.body && req.body.checkout)));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.post('/api/git/checkout', (req, res) => {
    try {
      const resolved = resolveGitPath(req.body && req.body.path);
      res.json(checkoutBranch(resolved, req.body && req.body.branch));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.post('/api/git/fetch', (req, res) => {
    try {
      const resolved = resolveGitPath(req.body && req.body.path);
      res.json(fetchBranch(resolved, req.body && req.body.remote));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.post('/api/git/pull', (req, res) => {
    try {
      const resolved = resolveGitPath(req.body && req.body.path);
      res.json(pullBranch(resolved, req.body && req.body.remote, req.body && req.body.branch));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.post('/api/git/push', (req, res) => {
    try {
      const resolved = resolveGitPath(req.body && req.body.path);
      res.json(pushBranch(resolved, req.body && req.body.remote, req.body && req.body.branch, !!(req.body && req.body.setUpstream)));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.post('/api/git/merge', (req, res) => {
    try {
      const resolved = resolveGitPath(req.body && req.body.path);
      if (req.body && req.body.abort) return res.json(abortMerge(resolved));
      if (req.body && req.body.strategy) {
        return res.json(resolveMergeConflicts(
          resolved,
          req.body.files,
          req.body.strategy,
          !!req.body.complete
        ));
      }
      res.json(mergeBranch(resolved, req.body && req.body.branch));
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message });
    }
  });

  app.get('/api/integrations/catalog', (req, res) => {
    res.json({
      builtIn: [
        { id: 'explorer', kind: 'tool', label: 'File Explorer' },
        { id: 'cursor', kind: 'tool', label: 'Cursor' },
        { id: 'vscode', kind: 'tool', label: 'VS Code' },
        { id: 'terminal', kind: 'tool', label: 'Terminal' },
        { id: 'chrome', kind: 'tool', label: 'Chrome' },
        { id: 'github', kind: 'service', label: 'GitHub' },
        { id: 'webhooks', kind: 'service', label: 'Incoming Webhooks' },
        { id: 'plugin-webhook-forward', kind: 'plugin', label: 'Outgoing Webhook' },
      ],
    });
  });

  app.get('/api/projects/:id/integrations', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json(normalizeProjectIntegrations(project.integrations));
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to load project integrations' });
    }
  });

  app.put('/api/projects/:id/integrations', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      project.integrations = normalizeProjectIntegrations(req.body || {});
      res.json(sanitizeProject(await saveProject(project)).integrations);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save project integrations' });
    }
  });

  app.get('/api/projects/:id/integration-events', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      res.json(await readIntegrationEvents(req.params.id, Number(req.query.limit || 20)));
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to load integration events' });
    }
  });

  app.get('/api/github/projects/:id/summary', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const settings = await readAppSettings({ includeSecrets: true });
      res.json(await getGitHubSummary(project, settings));
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message || 'Failed to load GitHub data' });
    }
  });

  app.post('/api/github/projects/:id/issues', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (!req.body || !String(req.body.title || '').trim()) return res.status(400).json({ error: 'Issue title is required' });
      const settings = await readAppSettings({ includeSecrets: true });
      const issue = await createGitHubIssue(project, settings, req.body);
      await recordIntegrationEvent({
        projectId: project.id,
        source: 'github',
        eventType: 'issue.created',
        deliveryStatus: 'completed',
        payload: {
          title: issue.title,
          number: issue.number,
          url: issue.html_url,
        },
      });
      res.json(issue);
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message || 'Failed to create GitHub issue' });
    }
  });

  app.post('/api/github/projects/:id/pulls', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (!req.body || !String(req.body.title || '').trim() || !String(req.body.head || '').trim() || !String(req.body.base || '').trim()) {
        return res.status(400).json({ error: 'title, head, and base are required' });
      }
      const settings = await readAppSettings({ includeSecrets: true });
      const pullRequest = await createGitHubPullRequest(project, settings, req.body);
      await recordIntegrationEvent({
        projectId: project.id,
        source: 'github',
        eventType: 'pull_request.created',
        deliveryStatus: 'completed',
        payload: {
          title: pullRequest.title,
          number: pullRequest.number,
          url: pullRequest.html_url,
        },
      });
      res.json(pullRequest);
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message || 'Failed to create GitHub pull request' });
    }
  });

  app.post('/api/open-explorer', (req, res) => {
    const { path: targetPath } = req.body || {};
    if (!targetPath) return res.status(400).json({ error: 'path required' });
    const resolved = config.resolveSafe(targetPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    try {
      openExplorerResolved(resolved);
    } catch (err) {
      config.log('open-explorer exception:', err);
    }
    res.json({ ok: true });
  });

  app.post('/api/open-url', (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url required' });
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return res.status(400).json({ error: 'Invalid URL' });
    try {
      openSystemUrl(trimmed);
    } catch (err) {
      config.log('open-url exception:', err);
    }
    res.json({ ok: true });
  });

  function getCursorPath() {
    if (process.platform !== 'win32') return 'cursor';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = [
      path.join(programFiles, 'cursor', 'Cursor.exe'),
      path.join(localAppData, 'Programs', 'cursor', 'Cursor.exe'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || 'cursor';
  }

  function getVSCodePath() {
    if (process.platform !== 'win32') return 'code';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = [
      path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'),
      path.join(programFiles, 'Microsoft VS Code', 'Code.exe'),
      path.join(programFilesX86, 'Microsoft VS Code', 'Code.exe'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || 'code';
  }

  function getChromePath() {
    if (process.platform !== 'win32') return 'google-chrome';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = [
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || 'chrome';
  }

  function spawnWindowsStart(command, args = []) {
    return spawn('cmd', ['/c', 'start', '', command, ...args], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }

  function getTerminalPath() {
    if (process.platform !== 'win32') return 'x-terminal-emulator';
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const candidates = [
      path.join(localAppData, 'Microsoft', 'WindowsApps', 'wt.exe'),
      path.join(programFiles, 'WindowsApps', 'wt.exe'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || 'powershell';
  }

  function openExplorerResolved(resolved) {
    config.log(`open-explorer: opening ${resolved}`);
    const child = process.platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '', resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      : spawn('xdg-open', [resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout && child.stdout.on('data', (data) => config.log('open-explorer stdout:', data.toString().trim()));
    child.stderr && child.stderr.on('data', (data) => config.log('open-explorer stderr:', data.toString().trim()));
    child.on('error', (err) => config.log('open-explorer spawn error:', err));
    return child;
  }

  function openCursorResolved(resolved) {
    const child = process.platform === 'win32'
      ? spawnWindowsStart(getCursorPath(), [resolved])
      : spawn('xdg-open', [resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (err) => config.log('open-cursor spawn error:', err));
    return child;
  }

  function openVSCodeResolved(resolved) {
    const child = process.platform === 'win32'
      ? spawnWindowsStart(getVSCodePath(), [resolved])
      : spawn('xdg-open', [resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (err) => config.log('open-vscode spawn error:', err));
    return child;
  }

  function openChromeUrl(trimmed) {
    const child = process.platform === 'win32'
      ? spawnWindowsStart(getChromePath(), [trimmed])
      : spawn('xdg-open', [trimmed], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (err) => config.log('open-chrome spawn error:', err));
    return child;
  }

  function openSystemUrl(trimmed) {
    const child = process.platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '', trimmed], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      : spawn('xdg-open', [trimmed], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (err) => config.log('open-url spawn error:', err));
    return child;
  }

  function openTerminalResolved(resolved) {
    if (process.platform === 'win32') {
      const terminalPath = getTerminalPath();
      if (terminalPath.toLowerCase().endsWith('wt.exe')) {
        const child = spawnWindowsStart(terminalPath, ['-d', resolved]);
        child.on('error', (err) => config.log('open-terminal spawn error:', err));
        return child;
      }
      const psScript = `Set-Location -LiteralPath '${resolved.replace(/'/g, "''")}'`;
      const child = spawnWindowsStart(terminalPath, ['-NoExit', '-Command', psScript]);
      child.on('error', (err) => config.log('open-terminal spawn error:', err));
      return child;
    }
    const child = spawn(getTerminalPath(), [resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (err) => config.log('open-terminal spawn error:', err));
    return child;
  }

  app.post('/api/open-cursor', (req, res) => {
    const { path: targetPath } = req.body || {};
    if (!targetPath) return res.status(400).json({ error: 'path required' });
    const resolved = config.resolveSafe(targetPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    try {
      openCursorResolved(resolved);
    } catch (err) {
      config.log('open-cursor exception:', err);
    }
    res.json({ ok: true });
  });

  app.post('/api/open-vscode', (req, res) => {
    const { path: targetPath } = req.body || {};
    if (!targetPath) return res.status(400).json({ error: 'path required' });
    const resolved = config.resolveSafe(targetPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    try {
      openVSCodeResolved(resolved);
    } catch (err) {
      config.log('open-vscode exception:', err);
    }
    res.json({ ok: true });
  });

  app.post('/api/open-chrome', (req, res) => {
    const { url, path: targetPath } = req.body || {};
    let chromeTarget = '';
    if (url && typeof url === 'string') {
      const trimmed = url.trim();
      if (!/^(https?:\/\/|file:\/\/)/i.test(trimmed)) return res.status(400).json({ error: 'Invalid URL' });
      chromeTarget = trimmed;
    } else if (targetPath && typeof targetPath === 'string') {
      const resolved = config.resolveSafe(targetPath);
      if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
      if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });
      chromeTarget = pathToFileURL(resolved).href;
    } else {
      return res.status(400).json({ error: 'url or path required' });
    }
    try {
      openChromeUrl(chromeTarget);
    } catch (err) {
      config.log('open-chrome exception:', err);
    }
    res.json({ ok: true, target: chromeTarget });
  });

  app.post('/api/open-terminal', (req, res) => {
    const { path: targetPath } = req.body || {};
    if (!targetPath) return res.status(400).json({ error: 'path required' });
    const resolved = config.resolveSafe(targetPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    try {
      openTerminalResolved(resolved);
    } catch (err) {
      config.log('open-terminal exception:', err);
    }
    res.json({ ok: true });
  });

  app.post('/api/open-cursor-admin', (req, res) => {
    const { path: targetPath } = req.body || {};
    if (!targetPath) return res.status(400).json({ error: 'path required' });
    const resolved = config.resolveSafe(targetPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    const exeForPs = getCursorPath().replace(/'/g, "''");
    const argForPs = resolved.replace(/'/g, "''");
    const psScript = `try {\n  Start-Process -FilePath '${exeForPs}' -ArgumentList '${argForPs}' -Verb RunAs\n} catch {\n  Write-Error ('[PowerShell] Error: ' + $_.Exception.Message)\n}`;
    try {
      const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      child.on('error', (err) => config.log('open-cursor-admin spawn error:', err));
    } catch (err) {
      config.log('open-cursor-admin exception:', err);
    }
    res.json({ ok: true });
  });

  app.post('/api/projects/:id/integrations/:integrationId/execute', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const integrationId = String(req.params.integrationId || '').trim();

      if (integrationId === 'explorer') {
        if (!project.path) return res.status(400).json({ error: 'Project has no folder path' });
        openExplorerResolved(resolveProjectPath(project.path));
        return res.json({ ok: true, launched: 'explorer' });
      }
      if (integrationId === 'cursor') {
        if (!project.path) return res.status(400).json({ error: 'Project has no folder path' });
        openCursorResolved(resolveProjectPath(project.path));
        return res.json({ ok: true, launched: 'cursor' });
      }
      if (integrationId === 'vscode') {
        if (!project.path) return res.status(400).json({ error: 'Project has no folder path' });
        openVSCodeResolved(resolveProjectPath(project.path));
        return res.json({ ok: true, launched: 'vscode' });
      }
      if (integrationId === 'terminal') {
        if (!project.path) return res.status(400).json({ error: 'Project has no folder path' });
        openTerminalResolved(resolveProjectPath(project.path));
        return res.json({ ok: true, launched: 'terminal' });
      }
      if (integrationId === 'chrome') {
        const targetUrl = project.url || ((project.links || []).find((link) => link.type !== 'file' && link.url) || {}).url;
        if (!targetUrl) return res.status(400).json({ error: 'Project has no URL to open' });
        openChromeUrl(targetUrl);
        return res.json({ ok: true, launched: 'chrome' });
      }
      if (integrationId === 'github') {
        const settings = await readAppSettings({ includeSecrets: true });
        return res.json(await getGitHubSummary(project, settings));
      }

      const plugin = normalizeProjectIntegrations(project.integrations).plugins.find((item) => item.id === integrationId);
      if (!plugin) return res.status(404).json({ error: 'Integration not found' });

      if (plugin.type === 'open_url') {
        openSystemUrl(plugin.targetUrl);
        await recordIntegrationEvent({
          projectId: project.id,
          source: `plugin:${plugin.id}`,
          eventType: 'plugin.executed',
          deliveryStatus: 'launched',
          payload: {
            pluginId: plugin.id,
            pluginType: plugin.type,
            targetUrl: plugin.targetUrl,
          },
        });
        return res.json({ ok: true, launched: 'open_url' });
      }

      const payload = {
        project: {
          id: project.id,
          name: project.name,
          path: project.path,
          url: project.url,
        },
        request: req.body || {},
      };
      const response = await fetch(plugin.targetUrl, {
        method: plugin.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...plugin.headers,
        },
        body: JSON.stringify(plugin.includeProjectContext ? payload : (req.body || {})),
      });
      const text = await response.text();
      let body = text;
      try { body = text ? JSON.parse(text) : null; } catch (_) {}
      await recordIntegrationEvent({
        projectId: project.id,
        source: `plugin:${plugin.id}`,
        eventType: 'plugin.executed',
        deliveryStatus: response.ok ? 'completed' : 'failed',
        payload: {
          pluginId: plugin.id,
          pluginType: plugin.type,
          status: response.status,
          response: body,
        },
      });
      return res.status(response.status).json({
        ok: response.ok,
        status: response.status,
        body,
      });
    } catch (error) {
      res.status(error.message === 'Path not allowed' ? 403 : 400).json({ error: error.message || 'Failed to execute integration' });
    }
  });

  app.post('/api/webhooks/:projectId/:endpointId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const integrations = normalizeProjectIntegrations(project.integrations);
      const endpoint = integrations.webhooks.endpoints.find((item) => item.id === req.params.endpointId);
      if (!endpoint) return res.status(404).json({ error: 'Webhook endpoint not found' });

      const settings = await readAppSettings({ includeSecrets: true });
      const configuredSecret = settings.integrations.webhookSecret || '';
      if (configuredSecret) {
        const suppliedSecret = String(req.header('x-apm-webhook-secret') || req.query.secret || '').trim();
        if (!suppliedSecret || suppliedSecret !== configuredSecret) {
          return res.status(401).json({ error: 'Invalid webhook secret' });
        }
      }

      const eventPayload = req.body && typeof req.body === 'object' ? req.body : {};
      const eventId = await recordIntegrationEvent({
        projectId: project.id,
        source: `webhook:${endpoint.id}`,
        eventType: String(eventPayload.type || req.header('x-github-event') || 'generic'),
        deliveryStatus: 'received',
        payload: eventPayload,
      });

      let createdTask = null;
      if (integrations.webhooks.autoCreateTasks) {
        const title = String(eventPayload.title || eventPayload.action || endpoint.name || 'Webhook event').trim();
        createdTask = await saveTask(normalizeTaskPayload({
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          projectId: project.id,
          title: `${integrations.webhooks.taskPrefix}: ${title}`,
          description: JSON.stringify(eventPayload, null, 2),
          status: integrations.webhooks.taskStatus,
          priority: 'medium',
          sortOrder: await nextTaskSortOrder(project.id),
        }));
      }

      res.json({ ok: true, eventId, task: createdTask });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to process webhook' });
    }
  });

  app.post('/api/log-client-error', (req, res) => {
    const { message, stack, source, lineno, colno, type } = req.body || {};
    try {
      config.logEntry({
        level: 'ERROR',
        requestId: req.requestId || '',
        source: 'renderer',
        eventType: 'ui.error',
        action: type || 'error',
        message: message || 'unknown',
        details: JSON.stringify({
          source: source || '',
          line: lineno != null ? lineno : '',
          column: colno != null ? colno : '',
        }),
        error: stack || '',
      });
    } catch (err) {
      console.error('Failed to write client error log:', err);
    }
    res.json({ ok: true });
  });

  app.post('/api/ui-event', (req, res) => {
    const { tab, action, projectId, details } = req.body || {};
    const serializedDetails = details && typeof details === 'object' ? JSON.stringify(details) : '';
    config.logEntry({
      level: 'INFO',
      requestId: req.requestId || '',
      source: 'ui',
      eventType: 'ui.action',
      action: action || 'unknown',
      message: `tab=${tab || 'unknown'} project=${projectId || 'none'}`,
      details: serializedDetails,
    });
    res.json({ ok: true });
  });

  app.post('/api/view-logs', (req, res) => {
    config.ensureDataDir();
    const logsDir = config.getLogsDir();
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    spawn('cmd', ['/c', 'start', '', logsDir], { detached: true, stdio: 'ignore', windowsHide: true });
    res.json({ ok: true, logsDir });
  });

  app.get('/api/logs', (req, res) => {
    config.ensureDataDir();
    const logsDir = config.getLogsDir();
    const archiveDir = config.getArchivedLogsDir();
    const currentLog = config.getLogFile();
    const archived = fs.existsSync(archiveDir)
      ? fs.readdirSync(archiveDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => {
          const filePath = path.join(archiveDir, entry.name);
          const stat = fs.statSync(filePath);
          return {
            name: entry.name,
            path: filePath,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
          };
        })
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
      : [];
    res.json({
      logsDir,
      archiveDir,
      currentLog,
      archived,
    });
  });

  app.get('/api/logs/entries', (req, res) => {
    try {
      const logger = require('./logger');
      config.ensureDataDir();
      const archiveName = String(req.query.archive || '').trim();
      const targetPath = archiveName
        ? path.join(config.getArchivedLogsDir(), archiveName)
        : config.getLogFile();
      const allowedBase = archiveName ? config.getArchivedLogsDir() : config.getLogsDir();
      const resolved = path.resolve(targetPath);
      if (!resolved.startsWith(path.resolve(allowedBase))) {
        return res.status(403).json({ error: 'Log file not allowed' });
      }
      if (!fs.existsSync(resolved)) {
        return res.status(404).json({ error: 'Log file not found' });
      }

      const lines = fs.readFileSync(resolved, 'utf8').split(/\r?\n/).filter(Boolean);
      const [headerLine, ...entryLines] = lines;
      const headers = (headerLine || logger.HEADER).split('\t');
      const unescapeField = (value) => String(value || '')
        .replace(/\\\\/g, '\\')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n');
      const entries = entryLines.map((line, index) => {
        const parts = line.split('\t').map(unescapeField);
        const entry = { id: `log-${index}` };
        headers.forEach((header, headerIndex) => {
          entry[header] = parts[headerIndex] || '';
        });
        entry.raw = parts.join('\t');
        return entry;
      });

      res.json({
        file: path.basename(resolved),
        entries,
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to read log entries' });
    }
  });

  app.post('/api/logs/archive-current', (req, res) => {
    try {
      const logger = require('./logger');
      const archivedPath = logger.archiveCurrentLog(config.getLogsDir(), 'manual');
      res.json({ ok: true, archivedPath });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to archive current log' });
    }
  });
  app.get('/api/credentials', async (req, res) => {
    try {
      const credentials = await readCredentials();
      res.json(credentials.map((credential) => ({
        id: credential.id,
        name: credential.name,
        host: credential.host,
        port: credential.port,
        user: credential.user,
        passwordMasked: credential.password ? '********' : null,
        keyPath: credential.keyPath,
      })));
    } catch (error) {
      console.error('Error fetching credentials:', error);
      res.status(500).json({ error: 'Failed to fetch credentials' });
    }
  });

  app.post('/api/credentials', async (req, res) => {
    try {
      const { name, host, port, user, password, keyPath } = req.body || {};
      if (!name || !host || !user) return res.status(400).json({ error: 'name, host, and user are required' });
      res.json(await saveCredential({
        id: `cred-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: String(name).trim(),
        host: String(host).trim(),
        port: port || 22,
        user: String(user).trim(),
        password: password || null,
        keyPath: keyPath || null,
      }));
    } catch (error) {
      console.error('Error creating credential:', error);
      res.status(500).json({ error: 'Failed to create credential' });
    }
  });

  app.put('/api/credentials/:id', async (req, res) => {
    try {
      const existing = await getCredentialById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Credential not found' });
      const { name, host, port, user, password, keyPath } = req.body || {};
      res.json(await saveCredential({
        ...existing,
        name: name !== undefined ? String(name).trim() : existing.name,
        host: host !== undefined ? String(host).trim() : existing.host,
        port: port !== undefined ? port || 22 : existing.port,
        user: user !== undefined ? String(user).trim() : existing.user,
        password: password !== undefined ? password || null : existing.password,
        keyPath: keyPath !== undefined ? keyPath || null : existing.keyPath,
      }));
    } catch (error) {
      console.error('Error updating credential:', error);
      res.status(500).json({ error: 'Failed to update credential' });
    }
  });

  app.delete('/api/credentials/:id', async (req, res) => {
    try {
      await deleteCredential(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting credential:', error);
      res.status(500).json({ error: 'Failed to delete credential' });
    }
  });

  app.post('/api/credentials/test', (req, res) => {
    const { host, port, user, password, keyPath } = req.body || {};
    if (!host || !String(host).trim() || !user || !String(user).trim()) {
      return res.status(400).json({ error: 'Host and username are required.' });
    }
    const portNum = parseInt(port, 10) || 22;
    let privateKey = null;
    if (keyPath && String(keyPath).trim()) {
      const keyFile = path.resolve(String(keyPath).trim());
      if (!fs.existsSync(keyFile)) return res.status(400).json({ error: 'Private key file not found.' });
      const keyContent = fs.readFileSync(keyFile, 'utf8');
      if (keyContent.includes('-----BEGIN')) privateKey = keyContent;
      else return res.status(400).json({ error: 'Connection test requires an OpenSSH PEM key. .ppk keys are not supported for testing; use password or convert the key to PEM.' });
    }
    if (!password && !privateKey) return res.status(400).json({ error: 'Enter a password or a path to an OpenSSH PEM private key to test.' });

    const conn = new Client();
    conn.on('ready', () => {
      conn.end();
      res.json({ ok: true, message: 'Connection successful.' });
    }).on('error', (err) => {
      config.log('Credentials test failed', err);
      res.status(400).json({ error: err.message || String(err) });
    }).connect({
      host: String(host).trim(),
      port: portNum,
      username: String(user).trim(),
      readyTimeout: 15000,
      connectTimeout: 15000,
      ...(privateKey ? { privateKey } : { password }),
    });
  });

  app.get('/api/sftp/list', async (req, res) => {
    try {
      const credId = req.query.credId;
      let remotePath = req.query.path != null ? String(req.query.path).replace(/\\/g, '/') : '/';
      if (!remotePath.startsWith('/')) remotePath = `/${remotePath}`;
      if (!credId) return res.status(400).json({ error: 'credId is required' });
      const credential = await getCredentialById(String(credId));
      if (!credential) return res.status(404).json({ error: 'Credential not found' });
      const sshConfig = createSshConfig(credential);
      if (!sshConfig.privateKey && !sshConfig.password) return res.status(400).json({ error: 'Credential has no password or key' });

      const conn = new Client();
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) return res.status(500).json({ error: err.message });
          sftp.readdir(remotePath, (readErr, list) => {
            conn.end();
            if (readErr) return res.status(400).json({ error: readErr.message || 'List failed' });
            const entries = (list || []).map((entry) => ({
              name: entry.filename,
              type: entry.attrs && entry.attrs.isDirectory && entry.attrs.isDirectory() ? 'dir' : 'file',
              path: remotePath === '/' ? `/${entry.filename}` : `${remotePath.replace(/\/$/, '')}/${entry.filename}`,
            })).filter((entry) => entry.name !== '.' && entry.name !== '..');
            res.json({ path: remotePath, entries });
          });
        });
      });
      conn.on('error', (err) => {
        config.log('SFTP list failed', err);
        if (!res.headersSent) res.status(500).json({ error: err.message || 'Connection failed' });
      });
      conn.connect(sshConfig);
    } catch (error) {
      console.error('Error in SFTP list:', error);
      res.status(500).json({ error: 'SFTP list failed' });
    }
  });

  app.get('/api/sftp/local-list', (req, res) => {
    let reqPath = req.query.path;
    if (reqPath == null || reqPath === '') reqPath = '.';
    const resolved = config.resolveSafe(reqPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });
    try {
      const projectsRoot = config.getProjectsRoot();
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const dirs = [];
      const files = [];
      for (const entry of entries) {
        const rel = path.relative(projectsRoot, path.join(resolved, entry.name)).replace(/\\/g, '/');
        const item = { name: entry.name, path: rel };
        if (entry.isDirectory()) dirs.push(item);
        else files.push(item);
      }
      dirs.sort((left, right) => left.name.localeCompare(right.name));
      files.sort((left, right) => left.name.localeCompare(right.name));
      res.json({ path: path.relative(projectsRoot, resolved).replace(/\\/g, '/'), dirs, files });
    } catch (err) {
      res.status(500).json({ error: String(err.message) });
    }
  });

  app.post('/api/sftp/upload', async (req, res) => {
    const { credId, localPath, remotePath, overwrite, askBeforeOverwrite } = req.body || {};
    if (!credId || localPath == null || remotePath == null) return res.status(400).json({ error: 'credId, localPath, and remotePath are required' });
    const resolved = config.resolveSafe(String(localPath));
    if (!resolved) return res.status(403).json({ error: 'Local path not allowed' });
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Local path not found' });
    let remote = String(remotePath).replace(/\\/g, '/');
    if (!remote.startsWith('/')) remote = `/${remote}`;
    const isDir = fs.statSync(resolved).isDirectory();
    let localDirHash = null;
    if (isDir) {
      try { localDirHash = computeDirHashSync(resolved); } catch (err) { config.log('sftp-upload hash failed', err); }
    }
    const credential = await getCredentialById(String(credId));
    if (!credential) return res.status(404).json({ error: 'Credential not found' });
    const sshConfig = createSshConfig(credential);
    if (!sshConfig.privateKey && !sshConfig.password) return res.status(400).json({ error: 'Credential has no password or key' });
    const transferSummary = `${resolved} -> ${remote}`;
    config.logEntry({
      level: 'INFO',
      requestId: req.requestId || '',
      source: 'sftp',
      eventType: 'sftp.upload.start',
      action: 'upload',
      message: transferSummary,
      details: JSON.stringify({ overwrite: !!overwrite, askBeforeOverwrite: !!askBeforeOverwrite }),
    });

    let responseSent = false;
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) return res.status(500).json({ error: err.message, code: err.code, verbose: err.stack || err.message });
        const send = (status, body) => {
          if (responseSent) return;
          responseSent = true;
          conn.end();
          config.logEntry({
            level: status === 200 ? 'INFO' : 'ERROR',
            requestId: req.requestId || '',
            source: 'sftp',
            eventType: status === 200 ? 'sftp.upload.complete' : 'sftp.upload.error',
            action: 'upload',
            message: transferSummary,
            details: JSON.stringify(body || {}),
            error: status === 200 ? '' : String(body?.error || body?.verbose || 'Upload failed'),
          });
          if (status === 200) res.json(body);
          else res.status(status).json(body);
        };
        const removeRemotePath = (remotePathToRemove, done) => {
          sftp.readdir(remotePathToRemove, (readErr, list) => {
            if (readErr) {
              sftp.unlink(remotePathToRemove, () => done());
              return;
            }
            const entries = (list || []).filter((entry) => entry.filename !== '.' && entry.filename !== '..');
            let pending = entries.length;
            if (pending === 0) return sftp.rmdir(remotePathToRemove, done);
            const next = () => {
              pending -= 1;
              if (pending === 0) sftp.rmdir(remotePathToRemove, done);
            };
            for (const entry of entries) {
              const child = `${remotePathToRemove === '/' ? '' : remotePathToRemove}/${entry.filename}`;
              if (entry.attrs && entry.attrs.isDirectory && entry.attrs.isDirectory()) removeRemotePath(child, next);
              else sftp.unlink(child, next);
            }
          });
        };
        const doUpload = () => {
          uploadLocalToRemote(sftp, resolved, remote, !!overwrite, (uploadErr) => {
            if (uploadErr && uploadErr.needOverwriteConfirm) return send(409, { needOverwriteConfirm: true, path: uploadErr.path });
            if (uploadErr) return send(500, { error: uploadErr.message || 'Upload failed', code: uploadErr.code, verbose: uploadErr.stack || uploadErr.message });
            if (isDir && localDirHash) {
              sftp.writeFile(`${remote === '/' ? '' : remote}/${config.SFTP_MANIFEST}`, localDirHash, () => send(200, { ok: true }));
            } else send(200, { ok: true });
          });
        };
        const maybeDeleteAndUpload = () => {
          sftp.stat(remote, (statErr, stat) => {
            if (statErr) return doUpload();
            if (stat.isDirectory && stat.isDirectory()) removeRemotePath(remote, doUpload);
            else sftp.unlink(remote, doUpload);
          });
        };
        if (isDir && localDirHash != null) {
          sftp.readFile(`${remote === '/' ? '' : remote}/${config.SFTP_MANIFEST}`, (readErr, data) => {
            if (!readErr && data && data.toString().trim() === localDirHash) return send(200, { ok: true, skipped: true });
            maybeDeleteAndUpload();
          });
        } else maybeDeleteAndUpload();
      });
    });
    conn.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        config.logEntry({
          level: 'ERROR',
          requestId: req.requestId || '',
          source: 'sftp',
          eventType: 'sftp.upload.error',
          action: 'upload',
          message: transferSummary,
          details: '',
          error: err.stack || err.message || 'Connection failed',
        });
        res.status(500).json({ error: err.message || 'Connection failed', code: err.code, verbose: err.stack || err.message });
      }
    });
    conn.connect(sshConfig);
  });

  app.post('/api/sftp/download', async (req, res) => {
    const { credId, remotePath, localPath } = req.body || {};
    if (!credId || remotePath == null || localPath == null) return res.status(400).json({ error: 'credId, remotePath, and localPath are required' });
    const resolved = config.resolveSafe(String(localPath));
    if (!resolved) return res.status(403).json({ error: 'Local path not allowed' });
    let remote = String(remotePath).replace(/\\/g, '/');
    if (!remote.startsWith('/')) remote = `/${remote}`;
    const credential = await getCredentialById(String(credId));
    if (!credential) return res.status(404).json({ error: 'Credential not found' });
    const sshConfig = createSshConfig(credential);
    if (!sshConfig.privateKey && !sshConfig.password) return res.status(400).json({ error: 'Credential has no password or key' });
    const transferSummary = `${remote} -> ${resolved}`;
    config.logEntry({
      level: 'INFO',
      requestId: req.requestId || '',
      source: 'sftp',
      eventType: 'sftp.download.start',
      action: 'download',
      message: transferSummary,
      details: '',
    });

    let responseSent = false;
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) return res.status(500).json({ error: err.message, code: err.code, verbose: err.stack || err.message });
        downloadRemoteToLocal(sftp, remote, resolved, (downloadErr) => {
          conn.end();
          if (responseSent) return;
          responseSent = true;
          if (downloadErr) {
            config.logEntry({
              level: 'ERROR',
              requestId: req.requestId || '',
              source: 'sftp',
              eventType: 'sftp.download.error',
              action: 'download',
              message: transferSummary,
              details: '',
              error: downloadErr.stack || downloadErr.message || 'Download failed',
            });
            return res.status(500).json({ error: downloadErr.message || 'Download failed', code: downloadErr.code, verbose: downloadErr.stack || downloadErr.message });
          }
          config.logEntry({
            level: 'INFO',
            requestId: req.requestId || '',
            source: 'sftp',
            eventType: 'sftp.download.complete',
            action: 'download',
            message: transferSummary,
            details: '',
          });
          res.json({ ok: true });
        });
      });
    });
    conn.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        config.logEntry({
          level: 'ERROR',
          requestId: req.requestId || '',
          source: 'sftp',
          eventType: 'sftp.download.error',
          action: 'download',
          message: transferSummary,
          details: '',
          error: err.stack || err.message || 'Connection failed',
        });
        res.status(500).json({ error: err.message || 'Connection failed', code: err.code, verbose: err.stack || err.message });
      }
    });
    conn.connect(sshConfig);
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(hasFrontendBuild ? frontendDir : config.getPublicDir(), 'index.html'));
  });

  return app;
}

async function startServer(port = config.DEFAULT_PORT) {
  await bootstrapStorage();
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      console.log(`Angel's Project Manager running at http://localhost:${actualPort}`);
      resolve({ app, server, port: actualPort });
    });
    server.on('close', () => {
      const watcherService = app.locals && app.locals.fileWatcherService;
      if (watcherService && typeof watcherService.close === 'function') {
        watcherService.close().catch((error) => {
          console.error('Failed to close file watcher service:', error);
        });
      }
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Close the other app or run the launcher again to free it.`);
      }
      reject(err);
    });
  });
}

module.exports = { createApp, startServer };
