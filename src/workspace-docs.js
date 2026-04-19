const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const TEMPLATE_DIR = path.join(config.APP_DIR, 'templates');
const STANDARDS_DIR = path.join(config.APP_DIR, 'standards');
const SOFTWARE_STANDARDS_REFERENCE_REGISTRY_NAME = 'SOFTWARE_STANDARDS_REFERENCE_REGISTRY.md';
const DOC_TYPES = {
  project_brief: {
    fileName: 'PROJECT_BRIEF.md',
    templateName: 'PROJECT_BRIEF.template.md',
  },
  roadmap: {
    fileName: 'ROADMAP.md',
    templateName: 'ROADMAP.template.md',
  },
  bugs: {
    fileName: 'BUGS.md',
    templateName: 'BUGS.template.md',
  },
  changelog: {
    fileName: 'CHANGELOG.md',
    templateName: 'CHANGELOG.template.md',
  },
  features: {
    fileName: 'FEATURES.md',
    templateName: 'FEATURES.template.md',
  },
  prd: {
    fileName: 'PRD.md',
    templateName: 'PRD.template.md',
  },
  architecture: {
    fileName: 'ARCHITECTURE.md',
    templateName: 'ARCHITECTURE.template.md',
  },
  database_schema: {
    fileName: 'DATABASE_SCHEMA.md',
    templateName: 'DATABASE_SCHEMA.template.md',
  },
  ai_environment: {
    fileName: 'AI_ENVIRONMENT.md',
    templateName: 'AI_ENVIRONMENT.template.md',
  },
  functional_spec: {
    fileName: 'FUNCTIONAL_SPEC.md',
    templateName: 'FUNCTIONAL_SPEC.template.md',
  },
  domain_models: {
    fileName: 'DOMAIN_MODELS.md',
    templateName: 'DOMAIN_MODELS.template.md',
  },
  technical_design: {
    fileName: 'TECHNICAL_DESIGN.md',
    templateName: 'TECHNICAL_DESIGN.template.md',
  },
  experience_design: {
    fileName: 'EXPERIENCE_DESIGN.md',
    templateName: 'EXPERIENCE_DESIGN.template.md',
  },
  adr: {
    fileName: 'ADR.md',
    templateName: 'ADR.template.md',
  },
  test_strategy: {
    fileName: 'TEST_STRATEGY.md',
    templateName: 'TEST_STRATEGY.template.md',
  },
};
const FRAGMENT_TEMPLATE_NAMES = {
  project_brief: 'PROJECT_BRIEF_FRAGMENT.template.md',
  roadmap: 'ROADMAP_FRAGMENT.template.md',
  bugs: 'BUGS_FRAGMENT.template.md',
  changelog: 'CHANGELOG_FRAGMENT.template.md',
  features: 'FEATURES_FRAGMENT.template.md',
  prd: 'PRD_FRAGMENT.template.md',
  architecture: 'ARCHITECTURE_FRAGMENT.template.md',
  database_schema: 'DATABASE_SCHEMA_FRAGMENT.template.md',
  ai_environment: 'AI_ENVIRONMENT_FRAGMENT.template.md',
  functional_spec: 'FUNCTIONAL_SPEC_FRAGMENT.template.md',
  domain_models: 'DOMAIN_MODELS_FRAGMENT.template.md',
  technical_design: 'TECHNICAL_DESIGN_FRAGMENT.template.md',
  experience_design: 'EXPERIENCE_DESIGN_FRAGMENT.template.md',
  adr: 'ADR_FRAGMENT.template.md',
  test_strategy: 'TEST_STRATEGY_FRAGMENT.template.md',
};
const FRAGMENT_DOC_TYPE_ALIASES = {
  ux_ui_fragment: 'experience_design_fragment',
  ux_ui: 'experience_design',
  ai_environment_directive: 'ai_environment_fragment',
  ai_environment_suggestion: 'ai_environment_fragment',
};
const FRAGMENT_DOC_TYPES_BY_MODULE = {
  project_brief: ['project_brief_fragment'],
  roadmap: ['roadmap_fragment'],
  bugs: ['bugs_fragment'],
  changelog: ['changelog_fragment'],
  features: ['features_fragment'],
  prd: ['prd_fragment'],
  architecture: ['architecture_fragment'],
  database_schema: ['database_schema_fragment'],
  ai_environment: ['ai_environment_fragment', 'ai_environment_directive', 'ai_environment_suggestion', 'ai_environment'],
  functional_spec: ['functional_spec_fragment'],
  domain_models: ['domain_models_fragment'],
  technical_design: ['technical_design_fragment'],
  experience_design: ['experience_design_fragment', 'ux_ui_fragment'],
  adr: ['adr_fragment'],
  test_strategy: ['test_strategy_fragment'],
};
const PRD_FRAGMENT_TEMPLATE_NAME = FRAGMENT_TEMPLATE_NAMES.prd;
const ROADMAP_FRAGMENT_TEMPLATE_NAME = FRAGMENT_TEMPLATE_NAMES.roadmap;
const DATABASE_SCHEMA_FRAGMENT_TEMPLATE_NAME = FRAGMENT_TEMPLATE_NAMES.database_schema;

const AI_DIRECTIVE_MODULE_LABELS = {
  project_brief: 'Project Brief',
  roadmap: 'Roadmap',
  bugs: 'Bugs',
  changelog: 'Change Log',
  features: 'Features',
  prd: 'PRD',
  architecture: 'Architecture',
  database_schema: 'Database Schema',
  functional_spec: 'Functional Spec',
  domain_models: 'Domain Models',
  technical_design: 'Technical Design',
  experience_design: 'Experience Design',
  adr: 'ADR',
  test_strategy: 'Test Strategy',
};

const AI_MODULE_DIRECTIVE_DEFINITIONS = [
  {
    id: 'apm.module.roadmap.active-feature-context',
    moduleKey: 'roadmap',
    title: 'Use active roadmap and feature context',
    description: 'Use active feature IDs for planning and implementation context, and ignore archived features unless the task is explicitly historical.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.roadmap.fragment-first-changes',
    moduleKey: 'roadmap',
    title: 'Propose roadmap changes through fragments',
    description: 'When proposing roadmap changes, create or update a ROADMAP_FRAGMENT document instead of editing ROADMAP.md directly.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.features.destination-fragments',
    moduleKey: 'features',
    title: 'Implemented features create destination fragments',
    description: 'When feature implementation changes canonical documents, create destination fragments for affected modules and keep the feature code attached.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.bugs.lifecycle-and-archive',
    moduleKey: 'bugs',
    title: 'Preserve bug lifecycle and archive rules',
    description: 'Only active bugs remain in BUGS.md; resolved or closed bugs move to archived history and create follow-up guidance for affected documents.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.bugs.regression-test-followup',
    moduleKey: 'bugs',
    title: 'Generate regression tests for bug fixes',
    description: 'When a bug fix is implemented, create or update regression-test guidance in Test Strategy and any affected downstream module so the fixed behavior can be verified before the bug is closed.',
    locked: true,
    required: true,
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.changelog.traceability',
    moduleKey: 'changelog',
    title: 'Record document-impacting changes in the Change Log',
    description: 'When feature or bug work updates a managed document, create or update a Change Log entry with work item code, target document, target section, stable item id, and summary.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.database-schema.fragment-boundary',
    moduleKey: 'database_schema',
    title: 'Keep schema changes inside schema workflows',
    description: 'Do not edit DATABASE_SCHEMA.md, DATABASE_SCHEMA.dbml, or the canonical schema model directly; use full schema capture or schema fragments through the Database Schema module.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.database-schema.full-import-boundary',
    moduleKey: 'database_schema',
    title: 'Do not treat partial schema fragments as full imports',
    description: 'Migration-sized or partial Database Schema fragments must not replace the full schema model unless additive schema operations are explicitly supported.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.functional-spec.flow-ids',
    moduleKey: 'functional_spec',
    title: 'Functional flows require stable ids',
    description: 'Every workflow, node, edge, control point, model reference, and open question should have stable ids so fragments can target them precisely.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.functional-spec.action-vocabulary',
    moduleKey: 'functional_spec',
    title: 'Functional Spec actions must be readable',
    description: 'Functional Spec templates and generated documents must expose node, connection, canvas, and smart-text actions so humans and AI agents understand the flowchart vocabulary.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.domain-models.conceptual-first',
    moduleKey: 'domain_models',
    title: 'Domain models are conceptual first',
    description: 'Do not treat Domain Models as database tables, UI forms, API payloads, or implementation classes; use projections to connect them downstream.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.architecture.adr-capture',
    moduleKey: 'architecture',
    title: 'Create ADR records for architectural decisions',
    description: 'When work introduces, changes, or reverses a significant architectural decision, update Architecture and create or update ADR records.',
    locked: true,
    required: false,
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.technical-design.implementation-details',
    moduleKey: 'technical_design',
    title: 'Technical Design owns implementation detail',
    description: 'Keep Technical Design focused on stack choices, libraries, implementation mechanics, deployment/runtime detail, and subsystem build decisions.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.experience-design.user-behavior',
    moduleKey: 'experience_design',
    title: 'Experience Design owns user-facing behavior',
    description: 'Use Experience Design for interface behavior, UI states, user feedback, navigation paths, and how users experience flows.',
    emitsToAiEnvironment: true,
  },
  {
    id: 'apm.module.test-strategy.validation-focus',
    moduleKey: 'test_strategy',
    title: 'Test Strategy owns validation guidance',
    description: 'Use Test Strategy for validation approach, regression expectations, test environments, and evidence that requirements are satisfied.',
    emitsToAiEnvironment: true,
  },
];

function getDocDefinition(docType) {
  const definition = DOC_TYPES[docType];
  if (!definition) throw new Error(`Unsupported document type: ${docType}`);
  return definition;
}

function resolveProjectDirectory(project) {
  if (!project || project.type !== 'folder') return null;
  const candidates = [];
  if (project.absolutePath) candidates.push(path.resolve(project.absolutePath));
  if (project.path) {
    if (path.isAbsolute(project.path)) candidates.push(path.resolve(project.path));
    const safePath = config.resolveSafe(project.path);
    if (safePath) candidates.push(path.resolve(safePath));
  }
  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];
  return uniqueCandidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory())
    || uniqueCandidates[0]
    || null;
}

function getProjectDocsDir(project) {
  const projectDir = resolveProjectDirectory(project);
  if (!projectDir) return null;
  return path.join(projectDir, 'docs');
}

function getProjectApmDir(project) {
  const projectDir = resolveProjectDirectory(project);
  if (!projectDir) return null;
  return path.join(projectDir, '.apm');
}

function getProjectsDataDir() {
  return config.getProjectsDataDir();
}

function getProjectDataDir(project) {
  if (!project || !project.id) return null;
  return config.getProjectDataDir(project.id);
}

function getSharedProjectDataDir() {
  return config.getSharedProjectDataDir();
}

function getProjectTemplatesDir(project) {
  const projectDataDir = getProjectDataDir(project);
  if (!projectDataDir) return null;
  return path.join(projectDataDir, 'templates');
}

function getProjectStandardsDir(project) {
  const projectDataDir = getProjectDataDir(project);
  if (!projectDataDir) return null;
  return path.join(projectDataDir, 'standards');
}

function getProjectSoftwareStandardsDir(project) {
  const standardsDir = getProjectStandardsDir(project);
  if (!standardsDir) return null;
  return path.join(standardsDir, 'software');
}

function getProjectWorkspaceDir(project) {
  const apmDir = getProjectApmDir(project);
  if (!apmDir) return null;
  return path.join(apmDir, '_WORKSPACE');
}

function sanitizeFragmentFolderName(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'project';
}

function getFragmentsRootDir() {
  return getProjectsDataDir();
}

function getSharedFragmentsDir() {
  return path.join(getSharedProjectDataDir(), 'fragments');
}

function getProjectFragmentsDir(project) {
  if (!project || !project.id) return null;
  return path.join(config.getProjectDataDir(project.id), 'fragments');
}

function ensureProjectFragmentsDir(project) {
  const projectFragmentsDir = getProjectFragmentsDir(project);
  if (!projectFragmentsDir) throw new Error('Project id is required to manage fragment documents.');
  if (!fs.existsSync(projectFragmentsDir)) {
    fs.mkdirSync(projectFragmentsDir, { recursive: true });
    config.log(`workspace-docs: created project fragments directory ${projectFragmentsDir}`);
  }
  return projectFragmentsDir;
}

function ensureSharedFragmentsDir() {
  const sharedDir = getSharedFragmentsDir();
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
    config.log(`workspace-docs: created shared fragments directory ${sharedDir}`);
  }
  return sharedDir;
}

function ensureProjectDocsDir(project) {
  const projectDir = resolveProjectDirectory(project);
  if (!projectDir) throw new Error('Project must be a folder project to manage markdown documents.');
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    throw new Error(`Project folder does not exist: ${projectDir}`);
  }
  const docsDir = getProjectDocsDir(project);
  if (!docsDir) throw new Error('Project must be a folder project to manage markdown documents.');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    config.log(`workspace-docs: created docs directory ${docsDir}`);
  }
  return docsDir;
}

function ensureProjectTemplatesDir(project) {
  const templatesDir = getProjectTemplatesDir(project);
  if (!templatesDir) throw new Error('Project id is required to manage templates.');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
    config.log(`workspace-docs: created templates directory ${templatesDir}`);
  }
  return templatesDir;
}

function ensureProjectStandardsDir(project) {
  const standardsDir = getProjectStandardsDir(project);
  if (!standardsDir) throw new Error('Project id is required to manage standards references.');
  if (!fs.existsSync(standardsDir)) {
    fs.mkdirSync(standardsDir, { recursive: true });
    config.log(`workspace-docs: created standards directory ${standardsDir}`);
  }
  const softwareStandardsDir = getProjectSoftwareStandardsDir(project);
  if (!softwareStandardsDir) throw new Error('Project id is required to manage software standards references.');
  if (!fs.existsSync(softwareStandardsDir)) {
    fs.mkdirSync(softwareStandardsDir, { recursive: true });
    config.log(`workspace-docs: created software standards directory ${softwareStandardsDir}`);
  }
  return standardsDir;
}

function ensureProjectWorkspaceDir(project) {
  const projectDir = resolveProjectDirectory(project);
  if (!projectDir) throw new Error('Project must be a folder project to manage workspace files.');
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    throw new Error(`Project folder does not exist: ${projectDir}`);
  }
  const apmDir = getProjectApmDir(project);
  if (!apmDir) throw new Error('Project must be a folder project to manage workspace files.');
  if (!fs.existsSync(apmDir)) {
    fs.mkdirSync(apmDir, { recursive: true });
    config.log(`workspace-docs: created .apm directory ${apmDir}`);
  }
  const workspaceDir = getProjectWorkspaceDir(project);
  if (!workspaceDir) throw new Error('Project must be a folder project to manage workspace files.');
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
    config.log(`workspace-docs: created workspace directory ${workspaceDir}`);
  }
  const todoPath = path.join(workspaceDir, 'TODO.md');
  if (!fs.existsSync(todoPath)) {
    fs.writeFileSync(
      todoPath,
      [
        '# APM Workspace TODO',
        '',
        'This folder is volatile scratch space for AI working files such as TODO lists, draft plans, and temporary notes.',
        '',
        '## Current TODOs',
        '',
        '- Add fragment update/versioning support for managed fragment workflows.',
        '',
      ].join('\n'),
      'utf8'
    );
    config.log(`workspace-docs: seeded workspace todo ${todoPath}`);
  }
  syncSoftwareStandardsForProject(project);
  return workspaceDir;
}

function getSoftwareStandardsRegistrySourcePath() {
  return path.join(STANDARDS_DIR, 'software', SOFTWARE_STANDARDS_REFERENCE_REGISTRY_NAME);
}

function getProjectSoftwareStandardsRegistryPath(project) {
  const softwareStandardsDir = getProjectSoftwareStandardsDir(project);
  if (!softwareStandardsDir) return null;
  return path.join(softwareStandardsDir, SOFTWARE_STANDARDS_REFERENCE_REGISTRY_NAME);
}

function syncDirectoryContents(sourceDir, targetDir, label) {
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    config.log(`workspace-docs: ${label} source directory missing at ${sourceDir}`);
    return [];
  }
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    config.log(`workspace-docs: created ${label} target directory ${targetDir}`);
  }
  const syncedPaths = [];
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      syncedPaths.push(...syncDirectoryContents(sourcePath, targetPath, label));
      continue;
    }
    fs.copyFileSync(sourcePath, targetPath);
    syncedPaths.push(targetPath);
    config.log(`workspace-docs: synced ${label} file ${sourcePath} -> ${targetPath}`);
  }
  return syncedPaths;
}

function syncSoftwareStandardsForProject(project) {
  ensureProjectStandardsDir(project);
  const sourceDir = path.join(STANDARDS_DIR, 'software');
  const targetDir = getProjectSoftwareStandardsDir(project);
  if (!targetDir) throw new Error('Project must be a folder project to manage software standards references.');
  syncDirectoryContents(sourceDir, targetDir, 'software standards');
  return getProjectSoftwareStandardsRegistryPath(project);
}

function syncSoftwareStandardsRegistryForProject(project) {
  return syncSoftwareStandardsForProject(project);
}

function getArchivedBugWorkspaceNotePath(project, bug) {
  const workspaceDir = getProjectWorkspaceDir(project);
  if (!workspaceDir || !bug) return null;
  const baseName = sanitizeFragmentFolderName(`${bug.code || bug.id}_ARCHIVED`);
  return path.join(workspaceDir, `${baseName}.md`);
}

function renderArchivedBugWorkspaceNote(project, bug) {
  const associationHints = parseAssociationHintTokens(bug.associationHints);
  return [
    `# Archived Bug Follow-Up: ${bug.code || bug.id} - ${bug.title || 'Bug'}`,
    '',
    'This workspace note exists so AI agents can complete the documentation follow-up for an archived bug fix.',
    '',
    '## Required Follow-Up',
    '',
    '- Generate the appropriate fragments for the affected canonical documents.',
    '- Update the canonical documents to reflect the implemented fix.',
    '- Attach the bug code to the affected document items so the fix is traceable.',
    '- Update the Change Log with the affected document ids and the bug code.',
    '- Remove this workspace note automatically if the bug moves back into an active state.',
    '',
    '## Bug Summary',
    '',
    `- Bug Code: ${bug.code || bug.id}`,
    `- Lifecycle Status: ${getBugLifecycleMetadata(bug.status).label} (\`${normalizeBugLifecycleStatus(bug.status)}\`)`,
    `- Planning Bucket: ${formatBugPlanningBucketLabel(bug.planningBucket)} (\`${bug.planningBucket || 'archived'}\`)`,
    `- Linked Task: ${bug.taskId || 'None'}`,
    `- Affected Modules: ${Array.isArray(bug.affectedModuleKeys) && bug.affectedModuleKeys.length ? bug.affectedModuleKeys.join(', ') : 'None'}`,
    `- Association Hints: ${associationHints.length ? associationHints.join(', ') : 'None'}`,
    `- Last Updated: ${formatDocDateTime(bug.updatedAt)}`,
    '',
    '## Current Behavior',
    '',
    renderBugLiteralTextBlock(bug.currentBehavior || bug.summary || '', 'No current behavior recorded yet.'),
    '',
    '## Expected Behavior',
    '',
    renderBugLiteralTextBlock(bug.expectedBehavior || '', 'No expected behavior recorded yet.'),
    '',
  ].join('\n');
}

function syncArchivedBugWorkspaceNotes(project, bugs) {
  const workspaceDir = getProjectWorkspaceDir(project);
  if (!workspaceDir) return [];
  ensureProjectWorkspaceDir(project);
  const list = Array.isArray(bugs) ? bugs : [];
  const touchedPaths = [];

  for (const bug of list) {
    const notePath = getArchivedBugWorkspaceNotePath(project, bug);
    if (!notePath) continue;
    if (isArchivedBugLifecycleItem(bug)) {
      fs.writeFileSync(notePath, renderArchivedBugWorkspaceNote(project, bug), 'utf8');
      touchedPaths.push(notePath);
    } else if (fs.existsSync(notePath)) {
      fs.unlinkSync(notePath);
    }
  }

  return touchedPaths;
}

function syncTemplateFileForProject(project, templateName, templateKind, targetDir) {
  const templateSource = path.join(TEMPLATE_DIR, templateName);
  const templateTarget = path.join(targetDir, templateName);
  if (fs.existsSync(templateSource)) {
    const sourceContent = fs.readFileSync(templateSource, 'utf8');
    const sourceMd5 = computeMd5(sourceContent);
    const targetMd5Before = fs.existsSync(templateTarget)
      ? computeMd5(fs.readFileSync(templateTarget, 'utf8'))
      : '';
    const replaced = sourceMd5 !== targetMd5Before;
    if (replaced) {
      fs.copyFileSync(templateSource, templateTarget);
      config.log(`workspace-docs: synced ${templateKind} template ${templateName} -> ${templateTarget}`);
    }
    const targetStats = fs.statSync(templateTarget);
    const templateMeta = getTemplateMetadata(templateName);
    return {
      templateName,
      templateKind,
      templateVersion: templateMeta.version || '',
      templateLastUpdated: templateMeta.lastUpdated || '',
      sourceMd5,
      targetMd5: sourceMd5,
      targetPath: templateTarget,
      targetUpdatedAt: targetStats.mtime.toISOString(),
      replaced,
      syncedAt: new Date().toISOString(),
    };
  }
  config.log(`workspace-docs: ${templateKind} template missing at ${templateSource}`);
  return {
    templateName,
    templateKind,
    templateVersion: '',
    templateLastUpdated: '',
    sourceMd5: '',
    targetMd5: fs.existsSync(templateTarget) ? computeMd5(fs.readFileSync(templateTarget, 'utf8')) : '',
    targetPath: templateTarget,
    targetUpdatedAt: fs.existsSync(templateTarget) ? fs.statSync(templateTarget).mtime.toISOString() : '',
    replaced: false,
    missing: true,
    syncedAt: new Date().toISOString(),
  };
}

function syncDocumentTemplateRecordForProject(project, docType) {
  const templatesDir = ensureProjectTemplatesDir(project);
  const definition = getDocDefinition(docType);
  return syncTemplateFileForProject(project, definition.templateName, 'document', templatesDir);
}

function syncTemplateForProject(project, docType) {
  const record = syncDocumentTemplateRecordForProject(project, docType);
  if (record && record.missing) {
    config.log(`workspace-docs: template missing for ${docType} at ${path.join(TEMPLATE_DIR, getDocDefinition(docType).templateName)}`);
  } else {
    config.log(`workspace-docs: checked template ${getDocDefinition(docType).templateName} -> ${record.targetPath}`);
  }
  return record.targetPath;
}

function syncPrdFragmentTemplateForProject(project) {
  return syncFragmentTemplateForProject(project, 'prd');
}

function syncRoadmapFragmentTemplateForProject(project) {
  return syncFragmentTemplateForProject(project, 'roadmap');
}

function syncFragmentTemplateRecordForProject(project, docType) {
  const fragmentsDir = ensureProjectFragmentsDir(project);
  const templateName = FRAGMENT_TEMPLATE_NAMES[docType];
  if (!templateName) return null;
  return syncTemplateFileForProject(project, templateName, 'fragment', fragmentsDir);
}

function syncFragmentTemplateForProject(project, docType) {
  const record = syncFragmentTemplateRecordForProject(project, docType);
  return record ? record.targetPath : null;
}

function syncDatabaseSchemaFragmentTemplateForProject(project) {
  return syncFragmentTemplateForProject(project, 'database_schema');
}

function syncAllFragmentTemplatesForProject(project) {
  return Object.keys(FRAGMENT_TEMPLATE_NAMES).map((docType) => syncFragmentTemplateForProject(project, docType));
}

function syncAllFragmentTemplateRecordsForProject(project) {
  return Object.keys(FRAGMENT_TEMPLATE_NAMES)
    .map((docType) => syncFragmentTemplateRecordForProject(project, docType))
    .filter(Boolean);
}

function syncAllDocumentTemplateRecordsForProject(project) {
  return Object.keys(DOC_TYPES)
    .map((docType) => syncDocumentTemplateRecordForProject(project, docType))
    .filter(Boolean);
}

function syncProjectTemplateFiles(project, docType = null) {
  const documentRecords = docType
    ? [syncDocumentTemplateRecordForProject(project, docType)]
    : syncAllDocumentTemplateRecordsForProject(project);
  return [
    ...documentRecords.filter(Boolean),
    ...syncAllFragmentTemplateRecordsForProject(project),
  ];
}

function getProjectDocPath(project, docType) {
  const docsDir = ensureProjectDocsDir(project);
  return path.join(docsDir, getDocDefinition(docType).fileName);
}

function buildManagedBlock(payload) {
  const serialized = JSON.stringify(payload, null, 2)
    .replace(/<!--/g, '<\\u0021--')
    .replace(/-->/g, '--\\u003e');
  return `<!-- APM:DATA\n${serialized}\n-->`;
}

function normalizeFragmentDocType(docType) {
  const normalized = String(docType || '').trim().toLowerCase();
  return FRAGMENT_DOC_TYPE_ALIASES[normalized] || normalized;
}

function getFragmentDocTypesForModule(moduleKey) {
  const normalizedModuleKey = String(moduleKey || '').trim().toLowerCase();
  return (FRAGMENT_DOC_TYPES_BY_MODULE[normalizedModuleKey] || [])
    .map((docType) => normalizeFragmentDocType(docType))
    .filter(Boolean);
}

function inferFragmentDocTypeFromFileName(fileName) {
  const normalizedFileName = String(fileName || '').trim().toUpperCase();
  const match = Object.entries(FRAGMENT_TEMPLATE_NAMES).find(([, templateName]) => {
    const prefix = String(templateName || '').replace(/\.template\.md$/i, '');
    return normalizedFileName.startsWith(`${prefix.toUpperCase()}_`);
  });
  if (match) return `${match[0]}_fragment`;
  if (/^UX_UI_FRAGMENT_/i.test(normalizedFileName)) return 'experience_design_fragment';
  if (/^AI_ENVIRONMENT_(SUGGESTED|DIRECTIVE)_/i.test(normalizedFileName)) return 'ai_environment_fragment';
  return '';
}

function inferFragmentTitleFromMarkdown(markdown, fallback = '') {
  const heading = String(markdown || '').match(/^#\s+(.+)$/m);
  return (heading && heading[1] ? heading[1].trim() : fallback).trim();
}

function migrateLegacyFragmentPayloadToV1(payload, markdown = '', options = {}) {
  const fileName = options.fileName || '';
  const inferredDocType = inferFragmentDocTypeFromFileName(fileName);
  const originalDocType = String(payload.docType || inferredDocType || '').trim();
  const docType = normalizeFragmentDocType(originalDocType);
  const existingFragment = payload.fragment && typeof payload.fragment === 'object'
    ? payload.fragment
    : null;
  const fileCode = String(fileName || '').replace(/\.md$/i, '');
  const migratedFragment = {
    ...(existingFragment || {}),
  };
  if (!migratedFragment.id) migratedFragment.id = payload.fragmentId || payload.id || fileCode || docType;
  if (!migratedFragment.code) migratedFragment.code = payload.code || fileCode || migratedFragment.id;
  if (!migratedFragment.title) {
    migratedFragment.title = payload.title || inferFragmentTitleFromMarkdown(markdown, migratedFragment.code || fileName);
  }
  if (!migratedFragment.summary) migratedFragment.summary = payload.summary || '';
  if (!migratedFragment.status) migratedFragment.status = payload.status || 'draft';
  if (!migratedFragment.revision) migratedFragment.revision = payload.revision || payload.fragmentRevision || payload.version || 1;
  if (!migratedFragment.lineageKey) migratedFragment.lineageKey = payload.lineageKey || migratedFragment.code || migratedFragment.id;
  if (payload.payload && !migratedFragment.payload) migratedFragment.payload = payload.payload;
  return {
    ...payload,
    docType,
    version: 1,
    fragment: migratedFragment,
    migratedFromDocType: docType !== String(originalDocType || '').trim().toLowerCase() ? originalDocType : payload.migratedFromDocType,
  };
}

const FRAGMENT_MANAGED_PAYLOAD_MIGRATORS = {
  0: migrateLegacyFragmentPayloadToV1,
  1: (payload) => payload,
};

function migrateManagedPayload(payload, markdown = '', options = {}) {
  if (!payload || typeof payload !== 'object') return payload;
  const fileName = options.fileName || '';
  const inferredDocType = inferFragmentDocTypeFromFileName(fileName);
  const originalDocType = String(payload.docType || inferredDocType || '').trim();
  const docType = normalizeFragmentDocType(originalDocType);
  const nextPayload = {
    ...payload,
    ...(docType ? { docType } : {}),
  };
  const isFragmentPayload = /_fragment$/i.test(docType);
  if (!isFragmentPayload) return nextPayload;
  const parsedVersion = Number.parseInt(nextPayload.version, 10);
  const hasCompleteV1Fragment = nextPayload.fragment
    && typeof nextPayload.fragment === 'object'
    && nextPayload.fragment.code
    && nextPayload.fragment.title;
  const startingVersion = Number.isFinite(parsedVersion) && parsedVersion >= 1 && hasCompleteV1Fragment ? 1 : 0;
  const migrator = FRAGMENT_MANAGED_PAYLOAD_MIGRATORS[startingVersion] || FRAGMENT_MANAGED_PAYLOAD_MIGRATORS[0];
  return migrator(nextPayload, markdown, options);
}

function computeMd5(content) {
  return crypto.createHash('md5').update(String(content || ''), 'utf8').digest('hex');
}

function parseManagedBlock(markdown, options = {}) {
  const normalizedMarkdown = String(markdown || '').replace(/^\uFEFF/, '');
  const match = normalizedMarkdown.match(/<!-- APM:DATA\s*([\s\S]*?)\s*-->/);
  if (!match) return null;
  try {
    const normalized = match[1]
      .replace(/<\\u0021--/g, '<!--')
      .replace(/--\\u003e/g, '-->');
    return migrateManagedPayload(JSON.parse(normalized), normalizedMarkdown, options);
  } catch {
    return null;
  }
}

function parseManagedBlocks(markdown) {
  const normalizedMarkdown = String(markdown || '')
    .replace(/^\uFEFF/, '')
    .replace(/<\\u0021--/g, '<!--')
    .replace(/--\\u003e/g, '-->');
  const blocks = [];
  const regex = /<!-- APM:DATA\s*([\s\S]*?)\s*-->/g;
  let match;
  while ((match = regex.exec(normalizedMarkdown)) !== null) {
    try {
      const normalized = match[1]
        .replace(/<\\u0021--/g, '<!--')
        .replace(/--\\u003e/g, '-->');
      blocks.push(JSON.parse(normalized));
    } catch {
      // Ignore malformed embedded managed blocks inside human-authored notes.
    }
  }
  return blocks;
}

function stripManagedBlocks(markdown) {
  return String(markdown || '')
    .replace(/<\\u0021--/g, '<!--')
    .replace(/--\\u003e/g, '-->')
    .replace(/<!-- APM:DATA[\s\S]*?-->\s*/g, '')
    .trim();
}

function extractMarkdownSectionByHeading(markdown, heading) {
  const lines = String(markdown || '').split(/\r?\n/);
  const target = String(heading || '').trim().toLowerCase();
  let startIndex = -1;
  let startLevel = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match || match[2].trim().toLowerCase() !== target) continue;
    startIndex = index;
    startLevel = match[1].length;
    break;
  }
  if (startIndex < 0) return '';
  const collected = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= startLevel) break;
    collected.push(lines[index]);
  }
  return collected.join('\n').trim();
}

