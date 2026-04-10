const LEGACY_WORKSPACE_PLUGIN_KEYS = ['features', 'bugs', 'prd'];

const MODULE_DEFINITIONS = {
  project_brief: {
    key: 'project_brief',
    label: 'Project Brief',
    description: 'Define the root purpose, goals, context, and constraints for the project.',
    purposeSummary: 'Defines what this project is, why it exists, and the context everything else depends on.',
    group: 'core',
    hierarchyGroup: 'Foundation',
    hierarchyOrder: 0,
    hierarchyDepth: 0,
    core: true,
    enabledByDefault: true,
    documentType: 'project_brief',
    dependsOn: [],
  },
  roadmap: {
    key: 'roadmap',
    label: 'Roadmap',
    description: 'Plan phases, sequencing, and delivery flow.',
    purposeSummary: 'Plans the phases, sequencing, and major delivery steps for the project.',
    group: 'core',
    hierarchyGroup: 'Planning',
    hierarchyOrder: 10,
    hierarchyDepth: 0,
    core: true,
    enabledByDefault: true,
    documentType: 'roadmap',
    dependsOn: ['project_brief'],
  },
  board: {
    key: 'board',
    label: 'Kanban',
    description: 'Track work items on a board.',
    purposeSummary: 'Shows work items as a board so you can manage day-to-day execution.',
    group: 'core',
    hierarchyGroup: 'Planning',
    hierarchyOrder: 20,
    hierarchyDepth: 1,
    core: true,
    enabledByDefault: true,
    dependsOn: ['work_items'],
  },
  gantt: {
    key: 'gantt',
    label: 'Gantt',
    description: 'Visualize timeline and dependency flow.',
    purposeSummary: 'Shows timeline and dependency flow across planned work.',
    group: 'core',
    hierarchyGroup: 'Planning',
    hierarchyOrder: 30,
    hierarchyDepth: 1,
    core: true,
    enabledByDefault: true,
    dependsOn: ['work_items', 'roadmap'],
  },
  work_items: {
    key: 'work_items',
    label: 'Work Items',
    description: 'Manage the universal work item layer for the project.',
    purposeSummary: 'Tracks the core tasks and work records that planning views operate on.',
    group: 'core',
    hierarchyGroup: 'Planning',
    hierarchyOrder: 15,
    hierarchyDepth: 0,
    core: true,
    enabledByDefault: true,
    dependsOn: ['project_brief', 'roadmap'],
  },
  documents: {
    key: 'documents',
    label: 'Documents',
    description: 'Manage generated and reconciled project documents.',
    purposeSummary: 'Shows the managed documents and artifacts generated from project state.',
    group: 'core',
    hierarchyGroup: 'Records',
    hierarchyOrder: 40,
    hierarchyDepth: 0,
    core: true,
    enabledByDefault: true,
    dependsOn: [],
  },
  integrations: {
    key: 'integrations',
    label: 'Integrations',
    description: 'Configure external services and automation hooks.',
    purposeSummary: 'Connects the project to outside services, deployments, and automation.',
    group: 'core',
    hierarchyGroup: 'Records',
    hierarchyOrder: 50,
    hierarchyDepth: 0,
    core: true,
    enabledByDefault: true,
    dependsOn: [],
  },
  ai_environment: {
    key: 'ai_environment',
    label: 'AI Environment',
    description: 'Define how AI agents should interpret, update, and collaborate within this project.',
    purposeSummary: 'Defines how AI agents should read, update, and collaborate within this project.',
    group: 'ai',
    hierarchyGroup: 'AI',
    hierarchyOrder: 55,
    hierarchyDepth: 0,
    core: false,
    enabledByDefault: false,
    documentType: 'ai_environment',
    dependsOn: ['project_brief', 'documents'],
  },
  features: {
    key: 'features',
    label: 'Features',
    description: 'Track software feature work items.',
    purposeSummary: 'Tracks the capabilities the software needs to deliver.',
    group: 'software',
    hierarchyGroup: 'Product Delivery',
    hierarchyOrder: 20,
    hierarchyDepth: 0,
    core: false,
    enabledByDefault: true,
    legacyWorkspacePlugin: 'features',
    documentType: 'features',
    dependsOn: ['roadmap', 'work_items'],
  },
  bugs: {
    key: 'bugs',
    label: 'Bugs',
    description: 'Track software issues and regressions.',
    purposeSummary: 'Tracks defects, regressions, and the fixes they require.',
    group: 'software',
    hierarchyGroup: 'Product Delivery',
    hierarchyOrder: 30,
    hierarchyDepth: 0,
    core: false,
    enabledByDefault: true,
    legacyWorkspacePlugin: 'bugs',
    documentType: 'bugs',
    dependsOn: ['work_items', 'roadmap'],
  },
  changelog: {
    key: 'changelog',
    label: 'Change Log',
    description: 'Track human-readable document change history with work item references.',
    purposeSummary: 'Records human-readable history for document-impacting changes and ties them back to feature and bug work.',
    group: 'software',
    hierarchyGroup: 'Records',
    hierarchyOrder: 35,
    hierarchyDepth: 0,
    core: false,
    enabledByDefault: true,
    documentType: 'changelog',
    dependsOn: ['documents', 'features', 'bugs'],
  },
  prd: {
    key: 'prd',
    label: 'PRD',
    description: 'Design and maintain product requirements.',
    purposeSummary: 'Defines what product we are building, for whom, and why it matters.',
    group: 'software',
    hierarchyGroup: 'Product Definition',
    hierarchyOrder: 10,
    hierarchyDepth: 0,
    core: false,
    enabledByDefault: true,
    legacyWorkspacePlugin: 'prd',
    documentType: 'prd',
    dependsOn: ['project_brief', 'roadmap', 'features', 'documents'],
  },
  functional_spec: {
    key: 'functional_spec',
    label: 'Functional Spec',
    description: 'Describe functional requirements and expected behavior.',
    purposeSummary: 'Defines how the software should behave in precise, testable terms.',
    group: 'software',
    hierarchyGroup: 'Requirements',
    hierarchyOrder: 40,
    hierarchyDepth: 1,
    hierarchyParent: 'prd',
    core: false,
    enabledByDefault: false,
    documentType: 'functional_spec',
    dependsOn: ['prd', 'roadmap', 'features', 'bugs'],
  },
  architecture: {
    key: 'architecture',
    label: 'Architecture',
    description: 'Shape the system boundaries, components, and flows.',
    purposeSummary: 'Defines the system shape, boundaries, major parts, and how they connect.',
    group: 'software',
    hierarchyGroup: 'System Design',
    hierarchyOrder: 50,
    hierarchyDepth: 2,
    hierarchyParent: 'functional_spec',
    core: false,
    enabledByDefault: false,
    documentType: 'architecture',
    dependsOn: ['project_brief', 'functional_spec', 'integrations'],
  },
  database_schema: {
    key: 'database_schema',
    label: 'Database Schema',
    description: 'Design entities, relationships, and migrations for software data.',
    purposeSummary: 'Defines how the software data is structured, related, and evolved.',
    group: 'software',
    hierarchyGroup: 'System Design',
    hierarchyOrder: 60,
    hierarchyDepth: 3,
    hierarchyParent: 'architecture',
    core: false,
    enabledByDefault: false,
    documentType: 'database_schema',
    dependsOn: ['architecture', 'functional_spec'],
  },
  technical_design: {
    key: 'technical_design',
    label: 'Technical Design',
    description: 'Capture implementation design for software capabilities.',
    purposeSummary: 'Defines how a specific capability or subsystem should be implemented.',
    group: 'software',
    hierarchyGroup: 'System Design',
    hierarchyOrder: 70,
    hierarchyDepth: 3,
    hierarchyParent: 'architecture',
    core: false,
    enabledByDefault: false,
    documentType: 'technical_design',
    dependsOn: ['architecture', 'database_schema'],
  },
  experience_design: {
    key: 'experience_design',
    label: 'Experience Design',
    description: 'Design user journeys, interactions, states, and interface behavior.',
    purposeSummary: 'Defines how the product should feel, flow, and behave for the user.',
    group: 'software',
    hierarchyGroup: 'Requirements',
    hierarchyOrder: 45,
    hierarchyDepth: 1,
    hierarchyParent: 'prd',
    core: false,
    enabledByDefault: false,
    documentType: 'experience_design',
    dependsOn: ['prd', 'functional_spec'],
  },
  adr: {
    key: 'adr',
    label: 'ADR',
    description: 'Record important architectural decisions and tradeoffs.',
    purposeSummary: 'Records why key technical decisions were made and what tradeoffs they carry.',
    group: 'software',
    hierarchyGroup: 'Validation & Decisions',
    hierarchyOrder: 80,
    hierarchyDepth: 3,
    hierarchyParent: 'architecture',
    core: false,
    enabledByDefault: false,
    documentType: 'adr',
    dependsOn: ['architecture', 'database_schema', 'technical_design'],
  },
  test_strategy: {
    key: 'test_strategy',
    label: 'Test Strategy',
    description: 'Plan how the software will be validated.',
    purposeSummary: 'Defines how we will prove the software works and where validation effort goes.',
    group: 'software',
    hierarchyGroup: 'Validation & Decisions',
    hierarchyOrder: 90,
    hierarchyDepth: 2,
    hierarchyParent: 'functional_spec',
    core: false,
    enabledByDefault: false,
    documentType: 'test_strategy',
    dependsOn: ['functional_spec', 'architecture', 'features', 'bugs'],
  },
};

