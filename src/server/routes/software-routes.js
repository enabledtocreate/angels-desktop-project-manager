module.exports = function registerSoftwareRoutes(app, ctx) {
  const {
    fs,
    path,
    config,
    normalizeWorkspacePlugins,
    getProjectById,
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
    ensureWorkspaceProject,
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
    listProjectFragmentFilesForModule,
    listSharedFragmentFilesForModule,
    getFragmentsRootDir,
    getProjectFragmentsDir,
    getSharedFragmentsDir,
    ensureProjectFragmentsDir,
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
    sanitizeAiEnvironmentCustomInstructions,
    emitProjectActivity,
  } = ctx;

  async function emitProjectFamilyActivity(projectId, eventType, details = {}) {
    if (!projectId) return;
    emitProjectActivity?.(projectId, eventType, details);
    const project = await getProjectById(projectId);
    if (project?.parentId) {
      emitProjectActivity?.(project.parentId, eventType, {
        ...details,
        childProjectId: projectId,
      });
    }
  }

  function listDatabaseSchemaFragmentsInDir(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
    return fs.readdirSync(dirPath)
      .filter((entry) => /^DATABASE_SCHEMA_FRAGMENT_.*\.md$/i.test(entry))
      .map((entry) => path.join(dirPath, entry));
  }

  function listSharedDatabaseSchemaFragmentFiles() {
    const runtimeSharedDir = ensureSharedFragmentsDir();
    const legacyRuntimeDocsDir = path.join(config.getProjectsRoot(), 'docs');
    const appDocsDir = path.join(config.APP_DIR, 'docs');
    return [...new Set([
      ...listDatabaseSchemaFragmentsInDir(runtimeSharedDir),
      ...listDatabaseSchemaFragmentsInDir(legacyRuntimeDocsDir),
      ...listDatabaseSchemaFragmentsInDir(appDocsDir),
    ])];
  }

  function listAiEnvironmentDirectiveFilesInDir(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
    return fs.readdirSync(dirPath)
      .filter((entry) => /^AI_ENVIRONMENT_(SUGGESTED|DIRECTIVE|FRAGMENT)_.*\.md$/i.test(entry))
      .map((entry) => path.join(dirPath, entry));
  }

  function listSharedAiEnvironmentDirectiveFiles() {
    const runtimeSharedDir = ensureSharedFragmentsDir();
    return [...new Set([
      ...listAiEnvironmentDirectiveFilesInDir(runtimeSharedDir),
    ])];
  }

  const GENERIC_MODULE_KEYS = new Set(['functional_spec', 'domain_models', 'technical_design', 'experience_design', 'adr', 'test_strategy', 'changelog']);

  function getFragmentPrefixes(moduleKey) {
    return {
      project_brief: 'PROJECT_BRIEF_FRAGMENT',
      roadmap: 'ROADMAP_FRAGMENT',
      features: 'FEATURES_FRAGMENT',
      bugs: 'BUGS_FRAGMENT',
      changelog: 'CHANGELOG_FRAGMENT',
      prd: 'PRD_FRAGMENT',
      architecture: 'ARCHITECTURE_FRAGMENT',
      database_schema: 'DATABASE_SCHEMA_FRAGMENT',
      ai_environment: 'AI_ENVIRONMENT_FRAGMENT',
      functional_spec: 'FUNCTIONAL_SPEC_FRAGMENT',
      domain_models: 'DOMAIN_MODELS_FRAGMENT',
      technical_design: 'TECHNICAL_DESIGN_FRAGMENT',
      experience_design: ['EXPERIENCE_DESIGN_FRAGMENT', 'UX_UI_FRAGMENT'],
      adr: 'ADR_FRAGMENT',
      test_strategy: 'TEST_STRATEGY_FRAGMENT',
    }[String(moduleKey || '').trim().toLowerCase()] || null;
  }

  function moduleFragmentRegex(moduleKey) {
    const prefixes = getFragmentPrefixes(moduleKey);
    if (!prefixes) return null;
    const values = Array.isArray(prefixes) ? prefixes : [prefixes];
    const escaped = values.map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`^(?:${escaped.join('|')})_.*\\.md$`, 'i');
  }

  function listModuleFragmentsInDir(dirPath, moduleKey) {
    const regex = moduleFragmentRegex(moduleKey);
    if (!regex || !dirPath || !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
    return fs.readdirSync(dirPath)
      .filter((entry) => regex.test(entry))
      .map((entry) => path.join(dirPath, entry));
  }

  function listSharedModuleFragmentFiles(moduleKey) {
    if (typeof listSharedFragmentFilesForModule === 'function') {
      return listSharedFragmentFilesForModule(moduleKey, moduleFragmentRegex(moduleKey));
    }
    const runtimeSharedDir = ensureSharedFragmentsDir();
    return [...new Set([
      ...listModuleFragmentsInDir(runtimeSharedDir, moduleKey),
    ])];
  }

  function stripManagedBlock(markdown) {
    return String(markdown || '').replace(/<!-- APM:DATA[\s\S]*?-->\s*/g, '').trim();
  }

  function extractMarkdownHeading(markdown, fallback = '') {
    const heading = String(markdown || '').match(/^#\s+(.+)$/m);
    return (heading && heading[1] ? heading[1].trim() : fallback).trim();
  }

  function extractMarkdownSection(markdown, heading) {
    const lines = String(markdown || '').split(/\r?\n/);
    const target = String(heading || '').trim().toLowerCase();
    const startIndex = lines.findIndex((line) => /^##\s+/.test(line) && line.replace(/^##\s+/, '').trim().toLowerCase() === target);
    if (startIndex < 0) return '';
    const collected = [];
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (/^##\s+/.test(lines[index])) break;
      collected.push(lines[index]);
    }
    return collected.join('\n').trim();
  }

  function extractMarkdownSectionAnyLevel(markdown, heading) {
    const lines = String(markdown || '').split(/\r?\n/);
    const target = String(heading || '').trim().toLowerCase();
    let startIndex = -1;
    let startLevel = 0;
    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
      if (!match) continue;
      if (match[2].trim().toLowerCase() !== target) continue;
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

  function summarizeMarkdown(markdown, fallback = '') {
    const text = stripManagedBlock(markdown)
      .replace(/^#.+$/gm, '')
      .replace(/^>.+$/gm, '')
      .trim();
    const firstParagraph = text.split(/\n\s*\n/).map((part) => part.trim()).find(Boolean);
    return firstParagraph || fallback;
  }

  function extractBulletValue(markdown, label) {
    const escaped = String(label || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = String(markdown || '').match(new RegExp(`^-\\s*${escaped}:\\s*(.+)$`, 'im'));
    return match?.[1]?.trim() || '';
  }

  function parseLooseSectionEntries(markdown, headings = []) {
    const sectionText = headings
      .map((heading) => extractMarkdownSection(markdown, heading))
      .find((value) => String(value || '').trim());
    const text = String(sectionText || '').trim();
    if (!text) return [];
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const bulletEntries = lines
      .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
      .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
      .filter(Boolean);
    const parts = bulletEntries.length
      ? bulletEntries
      : text.split(/\n\s*\n/).map((part) => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return parts;
  }

  function buildChangelogEntryFromFragment(importedFragment) {
    const markdown = String(importedFragment?.markdown || '');
    const fragmentEntries = Array.isArray(importedFragment?.fragment?.changeEntries)
      ? importedFragment.fragment.changeEntries
      : [];
    if (fragmentEntries.length) {
      return fragmentEntries.map((entry, index) => ({
        id: entry?.id || `changelog-fragment-${importedFragment?.code || importedFragment?.id || 'entry'}-${index + 1}`,
        changeDate: entry?.changeDate || importedFragment?.updatedAt || new Date().toISOString(),
        workItemCodes: String(entry?.workItemCodes || importedFragment?.code || '').trim(),
        operation: String(entry?.operation || 'update').trim() || 'update',
        targetDoc: String(entry?.targetDoc || '').trim(),
        targetSectionNumber: String(entry?.targetSectionNumber || '').trim(),
        targetItemId: String(entry?.targetItemId || '').trim(),
        fragmentCode: String(entry?.fragmentCode || importedFragment?.code || '').trim(),
        summary: String(entry?.summary || importedFragment?.summary || '').trim(),
        versionDate: new Date().toISOString(),
      })).filter((entry) => entry.workItemCodes || entry.targetItemId || entry.summary);
    }

    const summary = extractMarkdownSection(markdown, 'Executive Summary')
      || importedFragment?.summary
      || summarizeMarkdown(markdown, 'Imported change log fragment');
    const workItemCodes = extractBulletValue(markdown, 'Work Item Codes')
      || extractBulletValue(markdown, 'Related Codes')
      || String(importedFragment?.code || '').trim();
    const entry = {
      id: `changelog-fragment-${importedFragment?.code || importedFragment?.id || importedFragment?.fileName || Date.now()}`,
      changeDate: extractBulletValue(markdown, 'Change Date') || importedFragment?.updatedAt || new Date().toISOString(),
      workItemCodes,
      operation: extractBulletValue(markdown, 'Operation') || 'update',
      targetDoc: extractBulletValue(markdown, 'Target Document'),
      targetSectionNumber: extractBulletValue(markdown, 'Target Section'),
      targetItemId: extractBulletValue(markdown, 'Target Item ID'),
      fragmentCode: extractBulletValue(markdown, 'Fragment Code') || String(importedFragment?.code || '').trim(),
      summary: String(summary || '').trim(),
      versionDate: new Date().toISOString(),
    };
    return entry.workItemCodes || entry.targetItemId || entry.summary ? [entry] : [];
  }

  function normalizeFragmentRevision(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  function extractFragmentVersionMetadata(rawFragment = {}, snapshot, fallbackKey) {
    const fragment = rawFragment && typeof rawFragment === 'object' ? rawFragment : {};
    const managed = snapshot?.managed && typeof snapshot.managed === 'object' ? snapshot.managed : null;
    return {
      revision: normalizeFragmentRevision(fragment.revision ?? fragment.version ?? managed?.fragmentRevision ?? managed?.version),
      lineageKey: String(fragment.lineageKey || fragment.code || fragment.id || fallbackKey || '').trim() || String(fallbackKey || 'FRAGMENT'),
      supersedesCode: String(fragment.supersedesCode || '').trim(),
      supersedesRevision: fragment.supersedesRevision !== undefined && fragment.supersedesRevision !== null && String(fragment.supersedesRevision).trim() !== ''
        ? normalizeFragmentRevision(fragment.supersedesRevision)
        : null,
    };
  }

  function applyFragmentVersionMetadata(entry, rawFragment, snapshot, fallbackKey) {
    const metadata = extractFragmentVersionMetadata(rawFragment, snapshot, fallbackKey);
    return {
      ...entry,
      revision: metadata.revision,
      lineageKey: metadata.lineageKey,
      supersedesCode: metadata.supersedesCode,
      supersedesRevision: metadata.supersedesRevision,
    };
  }

  function annotateFragmentVersionRelationships(fragments = []) {
    const latestRevisionByLineage = new Map();
    fragments.forEach((fragment) => {
      const lineageKey = String(fragment?.lineageKey || fragment?.code || fragment?.id || '').trim();
      const revision = normalizeFragmentRevision(fragment?.revision);
      const existing = latestRevisionByLineage.get(lineageKey);
      if (!existing || revision > existing.revision) {
        latestRevisionByLineage.set(lineageKey, {
          revision,
          code: fragment?.code || '',
        });
      }
    });

    const explicitSuperseded = new Map();
    fragments.forEach((fragment) => {
      if (!fragment?.supersedesCode) return;
      const targetLineage = String(fragment.supersedesCode).trim();
      const targetRevision = normalizeFragmentRevision(fragment.supersedesRevision);
      explicitSuperseded.set(`${targetLineage}::${targetRevision}`, {
        code: fragment?.code || '',
        revision: normalizeFragmentRevision(fragment?.revision),
      });
    });

    return fragments.map((fragment) => {
      const lineageKey = String(fragment?.lineageKey || fragment?.code || fragment?.id || '').trim();
      const revision = normalizeFragmentRevision(fragment?.revision);
      const latest = latestRevisionByLineage.get(lineageKey);
      const explicit = explicitSuperseded.get(`${lineageKey}::${revision}`);
      const supersededBy = explicit || (latest && latest.revision > revision ? latest : null);
      return {
        ...fragment,
        revision,
        lineageKey,
        isLatestRevision: !supersededBy,
        isSuperseded: !!supersededBy,
        supersededByCode: supersededBy?.code || '',
        supersededByRevision: supersededBy?.revision || null,
      };
    });
  }

  function buildGenericModuleFragmentEntry(snapshot, sourcePath, sourceScope, moduleKey) {
    const fileName = path.basename(sourcePath);
    const managed = snapshot && snapshot.managed;
    const fragment = managed && managed.docType === `${moduleKey}_fragment` && managed.fragment && typeof managed.fragment === 'object'
      ? managed.fragment
      : null;
    const markdown = snapshot?.markdown || '';
    return applyFragmentVersionMetadata({
      id: `${sourceScope}:${fileName}`,
      code: fragment?.code || fileName.replace(/\.md$/i, ''),
      title: fragment?.title || extractMarkdownHeading(markdown, fileName.replace(/\.md$/i, '')) || fileName,
      markdown,
      status: fragment?.status || 'draft',
      fileName,
      sourceScope,
      sourcePath,
      updatedAt: snapshot?.updatedAt,
      fragment,
      summary: fragment?.summary || summarizeMarkdown(markdown, 'Imported fragment'),
    }, fragment, snapshot, fragment?.code || fileName.replace(/\.md$/i, ''));
  }

  function buildGenericModuleFragmentRecoveryEntry(sourcePath, sourceScope, moduleKey, error) {
    const fileName = path.basename(sourcePath);
    const markdown = fs.existsSync(sourcePath) ? String(fs.readFileSync(sourcePath, 'utf8') || '') : '';
    return applyFragmentVersionMetadata({
      id: `${sourceScope}:${fileName}`,
      code: fileName.replace(/\.md$/i, ''),
      title: extractMarkdownHeading(markdown, fileName.replace(/\.md$/i, '')) || fileName,
      markdown,
      status: 'draft',
      fileName,
      sourceScope,
      sourcePath,
      updatedAt: fs.existsSync(sourcePath) ? fs.statSync(sourcePath).mtime.toISOString() : null,
      summary: summarizeMarkdown(markdown, 'Imported fragment'),
      parseWarning: `Fragment metadata could not be fully parsed. Recovery mode is active: ${error.message || 'unknown error'}`,
    }, {}, null, fileName.replace(/\.md$/i, ''));
  }

  function safelyBuildGenericModuleFragmentEntry(sourcePath, sourceScope, moduleKey) {
    try {
      return buildGenericModuleFragmentEntry(readManagedFileSnapshot(sourcePath), sourcePath, sourceScope, moduleKey);
    } catch (error) {
      return buildGenericModuleFragmentRecoveryEntry(sourcePath, sourceScope, moduleKey, error);
    }
  }

  function mergeGenericModuleEditorState(project, currentState, importedFragment, moduleKey) {
    const fragmentOperations = extractDocumentFragmentOperations(importedFragment?.markdown, importedFragment?.fragment || importedFragment, {
      versionDate: importedFragment?.updatedAt || new Date().toISOString(),
      sourceRefs: importedFragment?.code ? [importedFragment.code] : [],
    });
    if (moduleKey === 'changelog') {
      const nextState = currentState && typeof currentState === 'object'
        ? { ...currentState }
        : {
            overview: {
              summary: 'Change log is still being defined.',
              versionDate: new Date().toISOString(),
            },
            entries: [],
            openQuestions: [],
            fragmentHistory: [],
          };
      const history = Array.isArray(nextState.fragmentHistory) ? nextState.fragmentHistory : [];
      const importedHistoryKey = `${String(importedFragment.lineageKey || importedFragment.code || importedFragment.id || importedFragment.fileName || '')}::${normalizeFragmentRevision(importedFragment.revision)}`;
      const nextSummary = String(nextState.overview?.summary || '').trim();
      const importedSummary = String(importedFragment?.summary || '').trim();
      const importedEntries = fragmentOperations.length
        ? []
        : buildChangelogEntryFromFragment(importedFragment);
      const importedOpenQuestions = extractMarkdownSection(importedFragment?.markdown || '', 'Open Questions');
      const operationState = fragmentOperations.length
        ? applyDocumentFragmentOperations(project, 'changelog', nextState, fragmentOperations, {
            defaultVersionDate: importedFragment?.updatedAt || new Date().toISOString(),
            defaultSourceRefs: importedFragment?.code ? [importedFragment.code] : [],
          })
        : nextState;
      return {
        ...operationState,
        overview: {
          ...(operationState.overview || {}),
          summary: !nextSummary || nextSummary.startsWith('Change log')
            ? (importedSummary || nextSummary)
            : nextSummary,
          versionDate: new Date().toISOString(),
        },
        entries: [
          ...importedEntries,
          ...(Array.isArray(operationState.entries) ? operationState.entries : []),
        ],
        openQuestions: importedOpenQuestions
          ? [
              ...(Array.isArray(operationState.openQuestions) ? operationState.openQuestions : []),
              {
                id: `changelog-open-question-${Date.now()}`,
                title: importedFragment.title || importedFragment.code || 'Imported open question',
                description: importedOpenQuestions,
                versionDate: new Date().toISOString(),
              },
            ]
          : (Array.isArray(operationState.openQuestions) ? operationState.openQuestions : []),
        fragmentHistory: [
          {
            id: importedFragment.id || importedFragment.fileName,
            code: importedFragment.code || importedFragment.fileName,
            title: importedFragment.title || importedFragment.code || 'Imported fragment',
            status: 'integrated',
            sourceScope: importedFragment.sourceScope || 'project',
            integratedAt: new Date().toISOString(),
            summary: importedSummary || 'Imported fragment',
            revision: importedFragment.revision || 1,
            lineageKey: importedFragment.lineageKey || importedFragment.code || importedFragment.fileName,
            supersedesCode: importedFragment.supersedesCode || '',
            supersedesRevision: importedFragment.supersedesRevision || null,
          },
          ...history.filter((entry) => (
            `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}` !== importedHistoryKey
          )),
        ],
      };
    }
    if (moduleKey === 'functional_spec') {
      const nextState = currentState && typeof currentState === 'object'
        ? { ...currentState }
        : defaultModuleDocumentEditorState(project, moduleKey);
      const history = Array.isArray(nextState.fragmentHistory) ? nextState.fragmentHistory : [];
      const importedHistoryKey = `${String(importedFragment.lineageKey || importedFragment.code || importedFragment.id || importedFragment.fileName || '')}::${normalizeFragmentRevision(importedFragment.revision)}`;
      const markdown = String(importedFragment?.markdown || '');
      const importedSummary = String(
        extractMarkdownSection(markdown, 'Executive Summary')
        || importedFragment?.summary
        || ''
      ).trim();
      const defaultSummary = String(defaultModuleDocumentEditorState(project, moduleKey)?.overview?.summary || '').trim();
      const currentSummary = String(nextState.overview?.summary || '').trim();
      const withOperations = fragmentOperations.length
        ? applyDocumentFragmentOperations(project, 'functional_spec', nextState, fragmentOperations, {
            defaultVersionDate: importedFragment?.updatedAt || new Date().toISOString(),
            defaultSourceRefs: importedFragment?.code ? [importedFragment.code] : [],
          })
        : nextState;
      const sourceRefs = importedFragment?.code ? [importedFragment.code] : [];
      const versionDate = importedFragment?.updatedAt || new Date().toISOString();
      const appendEntries = (items, entries) => [
        ...(Array.isArray(items) ? items : []),
        ...entries.map((description) => ({
          title: '',
          description,
          versionDate,
          sourceRefs,
        })),
      ];
      const mergedState = fragmentOperations.length
        ? withOperations
        : {
            ...withOperations,
            overview: {
              ...(withOperations.overview || {}),
              summary: !currentSummary || currentSummary === defaultSummary
                ? (importedSummary || currentSummary || defaultSummary)
                : currentSummary,
              versionDate,
            },
            functionalAreas: appendEntries(withOperations.functionalAreas, parseLooseSectionEntries(markdown, ['Functional Area Updates', 'Functional Areas'])),
            logicalFlows: appendEntries(withOperations.logicalFlows, parseLooseSectionEntries(markdown, ['Logical Flow Updates', 'Workflow Updates', 'Logical Flows', 'Workflows'])),
            flowEndpoints: appendEntries(withOperations.flowEndpoints, parseLooseSectionEntries(markdown, ['Flow Endpoints and Return Points', 'Flow Endpoints', 'Endpoints and Return Points'])),
            userActionsAndSystemResponses: appendEntries(withOperations.userActionsAndSystemResponses, parseLooseSectionEntries(markdown, ['User Action and System Response Updates', 'User Actions and System Responses'])),
            validationRules: appendEntries(withOperations.validationRules, parseLooseSectionEntries(markdown, ['Validation Rules', 'Validation and Edge Cases'])),
            interfaceExpectations: appendEntries(withOperations.interfaceExpectations, parseLooseSectionEntries(markdown, ['Interface Expectations'])),
            edgeCases: appendEntries(withOperations.edgeCases, parseLooseSectionEntries(markdown, ['Edge Cases'])),
            openQuestions: appendEntries(withOperations.openQuestions, parseLooseSectionEntries(markdown, ['Open Questions'])),
          };
      return {
        ...mergedState,
        fragmentHistory: [
          {
            id: importedFragment.id || importedFragment.fileName,
            code: importedFragment.code || importedFragment.fileName,
            title: importedFragment.title || importedFragment.code || 'Imported fragment',
            status: 'integrated',
            sourceScope: importedFragment.sourceScope || 'project',
            integratedAt: new Date().toISOString(),
            summary: importedSummary || importedFragment.summary || 'Imported fragment',
            revision: importedFragment.revision || 1,
            lineageKey: importedFragment.lineageKey || importedFragment.code || importedFragment.fileName,
            supersedesCode: importedFragment.supersedesCode || '',
            supersedesRevision: importedFragment.supersedesRevision || null,
          },
          ...history.filter((entry) => (
            `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}` !== importedHistoryKey
          )),
        ],
      };
    }
    if (moduleKey === 'domain_models') {
      const nextState = currentState && typeof currentState === 'object'
        ? { ...currentState }
        : defaultModuleDocumentEditorState(project, moduleKey);
      const history = Array.isArray(nextState.fragmentHistory) ? nextState.fragmentHistory : [];
      const importedHistoryKey = `${String(importedFragment.lineageKey || importedFragment.code || importedFragment.id || importedFragment.fileName || '')}::${normalizeFragmentRevision(importedFragment.revision)}`;
      const markdown = String(importedFragment?.markdown || '');
      const importedSummary = String(
        extractMarkdownSection(markdown, 'Executive Summary')
        || importedFragment?.summary
        || ''
      ).trim();
      const defaultSummary = String(defaultModuleDocumentEditorState(project, moduleKey)?.overview?.summary || '').trim();
      const currentSummary = String(nextState.overview?.summary || '').trim();
      const withOperations = fragmentOperations.length
        ? applyDocumentFragmentOperations(project, 'domain_models', nextState, fragmentOperations, {
            defaultVersionDate: importedFragment?.updatedAt || new Date().toISOString(),
            defaultSourceRefs: importedFragment?.code ? [importedFragment.code] : [],
          })
        : nextState;
      const sourceRefs = importedFragment?.code ? [importedFragment.code] : [];
      const versionDate = importedFragment?.updatedAt || new Date().toISOString();
      const appendEntries = (items, entries) => [
        ...(Array.isArray(items) ? items : []),
        ...entries.map((description) => ({
          title: '',
          name: '',
          summary: description,
          description,
          versionDate,
          sourceRefs,
        })),
      ];
      const mergedState = fragmentOperations.length
        ? withOperations
        : {
            ...withOperations,
            overview: {
              ...(withOperations.overview || {}),
              summary: !currentSummary || currentSummary === defaultSummary
                ? (importedSummary || currentSummary || defaultSummary)
                : currentSummary,
              versionDate,
            },
            models: appendEntries(withOperations.models, parseLooseSectionEntries(markdown, ['Domain Models', 'Model Catalog', 'Models'])),
            projections: appendEntries(withOperations.projections, parseLooseSectionEntries(markdown, ['Model Projections', 'Projections'])),
            openQuestions: [
              ...(Array.isArray(withOperations.openQuestions) ? withOperations.openQuestions : []),
              ...parseLooseSectionEntries(markdown, ['Open Questions']).map((description) => ({
                title: importedFragment.title || importedFragment.code || 'Imported open question',
                description,
                versionDate,
                sourceRefs,
              })),
            ],
          };
      return {
        ...mergedState,
        fragmentHistory: [
          {
            id: importedFragment.id || importedFragment.fileName,
            code: importedFragment.code || importedFragment.fileName,
            title: importedFragment.title || importedFragment.code || 'Imported fragment',
            status: 'integrated',
            sourceScope: importedFragment.sourceScope || 'project',
            integratedAt: new Date().toISOString(),
            summary: importedSummary || importedFragment.summary || 'Imported fragment',
            revision: importedFragment.revision || 1,
            lineageKey: importedFragment.lineageKey || importedFragment.code || importedFragment.fileName,
            supersedesCode: importedFragment.supersedesCode || '',
            supersedesRevision: importedFragment.supersedesRevision || null,
          },
          ...history.filter((entry) => (
            `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}` !== importedHistoryKey
          )),
        ],
      };
    }
    const nextState = currentState && typeof currentState === 'object'
      ? { ...currentState }
      : {
          overview: {
            summary: `${String(moduleKey || '').replace(/_/g, ' ')} is still being defined.`,
            versionDate: new Date().toISOString(),
          },
          workingContent: '',
          openQuestions: '',
          fragmentHistory: [],
        };
    const summary = String(importedFragment?.summary || '').trim();
    const fragmentTitle = importedFragment?.title || importedFragment?.code || 'Imported fragment';
    const fragmentBody = stripManagedBlock(importedFragment?.markdown || '');
    const existingWorkingContent = String(nextState.workingContent || '').trim();
    const importedOpenQuestions = extractMarkdownSection(importedFragment?.markdown || '', 'Open Questions');
    const history = Array.isArray(nextState.fragmentHistory) ? nextState.fragmentHistory : [];
    const nextSummary = String(nextState.overview?.summary || '').trim();
    const importedHistoryKey = `${String(importedFragment.lineageKey || importedFragment.code || importedFragment.id || importedFragment.fileName || '')}::${normalizeFragmentRevision(importedFragment.revision)}`;
    const operationState = fragmentOperations.length
      ? applyDocumentFragmentOperations(project, moduleKey, nextState, fragmentOperations, {
          defaultVersionDate: importedFragment?.updatedAt || new Date().toISOString(),
          defaultSourceRefs: importedFragment?.code ? [importedFragment.code] : [],
        })
      : nextState;

    return {
      ...operationState,
      overview: {
        ...(operationState.overview || {}),
        summary: !nextSummary || nextSummary.startsWith(`${String(moduleKey).replace(/_/g, ' ')}`)
          ? (summary || nextSummary)
          : nextSummary,
        versionDate: new Date().toISOString(),
      },
      workingContent: fragmentOperations.length
        ? String(operationState.workingContent || '').trim()
        : [
            existingWorkingContent,
            `### ${fragmentTitle}`,
            '',
            fragmentBody || 'No fragment body.',
          ].filter(Boolean).join('\n\n'),
      openQuestions: fragmentOperations.length
        ? operationState.openQuestions
        : [
            String(nextState.openQuestions || '').trim(),
            importedOpenQuestions,
          ].filter(Boolean).join('\n\n'),
      fragmentHistory: [
        {
          id: importedFragment.id || importedFragment.fileName,
          code: importedFragment.code || importedFragment.fileName,
          title: fragmentTitle,
          status: 'integrated',
          sourceScope: importedFragment.sourceScope || 'project',
          integratedAt: new Date().toISOString(),
          summary: summary || 'Imported fragment',
          revision: importedFragment.revision || 1,
          lineageKey: importedFragment.lineageKey || importedFragment.code || importedFragment.fileName,
          supersedesCode: importedFragment.supersedesCode || '',
          supersedesRevision: importedFragment.supersedesRevision || null,
        },
        ...history.filter((entry) => (
          `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}` !== importedHistoryKey
        )),
      ],
    };
  }

  function extractFeatureOrBugFragmentDetails(markdown, fallbackTitle) {
    const heading = extractMarkdownHeading(markdown, fallbackTitle)
      .replace(/^Feature Fragment:\s*/i, '')
      .replace(/^Bug Fragment:\s*/i, '')
      .trim();
    const codeMatch = heading.match(/^([A-Z]+-[0-9]+)\s*[-:]\s*(.+)$/);
    const sectionSummary = extractMarkdownSection(markdown, 'Executive Summary');
    return {
      code: codeMatch?.[1] || '',
      title: (codeMatch?.[2] || heading || fallbackTitle).trim(),
      summary: sectionSummary || summarizeMarkdown(markdown, heading || fallbackTitle),
      body: stripManagedBlock(markdown),
      currentBehavior: extractMarkdownSection(markdown, 'Current Behavior') || extractMarkdownSectionAnyLevel(markdown, 'Current Behavior'),
      expectedBehavior: extractMarkdownSection(markdown, 'Expected Behavior') || extractMarkdownSectionAnyLevel(markdown, 'Expected Behavior'),
    };
  }

  function fragmentSourcePriority(sourceScope) {
    if (sourceScope === 'project') return 3;
    if (sourceScope === 'shared') return 2;
    if (sourceScope === 'legacy_project_docs') return 1;
    return 0;
  }

  function extractSchemaFragmentRecoveryMetadata(markdown, fileName) {
    const text = String(markdown || '');
    if (!/["']docType["']\s*:\s*["']database_schema_fragment["']/i.test(text)) return null;
    const codeMatch = text.match(/["']code["']\s*:\s*["']([^"']+)["']/i);
    const titleMatch = text.match(/["']title["']\s*:\s*["']([^"']+)["']/i);
    const headerMatch = text.match(/^#\s*Database Schema Fragment:\s*(.+)$/im);
    const statusMatch = text.match(/["']status["']\s*:\s*["']([^"']+)["']/i);
    const idMatch = text.match(/["']id["']\s*:\s*["']([^"']+)["']/i);
    const revisionMatch = text.match(/["'](?:revision|version)["']\s*:\s*([0-9]+)/i);
    const lineageMatch = text.match(/["']lineageKey["']\s*:\s*["']([^"']+)["']/i);
    const supersedesCodeMatch = text.match(/["']supersedesCode["']\s*:\s*["']([^"']+)["']/i);
    const supersedesRevisionMatch = text.match(/["']supersedesRevision["']\s*:\s*([0-9]+)/i);
    const sourceTypeMatch = text.match(/- Source Type:\s*(.+)$/im);
    return {
      revision: normalizeFragmentRevision(revisionMatch?.[1]),
      lineageKey: lineageMatch?.[1] || codeMatch?.[1] || fileName.replace(/\.md$/i, ''),
      supersedesCode: supersedesCodeMatch?.[1] || '',
      supersedesRevision: supersedesRevisionMatch?.[1] ? normalizeFragmentRevision(supersedesRevisionMatch?.[1]) : null,
      id: idMatch?.[1] || fileName,
      code: codeMatch?.[1] || fileName.replace(/\.md$/i, ''),
      title: titleMatch?.[1] || headerMatch?.[1] || fileName,
      status: statusMatch?.[1] || 'draft',
      sourceType: sourceTypeMatch?.[1] || '',
    };
  }

  function buildDatabaseSchemaFragmentListEntry(snapshot, sourcePath, sourceScope) {
    const fileName = path.basename(sourcePath);
    const managed = snapshot && snapshot.managed;
    let fragment = managed && managed.docType === 'database_schema_fragment' && managed.fragment
      ? managed.fragment
      : null;
    let parseWarning = '';
    if (!fragment) {
      const recovered = extractSchemaFragmentRecoveryMetadata(snapshot?.markdown || '', fileName);
      if (!recovered) return null;
      fragment = recovered;
      parseWarning = 'Managed block could not be fully parsed. Showing fragment in recovery mode.';
    }
    return applyFragmentVersionMetadata({
      id: `${sourceScope}:${fragment.id || fileName}`,
      code: fragment.code || fragment.id || fileName,
      title: fragment.title || fileName,
      markdown: snapshot?.markdown || '',
      status: fragment.status || 'draft',
      fileName,
      sourceScope,
      sourcePath,
      updatedAt: snapshot?.updatedAt,
      parseWarning,
    }, fragment, snapshot, fragment.code || fragment.id || fileName);
  }

  function buildAiEnvironmentFragmentListEntry(snapshot, sourcePath, sourceScope) {
    const fileName = path.basename(sourcePath);
    const managed = snapshot && snapshot.managed;
    const editorState = managed && managed.docType === 'ai_environment' && managed.editorState && typeof managed.editorState === 'object'
      ? managed.editorState
      : null;
    const title = String(editorState?.overview?.mission || managed?.markdown || fileName)
      .split(/\r?\n/)
      .find(Boolean) || fileName;
    return applyFragmentVersionMetadata({
      id: `${sourceScope}:${fileName}`,
      code: fileName.replace(/\.md$/i, ''),
      title,
      markdown: snapshot?.markdown || '',
      status: 'draft',
      fileName,
      sourceScope,
      sourcePath,
      updatedAt: snapshot?.updatedAt,
      editorState,
    }, managed || {}, snapshot, fileName.replace(/\.md$/i, ''));
  }

  function buildArchivedFragmentEntry(fragment = {}, sourceScope = 'history') {
    return applyFragmentVersionMetadata({
      ...fragment,
      id: fragment.id || `${sourceScope}:${fragment.code || fragment.fileName || Date.now()}`,
      code: fragment.code || fragment.id || fragment.fileName || 'FRAGMENT',
      title: fragment.title || fragment.code || fragment.fileName || 'Fragment',
      markdown: String(fragment.markdown || ''),
      status: fragment.status || 'integrated',
      sourceScope: fragment.sourceScope || sourceScope,
      updatedAt: fragment.updatedAt || fragment.integratedAt || fragment.mergedAt || null,
    }, fragment, null, fragment.code || fragment.fileName || fragment.id || 'FRAGMENT');
  }

  function mergeFragmentLists(fileFragments = [], historyFragments = []) {
    const deduped = new Map();
    for (const fragment of [...fileFragments, ...historyFragments]) {
      const key = `${String(fragment?.lineageKey || fragment?.code || fragment?.id || fragment?.fileName || fragment?.sourcePath || '')}::${normalizeFragmentRevision(fragment?.revision)}`;
      const existing = deduped.get(key);
      if (!existing || fragmentSourcePriority(fragment?.sourceScope) >= fragmentSourcePriority(existing?.sourceScope)) {
        deduped.set(key, fragment);
      }
    }
    return annotateFragmentVersionRelationships([...deduped.values()]);
  }

  async function appendDocumentFragmentHistory(project, docType, fragmentEntry) {
    const currentDocument = await readProjectDocument(project.id, docType);
    const currentEditorState = currentDocument?.editorState && typeof currentDocument.editorState === 'object'
      ? currentDocument.editorState
      : {};
    const existingHistory = Array.isArray(currentEditorState.fragmentHistory)
      ? currentEditorState.fragmentHistory
      : [];
    const lineageKey = String(fragmentEntry?.lineageKey || fragmentEntry?.code || fragmentEntry?.id || fragmentEntry?.fileName || '').trim();
    const revision = normalizeFragmentRevision(fragmentEntry?.revision);
    const nextEditorState = {
      ...currentEditorState,
      fragmentHistory: [
        fragmentEntry,
        ...existingHistory.filter((entry) => (
          `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}`
          !== `${lineageKey}::${revision}`
        )),
      ],
    };

    await saveProjectDocument(project.id, docType, {
      markdown: currentDocument?.markdown || '',
      mermaid: currentDocument?.mermaid || '',
      editorState: nextEditorState,
      filePath: currentDocument?.filePath || null,
      fileUpdatedAt: currentDocument?.fileUpdatedAt || null,
      fileMd5: currentDocument?.fileMd5 || '',
      dbMd5: currentDocument?.dbMd5 || '',
    });

    return nextEditorState;
  }

  async function ensureLegacyFeaturesFragmentHistory(project) {
    const currentDocument = await readProjectDocument(project.id, 'features');
    const currentEditorState = currentDocument?.editorState && typeof currentDocument.editorState === 'object'
      ? currentDocument.editorState
      : {};
    const existingHistory = Array.isArray(currentEditorState.fragmentHistory)
      ? currentEditorState.fragmentHistory
      : [];
    if (existingHistory.length) {
      return existingHistory;
    }

    const archivedFeatures = (await readFeatureItems(project.id, { includeArchived: true }))
      .filter((item) => Boolean(item?.archived) || String(item?.status || '').trim().toLowerCase() === 'done');
    if (!archivedFeatures.length) {
      return existingHistory;
    }

    const backfilledHistory = archivedFeatures.map((feature) => ({
      id: `features-backfill:${feature.code || feature.id}`,
      code: feature.code || feature.id,
      title: feature.title || feature.code || 'Feature',
      markdown: [
        `# Feature Fragment: ${feature.title || feature.code || 'Feature'}`,
        '',
        '## Executive Summary',
        '',
        feature.summary || feature.description || 'Backfilled from an existing feature record after fragment history tracking was introduced.',
      ].join('\n'),
      status: 'integrated',
      sourceScope: 'history',
      merged: true,
      mergedAt: feature.updatedAt || new Date().toISOString(),
      integratedAt: feature.updatedAt || new Date().toISOString(),
      updatedAt: feature.updatedAt || new Date().toISOString(),
      summary: feature.summary || feature.description || 'Backfilled fragment history entry.',
      revision: 1,
      lineageKey: feature.code || feature.id,
    }));

    await saveProjectDocument(project.id, 'features', {
      markdown: currentDocument?.markdown || '',
      mermaid: currentDocument?.mermaid || '',
      editorState: {
        ...currentEditorState,
        fragmentHistory: backfilledHistory,
      },
      filePath: currentDocument?.filePath || null,
      fileUpdatedAt: currentDocument?.fileUpdatedAt || null,
      fileMd5: currentDocument?.fileMd5 || '',
      dbMd5: currentDocument?.dbMd5 || '',
    });

    return backfilledHistory;
  }

  async function ensureLegacyBugsFragmentHistory(project) {
    const currentDocument = await readProjectDocument(project.id, 'bugs');
    const currentEditorState = currentDocument?.editorState && typeof currentDocument.editorState === 'object'
      ? currentDocument.editorState
      : {};
    const existingHistory = Array.isArray(currentEditorState.fragmentHistory)
      ? currentEditorState.fragmentHistory
      : [];
    if (existingHistory.length) {
      return existingHistory;
    }

    const archivedBugs = (await readBugItems(project.id, { includeArchived: true }))
      .filter((item) => Boolean(item?.archived) || Boolean(item?.completed));
    if (!archivedBugs.length) {
      return existingHistory;
    }

    const backfilledHistory = archivedBugs.map((bug) => ({
      id: `bugs-backfill:${bug.code || bug.id}`,
      code: bug.code || bug.id,
      title: bug.title || bug.code || 'Bug',
      markdown: [
        `# Bug Fragment: ${bug.title || bug.code || 'Bug'}`,
        '',
        '## Executive Summary',
        '',
        bug.summary || bug.currentBehavior || 'Backfilled from an existing bug record after fragment history tracking was introduced.',
        '',
        '## Current Behavior',
        '',
        bug.currentBehavior || bug.summary || 'Review current behavior.',
        '',
        '## Expected Behavior',
        '',
        bug.expectedBehavior || 'Review expected behavior.',
      ].join('\n'),
      status: 'integrated',
      sourceScope: 'history',
      merged: true,
      mergedAt: bug.updatedAt || new Date().toISOString(),
      integratedAt: bug.updatedAt || new Date().toISOString(),
      updatedAt: bug.updatedAt || new Date().toISOString(),
      summary: bug.summary || bug.currentBehavior || 'Backfilled fragment history entry.',
      revision: 1,
      lineageKey: bug.code || bug.id,
    }));

    await saveProjectDocument(project.id, 'bugs', {
      markdown: currentDocument?.markdown || '',
      mermaid: currentDocument?.mermaid || '',
      editorState: {
        ...currentEditorState,
        fragmentHistory: backfilledHistory,
      },
      filePath: currentDocument?.filePath || null,
      fileUpdatedAt: currentDocument?.fileUpdatedAt || null,
      fileMd5: currentDocument?.fileMd5 || '',
      dbMd5: currentDocument?.dbMd5 || '',
    });

    return backfilledHistory;
  }

  function mergeDetailEntries(existingEntries, importedEntries) {
    const existing = Array.isArray(existingEntries) ? existingEntries : [];
    const imported = Array.isArray(importedEntries) ? importedEntries : [];
    const merged = [...existing];
    for (const item of imported) {
      const title = String(item?.title || '').trim();
      const description = String(item?.description || '').trim();
      if (!title && !description) continue;
      const alreadyPresent = merged.some((entry) => (
        String(entry?.title || '').trim().toLowerCase() === title.toLowerCase()
        && String(entry?.description || '').trim().toLowerCase() === description.toLowerCase()
      ));
      if (!alreadyPresent) {
        merged.push({
          id: item?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          description,
        });
      }
    }
    return merged;
  }

  function mergeAiEnvironmentEditorState(project, currentState, importedState, fileName) {
    const baseState = currentState && typeof currentState === 'object'
      ? currentState
      : defaultAiEnvironmentEditorState(project);
    const nextState = importedState && typeof importedState === 'object'
      ? importedState
      : {};
    const currentOverview = baseState.overview && typeof baseState.overview === 'object' ? baseState.overview : {};
    const importedOverview = nextState.overview && typeof nextState.overview === 'object' ? nextState.overview : {};
    const importNotes = [];

    function mergeOverviewField(key, label) {
      const currentValue = String(currentOverview[key] || '').trim();
      const importedValue = String(importedOverview[key] || '').trim();
      if (!importedValue) return currentValue;
      if (!currentValue) return importedValue;
      if (currentValue === importedValue) return currentValue;
      importNotes.push(`Suggested ${label} from ${fileName || 'directive file'}:\n${importedValue}`);
      return currentValue;
    }

    const cleanAiCustomInstructions = typeof sanitizeAiEnvironmentCustomInstructions === 'function'
      ? sanitizeAiEnvironmentCustomInstructions
      : (value) => String(value || '').trim();
    const importedCustomInstructions = cleanAiCustomInstructions(nextState.customInstructions);
    const mergedCustomInstructions = [
      cleanAiCustomInstructions(baseState.customInstructions),
      importedCustomInstructions,
      importNotes.join('\n\n'),
    ].filter(Boolean).join('\n\n---\n\n');

    return {
      ...baseState,
      selectedProfileIds: [...new Set([
        ...(Array.isArray(baseState.selectedProfileIds) ? baseState.selectedProfileIds : []),
        ...(Array.isArray(nextState.selectedProfileIds) ? nextState.selectedProfileIds : []),
      ])],
      overview: {
        mission: mergeOverviewField('mission', 'Mission'),
        operatingModel: mergeOverviewField('operatingModel', 'Operating Model'),
        communicationStyle: mergeOverviewField('communicationStyle', 'Communication Style'),
        versionDate: new Date().toISOString(),
      },
      requiredBehaviors: mergeDetailEntries(baseState.requiredBehaviors, nextState.requiredBehaviors),
      moduleUpdateRules: mergeDetailEntries(baseState.moduleUpdateRules, nextState.moduleUpdateRules),
      dataPhrasingRules: mergeDetailEntries(baseState.dataPhrasingRules, nextState.dataPhrasingRules),
      avoidRules: mergeDetailEntries(baseState.avoidRules, nextState.avoidRules),
      handoffChecklist: mergeDetailEntries(baseState.handoffChecklist, nextState.handoffChecklist),
      customInstructions: mergedCustomInstructions,
    };
  }

  app.get('/api/projects/:id/roadmap', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      const state = await syncRoadmapDocument(project);
      res.json(state);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load roadmap' });
    }
  });

  app.post('/api/projects/:id/roadmap/phases', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const phase = await saveRoadmapPhase({
        projectId: project.id,
        name: req.body && req.body.name,
        summary: req.body && req.body.summary,
        goal: req.body && req.body.goal,
        status: req.body && req.body.status,
        targetDate: req.body && req.body.targetDate,
        afterPhaseId: req.body && req.body.afterPhaseId,
        archived: req.body && req.body.archived,
        sortOrder: req.body && req.body.sortOrder !== undefined ? req.body.sortOrder : await nextRoadmapPhaseSortOrder(project.id),
      });
      await syncRoadmapDependentDocuments(project);
      await emitProjectFamilyActivity(project.id, 'roadmap.phase_created', {
        phaseId: phase.id,
        status: phase.status || null,
      });
      res.json(phase);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to create roadmap phase' });
    }
  });

  app.put('/api/projects/:id/roadmap/phases/:phaseId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const phase = await getRoadmapPhaseById(project.id, req.params.phaseId);
      if (!phase) return res.status(404).json({ error: 'Roadmap phase not found' });
      const saved = await saveRoadmapPhase({
        ...phase,
        ...req.body,
        id: phase.id,
        projectId: project.id,
      });
      await syncRoadmapDependentDocuments(project);
      await emitProjectFamilyActivity(project.id, 'roadmap.phase_updated', {
        phaseId: saved.id,
        status: saved.status || null,
      });
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update roadmap phase' });
    }
  });

  app.delete('/api/projects/:id/roadmap/phases/:phaseId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      await deleteRoadmapPhase(project.id, req.params.phaseId);
      await syncRoadmapDependentDocuments(project);
      await emitProjectFamilyActivity(project.id, 'roadmap.phase_deleted', {
        phaseId: req.params.phaseId,
      });
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to delete roadmap phase' });
    }
  });

  app.get('/api/projects/:id/roadmap/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      await syncRoadmapFragmentsForProject(project);
      res.json({ fragments: await readRoadmapFragments(project.id, { includeMerged: true }) });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load roadmap fragments' });
    }
  });

  app.post('/api/projects/:id/roadmap/fragments/:fragmentId/merge', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const fragment = await getRoadmapFragmentById(project.id, req.params.fragmentId);
      if (!fragment) return res.status(404).json({ error: 'Roadmap fragment not found' });

      await saveRoadmapFragment({
        ...fragment,
        merged: true,
        mergedAt: fragment.mergedAt || new Date().toISOString(),
        status: fragment.status === 'integrated' ? 'integrated' : 'merged',
        filePath: null,
        fileUpdatedAt: null,
        fileMd5: '',
      });
      if (fragment.filePath) {
        tryDeleteFile(fragment.filePath, `phase5: merge roadmap fragment ${fragment.id}`);
      }
      await emitProjectFamilyActivity(project.id, 'roadmap.fragment_merged', {
        fragmentId: fragment.id,
      });

      res.json({
        roadmap: await syncRoadmapDependentDocuments(project),
        fragment: await getRoadmapFragmentById(project.id, fragment.id),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to merge roadmap fragment' });
    }
  });

  app.post('/api/projects/:id/roadmap/fragments/:fragmentId/integrate', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const fragment = await getRoadmapFragmentById(project.id, req.params.fragmentId);
      if (!fragment) return res.status(404).json({ error: 'Roadmap fragment not found' });

      await applyRoadmapFragment(project, fragment);
      await saveRoadmapFragment({
        ...fragment,
        merged: true,
        mergedAt: fragment.mergedAt || new Date().toISOString(),
        integratedAt: new Date().toISOString(),
        status: 'integrated',
        filePath: null,
        fileUpdatedAt: null,
        fileMd5: '',
      });
      if (fragment.filePath) {
        tryDeleteFile(fragment.filePath, `phase5: integrate roadmap fragment ${fragment.id}`);
      }
      await emitProjectFamilyActivity(project.id, 'roadmap.fragment_integrated', {
        fragmentId: fragment.id,
      });

      res.json({
        roadmap: await syncRoadmapDependentDocuments(project),
        features: await syncFeaturesDocument(project),
        fragment: await getRoadmapFragmentById(project.id, fragment.id),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to integrate roadmap fragment' });
    }
  });

  app.get('/api/projects/:id/features', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      const state = normalizeWorkspacePlugins(project && project.workspacePlugins).includes('features')
        ? await syncFeaturesDocument(project)
        : await buildFeaturesState(project);
      res.json(state);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load features' });
    }
  });

  app.get('/api/projects/:id/features/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('features')) {
        return res.status(400).json({ error: 'Features plugin is not enabled for this project' });
      }
      const legacyHistory = await ensureLegacyFeaturesFragmentHistory(project);
      const featuresDocument = await readProjectDocument(project.id, 'features');
      const historyFragments = Array.isArray(featuresDocument?.editorState?.fragmentHistory)
        ? featuresDocument.editorState.fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment, fragment.sourceScope || 'history'))
        : legacyHistory.map((fragment) => buildArchivedFragmentEntry(fragment, fragment.sourceScope || 'history'));
      const fragmentPaths = [
        ...((typeof listProjectFragmentFilesForModule === 'function'
          ? listProjectFragmentFilesForModule(project, 'features', moduleFragmentRegex('features'))
          : listProjectFragmentFiles(project, moduleFragmentRegex('features'))).map((filePath) => ({ filePath, sourceScope: 'project' }))),
        ...listSharedModuleFragmentFiles('features').map((filePath) => ({ filePath, sourceScope: 'shared' })),
      ];
      const fragments = mergeFragmentLists(
        fragmentPaths
          .map((entry) => safelyBuildGenericModuleFragmentEntry(entry.filePath, entry.sourceScope, 'features'))
          .filter(Boolean),
        historyFragments
      )
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
      res.json({
        fragments,
        paths: {
          projectFragmentsDir: ensureProjectFragmentsDir(project),
          sharedFragmentsDir: ensureSharedFragmentsDir(),
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load feature fragments' });
    }
  });

  app.post('/api/projects/:id/features/fragments/consume', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('features')) {
        return res.status(400).json({ error: 'Features plugin is not enabled for this project' });
      }
      const fileName = req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '';
      const sourceScope = req.body && typeof req.body.sourceScope === 'string' ? req.body.sourceScope : 'project';
      if (!fileName) return res.status(400).json({ error: 'Feature fragment fileName is required' });
      const fragmentPath = (sourceScope === 'shared'
        ? [
            path.join(ensureSharedFragmentsDir(), fileName),
            path.join(getFragmentsRootDir(), 'shared', 'fragments', fileName),
          ]
        : [
            path.join(ensureProjectFragmentsDir(project), fileName),
          ]).find((candidate) => fs.existsSync(candidate));
      if (!fragmentPath) return res.status(404).json({ error: 'Feature fragment file not found' });
      const snapshot = readManagedFileSnapshot(fragmentPath);
      const details = extractFeatureOrBugFragmentDetails(snapshot?.markdown || '', fileName.replace(/\.md$/i, ''));
      const existingFeatures = await readFeatureItems(project.id, { includeArchived: true });
      const existing = details.code
        ? existingFeatures.find((item) => String(item?.code || '').trim().toLowerCase() === details.code.toLowerCase())
        : null;
      const savedFeature = await saveFeatureItem({
        ...(existing || {}),
        projectId: project.id,
        id: existing?.id,
        title: details.title || existing?.title || fileName.replace(/\.md$/i, ''),
        summary: details.summary || existing?.summary || '',
        description: details.body || existing?.description || details.summary || '',
        status: existing?.status || 'planned',
        planningBucket: existing?.planningBucket || 'planned',
        archived: false,
      });
      await appendDocumentFragmentHistory(project, 'features', {
        id: `features:${details.code || savedFeature.code || fileName}`,
        code: details.code || savedFeature.code || fileName.replace(/\.md$/i, ''),
        title: details.title || savedFeature.title || fileName.replace(/\.md$/i, ''),
        markdown: snapshot?.markdown || '',
        status: 'integrated',
        fileName,
        sourceScope,
        merged: true,
        mergedAt: new Date().toISOString(),
        integratedAt: new Date().toISOString(),
        updatedAt: snapshot?.updatedAt || new Date().toISOString(),
        summary: details.summary || savedFeature.summary || '',
      });
      tryDeleteFile(fragmentPath, `phase5: consume features fragment ${fileName}`);
      await emitProjectFamilyActivity(project.id, 'feature.fragment_consumed', {
        featureId: savedFeature.id,
        code: savedFeature.code || details.code || null,
      });
      res.json({
        features: await syncFeaturesDocument(project, { skipImport: true }),
        roadmap: await syncRoadmapDependentDocuments(project, { skipImport: true }),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to consume feature fragment' });
    }
  });

  app.post('/api/projects/:id/features', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('features')) {
        return res.status(400).json({ error: 'Features plugin is not enabled for this project' });
      }
      if (!req.body || !String(req.body.title || '').trim()) return res.status(400).json({ error: 'Feature title is required' });
      const feature = await saveFeatureItem({
        projectId: project.id,
        title: req.body.title,
        summary: req.body.summary ?? req.body.description,
        description: req.body.description,
        category: req.body.category,
        status: req.body.status,
        priority: req.body.priority,
        assignedTo: req.body.assignedTo,
        dueDate: req.body.dueDate,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        roadmapPhaseId: req.body.roadmapPhaseId || null,
        taskId: req.body.taskId || null,
        planningBucket: req.body.planningBucket || null,
        dependencyIds: req.body.dependencyIds,
        affectedModuleKeys: req.body.affectedModuleKeys,
        progress: req.body.progress,
        milestone: req.body.milestone,
        sortOrder: req.body.sortOrder,
        archived: req.body.archived,
      });
      await syncFeaturesDocument(project, { skipImport: true });
      await syncRoadmapDependentDocuments(project, { skipImport: true });
      await emitProjectFamilyActivity(project.id, 'feature.created', {
        featureId: feature.id,
        code: feature.code || null,
        status: feature.status || null,
      });
      res.json(feature);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to create feature' });
    }
  });

  app.put('/api/projects/:id/features/:featureId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const feature = await getFeatureItemById(project.id, req.params.featureId);
      if (!feature) return res.status(404).json({ error: 'Feature not found' });
      const nextPayload = {
        ...feature,
        ...req.body,
        id: feature.id,
        projectId: project.id,
      };
      if (req.body?.archived === undefined) delete nextPayload.archived;
      const saved = await saveFeatureItem(nextPayload);
      await syncFeaturesDocument(project, { skipImport: true });
      await syncRoadmapDependentDocuments(project, { skipImport: true });
      await emitProjectFamilyActivity(project.id, 'feature.updated', {
        featureId: saved.id,
        code: saved.code || null,
        status: saved.status || null,
      });
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update feature' });
    }
  });

  app.delete('/api/projects/:id/features/:featureId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const feature = await getFeatureItemById(project.id, req.params.featureId);
      if (!feature) return res.status(404).json({ error: 'Feature not found' });
      await deleteFeatureItem(project.id, req.params.featureId);
      const fragment = await getPrdFragmentByFeatureId(project.id, req.params.featureId);
      if (fragment) {
        await deletePrdFragment(project.id, fragment.id);
        if (fragment.filePath) tryDeleteFile(fragment.filePath, `phase5: delete prd fragment for feature ${fragment.id}`);
      }
      await syncFeaturesDocument(project, { skipImport: true });
      await syncRoadmapDependentDocuments(project, { skipImport: true });
      await emitProjectFamilyActivity(project.id, 'feature.deleted', {
        featureId: req.params.featureId,
        code: feature.code || null,
      });
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to delete feature' });
    }
  });

  app.get('/api/projects/:id/bugs', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      const state = normalizeWorkspacePlugins(project && project.workspacePlugins).includes('bugs')
        ? await syncBugsDocument(project)
        : await buildBugsState(project);
      res.json(state);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load bugs' });
    }
  });

  app.get('/api/projects/:id/bugs/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('bugs')) {
        return res.status(400).json({ error: 'Bugs plugin is not enabled for this project' });
      }
      const legacyHistory = await ensureLegacyBugsFragmentHistory(project);
      const bugsDocument = await readProjectDocument(project.id, 'bugs');
      const historyFragments = Array.isArray(bugsDocument?.editorState?.fragmentHistory)
        ? bugsDocument.editorState.fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment, fragment.sourceScope || 'history'))
        : legacyHistory.map((fragment) => buildArchivedFragmentEntry(fragment, fragment.sourceScope || 'history'));
      const fragmentPaths = [
        ...((typeof listProjectFragmentFilesForModule === 'function'
          ? listProjectFragmentFilesForModule(project, 'bugs', moduleFragmentRegex('bugs'))
          : listProjectFragmentFiles(project, moduleFragmentRegex('bugs'))).map((filePath) => ({ filePath, sourceScope: 'project' }))),
        ...listSharedModuleFragmentFiles('bugs').map((filePath) => ({ filePath, sourceScope: 'shared' })),
      ];
      const fragments = mergeFragmentLists(
        fragmentPaths
          .map((entry) => safelyBuildGenericModuleFragmentEntry(entry.filePath, entry.sourceScope, 'bugs'))
          .filter(Boolean),
        historyFragments
      )
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
      res.json({
        fragments,
        paths: {
          projectFragmentsDir: ensureProjectFragmentsDir(project),
          sharedFragmentsDir: ensureSharedFragmentsDir(),
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load bug fragments' });
    }
  });

  app.post('/api/projects/:id/bugs/fragments/consume', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('bugs')) {
        return res.status(400).json({ error: 'Bugs plugin is not enabled for this project' });
      }
      const fileName = req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '';
      const sourceScope = req.body && typeof req.body.sourceScope === 'string' ? req.body.sourceScope : 'project';
      if (!fileName) return res.status(400).json({ error: 'Bug fragment fileName is required' });
      const fragmentPath = (sourceScope === 'shared'
        ? [
            path.join(ensureSharedFragmentsDir(), fileName),
            path.join(getFragmentsRootDir(), 'shared', 'fragments', fileName),
          ]
        : [
            path.join(ensureProjectFragmentsDir(project), fileName),
          ]).find((candidate) => fs.existsSync(candidate));
      if (!fragmentPath) return res.status(404).json({ error: 'Bug fragment file not found' });
      const snapshot = readManagedFileSnapshot(fragmentPath);
      const details = extractFeatureOrBugFragmentDetails(snapshot?.markdown || '', fileName.replace(/\.md$/i, ''));
      const existingBugs = await readBugItems(project.id, { includeArchived: true });
      const existing = details.code
        ? existingBugs.find((item) => String(item?.code || '').trim().toLowerCase() === details.code.toLowerCase())
        : null;
      const savedBug = await saveBugItem({
        ...(existing || {}),
        projectId: project.id,
        id: existing?.id,
        title: details.title || existing?.title || fileName.replace(/\.md$/i, ''),
        summary: details.summary || existing?.summary || '',
        currentBehavior: details.currentBehavior || existing?.currentBehavior || details.summary || existing?.summary || '',
        expectedBehavior: details.expectedBehavior || existing?.expectedBehavior || 'Review expected behavior and complete this bug record.',
        status: existing?.status || 'open',
        planningBucket: existing?.planningBucket || 'planned',
        archived: false,
      });
      await appendDocumentFragmentHistory(project, 'bugs', {
        id: `bugs:${details.code || savedBug.code || fileName}`,
        code: details.code || savedBug.code || fileName.replace(/\.md$/i, ''),
        title: details.title || savedBug.title || fileName.replace(/\.md$/i, ''),
        markdown: snapshot?.markdown || '',
        status: 'integrated',
        fileName,
        sourceScope,
        merged: true,
        mergedAt: new Date().toISOString(),
        integratedAt: new Date().toISOString(),
        updatedAt: snapshot?.updatedAt || new Date().toISOString(),
        summary: details.summary || savedBug.summary || '',
      });
      tryDeleteFile(fragmentPath, `phase5: consume bugs fragment ${fileName}`);
      await emitProjectFamilyActivity(project.id, 'bug.fragment_consumed', {
        bugId: savedBug.id,
        code: savedBug.code || details.code || null,
      });
      res.json({
        bugs: await syncBugsDocument(project, { skipImport: true }),
        roadmap: await syncRoadmapDependentDocuments(project, { skipImport: true }),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to consume bug fragment' });
    }
  });

  app.post('/api/projects/:id/bugs', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('bugs')) {
        return res.status(400).json({ error: 'Bugs plugin is not enabled for this project' });
      }
      if (!req.body || !String(req.body.title || '').trim()) return res.status(400).json({ error: 'Bug title is required' });
      const bug = await saveBugItem({
        projectId: project.id,
        title: req.body.title,
        summary: req.body.summary,
        currentBehavior: req.body.currentBehavior,
        expectedBehavior: req.body.expectedBehavior,
        category: req.body.category,
        severity: req.body.severity,
        status: req.body.status,
        assignedTo: req.body.assignedTo,
        dueDate: req.body.dueDate,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        taskId: req.body.taskId || null,
        planningBucket: req.body.planningBucket || null,
        roadmapPhaseId: req.body.roadmapPhaseId || null,
        dependencyIds: req.body.dependencyIds,
        affectedModuleKeys: req.body.affectedModuleKeys,
        associationHints: req.body.associationHints,
        progress: req.body.progress,
        milestone: req.body.milestone,
        sortOrder: req.body.sortOrder,
        completed: req.body.completed,
        regressed: req.body.regressed,
        archived: req.body.archived,
      });
      await syncBugsDocument(project, { skipImport: true });
      await syncRoadmapDependentDocuments(project, { skipImport: true });
      await emitProjectFamilyActivity(project.id, 'bug.created', {
        bugId: bug.id,
        code: bug.code || null,
        status: bug.status || null,
      });
      res.json(bug);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to create bug' });
    }
  });

  app.put('/api/projects/:id/bugs/:bugId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const bug = await getBugItemById(project.id, req.params.bugId);
      if (!bug) return res.status(404).json({ error: 'Bug not found' });
      const nextPayload = {
        ...bug,
        ...req.body,
        id: bug.id,
        projectId: project.id,
      };
      if (req.body?.archived === undefined) delete nextPayload.archived;
      if (req.body?.completed === undefined) delete nextPayload.completed;
      if (req.body?.regressed === undefined) delete nextPayload.regressed;
      const saved = await saveBugItem(nextPayload);
      await syncBugsDocument(project, { skipImport: true });
      await syncRoadmapDependentDocuments(project, { skipImport: true });
      await emitProjectFamilyActivity(project.id, 'bug.updated', {
        bugId: saved.id,
        code: saved.code || null,
        status: saved.status || null,
      });
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update bug' });
    }
  });

  app.delete('/api/projects/:id/bugs/:bugId', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      await deleteBugItem(project.id, req.params.bugId);
      await syncBugsDocument(project, { skipImport: true });
      await syncRoadmapDependentDocuments(project, { skipImport: true });
      await emitProjectFamilyActivity(project.id, 'bug.deleted', {
        bugId: req.params.bugId,
      });
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to delete bug' });
    }
  });

  app.get('/api/projects/:id/prd/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      await syncPrdFragmentsForProject(project);
      res.json({ fragments: await readPrdFragments(project.id, { includeMerged: true }) });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load PRD fragments' });
    }
  });

  app.post('/api/projects/:id/prd/fragments/:fragmentId/merge', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const fragment = await getPrdFragmentById(project.id, req.params.fragmentId);
      if (!fragment) return res.status(404).json({ error: 'PRD fragment not found' });

      const prdState = await buildPrdState(project);
      const feature = fragment.featureId ? await getFeatureItemById(project.id, fragment.featureId) : null;
      const nextEditorState = markPrdFragmentMergedState(prdState.editorState, fragment, feature);
      await saveProjectDocument(project.id, 'prd', {
        markdown: renderPrdEditorStateMarkdown(project, nextEditorState, prdState.fragments),
        mermaid: prdState.mermaid,
        editorState: nextEditorState,
      });
      const mergedFileName = fragment.mergedFileName || fragment.fileName || (fragment.filePath ? path.basename(fragment.filePath) : null);
      await savePrdFragment({
        ...fragment,
        merged: true,
        mergedAt: new Date().toISOString(),
        status: 'merged',
        mergedFileName,
      });
      if (fragment.filePath) {
        tryDeleteFile(fragment.filePath, `phase5: merge prd fragment ${fragment.id}`);
      }
      await cleanupMergedPrdFragmentFiles(project);
      await emitProjectFamilyActivity(project.id, 'prd.fragment_merged', {
        fragmentId: fragment.id,
      });

      const nextPrdState = await syncPrdDocument(project, { skipImport: true });
      res.json({
        prd: nextPrdState,
        fragment: await getPrdFragmentById(project.id, fragment.id),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to merge PRD fragment' });
    }
  });

  app.post('/api/projects/:id/prd/fragments/:fragmentId/integrate', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const fragment = await getPrdFragmentById(project.id, req.params.fragmentId);
      if (!fragment) return res.status(404).json({ error: 'PRD fragment not found' });

      const prdState = await buildPrdState(project);
      const feature = fragment.featureId ? await getFeatureItemById(project.id, fragment.featureId) : null;
      const integratedFeature = feature ? { ...feature, archived: true, status: 'done' } : null;
      const nextEditorState = integratePrdFragmentState(prdState.editorState, fragment, integratedFeature);
      await saveProjectDocument(project.id, 'prd', {
        markdown: renderPrdEditorStateMarkdown(project, nextEditorState, prdState.fragments),
        mermaid: prdState.mermaid,
        editorState: nextEditorState,
      });
      await savePrdFragment({
        ...fragment,
        merged: true,
        mergedAt: fragment.mergedAt || new Date().toISOString(),
        status: 'integrated',
        mergedFileName: fragment.mergedFileName || fragment.fileName || (fragment.filePath ? path.basename(fragment.filePath) : null),
      });
      if (fragment.filePath) {
        tryDeleteFile(fragment.filePath, `phase5: integrate prd fragment ${fragment.id}`);
      }
      if (feature) {
        await saveFeatureItem({
          ...feature,
          archived: true,
          status: 'done',
        });
      }
      await emitProjectFamilyActivity(project.id, 'prd.fragment_integrated', {
        fragmentId: fragment.id,
        featureId: feature?.id || null,
      });

      const nextPrdState = await syncPrdDocument(project, { skipImport: true });
      const nextFeaturesState = await syncFeaturesDocument(project, { skipImport: true });
      res.json({
        prd: nextPrdState,
        features: nextFeaturesState,
        fragment: await getPrdFragmentById(project.id, fragment.id),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to integrate PRD fragment' });
    }
  });

  app.get('/api/projects/:id/prd', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      const state = normalizeWorkspacePlugins(project && project.workspacePlugins).includes('prd')
        ? await syncPrdDocument(project)
        : await buildPrdState(project);
      res.json(state);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load PRD' });
    }
  });

  app.put('/api/projects/:id/prd', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!normalizeWorkspacePlugins(project.workspacePlugins).includes('prd')) {
        return res.status(400).json({ error: 'Product Requirement plugin is not enabled for this project' });
      }
      const fragments = await readPrdFragments(project.id, { includeMerged: true });
      const requestedEditorState = req.body && req.body.editorState && typeof req.body.editorState === 'object'
        ? req.body.editorState
        : buildDefaultPrdEditorState(project);
      const nextEditorState = normalizeDocumentEditorStateForStorage(project, 'prd', requestedEditorState);
      const nextState = {
        markdown: renderPrdEditorStateMarkdown(project, nextEditorState, fragments),
        mermaid: req.body && typeof req.body.mermaid === 'string' ? req.body.mermaid : 'flowchart TD\n  product["Product"] --> value["Value"]',
        editorState: nextEditorState,
      };
      await saveProjectDocument(project.id, 'prd', nextState);
      await emitProjectFamilyActivity(project.id, 'prd.saved', {
        moduleKey: 'prd',
      });
      const syncedState = await syncPrdDocument(project);
      res.json(syncedState);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save PRD' });
    }
  });

  app.get('/api/projects/:id/architecture', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'architecture')) {
        return res.status(400).json({ error: 'Architecture module is not enabled for this project' });
      }
      res.json(await syncArchitectureDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load Architecture' });
    }
  });

  app.put('/api/projects/:id/architecture', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'architecture')) {
        return res.status(400).json({ error: 'Architecture module is not enabled for this project' });
      }
      const nextEditorState = req.body && req.body.editorState && typeof req.body.editorState === 'object'
        ? req.body.editorState
        : defaultArchitectureEditorState(project);
      await saveProjectDocument(project.id, 'architecture', {
        markdown: renderArchitectureEditorStateMarkdown(project, nextEditorState),
        mermaid: req.body && typeof req.body.mermaid === 'string' && String(req.body.mermaid).trim()
          ? req.body.mermaid
          : defaultArchitectureMermaid(project, nextEditorState),
        editorState: nextEditorState,
      });
      await emitProjectFamilyActivity(project.id, 'module_document.saved', {
        moduleKey: 'architecture',
      });
      res.json(await syncArchitectureDocument(project, { skipImport: true }));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save Architecture' });
    }
  });

  app.get('/api/projects/:id/architecture/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'architecture')) {
        return res.status(400).json({ error: 'Architecture module is not enabled for this project' });
      }
      const architectureDocument = await syncArchitectureDocument(project, { skipImport: true });
      const fragmentHistory = Array.isArray(architectureDocument?.editorState?.fragmentHistory)
        ? architectureDocument.editorState.fragmentHistory
        : [];
      const fragmentPaths = [
        ...((typeof listProjectFragmentFilesForModule === 'function'
          ? listProjectFragmentFilesForModule(project, 'architecture', moduleFragmentRegex('architecture'))
          : listProjectFragmentFiles(project, moduleFragmentRegex('architecture'))).map((filePath) => ({ filePath, sourceScope: 'project' }))),
        ...listSharedModuleFragmentFiles('architecture').map((filePath) => ({ filePath, sourceScope: 'shared' })),
      ];
      const fileFragments = fragmentPaths
        .map((entry) => buildGenericModuleFragmentEntry(readManagedFileSnapshot(entry.filePath), entry.filePath, entry.sourceScope, 'architecture'))
        .filter(Boolean);
      const historyFragments = fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment));
      const fragments = mergeFragmentLists(fileFragments, historyFragments)
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
      res.json({
        fragments,
        paths: {
          projectFragmentsDir: ensureProjectFragmentsDir(project),
          sharedFragmentsDir: ensureSharedFragmentsDir(),
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load Architecture fragments' });
    }
  });

  app.post('/api/projects/:id/architecture/fragments/consume', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'architecture')) {
        return res.status(400).json({ error: 'Architecture module is not enabled for this project' });
      }
      const fileName = req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '';
      const sourceScope = req.body && typeof req.body.sourceScope === 'string' ? req.body.sourceScope : 'project';
      if (!fileName) return res.status(400).json({ error: 'Architecture fragment fileName is required' });
      const fragmentPath = (sourceScope === 'shared'
        ? [
            path.join(ensureSharedFragmentsDir(), fileName),
            path.join(getFragmentsRootDir(), 'shared', 'fragments', fileName),
          ]
        : [
            path.join(ensureProjectFragmentsDir(project), fileName),
          ]).find((candidate) => fs.existsSync(candidate));
      if (!fragmentPath) return res.status(404).json({ error: 'Architecture fragment file not found' });
      const snapshot = readManagedFileSnapshot(fragmentPath);
      const currentState = await syncArchitectureDocument(project, { skipImport: true });
      const fragmentEntry = buildGenericModuleFragmentEntry(snapshot, fragmentPath, sourceScope, 'architecture');
      const nextEditorState = mergeGenericModuleEditorState(
        project,
        currentState.editorState || defaultArchitectureEditorState(project),
        fragmentEntry,
        'architecture'
      );
      await saveProjectDocument(project.id, 'architecture', {
        markdown: renderArchitectureEditorStateMarkdown(project, nextEditorState),
        mermaid: currentState?.mermaid || '',
        editorState: nextEditorState,
      });
      tryDeleteFile(fragmentPath, `phase5: consume architecture fragment ${fileName}`);
      await emitProjectFamilyActivity(project.id, 'module_document.fragment_consumed', {
        moduleKey: 'architecture',
        fileName,
      });
      res.json({
        architecture: await syncArchitectureDocument(project, { skipImport: true }),
        fragments: mergeFragmentLists(
          [
            ...((typeof listProjectFragmentFilesForModule === 'function'
              ? listProjectFragmentFilesForModule(project, 'architecture', moduleFragmentRegex('architecture'))
              : listProjectFragmentFiles(project, moduleFragmentRegex('architecture'))).map((filePath) => ({ filePath, sourceScope: 'project' }))),
            ...listSharedModuleFragmentFiles('architecture').map((filePath) => ({ filePath, sourceScope: 'shared' })),
          ]
            .map((entry) => buildGenericModuleFragmentEntry(readManagedFileSnapshot(entry.filePath), entry.filePath, entry.sourceScope, 'architecture'))
            .filter(Boolean),
          nextEditorState.fragmentHistory || []
        ).sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' })),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to consume Architecture fragment' });
    }
  });

  app.get('/api/projects/:id/module-documents/:moduleKey', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const moduleKey = String(req.params.moduleKey || '').trim().toLowerCase();
      if (!GENERIC_MODULE_KEYS.has(moduleKey)) {
        return res.status(404).json({ error: 'Unsupported module document' });
      }
      if (!isProjectModuleEnabled(project, moduleKey)) {
        return res.status(400).json({ error: `${moduleKey} module is not enabled for this project` });
      }
      res.json(await syncGenericModuleDocument(project, moduleKey));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load module document' });
    }
  });

  app.put('/api/projects/:id/module-documents/:moduleKey', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const moduleKey = String(req.params.moduleKey || '').trim().toLowerCase();
      if (!GENERIC_MODULE_KEYS.has(moduleKey)) {
        return res.status(404).json({ error: 'Unsupported module document' });
      }
      if (!isProjectModuleEnabled(project, moduleKey)) {
        return res.status(400).json({ error: `${moduleKey} module is not enabled for this project` });
      }
      const currentState = await buildGenericModuleDocumentState(project, moduleKey);
      const nextEditorState = req.body && req.body.editorState && typeof req.body.editorState === 'object'
        ? req.body.editorState
        : currentState.editorState;
      await saveProjectDocument(project.id, moduleKey, {
        markdown: renderModuleDocumentEditorStateMarkdown(project, moduleKey, nextEditorState),
        mermaid: req.body && typeof req.body.mermaid === 'string' ? req.body.mermaid : currentState.mermaid,
        editorState: nextEditorState,
      });
      await emitProjectFamilyActivity(project.id, 'module_document.saved', {
        moduleKey,
      });
      res.json(await syncGenericModuleDocument(project, moduleKey, { skipImport: true }));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save module document' });
    }
  });

  app.get('/api/projects/:id/module-documents/:moduleKey/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const moduleKey = String(req.params.moduleKey || '').trim().toLowerCase();
      if (!GENERIC_MODULE_KEYS.has(moduleKey)) {
        return res.status(404).json({ error: 'Unsupported module document' });
      }
      if (!isProjectModuleEnabled(project, moduleKey)) {
        return res.status(400).json({ error: `${moduleKey} module is not enabled for this project` });
      }
      const fragmentPaths = [
        ...((typeof listProjectFragmentFilesForModule === 'function'
          ? listProjectFragmentFilesForModule(project, moduleKey, moduleFragmentRegex(moduleKey))
          : listProjectFragmentFiles(project, moduleFragmentRegex(moduleKey))).map((filePath) => ({ filePath, sourceScope: 'project' }))),
        ...listSharedModuleFragmentFiles(moduleKey).map((filePath) => ({ filePath, sourceScope: 'shared' })),
      ];
      const documentState = await syncGenericModuleDocument(project, moduleKey, { skipImport: true });
      const historyFragments = Array.isArray(documentState?.editorState?.fragmentHistory)
        ? documentState.editorState.fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment))
        : [];
      const fragments = mergeFragmentLists(
        fragmentPaths
          .map((entry) => safelyBuildGenericModuleFragmentEntry(entry.filePath, entry.sourceScope, moduleKey))
          .filter(Boolean),
        historyFragments
      )
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
      res.json({
        fragments,
        paths: {
          projectFragmentsDir: ensureProjectFragmentsDir(project),
          sharedFragmentsDir: ensureSharedFragmentsDir(),
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load module document fragments' });
    }
  });

  app.post('/api/projects/:id/module-documents/:moduleKey/fragments/consume', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const moduleKey = String(req.params.moduleKey || '').trim().toLowerCase();
      if (!GENERIC_MODULE_KEYS.has(moduleKey)) {
        return res.status(404).json({ error: 'Unsupported module document' });
      }
      if (!isProjectModuleEnabled(project, moduleKey)) {
        return res.status(400).json({ error: `${moduleKey} module is not enabled for this project` });
      }
      const fileName = req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '';
      const sourceScope = req.body && typeof req.body.sourceScope === 'string' ? req.body.sourceScope : 'project';
      if (!fileName) return res.status(400).json({ error: 'Module fragment fileName is required' });
      const fragmentPath = (sourceScope === 'shared'
        ? [
            path.join(ensureSharedFragmentsDir(), fileName),
            path.join(getFragmentsRootDir(), 'shared', 'fragments', fileName),
          ]
        : [
            path.join(ensureProjectFragmentsDir(project), fileName),
          ]).find((candidate) => fs.existsSync(candidate));
      if (!fragmentPath) return res.status(404).json({ error: 'Module fragment file not found' });
      const snapshot = readManagedFileSnapshot(fragmentPath);
      const currentState = await syncGenericModuleDocument(project, moduleKey, { skipImport: true });
      const fragmentEntry = buildGenericModuleFragmentEntry(snapshot, fragmentPath, sourceScope, moduleKey);
      const nextEditorState = mergeGenericModuleEditorState(project, currentState.editorState, fragmentEntry, moduleKey);
      await saveProjectDocument(project.id, moduleKey, {
        markdown: renderModuleDocumentEditorStateMarkdown(project, moduleKey, nextEditorState),
        mermaid: currentState?.mermaid || '',
        editorState: nextEditorState,
      });
      tryDeleteFile(fragmentPath, `phase5: consume ${moduleKey} fragment ${fileName}`);
      await emitProjectFamilyActivity(project.id, 'module_document.fragment_consumed', {
        moduleKey,
        fileName,
      });
      const [documentState, fragments] = await Promise.all([
        syncGenericModuleDocument(project, moduleKey, { skipImport: true }),
        (async () => {
          const remaining = [
            ...((typeof listProjectFragmentFilesForModule === 'function'
              ? listProjectFragmentFilesForModule(project, moduleKey, moduleFragmentRegex(moduleKey))
              : listProjectFragmentFiles(project, moduleFragmentRegex(moduleKey))).map((filePath) => ({ filePath, sourceScope: 'project' }))),
            ...listSharedModuleFragmentFiles(moduleKey).map((filePath) => ({ filePath, sourceScope: 'shared' })),
          ];
          return mergeFragmentLists(
            remaining
              .map((entry) => safelyBuildGenericModuleFragmentEntry(entry.filePath, entry.sourceScope, moduleKey))
              .filter(Boolean),
            Array.isArray(nextEditorState.fragmentHistory)
              ? nextEditorState.fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment))
              : []
          )
            .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
        })(),
      ]);
      res.json({
        document: documentState,
        fragments,
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to consume module fragment' });
    }
  });

  app.get('/api/projects/:id/database-schema', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'database_schema')) {
        return res.status(400).json({ error: 'Database Schema module is not enabled for this project' });
      }
      res.json(await syncDatabaseSchemaDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load Database Schema' });
    }
  });

  app.get('/api/projects/:id/database-schema/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'database_schema')) {
        return res.status(400).json({ error: 'Database Schema module is not enabled for this project' });
      }
      const schemaDocument = await syncDatabaseSchemaDocument(project);
      const fragmentHistory = Array.isArray(schemaDocument?.editorState?.fragmentHistory)
        ? schemaDocument.editorState.fragmentHistory
        : [];
      const fragmentPaths = [
        ...((typeof listProjectFragmentFilesForModule === 'function'
          ? listProjectFragmentFilesForModule(project, 'database_schema', /^DATABASE_SCHEMA_FRAGMENT_.*\.md$/i)
          : listProjectFragmentFiles(project, /^DATABASE_SCHEMA_FRAGMENT_.*\.md$/i)).map((filePath) => ({ filePath, sourceScope: 'project' }))),
        ...listProjectDocFiles(project, /^DATABASE_SCHEMA_FRAGMENT_.*\.md$/i).map((filePath) => ({ filePath, sourceScope: 'legacy_project_docs' })),
        ...listSharedDatabaseSchemaFragmentFiles().map((filePath) => ({ filePath, sourceScope: 'shared' })),
      ];
      const fileFragments = fragmentPaths
        .map((filePath) => buildDatabaseSchemaFragmentListEntry(
          readManagedFileSnapshot(filePath.filePath),
          filePath.filePath,
          filePath.sourceScope
        ))
        .filter(Boolean);
      const historyFragments = fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment, fragment.sourceScope || 'history'));
      const fragments = mergeFragmentLists(fileFragments, historyFragments)
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
      res.json({
        fragments,
        paths: {
          projectFragmentsDir: ensureProjectFragmentsDir(project),
          sharedFragmentsDir: ensureSharedFragmentsDir(),
          legacyProjectDocsDir: project.absolutePath ? path.join(project.absolutePath, 'docs') : null,
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load Database Schema fragments' });
    }
  });

  app.put('/api/projects/:id/database-schema', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'database_schema')) {
        return res.status(400).json({ error: 'Database Schema module is not enabled for this project' });
      }
      const nextEditorState = req.body && req.body.editorState && typeof req.body.editorState === 'object'
        ? req.body.editorState
        : defaultDatabaseSchemaEditorState(project);
      if (req.body && typeof req.body.dbml === 'string') {
        nextEditorState.dbml = req.body.dbml;
      }
      const existingDocument = await syncDatabaseSchemaDocument(project);
      const versionedEditorState = applyIntendedSchemaVersioning(
        project,
        existingDocument?.editorState || defaultDatabaseSchemaEditorState(project),
        nextEditorState
      );
      await saveProjectDocument(project.id, 'database_schema', {
        markdown: renderDatabaseSchemaEditorStateMarkdown(project, versionedEditorState),
        mermaid: req.body && typeof req.body.mermaid === 'string' ? req.body.mermaid : defaultDatabaseSchemaMermaid(project),
        editorState: versionedEditorState,
      });
      await emitProjectFamilyActivity(project.id, 'module_document.saved', {
        moduleKey: 'database_schema',
      });
      res.json(await syncDatabaseSchemaDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save Database Schema' });
    }
  });

  app.post('/api/projects/:id/database-schema/sync-actions', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'database_schema')) {
        return res.status(400).json({ error: 'Database Schema module is not enabled for this project' });
      }
      const action = req.body && typeof req.body.action === 'string' ? req.body.action : '';
      if (!action) {
        return res.status(400).json({ error: 'Database Schema sync action is required' });
      }
      const existingDocument = await syncDatabaseSchemaDocument(project);
      const nextEditorState = await applyDatabaseSchemaSyncAction(
        project,
        existingDocument?.editorState || defaultDatabaseSchemaEditorState(project),
        action
      );
      await saveProjectDocument(project.id, 'database_schema', {
        markdown: renderDatabaseSchemaEditorStateMarkdown(project, nextEditorState),
        mermaid: existingDocument?.mermaid || defaultDatabaseSchemaMermaid(project),
        editorState: nextEditorState,
      });
      await emitProjectFamilyActivity(project.id, 'database_schema.sync_action_applied', {
        action,
      });
      res.json(await syncDatabaseSchemaDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to apply database schema sync action' });
    }
  });

  app.get('/api/projects/:id/ai-environment/fragments', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'ai_environment')) {
        return res.status(400).json({ error: 'AI Environment module is not enabled for this project' });
      }
      const aiEnvironmentDocument = await syncAiEnvironmentDocument(project, { skipImport: true });
      const fragmentHistory = Array.isArray(aiEnvironmentDocument?.editorState?.fragmentHistory)
        ? aiEnvironmentDocument.editorState.fragmentHistory
        : [];
      const fragmentPaths = [
        ...((typeof listProjectFragmentFilesForModule === 'function'
          ? listProjectFragmentFilesForModule(project, 'ai_environment', /^AI_ENVIRONMENT_(SUGGESTED|DIRECTIVE|FRAGMENT)_.*\.md$/i)
          : listProjectFragmentFiles(project, /^AI_ENVIRONMENT_(SUGGESTED|DIRECTIVE|FRAGMENT)_.*\.md$/i)).map((filePath) => ({ filePath, sourceScope: 'project' }))),
        ...listSharedAiEnvironmentDirectiveFiles().map((filePath) => ({ filePath, sourceScope: 'shared' })),
      ];
      const fileFragments = fragmentPaths
        .map((entry) => buildAiEnvironmentFragmentListEntry(
          readManagedFileSnapshot(entry.filePath),
          entry.filePath,
          entry.sourceScope
        ))
        .filter(Boolean);
      const historyFragments = fragmentHistory.map((fragment) => buildArchivedFragmentEntry(fragment));
      const fragments = mergeFragmentLists(fileFragments, historyFragments)
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
      res.json({
        fragments,
        paths: {
          projectFragmentsDir: ensureProjectFragmentsDir(project),
          sharedFragmentsDir: ensureSharedFragmentsDir(),
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load AI Environment fragments' });
    }
  });

  app.post('/api/projects/:id/ai-environment/fragments/consume', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'ai_environment')) {
        return res.status(400).json({ error: 'AI Environment module is not enabled for this project' });
      }
      const fileName = req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '';
      const sourceScope = req.body && typeof req.body.sourceScope === 'string' ? req.body.sourceScope : 'project';
      if (!fileName) {
        return res.status(400).json({ error: 'Directive fileName is required' });
      }
      const candidatePaths = sourceScope === 'shared'
        ? [
            path.join(ensureSharedFragmentsDir(), fileName),
            path.join(getFragmentsRootDir(), 'shared', 'fragments', fileName),
          ]
        : [
            path.join(ensureProjectFragmentsDir(project), fileName),
          ];
      const fragmentPath = candidatePaths.find((candidate) => fs.existsSync(candidate));
      if (!fragmentPath) {
        return res.status(404).json({ error: 'AI Environment directive file not found' });
      }
      const snapshot = readManagedFileSnapshot(fragmentPath);
      const currentState = await syncAiEnvironmentDocument(project);
      const managed = snapshot?.managed;
      const importedEditorState = managed?.docType === 'ai_environment' && managed?.editorState && typeof managed.editorState === 'object'
        ? managed.editorState
        : {
            ...defaultAiEnvironmentEditorState(project),
            customInstructions: typeof sanitizeAiEnvironmentCustomInstructions === 'function'
              ? sanitizeAiEnvironmentCustomInstructions(snapshot?.markdown)
              : stripManagedBlock(snapshot?.markdown),
          };
      const fragmentOperations = extractDocumentFragmentOperations(snapshot?.markdown, managed?.fragment || managed, {
        versionDate: snapshot?.updatedAt || new Date().toISOString(),
      });
      const nextEditorState = fragmentOperations.length
        ? applyDocumentFragmentOperations(project, 'ai_environment', currentState?.editorState, fragmentOperations, {
            defaultVersionDate: snapshot?.updatedAt || new Date().toISOString(),
          })
        : mergeAiEnvironmentEditorState(project, currentState?.editorState, importedEditorState, fileName);
      const aiFragmentEntry = buildAiEnvironmentFragmentListEntry(snapshot, fragmentPath, sourceScope);
      nextEditorState.fragmentHistory = [
        buildArchivedFragmentEntry({
          id: aiFragmentEntry?.id || `${sourceScope}:${fileName}`,
          code: aiFragmentEntry?.code || fileName.replace(/\.md$/i, ''),
          title: aiFragmentEntry?.title || String(importedEditorState?.overview?.mission || fileName).split(/\r?\n/).find(Boolean) || fileName,
          markdown: aiFragmentEntry?.markdown || snapshot?.markdown || '',
          status: 'integrated',
          fileName,
          sourceScope,
          merged: true,
          mergedAt: new Date().toISOString(),
          integratedAt: new Date().toISOString(),
          updatedAt: snapshot?.updatedAt || new Date().toISOString(),
          revision: aiFragmentEntry?.revision,
          lineageKey: aiFragmentEntry?.lineageKey,
          supersedesCode: aiFragmentEntry?.supersedesCode,
          supersedesRevision: aiFragmentEntry?.supersedesRevision,
        }),
        ...((Array.isArray(currentState?.editorState?.fragmentHistory) ? currentState.editorState.fragmentHistory : []).filter((entry) => (
          `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}` !== `${String(aiFragmentEntry?.lineageKey || aiFragmentEntry?.code || fileName.replace(/\.md$/i, ''))}::${normalizeFragmentRevision(aiFragmentEntry?.revision)}`
        ))),
      ];
      await saveProjectDocument(project.id, 'ai_environment', {
        markdown: renderAiEnvironmentEditorStateMarkdown(project, nextEditorState, {
          sharedProfiles: currentState?.sharedProfiles || [],
          fragmentsDirectiveProjectId: currentState?.fragmentsDirectiveProjectId || '',
          fragmentsRootDir: currentState?.fragmentsRootDir || getFragmentsRootDir(),
          projectFragmentsDir: currentState?.projectFragmentsDir || getProjectFragmentsDir(project),
          sharedFragmentsDir: currentState?.sharedFragmentsDir || getSharedFragmentsDir(),
          shutdownLockedAppBeforeBuildDirectiveEnabled: Boolean(currentState?.shutdownLockedAppBeforeBuildDirectiveEnabled),
          enabledModuleKeys: currentState?.enabledModuleKeys || [],
        }),
        mermaid: currentState?.mermaid || 'flowchart TD\n  ai["AI Environment"] --> brief["Project Brief"]\n  ai --> modules["Affected Modules"]\n  ai --> fragments["Managed Fragments"]',
        editorState: nextEditorState,
      });
      tryDeleteFile(fragmentPath, `phase5: consume ai environment fragment ${fileName}`);
      await emitProjectFamilyActivity(project.id, 'module_document.fragment_consumed', {
        moduleKey: 'ai_environment',
        fileName,
      });
      const [aiEnvironment, fragmentPayload] = await Promise.all([
        syncAiEnvironmentDocument(project, { skipImport: true }),
        (async () => {
          const remaining = [
            ...((typeof listProjectFragmentFilesForModule === 'function'
              ? listProjectFragmentFilesForModule(project, 'ai_environment', /^AI_ENVIRONMENT_(SUGGESTED|DIRECTIVE|FRAGMENT)_.*\.md$/i)
              : listProjectFragmentFiles(project, /^AI_ENVIRONMENT_(SUGGESTED|DIRECTIVE|FRAGMENT)_.*\.md$/i)).map((filePath) => ({ filePath, sourceScope: 'project' }))),
            ...listSharedAiEnvironmentDirectiveFiles().map((filePath) => ({ filePath, sourceScope: 'shared' })),
          ];
          return mergeFragmentLists(
            remaining
              .map((entry) => buildAiEnvironmentFragmentListEntry(readManagedFileSnapshot(entry.filePath), entry.filePath, entry.sourceScope))
              .filter(Boolean),
            nextEditorState.fragmentHistory || []
          )
            .sort((left, right) => String(left.code || '').localeCompare(String(right.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
        })(),
      ]);
      res.json({
        aiEnvironment,
        fragments: fragmentPayload,
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to consume AI Environment fragment' });
    }
  });

  app.post('/api/projects/:id/database-schema/import-fragment', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'database_schema')) {
        return res.status(400).json({ error: 'Database Schema module is not enabled for this project' });
      }
      const markdown = req.body && typeof req.body.markdown === 'string' ? req.body.markdown : '';
      if (!String(markdown).trim()) {
        return res.status(400).json({ error: 'Schema fragment markdown is required' });
      }
      const imported = buildDatabaseSchemaEditorStateFromFragment(project, {
        fileName: req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '',
        markdown,
      });
      const existingDocument = await syncDatabaseSchemaDocument(project);
      const nextEditorState = applyObservedSchemaImport(
        project,
        existingDocument?.editorState || defaultDatabaseSchemaEditorState(project),
        imported.editorState
      );
      const existingHistory = Array.isArray(existingDocument?.editorState?.fragmentHistory)
        ? existingDocument.editorState.fragmentHistory
        : [];
      const importedFragment = imported.fragmentManaged || imported.fragmentPayload || {};
      const importedLineageKey = String(importedFragment.lineageKey || importedFragment.code || importedFragment.id || req.body.fileName || '').trim();
      const importedRevision = normalizeFragmentRevision(importedFragment.revision || importedFragment.version);
      nextEditorState.fragmentHistory = [
        {
          id: importedFragment.id || req.body.fileName || `import-${Date.now()}`,
          code: importedFragment.code || importedFragment.id || req.body.fileName || 'DATABASE_SCHEMA_FRAGMENT',
          title: importedFragment.title || req.body.fileName || 'Imported database schema fragment',
          markdown,
          status: 'integrated',
          fileName: req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '',
          merged: true,
          mergedAt: new Date().toISOString(),
          integratedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          revision: importedRevision,
          lineageKey: importedLineageKey,
          supersedesCode: importedFragment.supersedesCode || '',
          supersedesRevision: importedFragment.supersedesRevision ? normalizeFragmentRevision(importedFragment.supersedesRevision) : null,
        },
        ...existingHistory.filter((entry) => {
          const entryLineageKey = String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '').trim();
          return `${entryLineageKey}::${normalizeFragmentRevision(entry?.revision)}` !== `${importedLineageKey}::${importedRevision}`;
        }),
      ];
      const nextMermaid = String(
        (imported.fragmentPayload && imported.fragmentPayload.mermaid)
        || (nextEditorState.schemaModel && nextEditorState.schemaModel.mermaid)
        || defaultDatabaseSchemaMermaid(project)
      ).trim();
      await saveProjectDocument(project.id, 'database_schema', {
        markdown: renderDatabaseSchemaEditorStateMarkdown(project, nextEditorState),
        mermaid: nextMermaid,
        editorState: nextEditorState,
      });
      if (req.body && typeof req.body.fileName === 'string' && project.absolutePath) {
        const fragmentPath = path.join(ensureProjectFragmentsDir(project), req.body.fileName);
        tryDeleteFile(fragmentPath, `phase5: consume database schema fragment ${req.body.fileName}`);
      }
      config.log(`phase5: imported database schema fragment for project ${project.id} from upload ${req.body && req.body.fileName ? req.body.fileName : '<memory>'}`);
      await emitProjectFamilyActivity(project.id, 'module_document.fragment_consumed', {
        moduleKey: 'database_schema',
        fileName: req.body?.fileName || '',
      });
      res.json(await syncDatabaseSchemaDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to import database schema fragment' });
    }
  });

  app.post('/api/projects/:id/database-schema/fragments/consume', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'database_schema')) {
        return res.status(400).json({ error: 'Database Schema module is not enabled for this project' });
      }
      const fileName = req.body && typeof req.body.fileName === 'string' ? req.body.fileName : '';
      const sourceScope = req.body && typeof req.body.sourceScope === 'string' ? req.body.sourceScope : 'project';
      const inlineMarkdown = req.body && typeof req.body.markdown === 'string' ? req.body.markdown : '';
      if (!fileName && !inlineMarkdown) {
        return res.status(400).json({ error: 'Fragment fileName or markdown is required' });
      }
      let snapshot = null;
      let fragmentPath = null;
      if (inlineMarkdown) {
        snapshot = {
          markdown: inlineMarkdown,
          updatedAt: new Date().toISOString(),
        };
      } else {
        if (sourceScope === 'shared') {
          const sharedCandidates = [
            path.join(getFragmentsRootDir(), 'shared', 'fragments', fileName),
            path.join(config.getProjectsRoot(), 'docs', fileName),
            path.join(config.APP_DIR, 'docs', fileName),
          ];
          fragmentPath = sharedCandidates.find((candidate) => fs.existsSync(candidate)) || sharedCandidates[0];
        } else if (sourceScope === 'legacy_project_docs') {
          fragmentPath = path.join(project.absolutePath, 'docs', fileName);
        } else {
          fragmentPath = path.join(ensureProjectFragmentsDir(project), fileName);
        }
        snapshot = readManagedFileSnapshot(fragmentPath);
        if (!snapshot || !snapshot.markdown) {
          return res.status(404).json({ error: 'Database Schema fragment not found' });
        }
      }
      const imported = buildDatabaseSchemaEditorStateFromFragment(project, {
        fileName,
        markdown: snapshot.markdown,
      });
      const existingDocument = await syncDatabaseSchemaDocument(project);
      const nextEditorState = applyObservedSchemaImport(
        project,
        existingDocument?.editorState || defaultDatabaseSchemaEditorState(project),
        imported.editorState
      );
      const existingHistory = Array.isArray(existingDocument?.editorState?.fragmentHistory)
        ? existingDocument.editorState.fragmentHistory
        : [];
      const importedFragment = imported.fragmentManaged || imported.fragmentPayload || {};
      const importedLineageKey = String(importedFragment.lineageKey || importedFragment.code || importedFragment.id || fileName || '').trim();
      const importedRevision = normalizeFragmentRevision(importedFragment.revision || importedFragment.version);
      nextEditorState.fragmentHistory = [
        {
          id: importedFragment.id || fileName,
          code: importedFragment.code || importedFragment.id || fileName,
          title: importedFragment.title || fileName,
          markdown: snapshot.markdown,
          status: 'integrated',
          fileName,
          sourceScope,
          merged: true,
          mergedAt: new Date().toISOString(),
          integratedAt: new Date().toISOString(),
          updatedAt: snapshot.updatedAt || new Date().toISOString(),
          revision: importedRevision,
          lineageKey: importedLineageKey,
          supersedesCode: importedFragment.supersedesCode || '',
          supersedesRevision: importedFragment.supersedesRevision ? normalizeFragmentRevision(importedFragment.supersedesRevision) : null,
        },
        ...existingHistory.filter((entry) => {
          const leftKey = `${String(entry?.lineageKey || entry?.code || entry?.id || entry?.fileName || '')}::${normalizeFragmentRevision(entry?.revision)}`;
          const rightKey = `${importedLineageKey}::${importedRevision}`;
          return leftKey !== rightKey;
        }),
      ];
      const nextMermaid = String(
        (imported.fragmentPayload && imported.fragmentPayload.mermaid)
        || (nextEditorState.schemaModel && nextEditorState.schemaModel.mermaid)
        || defaultDatabaseSchemaMermaid(project)
      ).trim();
      await saveProjectDocument(project.id, 'database_schema', {
        markdown: renderDatabaseSchemaEditorStateMarkdown(project, nextEditorState),
        mermaid: nextMermaid,
        editorState: nextEditorState,
      });
      if (fragmentPath) {
        tryDeleteFile(fragmentPath, `phase5: consume database schema fragment ${fileName}`);
      }
      await emitProjectFamilyActivity(project.id, 'module_document.fragment_consumed', {
        moduleKey: 'database_schema',
        fileName,
      });
      res.json(await syncDatabaseSchemaDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to consume database schema fragment' });
    }
  });
};