function uniqueNonEmptyTextBlocks(blocks) {
  const seen = new Set();
  const unique = [];
  for (const block of blocks) {
    const normalized = String(block || '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
}

function demoteCustomInstructionHeadings(value) {
  return String(value || '').replace(/^(#{1,2})(\s+)/gm, '###$2').trim();
}

function sanitizeAiEnvironmentCustomInstructions(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const separator = '\n\n---\n\n';
  const blocks = raw.split(/\n\s*---\s*\n/g);
  const cleaned = blocks.map((block) => {
    const managedInstructions = uniqueNonEmptyTextBlocks(
      parseManagedBlocks(block)
        .map((payload) => payload?.editorState?.customInstructions)
        .filter((item) => typeof item === 'string' && item.trim())
    );
    if (managedInstructions.length) return managedInstructions.join(separator);

    const withoutManaged = stripManagedBlocks(block)
      .replace(/^Imported directives from[^\r\n]*:\s*/i, '')
      .trim();
    const customSection = extractMarkdownSectionByHeading(withoutManaged, 'Custom Instructions');
    if (!customSection && /^#\s+AI Environment Suggestion:/i.test(withoutManaged)) {
      const sectionStart = withoutManaged.search(/^##\s+(Executive Summary|Mission|Required Behaviors|Module Update Rules|Guardrails|Avoid|Open Questions)/mi);
      if (sectionStart >= 0) {
        return withoutManaged
          .slice(sectionStart)
          .replace(/\n##\s+Merge Guidance[\s\S]*$/i, '')
          .trim();
      }
    }
    return (customSection || withoutManaged).trim();
  });
  return demoteCustomInstructionHeadings(uniqueNonEmptyTextBlocks(cleaned).join(separator));
}

function escapeMermaidLabel(value) {
  return String(value || '').replace(/"/g, '\\"');
}

function toMermaidNodeId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'node';
}

function isFinishedPlanningStatus(value) {
  return ['done', 'completed', 'implemented', 'resolved', 'closed'].includes(String(value || '').trim().toLowerCase());
}

function isActiveTaskItem(task) {
  if (!task || typeof task !== 'object') return false;
  if (String(task.planningBucket || '').trim().toLowerCase() === 'archived') return false;
  return !isFinishedPlanningStatus(task.status);
}

function isActiveFeatureItem(feature) {
  if (!feature || typeof feature !== 'object') return false;
  if (feature.archived) return false;
  if (String(feature.planningBucket || '').trim().toLowerCase() === 'archived') return false;
  return !isFinishedPlanningStatus(feature.status);
}

function renderRoadmapMermaid(phases, tasks, features, bugs = []) {
  const lines = ['flowchart TD', '  roadmap["Roadmap"]', '  planned["Planned Items"]', '  considered["Considered Items"]'];
  const activeTasks = (Array.isArray(tasks) ? tasks : []).filter(isActiveTaskItem);
  const activeFeatures = (Array.isArray(features) ? features : []).filter(isActiveFeatureItem);
  const activeBugs = (Array.isArray(bugs) ? bugs : []).filter((bug) => !isArchivedBugLifecycleItem(bug));
  for (const phase of orderRoadmapPhases(phases)) {
    const phaseNode = `phase_${toMermaidNodeId(phase.code || phase.id)}`;
    lines.push(`  roadmap --> ${phaseNode}["${escapeMermaidLabel(`${phase.code}: ${phase.name}`)}"]`);
    for (const task of activeTasks.filter((item) => item.roadmapPhaseId === phase.id)) {
      lines.push(`  ${phaseNode} --> task_${toMermaidNodeId(task.id)}["${escapeMermaidLabel(task.title)}"]`);
    }
    for (const feature of activeFeatures.filter((item) => item.roadmapPhaseId === phase.id)) {
      lines.push(`  ${phaseNode} --> feature_${toMermaidNodeId(feature.id)}["${escapeMermaidLabel(`${feature.code}: ${feature.title}`)}"]`);
    }
    for (const bug of activeBugs.filter((item) => item.roadmapPhaseId === phase.id)) {
      lines.push(`  ${phaseNode} --> bug_${toMermaidNodeId(bug.id)}["${escapeMermaidLabel(`${bug.code}: ${bug.title}`)}"]`);
    }
  }
  for (const feature of activeFeatures.filter((item) => item.planningBucket === 'planned')) {
    lines.push(`  planned --> feature_${toMermaidNodeId(feature.id)}["${escapeMermaidLabel(`${feature.code}: ${feature.title}`)}"]`);
  }
  for (const bug of activeBugs.filter((item) => item.planningBucket === 'planned')) {
    lines.push(`  planned --> bug_${toMermaidNodeId(bug.id)}["${escapeMermaidLabel(`${bug.code}: ${bug.title}`)}"]`);
  }
  for (const feature of activeFeatures.filter((item) => item.planningBucket === 'considered')) {
    lines.push(`  considered --> feature_${toMermaidNodeId(feature.id)}["${escapeMermaidLabel(`${feature.code}: ${feature.title}`)}"]`);
  }
  for (const bug of activeBugs.filter((item) => item.planningBucket === 'considered')) {
    lines.push(`  considered --> bug_${toMermaidNodeId(bug.id)}["${escapeMermaidLabel(`${bug.code}: ${bug.title}`)}"]`);
  }
  return lines.join('\n');
}

function renderFeaturesMermaid(phases, features) {
  const lines = ['flowchart TD', '  features["Features"]'];
  for (const feature of (Array.isArray(features) ? features : []).filter(isActiveFeatureItem)) {
    const phase = phases.find((item) => item.id === feature.roadmapPhaseId);
    const parentNode = phase ? `phase_${toMermaidNodeId(phase.code || phase.id)}` : 'features';
    if (phase) lines.push(`  features --> ${parentNode}["${escapeMermaidLabel(`${phase.code}: ${phase.name}`)}"]`);
    lines.push(`  ${parentNode} --> feature_${toMermaidNodeId(feature.id)}["${escapeMermaidLabel(`${feature.code}: ${feature.title}`)}"]`);
  }
  return [...new Set(lines)].join('\n');
}

const BUG_LIFECYCLE_STATES = [
  { key: 'open', label: 'Open', description: 'Newly reported and awaiting triage.' },
  { key: 'triaged', label: 'Triaged', description: 'Validated, categorized, and ready for prioritization.' },
  { key: 'in_progress', label: 'In Progress', description: 'Active investigation or remediation is underway.' },
  { key: 'blocked', label: 'Blocked', description: 'Work cannot continue until a dependency or decision is resolved.' },
  { key: 'fixed', label: 'Fixed', description: 'A code or configuration change is ready for validation.' },
  { key: 'verifying', label: 'Verifying', description: 'The proposed fix is being tested in the target environment.' },
  { key: 'resolved', label: 'Resolved', description: 'The issue has been verified as fixed.' },
  { key: 'closed', label: 'Closed', description: 'The record is complete and retained for history.' },
  { key: 'regressed', label: 'Regressed', description: 'The issue returned after a prior fix and needs renewed attention.' },
];

function normalizeBugLifecycleStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done') return 'resolved';
  return BUG_LIFECYCLE_STATES.some((state) => state.key === normalized) ? normalized : 'open';
}

function getBugLifecycleMetadata(status) {
  const normalized = normalizeBugLifecycleStatus(status);
  return BUG_LIFECYCLE_STATES.find((state) => state.key === normalized) || BUG_LIFECYCLE_STATES[0];
}

function isArchivedBugLifecycleItem(bug) {
  if (!bug || typeof bug !== 'object') return false;
  if (bug.archived) return true;
  const planningBucket = String(bug.planningBucket || '').trim().toLowerCase();
  if (planningBucket === 'archived') return true;
  const status = normalizeBugLifecycleStatus(bug.status);
  return status === 'resolved' || status === 'closed';
}

function formatBugPlanningBucketLabel(bucket) {
  const normalized = String(bucket || 'considered').trim().toLowerCase();
  if (normalized === 'phase') return 'Roadmap Phase';
  if (normalized === 'planned') return 'Planned';
  if (normalized === 'archived') return 'Archived';
  return 'Considered';
}

function renderBugLiteralTextBlock(value, fallback) {
  const text = String(value || '').trim() || fallback;
  return ['```text', text, '```'].join('\n');
}

function parseAssociationHintTokens(value) {
  return [...new Set(
    String(value || '')
      .split(/[\s,;]+/)
      .map((part) => part.trim())
      .filter((part) => /^@[\w:-]+$/i.test(part))
  )];
}

function extractMarkdownSectionAnyLevel(markdown, heading) {
  const lines = String(markdown || '').split(/\r?\n/);
  const normalizedHeading = String(heading || '').trim().toLowerCase();
  let startIndex = -1;
  let startLevel = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    if (match[2].trim().toLowerCase() !== normalizedHeading) continue;
    startIndex = index;
    startLevel = match[1].length;
    break;
  }
  if (startIndex < 0) return '';
  const collected = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const nextHeading = lines[index].match(/^(#{1,6})\s+/);
    if (nextHeading && nextHeading[1].length <= startLevel) break;
    collected.push(lines[index]);
  }
  return collected.join('\n').trim();
}

function stripMarkdownHeadingSyntax(value) {
  return String(value || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function summarizeBugFragmentBody(value, fallback = '') {
  const text = String(value || '').trim();
  if (!text) return fallback;
  const summary = extractMarkdownSectionAnyLevel(text, 'Executive Summary');
  if (summary) return stripMarkdownHeadingSyntax(summary);
  const firstParagraph = text
    .replace(/^#\s+Bug Fragment:.+$/im, '')
    .split(/\n\s*\n/)
    .map((part) => stripMarkdownHeadingSyntax(part))
    .find(Boolean);
  return firstParagraph || fallback;
}

function getBugDisplayFields(bug) {
  const rawCurrent = String(bug?.currentBehavior || bug?.summary || '').trim();
  const rawExpected = String(bug?.expectedBehavior || '').trim();
  const looksLikeFragment = /^#\s+Bug Fragment:/i.test(rawCurrent) || /##\s+Expected vs Current Behavior/i.test(rawCurrent);
  if (!looksLikeFragment) {
    return {
      currentBehavior: rawCurrent,
      expectedBehavior: rawExpected,
      summary: String(bug?.summary || rawCurrent || '').trim(),
    };
  }

  const extractedCurrent = extractMarkdownSectionAnyLevel(rawCurrent, 'Current Behavior');
  const extractedExpected = extractMarkdownSectionAnyLevel(rawCurrent, 'Expected Behavior');
  const fallbackSummary = summarizeBugFragmentBody(rawCurrent, String(bug?.summary || '').trim());
  return {
    currentBehavior: stripMarkdownHeadingSyntax(extractedCurrent || fallbackSummary || rawCurrent),
    expectedBehavior: stripMarkdownHeadingSyntax(
      extractedExpected
      || (/^Review expected behavior/i.test(rawExpected) ? '' : rawExpected)
      || 'No expected behavior recorded yet.'
    ),
    summary: fallbackSummary || String(bug?.summary || '').trim(),
  };
}

function normalizeBugDedupeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function dedupeVisibleBugs(bugs) {
  const seen = new Set();
  const list = Array.isArray(bugs) ? bugs : [];
  return list.filter((bug) => {
    const display = getBugDisplayFields(bug);
    const key = [
      normalizeBugDedupeText(bug?.title),
      normalizeBugDedupeText(display.currentBehavior),
      normalizeBugDedupeText(display.expectedBehavior),
    ].join('::');
    if (!key.replace(/:/g, '')) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeBugForMarkdown(bug) {
  const display = getBugDisplayFields(bug);
  return {
    ...bug,
    summary: display.summary || bug?.summary || '',
    currentBehavior: display.currentBehavior || bug?.currentBehavior || bug?.summary || '',
    expectedBehavior: display.expectedBehavior || bug?.expectedBehavior || '',
  };
}

function renderBugsMermaid(bugs) {
  const lines = ['flowchart TD', '  bugs["Active Bugs"]'];
  for (const bug of dedupeVisibleBugs(bugs.filter((item) => !isArchivedBugLifecycleItem(item)))) {
    const lifecycle = getBugLifecycleMetadata(bug.status);
    const statusNode = `status_${toMermaidNodeId(lifecycle.key)}`;
    lines.push(`  bugs --> ${statusNode}["${escapeMermaidLabel(lifecycle.label)}"]`);
    lines.push(`  ${statusNode} --> bug_${toMermaidNodeId(bug.id)}["${escapeMermaidLabel(`${bug.code}: ${bug.title}`)}"]`);
  }
  return [...new Set(lines)].join('\n');
}

function formatDocDateTime(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
}

function buildDocumentHeader(docType, project) {
  const definition = getDocDefinition(docType);
  return [
    `# ${definition.fileName.replace('.md', '')}: ${project.name}`,
    '',
    `> Managed document. Must comply with template ${definition.templateName}.`,
    '',
  ].join('\n');
}

function buildTemplateHeader(title, templateName) {
  return [
    `# ${title}`,
    '',
    `> Managed document. Must comply with template ${templateName}.`,
    '',
  ].join('\n');
}

function formatDocTypeLabel(docType) {
  return String(docType || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.toUpperCase() === 'UX' || part.toUpperCase() === 'UI' || part.toUpperCase() === 'ADR'
      ? part.toUpperCase()
      : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getTemplateMetadata(templateName) {
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    return {
      templateName,
      version: '',
      lastUpdated: '',
    };
  }
  const content = fs.readFileSync(templatePath, 'utf8');
  const versionMatch = content.match(/Template Version:\s*`([^`]+)`/i);
  const updatedMatch = content.match(/Last Updated:\s*`([^`]+)`/i);
  return {
    templateName,
    version: versionMatch ? versionMatch[1] : '',
    lastUpdated: updatedMatch ? updatedMatch[1] : '',
  };
}

function defaultModuleDocumentEditorState(project, docType) {
  if (String(docType || '').trim().toLowerCase() === 'functional_spec') {
    return {
      overview: {
        summary: `Functional spec for ${project?.name || 'this project'} is still being defined.`,
        versionDate: new Date().toISOString(),
      },
      functionalAreas: [],
      logicalFlows: [],
      flowEndpoints: [],
      userActionsAndSystemResponses: [],
      validationRules: [],
      interfaceExpectations: [],
      edgeCases: [],
      openQuestions: [],
      fragmentHistory: [],
      flowVisuals: [],
    };
  }
  if (String(docType || '').trim().toLowerCase() === 'domain_models') {
    return {
      overview: {
        summary: `Domain models for ${project?.name || 'this project'} are still being defined.`,
        versionDate: new Date().toISOString(),
      },
      models: [],
      projections: [],
      openQuestions: [],
      fragmentHistory: [],
    };
  }
  if (String(docType || '').trim().toLowerCase() === 'changelog') {
    return {
      overview: {
        summary: `Change log for ${project?.name || 'this project'} is still being defined.`,
        versionDate: new Date().toISOString(),
      },
      entries: [],
      openQuestions: [],
      fragmentHistory: [],
    };
  }
  if (String(docType || '').trim().toLowerCase() === 'adr') {
    return {
      overview: {
        summary: `ADR for ${project?.name || 'this project'} is still being defined.`,
        versionDate: new Date().toISOString(),
      },
      metadata: {
        decisionTitle: '',
        status: 'proposed',
        scope: '',
        owners: '',
        decisionDate: '',
        versionDate: new Date().toISOString(),
      },
      context: '',
      decision: '',
      rationale: '',
      alternatives: [],
      consequences: [],
      relatedArchitecture: [],
      relatedModules: [],
      followUpNotes: '',
      openQuestions: [],
      fragmentHistory: [],
    };
  }
  return {
    overview: {
      summary: `${formatDocTypeLabel(docType)} for ${project?.name || 'this project'} is still being defined.`,
      versionDate: new Date().toISOString(),
    },
    workingContent: '',
    openQuestions: '',
    fragmentHistory: [],
  };
}

function renderFunctionalSpecFlowVisuals(logicalFlows = [], flowVisuals = [], emptyLabel = '', sectionNumber = '4') {
  const flows = Array.isArray(logicalFlows) ? logicalFlows : [];
  const visuals = normalizeFunctionalSpecFlowVisuals(flowVisuals, flows);
  if (!visuals.length || !visuals.some((visual) => visual.nodes.length || visual.edges.length)) {
    return [emptyLabel || 'No visual flow graphs defined yet.'];
  }
  const flowByKey = new Map(flows.map((flow, index) => [buildFunctionalFlowKey(flow, `flow-${index + 1}`), flow]));
  return visuals.flatMap((visual, visualIndex) => {
    const flow = flowByKey.get(String(visual.flowId || '')) || {};
    const flowTitle = String(flow.title || `Flow ${visualIndex + 1}`).trim();
    const baseNumber = sectionNumber ? `${sectionNumber}.${visualIndex + 1}` : `${visualIndex + 1}`;
    const lines = [
      `### ${baseNumber} ${flowTitle}`,
      '',
      '#### Nodes',
      '',
    ];
    if (visual.nodes.length) {
      visual.nodes.forEach((node, nodeIndex) => {
        lines.push(
          ...renderDocumentItemMetadataComment(node),
          `##### ${baseNumber}.1.${nodeIndex + 1} ${node.label || 'Unnamed node'}`,
          '',
          `- Type: ${normalizeFunctionalFlowNodeType(node.type)}`,
        );
        if (node.command) lines.push(`- Command: ${node.command}`);
        if (node.description) lines.push('', node.description);
        lines.push('');
      });
    } else {
      lines.push('No nodes defined yet.', '');
    }
    lines.push('#### Connections', '');
    if (visual.edges.length) {
      visual.edges.forEach((edge, edgeIndex) => {
        const sourceNode = visual.nodes.find((node) => node.id === edge.source);
        const targetNode = visual.nodes.find((node) => node.id === edge.target);
        const edgeTitle = edge.label || `${sourceNode?.label || edge.source} to ${targetNode?.label || edge.target}`;
        lines.push(
          ...renderDocumentItemMetadataComment(edge),
          `##### ${baseNumber}.2.${edgeIndex + 1} ${edgeTitle}`,
          '',
          `- Type: ${normalizeFunctionalFlowEdgeType(edge.type)}`,
          `- Source: ${sourceNode?.label || edge.source || 'Unknown source'}`,
          `- Target: ${targetNode?.label || edge.target || 'Unknown target'}`,
        );
        if (edge.draft || !edge.source || !edge.target) lines.push('- Connection Status: Unconnected draft');
        if (edge.conditionText) lines.push(`- Condition: ${edge.conditionText}`);
        lines.push('');
      });
    } else {
      lines.push('No connections defined yet.', '');
    }
    return lines;
  });
}

function renderFunctionalSpecActionVocabulary() {
  return [
    '### 1.1 Functional Flowchart Action Vocabulary',
    '',
    'These are the standard Functional Spec actions available to the visual editor, fragments, and AI agents.',
    '',
    '#### 1.1.1 Node Types',
    '',
    '- Start: Begins a logical workflow.',
    '- User Action: User behavior, command, selection, input, or gesture.',
    '- System Action: System behavior in response to a trigger or condition.',
    '- Decision: Conditional branch such as if, else, switch, yes/no, valid/invalid, or available/unavailable.',
    '- Validation: Rule that checks input, state, permissions, data shape, or readiness.',
    '- Loop: Repeated behavior until a stop condition is met.',
    '- Input: Data, events, commands, files, selections, or external signals entering the flow.',
    '- Output: Data, messages, files, screen changes, events, or results produced by the flow.',
    '- Endpoint: Attachable control point that other modules may reference as an input, output, or integration point.',
    '- Return: Where the flow returns control, state, data, or user focus.',
    '- Error Path: Failure handling, recovery, fallback behavior, or user-visible error messaging.',
    '- Log / Audit: Logging, audit trail, diagnostics, telemetry, or error reporting behavior.',
    '- External Interaction: Interaction with another system, service, API, file system, database, device, or module.',
    '- Formula: Calculation, derivation, comparison, transformation, or logical expression.',
    '- Model Reference: Relationship to a shared domain model, schema model, external payload, or data concept.',
    '- Open Question: Unresolved design question attached to a flow, node, edge, endpoint, Functional Area, or document scope.',
    '',
    '#### 1.1.2 Connection Types',
    '',
    '- Continue: Moves from one action to the next without a special condition.',
    '- If / Then: Continues only when the stated condition is true or satisfied.',
    '- Else: Continues when the prior condition is false or not satisfied.',
    '- Loop Until: Repeats until the stated condition is met.',
    '- On Success: Continues after the previous action succeeds.',
    '- On Failure: Continues after the previous action fails or cannot complete.',
    '- Returns To: Connects a flow back to a caller, return point, parent flow, or previous user context.',
    '- Emits: Source produces an event, message, file, data object, signal, or output.',
    '- Consumes: Target reads, receives, or depends on an event, message, file, data object, signal, or input.',
    '',
    '#### 1.1.3 Canvas Actions',
    '',
    '- Create Node: Add a typed node to a workflow.',
    '- Move Node: Reposition a node without changing its meaning or id.',
    '- Resize Node: Change visual size without changing meaning or id.',
    '- Delete Node: Remove the node while preserving affected connections as unattached draft edges when possible.',
    '- Connect Nodes: Create a typed connection between source and target handles.',
    '- Create Draft Edge: Create an unattached connection when the target is not known yet.',
    '- Remove Draft Edge: Delete an unattached connection.',
    '- Clean Layout: Reposition visible workflow nodes to reduce overlap while preserving ids and relationships.',
    '- Hide Flow: Exclude a flow from the current visual view without deleting it from the document.',
    '- Group Flows: Organize flows into a Functional Area or reusable shared flow group.',
    '- Attach Comment: Attach an open question or note to a workflow, group, node, edge, endpoint, or document scope.',
    '- Reference Model: Link a node, edge, formula, or flow to a shared domain model by stable id.',
    '- Reference Module Item: Link a control point or workflow element to another module item by stable id.',
    '',
  ];
}

function renderModuleDocumentEditorStateMarkdown(project, docType, editorState) {
  const normalizedDocType = String(docType || '').trim().toLowerCase();
  const normalizedEditorState = normalizeDocumentEditorStateForStorage(project, normalizedDocType, editorState);
  if (normalizedDocType === 'functional_spec') {
    const defaultState = defaultModuleDocumentEditorState(project, normalizedDocType);
    let state = defaultState;
    if (normalizedEditorState && typeof normalizedEditorState === 'object') {
      const logicalFlows = normalizeModuleDetailList(normalizedEditorState.logicalFlows, { docType: 'functional_spec', sectionKey: 'logical-flows' });
      const flowVisuals = normalizeFunctionalSpecFlowVisuals(normalizedEditorState.flowVisuals, logicalFlows);
      state = {
          ...defaultState,
          ...normalizedEditorState,
          overview: {
            ...defaultState.overview,
            ...(normalizedEditorState.overview || {}),
          },
          functionalAreas: normalizeModuleDetailList(normalizedEditorState.functionalAreas, { docType: 'functional_spec', sectionKey: 'functional-areas' }),
          logicalFlows,
          flowEndpoints: normalizeFunctionalSpecFlowEndpoints(normalizedEditorState.flowEndpoints, flowVisuals),
          flowVisuals,
          userActionsAndSystemResponses: normalizeModuleDetailList(normalizedEditorState.userActionsAndSystemResponses, { docType: 'functional_spec', sectionKey: 'user-actions-and-system-responses' }),
          validationRules: normalizeModuleDetailList(normalizedEditorState.validationRules, { docType: 'functional_spec', sectionKey: 'validation-rules' }),
          interfaceExpectations: normalizeModuleDetailList(normalizedEditorState.interfaceExpectations, { docType: 'functional_spec', sectionKey: 'interface-expectations' }),
          edgeCases: normalizeModuleDetailList(normalizedEditorState.edgeCases, { docType: 'functional_spec', sectionKey: 'edge-cases' }),
          openQuestions: normalizeModuleDetailList(normalizedEditorState.openQuestions, { docType: 'functional_spec', sectionKey: 'open-questions' }),
          fragmentHistory: Array.isArray(normalizedEditorState.fragmentHistory) ? normalizedEditorState.fragmentHistory : [],
        };
    }
    const fragmentHistory = Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [];
    return [
      buildDocumentHeader(docType, project),
      buildManagedBlock({
        docType,
        version: 1,
        markdown: '',
        editorState: state,
      }),
      '',
      '## 1. Executive Summary',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.overview?.stableId || '',
        sourceRefs: state.overview?.sourceRefs || [],
        versionDate: state.overview?.versionDate || '',
      }),
      state.overview?.summary || 'Pending functional spec summary.',
      '',
      ...renderFunctionalSpecActionVocabulary(),
      '## 2. Functional Areas',
      '',
      ...renderModuleDetailList(state.functionalAreas, 'No functional areas defined yet.', '2'),
      '## 3. Logical Workflows',
      '',
      ...renderModuleDetailList(state.logicalFlows, 'No logical flows defined yet.', '3'),
      '## 4. Flow Nodes and Connections',
      '',
      ...renderFunctionalSpecFlowVisuals(state.logicalFlows, state.flowVisuals, 'No visual flow graphs defined yet.', '4'),
      '## 5. Flow Endpoints and Return Points',
      '',
      ...renderModuleDetailList(state.flowEndpoints, 'No flow endpoints or return points defined yet.', '5'),
      '## 6. User Actions and System Responses',
      '',
      ...renderModuleDetailList(state.userActionsAndSystemResponses, 'No standalone user action and system response notes yet.', '6'),
      '## 7. Validation Rules',
      '',
      ...renderModuleDetailList(state.validationRules, 'No standalone validation rules yet.', '7'),
      '## 8. Interface Expectations',
      '',
      ...renderModuleDetailList(state.interfaceExpectations, 'No standalone interface expectations yet.', '8'),
      '## 9. Edge Cases',
      '',
      ...renderModuleDetailList(state.edgeCases, 'No standalone edge cases yet.', '9'),
      '## 10. Open Questions',
      '',
      ...renderModuleDetailList(state.openQuestions, 'No open questions yet.', '10'),
      '## 11. Applied Fragments',
      '',
      ...(fragmentHistory.length
        ? fragmentHistory.flatMap((fragment) => [
            `### ${fragment.code || fragment.id || 'Fragment'}: ${fragment.title || 'Imported fragment'}`,
            '',
            `- Status: ${fragment.status || 'integrated'}`,
            `- Source: ${fragment.sourceScope || 'project'}`,
            fragment.integratedAt ? `- Integrated: ${fragment.integratedAt}` : null,
            '',
            fragment.summary || 'No fragment summary.',
            '',
          ].filter((line) => line !== null))
        : ['No applied fragments yet.', '']),
    ].join('\n');
  }
  if (normalizedDocType === 'domain_models') {
    const defaultState = defaultModuleDocumentEditorState(project, normalizedDocType);
    const state = normalizedEditorState && typeof normalizedEditorState === 'object'
      ? {
          ...defaultState,
          ...normalizedEditorState,
          overview: {
            ...defaultState.overview,
            ...(normalizedEditorState.overview || {}),
          },
          models: normalizeDomainModelList(normalizedEditorState.models),
          projections: normalizeDomainModelProjectionList(normalizedEditorState.projections),
          openQuestions: normalizeModuleDetailList(normalizedEditorState.openQuestions, { docType: 'domain_models', sectionKey: 'open-questions' }),
          fragmentHistory: Array.isArray(normalizedEditorState.fragmentHistory) ? normalizedEditorState.fragmentHistory : [],
        }
      : defaultState;
    const fragmentHistory = Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [];
    return [
      buildDocumentHeader(docType, project),
      buildManagedBlock({
        docType,
        version: 1,
        markdown: '',
        editorState: state,
      }),
      '',
      '## 1. Executive Summary',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.overview?.stableId || '',
        sourceRefs: state.overview?.sourceRefs || [],
        versionDate: state.overview?.versionDate || '',
      }),
      state.overview?.summary || 'Pending domain model summary.',
      '',
      '## 2. Domain Model Catalog',
      '',
      ...renderDomainModelCatalog(state.models),
      '## 3. Domain Models',
      '',
      ...renderDomainModels(state.models),
      '## 4. Model Projections',
      '',
      ...renderDomainModelProjections(state.projections),
      '## 5. Open Questions',
      '',
      ...renderModuleDetailList(state.openQuestions, 'No open questions yet.', '5'),
      '## 6. Applied Fragments',
      '',
      ...(fragmentHistory.length
        ? fragmentHistory.flatMap((fragment) => [
            `### ${fragment.code || fragment.id || 'Fragment'}: ${fragment.title || 'Imported fragment'}`,
            '',
            `- Status: ${fragment.status || 'integrated'}`,
            `- Source: ${fragment.sourceScope || 'project'}`,
            fragment.integratedAt ? `- Integrated: ${fragment.integratedAt}` : null,
            '',
            fragment.summary || 'No fragment summary.',
            '',
          ].filter((line) => line !== null))
        : ['No applied fragments yet.', '']),
    ].join('\n');
  }
  if (normalizedDocType === 'changelog') {
    const defaultState = defaultModuleDocumentEditorState(project, normalizedDocType);
    const state = normalizedEditorState && typeof normalizedEditorState === 'object'
      ? {
            ...defaultState,
            ...normalizedEditorState,
            overview: {
              ...defaultState.overview,
              ...(normalizedEditorState.overview || {}),
            },
          entries: normalizeChangelogEntries(normalizedEditorState.entries),
          openQuestions: normalizeModuleDetailList(normalizedEditorState.openQuestions, { docType: 'changelog', sectionKey: 'open-questions' }),
          fragmentHistory: Array.isArray(normalizedEditorState.fragmentHistory) ? normalizedEditorState.fragmentHistory : [],
          }
        : defaultState;
    const fragmentHistory = Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [];
    return [
      buildDocumentHeader(docType, project),
      buildManagedBlock({
        docType,
        version: 1,
        markdown: '',
        editorState: state,
      }),
      '',
      '## 1. Executive Summary',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.overview?.stableId || '',
        sourceRefs: state.overview?.sourceRefs || [],
        versionDate: state.overview?.versionDate || '',
      }),
      state.overview?.summary || 'No change log summary captured yet.',
      '',
      '## 2. Change Entries',
      '',
      ...renderChangelogEntries(state.entries),
      '## 3. Applied Fragments',
      '',
      ...(fragmentHistory.length
        ? fragmentHistory.flatMap((fragment) => [
            `### ${fragment.code || fragment.id || 'Fragment'}: ${fragment.title || 'Imported fragment'}`,
            '',
            `- Status: ${fragment.status || 'integrated'}`,
            `- Source: ${fragment.sourceScope || 'project'}`,
            fragment.integratedAt ? `- Integrated: ${fragment.integratedAt}` : null,
            '',
            fragment.summary || 'No fragment summary.',
            '',
          ].filter((line) => line !== null))
        : ['No applied fragments yet.', '']),
      '## 4. Open Questions',
      '',
      ...renderModuleDetailList(state.openQuestions, 'No open questions yet.', '4'),
      '',
    ].join('\n');
  }
  if (normalizedDocType === 'adr') {
    const defaultState = defaultModuleDocumentEditorState(project, normalizedDocType);
    const state = normalizedEditorState && typeof normalizedEditorState === 'object'
        ? {
            ...defaultState,
            ...normalizedEditorState,
            overview: {
              ...defaultState.overview,
              ...(normalizedEditorState.overview || {}),
            },
            metadata: {
              ...defaultState.metadata,
              ...(normalizedEditorState.metadata || {}),
            },
          alternatives: normalizeModuleDetailList(normalizedEditorState.alternatives, { docType: 'adr', sectionKey: 'alternatives' }),
          consequences: normalizeModuleDetailList(normalizedEditorState.consequences, { docType: 'adr', sectionKey: 'consequences' }),
          relatedArchitecture: normalizeModuleDetailList(normalizedEditorState.relatedArchitecture, { docType: 'adr', sectionKey: 'related-architecture' }),
          relatedModules: normalizeModuleDetailList(normalizedEditorState.relatedModules, { docType: 'adr', sectionKey: 'related-modules' }),
          openQuestions: normalizeModuleDetailList(normalizedEditorState.openQuestions, { docType: 'adr', sectionKey: 'open-questions' }),
          fragmentHistory: Array.isArray(normalizedEditorState.fragmentHistory) ? normalizedEditorState.fragmentHistory : [],
          }
        : defaultState;
    const fragmentHistory = Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [];
    return [
      buildDocumentHeader(docType, project),
      buildManagedBlock({
        docType,
        version: 1,
        markdown: '',
        editorState: state,
      }),
      '',
      '## 1. Executive Summary',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.overview?.stableId || '',
        sourceRefs: state.overview?.sourceRefs || [],
        versionDate: state.overview?.versionDate || '',
      }),
      state.overview?.summary || `Pending ${formatDocTypeLabel(docType)} summary.`,
      '',
      '## 2. Decision Metadata',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.metadata?.itemIds?.decisionTitle || '',
        sourceRefs: state.metadata?.itemSourceRefs?.decisionTitle || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      `- Title: ${state.metadata?.decisionTitle || 'Pending decision title.'}`,
      ...renderDocumentItemMetadataComment({
        stableId: state.metadata?.itemIds?.status || '',
        sourceRefs: state.metadata?.itemSourceRefs?.status || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      `- Status: ${state.metadata?.status || 'proposed'}`,
      ...renderDocumentItemMetadataComment({
        stableId: state.metadata?.itemIds?.scope || '',
        sourceRefs: state.metadata?.itemSourceRefs?.scope || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      `- Scope: ${state.metadata?.scope || 'Pending scope.'}`,
      ...renderDocumentItemMetadataComment({
        stableId: state.metadata?.itemIds?.owners || '',
        sourceRefs: state.metadata?.itemSourceRefs?.owners || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      `- Owners: ${state.metadata?.owners || 'Pending owners.'}`,
      ...renderDocumentItemMetadataComment({
        stableId: state.metadata?.itemIds?.decisionDate || '',
        sourceRefs: state.metadata?.itemSourceRefs?.decisionDate || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      `- Decision Date: ${state.metadata?.decisionDate || 'Pending decision date.'}`,
      '',
      '## 3. Context',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.contextMeta?.stableId || '',
        sourceRefs: state.contextMeta?.sourceRefs || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      state.context || 'No ADR context captured yet.',
      '',
      '## 4. Decision',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.decisionMeta?.stableId || '',
        sourceRefs: state.decisionMeta?.sourceRefs || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      state.decision || 'No decision recorded yet.',
      '',
      '## 5. Rationale',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.rationaleMeta?.stableId || '',
        sourceRefs: state.rationaleMeta?.sourceRefs || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      state.rationale || 'No rationale recorded yet.',
      '',
      '## 6. Alternatives Considered',
      '',
      ...renderModuleDetailList(state.alternatives, 'No alternatives captured yet.', '9'),
      '## 7. Consequences',
      '',
      ...renderModuleDetailList(state.consequences, 'No consequences captured yet.', '10'),
      '## 8. Related Architecture Elements',
      '',
      ...renderModuleDetailList(state.relatedArchitecture, 'No related architecture elements captured yet.', '11'),
      '## 9. Related Modules and Workflows',
      '',
      ...renderModuleDetailList(state.relatedModules, 'No related modules or workflows captured yet.', '12'),
      '## 10. Follow-Up Notes',
      '',
      ...renderDocumentItemMetadataComment({
        stableId: state.followUpNotesMeta?.stableId || '',
        sourceRefs: state.followUpNotesMeta?.sourceRefs || [],
        versionDate: state.metadata?.versionDate || '',
      }),
      state.followUpNotes || 'No follow-up notes yet.',
      '',
      '## 11. Applied Fragments',
      '',
      ...(fragmentHistory.length
        ? fragmentHistory.flatMap((fragment) => [
            `### ${fragment.code || fragment.id || 'Fragment'}: ${fragment.title || 'Imported fragment'}`,
            '',
            `- Status: ${fragment.status || 'integrated'}`,
            `- Source: ${fragment.sourceScope || 'project'}`,
            fragment.integratedAt ? `- Integrated: ${fragment.integratedAt}` : null,
            '',
            fragment.summary || 'No fragment summary.',
            '',
          ].filter((line) => line !== null))
        : ['No applied fragments yet.', '']),
      '## 12. Open Questions',
      '',
      ...renderModuleDetailList(state.openQuestions, 'No open questions yet.', '15'),
      '',
    ].join('\n');
  }
  const state = normalizedEditorState && typeof normalizedEditorState === 'object'
    ? normalizedEditorState
    : defaultModuleDocumentEditorState(project, normalizedDocType);
  const fragmentHistory = Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [];
  return [
    buildDocumentHeader(docType, project),
    buildManagedBlock({
      docType,
      version: 1,
      markdown: '',
      editorState: state,
    }),
    '',
    '## Executive Summary',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: state.overview?.stableId || '',
      sourceRefs: state.overview?.sourceRefs || [],
      versionDate: state.overview?.versionDate || '',
    }),
    state.overview?.summary || `Pending ${formatDocTypeLabel(docType)} summary.`,
    '',
    '## Working Content',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: state.workingContentMeta?.stableId || '',
      sourceRefs: state.workingContentMeta?.sourceRefs || [],
      versionDate: state.overview?.versionDate || '',
    }),
    state.workingContent || `No ${formatDocTypeLabel(docType).toLowerCase()} working content yet.`,
    '',
    '## Applied Fragments',
    '',
    ...(fragmentHistory.length
      ? fragmentHistory.flatMap((fragment) => [
          `### ${fragment.code || fragment.id || 'Fragment'}: ${fragment.title || 'Imported fragment'}`,
          '',
          `- Status: ${fragment.status || 'integrated'}`,
          `- Source: ${fragment.sourceScope || 'project'}`,
          fragment.integratedAt ? `- Integrated: ${fragment.integratedAt}` : null,
          '',
          fragment.summary || 'No fragment summary.',
          '',
        ].filter((line) => line !== null))
      : ['No applied fragments yet.', '']),
    '## Open Questions',
    '',
    ...(typeof state.openQuestions === 'string'
      ? [
          ...renderDocumentItemMetadataComment({
            stableId: state.openQuestionsMeta?.stableId || '',
            sourceRefs: state.openQuestionsMeta?.sourceRefs || [],
            versionDate: state.overview?.versionDate || '',
          }),
          state.openQuestions || 'No open questions yet.',
        ]
      : renderModuleDetailList(state.openQuestions, 'No open questions yet.', '4')),
    '',
  ].join('\n');
}

function orderRoadmapPhases(phases) {
  const active = Array.isArray(phases) ? phases.filter((phase) => !phase.archived) : [];
  const phaseById = new Map(active.map((phase) => [phase.id, phase]));
  const used = new Set();
  const ordered = [];

  function visit(phase) {
    if (!phase || used.has(phase.id)) return;
    used.add(phase.id);
    ordered.push(phase);
    const next = active
      .filter((candidate) => candidate.afterPhaseId === phase.id)
      .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
    next.forEach(visit);
  }

  active
    .filter((phase) => !phase.afterPhaseId || !phaseById.has(phase.afterPhaseId))
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .forEach(visit);

  active
    .filter((phase) => !used.has(phase.id))
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .forEach(visit);

  return ordered;
}

function renderRoadmapMarkdown(project, phases, tasks, features, bugs, mermaid, templateMeta = null) {
  const activePhases = orderRoadmapPhases(phases);
  const activeTasks = (Array.isArray(tasks) ? tasks : []).filter(isActiveTaskItem);
  const activeFeatures = (Array.isArray(features) ? features : []).filter(isActiveFeatureItem);
  const activeBugs = (Array.isArray(bugs) ? bugs : []).filter((bug) => !isArchivedBugLifecycleItem(bug));
  const roadmapTemplateMeta = templateMeta || getTemplateMetadata(DOC_TYPES.roadmap.templateName);
  const managed = {
    docType: 'roadmap',
    version: 1,
    phases: activePhases,
    tasks: activeTasks,
    features: activeFeatures,
    bugs: activeBugs,
    templateVersion: roadmapTemplateMeta.version || '',
    mermaid,
  };
  const phaseSections = activePhases.length
    ? activePhases.map((phase) => {
        const phaseTasks = activeTasks.filter((task) => task.roadmapPhaseId === phase.id);
        const phaseFeatures = activeFeatures.filter((feature) => feature.roadmapPhaseId === phase.id);
        const phaseBugs = activeBugs.filter((bug) => bug.planningBucket === 'phase' && bug.roadmapPhaseId === phase.id);
        return [
          `### ${phase.code}: ${phase.name}`,
          '',
          `**Goal:** ${phase.goal || 'TBD'}`,
          '',
          `**Status:** ${phase.status || 'planned'}`,
          '',
          `**Target Date:** ${phase.targetDate || 'TBD'}`,
          '',
          `**Summary:** ${phase.summary || 'No summary yet.'}`,
          '',
          '**Features:**',
          ...(phaseFeatures.length ? phaseFeatures.map((feature) => `- ${feature.code}: ${feature.title}`) : ['- None linked yet']),
          '',
          '**Tasks:**',
          ...(phaseTasks.length ? phaseTasks.map((task) => `- ${task.title} (${task.status})`) : ['- None linked yet']),
          '',
          '**Bugs:**',
          ...(phaseBugs.length ? phaseBugs.map((bug) => `- ${bug.code}: ${bug.title} (${bug.status})`) : ['- None linked yet']),
          '',
        ].join('\n');
      }).join('\n')
    : '## Phases\n\nNo roadmap phases yet.\n';
  const plannedFeatures = activeFeatures.filter((feature) => feature.planningBucket !== 'considered');
  const consideredFeatures = activeFeatures.filter((feature) => feature.planningBucket === 'considered');

  return [
    buildDocumentHeader('roadmap', project),
    buildManagedBlock(managed),
    '',
    '## Executive Summary',
    '',
    `${project.name} roadmap generated from roadmap phases, linked tasks, and enabled workspace plugins.`,
    '',
    `- Template Version: ${roadmapTemplateMeta.version || 'Unversioned'}`,
    `- Template Last Updated: ${roadmapTemplateMeta.lastUpdated || 'Unknown'}`,
    '',
    '> AI Agent instruction: Use feature IDs in this roadmap to cross-reference active planned entries in FEATURES.md. Implemented, completed, resolved, closed, and archived work is omitted from this document unless explicitly requested as history.',
    '> AI Agent instruction: If you need to propose roadmap changes, create or update a ROADMAP_FRAGMENT document that complies with ROADMAP_FRAGMENT.template.md instead of editing ROADMAP.md directly.',
    '> AI Agent instruction: If roadmap work changes implementation scope, create or update a PRD fragment instead of editing PRD.md directly.',
    '',
    '## Phased Implementation Plan',
    '',
    '## Phases',
    '',
    phaseSections,
    '## Planned Features',
    '',
    plannedFeatures.length
      ? plannedFeatures.map((feature) => `- ${feature.code}: ${feature.title} (${feature.status || 'planned'})`).join('\n')
      : 'No planned features.\n',
    '',
    '## Considered Features',
    '',
    consideredFeatures.length
      ? consideredFeatures.map((feature) => `- ${feature.code}: ${feature.title} (${feature.status || 'planned'})`).join('\n')
      : 'No considered features.\n',
    '',
    '## Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function renderFeaturesMarkdown(project, phases, features, mermaid) {
  const activeFeatures = (Array.isArray(features) ? features : []).filter(isActiveFeatureItem);
  const managed = {
    docType: 'features',
    version: 1,
    features: activeFeatures,
    mermaid,
  };

  function renderFeatureList(list) {
    return list.length
      ? list.map((feature) => {
          const phase = phases.find((item) => item.id === feature.roadmapPhaseId);
          return [
            `### ${feature.code}: ${feature.title}`,
            '',
            `- Status: ${feature.status}`,
            `- Roadmap Phase: ${phase ? `${phase.code}: ${phase.name}` : 'Unassigned'}`,
            `- Linked Task: ${feature.taskId || 'None'}`,
            `- Summary: ${feature.summary || 'No summary yet.'}`,
            '',
            '> AI Agent instruction: When this feature is implemented, create or update the matching PRD fragment in the database first, keep the fragment compliant with PRD_FRAGMENT.template.md, and let the PRD module merge it into PRD.md.',
            '',
          ].join('\n');
        }).join('\n')
      : 'No entries.\n';
  }

  return [
    buildDocumentHeader('features', project),
    buildManagedBlock(managed),
    '',
    '## Planned Features',
    '',
    renderFeatureList(activeFeatures),
    '## Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function renderBugsMarkdown(project, bugs, mermaid) {
  const sanitizedBugs = (Array.isArray(bugs) ? bugs : []).map(sanitizeBugForMarkdown);
  const active = dedupeVisibleBugs(sanitizedBugs.filter((bug) => !isArchivedBugLifecycleItem(bug)));
  const archived = sanitizedBugs.filter((bug) => isArchivedBugLifecycleItem(bug));
  const managed = {
    docType: 'bugs',
    version: 1,
    bugs: active,
    mermaid,
  };

  function renderLifecycleSection() {
    return BUG_LIFECYCLE_STATES.map((state, index) => (
      `1.1.${index + 1} \`${state.key}\` - ${state.label}: ${state.description}`
    )).join('\n');
  }

  function renderArchivedWorkflowNotes() {
    const workspaceDir = getProjectWorkspaceDir(project);
    return [
      'Resolved and closed bugs are automatically archived.',
      archived.length
        ? `Archived bug follow-up notes are written to ${workspaceDir} so AI agents can generate the right fragments, update canonical documents, and attach the bug code to the resulting document items.`
        : `When a bug becomes archived, write a follow-up note to ${workspaceDir} so AI agents can generate the right fragments, update canonical documents, and attach the bug code to the resulting document items.`,
      'If an archived bug moves back into an active lifecycle state, remove its workspace follow-up note and return it to the active bug list.',
    ].join('\n\n');
  }

  function renderBugList(list) {
    return list.length
      ? list.map((bug, index) => {
          const display = getBugDisplayFields(bug);
          return [
          `### 2.${index + 1} ${bug.code}: ${bug.title}`,
          '',
          `- Lifecycle Status: ${getBugLifecycleMetadata(bug.status).label} (\`${normalizeBugLifecycleStatus(bug.status)}\`)`,
          `- Planning Bucket: ${formatBugPlanningBucketLabel(bug.planningBucket)} (\`${bug.planningBucket || 'considered'}\`)`,
          `- Roadmap Phase: ${bug.roadmapPhaseId || 'None'}`,
          `- Severity: ${bug.severity}`,
          `- Completed: ${bug.completed ? 'Yes' : 'No'}`,
          `- Regressed: ${bug.regressed ? 'Yes' : 'No'}`,
          `- Linked Task: ${bug.taskId || 'None'}`,
          `- Last Updated: ${formatDocDateTime(bug.updatedAt)}`,
          `- Affected Modules: ${Array.isArray(bug.affectedModuleKeys) && bug.affectedModuleKeys.length ? bug.affectedModuleKeys.join(', ') : 'None'}`,
          `- Association Hints: ${parseAssociationHintTokens(bug.associationHints).length ? parseAssociationHintTokens(bug.associationHints).join(', ') : 'None'}`,
          '',
          '#### Current Behavior',
          renderBugLiteralTextBlock(display.currentBehavior || bug.summary || '', 'No current behavior recorded yet.'),
          '',
          '#### Expected Behavior',
          renderBugLiteralTextBlock(display.expectedBehavior || '', 'No expected behavior recorded yet.'),
          '',
        ].join('\n');
        }).join('\n')
      : 'No active bugs.\n';
  }

  return [
    buildDocumentHeader('bugs', project),
    buildManagedBlock(managed),
    '',
    '## 1. Bug Workflow',
    '',
    '### 1.1 Lifecycle States',
    '',
    'Use these lifecycle states when tracking software bugs across the project and in generated fragments.',
    '',
    renderLifecycleSection(),
    '',
    '### 1.2 Active And Archived Rules',
    '',
    'Active bugs remain in Considered, Planned, or a roadmap Phase and use one of these lifecycle states: `open`, `triaged`, `in_progress`, `blocked`, `fixed`, `verifying`, or `regressed`.',
    '',
    'Resolved and closed bugs are automatically archived. Archived bugs should not remain in the active bug list of this document.',
    '',
    '### 1.3 Archived Bug Follow-Up',
    '',
    renderArchivedWorkflowNotes(),
    '',
    '## 2. Active Bugs',
    '',
    renderBugList(active),
    '## 3. Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function defaultPrdMarkdown(project) {
  const templatePath = path.join(TEMPLATE_DIR, DOC_TYPES.prd.templateName);
  let template = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, 'utf8')
    : '# Product Requirements Document\n';
  template = template
    .replace(/\{\{PROJECT_NAME\}\}/g, project.name)
    .replace(/Angel's Project Manager/g, project.name);
  return template.trim();
}

function formatPrdDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : String(value);
}

function slugifyDocumentToken(value, fallback = 'item') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function normalizeSourceRefs(value) {
  const parts = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(/[,;\n]+/) : []);
  return [...new Set(
    parts
      .map((part) => String(part || '').trim())
      .filter(Boolean)
  )];
}

function buildStableLabelSource(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (!text) continue;
    const words = text.split(/\s+/).slice(0, 8).join(' ');
    if (words) return words;
  }
  return 'item';
}

function buildLegacyGeneratedDocumentTitle(value, fallback = '') {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return String(fallback || '').trim();
  let candidate = raw.split(/[.!?\n]+/)[0].trim();
  candidate = candidate
    .replace(/^(the application|this application|the system|this system)\s+/i, '')
    .replace(/^(users can|user can|users should|user should)\s+/i, '')
    .replace(/^(allow users to|allows users to)\s+/i, '')
    .replace(/^(the|this|a|an)\s+/i, '')
    .trim();
  const words = (candidate || raw).split(/\s+/).filter(Boolean).slice(0, 6);
  const trailingStopWords = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'by', 'in', 'on', 'at', 'from', 'through', 'into', 'across', 'during', 'without', 'before', 'after', 'over']);
  while (words.length > 2 && trailingStopWords.has(String(words[words.length - 1] || '').toLowerCase())) {
    words.pop();
  }
  let title = words.join(' ').replace(/[,:;/-]+$/g, '').trim();
  if (title.length > 72) {
    title = title.slice(0, 72).replace(/\s+\S*$/, '').trim();
  }
  if (!title) return String(fallback || '').trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function buildGeneratedDocumentTitle(value, fallback = '') {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return String(fallback || '').trim();
  const sentenceMatch = raw.match(/^(.+?)(?:(?<=[.!?])\s+|\n|$)/);
  let candidate = String(sentenceMatch?.[1] || raw).trim();
  candidate = candidate
    .replace(/^(the application|this application|the system|this system)\s+/i, '')
    .replace(/^(users can|user can|users should|user should)\s+/i, '')
    .replace(/^(allow users to|allows users to)\s+/i, '')
    .replace(/^(the|this|a|an)\s+/i, '')
    .trim();
  const clauseMatch = candidate.match(/^(.+?)(?::\s+|,\s+|\s+(?:while|when|because|so that|so|which|that)\s+)/i);
  if (clauseMatch?.[1]) {
    candidate = clauseMatch[1].trim();
  }
  const words = (candidate || raw).split(/\s+/).filter(Boolean).slice(0, 8);
  const trailingStopWords = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'by', 'in', 'on', 'at', 'from']);
  while (words.length > 2 && trailingStopWords.has(String(words[words.length - 1] || '').toLowerCase())) {
    words.pop();
  }
  let title = words.join(' ').replace(/[,:;/-]+$/g, '').trim();
  if (title.length > 96) {
    title = title.slice(0, 96).replace(/\s+\S*$/, '').trim();
  }
  if (!title) return String(fallback || '').trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function shouldRefreshGeneratedTitle(title, description) {
  const rawTitle = String(title || '').trim();
  const rawDescription = String(description || '').trim();
  if (!rawDescription) return !rawTitle;
  if (!rawTitle) return true;
  return rawTitle === buildLegacyGeneratedDocumentTitle(rawDescription, '');
}

function shouldPromoteLegacySingleLineDetail(title, description = '') {
  const rawTitle = String(title || '').trim();
  const rawDescription = String(description || '').trim();
  if (!rawTitle || rawDescription) return false;
  const titleWordCount = rawTitle.split(/\s+/).filter(Boolean).length;
  return /[.!?]$/.test(rawTitle)
    || rawTitle.includes(',')
    || rawTitle.includes(':')
    || titleWordCount >= 7
    || rawTitle.length >= 72;
}

function buildDocumentItemStableId(docType, sectionKey, item, index = 0, fallbackValues = []) {
  const explicit = String(item?.stableId || item?.targetItemId || '').trim();
  if (explicit) return explicit;
  const docPart = slugifyDocumentToken(docType || 'document', 'document');
  const sectionPart = slugifyDocumentToken(sectionKey || 'section', 'section');
  const labelSource = buildStableLabelSource(
    item?.title,
    item?.risk,
    item?.text,
    item?.label,
    ...(Array.isArray(fallbackValues) ? fallbackValues : [])
  );
  const labelPart = slugifyDocumentToken(labelSource, `item-${index + 1}`);
  return `${docPart}-${sectionPart}-${labelPart}`;
}

function renderDocumentItemMetadataComment(item = {}) {
  const stableId = String(item.stableId || item.targetItemId || '').trim();
  const sourceRefs = normalizeSourceRefs(item.sourceRefs || item.workItemCodes);
  const lastUpdated = String(item.versionDate || item.changeDate || item.updatedAt || item.createdAt || '').trim();
  if (!stableId && !sourceRefs.length && !lastUpdated) return [];
  return [
    '<!--',
    ...(stableId ? [`APM-ID: ${stableId}`] : []),
    ...(sourceRefs.length ? [`APM-REFS: ${sourceRefs.join(', ')}`] : []),
    ...(lastUpdated ? [`APM-LAST-UPDATED: ${formatPrdDate(lastUpdated)}`] : []),
    '-->',
    '',
  ];
}

function normalizePrdTextEntry(entry, context = {}) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return {
      text: entry,
      versionDate: '',
      stableId: buildDocumentItemStableId(
        context.docType || 'prd',
        context.sectionKey || 'text',
        { text: entry },
        context.index || 0,
        [entry]
      ),
      sourceRefs: [],
    };
  }
  if (typeof entry !== 'object') return null;
  const text = entry.text || entry.title || entry.description || '';
  return {
    text,
    versionDate: entry.versionDate || entry.updatedAt || entry.createdAt || '',
    stableId: buildDocumentItemStableId(
      context.docType || 'prd',
      context.sectionKey || 'text',
      entry,
      context.index || 0,
      [text]
    ),
    sourceRefs: normalizeSourceRefs(entry.sourceRefs),
  };
}

function normalizePrdDetailEntry(entry, context = {}) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const description = String(entry || '').trim();
    return {
      title: buildLegacyGeneratedDocumentTitle(description, description),
      description,
      versionDate: '',
      stableId: buildDocumentItemStableId(context.docType || 'prd', context.sectionKey || 'detail', { title: description, description }, context.index || 0, [description]),
      sourceRefs: [],
    };
  }
  if (typeof entry !== 'object') return null;
  let title = entry.title || entry.text || '';
  let description = entry.description || entry.summary || entry.details || '';
  const promotedLegacySingleLine = shouldPromoteLegacySingleLineDetail(title, description);
  if (promotedLegacySingleLine) {
    description = String(title || '').trim();
    title = buildLegacyGeneratedDocumentTitle(description, description);
  }
  const normalizedTitle = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedDescription = String(description || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const titleWordCount = normalizedTitle ? normalizedTitle.split(' ').filter(Boolean).length : 0;
  const hideLikelyDerivedTitle = Boolean(
    normalizedTitle
    && normalizedDescription
    && normalizedDescription.startsWith(normalizedTitle)
    && (
      String(title || '').trim().endsWith('.')
      || String(title || '').trim().endsWith('!')
      || String(title || '').trim().endsWith('?')
      || String(title || '').trim().length >= 80
      || titleWordCount >= 8
      || (normalizedTitle.length / Math.max(normalizedDescription.length, 1)) >= 0.55
    )
  );
  const nextTitle = promotedLegacySingleLine
    ? String(title || '').trim()
    : hideLikelyDerivedTitle || shouldRefreshGeneratedTitle(title, description)
    ? buildGeneratedDocumentTitle(description, buildGeneratedDocumentTitle(title))
    : title;
  return {
    title: nextTitle,
    description,
    versionDate: entry.versionDate || entry.updatedAt || entry.createdAt || '',
    stableId: buildDocumentItemStableId(
      context.docType || 'prd',
      context.sectionKey || 'detail',
      entry,
      context.index || 0,
      [String(title || '').trim() ? title : description, description]
    ),
    sourceRefs: normalizeSourceRefs(entry.sourceRefs),
  };
}

function normalizePrdRiskEntry(entry, context = {}) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return {
      risk: entry,
      mitigation: '',
      versionDate: '',
      stableId: buildDocumentItemStableId(context.docType || 'prd', context.sectionKey || 'risk', { risk: entry }, context.index || 0, [entry]),
      sourceRefs: [],
    };
  }
  if (typeof entry !== 'object') return null;
  return {
    risk: entry.risk || entry.title || entry.text || '',
    mitigation: entry.mitigation || entry.description || '',
    versionDate: entry.versionDate || entry.updatedAt || entry.createdAt || '',
    stableId: buildDocumentItemStableId(
      context.docType || 'prd',
      context.sectionKey || 'risk',
      entry,
      context.index || 0,
      [entry.risk || entry.title || entry.text || '', entry.mitigation || entry.description || '']
    ),
    sourceRefs: normalizeSourceRefs(entry.sourceRefs),
  };
}

function renderPrdTextList(items, emptyLabel) {
  const lines = items.flatMap((item) => {
    const text = String(item && item.text || '').trim();
    if (!text) return [];
    const suffix = item.versionDate ? ` (Updated ${formatPrdDate(item.versionDate)})` : '';
    return [
      ...renderDocumentItemMetadataComment(item),
      `- ${text}${suffix}`,
      '',
    ];
  }).filter(Boolean);
  return lines.length ? lines : [emptyLabel || '- None defined yet'];
}

function renderPrdDetailList(items, emptyLabel, sectionNumber = '') {
  const normalized = items
    .map((item, index) => normalizePrdDetailEntry(item, {
      docType: 'prd',
      sectionKey: sectionNumber || 'detail',
      index,
    }))
    .filter((item) => item && (item.title || item.description));
  if (!normalized.length) return [emptyLabel || 'No entries defined yet.'];
  return normalized.flatMap((item, index) => {
    const itemNumber = sectionNumber ? `${sectionNumber}.${index + 1}` : `${index + 1}`;
    const lines = [
      ...renderDocumentItemMetadataComment(item),
      `#### ${itemNumber}${item.title ? ` ${item.title}` : ''}`,
    ];
    if (item.description) {
      lines.push('', item.description);
    }
    if (item.versionDate) {
      lines.push('', `- Version Date: ${formatPrdDate(item.versionDate)}`);
    }
    lines.push('');
    return lines;
  });
}

function extractPrdFragmentSummary(markdown, fallback = '') {
  const lines = String(markdown || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s+/.test(line))
    .filter((line) => !/^```/.test(line))
    .filter((line) => !/^[-*]\s+(Source Feature|Status|Roadmap Phase|Linked Task|Feature Summary|Mitigation):/i.test(line))
    .filter((line) => !/^##\s+Merge Guidance/i.test(line))
    .filter((line) => !/^(AI agents should|Store PRD fragment files under|The PRD module consumes)/i.test(line));
  return lines[0] || fallback || 'No fragment summary.';
}

function normalizePrdAppliedFragmentStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'integrated') return 'integrated';
  if (normalized === 'merged') return 'merged';
  return value || 'integrated';
}

function renderPrdAppliedFragments(editorState, fragments) {
  const stateItems = Array.isArray(editorState && editorState.appliedFragments)
    ? editorState.appliedFragments
    : [];
  const fragmentMap = new Map((Array.isArray(fragments) ? fragments : []).map((fragment) => [fragment.id, fragment]));
  const accountedIds = new Set();
  const combined = [];

  for (const entry of stateItems) {
    if (!entry || typeof entry !== 'object') continue;
    const fragment = entry.fragmentId ? fragmentMap.get(entry.fragmentId) : null;
    if (entry.fragmentId) accountedIds.add(entry.fragmentId);
    combined.push({
      title: entry.title || (fragment && fragment.title) || entry.fragmentId || 'Fragment',
      status: normalizePrdAppliedFragmentStatus(entry.status || (fragment && fragment.status) || 'integrated'),
      versionDate: entry.versionDate || entry.integratedAt || (fragment && fragment.updatedAt) || '',
      summary: entry.summary || extractPrdFragmentSummary(entry.notes || (fragment && fragment.markdown) || '', entry.title || (fragment && fragment.title) || ''),
      sourceFeatureId: entry.sourceFeatureId || (fragment && fragment.featureId) || null,
      sourceFeatureStatus: entry.sourceFeatureStatus || '',
      fileName: (fragment && (fragment.fileName || fragment.mergedFileName)) || entry.fileName || '',
    });
  }

  for (const fragment of Array.isArray(fragments) ? fragments : []) {
    if (!fragment || accountedIds.has(fragment.id)) continue;
    if (!['merged', 'integrated'].includes(String(fragment.status || '').toLowerCase()) && !fragment.merged) continue;
    combined.push({
      title: fragment.title || fragment.code || fragment.id,
      status: normalizePrdAppliedFragmentStatus(fragment.status || (fragment.merged ? 'merged' : 'draft')),
      versionDate: fragment.updatedAt || fragment.mergedAt || '',
      summary: extractPrdFragmentSummary(fragment.markdown || '', fragment.title || fragment.code || fragment.id),
      sourceFeatureId: fragment.featureId || null,
      fileName: fragment.fileName || fragment.mergedFileName || '',
    });
  }

  if (!combined.length) return ['No PRD fragments have been merged or integrated yet.'];
  return combined.flatMap((item, index) => {
    const lines = [`### 10.${index + 1} ${item.title}`];
    lines.push('', `- Status: ${item.status}`);
    if (item.sourceFeatureId) lines.push(`- Source Feature: ${item.sourceFeatureId}`);
    if (item.sourceFeatureStatus) lines.push(`- Source Feature Status: ${item.sourceFeatureStatus}`);
    if (item.fileName) lines.push(`- Source File: ${item.fileName}`);
    if (item.versionDate) lines.push(`- Version Date: ${formatPrdDate(item.versionDate)}`);
    lines.push('', item.summary || 'No fragment summary.');
    lines.push('');
    return lines;
  });
}