const PROJECT_TYPE_DEFINITIONS = {
  general: {
    key: 'general',
    label: 'General Project',
    description: 'Universal project workspace with roadmap and planning tools.',
    defaultModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations'],
    availableModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'ai_environment'],
  },
  software: {
    key: 'software',
    label: 'Software Project',
    description: 'Project workspace specialized for designing and building software.',
    defaultModules: ['project_brief', 'roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations', 'features', 'bugs', 'changelog', 'prd'],
    availableModules: [
      'project_brief',
      'roadmap',
      'board',
      'gantt',
      'work_items',
      'documents',
      'integrations',
      'ai_environment',
      'features',
      'bugs',
      'changelog',
      'prd',
      'functional_spec',
      'architecture',
      'database_schema',
      'technical_design',
      'experience_design',
      'adr',
      'test_strategy',
    ],
  },
};

function normalizeProjectType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return PROJECT_TYPE_DEFINITIONS[normalized] ? normalized : 'general';
}

function getProjectTypeDefinition(projectType) {
  return PROJECT_TYPE_DEFINITIONS[normalizeProjectType(projectType)];
}

function listProjectTypes() {
  return Object.values(PROJECT_TYPE_DEFINITIONS).map((definition) => ({
    ...definition,
    availableModules: definition.availableModules.map((key) => getModuleDefinition(key)),
  }));
}

