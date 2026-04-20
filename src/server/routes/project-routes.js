module.exports = function registerProjectRoutes(app, ctx) {
  const {
    fs,
    path,
    config,
    normalizeLinks,
    defaultMappingGroups,
    normalizeMappingGroups,
    normalizeProjectPrimaryAction,
    normalizeWorkspacePlugins,
    normalizeProjectIntegrations,
    normalizeProjectType,
    buildModuleRegistry,
    moduleKeysToLegacyWorkspacePlugins,
    resolveEnabledModuleSelection,
    readProjects,
    getProjectById,
    saveProject,
    deleteProject,
    readProjectModules,
    readProjectWorkItems,
    readRoadmapPhases,
    readFeatureItems,
    readBugItems,
    syncProjectModules,
    saveProjectDocument,
    readEntityRelationships,
    saveEntityRelationship,
    deleteEntityRelationship,
    syncBugsDocument,
    syncFeaturesDocument,
    syncPrdDocument,
    syncRoadmapDocument,
    syncArchitectureDocument,
    syncAiEnvironmentDocument,
    syncDatabaseSchemaDocument,
    ensureWorkspaceProject,
    listProjectFragmentFiles,
    countPendingProjectFragments,
    countPendingProjectFragmentsForModule,
    readManagedFileSnapshot,
    sanitizeProject,
    normalizeRequestedProjectType,
    removeWorkspacePluginArtifacts,
    removeProjectModuleArtifacts,
    isProjectModuleEnabled,
  } = ctx;

  const PROJECT_DATA_CHILDREN = ['project-images', 'templates', 'fragments', 'standards'];
  const PROJECT_MANIFEST_FILE = 'PROJECT_MANIFEST.md';

  function ensureProjectDataLayout(projects = []) {
    config.ensureDataDir();
    const projectsDataDir = config.getProjectsDataDir();
    const sharedDataDir = config.getSharedProjectDataDir();
    fs.mkdirSync(projectsDataDir, { recursive: true });
    fs.mkdirSync(sharedDataDir, { recursive: true });
    fs.mkdirSync(path.join(sharedDataDir, 'fragments'), { recursive: true });
    fs.mkdirSync(path.join(sharedDataDir, 'project-images'), { recursive: true });
    for (const project of Array.isArray(projects) ? projects : []) {
      if (!project?.id) continue;
      const projectDataDir = config.getProjectDataDir(project.id);
      fs.mkdirSync(projectDataDir, { recursive: true });
      for (const child of PROJECT_DATA_CHILDREN) {
        fs.mkdirSync(path.join(projectDataDir, child), { recursive: true });
      }
    }
    return projectsDataDir;
  }

  function escapeManifestCell(value) {
    return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
  }

  async function writeProjectDataManifest(projects = null) {
    const sourceProjects = Array.isArray(projects) ? projects : await readProjects();
    const projectsDataDir = ensureProjectDataLayout(sourceProjects);
    const lines = [
      '# APM Project Data Manifest',
      '',
      'This file maps project data folders to the human-readable project names managed by APM.',
      '',
      '| Project ID | Project Name | Type | Data Folder | Project Path or URL |',
      '| --- | --- | --- | --- | --- |',
      `| shared | Shared project data | shared | ${escapeManifestCell(path.join(projectsDataDir, 'shared'))} | Shared fragments and reusable assets |`,
      ...sourceProjects.map((project) => {
        const dataFolder = project?.id ? config.getProjectDataDir(project.id) : '';
        const location = project?.type === 'url' ? project.url : (project?.absolutePath || project?.path || '');
        return `| ${escapeManifestCell(project?.id)} | ${escapeManifestCell(project?.name)} | ${escapeManifestCell(project?.type)} | ${escapeManifestCell(dataFolder)} | ${escapeManifestCell(location)} |`;
      }),
      '',
    ];
    fs.writeFileSync(path.join(projectsDataDir, PROJECT_MANIFEST_FILE), lines.join('\n'), 'utf8');
  }

  const CLOSED_BUG_STATUSES = new Set(['closed', 'resolved', 'archived']);
  const INACTIVE_FEATURE_STATUSES = new Set(['implemented', 'completed', 'done', 'cancelled', 'canceled', 'archived']);
  const INACTIVE_PHASE_STATUSES = new Set(['completed', 'done', 'archived']);
  const TERMINAL_WORK_STATUSES = new Set(['closed', 'resolved', 'completed', 'complete', 'done', 'archived', 'implemented', 'cancelled', 'canceled']);
  const TERMINAL_FRAGMENT_STATUSES = new Set(['archived', 'consumed', 'integrated', 'merged', 'resolved']);
  const FRAGMENT_DOC_TYPE_TO_MODULE_KEY = {
    ai_environment: 'ai_environment',
    architecture: 'architecture',
    bugs: 'bugs',
    changelog: 'changelog',
    database_schema: 'database_schema',
    domain_models: 'domain_models',
    experience_design: 'experience_design',
    features: 'features',
    functional_spec: 'functional_spec',
    prd: 'prd',
    roadmap: 'roadmap_core',
    technical_design: 'technical_design',
    test_strategy: 'test_strategy',
  };

  function normalizeStatus(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  }

  function isRecentlyChanged(item, now = Date.now(), days = 14) {
    const timestamp = Date.parse(item?.updatedAt || item?.createdAt || item?.updated_at || item?.created_at || '');
    if (!timestamp) return false;
    return now - timestamp <= days * 24 * 60 * 60 * 1000;
  }

  async function buildProjectMetrics(project) {
    const metrics = {
      pendingFragmentCount: 0,
      activeBugCount: 0,
      activeFeatureCount: 0,
      activeRoadmapPhaseCount: 0,
      blockedWorkCount: 0,
      recentChangeCount: 0,
      enabledModuleCount: 0,
      moduleCount: 0,
    };

    try {
      metrics.pendingFragmentCount = typeof countPendingProjectFragments === 'function'
        ? countPendingProjectFragments(project)
        : 0;
    } catch (error) {
      config.log(`project-routes: failed to count pending fragments for project ${project.id || 'unknown'}: ${error.message || 'unknown error'}`);
    }

    try {
      const [bugs, features, phases, workItems, modules] = await Promise.all([
        typeof readBugItems === 'function' ? readBugItems(project.id, { includeArchived: true }) : [],
        typeof readFeatureItems === 'function' ? readFeatureItems(project.id, { includeArchived: true }) : [],
        typeof readRoadmapPhases === 'function' ? readRoadmapPhases(project.id, { includeArchived: true }) : [],
        typeof readProjectWorkItems === 'function' ? readProjectWorkItems(project.id) : [],
        typeof readProjectModules === 'function' ? readProjectModules(project.id) : [],
      ]);
      const now = Date.now();
      const activeBugs = (Array.isArray(bugs) ? bugs : []).filter((bug) => {
        const status = normalizeStatus(bug?.status);
        return !bug?.archived && !CLOSED_BUG_STATUSES.has(status);
      });
      const activeFeatures = (Array.isArray(features) ? features : []).filter((feature) => {
        const status = normalizeStatus(feature?.status);
        return !feature?.archived && !INACTIVE_FEATURE_STATUSES.has(status);
      });
      const activePhases = (Array.isArray(phases) ? phases : []).filter((phase) => {
        const status = normalizeStatus(phase?.status);
        return !phase?.archived && !INACTIVE_PHASE_STATUSES.has(status);
      });
      const activeWorkItems = (Array.isArray(workItems) ? workItems : []).filter((item) => {
        const status = normalizeStatus(item?.status);
        return !TERMINAL_WORK_STATUSES.has(status);
      });
      const recentItems = [
        ...activeBugs,
        ...activeFeatures,
        ...activePhases,
        ...activeWorkItems,
      ];
      metrics.activeBugCount = activeBugs.length;
      metrics.activeFeatureCount = activeFeatures.length;
      metrics.activeRoadmapPhaseCount = activePhases.length;
      metrics.blockedWorkCount = activeWorkItems.filter((item) => normalizeStatus(item?.status) === 'blocked').length;
      metrics.recentChangeCount = recentItems.filter((item) => isRecentlyChanged(item, now)).length;
      metrics.moduleCount = Array.isArray(modules) ? modules.length : 0;
      metrics.enabledModuleCount = (Array.isArray(modules) ? modules : []).filter((module) => module?.enabled).length;
    } catch (error) {
      config.log(`project-routes: failed to build project metrics for project ${project.id || 'unknown'}: ${error.message || 'unknown error'}`);
    }

    return metrics;
  }

  function emptyProjectRollup() {
    return {
      childProjectCount: 0,
      descendantProjectCount: 0,
      pendingFragmentCount: 0,
      activeBugCount: 0,
      activeFeatureCount: 0,
      activeRoadmapPhaseCount: 0,
      blockedWorkCount: 0,
      recentChangeCount: 0,
      enabledModuleCount: 0,
      moduleCount: 0,
    };
  }

  function addMetricsToRollup(rollup, metrics = {}) {
    rollup.pendingFragmentCount += Number(metrics.pendingFragmentCount || 0);
    rollup.activeBugCount += Number(metrics.activeBugCount || 0);
    rollup.activeFeatureCount += Number(metrics.activeFeatureCount || 0);
    rollup.activeRoadmapPhaseCount += Number(metrics.activeRoadmapPhaseCount || 0);
    rollup.blockedWorkCount += Number(metrics.blockedWorkCount || 0);
    rollup.recentChangeCount += Number(metrics.recentChangeCount || 0);
    rollup.enabledModuleCount += Number(metrics.enabledModuleCount || 0);
    rollup.moduleCount += Number(metrics.moduleCount || 0);
    return rollup;
  }

  function summarizeChildProject(project) {
    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      parentId: project.parentId || null,
      type: project.type,
      projectType: project.projectType || 'general',
      category: project.category || null,
      pinned: Boolean(project.pinned),
      imagePath: project.imagePath || null,
      imageUrl: project.imageUrl || null,
      pendingFragmentCount: Number(project.pendingFragmentCount || 0),
      projectMetrics: project.projectMetrics || emptyProjectRollup(),
      projectFamilyRollup: project.projectFamilyRollup || emptyProjectRollup(),
      familyRollup: project.familyRollup || project.projectFamilyRollup || emptyProjectRollup(),
      childCount: Number(project.childCount || 0),
      descendantCount: Number(project.descendantCount || 0),
    };
  }

  function applyProjectHierarchy(projects) {
    const byId = new Map(projects.map((project) => [project.id, project]));
    const childrenByParent = new Map();
    for (const project of projects) {
      const parentId = project.parentId && byId.has(project.parentId) ? project.parentId : '';
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(project);
    }

    const memo = new Map();
    const visiting = new Set();

    function enrichProject(project) {
      if (!project?.id) return project;
      if (memo.has(project.id)) return memo.get(project.id);
      if (visiting.has(project.id)) {
        return {
          ...project,
          isParentProject: false,
          childCount: 0,
          descendantCount: 0,
          childProjectIds: [],
          childProjects: [],
          projectFamilyRollup: emptyProjectRollup(),
          familyRollup: emptyProjectRollup(),
          __descendants: [],
        };
      }

      visiting.add(project.id);
      const enrichedChildren = (childrenByParent.get(project.id) || []).map(enrichProject).filter(Boolean);
      const descendants = [];
      for (const child of enrichedChildren) {
        descendants.push(child, ...(Array.isArray(child.__descendants) ? child.__descendants : []));
      }
      const rollup = emptyProjectRollup();
      rollup.childProjectCount = enrichedChildren.length;
      rollup.descendantProjectCount = descendants.length;
      descendants.forEach((child) => addMetricsToRollup(rollup, child.projectMetrics));
      const enriched = {
        ...project,
        isParentProject: enrichedChildren.length > 0,
        childCount: enrichedChildren.length,
        descendantCount: descendants.length,
        childProjectIds: enrichedChildren.map((child) => child.id),
        childProjects: enrichedChildren.map(summarizeChildProject),
        projectFamilyRollup: rollup,
        familyRollup: rollup,
        __descendants: descendants,
      };
      memo.set(project.id, enriched);
      visiting.delete(project.id);
      return enriched;
    }

    return projects.map((project) => {
      const { __descendants, ...cleanProject } = enrichProject(project);
      return cleanProject;
    });
  }

  async function decorateProject(project) {
    const sanitized = sanitizeProject(project);
    if (!sanitized) return sanitized;
    const projectMetrics = await buildProjectMetrics(sanitized);
    return {
      ...sanitized,
      pendingFragmentCount: projectMetrics.pendingFragmentCount,
      projectMetrics,
    };
  }

  async function decorateProjects(projects) {
    const decorated = await Promise.all((Array.isArray(projects) ? projects : []).map((project) => decorateProject(project)));
    return applyProjectHierarchy(decorated);
  }

  async function decorateProjectFromCurrentCollection(projectId, fallbackProject = null) {
    const decoratedProjects = await decorateProjects(await readProjects());
    return decoratedProjects.find((project) => project.id === projectId) || (fallbackProject ? await decorateProject(fallbackProject) : null);
  }

  function decorateModulesWithFragmentCounts(project, modules = []) {
    return (Array.isArray(modules) ? modules : []).map((module) => {
      let pendingFragmentCount = 0;
      try {
        pendingFragmentCount = typeof countPendingProjectFragmentsForModule === 'function'
          ? countPendingProjectFragmentsForModule(project, module.moduleKey)
          : 0;
      } catch (error) {
        config.log(`project-routes: failed to count pending fragments for module ${module?.moduleKey || 'unknown'} in project ${project?.id || 'unknown'}: ${error.message || 'unknown error'}`);
      }
      return {
        ...module,
        pendingFragmentCount,
      };
    });
  }

  function collectProjectDescendants(projects, parentId) {
    const byParent = new Map();
    for (const project of Array.isArray(projects) ? projects : []) {
      const key = project?.parentId || '';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(project);
    }
    const descendants = [];
    const visited = new Set();
    function visit(projectId) {
      if (!projectId || visited.has(projectId)) return;
      visited.add(projectId);
      for (const child of byParent.get(projectId) || []) {
        descendants.push(child);
        visit(child.id);
      }
    }
    visit(parentId);
    return descendants;
  }

  function inferFragmentModuleKey(fileName, managed = {}) {
    const docType = normalizeStatus(managed?.docType || managed?.fragment?.docType || managed?.moduleKey || '');
    if (FRAGMENT_DOC_TYPE_TO_MODULE_KEY[docType]) return FRAGMENT_DOC_TYPE_TO_MODULE_KEY[docType];
    const normalizedName = String(fileName || '').toUpperCase();
    if (normalizedName.startsWith('AI_ENVIRONMENT_FRAGMENT_')) return 'ai_environment';
    if (normalizedName.startsWith('ARCHITECTURE_FRAGMENT_')) return 'architecture';
    if (normalizedName.startsWith('BUGS_FRAGMENT_')) return 'bugs';
    if (normalizedName.startsWith('CHANGELOG_FRAGMENT_')) return 'changelog';
    if (normalizedName.startsWith('DATABASE_SCHEMA_FRAGMENT_')) return 'database_schema';
    if (normalizedName.startsWith('DOMAIN_MODELS_FRAGMENT_')) return 'domain_models';
    if (normalizedName.startsWith('EXPERIENCE_DESIGN_FRAGMENT_') || normalizedName.startsWith('UX_UI_FRAGMENT_')) return 'experience_design';
    if (normalizedName.startsWith('FEATURES_FRAGMENT_')) return 'features';
    if (normalizedName.startsWith('FUNCTIONAL_SPEC_FRAGMENT_')) return 'functional_spec';
    if (normalizedName.startsWith('PRD_FRAGMENT_')) return 'prd';
    if (normalizedName.startsWith('ROADMAP_FRAGMENT_')) return 'roadmap_core';
    if (normalizedName.startsWith('TECHNICAL_DESIGN_FRAGMENT_')) return 'technical_design';
    if (normalizedName.startsWith('TEST_STRATEGY_FRAGMENT_')) return 'test_strategy';
    return 'documents_core';
  }

  function fragmentIsPending(snapshot = {}) {
    const managed = snapshot?.managed || {};
    const status = normalizeStatus(
      managed?.fragment?.status
      || managed?.status
      || managed?.editorState?.status
      || ''
    );
    return !TERMINAL_FRAGMENT_STATUSES.has(status);
  }

  function summarizeFragmentFile(project, filePath) {
    const snapshot = typeof readManagedFileSnapshot === 'function' ? readManagedFileSnapshot(filePath) : null;
    if (!snapshot || !fragmentIsPending(snapshot)) return null;
    const managed = snapshot.managed || {};
    const fragment = managed.fragment || managed.editorState || {};
    const fileName = path.basename(filePath);
    const moduleKey = inferFragmentModuleKey(fileName, managed);
    return {
      id: `${project.id}:${fileName}`,
      projectId: project.id,
      projectName: project.name,
      moduleKey,
      fileName,
      code: fragment.code || managed.code || fileName.replace(/\.md$/i, ''),
      title: fragment.title || managed.title || fragment.summary || fileName.replace(/\.md$/i, ''),
      summary: fragment.summary || managed.summary || '',
      status: fragment.status || managed.status || 'pending',
      updatedAt: snapshot.updatedAt || null,
    };
  }

  function summarizeRollupItem(project, item, fallbackModuleKey) {
    return {
      id: item?.id || `${project.id}:${fallbackModuleKey}:${item?.title || item?.name || item?.code || Math.random().toString(36).slice(2)}`,
      projectId: project.id,
      projectName: project.name,
      moduleKey: fallbackModuleKey,
      code: item?.code || item?.featureCode || item?.bugCode || item?.key || '',
      title: item?.title || item?.name || item?.summary || 'Untitled item',
      summary: item?.summary || item?.description || item?.currentBehavior || '',
      status: item?.status || item?.planningBucket || '',
      phase: item?.phase || item?.phaseName || item?.roadmapPhase || '',
      category: item?.category || item?.type || item?.workItemType || '',
      updatedAt: item?.updatedAt || item?.createdAt || item?.updated_at || item?.created_at || null,
    };
  }

  async function buildProjectFamilyRollupDetails(parentProject) {
    const projects = await readProjects();
    const descendants = collectProjectDescendants(projects, parentProject.id);
    const pendingFragments = [];
    const activeBugs = [];
    const activeFeatures = [];
    const activeRoadmapPhases = [];
    const blockedWork = [];
    const recentChanges = [];
    const now = Date.now();

    for (const child of descendants) {
      try {
        const files = typeof listProjectFragmentFiles === 'function' ? listProjectFragmentFiles(child) : [];
        pendingFragments.push(...files.map((filePath) => summarizeFragmentFile(child, filePath)).filter(Boolean));
      } catch (error) {
        config.log(`project-routes: failed to list pending child fragments for ${child.id}: ${error.message || 'unknown error'}`);
      }

      const [bugs, features, phases, workItems] = await Promise.all([
        typeof readBugItems === 'function' ? readBugItems(child.id, { includeArchived: true }) : [],
        typeof readFeatureItems === 'function' ? readFeatureItems(child.id, { includeArchived: true }) : [],
        typeof readRoadmapPhases === 'function' ? readRoadmapPhases(child.id, { includeArchived: true }) : [],
        typeof readProjectWorkItems === 'function' ? readProjectWorkItems(child.id) : [],
      ]);

      for (const bug of Array.isArray(bugs) ? bugs : []) {
        const status = normalizeStatus(bug?.status);
        if (bug?.archived || CLOSED_BUG_STATUSES.has(status)) continue;
        const item = summarizeRollupItem(child, bug, 'bugs');
        activeBugs.push(item);
        if (isRecentlyChanged(bug, now)) recentChanges.push({ ...item, rollupType: 'bug' });
      }

      for (const feature of Array.isArray(features) ? features : []) {
        const status = normalizeStatus(feature?.status);
        if (feature?.archived || INACTIVE_FEATURE_STATUSES.has(status)) continue;
        const item = summarizeRollupItem(child, feature, 'features');
        activeFeatures.push(item);
        if (isRecentlyChanged(feature, now)) recentChanges.push({ ...item, rollupType: 'feature' });
      }

      for (const phase of Array.isArray(phases) ? phases : []) {
        const status = normalizeStatus(phase?.status);
        if (phase?.archived || INACTIVE_PHASE_STATUSES.has(status)) continue;
        const item = summarizeRollupItem(child, phase, 'roadmap_core');
        activeRoadmapPhases.push(item);
        if (isRecentlyChanged(phase, now)) recentChanges.push({ ...item, rollupType: 'phase' });
      }

      for (const workItem of Array.isArray(workItems) ? workItems : []) {
        const status = normalizeStatus(workItem?.status);
        if (TERMINAL_WORK_STATUSES.has(status)) continue;
        const moduleKey = workItem?.workItemType === 'feature'
          ? 'features'
          : workItem?.workItemType === 'bug'
            ? 'bugs'
            : 'work_items_core';
        const item = summarizeRollupItem(child, workItem, moduleKey);
        if (status === 'blocked') blockedWork.push(item);
        if (isRecentlyChanged(workItem, now)) recentChanges.push({ ...item, rollupType: 'work' });
      }
    }

    const sortByProjectThenUpdated = (left, right) => (
      String(left.projectName || '').localeCompare(String(right.projectName || ''))
      || ((Date.parse(right.updatedAt || '') || 0) - (Date.parse(left.updatedAt || '') || 0))
      || String(left.title || '').localeCompare(String(right.title || ''))
    );
    pendingFragments.sort(sortByProjectThenUpdated);
    activeBugs.sort(sortByProjectThenUpdated);
    activeFeatures.sort(sortByProjectThenUpdated);
    activeRoadmapPhases.sort(sortByProjectThenUpdated);
    blockedWork.sort(sortByProjectThenUpdated);
    recentChanges.sort((left, right) => (Date.parse(right.updatedAt || '') || 0) - (Date.parse(left.updatedAt || '') || 0));

    return {
      projectId: parentProject.id,
      childProjectCount: descendants.length,
      pendingFragments,
      activeBugs,
      activeFeatures,
      activeRoadmapPhases,
      blockedWork,
      recentChanges: recentChanges.slice(0, 50),
    };
  }

  function createsParentCycle(projects, projectId, parentId) {
    if (!projectId || !parentId) return false;
    if (projectId === parentId) return true;
    const byId = new Map((Array.isArray(projects) ? projects : []).map((project) => [project.id, project]));
    let currentId = parentId;
    const visited = new Set();
    while (currentId && !visited.has(currentId)) {
      if (currentId === projectId) return true;
      visited.add(currentId);
      currentId = byId.get(currentId)?.parentId || null;
    }
    return false;
  }

  async function normalizeProjectParentId(parentId, projectId = null) {
    const value = parentId ? String(parentId).trim() : '';
    if (!value) return null;
    const projects = await readProjects();
    if (!projects.some((project) => project.id === value)) {
      const error = new Error('Parent project not found');
      error.statusCode = 400;
      throw error;
    }
    if (createsParentCycle(projects, projectId, value)) {
      const error = new Error('A project cannot be its own parent or descendant');
      error.statusCode = 400;
      throw error;
    }
    return value;
  }

  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await readProjects();
      for (const project of projects) {
        if (project?.type !== 'folder') continue;
        try {
          ensureWorkspaceProject(project);
        } catch (error) {
          config.log(`phase5: startup workspace reconciliation skipped for project ${project?.id || 'unknown'}: ${error.message || 'unknown error'}`);
        }
      }
      await writeProjectDataManifest(projects);
      res.json(await decorateProjects(projects));
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id/rollups', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json(await buildProjectFamilyRollupDetails(project));
    } catch (error) {
      config.log(`project-routes: failed to load project rollups for ${req.params.id}: ${error.message || 'unknown error'}`);
      res.status(500).json({ error: error.message || 'Failed to load project rollups' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const {
        type: sourceType,
        path: projectPath,
        url: projectUrl,
        name,
        description,
        parentId,
        category,
        tags,
        links,
        primaryAction,
        workspacePlugins,
        integrations,
        enabledModules,
      } = req.body || {};
      const projectType = normalizeRequestedProjectType(req.body || {}, 'general');
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
      const normalizedParentId = await normalizeProjectParentId(parentId);

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      let project;
      if (sourceType === 'url') {
        const url = String(projectUrl || '').trim();
        if (!url) return res.status(400).json({ error: 'URL is required for URL projects' });
        if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Invalid URL' });
        project = {
          id,
          type: 'url',
          path: null,
          absolutePath: null,
          url,
          name: String(name).trim(),
          description: description || '',
          parentId: normalizedParentId,
          serverId: null,
          openInCursor: false,
          openInCursorAdmin: false,
          pinned: false,
          imagePath: null,
          imageUrl: null,
          primaryAction: normalizeProjectPrimaryAction(primaryAction),
          projectType,
          workspacePlugins: normalizeWorkspacePlugins(workspacePlugins),
          enabledModules: Array.isArray(enabledModules) ? enabledModules : buildModuleRegistry(projectType, { enabledModuleKeys: workspacePlugins }).filter((module) => module.enabled).map((module) => module.moduleKey),
          category: category && String(category).trim() ? String(category).trim() : null,
          tags: Array.isArray(tags) ? tags.filter((tag) => tag != null && String(tag).trim()) : [],
          links: normalizeLinks(links),
          dateAdded: new Date().toISOString(),
          mappingGroups: defaultMappingGroups([]),
          integrations: normalizeProjectIntegrations(integrations),
        };
      } else {
        const requestedPath = String(projectPath || '').trim();
        if (!requestedPath) return res.status(400).json({ error: 'Folder path is required' });
        const resolved = config.resolveSafe(requestedPath);
        if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          return res.status(400).json({ error: 'Path is not an existing directory' });
        }
        project = {
          id,
          type: 'folder',
          path: requestedPath.replace(/\\/g, '/'),
          absolutePath: resolved,
          url: null,
          name: String(name).trim(),
          description: description || '',
          parentId: normalizedParentId,
          serverId: null,
          openInCursor: false,
          openInCursorAdmin: false,
          pinned: false,
          imagePath: null,
          imageUrl: null,
          primaryAction: normalizeProjectPrimaryAction(primaryAction),
          projectType,
          workspacePlugins: normalizeWorkspacePlugins(workspacePlugins),
          enabledModules: Array.isArray(enabledModules) ? enabledModules : buildModuleRegistry(projectType, { enabledModuleKeys: workspacePlugins }).filter((module) => module.enabled).map((module) => module.moduleKey),
          category: category && String(category).trim() ? String(category).trim() : null,
          tags: Array.isArray(tags) ? tags.filter((tag) => tag != null && String(tag).trim()) : [],
          links: normalizeLinks(links),
          dateAdded: new Date().toISOString(),
          mappingGroups: defaultMappingGroups([]),
          integrations: normalizeProjectIntegrations(integrations),
        };
      }

      const savedProject = await saveProject(project);
      await writeProjectDataManifest();
      res.json(await decorateProjectFromCurrentCollection(savedProject.id, savedProject));
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Failed to create project' });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const {
        name,
        description,
        parentId,
        serverId,
        category,
        tags,
        links,
        openInCursor,
        openInCursorAdmin,
        pinned,
        primaryAction,
        workspacePlugins,
        uploadMappings,
        mappingGroups,
        integrations,
        imagePath,
        imageUrl,
        path: nextProjectPath,
        projectPath,
        url: nextProjectUrl,
        projectUrl,
        projectType,
        enabledModules,
      } = req.body || {};

      if (name !== undefined) project.name = String(name || '').trim() || project.name;
      if (description !== undefined) project.description = String(description || '');
      if (parentId !== undefined) project.parentId = await normalizeProjectParentId(parentId, project.id);
      if (serverId !== undefined) project.serverId = serverId || null;
      if (category !== undefined) project.category = category && String(category).trim() ? String(category).trim() : null;
      if (tags !== undefined) project.tags = Array.isArray(tags) ? tags.filter((tag) => tag != null && String(tag).trim()) : [];
      if (links !== undefined) project.links = normalizeLinks(links);
      if (openInCursor !== undefined) project.openInCursor = !!openInCursor;
      if (openInCursorAdmin !== undefined) project.openInCursorAdmin = !!openInCursorAdmin;
      if (pinned !== undefined) project.pinned = !!pinned;
      if (primaryAction !== undefined) project.primaryAction = normalizeProjectPrimaryAction(primaryAction);
      if (projectType !== undefined) project.projectType = normalizeProjectType(projectType);
      if (workspacePlugins !== undefined) project.workspacePlugins = normalizeWorkspacePlugins(workspacePlugins);
      if (enabledModules !== undefined) project.enabledModules = Array.isArray(enabledModules) ? enabledModules : project.enabledModules;
      if (imagePath !== undefined) project.imagePath = imagePath || null;
      if (imageUrl !== undefined) {
        project.imageUrl = (imageUrl && String(imageUrl).trim()) || null;
        if (project.imageUrl) project.imagePath = null;
      }
      if (mappingGroups !== undefined) project.mappingGroups = normalizeMappingGroups(mappingGroups, project.uploadMappings);
      else if (uploadMappings !== undefined) project.mappingGroups = defaultMappingGroups(uploadMappings);
      if (integrations !== undefined) project.integrations = normalizeProjectIntegrations(integrations);

      const updatedPath = projectPath ?? nextProjectPath;
      if (updatedPath !== undefined && updatedPath !== '') {
        const resolved = config.resolveSafe(updatedPath);
        if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          return res.status(400).json({ error: 'Path is not an existing directory' });
        }
        project.path = String(updatedPath).replace(/\\/g, '/');
        project.absolutePath = resolved;
        project.type = 'folder';
        project.url = null;
      }

      const updatedUrl = projectUrl ?? nextProjectUrl;
      if (updatedUrl !== undefined) {
        const value = String(updatedUrl || '').trim();
        if (value) {
          if (!/^https?:\/\//i.test(value)) return res.status(400).json({ error: 'Invalid URL' });
          project.url = value;
          if (!updatedPath) {
            project.type = 'url';
            project.path = null;
            project.absolutePath = null;
          }
        } else if (project.type === 'url') {
          project.url = null;
        }
      }

      const savedProject = await saveProject(project);
      await writeProjectDataManifest();
      res.json(await decorateProjectFromCurrentCollection(savedProject.id, savedProject));
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      await deleteProject(req.params.id);
      await writeProjectDataManifest();
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  app.put('/api/projects/:id/image', async (req, res) => {
    try {
      const { imageData } = req.body || {};
      if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ error: 'imageData (data URL) required' });
      }
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      config.ensureDataDir();
      const projectImagesDir = config.getProjectImagesDir(project.id);
      if (!fs.existsSync(projectImagesDir)) fs.mkdirSync(projectImagesDir, { recursive: true });
      const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: 'Invalid image data' });
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const filename = `${req.params.id}.${ext}`;
      const imagePath = path.join(projectImagesDir, filename);
      fs.writeFileSync(imagePath, Buffer.from(match[2], 'base64'));
      project.imagePath = path.relative(config.getDataDir(), imagePath).replace(/\\/g, '/');
      project.imageUrl = null;
      const savedProject = await saveProject(project);
      res.json(await decorateProjectFromCurrentCollection(savedProject.id, savedProject));
    } catch (error) {
      console.error('Error saving project image:', error);
      res.status(500).json({ error: 'Failed to save project image' });
    }
  });

  app.get('/api/project-image/:id', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project || !project.imagePath) return res.status(404).send('Not found');
      const dataDir = config.getDataDir();
      const filePath = path.join(dataDir, project.imagePath);
      if (!path.resolve(filePath).startsWith(path.resolve(dataDir)) || !fs.existsSync(filePath)) {
        return res.status(404).send('Not found');
      }
      const ext = path.extname(project.imagePath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Error loading project image:', error);
      res.status(500).send('Failed to load image');
    }
  });

  app.put('/api/projects/:id/workspace-plugins', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const enabledPlugins = normalizeWorkspacePlugins(req.body && req.body.enabledPlugins);
      const currentPlugins = normalizeWorkspacePlugins(project.workspacePlugins);
      const removedPlugins = currentPlugins.filter((plugin) => !enabledPlugins.includes(plugin));
      const cleanupPlugins = Array.isArray(req.body && req.body.cleanupPlugins)
        ? req.body.cleanupPlugins.map((plugin) => String(plugin || '').trim().toLowerCase())
        : [];

      for (const plugin of removedPlugins) {
        await removeWorkspacePluginArtifacts(project, plugin, cleanupPlugins.includes(plugin));
      }

      project.workspacePlugins = enabledPlugins;
      const savedProject = await saveProject(project);

      if (enabledPlugins.includes('bugs')) await syncBugsDocument(savedProject);
      if (enabledPlugins.includes('features')) await syncFeaturesDocument(savedProject);
      if (enabledPlugins.includes('prd')) await syncPrdDocument(savedProject);
      await syncRoadmapDocument(savedProject);

      res.json({ workspacePlugins: savedProject.workspacePlugins || [] });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update workspace plugins' });
    }
  });

  app.get('/api/projects/:id/modules', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const modules = typeof syncProjectModules === 'function'
        ? await syncProjectModules(project)
        : await readProjectModules(project.id);
      res.json({
        projectId: project.id,
        projectType: project.projectType || 'general',
        modules: decorateModulesWithFragmentCounts(project, modules),
        dependencies: await readEntityRelationships(project.id, {
          sourceEntityType: 'module',
          relationshipType: 'depends_on',
          targetEntityType: 'module',
        }),
      });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to load project modules' });
    }
  });

  app.get('/api/projects/:id/ai-environment', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'ai_environment')) {
        return res.status(400).json({ error: 'AI Environment module is not enabled for this project' });
      }
      res.json(await syncAiEnvironmentDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load AI Environment' });
    }
  });

  app.put('/api/projects/:id/ai-environment', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'ai_environment')) {
        return res.status(400).json({ error: 'AI Environment module is not enabled for this project' });
      }
      const nextEditorState = req.body && req.body.editorState && typeof req.body.editorState === 'object'
        ? req.body.editorState
        : null;
      await saveProjectDocument(project.id, 'ai_environment', {
        markdown: '',
        mermaid: req.body && typeof req.body.mermaid === 'string'
          ? req.body.mermaid
          : 'flowchart TD\n  ai["AI Environment"] --> brief["Project Brief"]\n  ai --> modules["Affected Modules"]\n  ai --> fragments["Managed Fragments"]',
        editorState: nextEditorState,
      });
      res.json(await syncAiEnvironmentDocument(project, { skipImport: true }));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save AI Environment' });
    }
  });

  app.put('/api/projects/:id/modules', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const currentEnabledModules = Array.isArray(project.enabledModules)
        ? project.enabledModules.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
        : [];
      const projectType = normalizeRequestedProjectType(req.body || {}, project.projectType || 'general');
      const requestedEnabledModuleKeys = Array.isArray(req.body && req.body.enabledModules)
        ? req.body.enabledModules.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
        : project.enabledModules || [];
      const enabledModuleKeys = resolveEnabledModuleSelection(projectType, currentEnabledModules, requestedEnabledModuleKeys);
      const cleanupModules = Array.isArray(req.body && req.body.cleanupModules)
        ? req.body.cleanupModules.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
        : [];
      const registry = buildModuleRegistry(projectType, { enabledModuleKeys, existingModules: project.modules || [] });
      const nextEnabledModules = registry.filter((module) => module.enabled).map((module) => module.moduleKey);
      const removedModules = currentEnabledModules.filter((moduleKey) => !nextEnabledModules.includes(moduleKey));
      for (const moduleKey of removedModules) {
        await removeProjectModuleArtifacts(project, moduleKey, cleanupModules.includes(moduleKey));
      }
      project.projectType = projectType;
      project.enabledModules = nextEnabledModules;
      project.workspacePlugins = moduleKeysToLegacyWorkspacePlugins(project.enabledModules);
      project.modules = registry;

      const savedProject = await saveProject(project);
      if (savedProject.type === 'folder') {
        if (project.enabledModules.includes('ai_environment')) await syncAiEnvironmentDocument(savedProject);
        if (project.enabledModules.includes('architecture')) await syncArchitectureDocument(savedProject);
        if (project.enabledModules.includes('database_schema')) await syncDatabaseSchemaDocument(savedProject);
      }
      res.json({
        projectId: savedProject.id,
        projectType: savedProject.projectType,
        enabledModules: savedProject.enabledModules || [],
        workspacePlugins: savedProject.workspacePlugins || [],
        modules: decorateModulesWithFragmentCounts(savedProject, savedProject.modules || []),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update project modules' });
    }
  });

  app.get('/api/projects/:id/relationships', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      res.json(await readEntityRelationships(req.params.id, req.query || {}));
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to load relationships' });
    }
  });

  app.post('/api/projects/:id/relationships', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      const saved = await saveEntityRelationship({
        ...req.body,
        projectId: req.params.id,
      });
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save relationship' });
    }
  });

  app.delete('/api/projects/:id/relationships/:relationshipId', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      await deleteEntityRelationship(req.params.id, req.params.relationshipId);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to delete relationship' });
    }
  });
};