function renderPrdEditorStateMarkdown(project, editorState, fragments = []) {
  const state = normalizeDocumentEditorStateForStorage(project, 'prd', editorState);
  const executiveSummary = state.executiveSummary && typeof state.executiveSummary === 'object'
    ? state.executiveSummary
    : { text: '' };
  const productOverview = state.productOverview && typeof state.productOverview === 'object'
    ? state.productOverview
    : {};
  const functionalRequirements = state.functionalRequirements && typeof state.functionalRequirements === 'object'
    ? state.functionalRequirements
    : {};
  const nonFunctionalRequirements = state.nonFunctionalRequirements && typeof state.nonFunctionalRequirements === 'object'
    ? state.nonFunctionalRequirements
    : {};
  const implementationPlan = state.implementationPlan && typeof state.implementationPlan === 'object'
    ? state.implementationPlan
    : {};
  const targetAudiences = (Array.isArray(productOverview.targetAudiences) ? productOverview.targetAudiences : [])
    .map((item, index) => normalizePrdTextEntry(item, { docType: 'prd', sectionKey: 'product-overview-target-audience', index }))
    .filter((item) => item && item.text);
  const keyValueProps = (Array.isArray(productOverview.keyValueProps) ? productOverview.keyValueProps : [])
    .map((item, index) => normalizePrdTextEntry(item, { docType: 'prd', sectionKey: 'product-overview-key-value-propositions', index }))
    .filter((item) => item && item.text);
  const workflows = Array.isArray(functionalRequirements.workflows) ? functionalRequirements.workflows : [];
  const userActions = Array.isArray(functionalRequirements.userActions) ? functionalRequirements.userActions : [];
  const systemBehaviors = Array.isArray(functionalRequirements.systemBehaviors) ? functionalRequirements.systemBehaviors : [];
  const technicalArchitecture = Array.isArray(state.technicalArchitecture) ? state.technicalArchitecture : [];
  const sequencing = Array.isArray(implementationPlan.sequencing) ? implementationPlan.sequencing : [];
  const dependencies = Array.isArray(implementationPlan.dependencies) ? implementationPlan.dependencies : [];
  const milestones = Array.isArray(implementationPlan.milestones) ? implementationPlan.milestones : [];
  const successMetrics = Array.isArray(state.successMetrics) ? state.successMetrics : [];
  const risksMitigations = Array.isArray(state.risksMitigations) ? state.risksMitigations : [];
  const appliedFragmentItems = Array.isArray(state.appliedFragments) ? state.appliedFragments : [];
  const integratedFeatureIds = new Set();
  appliedFragmentItems.forEach((item) => {
    if (item && item.sourceFeatureId && String(item.status || '').toLowerCase() === 'integrated') {
      integratedFeatureIds.add(item.sourceFeatureId);
    }
  });
  (Array.isArray(fragments) ? fragments : []).forEach((fragment) => {
    if (fragment && fragment.featureId && String(fragment.status || '').toLowerCase() === 'integrated') {
      integratedFeatureIds.add(fragment.featureId);
    }
  });
  const futureEnhancements = (Array.isArray(state.futureEnhancements) ? state.futureEnhancements : [])
    .filter((entry) => {
      if (!entry || typeof entry !== 'object') return Boolean(entry);
      if (entry.featureId && integratedFeatureIds.has(entry.featureId)) return false;
      return String(entry.status || '').toLowerCase() !== 'implemented';
    });
  const riskEntries = risksMitigations
    .map((item, index) => normalizePrdRiskEntry(item, { docType: 'prd', sectionKey: 'risks-and-mitigations', index }))
    .filter((item) => item && (item.risk || item.mitigation));

  return [
    `# Product Requirements Document: ${project.name}`,
    '',
    '## 1. Executive Summary',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: executiveSummary.stableId || '',
      sourceRefs: executiveSummary.sourceRefs || [],
      versionDate: executiveSummary.versionDate || '',
    }),
    executiveSummary.text || 'Pending executive summary.',
    executiveSummary.versionDate ? '' : '',
    executiveSummary.versionDate ? `_Last updated: ${formatPrdDate(executiveSummary.versionDate)}_` : '',
    '',
    '## 2. Product Overview',
    '',
    '### 2.1 Product Name',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: productOverview.itemIds?.productName || '',
      sourceRefs: productOverview.itemSourceRefs?.productName || [],
      versionDate: productOverview.versionDate || '',
    }),
    productOverview.productName || project.name,
    '',
    '### 2.2 Product Vision',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: productOverview.itemIds?.vision || '',
      sourceRefs: productOverview.itemSourceRefs?.vision || [],
      versionDate: productOverview.versionDate || '',
    }),
    productOverview.vision || 'Pending product vision.',
    productOverview.versionDate ? '' : '',
    productOverview.versionDate ? `_Last updated: ${formatPrdDate(productOverview.versionDate)}_` : '',
    '',
    '### 2.3 Target Audience',
    '',
    ...renderPrdTextList(targetAudiences, '- No target audiences defined yet'),
    '',
    '### 2.4 Key Value Propositions',
    '',
    ...renderPrdTextList(keyValueProps, '- No value propositions defined yet'),
    '',
    '## 3. Functional Requirements',
    '',
    '### 3.1 Workflows',
    '',
    ...renderPrdDetailList(workflows, 'No workflows defined yet.', '3.1'),
    '### 3.2 User Actions',
    '',
    ...renderPrdDetailList(userActions, 'No user actions defined yet.', '3.2'),
    '### 3.3 System Behaviors',
    '',
    ...renderPrdDetailList(systemBehaviors, 'No system behaviors defined yet.', '3.3'),
    '## 4. Non-Functional Requirements',
    '',
    '### 4.1 Usability',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: nonFunctionalRequirements.itemIds?.usability || '',
      sourceRefs: nonFunctionalRequirements.itemSourceRefs?.usability || [],
      versionDate: nonFunctionalRequirements.versionDate || '',
    }),
    nonFunctionalRequirements.usability || 'Pending usability guidance.',
    '',
    '### 4.2 Reliability',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: nonFunctionalRequirements.itemIds?.reliability || '',
      sourceRefs: nonFunctionalRequirements.itemSourceRefs?.reliability || [],
      versionDate: nonFunctionalRequirements.versionDate || '',
    }),
    nonFunctionalRequirements.reliability || 'Pending reliability requirements.',
    '',
    '### 4.3 Accessibility',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: nonFunctionalRequirements.itemIds?.accessibility || '',
      sourceRefs: nonFunctionalRequirements.itemSourceRefs?.accessibility || [],
      versionDate: nonFunctionalRequirements.versionDate || '',
    }),
    nonFunctionalRequirements.accessibility || 'Pending accessibility requirements.',
    '',
    '### 4.4 Security',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: nonFunctionalRequirements.itemIds?.security || '',
      sourceRefs: nonFunctionalRequirements.itemSourceRefs?.security || [],
      versionDate: nonFunctionalRequirements.versionDate || '',
    }),
    nonFunctionalRequirements.security || 'Pending security requirements.',
    '',
    '### 4.5 Performance',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: nonFunctionalRequirements.itemIds?.performance || '',
      sourceRefs: nonFunctionalRequirements.itemSourceRefs?.performance || [],
      versionDate: nonFunctionalRequirements.versionDate || '',
    }),
    nonFunctionalRequirements.performance || 'Pending performance requirements.',
    nonFunctionalRequirements.versionDate ? '' : '',
    nonFunctionalRequirements.versionDate ? `_Last updated: ${formatPrdDate(nonFunctionalRequirements.versionDate)}_` : '',
    '',
    '## 5. Technical Architecture',
    '',
    ...renderPrdDetailList(technicalArchitecture, 'No technical architecture decisions captured yet.', '5'),
    '## 6. Implementation Plan',
    '',
    '### 6.1 Sequencing',
    '',
    ...renderPrdDetailList(sequencing, 'No sequencing defined yet.', '6.1'),
    '### 6.2 Dependencies',
    '',
    ...renderPrdDetailList(dependencies, 'No dependencies defined yet.', '6.2'),
    '### 6.3 Milestones',
    '',
    ...renderPrdDetailList(milestones, 'No milestones defined yet.', '6.3'),
    '## 7. Success Metrics',
    '',
    ...renderPrdDetailList(successMetrics, 'No success metrics defined yet.', '7'),
    '## 8. Risks and Mitigations',
    '',
      ...(
        riskEntries.length
          ? riskEntries.flatMap((item, index) => {
              const lines = [
                ...renderDocumentItemMetadataComment(item),
                `### 8.${index + 1} ${item.risk || 'Unnamed risk'}`,
              ];
              if (item.mitigation) lines.push('', `- Mitigation: ${item.mitigation}`);
              if (item.versionDate) lines.push(`- Version Date: ${formatPrdDate(item.versionDate)}`);
              lines.push('');
              return lines;
            })
        : ['No risks tracked yet.']
    ),
    '## 9. Future Enhancements',
    '',
    'Planned and implemented feature work is tracked in FEATURES.md. Keep only product-facing future references here when they materially affect the product definition.',
    '',
    ...renderPrdDetailList(futureEnhancements, 'No future enhancements captured yet.', '9'),
    '## 10. Applied Fragments',
    '',
    ...renderPrdAppliedFragments(state, fragments),
    '## 11. Conclusion',
    '',
    state.conclusion || 'Pending conclusion.',
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function renderPrdMarkdown(project, markdown, mermaid, editorState = null) {
  const managed = {
    docType: 'prd',
    version: 1,
    markdown,
    mermaid,
    editorState,
  };

  return [
    buildDocumentHeader('prd', project),
    buildManagedBlock(managed),
    '',
    markdown.trim(),
    '',
    '## Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function createModuleTextSection(value = {}) {
  return {
    text: value && typeof value.text === 'string' ? value.text : '',
    versionDate: value && typeof value.versionDate === 'string' ? value.versionDate : '',
  };
}

function buildScalarDocumentItemId(docType, sectionKey, value = {}) {
  return buildDocumentItemStableId(
    docType,
    sectionKey,
    {
      stableId: value && typeof value.stableId === 'string' ? value.stableId : '',
      title: value && typeof value.title === 'string' ? value.title : sectionKey,
    },
    0,
    [value && typeof value.title === 'string' ? value.title : sectionKey]
  );
}

function normalizeScalarItemSourceRefsMap(sourceRefsMap = {}, keys = []) {
  return keys.reduce((result, key) => {
    result[key] = normalizeSourceRefs(sourceRefsMap && sourceRefsMap[key]);
    return result;
  }, {});
}

function createModuleDetailEntry(value = {}) {
  if (typeof value === 'string') {
    const description = String(value || '').trim();
    return {
      id: '',
      title: buildLegacyGeneratedDocumentTitle(description, description),
      description,
      versionDate: '',
      stableId: '',
      sourceRefs: [],
    };
  }
  const nextDescription = value && typeof value.description === 'string' ? value.description : '';
  let nextTitle = value && typeof value.title === 'string' ? value.title : '';
  let normalizedDescription = nextDescription;
  const promotedLegacySingleLine = shouldPromoteLegacySingleLineDetail(nextTitle, normalizedDescription);
  if (promotedLegacySingleLine) {
    normalizedDescription = String(nextTitle || '').trim();
    nextTitle = buildLegacyGeneratedDocumentTitle(normalizedDescription, normalizedDescription);
  }
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: value && typeof value.id === 'string' ? value.id : '',
    title: promotedLegacySingleLine
      ? String(nextTitle || '').trim()
      : shouldRefreshGeneratedTitle(nextTitle, normalizedDescription)
      ? buildGeneratedDocumentTitle(normalizedDescription, String(nextTitle || '').trim())
      : String(nextTitle || '').trim(),
    description: normalizedDescription,
    versionDate: value && typeof value.versionDate === 'string' ? value.versionDate : '',
    stableId: value && typeof value.stableId === 'string' ? value.stableId : '',
    sourceRefs: normalizeSourceRefs(value && value.sourceRefs),
  };
}