function getModuleDefinition(moduleKey) {
  const normalized = String(moduleKey || '').trim().toLowerCase();
  const definition = MODULE_DEFINITIONS[normalized];
  if (!definition) return null;
  const projectTypes = Object.values(PROJECT_TYPE_DEFINITIONS)
    .filter((projectType) => projectType.availableModules.includes(definition.key))
    .map((projectType) => projectType.key);
  return {
    ...definition,
    projectTypes,
    dependsOn: Array.isArray(definition.dependsOn) ? definition.dependsOn.slice() : [],
  };
}

function getAvailableModuleKeys(projectType) {
  return getProjectTypeDefinition(projectType).availableModules.slice();
}

function getDefaultEnabledModuleKeys(projectType) {
  return getProjectTypeDefinition(projectType).defaultModules.slice();
}

function normalizeEnabledModuleKeys(projectType, enabledModuleKeys = []) {
  const allowed = new Set(getAvailableModuleKeys(projectType));
  const requested = Array.isArray(enabledModuleKeys)
    ? enabledModuleKeys.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const merged = new Set(getDefaultEnabledModuleKeys(projectType).filter((key) => {
    const definition = getModuleDefinition(key);
    return definition && definition.core;
  }));
  for (const key of requested) {
    if (allowed.has(key)) merged.add(key);
  }
  return [...merged];
}

function getModuleDependencyKeys(moduleKey) {
  return getModuleDefinition(moduleKey)?.dependsOn || [];
}

function getModuleDependentKeys(projectType, moduleKey, withinModuleKeys = null) {
  const allowed = new Set(
    Array.isArray(withinModuleKeys) && withinModuleKeys.length
      ? withinModuleKeys.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
      : getAvailableModuleKeys(projectType)
  );
  return [...allowed].filter((candidateKey) => getModuleDependencyKeys(candidateKey).includes(moduleKey));
}

function expandEnabledModulesWithDependencies(projectType, enabledModuleKeys = []) {
  const allowed = new Set(getAvailableModuleKeys(projectType));
  const expanded = new Set(normalizeEnabledModuleKeys(projectType, enabledModuleKeys));
  const queue = [...expanded];
  while (queue.length) {
    const moduleKey = queue.shift();
    for (const dependencyKey of getModuleDependencyKeys(moduleKey)) {
      if (!allowed.has(dependencyKey) || expanded.has(dependencyKey)) continue;
      expanded.add(dependencyKey);
      queue.push(dependencyKey);
    }
  }
  return [...expanded];
}