function normalizeModuleDetailList(items, context = {}) {
  return Array.isArray(items)
    ? items
      .map((item, index) => {
        const entry = createModuleDetailEntry(item);
        return {
          ...entry,
          stableId: buildDocumentItemStableId(
            context.docType || 'document',
            context.sectionKey || 'detail',
            entry,
            index,
            [entry.title, entry.description]
          ),
        };
      })
      .filter((item) => item.title || item.description)
    : [];
}

function splitLegacyDocumentTextToDetailEntries(value) {
  const text = String(value || '').trim();
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletEntries = lines
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
  if (bulletEntries.length) return bulletEntries;
  return text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function buildFunctionalFlowKey(flow = {}, fallback = '') {
  return String(flow?.id || flow?.stableId || fallback || '').trim();
}

function normalizeFunctionalFlowNodeType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'action') return 'system_action';
  if (['start', 'user_action', 'system_action', 'decision', 'validation', 'loop', 'input', 'output', 'endpoint', 'return', 'error_path', 'log_audit', 'external_interaction', 'formula', 'model_reference', 'open_question'].includes(normalized)) return normalized;
  return 'system_action';
}

function normalizeFunctionalFlowEdgeType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['continue', 'if_then', 'else', 'loop_until', 'on_success', 'on_failure', 'returns_to', 'emits', 'consumes'].includes(normalized)) return normalized;
  return 'continue';
}

function defaultFunctionalFlowNodePosition(index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: column * 280,
    y: row * 180,
  };
}

function createFunctionalFlowNodeEntry(value = {}, index = 0, flow = {}) {
  const type = normalizeFunctionalFlowNodeType(value?.type);
  const label = String(value?.label || value?.title || '').trim() || `${type.charAt(0).toUpperCase()}${type.slice(1)} ${index + 1}`;
  const stableId = buildDocumentItemStableId('functional_spec', 'flow-node', {
    stableId: value?.stableId,
    title: label,
    description: value?.description || '',
  }, index, [buildFunctionalFlowKey(flow), label, type]);
  const position = value?.position && Number.isFinite(Number(value.position.x)) && Number.isFinite(Number(value.position.y))
    ? { x: Number(value.position.x), y: Number(value.position.y) }
    : defaultFunctionalFlowNodePosition(index);
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: String(value?.id || stableId),
    stableId,
    type,
    label,
    description: String(value?.description || ''),
    command: String(value?.command || ''),
    position,
    versionDate: String(value?.versionDate || ''),
    sourceRefs: normalizeSourceRefs(value?.sourceRefs),
  };
}

function normalizeFunctionalFlowNodeList(items, flow = {}) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createFunctionalFlowNodeEntry(item, index, flow))
      .filter((item) => item.label || item.description)
    : [];
}

function createFunctionalFlowEdgeEntry(value = {}, index = 0, nodes = [], flow = {}) {
  const nodeIds = new Set(nodes.map((node) => String(node?.id || '').trim()).filter(Boolean));
  const source = String(value?.source || value?.sourceId || '').trim();
  const target = String(value?.target || value?.targetId || '').trim();
  const sourceHandle = String(value?.sourceHandle || 'output').trim();
  const targetHandle = String(value?.targetHandle || 'input').trim();
  const label = String(value?.label || '').trim();
  const edgeTitle = label || [source, target].filter(Boolean).join(' to ') || 'unconnected-edge';
  const stableId = buildDocumentItemStableId('functional_spec', 'flow-edge', {
    stableId: value?.stableId,
    title: edgeTitle,
    description: '',
  }, index, [buildFunctionalFlowKey(flow), source, target, label]);
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: String(value?.id || stableId),
    stableId,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: normalizeFunctionalFlowEdgeType(value?.type),
    label,
    conditionText: String(value?.conditionText || ''),
    parsedExpressionHint: value?.parsedExpressionHint || null,
    draft: Boolean(value?.draft),
    hidden: Boolean(value?.hidden),
    versionDate: String(value?.versionDate || ''),
    sourceRefs: normalizeSourceRefs(value?.sourceRefs),
    valid: Boolean(source || target) && (!source || nodeIds.has(source)) && (!target || nodeIds.has(target)),
  };
}

function normalizeFunctionalFlowEdgeList(items, nodes = [], flow = {}) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createFunctionalFlowEdgeEntry(item, index, nodes, flow))
      .filter((item) => item.valid)
      .map(({ valid, ...item }) => item)
    : [];
}

function normalizeFunctionalSpecFlowVisuals(items, logicalFlows = []) {
  const visuals = Array.isArray(items) ? items : [];
  return (Array.isArray(logicalFlows) ? logicalFlows : [])
    .map((flow, index) => {
      const flowKey = buildFunctionalFlowKey(flow, `flow-${index + 1}`);
      const flowStableId = String(flow?.stableId || '').trim();
      const existing = visuals.find((visual) => (
        String(visual?.flowId || '').trim() === flowKey
        || (flowStableId && String(visual?.flowStableId || '').trim() === flowStableId)
      )) || {};
      const nodes = normalizeFunctionalFlowNodeList(existing?.nodes, flow);
      const edges = normalizeFunctionalFlowEdgeList(existing?.edges, nodes, flow);
      return {
        flowId: flowKey,
        flowStableId,
        versionDate: String(existing?.versionDate || ''),
        nodes,
        edges,
      };
    })
    .filter((visual) => visual.flowId);
}

function normalizeFunctionalSpecFlowEndpoints(items, flowVisuals = []) {
  const normalized = normalizeModuleDetailList(items, { docType: 'functional_spec', sectionKey: 'flow-endpoints' });
  const nodeStableIds = new Set();
  (Array.isArray(flowVisuals) ? flowVisuals : []).forEach((visual) => {
    (Array.isArray(visual?.nodes) ? visual.nodes : []).forEach((node) => {
      if (!['endpoint', 'return'].includes(normalizeFunctionalFlowNodeType(node?.type))) return;
      const stableId = String(node?.stableId || '').trim();
      if (stableId) nodeStableIds.add(stableId);
    });
  });
  const seen = new Set();
  return normalized
    .map((endpoint) => {
      const id = String(endpoint?.id || '').trim();
      const stableId = String(endpoint?.stableId || '').trim();
      if (id.startsWith('derived-endpoint-') && stableId && nodeStableIds.has(stableId) && !stableId.endsWith('-endpoint')) {
        return {
          ...endpoint,
          stableId: `${stableId}-endpoint`,
        };
      }
      return endpoint;
    })
    .filter((endpoint, index) => {
      const key = String(endpoint?.stableId || `${endpoint?.title || ''}::${endpoint?.description || ''}` || `endpoint-${index}`).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeDomainModelType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (['entity', 'value-object', 'aggregate', 'event', 'command', 'concept', 'external-resource'].includes(normalized)) return normalized;
  return normalized || 'concept';
}

function normalizeDomainConceptualType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (['text', 'number', 'boolean', 'date', 'datetime', 'identifier', 'enum', 'object', 'collection', 'reference', 'unknown'].includes(normalized)) return normalized;
  return normalized || 'unknown';
}

function createDomainModelFieldEntry(value = {}, index = 0, model = {}) {
  const name = String(value?.name || value?.title || '').trim();
  const displayName = String(value?.displayName || name).trim();
  const modelName = String(model?.name || model?.title || '').trim();
  const stableId = buildDocumentItemStableId('domain_models', 'field', {
    stableId: value?.stableId,
    title: [modelName, name || displayName].filter(Boolean).join(' '),
    description: value?.description || '',
  }, index, [modelName, name, displayName]);
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: String(value?.id || stableId),
    stableId,
    name,
    displayName,
    description: String(value?.description || ''),
    conceptualType: normalizeDomainConceptualType(value?.conceptualType || value?.type),
    required: Boolean(value?.required),
    defaultValue: value?.defaultValue !== undefined ? String(value.defaultValue || '') : '',
    allowedValues: Array.isArray(value?.allowedValues)
      ? value.allowedValues.map((item) => String(item || '').trim()).filter(Boolean)
      : String(value?.allowedValues || '').split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean),
    constraints: normalizeModuleDetailList(value?.constraints, { docType: 'domain_models', sectionKey: 'field-constraints' }),
    sourceRefs: normalizeSourceRefs(value?.sourceRefs),
    versionDate: String(value?.versionDate || ''),
  };
}

function normalizeDomainModelFields(items, model = {}) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createDomainModelFieldEntry(item, index, model))
      .filter((item) => item.name || item.description)
    : [];
}

function createDomainModelRelationshipEntry(value = {}, index = 0, model = {}) {
  const title = String(value?.title || value?.name || '').trim();
  const modelName = String(model?.name || model?.title || '').trim();
  const stableId = buildDocumentItemStableId('domain_models', 'relationship', {
    stableId: value?.stableId,
    title: [modelName, title].filter(Boolean).join(' '),
    description: value?.description || '',
  }, index, [modelName, title, value?.targetModelName || value?.targetModelStableId]);
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: String(value?.id || stableId),
    stableId,
    title,
    description: String(value?.description || ''),
    relationshipType: String(value?.relationshipType || value?.type || '').trim(),
    targetModelStableId: String(value?.targetModelStableId || '').trim(),
    targetModelName: String(value?.targetModelName || '').trim(),
    sourceRefs: normalizeSourceRefs(value?.sourceRefs),
    versionDate: String(value?.versionDate || ''),
  };
}

function normalizeDomainModelRelationships(items, model = {}) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createDomainModelRelationshipEntry(item, index, model))
      .filter((item) => item.title || item.description || item.targetModelName || item.targetModelStableId)
    : [];
}

function createDomainModelEntry(value = {}, index = 0) {
  const name = String(value?.name || value?.title || '').trim();
  const summary = String(value?.summary || value?.description || '').trim();
  const stableId = buildDocumentItemStableId('domain_models', 'model', {
    stableId: value?.stableId,
    title: name,
    description: summary,
  }, index, [name, summary]);
  const model = {
    ...(value && typeof value === 'object' ? value : {}),
    id: String(value?.id || stableId),
    stableId,
    name,
    summary,
    description: String(value?.description || ''),
    modelType: normalizeDomainModelType(value?.modelType || value?.type),
    sourceRefs: normalizeSourceRefs(value?.sourceRefs),
    versionDate: String(value?.versionDate || ''),
  };
  model.fields = normalizeDomainModelFields(value?.fields, model);
  model.relationships = normalizeDomainModelRelationships(value?.relationships, model);
  model.rules = normalizeModuleDetailList(value?.rules, { docType: 'domain_models', sectionKey: `model-${name || index + 1}-rules` });
  model.examples = normalizeModuleDetailList(value?.examples, { docType: 'domain_models', sectionKey: `model-${name || index + 1}-examples` });
  return model;
}

function normalizeDomainModelList(items) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createDomainModelEntry(item, index))
      .filter((item) => item.name || item.summary || item.description || item.fields.length)
    : [];
}

function normalizeDomainProjectionType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (['functional', 'experience', 'persistence', 'technical', 'api-request', 'api-response', 'event', 'message', 'test-fixture'].includes(normalized)) return normalized;
  return normalized || 'functional';
}

function createDomainModelProjectionEntry(value = {}, index = 0) {
  const name = String(value?.name || value?.title || '').trim();
  const stableId = buildDocumentItemStableId('domain_models', 'projection', {
    stableId: value?.stableId,
    title: name,
    description: value?.description || '',
  }, index, [name, value?.baseModelStableId, value?.owningModule, value?.projectionType]);
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: String(value?.id || stableId),
    stableId,
    baseModelId: String(value?.baseModelId || '').trim(),
    baseModelStableId: String(value?.baseModelStableId || '').trim(),
    baseModelName: String(value?.baseModelName || '').trim(),
    owningModule: String(value?.owningModule || '').trim(),
    projectionType: normalizeDomainProjectionType(value?.projectionType || value?.type),
    name,
    description: String(value?.description || ''),
    fieldMappings: normalizeModuleDetailList(value?.fieldMappings, { docType: 'domain_models', sectionKey: `projection-${name || index + 1}-field-mappings` }),
    excludedFields: Array.isArray(value?.excludedFields)
      ? value.excludedFields.map((item) => String(item || '').trim()).filter(Boolean)
      : String(value?.excludedFields || '').split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean),
    additionalFields: normalizeDomainModelFields(value?.additionalFields, { name }),
    constraints: normalizeModuleDetailList(value?.constraints, { docType: 'domain_models', sectionKey: `projection-${name || index + 1}-constraints` }),
    sourceRefs: normalizeSourceRefs(value?.sourceRefs),
    versionDate: String(value?.versionDate || ''),
  };
}

function normalizeDomainModelProjectionList(items) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createDomainModelProjectionEntry(item, index))
      .filter((item) => item.name || item.description || item.baseModelStableId || item.baseModelName)
    : [];
}

function renderDomainModelCatalog(models) {
  const normalized = normalizeDomainModelList(models);
  if (!normalized.length) return ['No domain models defined yet.', ''];
  return normalized.flatMap((model, index) => [
    `### 2.${index + 1} ${model.name || 'Unnamed Model'}`,
    '',
    `- Type: ${model.modelType || 'concept'}`,
    `- Fields: ${model.fields.length}`,
    `- Relationships: ${model.relationships.length}`,
    model.summary ? `- Summary: ${model.summary}` : null,
    '',
  ].filter((line) => line !== null));
}

function renderDomainModelFields(model, modelNumber) {
  if (!model.fields.length) return ['No fields defined yet.', ''];
  return model.fields.flatMap((field, index) => [
    ...renderDocumentItemMetadataComment(field),
    `#### ${modelNumber}.${index + 1} Field: ${field.name || 'Unnamed Field'}`,
    '',
    `- Display Name: ${field.displayName || field.name || 'Unnamed Field'}`,
    `- Conceptual Type: ${field.conceptualType || 'unknown'}`,
    `- Required: ${field.required ? 'Yes' : 'No'}`,
    field.defaultValue ? `- Default Value: ${field.defaultValue}` : null,
    field.allowedValues.length ? `- Allowed Values: ${field.allowedValues.join(', ')}` : null,
    field.description ? ['', field.description] : null,
    field.constraints.length ? ['', 'Constraints:', '', ...renderModuleDetailList(field.constraints, 'No field constraints defined yet.', `${modelNumber}.${index + 1}`)] : null,
    '',
  ].flat().filter((line) => line !== null));
}

function renderDomainModelRelationships(model, modelNumber) {
  if (!model.relationships.length) return ['No relationships defined yet.', ''];
  return model.relationships.flatMap((relationship, index) => [
    ...renderDocumentItemMetadataComment(relationship),
    `#### ${modelNumber}.${index + 1} Relationship: ${relationship.title || relationship.targetModelName || 'Unnamed Relationship'}`,
    '',
    relationship.relationshipType ? `- Type: ${relationship.relationshipType}` : null,
    relationship.targetModelName ? `- Target Model: ${relationship.targetModelName}` : null,
    relationship.targetModelStableId ? `- Target Model ID: ${relationship.targetModelStableId}` : null,
    relationship.description ? ['', relationship.description] : null,
    '',
  ].flat().filter((line) => line !== null));
}

function renderDomainModels(models) {
  const normalized = normalizeDomainModelList(models);
  if (!normalized.length) return ['No domain model details defined yet.', ''];
  return normalized.flatMap((model, index) => {
    const modelNumber = `3.${index + 1}`;
    return [
      ...renderDocumentItemMetadataComment(model),
      `### ${modelNumber} ${model.name || 'Unnamed Model'}`,
      '',
      `- Model Type: ${model.modelType || 'concept'}`,
      model.summary ? `- Summary: ${model.summary}` : null,
      '',
      model.description || 'No model description captured yet.',
      '',
      `#### ${modelNumber}.1 Fields`,
      '',
      ...renderDomainModelFields(model, `${modelNumber}.1`),
      `#### ${modelNumber}.2 Relationships`,
      '',
      ...renderDomainModelRelationships(model, `${modelNumber}.2`),
      `#### ${modelNumber}.3 Rules`,
      '',
      ...renderModuleDetailList(model.rules, 'No model rules defined yet.', `${modelNumber}.3`),
      `#### ${modelNumber}.4 Examples`,
      '',
      ...renderModuleDetailList(model.examples, 'No model examples defined yet.', `${modelNumber}.4`),
    ].filter((line) => line !== null);
  });
}

function renderDomainModelProjections(projections) {
  const normalized = normalizeDomainModelProjectionList(projections);
  if (!normalized.length) return ['No model projections defined yet.', ''];
  return normalized.flatMap((projection, index) => {
    const projectionNumber = `4.${index + 1}`;
    return [
      ...renderDocumentItemMetadataComment(projection),
      `### ${projectionNumber} ${projection.name || 'Unnamed Projection'}`,
      '',
      `- Projection Type: ${projection.projectionType || 'functional'}`,
      projection.owningModule ? `- Owning Module: ${projection.owningModule}` : null,
      projection.baseModelName ? `- Base Model: ${projection.baseModelName}` : null,
      projection.baseModelStableId ? `- Base Model ID: ${projection.baseModelStableId}` : null,
      projection.excludedFields.length ? `- Excluded Fields: ${projection.excludedFields.join(', ')}` : null,
      '',
      projection.description || 'No projection description captured yet.',
      '',
      '#### Field Mappings',
      '',
      ...renderModuleDetailList(projection.fieldMappings, 'No field mappings defined yet.', `${projectionNumber}.1`),
      '#### Additional Fields',
      '',
      ...(projection.additionalFields.length
        ? projection.additionalFields.flatMap((field, fieldIndex) => [
            ...renderDocumentItemMetadataComment(field),
            `##### ${projectionNumber}.2.${fieldIndex + 1} ${field.name || 'Unnamed Field'}`,
            '',
            `- Conceptual Type: ${field.conceptualType || 'unknown'}`,
            `- Required: ${field.required ? 'Yes' : 'No'}`,
            field.description || '',
            '',
          ])
        : ['No additional fields defined yet.', '']),
      '#### Constraints',
      '',
      ...renderModuleDetailList(projection.constraints, 'No projection constraints defined yet.', `${projectionNumber}.3`),
    ].filter((line) => line !== null);
  });
}

function createChangelogEntry(value = {}, index = 0) {
  const workItemCodes = value && typeof value.workItemCodes === 'string' ? value.workItemCodes : '';
  const targetDoc = value && typeof value.targetDoc === 'string' ? value.targetDoc : '';
  const targetSectionNumber = value && typeof value.targetSectionNumber === 'string' ? value.targetSectionNumber : '';
  const targetItemId = value && typeof value.targetItemId === 'string' ? value.targetItemId : '';
  const entryId = value && typeof value.id === 'string' && value.id.trim()
    ? value.id.trim()
    : `changelog-entry-${index}-${String(targetItemId || workItemCodes || 'entry').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'entry'}`;
  return {
    id: entryId,
    stableId: value && typeof value.stableId === 'string' && value.stableId.trim()
      ? value.stableId.trim()
      : buildDocumentItemStableId('changelog', 'entry', value || {}, index, [targetItemId, workItemCodes, value && value.summary]),
    changeDate: value && typeof value.changeDate === 'string' ? value.changeDate : '',
    workItemCodes,
    operation: value && typeof value.operation === 'string' ? value.operation : 'update',
    targetDoc,
    targetSectionNumber,
    targetItemId,
    fragmentCode: value && typeof value.fragmentCode === 'string' ? value.fragmentCode : '',
    summary: value && typeof value.summary === 'string' ? value.summary : '',
    versionDate: value && typeof value.versionDate === 'string' ? value.versionDate : '',
    sourceRefs: normalizeSourceRefs(value && value.sourceRefs ? value.sourceRefs : workItemCodes),
  };
}

function normalizeChangelogEntries(items) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createChangelogEntry(item, index))
      .filter((item) => item.workItemCodes || item.targetDoc || item.targetSectionNumber || item.targetItemId || item.summary)
    : [];
}

function normalizeChangelogTargetDoc(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
}

function buildDocumentSourceRefBackfillMap(docType, changelogEditorState) {
  const normalizedTargetDoc = normalizeChangelogTargetDoc(docType);
  const entries = normalizeChangelogEntries(changelogEditorState && changelogEditorState.entries);
  const map = new Map();

  for (const entry of entries) {
    if (normalizeChangelogTargetDoc(entry.targetDoc) !== normalizedTargetDoc) continue;
    const targetItemId = String(entry.targetItemId || '').trim();
    if (!targetItemId) continue;
    const refs = normalizeSourceRefs(entry.sourceRefs || entry.workItemCodes);
    if (!refs.length) continue;
    const existing = map.get(targetItemId) || [];
    map.set(targetItemId, normalizeSourceRefs([...existing, ...refs]));
  }

  return map;
}

function mergeSourceRefsIntoItem(item, sourceRefMap) {
  if (!item || typeof item !== 'object') return item;
  const stableId = String(item.stableId || item.targetItemId || '').trim();
  if (!stableId) return item;
  const refs = sourceRefMap.get(stableId);
  if (!refs || !refs.length) return item;
  return {
    ...item,
    sourceRefs: normalizeSourceRefs([...(normalizeSourceRefs(item.sourceRefs)), ...refs]),
  };
}

function mergeSourceRefsIntoList(items, sourceRefMap) {
  return Array.isArray(items)
    ? items.map((item) => mergeSourceRefsIntoItem(item, sourceRefMap))
    : items;
}

function backfillDocumentEditorStateFromChangelog(project, docType, editorState, changelogEditorState) {
  const normalizedDocType = String(docType || '').trim().toLowerCase();
  if (!editorState || typeof editorState !== 'object' || !changelogEditorState || typeof changelogEditorState !== 'object') {
    return editorState;
  }

  const sourceRefMap = buildDocumentSourceRefBackfillMap(normalizedDocType, changelogEditorState);
  if (!sourceRefMap.size) return editorState;

  if (normalizedDocType === 'prd') {
    const nextState = {
      ...editorState,
      executiveSummary: mergeSourceRefsIntoItem(editorState.executiveSummary, sourceRefMap),
      productOverview: {
        ...(editorState.productOverview || {}),
        itemSourceRefs: {
          ...(editorState.productOverview?.itemSourceRefs || {}),
        },
        targetAudiences: mergeSourceRefsIntoList(editorState.productOverview?.targetAudiences, sourceRefMap),
        keyValueProps: mergeSourceRefsIntoList(editorState.productOverview?.keyValueProps, sourceRefMap),
      },
      functionalRequirements: {
        ...(editorState.functionalRequirements || {}),
        workflows: mergeSourceRefsIntoList(editorState.functionalRequirements?.workflows, sourceRefMap),
        userActions: mergeSourceRefsIntoList(editorState.functionalRequirements?.userActions, sourceRefMap),
        systemBehaviors: mergeSourceRefsIntoList(editorState.functionalRequirements?.systemBehaviors, sourceRefMap),
      },
      technicalArchitecture: mergeSourceRefsIntoList(editorState.technicalArchitecture, sourceRefMap),
      implementationPlan: {
        ...(editorState.implementationPlan || {}),
        sequencing: mergeSourceRefsIntoList(editorState.implementationPlan?.sequencing, sourceRefMap),
        dependencies: mergeSourceRefsIntoList(editorState.implementationPlan?.dependencies, sourceRefMap),
        milestones: mergeSourceRefsIntoList(editorState.implementationPlan?.milestones, sourceRefMap),
      },
      successMetrics: mergeSourceRefsIntoList(editorState.successMetrics, sourceRefMap),
      risksMitigations: mergeSourceRefsIntoList(editorState.risksMitigations, sourceRefMap),
      futureEnhancements: mergeSourceRefsIntoList(editorState.futureEnhancements, sourceRefMap),
    };

    const itemIds = nextState.nonFunctionalRequirements?.itemIds || {};
    const itemSourceRefs = {
      ...(nextState.nonFunctionalRequirements?.itemSourceRefs || {}),
    };
    ['usability', 'reliability', 'accessibility', 'security', 'performance'].forEach((key) => {
      const stableId = String(itemIds[key] || '').trim();
      if (!stableId) return;
      const refs = sourceRefMap.get(stableId);
      if (!refs || !refs.length) return;
      itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(itemSourceRefs[key])), ...refs]);
    });
    nextState.nonFunctionalRequirements = {
      ...(nextState.nonFunctionalRequirements || {}),
      itemSourceRefs,
    };

    const productOverviewItemIds = nextState.productOverview?.itemIds || {};
    const productOverviewItemSourceRefs = {
      ...(nextState.productOverview?.itemSourceRefs || {}),
    };
    ['productName', 'vision'].forEach((key) => {
      const stableId = String(productOverviewItemIds[key] || '').trim();
      if (!stableId) return;
      const refs = sourceRefMap.get(stableId);
      if (!refs || !refs.length) return;
      productOverviewItemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(productOverviewItemSourceRefs[key])), ...refs]);
    });
    nextState.productOverview = {
      ...(nextState.productOverview || {}),
      itemSourceRefs: productOverviewItemSourceRefs,
    };

    return nextState;
  }

  if (normalizedDocType === 'architecture') {
    const nextState = {
      ...editorState,
      overview: {
        ...(editorState.overview || {}),
        itemSourceRefs: {
          ...(editorState.overview?.itemSourceRefs || {}),
        },
      },
      structure: {
        ...(editorState.structure || {}),
        itemSourceRefs: {
          ...(editorState.structure?.itemSourceRefs || {}),
        },
      },
      techStack: mergeSourceRefsIntoList(editorState.techStack, sourceRefMap),
      boundaries: mergeSourceRefsIntoList(editorState.boundaries, sourceRefMap),
      externalDependencies: mergeSourceRefsIntoList(editorState.externalDependencies, sourceRefMap),
      subArchitectures: mergeSourceRefsIntoList(editorState.subArchitectures, sourceRefMap),
      applicationWorkflows: mergeSourceRefsIntoList(editorState.applicationWorkflows || editorState.runtimeScenarios, sourceRefMap),
      architectureWorkflows: mergeSourceRefsIntoList(editorState.architectureWorkflows, sourceRefMap),
      moduleInteractions: mergeSourceRefsIntoList(editorState.moduleInteractions, sourceRefMap),
      crossCuttingConcerns: mergeSourceRefsIntoList(editorState.crossCuttingConcerns || editorState.operationalConcerns, sourceRefMap),
      decisions: mergeSourceRefsIntoList(editorState.decisions, sourceRefMap),
      constraints: mergeSourceRefsIntoList(editorState.constraints, sourceRefMap),
      openQuestions: mergeSourceRefsIntoList(editorState.openQuestions, sourceRefMap),
      persistenceStrategy: {
        ...(editorState.persistenceStrategy || {}),
        itemSourceRefs: {
          ...(editorState.persistenceStrategy?.itemSourceRefs || {}),
        },
      },
      deployment: {
        ...(editorState.deployment || {}),
        itemSourceRefs: {
          ...(editorState.deployment?.itemSourceRefs || {}),
        },
      },
    };
    ['systemPurpose', 'architecturalVision', 'architecturalStyle'].forEach((key) => {
      const stableId = String(nextState.overview?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.overview.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.overview.itemSourceRefs[key])), ...refs]);
    });
    ['primaryArchitecture', 'architectureType', 'architectureScope', 'systemContext'].forEach((key) => {
      const stableId = String(nextState.structure?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.structure.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.structure.itemSourceRefs[key])), ...refs]);
    });
    ['summary', 'sourceOfTruth', 'syncExpectations'].forEach((key) => {
      const stableId = String(nextState.persistenceStrategy?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.persistenceStrategy.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.persistenceStrategy.itemSourceRefs[key])), ...refs]);
    });
    ['runtimeTopology', 'environmentNotes'].forEach((key) => {
      const stableId = String(nextState.deployment?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.deployment.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.deployment.itemSourceRefs[key])), ...refs]);
    });
    return nextState;
  }

  if (normalizedDocType === 'functional_spec') {
    const nextState = {
      ...editorState,
      overview: {
        ...(editorState.overview || {}),
        sourceRefs: normalizeSourceRefs(editorState.overview?.sourceRefs),
      },
      logicalFlows: mergeSourceRefsIntoList(editorState.logicalFlows, sourceRefMap),
      flowEndpoints: mergeSourceRefsIntoList(editorState.flowEndpoints, sourceRefMap),
      userActionsAndSystemResponses: mergeSourceRefsIntoList(editorState.userActionsAndSystemResponses, sourceRefMap),
      validationRules: mergeSourceRefsIntoList(editorState.validationRules, sourceRefMap),
      interfaceExpectations: mergeSourceRefsIntoList(editorState.interfaceExpectations, sourceRefMap),
      edgeCases: mergeSourceRefsIntoList(editorState.edgeCases, sourceRefMap),
      openQuestions: mergeSourceRefsIntoList(editorState.openQuestions, sourceRefMap),
    };
    {
      const stableId = String(nextState.overview?.stableId || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.overview.sourceRefs = normalizeSourceRefs([...(normalizeSourceRefs(nextState.overview.sourceRefs)), ...refs]);
    }
    return nextState;
  }

  if (normalizedDocType === 'ai_environment') {
    const nextState = {
      ...editorState,
      overview: {
        ...(editorState.overview || {}),
        itemSourceRefs: {
          ...(editorState.overview?.itemSourceRefs || {}),
        },
      },
      requiredBehaviors: mergeSourceRefsIntoList(editorState.requiredBehaviors, sourceRefMap),
      termDictionary: mergeSourceRefsIntoList(editorState.termDictionary, sourceRefMap),
      moduleUpdateRules: mergeSourceRefsIntoList(editorState.moduleUpdateRules, sourceRefMap),
      dataPhrasingRules: mergeSourceRefsIntoList(editorState.dataPhrasingRules, sourceRefMap),
      avoidRules: mergeSourceRefsIntoList(editorState.avoidRules, sourceRefMap),
      handoffChecklist: mergeSourceRefsIntoList(editorState.handoffChecklist, sourceRefMap),
      customInstructionsMeta: {
        ...(editorState.customInstructionsMeta || {}),
        sourceRefs: normalizeSourceRefs(editorState.customInstructionsMeta?.sourceRefs),
      },
    };
    ['mission', 'operatingModel', 'communicationStyle'].forEach((key) => {
      const stableId = String(nextState.overview?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.overview.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.overview.itemSourceRefs[key])), ...refs]);
    });
    {
      const stableId = String(nextState.customInstructionsMeta?.stableId || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.customInstructionsMeta.sourceRefs = normalizeSourceRefs([...(normalizeSourceRefs(nextState.customInstructionsMeta.sourceRefs)), ...refs]);
    }
    return nextState;
  }

  if (normalizedDocType === 'adr') {
    const nextState = {
      ...editorState,
      overview: {
        ...(editorState.overview || {}),
        sourceRefs: normalizeSourceRefs(editorState.overview?.sourceRefs),
      },
      metadata: {
        ...(editorState.metadata || {}),
        itemSourceRefs: {
          ...(editorState.metadata?.itemSourceRefs || {}),
        },
      },
      alternatives: mergeSourceRefsIntoList(editorState.alternatives, sourceRefMap),
      consequences: mergeSourceRefsIntoList(editorState.consequences, sourceRefMap),
      relatedArchitecture: mergeSourceRefsIntoList(editorState.relatedArchitecture, sourceRefMap),
      relatedModules: mergeSourceRefsIntoList(editorState.relatedModules, sourceRefMap),
      openQuestions: mergeSourceRefsIntoList(editorState.openQuestions, sourceRefMap),
      contextMeta: {
        ...(editorState.contextMeta || {}),
        sourceRefs: normalizeSourceRefs(editorState.contextMeta?.sourceRefs),
      },
      decisionMeta: {
        ...(editorState.decisionMeta || {}),
        sourceRefs: normalizeSourceRefs(editorState.decisionMeta?.sourceRefs),
      },
      rationaleMeta: {
        ...(editorState.rationaleMeta || {}),
        sourceRefs: normalizeSourceRefs(editorState.rationaleMeta?.sourceRefs),
      },
      followUpNotesMeta: {
        ...(editorState.followUpNotesMeta || {}),
        sourceRefs: normalizeSourceRefs(editorState.followUpNotesMeta?.sourceRefs),
      },
    };
    {
      const stableId = String(nextState.overview?.stableId || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.overview.sourceRefs = normalizeSourceRefs([...(normalizeSourceRefs(nextState.overview.sourceRefs)), ...refs]);
    }
    ['decisionTitle', 'status', 'scope', 'owners', 'decisionDate'].forEach((key) => {
      const stableId = String(nextState.metadata?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.metadata.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.metadata.itemSourceRefs[key])), ...refs]);
    });
    ['contextMeta', 'decisionMeta', 'rationaleMeta', 'followUpNotesMeta'].forEach((key) => {
      const stableId = String(nextState[key]?.stableId || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState[key].sourceRefs = normalizeSourceRefs([...(normalizeSourceRefs(nextState[key].sourceRefs)), ...refs]);
    });
    return nextState;
  }

  if (normalizedDocType === 'database_schema') {
    const nextState = {
      ...editorState,
      overview: {
        ...(editorState.overview || {}),
        itemSourceRefs: {
          ...(editorState.overview?.itemSourceRefs || {}),
        },
      },
      entities: mergeSourceRefsIntoList(editorState.entities, sourceRefMap),
      relationships: mergeSourceRefsIntoList(editorState.relationships, sourceRefMap),
      constraints: mergeSourceRefsIntoList(editorState.constraints, sourceRefMap),
      indexes: mergeSourceRefsIntoList(editorState.indexes, sourceRefMap),
      migrations: mergeSourceRefsIntoList(editorState.migrations, sourceRefMap),
      synchronizationRules: mergeSourceRefsIntoList(editorState.synchronizationRules, sourceRefMap),
      openQuestions: mergeSourceRefsIntoList(editorState.openQuestions, sourceRefMap),
    };
    ['purpose', 'storageStrategy'].forEach((key) => {
      const stableId = String(nextState.overview?.itemIds?.[key] || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.overview.itemSourceRefs[key] = normalizeSourceRefs([...(normalizeSourceRefs(nextState.overview.itemSourceRefs[key])), ...refs]);
    });
    return nextState;
  }

  if (normalizedDocType === 'changelog') {
    const nextState = {
      ...editorState,
      openQuestions: mergeSourceRefsIntoList(editorState.openQuestions, sourceRefMap),
      overview: {
        ...(editorState.overview || {}),
        sourceRefs: normalizeSourceRefs(editorState.overview?.sourceRefs),
      },
    };
    {
      const stableId = String(nextState.overview?.stableId || '').trim();
      const refs = sourceRefMap.get(stableId);
      if (stableId && refs?.length) nextState.overview.sourceRefs = normalizeSourceRefs([...(normalizeSourceRefs(nextState.overview.sourceRefs)), ...refs]);
    }
    return nextState;
  }

  const nextState = {
    ...editorState,
    openQuestions: mergeSourceRefsIntoList(editorState.openQuestions, sourceRefMap),
    overview: {
      ...(editorState.overview || {}),
      sourceRefs: normalizeSourceRefs(editorState.overview?.sourceRefs),
    },
    workingContentMeta: {
      ...(editorState.workingContentMeta || {}),
      sourceRefs: normalizeSourceRefs(editorState.workingContentMeta?.sourceRefs),
    },
    openQuestionsMeta: {
      ...(editorState.openQuestionsMeta || {}),
      sourceRefs: normalizeSourceRefs(editorState.openQuestionsMeta?.sourceRefs),
    },
  };
  ['overview', 'workingContentMeta', 'openQuestionsMeta'].forEach((key) => {
    const stableId = String(nextState[key]?.stableId || '').trim();
    const refs = sourceRefMap.get(stableId);
    if (stableId && refs?.length) nextState[key].sourceRefs = normalizeSourceRefs([...(normalizeSourceRefs(nextState[key].sourceRefs)), ...refs]);
  });
  return nextState;
}

function parseFragmentOperationsComment(markdown) {
  const match = String(markdown || '').match(/<!--\s*APM:OPERATIONS\s*([\s\S]*?)\s*-->/i);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.operations)) return parsed.operations;
    return parsed && typeof parsed === 'object' ? [parsed] : [];
  } catch {
    return [];
  }
}

function normalizeFragmentOperation(operation, index = 0, defaults = {}) {
  const raw = operation && typeof operation === 'object' ? operation : {};
  const payload = raw.item && typeof raw.item === 'object' ? raw.item : {};
  const explicitRefs = raw.sourceRefs !== undefined
    ? raw.sourceRefs
    : (raw.workItemCodes !== undefined ? raw.workItemCodes : payload.sourceRefs);
  const normalizedTargetSection = String(
    raw.targetSection
    || raw.section
    || raw.toSection
    || payload.targetSection
    || ''
  ).trim().toLowerCase();
  const normalizedFromSection = String(
    raw.fromSection
    || raw.sectionFrom
    || ''
  ).trim().toLowerCase();
  return {
    id: String(raw.id || `fragment-op-${index + 1}`).trim(),
    operation: String(raw.operation || raw.action || '').trim().toLowerCase(),
    targetSection: normalizedTargetSection,
    fromSection: normalizedFromSection,
    targetItemId: String(raw.targetItemId || raw.stableId || payload.targetItemId || payload.stableId || '').trim(),
    beforeItemId: String(raw.beforeItemId || '').trim(),
    afterItemId: String(raw.afterItemId || '').trim(),
    orderedIds: Array.isArray(raw.orderedIds)
      ? raw.orderedIds.map((value) => String(value || '').trim()).filter(Boolean)
      : (Array.isArray(raw.targetItemIds)
        ? raw.targetItemIds.map((value) => String(value || '').trim()).filter(Boolean)
        : []),
    versionDate: String(raw.versionDate || raw.changeDate || payload.versionDate || defaults.versionDate || '').trim(),
    changeDate: String(raw.changeDate || raw.versionDate || payload.changeDate || defaults.versionDate || '').trim(),
    sourceRefs: normalizeSourceRefs(explicitRefs !== undefined ? explicitRefs : defaults.sourceRefs),
    item: payload,
    title: raw.title !== undefined ? raw.title : payload.title,
    description: raw.description !== undefined ? raw.description : payload.description,
    risk: raw.risk !== undefined ? raw.risk : payload.risk,
    mitigation: raw.mitigation !== undefined ? raw.mitigation : payload.mitigation,
    text: raw.text !== undefined ? raw.text : payload.text,
    workItemCodes: raw.workItemCodes !== undefined ? raw.workItemCodes : payload.workItemCodes,
    targetDoc: raw.targetDoc !== undefined ? raw.targetDoc : payload.targetDoc,
    targetSectionNumber: raw.targetSectionNumber !== undefined ? raw.targetSectionNumber : payload.targetSectionNumber,
    fragmentCode: raw.fragmentCode !== undefined ? raw.fragmentCode : payload.fragmentCode,
    summary: raw.summary !== undefined ? raw.summary : payload.summary,
  };
}

function extractDocumentFragmentOperations(markdown, fragmentMetadata = null, defaults = {}) {
  const metadataOperations = Array.isArray(fragmentMetadata && fragmentMetadata.operations)
    ? fragmentMetadata.operations
    : [];
  const commentOperations = parseFragmentOperationsComment(markdown);
  return [...metadataOperations, ...commentOperations]
    .map((operation, index) => normalizeFragmentOperation(operation, index, defaults))
    .filter((operation) => operation.operation);
}

function getValueAtPath(target, pathParts = []) {
  return pathParts.reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), target);
}

function setValueAtPath(target, pathParts = [], nextValue) {
  if (!target || typeof target !== 'object' || !Array.isArray(pathParts) || !pathParts.length) return target;
  let cursor = target;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (!cursor[part] || typeof cursor[part] !== 'object') {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[pathParts[pathParts.length - 1]] = nextValue;
  return target;
}

function getDocumentFragmentSectionConfigs(docType) {
  const normalizedDocType = String(docType || '').trim().toLowerCase();
  const detail = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'detail', aliases });
  const prdDetail = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'prd-detail', aliases });
  const prdRisk = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'prd-risk', aliases });
  const changelog = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'changelog', aliases });
  const domainModel = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'domain-model', aliases });
  const domainProjection = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'domain-projection', aliases });
  const functionalFlowVisual = (key, pathParts, aliases = []) => ({ key, path: pathParts, kind: 'functional-flow-visual', aliases });
  const map = {
    prd: [
      prdDetail('functional-requirements-workflows', ['functionalRequirements', 'workflows'], ['workflows', 'functionalrequirements.workflows', 'functional-requirements.workflows', '3.1']),
      prdDetail('functional-requirements-user-actions', ['functionalRequirements', 'userActions'], ['user-actions', 'useractions', 'functionalrequirements.useractions', 'functional-requirements.user-actions', '3.2']),
      prdDetail('functional-requirements-system-behaviors', ['functionalRequirements', 'systemBehaviors'], ['system-behaviors', 'systembehaviors', 'functionalrequirements.systembehaviors', 'functional-requirements.system-behaviors', '3.3']),
      prdDetail('technical-architecture', ['technicalArchitecture'], ['technicalarchitecture', '5']),
      prdDetail('implementation-plan-sequencing', ['implementationPlan', 'sequencing'], ['sequencing', 'implementationplan.sequencing', '6.1']),
      prdDetail('implementation-plan-dependencies', ['implementationPlan', 'dependencies'], ['dependencies', 'implementationplan.dependencies', '6.2']),
      prdDetail('implementation-plan-milestones', ['implementationPlan', 'milestones'], ['milestones', 'implementationplan.milestones', '6.3']),
      prdDetail('success-metrics', ['successMetrics'], ['successmetrics', '7']),
      prdRisk('risks-and-mitigations', ['risksMitigations'], ['risks', '8']),
      prdDetail('future-enhancements', ['futureEnhancements'], ['futureenhancements', '9']),
    ],
    architecture: [
      detail('tech-stack', ['techStack'], ['techstack']),
      detail('boundaries', ['boundaries']),
      detail('external-dependencies', ['externalDependencies'], ['externaldependencies']),
      detail('sub-architectures', ['subArchitectures'], ['subarchitectures']),
      detail('application-workflows', ['applicationWorkflows'], ['applicationworkflows']),
      detail('architecture-workflows', ['architectureWorkflows'], ['architectureworkflows']),
      detail('module-interactions', ['moduleInteractions'], ['moduleinteractions']),
      detail('cross-cutting-concerns', ['crossCuttingConcerns'], ['crosscuttingconcerns']),
      detail('decisions', ['decisions']),
      detail('constraints', ['constraints']),
      detail('open-questions', ['openQuestions'], ['openquestions']),
    ],
    functional_spec: [
      detail('functional-areas', ['functionalAreas'], ['functionalareas', 'areas', 'functional-area', '2.areas']),
      detail('logical-flows', ['logicalFlows'], ['workflows', 'workflow-updates', 'logicalflowupdates', '2']),
      functionalFlowVisual('flow-visuals', ['flowVisuals'], ['flowvisuals', 'visual-flows', 'flow-graphs', 'flowgraphs', 'nodes-and-connections', '4']),
      detail('flow-endpoints', ['flowEndpoints'], ['flow-endpoints-and-return-points', 'flowendpoints', 'endpoints', '3']),
      detail('user-actions-and-system-responses', ['userActionsAndSystemResponses'], ['user-action-and-system-response-updates', 'useractionsandsystemresponses', '4']),
      detail('validation-rules', ['validationRules'], ['validation', 'validation-and-edge-cases', '5']),
      detail('interface-expectations', ['interfaceExpectations'], ['interface', '6']),
      detail('edge-cases', ['edgeCases'], ['edgecases', '7']),
      detail('open-questions', ['openQuestions'], ['openquestions', '8']),
    ],
    domain_models: [
      domainModel('models', ['models'], ['domain-models', 'domainmodels', 'model-catalog', '3']),
      domainProjection('projections', ['projections'], ['model-projections', 'modelprojections', 'projections', '4']),
      detail('open-questions', ['openQuestions'], ['openquestions', '5']),
    ],
    ai_environment: [
      detail('term-dictionary', ['termDictionary'], ['terms', 'dictionary', 'glossary', 'termdictionary']),
      detail('required-behaviors', ['requiredBehaviors'], ['requiredbehaviors']),
      detail('module-update-rules', ['moduleUpdateRules'], ['moduleupdaterules']),
      detail('data-phrasing-rules', ['dataPhrasingRules'], ['dataphrasingrules']),
      detail('avoid-rules', ['avoidRules'], ['avoidrules']),
      detail('handoff-checklist', ['handoffChecklist'], ['handoffchecklist']),
      detail('open-questions', ['openQuestions'], ['openquestions']),
    ],
    adr: [
      detail('alternatives', ['alternatives']),
      detail('consequences', ['consequences']),
      detail('related-architecture', ['relatedArchitecture'], ['relatedarchitecture']),
      detail('related-modules', ['relatedModules'], ['relatedmodules']),
      detail('open-questions', ['openQuestions'], ['openquestions']),
    ],
    changelog: [
      changelog('entries', ['entries']),
      detail('open-questions', ['openQuestions'], ['openquestions']),
    ],
  };
  return map[normalizedDocType] || [];
}

function resolveDocumentFragmentSectionConfig(docType, requestedKey) {
  const normalizedRequestedKey = String(requestedKey || '').trim().toLowerCase();
  if (!normalizedRequestedKey) return null;
  return getDocumentFragmentSectionConfigs(docType).find((config) => (
    config.key === normalizedRequestedKey
    || config.path.join('.').toLowerCase() === normalizedRequestedKey
    || config.aliases.includes(normalizedRequestedKey)
  )) || null;
}

function buildOperationItemValue(docType, sectionConfig, operation, currentItem = null, index = 0, options = {}) {
  const baseSourceRefs = currentItem && currentItem.sourceRefs !== undefined
    ? currentItem.sourceRefs
    : options.defaultSourceRefs;
  const nextSourceRefs = operation.sourceRefs.length
    ? normalizeSourceRefs([...(normalizeSourceRefs(baseSourceRefs)), ...operation.sourceRefs])
    : normalizeSourceRefs(baseSourceRefs);
  const versionDate = operation.versionDate || operation.changeDate || currentItem?.versionDate || options.defaultVersionDate || new Date().toISOString();
  const payload = operation.item && typeof operation.item === 'object' ? operation.item : {};

  if (sectionConfig.kind === 'changelog') {
    const merged = {
      ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
      ...payload,
      id: payload.id || currentItem?.id || '',
      stableId: operation.targetItemId || payload.stableId || currentItem?.stableId || '',
      changeDate: operation.changeDate || payload.changeDate || currentItem?.changeDate || versionDate,
      workItemCodes: operation.workItemCodes !== undefined
        ? String(operation.workItemCodes || '').trim()
        : (payload.workItemCodes !== undefined
          ? String(payload.workItemCodes || '').trim()
          : String(currentItem?.workItemCodes || nextSourceRefs.join(', ')).trim()),
      operation: operation.operation === 'link' || operation.operation === 'unlink'
        ? (currentItem?.operation || 'update')
        : (payload.operation || currentItem?.operation || operation.operation || 'update'),
      targetDoc: operation.targetDoc !== undefined ? operation.targetDoc : (payload.targetDoc !== undefined ? payload.targetDoc : currentItem?.targetDoc),
      targetSectionNumber: operation.targetSectionNumber !== undefined ? operation.targetSectionNumber : (payload.targetSectionNumber !== undefined ? payload.targetSectionNumber : currentItem?.targetSectionNumber),
      targetItemId: operation.targetItemId || payload.targetItemId || currentItem?.targetItemId || '',
      fragmentCode: operation.fragmentCode !== undefined ? operation.fragmentCode : (payload.fragmentCode !== undefined ? payload.fragmentCode : currentItem?.fragmentCode),
      summary: operation.summary !== undefined ? operation.summary : (payload.summary !== undefined ? payload.summary : currentItem?.summary),
      versionDate,
      sourceRefs: nextSourceRefs,
    };
    return createChangelogEntry(merged, index);
  }

  if (sectionConfig.kind === 'prd-risk') {
    return {
      ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
      ...payload,
      stableId: operation.targetItemId || payload.stableId || currentItem?.stableId || '',
      risk: operation.risk !== undefined ? operation.risk : (payload.risk !== undefined ? payload.risk : currentItem?.risk),
      mitigation: operation.mitigation !== undefined ? operation.mitigation : (payload.mitigation !== undefined ? payload.mitigation : currentItem?.mitigation),
      versionDate,
      sourceRefs: nextSourceRefs,
    };
  }

  if (sectionConfig.kind === 'prd-detail') {
    return {
      ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
      ...payload,
      stableId: operation.targetItemId || payload.stableId || currentItem?.stableId || '',
      title: operation.title !== undefined ? operation.title : (payload.title !== undefined ? payload.title : currentItem?.title),
      description: operation.description !== undefined ? operation.description : (payload.description !== undefined ? payload.description : currentItem?.description),
      versionDate,
      sourceRefs: nextSourceRefs,
    };
  }

  if (sectionConfig.kind === 'domain-model') {
    return createDomainModelEntry({
      ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
      ...payload,
      stableId: operation.targetItemId || payload.stableId || currentItem?.stableId || '',
      name: operation.name !== undefined ? operation.name : (payload.name !== undefined ? payload.name : currentItem?.name),
      title: operation.title !== undefined ? operation.title : (payload.title !== undefined ? payload.title : currentItem?.title),
      summary: operation.summary !== undefined ? operation.summary : (payload.summary !== undefined ? payload.summary : currentItem?.summary),
      description: operation.description !== undefined ? operation.description : (payload.description !== undefined ? payload.description : currentItem?.description),
      versionDate,
      sourceRefs: nextSourceRefs,
    }, index);
  }

  if (sectionConfig.kind === 'domain-projection') {
    return createDomainModelProjectionEntry({
      ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
      ...payload,
      stableId: operation.targetItemId || payload.stableId || currentItem?.stableId || '',
      name: operation.name !== undefined ? operation.name : (payload.name !== undefined ? payload.name : currentItem?.name),
      title: operation.title !== undefined ? operation.title : (payload.title !== undefined ? payload.title : currentItem?.title),
      description: operation.description !== undefined ? operation.description : (payload.description !== undefined ? payload.description : currentItem?.description),
      versionDate,
      sourceRefs: nextSourceRefs,
    }, index);
  }

  if (sectionConfig.kind === 'functional-flow-visual') {
    return {
      ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
      ...payload,
      id: operation.targetItemId || payload.id || currentItem?.id || '',
      flowId: payload.flowId || operation.targetItemId || currentItem?.flowId || '',
      flowStableId: payload.flowStableId || currentItem?.flowStableId || '',
      versionDate,
      nodes: Array.isArray(payload.nodes) ? payload.nodes : (Array.isArray(currentItem?.nodes) ? currentItem.nodes : []),
      edges: Array.isArray(payload.edges) ? payload.edges : (Array.isArray(currentItem?.edges) ? currentItem.edges : []),
      sourceRefs: nextSourceRefs,
    };
  }

  return createModuleDetailEntry({
    ...(currentItem && typeof currentItem === 'object' ? currentItem : {}),
    ...payload,
    stableId: operation.targetItemId || payload.stableId || currentItem?.stableId || '',
    title: operation.title !== undefined ? operation.title : (payload.title !== undefined ? payload.title : currentItem?.title),
    description: operation.description !== undefined ? operation.description : (payload.description !== undefined ? payload.description : currentItem?.description),
    versionDate,
    sourceRefs: nextSourceRefs,
  });
}

function findDocumentItemLocation(docType, state, targetItemId, preferredSection = '') {
  if (!targetItemId) return null;
  const preferredConfig = resolveDocumentFragmentSectionConfig(docType, preferredSection);
  const configs = [
    ...(preferredConfig ? [preferredConfig] : []),
    ...getDocumentFragmentSectionConfigs(docType).filter((config) => config !== preferredConfig),
  ];
  for (const config of configs) {
    const list = Array.isArray(getValueAtPath(state, config.path)) ? getValueAtPath(state, config.path) : [];
    const index = list.findIndex((item) => String(item?.stableId || item?.targetItemId || item?.id || '').trim() === targetItemId);
    if (index >= 0) {
      return {
        config,
        index,
        list,
        item: list[index],
      };
    }
  }
  return null;
}

function insertDocumentListItem(list, item, operation) {
  const nextList = Array.isArray(list) ? list.slice() : [];
  if (operation.beforeItemId) {
    const targetIndex = nextList.findIndex((entry) => String(entry?.stableId || entry?.targetItemId || entry?.id || '').trim() === operation.beforeItemId);
    if (targetIndex >= 0) {
      nextList.splice(targetIndex, 0, item);
      return nextList;
    }
  }
  if (operation.afterItemId) {
    const targetIndex = nextList.findIndex((entry) => String(entry?.stableId || entry?.targetItemId || entry?.id || '').trim() === operation.afterItemId);
    if (targetIndex >= 0) {
      nextList.splice(targetIndex + 1, 0, item);
      return nextList;
    }
  }
  nextList.push(item);
  return nextList;
}

function applyDocumentFragmentOperations(project, docType, editorState, operations, options = {}) {
  const normalizedDocType = String(docType || '').trim().toLowerCase();
  const normalizedOperations = Array.isArray(operations)
    ? operations.map((operation, index) => normalizeFragmentOperation(operation, index, {
        versionDate: options.defaultVersionDate,
        sourceRefs: options.defaultSourceRefs,
      })).filter((operation) => operation.operation)
    : [];
  if (!normalizedOperations.length) return normalizeDocumentEditorStateForStorage(project, normalizedDocType, editorState);

  let nextState = normalizeDocumentEditorStateForStorage(project, normalizedDocType, editorState);

  for (const operation of normalizedOperations) {
    const targetConfig = resolveDocumentFragmentSectionConfig(normalizedDocType, operation.targetSection);
    const fromConfig = resolveDocumentFragmentSectionConfig(normalizedDocType, operation.fromSection) || targetConfig;

    if (operation.operation === 'add') {
      if (!targetConfig) continue;
      const list = Array.isArray(getValueAtPath(nextState, targetConfig.path)) ? getValueAtPath(nextState, targetConfig.path) : [];
      const item = buildOperationItemValue(normalizedDocType, targetConfig, operation, null, list.length, options);
      setValueAtPath(nextState, targetConfig.path, insertDocumentListItem(list, item, operation));
      continue;
    }

    if (operation.operation === 'update') {
      const location = findDocumentItemLocation(normalizedDocType, nextState, operation.targetItemId, operation.targetSection);
      if (!location) continue;
      const nextList = location.list.slice();
      nextList[location.index] = buildOperationItemValue(normalizedDocType, location.config, operation, location.item, location.index, options);
      setValueAtPath(nextState, location.config.path, nextList);
      continue;
    }

    if (operation.operation === 'remove') {
      const location = findDocumentItemLocation(normalizedDocType, nextState, operation.targetItemId, operation.targetSection);
      if (!location) continue;
      setValueAtPath(
        nextState,
        location.config.path,
        location.list.filter((_, index) => index !== location.index)
      );
      continue;
    }

    if (operation.operation === 'move') {
      const location = findDocumentItemLocation(normalizedDocType, nextState, operation.targetItemId, operation.fromSection || operation.targetSection);
      if (!location || !targetConfig) continue;
      const sourceList = location.list.filter((_, index) => index !== location.index);
      setValueAtPath(nextState, location.config.path, sourceList);
      const targetList = Array.isArray(getValueAtPath(nextState, targetConfig.path)) ? getValueAtPath(nextState, targetConfig.path) : [];
      const movedItem = buildOperationItemValue(normalizedDocType, targetConfig, operation, location.item, targetList.length, options);
      setValueAtPath(nextState, targetConfig.path, insertDocumentListItem(targetList, movedItem, operation));
      continue;
    }

    if (operation.operation === 'reorder') {
      const location = findDocumentItemLocation(normalizedDocType, nextState, operation.targetItemId, operation.targetSection);
      const config = location?.config || targetConfig;
      if (!config) continue;
      const list = Array.isArray(getValueAtPath(nextState, config.path)) ? getValueAtPath(nextState, config.path) : [];
      if (operation.orderedIds.length) {
        const orderMap = new Map(operation.orderedIds.map((id, index) => [id, index]));
        const ordered = list.slice().sort((left, right) => {
          const leftIndex = orderMap.has(left?.stableId) ? orderMap.get(left.stableId) : Number.MAX_SAFE_INTEGER;
          const rightIndex = orderMap.has(right?.stableId) ? orderMap.get(right.stableId) : Number.MAX_SAFE_INTEGER;
          if (leftIndex === rightIndex) return 0;
          return leftIndex - rightIndex;
        });
        setValueAtPath(nextState, config.path, ordered);
        continue;
      }
      if (!location) continue;
      const reordered = location.list.filter((_, index) => index !== location.index);
      const movedItem = location.item;
      setValueAtPath(nextState, config.path, insertDocumentListItem(reordered, movedItem, operation));
      continue;
    }

    if (operation.operation === 'link' || operation.operation === 'unlink') {
      const location = findDocumentItemLocation(normalizedDocType, nextState, operation.targetItemId, operation.targetSection);
      if (!location) continue;
      const nextList = location.list.slice();
      if (location.config.kind === 'changelog') {
        const currentRefs = normalizeSourceRefs(location.item?.workItemCodes || location.item?.sourceRefs);
        const nextRefs = operation.operation === 'link'
          ? normalizeSourceRefs([...currentRefs, ...operation.sourceRefs])
          : currentRefs.filter((ref) => !operation.sourceRefs.includes(ref));
        nextList[location.index] = buildOperationItemValue(normalizedDocType, location.config, {
          ...operation,
          workItemCodes: nextRefs.join(', '),
          sourceRefs: nextRefs,
        }, location.item, location.index, options);
      } else {
        const currentRefs = normalizeSourceRefs(location.item?.sourceRefs);
        const nextRefs = operation.operation === 'link'
          ? normalizeSourceRefs([...currentRefs, ...operation.sourceRefs])
          : currentRefs.filter((ref) => !operation.sourceRefs.includes(ref));
        nextList[location.index] = buildOperationItemValue(normalizedDocType, location.config, {
          ...operation,
          sourceRefs: nextRefs,
        }, { ...location.item, sourceRefs: nextRefs }, location.index, options);
      }
      setValueAtPath(nextState, location.config.path, nextList);
    }
  }

  return normalizeDocumentEditorStateForStorage(project, normalizedDocType, nextState);
}