function resolveEnabledModuleSelection(projectType, currentEnabledModuleKeys = [], requestedEnabledModuleKeys = []) {
  const current = new Set(normalizeEnabledModuleKeys(projectType, currentEnabledModuleKeys));
  const requested = new Set(normalizeEnabledModuleKeys(projectType, requestedEnabledModuleKeys));
  const explicitlyDisabled = [...current].filter((moduleKey) => !requested.has(moduleKey));
  const queue = [...explicitlyDisabled];
  while (queue.length) {
    const removedKey = queue.shift();
    for (const dependentKey of getModuleDependentKeys(projectType, removedKey, [...requested])) {
      if (!requested.has(dependentKey)) continue;
      requested.delete(dependentKey);
      queue.push(dependentKey);
    }
  }
  return expandEnabledModulesWithDependencies(projectType, [...requested]);
}

function resolveProjectType(projectType, enabledModuleKeys = [], legacyWorkspacePlugins = [], fallback = 'general') {
  const explicit = normalizeProjectType(projectType || fallback);
  const enabled = new Set([
    ...normalizeEnabledModuleKeys(explicit, enabledModuleKeys),
    ...normalizeLegacyWorkspacePlugins(legacyWorkspacePlugins),
    ...enabledModuleKeys.map((key) => String(key || '').trim().toLowerCase()),
  ]);
  if (explicit === 'software') return 'software';
  for (const key of enabled) {
    const definition = getModuleDefinition(key);
    if (definition && definition.group === 'software') return 'software';
  }
  return explicit;
}

function normalizeLegacyWorkspacePlugins(value) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(LEGACY_WORKSPACE_PLUGIN_KEYS);
  return [...new Set(value.map((item) => String(item || '').trim().toLowerCase()).filter((item) => allowed.has(item)))];
}

function moduleKeysToLegacyWorkspacePlugins(moduleKeys = []) {
  const enabled = new Set(moduleKeys.map((key) => String(key || '').trim().toLowerCase()));
  return LEGACY_WORKSPACE_PLUGIN_KEYS.filter((key) => enabled.has(key));
}

function buildModuleRegistry(projectType, options = {}) {
  const normalizedProjectType = normalizeProjectType(projectType);
  const availableKeys = getAvailableModuleKeys(normalizedProjectType);
  const enabledKeys = new Set(expandEnabledModulesWithDependencies(normalizedProjectType, options.enabledModuleKeys || []));
  const existingByKey = new Map(
    Array.isArray(options.existingModules)
      ? options.existingModules
        .filter((moduleRow) => moduleRow && moduleRow.moduleKey)
        .map((moduleRow) => [moduleRow.moduleKey, moduleRow])
      : []
  );

  return availableKeys.map((moduleKey, index) => {
    const definition = getModuleDefinition(moduleKey);
    const existing = existingByKey.get(moduleKey);
    return {
      moduleKey,
      label: definition.label,
      description: definition.description,
      purposeSummary: existing && existing.purposeSummary
        ? existing.purposeSummary
        : (definition.purposeSummary || definition.description),
      group: definition.group,
      core: !!definition.core,
      enabled: definition.core ? true : enabledKeys.has(moduleKey),
      sortOrder: existing && Number.isFinite(Number(existing.sortOrder)) ? Number(existing.sortOrder) : index,
      settings: existing && existing.settings ? existing.settings : {},
      documentType: definition.documentType || null,
      legacyWorkspacePlugin: definition.legacyWorkspacePlugin || null,
      dependsOn: definition.dependsOn || [],
      hierarchyGroup: definition.hierarchyGroup || null,
      hierarchyOrder: Number.isFinite(Number(definition.hierarchyOrder)) ? Number(definition.hierarchyOrder) : index,
      hierarchyDepth: Number.isFinite(Number(definition.hierarchyDepth)) ? Number(definition.hierarchyDepth) : 0,
      hierarchyParent: definition.hierarchyParent || null,
    };
  });
}

module.exports = {
  LEGACY_WORKSPACE_PLUGIN_KEYS,
  MODULE_DEFINITIONS,
  PROJECT_TYPE_DEFINITIONS,
  normalizeProjectType,
  getProjectTypeDefinition,
  listProjectTypes,
  getModuleDefinition,
  getAvailableModuleKeys,
  getDefaultEnabledModuleKeys,
  normalizeEnabledModuleKeys,
  getModuleDependencyKeys,
  getModuleDependentKeys,
  expandEnabledModulesWithDependencies,
  resolveEnabledModuleSelection,
  resolveProjectType,
  normalizeLegacyWorkspacePlugins,
  moduleKeysToLegacyWorkspacePlugins,
  buildModuleRegistry,
};