function renderChangelogEntries(items) {
  const normalized = normalizeChangelogEntries(items);
  if (!normalized.length) return ['No change entries yet.', ''];
  return normalized.flatMap((item, index) => {
    const itemNumber = `2.${index + 1}`;
    const heading = item.workItemCodes || item.targetItemId || 'Change entry';
    const lines = [
      ...renderDocumentItemMetadataComment(item),
      `### ${itemNumber} ${heading}`,
    ];
    const metadata = [
      item.changeDate ? `- Change Date: ${formatPrdDate(item.changeDate)}` : null,
      item.operation ? `- Operation: ${item.operation}` : null,
      item.targetDoc ? `- Target Document: ${item.targetDoc}` : null,
      item.targetSectionNumber ? `- Target Section: ${item.targetSectionNumber}` : null,
      item.targetItemId ? `- Target Item ID: ${item.targetItemId}` : null,
      item.fragmentCode ? `- Fragment Code: ${item.fragmentCode}` : null,
      item.versionDate ? `- Version Date: ${formatPrdDate(item.versionDate)}` : null,
    ].filter(Boolean);
    if (metadata.length) lines.push('', ...metadata);
    if (item.summary) lines.push('', item.summary);
    lines.push('');
    return lines;
  });
}

function createArchitectureComponentEntry(value = {}, index = 0) {
  const title = value && typeof value.title === 'string' ? value.title : '';
  const normalizedId = value && typeof value.id === 'string' && value.id.trim()
    ? value.id.trim()
    : `arch-component-${index}-${String(title || 'component').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'node'}`;
  const position = value && value.position && typeof value.position === 'object'
    ? {
        x: Number.isFinite(Number(value.position.x)) ? Number(value.position.x) : (index % 3) * 320,
        y: Number.isFinite(Number(value.position.y)) ? Number(value.position.y) : Math.floor(index / 3) * 220,
      }
    : {
        x: (index % 3) * 320,
        y: Math.floor(index / 3) * 220,
      };
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: normalizedId,
    stableId: value && typeof value.stableId === 'string' && value.stableId.trim()
      ? value.stableId.trim()
      : buildDocumentItemStableId('architecture', 'component', value || {}, index, [title, value && value.description]),
    title,
    description: value && typeof value.description === 'string' ? value.description : '',
    kind: value && typeof value.kind === 'string' ? value.kind : '',
    position,
    versionDate: value && typeof value.versionDate === 'string' ? value.versionDate : '',
    sourceRefs: normalizeSourceRefs(value && value.sourceRefs),
  };
}

function normalizeArchitectureComponentList(items) {
  return Array.isArray(items)
    ? items
      .map((item, index) => createArchitectureComponentEntry(item, index))
      .filter((item) => item.title || item.description || item.kind)
    : [];
}

function renderModuleDetailList(items, emptyLabel, sectionNumber = '') {
  const normalized = normalizeModuleDetailList(items, {
    sectionKey: sectionNumber || 'detail',
  });
  if (!normalized.length) return [emptyLabel || 'No entries defined yet.'];
  return normalized.flatMap((item, index) => {
    const itemNumber = sectionNumber ? `${sectionNumber}.${index + 1}` : `${index + 1}`;
    const lines = [
      ...renderDocumentItemMetadataComment(item),
      `### ${itemNumber}${item.title ? ` ${item.title}` : ''}`,
    ];
    if (item.description) lines.push('', item.description);
    if (Array.isArray(item.pathHints) && item.pathHints.length) {
      lines.push('', 'Paths:');
      item.pathHints.forEach((hint) => {
        if (hint?.label && hint?.path) lines.push(`- ${hint.label}: \`${hint.path}\``);
      });
    }
    if (item.versionDate) lines.push('', `- Version Date: ${formatPrdDate(item.versionDate)}`);
    lines.push('');
    return lines;
  });
}

function createArchitectureConnectionEntry(value = {}) {
  return {
    ...(value && typeof value === 'object' ? value : {}),
    id: value && typeof value.id === 'string' ? value.id : '',
    stableId: value && typeof value.stableId === 'string' ? value.stableId : '',
    source: value && typeof value.source === 'string' ? value.source : '',
    target: value && typeof value.target === 'string' ? value.target : '',
    sourceId: value && typeof value.sourceId === 'string' ? value.sourceId : '',
    targetId: value && typeof value.targetId === 'string' ? value.targetId : '',
    label: value && typeof value.label === 'string' ? value.label : '',
    versionDate: value && typeof value.versionDate === 'string' ? value.versionDate : '',
    sourceRefs: normalizeSourceRefs(value && value.sourceRefs),
  };
}

function normalizeArchitectureConnectionList(items) {
  return Array.isArray(items)
    ? items
      .map((item, index) => {
        const entry = createArchitectureConnectionEntry(item);
        return {
          ...entry,
          stableId: buildDocumentItemStableId('architecture', 'connection', entry, index, [
            entry.source,
            entry.target,
            entry.label,
          ]),
        };
      })
      .filter((item) => item.source || item.target || item.label)
    : [];
}

function renderArchitectureConnectionList(items, emptyLabel, sectionNumber = '') {
  const normalized = normalizeArchitectureConnectionList(items);
  if (!normalized.length) return [emptyLabel || 'No component connections defined yet.'];
  return normalized.flatMap((item, index) => {
    const title = `${item.source || 'Unknown source'} -> ${item.target || 'Unknown target'}${item.label ? ` (${item.label})` : ''}`;
    const itemNumber = sectionNumber ? `${sectionNumber}.${index + 1}` : `${index + 1}`;
    const lines = [
      ...renderDocumentItemMetadataComment(item),
      `### ${itemNumber} ${title}`,
    ];
    if (item.versionDate) lines.push('', `- Version Date: ${formatPrdDate(item.versionDate)}`);
    lines.push('');
    return lines;
  });
}

function buildArchitectureGeneratedMermaid(project, editorState = null) {
  const state = normalizeArchitectureEditorState(project, editorState);
  const components = normalizeArchitectureComponentList(state.components);
  const componentById = new Map(components.map((component) => [component.id, component]));
  const nodes = new Map();
  const lines = ['flowchart TD'];
  const addNode = (label, fallbackIdPrefix = 'node') => {
    const trimmed = String(label || '').trim();
    if (!trimmed) return null;
    if (!nodes.has(trimmed)) {
      const nodeId = `${fallbackIdPrefix}_${toMermaidNodeId(trimmed)}`;
      nodes.set(trimmed, nodeId);
      lines.push(`  ${nodeId}["${escapeMermaidLabel(trimmed)}"]`);
    }
    return nodes.get(trimmed);
  };

  const systemLabel = (project && project.name) || 'System';
  addNode(systemLabel, 'system');
  for (const component of components) {
    addNode(component.title, 'component');
  }
  for (const dependency of normalizeModuleDetailList(state.externalDependencies)) {
    addNode(dependency.title, 'external');
  }
  for (const subArchitecture of normalizeModuleDetailList(state.subArchitectures)) {
    addNode(subArchitecture.title, 'subarchitecture');
  }
  for (const connection of normalizeArchitectureConnectionList(state.componentConnections)) {
    const sourceLabel = componentById.get(connection.sourceId)?.title || connection.source;
    const targetLabel = componentById.get(connection.targetId)?.title || connection.target;
    const sourceId = addNode(sourceLabel, 'component');
    const targetId = addNode(targetLabel, 'component');
    if (!sourceId || !targetId) continue;
    lines.push(`  ${sourceId} -->|${escapeMermaidLabel(connection.label || 'flows to')}| ${targetId}`);
  }

  if (lines.length === 1) {
    const systemId = addNode(systemLabel, 'system');
    const usersId = addNode('Users', 'actor');
    if (usersId && systemId) lines.push(`  ${usersId} --> ${systemId}`);
  }
  return [...new Set(lines)].join('\n');
}

function defaultArchitectureEditorState(project) {
  const now = new Date().toISOString();
  return {
    overview: {
      systemPurpose: '',
      architecturalVision: '',
      architecturalStyle: '',
      versionDate: now,
    },
    structure: {
      primaryArchitecture: project?.name || '',
      architectureType: 'application',
      architectureScope: 'single_application',
      systemContext: '',
      versionDate: now,
    },
    techStack: [],
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
      sourceOfTruth: '',
      syncExpectations: '',
      versionDate: now,
    },
    crossCuttingConcerns: [],
    decisions: [],
    constraints: [],
    deployment: {
      runtimeTopology: '',
      environmentNotes: '',
      versionDate: now,
    },
    openQuestions: [],
    fragmentHistory: [],
  };
}

function normalizeArchitectureEditorState(project, editorState) {
  const defaults = defaultArchitectureEditorState(project);
  const state = editorState && typeof editorState === 'object' ? editorState : {};
  return {
    ...defaults,
    ...state,
    overview: {
      ...defaults.overview,
      ...(state.overview || {}),
      itemIds: {
        systemPurpose: buildScalarDocumentItemId('architecture', 'overview-system-purpose', {
          stableId: state.overview?.itemIds?.systemPurpose,
          title: 'System Purpose',
        }),
        architecturalVision: buildScalarDocumentItemId('architecture', 'overview-architectural-vision', {
          stableId: state.overview?.itemIds?.architecturalVision,
          title: 'Architectural Vision',
        }),
        architecturalStyle: buildScalarDocumentItemId('architecture', 'overview-architectural-style', {
          stableId: state.overview?.itemIds?.architecturalStyle,
          title: 'Architectural Style',
        }),
      },
      itemSourceRefs: normalizeScalarItemSourceRefsMap(state.overview?.itemSourceRefs, ['systemPurpose', 'architecturalVision', 'architecturalStyle']),
    },
    structure: {
      ...defaults.structure,
      ...(state.structure || {}),
      itemIds: {
        primaryArchitecture: buildScalarDocumentItemId('architecture', 'structure-primary-architecture', {
          stableId: state.structure?.itemIds?.primaryArchitecture,
          title: 'Primary Architecture',
        }),
        architectureType: buildScalarDocumentItemId('architecture', 'structure-architecture-type', {
          stableId: state.structure?.itemIds?.architectureType,
          title: 'Architecture Type',
        }),
        architectureScope: buildScalarDocumentItemId('architecture', 'structure-architecture-scope', {
          stableId: state.structure?.itemIds?.architectureScope,
          title: 'Architecture Scope',
        }),
        systemContext: buildScalarDocumentItemId('architecture', 'structure-system-context', {
          stableId: state.structure?.itemIds?.systemContext,
          title: 'System Context',
        }),
      },
      itemSourceRefs: normalizeScalarItemSourceRefsMap(state.structure?.itemSourceRefs, ['primaryArchitecture', 'architectureType', 'architectureScope', 'systemContext']),
    },
    techStack: normalizeModuleDetailList(state.techStack, { docType: 'architecture', sectionKey: 'tech-stack' }),
    components: normalizeArchitectureComponentList(state.components),
    componentConnections: normalizeArchitectureConnectionList(state.componentConnections),
    boundaries: normalizeModuleDetailList(state.boundaries, { docType: 'architecture', sectionKey: 'boundaries' }),
    externalDependencies: normalizeModuleDetailList(state.externalDependencies || state.integrations, { docType: 'architecture', sectionKey: 'external-dependencies' }),
    subArchitectures: normalizeModuleDetailList(state.subArchitectures, { docType: 'architecture', sectionKey: 'sub-architectures' }),
    applicationWorkflows: normalizeModuleDetailList(state.applicationWorkflows || state.runtimeScenarios, { docType: 'architecture', sectionKey: 'application-workflows' }),
    architectureWorkflows: normalizeModuleDetailList(state.architectureWorkflows, { docType: 'architecture', sectionKey: 'architecture-workflows' }),
    moduleInteractions: normalizeModuleDetailList(state.moduleInteractions, { docType: 'architecture', sectionKey: 'module-interactions' }),
    persistenceStrategy: {
      ...defaults.persistenceStrategy,
      ...(state.persistenceStrategy || {}),
      itemIds: {
        summary: buildScalarDocumentItemId('architecture', 'persistence-strategy-summary', {
          stableId: state.persistenceStrategy?.itemIds?.summary,
          title: 'Persistence Strategy',
        }),
        sourceOfTruth: buildScalarDocumentItemId('architecture', 'persistence-strategy-source-of-truth', {
          stableId: state.persistenceStrategy?.itemIds?.sourceOfTruth,
          title: 'Persistence Source of Truth',
        }),
        syncExpectations: buildScalarDocumentItemId('architecture', 'persistence-strategy-sync-expectations', {
          stableId: state.persistenceStrategy?.itemIds?.syncExpectations,
          title: 'Persistence Sync Expectations',
        }),
      },
      itemSourceRefs: normalizeScalarItemSourceRefsMap(state.persistenceStrategy?.itemSourceRefs, ['summary', 'sourceOfTruth', 'syncExpectations']),
    },
    crossCuttingConcerns: normalizeModuleDetailList(state.crossCuttingConcerns || state.operationalConcerns, { docType: 'architecture', sectionKey: 'cross-cutting-concerns' }),
    decisions: normalizeModuleDetailList(state.decisions, { docType: 'architecture', sectionKey: 'decisions' }),
    constraints: normalizeModuleDetailList(state.constraints, { docType: 'architecture', sectionKey: 'constraints' }),
    deployment: {
      ...defaults.deployment,
      ...(state.deployment || {}),
      itemIds: {
        runtimeTopology: buildScalarDocumentItemId('architecture', 'deployment-runtime-topology', {
          stableId: state.deployment?.itemIds?.runtimeTopology,
          title: 'Runtime Topology',
        }),
        environmentNotes: buildScalarDocumentItemId('architecture', 'deployment-environment-notes', {
          stableId: state.deployment?.itemIds?.environmentNotes,
          title: 'Environment Notes',
        }),
      },
      itemSourceRefs: normalizeScalarItemSourceRefsMap(state.deployment?.itemSourceRefs, ['runtimeTopology', 'environmentNotes']),
    },
    openQuestions: normalizeModuleDetailList(state.openQuestions, { docType: 'architecture', sectionKey: 'open-questions' }),
    fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
  };
}

function normalizeDocumentEditorStateForStorage(project, docType, editorState) {
  const normalizedDocType = String(docType || '').trim().toLowerCase();

  if (normalizedDocType === 'prd') {
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    const productOverview = state.productOverview && typeof state.productOverview === 'object' ? state.productOverview : {};
    const functionalRequirements = state.functionalRequirements && typeof state.functionalRequirements === 'object' ? state.functionalRequirements : {};
    const nonFunctionalRequirements = state.nonFunctionalRequirements && typeof state.nonFunctionalRequirements === 'object' ? state.nonFunctionalRequirements : {};
    const implementationPlan = state.implementationPlan && typeof state.implementationPlan === 'object' ? state.implementationPlan : {};
    return {
      ...state,
      executiveSummary: {
        text: String(state.executiveSummary?.text || ''),
        versionDate: String(state.executiveSummary?.versionDate || ''),
        stableId: buildDocumentItemStableId('prd', 'executive-summary', { stableId: state.executiveSummary?.stableId, title: 'Executive Summary' }, 0, ['executive summary']),
        sourceRefs: normalizeSourceRefs(state.executiveSummary?.sourceRefs),
      },
      productOverview: {
        productName: String(productOverview.productName || project?.name || ''),
        vision: String(productOverview.vision || ''),
        targetAudiences: (Array.isArray(productOverview.targetAudiences) ? productOverview.targetAudiences : [])
          .map((item, index) => normalizePrdTextEntry(item, { docType: 'prd', sectionKey: 'product-overview-target-audience', index }))
          .filter((item) => item && item.text),
        keyValueProps: (Array.isArray(productOverview.keyValueProps) ? productOverview.keyValueProps : [])
          .map((item, index) => normalizePrdTextEntry(item, { docType: 'prd', sectionKey: 'product-overview-key-value-propositions', index }))
          .filter((item) => item && item.text),
        versionDate: String(productOverview.versionDate || ''),
        itemIds: {
          productName: buildDocumentItemStableId('prd', 'product-overview-product-name', { stableId: productOverview.itemIds?.productName, title: 'Product Name' }, 0, ['product name']),
          vision: buildDocumentItemStableId('prd', 'product-overview-product-vision', { stableId: productOverview.itemIds?.vision, title: 'Product Vision' }, 0, ['product vision']),
        },
        itemSourceRefs: {
          productName: normalizeSourceRefs(productOverview.itemSourceRefs?.productName),
          vision: normalizeSourceRefs(productOverview.itemSourceRefs?.vision),
        },
      },
      functionalRequirements: {
        workflows: (Array.isArray(functionalRequirements.workflows) ? functionalRequirements.workflows : [])
          .map((item, index) => normalizePrdDetailEntry(item, { docType: 'prd', sectionKey: 'functional-requirements-workflows', index }))
          .filter((item) => item && (item.title || item.description)),
        userActions: (Array.isArray(functionalRequirements.userActions) ? functionalRequirements.userActions : [])
          .map((item, index) => normalizePrdDetailEntry(item, { docType: 'prd', sectionKey: 'functional-requirements-user-actions', index }))
          .filter((item) => item && (item.title || item.description)),
        systemBehaviors: (Array.isArray(functionalRequirements.systemBehaviors) ? functionalRequirements.systemBehaviors : [])
          .map((item, index) => normalizePrdDetailEntry(item, { docType: 'prd', sectionKey: 'functional-requirements-system-behaviors', index }))
          .filter((item) => item && (item.title || item.description)),
        versionDate: String(functionalRequirements.versionDate || ''),
      },
      nonFunctionalRequirements: {
        usability: String(nonFunctionalRequirements.usability || ''),
        reliability: String(nonFunctionalRequirements.reliability || ''),
        accessibility: String(nonFunctionalRequirements.accessibility || ''),
        security: String(nonFunctionalRequirements.security || ''),
        performance: String(nonFunctionalRequirements.performance || ''),
        versionDate: String(nonFunctionalRequirements.versionDate || ''),
        itemIds: {
          usability: buildDocumentItemStableId('prd', 'non-functional-requirements-usability', { stableId: nonFunctionalRequirements.itemIds?.usability, title: 'Usability' }, 0, ['usability']),
          reliability: buildDocumentItemStableId('prd', 'non-functional-requirements-reliability', { stableId: nonFunctionalRequirements.itemIds?.reliability, title: 'Reliability' }, 0, ['reliability']),
          accessibility: buildDocumentItemStableId('prd', 'non-functional-requirements-accessibility', { stableId: nonFunctionalRequirements.itemIds?.accessibility, title: 'Accessibility' }, 0, ['accessibility']),
          security: buildDocumentItemStableId('prd', 'non-functional-requirements-security', { stableId: nonFunctionalRequirements.itemIds?.security, title: 'Security' }, 0, ['security']),
          performance: buildDocumentItemStableId('prd', 'non-functional-requirements-performance', { stableId: nonFunctionalRequirements.itemIds?.performance, title: 'Performance' }, 0, ['performance']),
        },
        itemSourceRefs: {
          usability: normalizeSourceRefs(nonFunctionalRequirements.itemSourceRefs?.usability),
          reliability: normalizeSourceRefs(nonFunctionalRequirements.itemSourceRefs?.reliability),
          accessibility: normalizeSourceRefs(nonFunctionalRequirements.itemSourceRefs?.accessibility),
          security: normalizeSourceRefs(nonFunctionalRequirements.itemSourceRefs?.security),
          performance: normalizeSourceRefs(nonFunctionalRequirements.itemSourceRefs?.performance),
        },
      },
      technicalArchitecture: normalizeModuleDetailList(state.technicalArchitecture, { docType: 'prd', sectionKey: 'technical-architecture' }),
      implementationPlan: {
        sequencing: normalizeModuleDetailList(implementationPlan.sequencing, { docType: 'prd', sectionKey: 'implementation-plan-sequencing' }),
        dependencies: normalizeModuleDetailList(implementationPlan.dependencies, { docType: 'prd', sectionKey: 'implementation-plan-dependencies' }),
        milestones: normalizeModuleDetailList(implementationPlan.milestones, { docType: 'prd', sectionKey: 'implementation-plan-milestones' }),
        versionDate: String(implementationPlan.versionDate || ''),
      },
      successMetrics: normalizeModuleDetailList(state.successMetrics, { docType: 'prd', sectionKey: 'success-metrics' }),
      risksMitigations: (Array.isArray(state.risksMitigations) ? state.risksMitigations : [])
        .map((item, index) => normalizePrdRiskEntry(item, { docType: 'prd', sectionKey: 'risks-and-mitigations', index }))
        .filter((item) => item && (item.risk || item.mitigation)),
      futureEnhancements: normalizeModuleDetailList(state.futureEnhancements, { docType: 'prd', sectionKey: 'future-enhancements' }),
      appliedFragments: Array.isArray(state.appliedFragments) ? state.appliedFragments : [],
      conclusion: String(state.conclusion || ''),
    };
  }

  if (normalizedDocType === 'architecture') {
    return normalizeArchitectureEditorState(project, editorState);
  }

  if (normalizedDocType === 'functional_spec') {
    const defaults = defaultModuleDocumentEditorState(project || { name: 'Project' }, 'functional_spec');
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    const legacyWorkingContentEntries = splitLegacyDocumentTextToDetailEntries(state.workingContent);
    const legacyOpenQuestionEntries = splitLegacyDocumentTextToDetailEntries(state.openQuestions);
    const logicalFlows = normalizeModuleDetailList(
      Array.isArray(state.logicalFlows) && state.logicalFlows.length
        ? state.logicalFlows
        : (Array.isArray(state.workflows) && state.workflows.length ? state.workflows : legacyWorkingContentEntries),
      { docType: 'functional_spec', sectionKey: 'logical-flows' }
    );
    const flowVisuals = normalizeFunctionalSpecFlowVisuals(state.flowVisuals, logicalFlows);
    return {
      ...defaults,
      ...state,
      overview: {
        ...defaults.overview,
        ...(state.overview || {}),
        stableId: buildScalarDocumentItemId('functional_spec', 'overview-summary', {
          stableId: state.overview?.stableId,
          title: 'Executive Summary',
        }),
        sourceRefs: normalizeSourceRefs(state.overview?.sourceRefs),
      },
      functionalAreas: normalizeModuleDetailList(state.functionalAreas, { docType: 'functional_spec', sectionKey: 'functional-areas' }),
      logicalFlows,
      flowVisuals,
      flowEndpoints: normalizeFunctionalSpecFlowEndpoints(state.flowEndpoints || state.endpoints, flowVisuals),
      userActionsAndSystemResponses: normalizeModuleDetailList(state.userActionsAndSystemResponses || state.userActionResponses, { docType: 'functional_spec', sectionKey: 'user-actions-and-system-responses' }),
      validationRules: normalizeModuleDetailList(state.validationRules, { docType: 'functional_spec', sectionKey: 'validation-rules' }),
      interfaceExpectations: normalizeModuleDetailList(state.interfaceExpectations, { docType: 'functional_spec', sectionKey: 'interface-expectations' }),
      edgeCases: normalizeModuleDetailList(state.edgeCases, { docType: 'functional_spec', sectionKey: 'edge-cases' }),
      openQuestions: normalizeModuleDetailList(
        Array.isArray(state.openQuestions) ? state.openQuestions : legacyOpenQuestionEntries,
        { docType: 'functional_spec', sectionKey: 'open-questions' }
      ),
      fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
    };
  }

  if (normalizedDocType === 'domain_models') {
    const defaults = defaultModuleDocumentEditorState(project || { name: 'Project' }, 'domain_models');
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    return {
      ...defaults,
      ...state,
      overview: {
        ...defaults.overview,
        ...(state.overview || {}),
        stableId: buildScalarDocumentItemId('domain_models', 'overview-summary', {
          stableId: state.overview?.stableId,
          title: 'Executive Summary',
        }),
        sourceRefs: normalizeSourceRefs(state.overview?.sourceRefs),
      },
      models: normalizeDomainModelList(state.models),
      projections: normalizeDomainModelProjectionList(state.projections),
      openQuestions: normalizeModuleDetailList(state.openQuestions, { docType: 'domain_models', sectionKey: 'open-questions' }),
      fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
    };
  }

  if (normalizedDocType === 'ai_environment') {
    const defaults = defaultAiEnvironmentEditorState(project || { name: 'Project' });
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    return {
      ...defaults,
      ...state,
      selectedProfileIds: [...new Set((Array.isArray(state.selectedProfileIds) ? state.selectedProfileIds : []).map((value) => String(value || '').trim()).filter(Boolean))],
      disabledDirectiveIds: normalizeDirectiveIdList(state.disabledDirectiveIds),
      overview: {
        ...defaults.overview,
        ...(state.overview || {}),
        itemIds: {
          mission: buildScalarDocumentItemId('ai_environment', 'overview-mission', {
            stableId: state.overview?.itemIds?.mission,
            title: 'Mission',
          }),
          operatingModel: buildScalarDocumentItemId('ai_environment', 'overview-operating-model', {
            stableId: state.overview?.itemIds?.operatingModel,
            title: 'Operating Model',
          }),
          communicationStyle: buildScalarDocumentItemId('ai_environment', 'overview-communication-style', {
            stableId: state.overview?.itemIds?.communicationStyle,
            title: 'Communication Style',
          }),
        },
        itemSourceRefs: normalizeScalarItemSourceRefsMap(state.overview?.itemSourceRefs, ['mission', 'operatingModel', 'communicationStyle']),
      },
      requiredBehaviors: normalizeModuleDetailList(state.requiredBehaviors, { docType: 'ai_environment', sectionKey: 'required-behaviors' }),
      termDictionary: normalizeModuleDetailList(
        Array.isArray(state.termDictionary) ? state.termDictionary : defaults.termDictionary,
        { docType: 'ai_environment', sectionKey: 'term-dictionary' }
      ),
      moduleUpdateRules: normalizeModuleDetailList(state.moduleUpdateRules, { docType: 'ai_environment', sectionKey: 'module-update-rules' }),
      dataPhrasingRules: normalizeModuleDetailList(state.dataPhrasingRules, { docType: 'ai_environment', sectionKey: 'data-phrasing-rules' }),
      avoidRules: normalizeModuleDetailList(state.avoidRules, { docType: 'ai_environment', sectionKey: 'avoid-rules' }),
      handoffChecklist: normalizeModuleDetailList(state.handoffChecklist, { docType: 'ai_environment', sectionKey: 'handoff-checklist' }),
      customInstructions: sanitizeAiEnvironmentCustomInstructions(state.customInstructions),
      customInstructionsMeta: {
        stableId: buildScalarDocumentItemId('ai_environment', 'custom-instructions', {
          stableId: state.customInstructionsMeta?.stableId,
          title: 'Custom Instructions',
        }),
        sourceRefs: normalizeSourceRefs(state.customInstructionsMeta?.sourceRefs),
      },
      fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
    };
  }

  if (normalizedDocType === 'database_schema') {
    const defaults = defaultDatabaseSchemaEditorState(project || { name: 'Project' });
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    return {
      ...defaults,
      ...state,
      overview: {
        ...defaults.overview,
        ...(state.overview || {}),
        itemIds: {
          purpose: buildScalarDocumentItemId('database_schema', 'overview-purpose', {
            stableId: state.overview?.itemIds?.purpose,
            title: 'Schema Purpose',
          }),
          storageStrategy: buildScalarDocumentItemId('database_schema', 'overview-storage-strategy', {
            stableId: state.overview?.itemIds?.storageStrategy,
            title: 'Storage Strategy',
          }),
        },
        itemSourceRefs: normalizeScalarItemSourceRefsMap(state.overview?.itemSourceRefs, ['purpose', 'storageStrategy']),
      },
      importSource: state.importSource || null,
      observedSchemaModel: state.observedSchemaModel || null,
      syncTracking: normalizeDatabaseSchemaSyncTracking(state.syncTracking),
      entities: normalizeModuleDetailList(state.entities, { docType: 'database_schema', sectionKey: 'entities' }),
      relationships: normalizeModuleDetailList(state.relationships, { docType: 'database_schema', sectionKey: 'relationships' }),
      constraints: normalizeModuleDetailList(state.constraints, { docType: 'database_schema', sectionKey: 'constraints' }),
      indexes: normalizeModuleDetailList(state.indexes, { docType: 'database_schema', sectionKey: 'indexes' }),
      migrations: normalizeModuleDetailList(state.migrations, { docType: 'database_schema', sectionKey: 'migrations' }),
      openQuestions: normalizeModuleDetailList(state.openQuestions, { docType: 'database_schema', sectionKey: 'open-questions' }),
      synchronizationRules: normalizeModuleDetailList(state.synchronizationRules, { docType: 'database_schema', sectionKey: 'synchronization-rules' }),
      dbml: String(state.dbml || ''),
      schemaModel: state.schemaModel || null,
      fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
    };
  }

  if (normalizedDocType === 'changelog') {
    const defaults = defaultModuleDocumentEditorState(project || { name: 'Project' }, 'changelog');
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    return {
      ...defaults,
      ...state,
      overview: {
        ...defaults.overview,
        ...(state.overview || {}),
        stableId: buildScalarDocumentItemId('changelog', 'overview-summary', {
          stableId: state.overview?.stableId,
          title: 'Executive Summary',
        }),
        sourceRefs: normalizeSourceRefs(state.overview?.sourceRefs),
      },
      entries: normalizeChangelogEntries(state.entries),
      openQuestions: normalizeModuleDetailList(state.openQuestions, { docType: 'changelog', sectionKey: 'open-questions' }),
      fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
    };
  }

  if (normalizedDocType === 'adr') {
    const defaults = defaultModuleDocumentEditorState(project || { name: 'Project' }, 'adr');
    const state = editorState && typeof editorState === 'object' ? editorState : {};
    return {
      ...defaults,
      ...state,
      overview: {
        ...defaults.overview,
        ...(state.overview || {}),
        stableId: buildScalarDocumentItemId('adr', 'overview-summary', {
          stableId: state.overview?.stableId,
          title: 'Executive Summary',
        }),
        sourceRefs: normalizeSourceRefs(state.overview?.sourceRefs),
      },
      metadata: {
        ...defaults.metadata,
        ...(state.metadata || {}),
        itemIds: {
          decisionTitle: buildScalarDocumentItemId('adr', 'metadata-decision-title', {
            stableId: state.metadata?.itemIds?.decisionTitle,
            title: 'Decision Title',
          }),
          status: buildScalarDocumentItemId('adr', 'metadata-status', {
            stableId: state.metadata?.itemIds?.status,
            title: 'Decision Status',
          }),
          scope: buildScalarDocumentItemId('adr', 'metadata-scope', {
            stableId: state.metadata?.itemIds?.scope,
            title: 'Scope',
          }),
          owners: buildScalarDocumentItemId('adr', 'metadata-owners', {
            stableId: state.metadata?.itemIds?.owners,
            title: 'Owners',
          }),
          decisionDate: buildScalarDocumentItemId('adr', 'metadata-decision-date', {
            stableId: state.metadata?.itemIds?.decisionDate,
            title: 'Decision Date',
          }),
        },
        itemSourceRefs: normalizeScalarItemSourceRefsMap(state.metadata?.itemSourceRefs, ['decisionTitle', 'status', 'scope', 'owners', 'decisionDate']),
      },
      context: String(state.context || ''),
      decision: String(state.decision || ''),
      rationale: String(state.rationale || ''),
      alternatives: normalizeModuleDetailList(state.alternatives, { docType: 'adr', sectionKey: 'alternatives' }),
      consequences: normalizeModuleDetailList(state.consequences, { docType: 'adr', sectionKey: 'consequences' }),
      relatedArchitecture: normalizeModuleDetailList(state.relatedArchitecture, { docType: 'adr', sectionKey: 'related-architecture' }),
      relatedModules: normalizeModuleDetailList(state.relatedModules, { docType: 'adr', sectionKey: 'related-modules' }),
      followUpNotes: String(state.followUpNotes || ''),
      contextMeta: {
        stableId: buildScalarDocumentItemId('adr', 'context', {
          stableId: state.contextMeta?.stableId,
          title: 'Context',
        }),
        sourceRefs: normalizeSourceRefs(state.contextMeta?.sourceRefs),
      },
      decisionMeta: {
        stableId: buildScalarDocumentItemId('adr', 'decision', {
          stableId: state.decisionMeta?.stableId,
          title: 'Decision',
        }),
        sourceRefs: normalizeSourceRefs(state.decisionMeta?.sourceRefs),
      },
      rationaleMeta: {
        stableId: buildScalarDocumentItemId('adr', 'rationale', {
          stableId: state.rationaleMeta?.stableId,
          title: 'Rationale',
        }),
        sourceRefs: normalizeSourceRefs(state.rationaleMeta?.sourceRefs),
      },
      followUpNotesMeta: {
        stableId: buildScalarDocumentItemId('adr', 'follow-up-notes', {
          stableId: state.followUpNotesMeta?.stableId,
          title: 'Follow-Up Notes',
        }),
        sourceRefs: normalizeSourceRefs(state.followUpNotesMeta?.sourceRefs),
      },
      openQuestions: normalizeModuleDetailList(state.openQuestions, { docType: 'adr', sectionKey: 'open-questions' }),
      fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
    };
  }

  const defaults = defaultModuleDocumentEditorState(project || { name: 'Project' }, normalizedDocType || docType);
  const state = editorState && typeof editorState === 'object' ? editorState : {};
  const openQuestions = Array.isArray(state.openQuestions)
    ? normalizeModuleDetailList(state.openQuestions, { docType: normalizedDocType || 'document', sectionKey: 'open-questions' })
    : String(state.openQuestions || '');
  return {
    ...defaults,
    ...state,
    overview: {
      ...defaults.overview,
      ...(state.overview || {}),
      stableId: buildScalarDocumentItemId(normalizedDocType || 'document', 'overview-summary', {
        stableId: state.overview?.stableId,
        title: 'Executive Summary',
      }),
      sourceRefs: normalizeSourceRefs(state.overview?.sourceRefs),
    },
    workingContent: String(state.workingContent || ''),
    workingContentMeta: {
      stableId: buildScalarDocumentItemId(normalizedDocType || 'document', 'working-content', {
        stableId: state.workingContentMeta?.stableId,
        title: 'Working Content',
      }),
      sourceRefs: normalizeSourceRefs(state.workingContentMeta?.sourceRefs),
    },
    openQuestions,
    openQuestionsMeta: Array.isArray(state.openQuestions)
      ? null
      : {
          stableId: buildScalarDocumentItemId(normalizedDocType || 'document', 'open-questions', {
            stableId: state.openQuestionsMeta?.stableId,
            title: 'Open Questions',
          }),
          sourceRefs: normalizeSourceRefs(state.openQuestionsMeta?.sourceRefs),
        },
    fragmentHistory: Array.isArray(state.fragmentHistory) ? state.fragmentHistory : [],
  };
}

function defaultAiEnvironmentEditorState(project) {
  const now = new Date().toISOString();
  return {
    selectedProfileIds: [],
    disabledDirectiveIds: [],
    overview: {
      mission: `Guide AI agents working on ${project.name}.`,
      operatingModel: 'Read the project context first, update the correct modules, and keep generated artifacts consistent with the database-first workflow.',
      communicationStyle: 'Be concise, explicit about assumptions, and preserve traceability between features, bugs, documents, and fragments.',
      versionDate: now,
    },
    requiredBehaviors: [
      {
        title: 'Read project context first',
        description: 'Review Project Brief, Roadmap, and module-specific state before proposing or applying changes.',
        versionDate: now,
      },
    ],
    termDictionary: [
      {
        title: 'APM',
        description: 'Angel\'s Project Manager, the application that manages project state, modules, generated documents, fragments, and AI operating context.',
        versionDate: now,
      },
      {
        title: 'Project',
        description: 'A managed workspace or folder whose planning, software design, documents, fragments, and AI guidance are tracked by APM.',
        versionDate: now,
      },
      {
        title: 'Module',
        description: 'A functional area inside APM, such as PRD, Functional Spec, Domain Models, Database Schema, Architecture, Features, Bugs, or AI Environment.',
        versionDate: now,
      },
      {
        title: 'AI Environment',
        description: 'The project-level operating guide that tells AI agents how to read, update, and preserve context for the current project.',
        versionDate: now,
      },
      {
        title: 'Directive Project',
        description: 'The project selected in Application Settings where APM writes application-level AI directives that are specific to APM itself.',
        versionDate: now,
      },
      {
        title: 'Fragment',
        description: 'A structured proposal file consumed by a module to add, update, remove, or transform managed project data without editing generated documents directly.',
        versionDate: now,
      },
      {
        title: 'Managed Document',
        description: 'A markdown document generated from persisted module state and metadata rather than treated as the primary source of truth.',
        versionDate: now,
      },
      {
        title: 'Stable ID',
        description: 'A persistent human-readable identifier used by documents, fragments, UI nodes, and cross-module references to target the same concept over time.',
        versionDate: now,
      },
      {
        title: 'Work Item Code',
        description: 'A human-readable code such as FEAT-001, BUG-010, or TASK-001 that links document changes to planned work, bugs, or tasks.',
        versionDate: now,
      },
      {
        title: 'Emitted Directive',
        description: 'A directive owned by a module template that is surfaced in the AI Environment index so agents know which module-specific instructions to read.',
        versionDate: now,
      },
    ],
    moduleUpdateRules: [
      {
        title: 'Update adjacent modules when scope changes',
        description: 'If feature or bug work affects product, roadmap, schema, or architecture understanding, update the corresponding module state and fragments.',
        versionDate: now,
      },
    ],
    dataPhrasingRules: [
      {
        title: 'Use structured, deterministic wording',
        description: 'Prefer short titles, explicit descriptions, stable identifiers, and schema-safe phrasing that can be consumed by both humans and automation.',
        versionDate: now,
      },
    ],
    avoidRules: [
      {
        title: 'Do not bypass source of truth',
        description: 'Do not overwrite generated markdown or DBML directly when the module uses database-first state.',
        versionDate: now,
      },
    ],
    handoffChecklist: [
      {
        title: 'Record affected modules',
        description: 'When a bug or feature changes multiple areas, note the affected modules so downstream documents stay aligned.',
        versionDate: now,
      },
    ],
    customInstructions: '',
    fragmentHistory: [],
  };
}

function normalizeDirectiveIdList(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean))];
}

function normalizeAiDirectivePathHints(pathHints) {
  return (Array.isArray(pathHints) ? pathHints : [])
    .map((hint) => {
      if (typeof hint === 'string') {
        return {
          label: 'Path',
          path: String(hint || '').trim(),
        };
      }
      return {
        label: String(hint?.label || 'Path').trim(),
        path: String(hint?.path || '').trim(),
      };
    })
    .filter((hint) => hint.label && hint.path);
}

function normalizeAiDirectiveDefinition(directive, defaults = {}) {
  const normalized = {
    ...defaults,
    ...directive,
    id: String(directive?.id || '').trim(),
    title: String(directive?.title || '').trim(),
    description: String(directive?.description || '').trim(),
    scope: String(directive?.scope || defaults.scope || 'shared'),
    source: String(directive?.source || defaults.source || 'code'),
    moduleKey: String(directive?.moduleKey || defaults.moduleKey || ''),
    locked: directive?.locked !== undefined ? Boolean(directive.locked) : Boolean(defaults.locked),
    required: directive?.required !== undefined ? Boolean(directive.required) : Boolean(defaults.required),
    emitsToAiEnvironment: directive?.emitsToAiEnvironment !== undefined ? Boolean(directive.emitsToAiEnvironment) : Boolean(defaults.emitsToAiEnvironment),
    templateName: String(directive?.templateName || defaults.templateName || ''),
    version: String(directive?.version || defaults.version || '1.0'),
    pathHints: normalizeAiDirectivePathHints(directive?.pathHints !== undefined ? directive.pathHints : defaults.pathHints),
  };
  return normalized.id && normalized.title && normalized.description ? normalized : null;
}

function buildCodeOwnedAiDirectiveDefinitions(project, options = {}) {
  const directives = [];
  const workspaceDir = getProjectWorkspaceDir(project);
  if (workspaceDir) {
    directives.push({
      id: 'apm.shared.workspace.volatile-files',
      title: 'Use the project workspace folder for volatile AI work',
      description: `Use ${workspaceDir} for messy AI work such as TODO lists, draft plans, scratch notes, and temporary working files. Keep the project root and docs folder focused on real project artifacts.`,
      pathHints: [
        { label: 'Project Workspace', path: workspaceDir },
      ],
      locked: true,
      required: false,
      scope: 'shared',
      source: 'code',
    });
  }
  const fragmentsRootDir = options.fragmentsRootDir || getFragmentsRootDir();
  const projectFragmentsDir = options.projectFragmentsDir || getProjectFragmentsDir(project);
  const sharedFragmentsDir = options.sharedFragmentsDir || getSharedFragmentsDir();
  directives.push({
    id: 'apm.shared.fragments.path',
    title: 'Use the configured fragments path',
    description: `Fragments generated for this project must be placed in ${projectFragmentsDir || '[Project Fragments Path]'}. Shared reusable fragments go in ${sharedFragmentsDir || '[Shared Fragments Path]'} only when explicitly intended for reuse across projects. The configured fragments root is ${fragmentsRootDir || '[Fragments Path]'}. Never place fragment files in the project docs folder or a repo-local fallback data folder.`,
    pathHints: [
      { label: 'Project Fragments Path', path: projectFragmentsDir || '[Project Fragments Path]' },
      { label: 'Shared Fragments Path', path: sharedFragmentsDir || '[Shared Fragments Path]' },
      { label: 'Fragments Root', path: fragmentsRootDir || '[Fragments Path]' },
    ],
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.storage.safe-titles',
    title: 'Keep generated stored titles short and storage-safe',
    description: 'When AI generates fragments or any structured data that will be stored, keep titles and other short stored fields as short as the database allows. Prefer concise complete titles over truncated prose, and put longer detail in descriptions or body content.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  const softwareStandardsSourcePath = getSoftwareStandardsRegistrySourcePath();
  const softwareStandardsProjectPath = getProjectSoftwareStandardsRegistryPath(project);
  directives.push({
    id: 'apm.shared.document.standard-verbiage',
    title: 'Use module-standard document wording',
    description: 'When generating or updating managed documents and fragments, use the module template and software standards reference registry to choose industry-standard phrasing. Do not invent casual headings when a module has prescribed vocabulary; keep user-provided freeform content in description or body fields.',
    pathHints: [
      { label: 'Project Software Standards Registry', path: softwareStandardsProjectPath || '[Project Software Standards Registry]' },
      { label: 'Repository Software Standards Registry', path: softwareStandardsSourcePath },
    ],
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.stable-id.naming',
    title: 'Create stable human-readable ids for persisted items',
    description: 'Directive ID: apm.shared.stable-id.naming. When AI creates or updates any persisted item that supports an id, stableId, node id, edge id, document item id, or fragment target id, use a short lowercase kebab-case identifier scoped by module or item type. IDs must identify the concept rather than truncate the description, must remain stable across title or wording edits, and must not be regenerated unless the item is intentionally replaced. Keep database primary keys, work item codes, document stable ids, and UI/canvas ids distinct but cross-referenceable.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.generated-docs.source-of-truth',
    title: 'Do not bypass source-of-truth state',
    description: 'Do not overwrite generated markdown, generated DBML, or generated Mermaid directly when the module uses database-first state. Update the module data, consume a valid fragment, or use the module action that regenerates the artifact.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.fragment-consumers.version-migrators',
    title: 'Fragment consumers must migrate older versions',
    description: 'Fragment consumers must load older fragment payloads through explicit versioned migrators before detection, listing, or consumption so unconsumed fragments remain usable after template changes.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.fragment-discovery.content-aware',
    title: 'Use content-aware fragment discovery',
    description: 'Fragment discovery must check managed metadata and known docType aliases in addition to filename prefixes so older or renamed fragment files can still appear in the UI.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.templates.versioning',
    title: 'Version template changes',
    description: 'When changing a document or fragment template, update Template Version and Last Updated metadata, then ensure project-local template copies can be checked and replaced by the application.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  directives.push({
    id: 'apm.shared.database.migrations-required',
    title: 'Generate migrations for database changes',
    description: 'When work changes database structure or persisted state, add an explicit migration file and update the schema reference through the Database Schema workflow.',
    locked: true,
    required: true,
    scope: 'shared',
    source: 'code',
  });
  const selectedProjectId = String(options.fragmentsDirectiveProjectId || '').trim();
  if (!selectedProjectId || String(project?.id || '') !== selectedProjectId) {
    return directives;
  }
  const runtimeDatabasePath = path.join(config.getDataDir(), 'app.db');
  const projectSpecificDirectives = [
    {
      id: 'apm.application.runtime-db.source-of-truth',
      title: 'Treat the live runtime SQLite database as the source of truth for Angel\'s Project Manager',
      description: `For Angel's Project Manager, the live runtime SQLite database at ${runtimeDatabasePath} is the source of truth for project and module state. Generated docs, DBML, and fragments are derived artifacts and should be treated as outputs, proposals, or exchange files unless explicitly stated otherwise.`,
      pathHints: [
        { label: 'Runtime SQLite Database', path: runtimeDatabasePath },
      ],
      locked: true,
      required: true,
      scope: 'application',
      source: 'code',
      directiveProjectOnly: true,
    },
    {
      id: 'apm.application.directive-project',
      title: 'Application directives are emitted to the configured Directive Project',
      description: 'APM application-level directives apply to Angel\'s Project Manager itself and are written only to the project selected in Application Settings -> Projects -> Directive Project.',
      locked: true,
      required: true,
      scope: 'application',
      source: 'code',
      directiveProjectOnly: true,
    },
  ];
  if (options.shutdownLockedAppBeforeBuildDirectiveEnabled) {
    projectSpecificDirectives.push({
      id: 'apm.application.shutdown-before-build',
      title: 'Shut down locked running application processes before rebuilds',
      description: 'Before rebuilding or packaging Angel\'s Project Manager, check whether a running APM, Electron, or packaged application process is locking build output. If it is, shut the application down gracefully before building; only force termination when the process will not exit and the build is blocked.',
      locked: true,
      required: false,
      scope: 'application',
      source: 'code',
      directiveProjectOnly: true,
    });
  }
  directives.push(...projectSpecificDirectives);
  return directives;
}

function buildModuleAiDirectiveDefinitions(options = {}) {
  const projectId = String(options?.project?.id || options?.projectId || '[project-id]');
  const enabledModuleKeys = new Set((Array.isArray(options.enabledModuleKeys) ? options.enabledModuleKeys : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean));
  return AI_MODULE_DIRECTIVE_DEFINITIONS
    .filter((directive) => !enabledModuleKeys.size || enabledModuleKeys.has(directive.moduleKey))
    .map((directive) => {
      const templateName = DOC_TYPES[directive.moduleKey]?.templateName || FRAGMENT_TEMPLATE_NAMES[directive.moduleKey] || '';
      return normalizeAiDirectiveDefinition({
        ...directive,
        scope: 'module',
        source: 'template',
        locked: directive.locked !== undefined ? directive.locked : true,
        required: directive.required !== undefined ? directive.required : true,
        templateName,
        pathHints: templateName
          ? [
              { label: 'Project Template Copy', path: `data/projects/${projectId}/templates/${templateName}` },
              { label: 'Repository Template Source', path: path.join(TEMPLATE_DIR, templateName) },
            ]
          : [],
      });
    })
    .filter(Boolean);
}

function buildAiDirectiveRegistry(project, options = {}) {
  const disabledDirectiveIds = new Set(normalizeDirectiveIdList(options.disabledDirectiveIds));
  const codeDirectives = buildCodeOwnedAiDirectiveDefinitions(project, options)
    .map((directive) => normalizeAiDirectiveDefinition(directive, { source: 'code', locked: true }))
    .filter(Boolean);
  const moduleDirectives = buildModuleAiDirectiveDefinitions({ ...options, project });
  const directives = [...codeDirectives, ...moduleDirectives].map((directive) => {
    const enabled = directive.required ? true : !disabledDirectiveIds.has(directive.id);
    return {
      ...directive,
      enabled,
      disabled: !enabled,
      moduleLabel: directive.moduleKey ? (AI_DIRECTIVE_MODULE_LABELS[directive.moduleKey] || directive.moduleKey) : '',
    };
  });
  return {
    directives,
    disabledDirectiveIds: [...disabledDirectiveIds],
    applicationDirectives: directives.filter((directive) => directive.scope === 'application'),
    sharedDirectives: directives.filter((directive) => directive.scope === 'shared'),
    moduleDirectives: directives.filter((directive) => directive.scope === 'module'),
    emittedModuleDirectives: directives.filter((directive) => directive.scope === 'module' && directive.emitsToAiEnvironment),
    enabledDirectives: directives.filter((directive) => directive.enabled),
    disabledDirectives: directives.filter((directive) => !directive.enabled),
  };
}

function normalizeDirectiveTitleKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function filterEditorStateDirectiveDetails(details, registry) {
  const registryTitles = new Set((registry?.directives || []).flatMap((directive) => [
    normalizeDirectiveTitleKey(directive.title),
    normalizeDirectiveTitleKey(directive.id),
  ]));
  [
    'record document impacting changes in the change log with stable target references',
    'do not bypass source of truth',
    'fragments generated should use the configured fragments path',
    'fragment consumers migrate older versions',
    'version template changes',
    'template registry requires migration',
    'functional spec actions must be readable',
    'use content aware fragment discovery',
    'use module standard document wording',
    'generate regression tests for bug fixes',
    'shut down locked running application processes before rebuilds',
    'create adr records when architectural decisions are made',
    'create destination fragments after implementation',
    'treat features as the planning register',
    'read roadmap and active work item codes before scope changes',
  ].forEach((title) => registryTitles.add(normalizeDirectiveTitleKey(title)));
  return (Array.isArray(details) ? details : []).filter((detail) => {
    const titleKey = normalizeDirectiveTitleKey(detail?.title);
    const stableIdKey = normalizeDirectiveTitleKey(detail?.stableId);
    return titleKey && !registryTitles.has(titleKey) && !registryTitles.has(stableIdKey);
  });
}

function getImmutableAiDirectives(project, options = {}) {
  return buildAiDirectiveRegistry(project, options).enabledDirectives
    .filter((directive) => directive.locked)
    .map((directive) => ({
      id: directive.id,
      title: directive.title,
      description: directive.description,
      locked: directive.locked,
      required: directive.required,
      scope: directive.scope,
      source: directive.source,
      moduleKey: directive.moduleKey,
      templateName: directive.templateName,
      pathHints: directive.pathHints,
    }));
}

function groupAiDirectivesByModule(directives) {
  const groups = [];
  const byKey = new Map();
  (Array.isArray(directives) ? directives : []).forEach((directive) => {
    const moduleKey = String(directive?.moduleKey || 'module').trim() || 'module';
    if (!byKey.has(moduleKey)) {
      const group = {
        moduleKey,
        moduleLabel: directive?.moduleLabel || AI_DIRECTIVE_MODULE_LABELS[moduleKey] || moduleKey,
        templateName: directive?.templateName || '',
        directives: [],
      };
      byKey.set(moduleKey, group);
      groups.push(group);
    }
    const group = byKey.get(moduleKey);
    if (!group.templateName && directive?.templateName) group.templateName = directive.templateName;
    group.directives.push(directive);
  });
  return groups;
}

function escapeMarkdownTableCell(value) {
  return String(value || '')
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
    .trim();
}

function renderAiEnvironmentTermDictionaryTable(entries) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  if (!normalizedEntries.length) return ['No APM terms are currently defined.', ''];
  return [
    '| Term | Definition | Stable ID | Source Refs |',
    '| --- | --- | --- | --- |',
    ...normalizedEntries.map((entry) => {
      const sourceRefs = normalizeSourceRefs(entry?.sourceRefs).join(', ');
      return [
        escapeMarkdownTableCell(entry?.title || 'Untitled term'),
        escapeMarkdownTableCell(entry?.description || ''),
        escapeMarkdownTableCell(entry?.stableId || ''),
        escapeMarkdownTableCell(sourceRefs),
      ].join(' | ');
    }).map((row) => `| ${row} |`),
    '',
  ];
}

function renderAiEnvironmentDirectiveTemplateReferences(groups) {
  const references = [];
  const seen = new Set();
  (Array.isArray(groups) ? groups : []).forEach((group) => {
    const templateName = String(group?.templateName || '').trim();
    if (!templateName) return;
    const key = `${group.moduleKey || ''}:${templateName}`;
    if (seen.has(key)) return;
    seen.add(key);
    references.push(`- ${group.moduleLabel || group.moduleKey || 'Module'}: \`templates/${templateName}\``);
  });
  return references.length ? [...references, ''] : ['No module template directive references are currently emitted.', ''];
}

function renderAiEnvironmentEditorStateMarkdown(project, editorState, options = {}) {
  const state = normalizeDocumentEditorStateForStorage(project, 'ai_environment', editorState);
  const directiveRegistry = buildAiDirectiveRegistry(project, {
    ...options,
    disabledDirectiveIds: state.disabledDirectiveIds,
  });
  const lockedSystemDirectives = directiveRegistry.enabledDirectives
    .filter((directive) => directive.locked && ['application', 'shared'].includes(directive.scope))
    .map((directive) => ({
      ...directive,
      stableId: directive.stableId || `ai-directive-${slugifyDocumentToken(directive.id || directive.title, 'directive')}`,
    }));
  const emittedModuleDirectives = directiveRegistry.enabledDirectives
    .filter((directive) => directive.scope === 'module' && directive.emitsToAiEnvironment);
  const emittedModuleDirectiveGroups = groupAiDirectivesByModule(emittedModuleDirectives);
  const projectRequiredBehaviors = filterEditorStateDirectiveDetails(state.requiredBehaviors, directiveRegistry);
  const projectModuleUpdateRules = filterEditorStateDirectiveDetails(state.moduleUpdateRules, directiveRegistry);
  const projectDataPhrasingRules = filterEditorStateDirectiveDetails(state.dataPhrasingRules, directiveRegistry);
  const projectAvoidRules = filterEditorStateDirectiveDetails(state.avoidRules, directiveRegistry);
  const sharedProfiles = Array.isArray(options.sharedProfiles) ? options.sharedProfiles : [];
  const overview = state.overview && typeof state.overview === 'object'
    ? state.overview
    : defaultAiEnvironmentEditorState(project).overview;
  const selectedProfileIds = Array.isArray(state.selectedProfileIds) ? state.selectedProfileIds.map((value) => String(value || '')) : [];
  const appliedProfiles = sharedProfiles.filter((profile) => {
    const scope = String(profile.scope || 'global');
    if (scope === 'global') return true;
    if (scope === 'project_type') return String(profile.projectType || '') === String(project.projectType || '');
    return selectedProfileIds.includes(String(profile.id || ''));
  });

  return [
    `# AI Environment: ${project.name}`,
    '',
    '## 1. Mission',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.mission || '',
      sourceRefs: overview.itemSourceRefs?.mission || [],
      versionDate: overview.versionDate || '',
    }),
    overview.mission || 'Pending AI mission.',
    '',
    '## 2. Operating Model',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.operatingModel || '',
      sourceRefs: overview.itemSourceRefs?.operatingModel || [],
      versionDate: overview.versionDate || '',
    }),
    overview.operatingModel || 'Pending operating model.',
    '',
    '## 3. Communication Style',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.communicationStyle || '',
      sourceRefs: overview.itemSourceRefs?.communicationStyle || [],
      versionDate: overview.versionDate || '',
    }),
    overview.communicationStyle || 'Pending communication style.',
    '',
    '## 4. APM Term Dictionary',
    '',
    ...renderAiEnvironmentTermDictionaryTable(state.termDictionary),
    '## 5. Custom Instructions',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: state.customInstructionsMeta?.stableId || '',
      sourceRefs: state.customInstructionsMeta?.sourceRefs || [],
      versionDate: overview.versionDate || '',
    }),
    String(state.customInstructions || '').trim() || 'No custom instructions added yet.',
    '',
    '## 6. Applied Shared Profiles',
    '',
    ...(appliedProfiles.length
      ? appliedProfiles.flatMap((profile, index) => [
          `### 6.${index + 1} ${profile.name || profile.id || 'Shared Profile'}`,
          '',
          profile.content || 'No profile content yet.',
          '',
        ])
      : ['No shared AI profiles are currently applied.', '']),
    '## 7. Directive Template References',
    '',
    'Template-owned AI directives remain authoritative in their source templates. Read these templates when a module-specific directive applies.',
    '',
    ...renderAiEnvironmentDirectiveTemplateReferences(emittedModuleDirectiveGroups),
    ...(lockedSystemDirectives.length
      ? [
          '## 8. Locked System Directives',
          '',
          ...renderModuleDetailList(lockedSystemDirectives, 'No locked system directives defined.', '8'),
        ]
      : []),
    '## 9. Module Directive Index',
    '',
    'Module and template directives are authoritative in their owning module templates. Follow the enabled directive references below, but read the referenced module/template for granular instructions instead of expecting this document to duplicate every module directive body.',
    '',
    ...(emittedModuleDirectiveGroups.length
      ? emittedModuleDirectiveGroups.flatMap((group, groupIndex) => [
          `### 9.${groupIndex + 1} ${group.moduleLabel || group.moduleKey || 'Module'}`,
          '',
          `- Module Key: ${group.moduleKey}`,
          `- Source Template: ${group.templateName ? `templates/${group.templateName}` : 'Module template'}`,
          '',
          ...group.directives.flatMap((directive, directiveIndex) => [
            `#### 9.${groupIndex + 1}.${directiveIndex + 1} ${directive.title}`,
            '',
            `- Directive ID: ${directive.id}`,
            `- Required: ${directive.required ? 'yes' : 'no'}`,
            `- Locked: ${directive.locked ? 'yes' : 'no'}`,
            '',
          ]),
        ])
      : ['No module directives are currently emitted.', '']),
    '## 10. Project-Level Required Behaviors',
    '',
    ...renderModuleDetailList(projectRequiredBehaviors, 'No project-level required behaviors defined yet.', '10'),
    '## 11. Project-Level Module Update Rules',
    '',
    ...renderModuleDetailList(projectModuleUpdateRules, 'No project-level module update rules defined yet.', '11'),
    '## 12. Project-Level Data Structure and Phrasing Rules',
    '',
    ...renderModuleDetailList(projectDataPhrasingRules, 'No project-level phrasing rules defined yet.', '12'),
    '## 13. Project-Level Avoid / Guardrails',
    '',
    ...renderModuleDetailList(projectAvoidRules, 'No project-level guardrails defined yet.', '13'),
    '## 14. Handoff Checklist',
    '',
    ...renderModuleDetailList(state.handoffChecklist, 'No handoff checklist defined yet.', '14'),
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function renderAiEnvironmentMarkdown(project, markdown, mermaid, editorState = null) {
  const managed = {
    docType: 'ai_environment',
    version: 1,
    markdown,
    mermaid,
    editorState,
  };

  return [
    buildDocumentHeader('ai_environment', project),
    buildManagedBlock(managed),
    '',
    markdown.trim(),
    '',
    '## Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function defaultArchitectureMermaid(project, editorState = null) {
  return buildArchitectureGeneratedMermaid(project, editorState);
}

function renderArchitectureEditorStateMarkdown(project, editorState) {
  const state = normalizeDocumentEditorStateForStorage(project, 'architecture', editorState);
  const overview = state.overview;
  const structure = state.structure;
  const persistenceStrategy = state.persistenceStrategy;
  const deployment = state.deployment;

  return [
    `# Architecture: ${project.name}`,
    '',
    '## 1. Architecture Overview',
    '',
    '### 1.1 System Purpose',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.systemPurpose || '',
      sourceRefs: overview.itemSourceRefs?.systemPurpose || [],
      versionDate: overview.versionDate || '',
    }),
    overview.systemPurpose || 'Pending system purpose.',
    '',
    '### 1.2 Architectural Vision',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.architecturalVision || '',
      sourceRefs: overview.itemSourceRefs?.architecturalVision || [],
      versionDate: overview.versionDate || '',
    }),
    overview.architecturalVision || 'Pending architectural vision.',
    overview.versionDate ? '' : '',
    overview.versionDate ? `_Last updated: ${formatPrdDate(overview.versionDate)}_` : '',
    '',
    '### 1.3 Architectural Style',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.architecturalStyle || '',
      sourceRefs: overview.itemSourceRefs?.architecturalStyle || [],
      versionDate: overview.versionDate || '',
    }),
    overview.architecturalStyle || 'Pending architectural style.',
    '',
    '### 1.4 Architecture Type and Scope',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: structure.itemIds?.primaryArchitecture || '',
      sourceRefs: structure.itemSourceRefs?.primaryArchitecture || [],
      versionDate: structure.versionDate || '',
    }),
    `- Primary Architecture: ${structure.primaryArchitecture || project.name}`,
    ...renderDocumentItemMetadataComment({
      stableId: structure.itemIds?.architectureType || '',
      sourceRefs: structure.itemSourceRefs?.architectureType || [],
      versionDate: structure.versionDate || '',
    }),
    `- Architecture Type: ${structure.architectureType || 'application'}`,
    ...renderDocumentItemMetadataComment({
      stableId: structure.itemIds?.architectureScope || '',
      sourceRefs: structure.itemSourceRefs?.architectureScope || [],
      versionDate: structure.versionDate || '',
    }),
    `- Scope: ${structure.architectureScope || 'single_application'}`,
    '',
    ...renderDocumentItemMetadataComment({
      stableId: structure.itemIds?.systemContext || '',
      sourceRefs: structure.itemSourceRefs?.systemContext || [],
      versionDate: structure.versionDate || '',
    }),
    structure.systemContext || 'No system context captured yet.',
    '',
    '## 2. Architecture Registry',
    '',
    '### 2.1 Sub-Architectures',
    '',
    ...renderModuleDetailList(state.subArchitectures, 'No sub-architectures defined yet.', '2.1'),
    '### 2.2 External Dependencies and Integrations',
    '',
    ...renderModuleDetailList(state.externalDependencies, 'No external dependencies defined yet.', '2.2'),
    '## 3. Technology Stack',
    '',
    ...renderModuleDetailList(state.techStack, 'No technology stack entries defined yet.', '3'),
    '## 4. Components and Boundaries',
    '',
    '### 4.1 Core Components',
    '',
    ...renderModuleDetailList(state.components, 'No components defined yet.', '4.1'),
    '### 4.2 Component Connections',
    '',
    ...renderArchitectureConnectionList(state.componentConnections, 'No component connections defined yet.', '4.2'),
    '### 4.3 Boundaries and Responsibilities',
    '',
    ...renderModuleDetailList(state.boundaries, 'No boundaries defined yet.', '4.3'),
    '## 5. Workflows',
    '',
    '### 5.1 Application Workflows',
    '',
    ...renderModuleDetailList(state.applicationWorkflows, 'No application workflows defined yet.', '5.1'),
    '### 5.2 Architecture Workflows',
    '',
    ...renderModuleDetailList(state.architectureWorkflows, 'No architecture workflows defined yet.', '5.2'),
    '## 6. Module Interdependence',
    '',
    ...renderModuleDetailList(state.moduleInteractions, 'No module interdependence rules defined yet.', '6'),
    '## 7. Persistence and State',
    '',
    '### 7.1 Persistence Strategy',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: persistenceStrategy.itemIds?.summary || '',
      sourceRefs: persistenceStrategy.itemSourceRefs?.summary || [],
      versionDate: persistenceStrategy.versionDate || '',
    }),
    persistenceStrategy.summary || 'No persistence strategy captured yet.',
    '',
    '### 7.2 Source of Truth',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: persistenceStrategy.itemIds?.sourceOfTruth || '',
      sourceRefs: persistenceStrategy.itemSourceRefs?.sourceOfTruth || [],
      versionDate: persistenceStrategy.versionDate || '',
    }),
    persistenceStrategy.sourceOfTruth || 'No source of truth guidance captured yet.',
    '',
    '### 7.3 Synchronization Expectations',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: persistenceStrategy.itemIds?.syncExpectations || '',
      sourceRefs: persistenceStrategy.itemSourceRefs?.syncExpectations || [],
      versionDate: persistenceStrategy.versionDate || '',
    }),
    persistenceStrategy.syncExpectations || 'No synchronization expectations captured yet.',
    '',
    '## 8. Cross-Cutting Concerns',
    '',
    ...renderModuleDetailList(state.crossCuttingConcerns, 'No cross-cutting concerns defined yet.', '8'),
    '## 9. Architectural Decisions and ADR Expectations',
    '',
    ...renderModuleDetailList(state.decisions, 'No architectural decisions captured yet.', '9'),
    '## 10. Constraints and Tradeoffs',
    '',
    ...renderModuleDetailList(state.constraints, 'No constraints captured yet.', '10'),
    '## 11. Runtime and Deployment',
    '',
    '### 11.1 Runtime Topology',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: deployment.itemIds?.runtimeTopology || '',
      sourceRefs: deployment.itemSourceRefs?.runtimeTopology || [],
      versionDate: deployment.versionDate || '',
    }),
    deployment.runtimeTopology || 'Pending runtime topology.',
    '',
    '### 11.2 Environment Notes',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: deployment.itemIds?.environmentNotes || '',
      sourceRefs: deployment.itemSourceRefs?.environmentNotes || [],
      versionDate: deployment.versionDate || '',
    }),
    deployment.environmentNotes || 'Pending environment notes.',
    deployment.versionDate ? '' : '',
    deployment.versionDate ? `_Last updated: ${formatPrdDate(deployment.versionDate)}_` : '',
    '',
    '## 12. Open Questions',
    '',
    ...renderModuleDetailList(state.openQuestions, 'No open questions captured yet.', '12'),
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function renderArchitectureMarkdown(project, markdown, mermaid, editorState = null) {
  const managed = {
    docType: 'architecture',
    version: 1,
    markdown,
    mermaid,
    editorState,
  };

  return [
    buildDocumentHeader('architecture', project),
    buildManagedBlock(managed),
    '',
    markdown.trim(),
    '',
    '## Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function defaultDatabaseSchemaEditorState(project) {
  const now = new Date().toISOString();
  return {
    overview: {
      purpose: '',
      storageStrategy: '',
      versionDate: now,
    },
    importSource: null,
    observedSchemaModel: null,
    syncTracking: {
      intendedVersion: 0,
      observedVersion: 0,
      intendedHash: '',
      observedHash: '',
      syncStatus: 'unverified',
      driftSeverity: 'low',
      changeSource: 'unknown',
      pendingMigrationStatus: 'comparison_required',
      recommendedAction: 'capture_or_compare',
      actionSummary: 'Capture an observed schema or define the intended schema to begin tracking drift.',
      lastComparedAt: '',
      intendedUpdatedAt: '',
      observedCapturedAt: '',
      driftSummary: 'No schema comparison has been recorded yet.',
      driftDetails: {
        entities: [],
        relationships: [],
        indexes: [],
        constraints: [],
      },
      actionItems: [],
      auditHistory: [],
    },
    entities: [],
    relationships: [],
    constraints: [],
    indexes: [],
    migrations: [],
    synchronizationRules: [],
    openQuestions: [],
    dbml: '',
    schemaModel: null,
  };
}

function defaultDatabaseSchemaMermaid(project) {
  return [
    'erDiagram',
    '  PROJECT ||--o{ ENTITY : contains',
    '  ENTITY ||--o{ FIELD : defines',
  ].join('\n');
}

function escapeDbmlString(value) {
  return String(value || '').replace(/"/g, '\\"');
}

function normalizeSchemaModel(state) {
  return state && state.schemaModel && typeof state.schemaModel === 'object'
    ? state.schemaModel
    : null;
}

function normalizeDatabaseSchemaSyncTracking(syncTracking) {
  const base = syncTracking && typeof syncTracking === 'object' ? syncTracking : {};
  return {
    intendedVersion: Number.isFinite(Number(base.intendedVersion)) ? Number(base.intendedVersion) : 0,
    observedVersion: Number.isFinite(Number(base.observedVersion)) ? Number(base.observedVersion) : 0,
    intendedHash: String(base.intendedHash || ''),
    observedHash: String(base.observedHash || ''),
    syncStatus: String(base.syncStatus || 'unverified'),
    driftSeverity: String(base.driftSeverity || 'low'),
    changeSource: String(base.changeSource || 'unknown'),
    pendingMigrationStatus: String(base.pendingMigrationStatus || 'comparison_required'),
    recommendedAction: String(base.recommendedAction || 'capture_or_compare'),
    actionSummary: String(base.actionSummary || 'Capture an observed schema or define the intended schema to begin tracking drift.'),
    lastComparedAt: String(base.lastComparedAt || ''),
    intendedUpdatedAt: String(base.intendedUpdatedAt || ''),
    observedCapturedAt: String(base.observedCapturedAt || ''),
    driftSummary: String(base.driftSummary || 'No schema comparison has been recorded yet.'),
    driftDetails: {
      entities: Array.isArray(base.driftDetails?.entities) ? base.driftDetails.entities : [],
      relationships: Array.isArray(base.driftDetails?.relationships) ? base.driftDetails.relationships : [],
      indexes: Array.isArray(base.driftDetails?.indexes) ? base.driftDetails.indexes : [],
      constraints: Array.isArray(base.driftDetails?.constraints) ? base.driftDetails.constraints : [],
    },
    actionItems: Array.isArray(base.actionItems) ? base.actionItems : [],
    auditHistory: Array.isArray(base.auditHistory) ? base.auditHistory : [],
  };
}

function renderDatabaseSchemaDbml(project, editorState) {
  const state = editorState && typeof editorState === 'object'
    ? editorState
    : defaultDatabaseSchemaEditorState(project);
  const syncTracking = normalizeDatabaseSchemaSyncTracking(state.syncTracking);
  const schemaModel = normalizeSchemaModel(state);
  if ((!schemaModel || !Array.isArray(schemaModel.entities) || !schemaModel.entities.length) && String(state.dbml || '').trim()) {
    return [
      `// APM Schema Sync`,
      `// Intended Version: ${syncTracking.intendedVersion}`,
      `// Observed Version: ${syncTracking.observedVersion}`,
      `// Sync Status: ${syncTracking.syncStatus}`,
      `// Drift Severity: ${syncTracking.driftSeverity}`,
      `// Change Source: ${syncTracking.changeSource}`,
      `// Pending Migration Status: ${syncTracking.pendingMigrationStatus}`,
      `// Recommended Action: ${syncTracking.recommendedAction}`,
      syncTracking.lastComparedAt ? `// Last Compared: ${syncTracking.lastComparedAt}` : '',
      syncTracking.actionSummary ? `// Action Summary: ${syncTracking.actionSummary}` : '',
      syncTracking.driftSummary ? `// Drift Summary: ${syncTracking.driftSummary}` : '',
      `// Action Item Count: ${syncTracking.actionItems.length}`,
      ...syncTracking.actionItems.slice(0, 5).map((item, index) => `// Action Item ${index + 1}: ${item.title}${item.summary ? ` - ${item.summary}` : ''}`),
      syncTracking.auditHistory[0]?.summary ? `// Last Sync Event: ${syncTracking.auditHistory[0].summary}` : '',
      '',
      String(state.dbml).trim(),
    ].filter(Boolean).join('\n').trim();
  }
  if (!schemaModel || !Array.isArray(schemaModel.entities) || !schemaModel.entities.length) {
    return [
      `// APM Schema Sync`,
      `// Intended Version: ${syncTracking.intendedVersion}`,
      `// Observed Version: ${syncTracking.observedVersion}`,
      `// Sync Status: ${syncTracking.syncStatus}`,
      `// Drift Severity: ${syncTracking.driftSeverity}`,
      `// Change Source: ${syncTracking.changeSource}`,
      `// Pending Migration Status: ${syncTracking.pendingMigrationStatus}`,
      `// Recommended Action: ${syncTracking.recommendedAction}`,
      syncTracking.lastComparedAt ? `// Last Compared: ${syncTracking.lastComparedAt}` : '',
      syncTracking.actionSummary ? `// Action Summary: ${syncTracking.actionSummary}` : '',
      syncTracking.driftSummary ? `// Drift Summary: ${syncTracking.driftSummary}` : '',
      `// Action Item Count: ${syncTracking.actionItems.length}`,
      ...syncTracking.actionItems.slice(0, 5).map((item, index) => `// Action Item ${index + 1}: ${item.title}${item.summary ? ` - ${item.summary}` : ''}`),
      syncTracking.auditHistory[0]?.summary ? `// Last Sync Event: ${syncTracking.auditHistory[0].summary}` : '',
      '',
      `Project "${escapeDbmlString(project && project.name ? project.name : 'Project')}" {`,
      '  database_type: "Generic"',
      '}',
      '',
      '// No schema entities defined yet.',
    ].join('\n');
  }

  const entityById = new Map(schemaModel.entities.map((entity) => [entity.id, entity]));
  const fieldByEntity = new Map(
    schemaModel.entities.map((entity) => [entity.id, new Map((Array.isArray(entity.fields) ? entity.fields : []).map((field) => [field.id || field.name, field]))])
  );

  const lines = [
    `// APM Schema Sync`,
    `// Intended Version: ${syncTracking.intendedVersion}`,
    `// Observed Version: ${syncTracking.observedVersion}`,
    `// Sync Status: ${syncTracking.syncStatus}`,
    `// Drift Severity: ${syncTracking.driftSeverity}`,
    `// Change Source: ${syncTracking.changeSource}`,
    `// Pending Migration Status: ${syncTracking.pendingMigrationStatus}`,
    `// Recommended Action: ${syncTracking.recommendedAction}`,
    syncTracking.lastComparedAt ? `// Last Compared: ${syncTracking.lastComparedAt}` : '',
    syncTracking.actionSummary ? `// Action Summary: ${syncTracking.actionSummary}` : '',
    syncTracking.driftSummary ? `// Drift Summary: ${syncTracking.driftSummary}` : '',
    `// Action Item Count: ${syncTracking.actionItems.length}`,
    ...syncTracking.actionItems.slice(0, 5).map((item, index) => `// Action Item ${index + 1}: ${item.title}${item.summary ? ` - ${item.summary}` : ''}`),
    syncTracking.auditHistory[0]?.summary ? `// Last Sync Event: ${syncTracking.auditHistory[0].summary}` : '',
    '',
    `Project "${escapeDbmlString(project && project.name ? project.name : 'Project')}" {`,
    '  database_type: "Generic"',
    '}',
    '',
  ];

  schemaModel.entities.forEach((entity) => {
    lines.push(`Table ${entity.name} {`);
    const fields = Array.isArray(entity.fields) ? entity.fields : [];
    if (!fields.length) {
      lines.push('  id text');
    } else {
      fields.forEach((field) => {
        const attributes = [];
        if (field.primaryKey) attributes.push('pk');
        if (field.unique) attributes.push('unique');
        if (field.nullable === false) attributes.push('not null');
        if (field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== '') {
          attributes.push(`default: ${String(field.defaultValue).trim()}`);
        }
        const attributeSuffix = attributes.length ? ` [${attributes.join(', ')}]` : '';
        const noteSuffix = field.notes ? ` // ${field.notes}` : '';
        lines.push(`  ${field.name} ${field.type || 'text'}${attributeSuffix}${noteSuffix}`);
      });
    }
    if (entity.notes) {
      lines.push(`  Note: '${String(entity.notes).replace(/'/g, "\\'")}'`);
    }
    lines.push('}');
    lines.push('');
  });

  (Array.isArray(schemaModel.relationships) ? schemaModel.relationships : []).forEach((relationship) => {
    const fromEntity = entityById.get(relationship.fromEntityId);
    const toEntity = entityById.get(relationship.toEntityId);
    if (!fromEntity || !toEntity) return;
    const fromField = fieldByEntity.get(fromEntity.id)?.get(relationship.fromFieldId) || { name: relationship.fromFieldId };
    const toField = fieldByEntity.get(toEntity.id)?.get(relationship.toFieldId) || { name: relationship.toFieldId };
    const operator = relationship.cardinality === 'one-to-many'
      ? '>'
      : relationship.cardinality === 'many-to-one'
        ? '<'
        : relationship.cardinality === 'one-to-one'
          ? '-'
          : '>';
    const noteSuffix = relationship.notes ? ` // ${relationship.notes}` : '';
    lines.push(`Ref: ${fromEntity.name}.${fromField.name} ${operator} ${toEntity.name}.${toField.name}${noteSuffix}`);
  });

  return lines.join('\n').trim();
}

function renderDatabaseSchemaEditorStateMarkdown(project, editorState) {
  const state = normalizeDocumentEditorStateForStorage(project, 'database_schema', editorState);
  const overview = state.overview && typeof state.overview === 'object'
    ? state.overview
    : defaultDatabaseSchemaEditorState(project).overview;
  const syncTracking = normalizeDatabaseSchemaSyncTracking(state.syncTracking);
  const schemaModel = normalizeSchemaModel(state);
  const renderStructuredEntities = () => {
    if (!schemaModel || !Array.isArray(schemaModel.entities) || !schemaModel.entities.length) {
      return renderModuleDetailList(state.entities, 'No entities defined yet.', '2');
    }
    return schemaModel.entities.flatMap((entity, index) => [
      `### 2.${index + 1} ${entity.name || entity.id || 'Unnamed entity'}${entity.kind ? ` (${entity.kind})` : ''}`,
      '',
      entity.notes || 'No entity notes captured yet.',
      '',
      entity.status ? `- Status: ${entity.status}` : '',
      '',
      '#### Fields',
      '',
      ...((Array.isArray(entity.fields) && entity.fields.length)
        ? entity.fields.map((field) => {
            const facts = [
              `Type: ${field.type || 'text'}`,
              `Nullable: ${field.nullable ? 'yes' : 'no'}`,
              field.primaryKey ? 'Primary key' : '',
              field.unique ? 'Unique' : '',
              field.defaultValue ? `Default: ${field.defaultValue}` : '',
              field.referencesEntityId && field.referencesFieldId ? `References: ${field.referencesEntityId}.${field.referencesFieldId}` : '',
              field.status ? `Status: ${field.status}` : '',
            ].filter(Boolean);
            return `- \`${field.name || field.id || 'field'}\`${facts.length ? `: ${facts.join('; ')}` : ''}${field.notes ? ` (${field.notes})` : ''}`;
          })
        : ['- No fields defined yet.']),
      '',
    ]);
  };
  const renderStructuredRelationships = () => {
    if (!schemaModel || !Array.isArray(schemaModel.relationships) || !schemaModel.relationships.length) {
      return renderModuleDetailList(state.relationships, 'No relationships defined yet.', '3');
    }
    return schemaModel.relationships.flatMap((relationship, index) => [
      `### 3.${index + 1} ${relationship.id || 'Relationship'}`,
      '',
      `- From: ${relationship.fromEntityId || '?'}${relationship.fromFieldId ? `.${relationship.fromFieldId}` : ''}`,
      `- To: ${relationship.toEntityId || '?'}${relationship.toFieldId ? `.${relationship.toFieldId}` : ''}`,
      relationship.cardinality ? `- Cardinality: ${relationship.cardinality}` : '',
      relationship.status ? `- Status: ${relationship.status}` : '',
      relationship.notes ? `- Notes: ${relationship.notes}` : '',
      '',
    ].filter(Boolean));
  };
  const renderStructuredConstraints = () => {
    if (!schemaModel || !Array.isArray(schemaModel.constraints) || !schemaModel.constraints.length) {
      return renderModuleDetailList(state.constraints, 'No constraints defined yet.', '4');
    }
    return schemaModel.constraints.flatMap((constraint, index) => [
      `### 4.${index + 1} ${constraint.name || constraint.id || 'Unnamed constraint'}`,
      '',
      `- Entity: ${constraint.entityId || 'unknown'}`,
      constraint.type ? `- Type: ${constraint.type}` : '',
      constraint.definition ? `- Definition: ${constraint.definition}` : '',
      constraint.status ? `- Status: ${constraint.status}` : '',
      constraint.notes ? `- Notes: ${constraint.notes}` : '',
      '',
    ].filter(Boolean));
  };
  const renderStructuredIndexes = () => {
    if (!schemaModel || !Array.isArray(schemaModel.indexes) || !schemaModel.indexes.length) {
      return renderModuleDetailList(state.indexes, 'No indexes defined yet.', '5');
    }
    return schemaModel.indexes.flatMap((indexEntry, index) => [
      `### 5.${index + 1} ${indexEntry.name || indexEntry.id || 'Unnamed index'}`,
      '',
      `- Entity: ${indexEntry.entityId || 'unknown'}`,
      Array.isArray(indexEntry.fields) && indexEntry.fields.length ? `- Fields: ${indexEntry.fields.join(', ')}` : '',
      `- Unique: ${indexEntry.unique ? 'yes' : 'no'}`,
      indexEntry.status ? `- Status: ${indexEntry.status}` : '',
      indexEntry.notes ? `- Notes: ${indexEntry.notes}` : '',
      '',
    ].filter(Boolean));
  };

  return [
    `# Database Schema: ${project.name}`,
    '',
    '## 1. Schema Overview',
    '',
    '### 1.1 Purpose',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.purpose || '',
      sourceRefs: overview.itemSourceRefs?.purpose || [],
      versionDate: overview.versionDate || '',
    }),
    overview.purpose || 'Pending schema purpose.',
    '',
    '### 1.2 Storage Strategy',
    '',
    ...renderDocumentItemMetadataComment({
      stableId: overview.itemIds?.storageStrategy || '',
      sourceRefs: overview.itemSourceRefs?.storageStrategy || [],
      versionDate: overview.versionDate || '',
    }),
    overview.storageStrategy || 'Pending storage strategy.',
    overview.versionDate ? '' : '',
    overview.versionDate ? `_Last updated: ${formatPrdDate(overview.versionDate)}_` : '',
    '',
    '### 1.3 Sync Status',
    '',
    `- Intended Version: ${syncTracking.intendedVersion}`,
    `- Observed Version: ${syncTracking.observedVersion}`,
    `- Sync Status: ${syncTracking.syncStatus}`,
    `- Drift Severity: ${syncTracking.driftSeverity}`,
    `- Change Source: ${syncTracking.changeSource}`,
    `- Pending Migration Status: ${syncTracking.pendingMigrationStatus}`,
    `- Recommended Action: ${syncTracking.recommendedAction}`,
    syncTracking.lastComparedAt ? `- Last Compared: ${syncTracking.lastComparedAt}` : '',
    syncTracking.intendedUpdatedAt ? `- Intended Updated At: ${syncTracking.intendedUpdatedAt}` : '',
    syncTracking.observedCapturedAt ? `- Observed Captured At: ${syncTracking.observedCapturedAt}` : '',
    syncTracking.actionSummary ? `- Action Summary: ${syncTracking.actionSummary}` : '',
    syncTracking.driftSummary ? `- Drift Summary: ${syncTracking.driftSummary}` : '',
    '',
    '### 1.3.1 Recommended Work Items',
    '',
    ...(syncTracking.actionItems.length
      ? syncTracking.actionItems.flatMap((item, index) => [
          `- ${index + 1}. ${item.title}${item.priority ? ` [${item.priority}]` : ''}`,
          item.summary ? `  ${item.summary}` : '',
        ].filter(Boolean))
      : ['- No schema work items are currently generated from sync drift.']),
    '',
    '### 1.3.2 Sync Audit History',
    '',
    ...(syncTracking.auditHistory.length
      ? syncTracking.auditHistory.slice(0, 10).flatMap((entry, index) => [
          `- ${index + 1}. ${entry.summary || entry.action || 'Schema sync event'}`,
          entry.timestamp ? `  Timestamp: ${entry.timestamp}` : '',
          entry.changeSource ? `  Change Source: ${entry.changeSource}` : '',
          entry.fromSyncStatus || entry.toSyncStatus ? `  Status: ${entry.fromSyncStatus || 'unknown'} -> ${entry.toSyncStatus || 'unknown'}` : '',
        ].filter(Boolean))
      : ['- No sync audit history recorded yet.']),
    '',
    '### 1.4 Import Source',
    '',
    state.importSource
      ? [
          `- Source Type: ${state.importSource.sourceType || 'unknown'}`,
          `- Source Label: ${state.importSource.sourceLabel || 'unknown source'}`,
          `- Dialect: ${state.importSource.dialect || 'unknown'}`,
          `- Confidence: ${state.importSource.confidence || 'unknown'}`,
          state.importSource.observedAt ? `- Observed At: ${state.importSource.observedAt}` : '',
          state.importSource.schemaFingerprint ? `- Schema Fingerprint: ${state.importSource.schemaFingerprint}` : '',
        ].filter(Boolean).join('\n')
      : 'No import source metadata captured yet.',
    '',
    '## 2. Entities',
    '',
    ...renderStructuredEntities(),
    '## 3. Relationships',
    '',
    ...renderStructuredRelationships(),
    '## 4. Constraints',
    '',
    ...renderStructuredConstraints(),
    '## 5. Indexes',
    '',
    ...renderStructuredIndexes(),
    '## 6. Migration Notes',
    '',
    ...renderModuleDetailList(state.migrations, 'No migration notes defined yet.', '6'),
    '## 7. Open Questions',
    '',
    ...renderModuleDetailList(state.openQuestions, 'No open questions captured yet.', '7'),
    '## 8. Source-of-Truth and Sync Rules',
    '',
    ...renderModuleDetailList(state.synchronizationRules, 'No source-of-truth rules defined yet.', '8'),
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function renderDatabaseSchemaMarkdown(project, markdown, mermaid, editorState = null) {
  const managed = {
    docType: 'database_schema',
    version: 1,
    markdown,
    mermaid,
    editorState,
  };

  return [
    buildDocumentHeader('database_schema', project),
    buildManagedBlock(managed),
    '',
    markdown.trim(),
    '',
    '## Mermaid',
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
  ].join('\n');
}

function renderPrdFragmentMarkdown(project, fragment) {
  const managed = {
    docType: 'prd_fragment',
    version: 1,
    fragment: {
      id: fragment.id,
      projectId: fragment.projectId,
      featureId: fragment.featureId || null,
      code: fragment.code,
      title: fragment.title,
      markdown: fragment.markdown || '',
      mermaid: fragment.mermaid || '',
      status: fragment.status || 'draft',
      merged: !!fragment.merged,
      mergedAt: fragment.mergedAt || null,
      fileName: fragment.fileName || null,
      createdAt: fragment.createdAt,
      updatedAt: fragment.updatedAt,
    },
  };

  return [
    buildTemplateHeader(`PRD Fragment: ${fragment.code} - ${fragment.title}`, PRD_FRAGMENT_TEMPLATE_NAME),
    buildManagedBlock(managed),
    '',
    fragment.markdown.trim(),
    '',
    '## Mermaid',
    '',
    '```mermaid',
    fragment.mermaid || 'flowchart TD\n  fragment["PRD Fragment"]',
    '```',
    '',
  ].join('\n');
}

function renderRoadmapFragmentMarkdown(project, fragment) {
  const managed = {
    docType: 'roadmap_fragment',
    version: 1,
    fragment: {
      id: fragment.id,
      projectId: fragment.projectId,
      sourceFeatureId: fragment.sourceFeatureId || null,
      sourcePhaseId: fragment.sourcePhaseId || null,
      code: fragment.code,
      title: fragment.title,
      markdown: fragment.markdown || '',
      mermaid: fragment.mermaid || '',
      payload: fragment.payload || null,
      status: fragment.status || 'draft',
      merged: !!fragment.merged,
      mergedAt: fragment.mergedAt || null,
      integratedAt: fragment.integratedAt || null,
      fileName: fragment.fileName || null,
      createdAt: fragment.createdAt,
      updatedAt: fragment.updatedAt,
    },
  };

  return [
    buildTemplateHeader(`Roadmap Fragment: ${fragment.code} - ${fragment.title}`, ROADMAP_FRAGMENT_TEMPLATE_NAME),
    buildManagedBlock(managed),
    '',
    fragment.markdown.trim(),
    '',
    '## Mermaid',
    '',
    '```mermaid',
    fragment.mermaid || 'flowchart TD\n  fragment["Roadmap Fragment"]',
    '```',
    '',
  ].join('\n');
}

function formatFragmentTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return '00000000_000000_000';
  const pad = (input, size = 2) => String(input).padStart(size, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('') + '_' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
  ].join('');
}

function getPrdFragmentFileName(fragment) {
  if (fragment && fragment.fileName) return fragment.fileName;
  if (fragment && fragment.mergedFileName) return fragment.mergedFileName;
  return `PRD_FRAGMENT_${formatFragmentTimestamp(fragment && (fragment.createdAt || fragment.updatedAt))}.md`;
}

function getRoadmapFragmentFileName(fragment) {
  if (fragment && fragment.fileName) return fragment.fileName;
  if (fragment && fragment.mergedFileName) return fragment.mergedFileName;
  return `ROADMAP_FRAGMENT_${formatFragmentTimestamp(fragment && (fragment.createdAt || fragment.updatedAt))}.md`;
}

function getPrdFragmentPath(project, fragment) {
  const fragmentsDir = ensureProjectFragmentsDir(project);
  return path.join(fragmentsDir, getPrdFragmentFileName(fragment));
}

function getRoadmapFragmentPath(project, fragment) {
  const fragmentsDir = ensureProjectFragmentsDir(project);
  return path.join(fragmentsDir, getRoadmapFragmentFileName(fragment));
}

function getDatabaseSchemaDbmlPath(project) {
  const docsDir = ensureProjectDocsDir(project);
  return path.join(docsDir, 'DATABASE_SCHEMA.dbml');
}

function writeManagedFile(filePath, markdown, label) {
  fs.writeFileSync(filePath, markdown, 'utf8');
  const stats = fs.statSync(filePath);
  const snapshot = {
    docPath: filePath,
    updatedAt: stats.mtime.toISOString(),
    md5: computeMd5(markdown),
  };
  config.log(`workspace-docs: wrote ${label} document to ${filePath}`);
  return snapshot;
}

function writeProjectDocument(project, docType, markdown) {
  syncProjectTemplateFiles(project, docType);
  syncSoftwareStandardsForProject(project);
  const docPath = getProjectDocPath(project, docType);
  return writeManagedFile(docPath, markdown, `${docType} for project ${project.id}`);
}

function writeDatabaseSchemaDbmlFile(project, dbml) {
  const filePath = getDatabaseSchemaDbmlPath(project);
  return writeManagedFile(filePath, String(dbml || '').trim() + '\n', `database schema dbml for project ${project.id}`);
}

function readProjectManagedDocument(project, docType) {
  const docsDir = getProjectDocsDir(project);
  if (!docsDir) return null;
  const docPath = path.join(docsDir, getDocDefinition(docType).fileName);
  if (!fs.existsSync(docPath)) return null;
  const markdown = fs.readFileSync(docPath, 'utf8');
  const managed = parseManagedBlock(markdown, { fileName: path.basename(docPath), filePath: docPath });
  const stats = fs.statSync(docPath);
  return {
    markdown,
    managed,
    docPath,
    updatedAt: stats.mtime.toISOString(),
    md5: computeMd5(markdown),
  };
}

function readManagedFileSnapshot(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const markdown = fs.readFileSync(filePath, 'utf8');
  const managed = parseManagedBlock(markdown, { fileName: path.basename(filePath), filePath });
  const stats = fs.statSync(filePath);
  return {
    markdown,
    managed,
    docPath: filePath,
    updatedAt: stats.mtime.toISOString(),
    md5: computeMd5(markdown),
  };
}

function writePrdFragmentDocument(project, fragment) {
  syncPrdFragmentTemplateForProject(project);
  const filePath = getPrdFragmentPath(project, fragment);
  const markdown = renderPrdFragmentMarkdown(project, fragment);
  return {
    markdown,
    snapshot: writeManagedFile(filePath, markdown, `prd fragment ${fragment.id} for project ${project.id}`),
    fileName: path.basename(filePath),
    filePath,
  };
}

function writeRoadmapFragmentDocument(project, fragment) {
  syncRoadmapFragmentTemplateForProject(project);
  const filePath = getRoadmapFragmentPath(project, fragment);
  const markdown = renderRoadmapFragmentMarkdown(project, fragment);
  return {
    markdown,
    snapshot: writeManagedFile(filePath, markdown, `roadmap fragment ${fragment.id} for project ${project.id}`),
    fileName: path.basename(filePath),
    filePath,
  };
}

function readPrdFragmentDocument(project, fragment) {
  const filePath = getPrdFragmentPath(project, fragment);
  return readManagedFileSnapshot(filePath);
}

function readRoadmapFragmentDocument(project, fragment) {
  const filePath = getRoadmapFragmentPath(project, fragment);
  return readManagedFileSnapshot(filePath);
}

function listProjectDocFiles(project, pattern) {
  const docsDir = getProjectDocsDir(project);
  if (!docsDir || !fs.existsSync(docsDir)) return [];
  const regex = pattern instanceof RegExp ? pattern : /.*/;
  return fs.readdirSync(docsDir)
    .filter((name) => regex.test(name))
    .map((name) => path.join(docsDir, name));
}

function listProjectFragmentFiles(project, pattern) {
  const fragmentsDir = getProjectFragmentsDir(project);
  if (!fragmentsDir || !fs.existsSync(fragmentsDir)) return [];
  const regex = pattern instanceof RegExp ? pattern : /.*/;
  return fs.readdirSync(fragmentsDir)
    .filter((name) => regex.test(name))
    .map((name) => path.join(fragmentsDir, name));
}

function listFragmentFilesForModuleInDir(dirPath, moduleKey, pattern = null) {
  if (!dirPath || !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
  const expectedDocTypes = new Set(getFragmentDocTypesForModule(moduleKey));
  const regex = pattern instanceof RegExp ? pattern : null;
  return fs.readdirSync(dirPath)
    .filter((name) => /\.md$/i.test(name) && !/\.template\.md$/i.test(name))
    .map((name) => path.join(dirPath, name))
    .filter((filePath) => {
      if (regex && regex.test(path.basename(filePath))) return true;
      if (!expectedDocTypes.size) return false;
      const snapshot = readManagedFileSnapshot(filePath);
      const docType = normalizeFragmentDocType(
        snapshot?.managed?.docType || inferFragmentDocTypeFromFileName(path.basename(filePath))
      );
      return expectedDocTypes.has(docType);
    });
}

function listProjectFragmentFilesForModule(project, moduleKey, pattern = null) {
  const fragmentsDir = getProjectFragmentsDir(project);
  return listFragmentFilesForModuleInDir(fragmentsDir, moduleKey, pattern);
}

function listSharedFragmentFilesForModule(moduleKey, pattern = null) {
  const sharedDir = ensureSharedFragmentsDir();
  return listFragmentFilesForModuleInDir(sharedDir, moduleKey, pattern);
}

function isPendingFragmentFile(filePath) {
  if (!filePath || !/\.md$/i.test(filePath) || /\.template\.md$/i.test(filePath)) return false;
  const snapshot = readManagedFileSnapshot(filePath);
  const managed = snapshot?.managed || {};
  const status = String(
    managed?.fragment?.status
    || managed?.status
    || managed?.editorState?.status
    || ''
  ).trim().toLowerCase();
  return !['archived', 'consumed', 'integrated', 'merged', 'resolved'].includes(status);
}

function countPendingProjectFragments(project) {
  return listProjectFragmentFiles(project).filter(isPendingFragmentFile).length;
}

module.exports = {
  DOC_TYPES,
  PRD_FRAGMENT_TEMPLATE_NAME,
  ROADMAP_FRAGMENT_TEMPLATE_NAME,
  DATABASE_SCHEMA_FRAGMENT_TEMPLATE_NAME,
  FRAGMENT_TEMPLATE_NAMES,
  FRAGMENT_DOC_TYPE_ALIASES,
  FRAGMENT_DOC_TYPES_BY_MODULE,
  TEMPLATE_DIR,
  STANDARDS_DIR,
  SOFTWARE_STANDARDS_REFERENCE_REGISTRY_NAME,
  ensureProjectDocsDir,
  ensureProjectTemplatesDir,
  ensureProjectStandardsDir,
  ensureProjectWorkspaceDir,
  ensureProjectFragmentsDir,
  ensureSharedFragmentsDir,
  getProjectDocsDir,
  getProjectApmDir,
  getProjectsDataDir,
  getProjectDataDir,
  getSharedProjectDataDir,
  getProjectTemplatesDir,
  getProjectStandardsDir,
  getProjectSoftwareStandardsDir,
  getProjectWorkspaceDir,
  getProjectFragmentsDir,
  getFragmentsRootDir,
  getSharedFragmentsDir,
  getProjectDocPath,
  getSoftwareStandardsRegistrySourcePath,
  getProjectSoftwareStandardsRegistryPath,
  syncSoftwareStandardsForProject,
  syncArchivedBugWorkspaceNotes,
  syncTemplateForProject,
  syncProjectTemplateFiles,
  syncDocumentTemplateRecordForProject,
  syncFragmentTemplateRecordForProject,
  syncAllDocumentTemplateRecordsForProject,
  syncAllFragmentTemplateRecordsForProject,
  syncSoftwareStandardsRegistryForProject,
  syncPrdFragmentTemplateForProject,
  syncRoadmapFragmentTemplateForProject,
  syncDatabaseSchemaFragmentTemplateForProject,
  syncFragmentTemplateForProject,
  syncAllFragmentTemplatesForProject,
  getTemplateMetadata,
  normalizeFragmentDocType,
  getFragmentDocTypesForModule,
  inferFragmentDocTypeFromFileName,
  migrateManagedPayload,
  FRAGMENT_MANAGED_PAYLOAD_MIGRATORS,
  computeMd5,
  parseManagedBlock,
  sanitizeAiEnvironmentCustomInstructions,
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
    normalizeDocumentEditorStateForStorage,
    backfillDocumentEditorStateFromChangelog,
    defaultModuleDocumentEditorState,
  renderModuleDocumentEditorStateMarkdown,
  defaultArchitectureEditorState,
  defaultArchitectureMermaid,
  buildArchitectureGeneratedMermaid,
  renderArchitectureEditorStateMarkdown,
  renderArchitectureMarkdown,
  defaultAiEnvironmentEditorState,
  getImmutableAiDirectives,
  buildAiDirectiveRegistry,
  renderAiEnvironmentEditorStateMarkdown,
  renderAiEnvironmentMarkdown,
  defaultDatabaseSchemaEditorState,
  defaultDatabaseSchemaMermaid,
  renderDatabaseSchemaEditorStateMarkdown,
  renderDatabaseSchemaMarkdown,
  renderDatabaseSchemaDbml,
  normalizeDatabaseSchemaSyncTracking,
  renderPrdFragmentMarkdown,
  renderRoadmapFragmentMarkdown,
  getPrdFragmentFileName,
  getRoadmapFragmentFileName,
  getPrdFragmentPath,
  getRoadmapFragmentPath,
  getDatabaseSchemaDbmlPath,
  writeProjectDocument,
  writeDatabaseSchemaDbmlFile,
  readProjectManagedDocument,
  readManagedFileSnapshot,
  writePrdFragmentDocument,
  writeRoadmapFragmentDocument,
  readPrdFragmentDocument,
  readRoadmapFragmentDocument,
  listProjectDocFiles,
  listProjectFragmentFiles,
  listFragmentFilesForModuleInDir,
  listProjectFragmentFilesForModule,
  listSharedFragmentFilesForModule,
  countPendingProjectFragments,
};
