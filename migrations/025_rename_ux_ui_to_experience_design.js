const fs = require('fs');
const path = require('path');
const { dbAll, dbRun } = require('../src/database');
const { parseJson } = require('../src/model-utils');
const {
  getProjectDocPath,
  getProjectTemplatesDir,
  normalizeDocumentEditorStateForStorage,
  renderModuleDocumentEditorStateMarkdown,
} = require('../src/workspace-docs');

const LEGACY_MODULE_KEY = 'ux_ui';
const NEXT_MODULE_KEY = 'experience_design';
const LEGACY_DOC_TYPE = 'ux_ui';
const NEXT_DOC_TYPE = 'experience_design';
const LEGACY_TEMPLATE_NAME = 'UX_UI.template.md';
const NEXT_TEMPLATE_NAME = 'EXPERIENCE_DESIGN.template.md';
const LEGACY_FRAGMENT_TEMPLATE_NAME = 'UX_UI_FRAGMENT.template.md';
const NEXT_FRAGMENT_TEMPLATE_NAME = 'EXPERIENCE_DESIGN_FRAGMENT.template.md';

function replaceExperienceDesignNaming(value) {
  return String(value || '')
    .replace(/ux-ui-/gi, 'experience-design-')
    .replace(/\bUX_UI_FRAGMENT\.template\.md\b/g, NEXT_FRAGMENT_TEMPLATE_NAME)
    .replace(/\bUX_UI\.template\.md\b/g, NEXT_TEMPLATE_NAME)
    .replace(/\bUX_UI\.md\b/g, 'EXPERIENCE_DESIGN.md')
    .replace(/\bUX_UI\b/g, 'EXPERIENCE_DESIGN')
    .replace(/\bux_ui\b/g, NEXT_DOC_TYPE)
    .replace(/\bUX\/UI\b/g, 'Experience Design')
    .replace(/\bUX UI\b/g, 'Experience Design');
}

function deepRenameExperienceDesign(value) {
  if (Array.isArray(value)) {
    return value.map((item) => deepRenameExperienceDesign(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, deepRenameExperienceDesign(entryValue)])
    );
  }
  if (typeof value === 'string') {
    return replaceExperienceDesignNaming(value);
  }
  return value;
}

function ensureProjectFileUpdate(targetPath, content) {
  if (!targetPath) return;
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) return;
  fs.writeFileSync(targetPath, content, 'utf8');
}

function renameProjectFileIfPresent(sourcePath, targetPath) {
  if (!sourcePath || !targetPath || sourcePath === targetPath) return;
  if (!fs.existsSync(sourcePath)) return;
  if (fs.existsSync(targetPath)) return;
  fs.renameSync(sourcePath, targetPath);
}

async function renameProjectModules() {
  const legacyRows = await dbAll(
    'SELECT project_id, module_key FROM project_modules WHERE LOWER(COALESCE(module_key, \'\')) = ?',
    [LEGACY_MODULE_KEY]
  );

  for (const row of legacyRows) {
    const existingNext = await dbAll(
      'SELECT project_id FROM project_modules WHERE project_id = ? AND module_key = ?',
      [row.project_id, NEXT_MODULE_KEY]
    );
    if (existingNext.length) {
      await dbRun(
        'DELETE FROM project_modules WHERE project_id = ? AND module_key = ?',
        [row.project_id, LEGACY_MODULE_KEY]
      );
      continue;
    }

    await dbRun(
      `UPDATE project_modules
          SET module_key = ?,
              label = 'Experience Design',
              description = 'Design user journeys, interactions, states, and interface behavior.',
              purpose_summary = 'Defines how the product should feel, flow, and behave for the user.',
              updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND module_key = ?`,
      [NEXT_MODULE_KEY, row.project_id, LEGACY_MODULE_KEY]
    );
  }
}

async function renameAffectedModuleKeys(tableName) {
  await dbRun(
    `UPDATE ${tableName}
        SET affected_module_keys = REPLACE(affected_module_keys, '"${LEGACY_MODULE_KEY}"', '"${NEXT_MODULE_KEY}"'),
            updated_at = CURRENT_TIMESTAMP
      WHERE affected_module_keys LIKE '%"${LEGACY_MODULE_KEY}"%'`
  );
}

async function rewriteExperienceDesignDocuments() {
  const rows = await dbAll(`
    SELECT d.project_id, d.doc_type, d.module_key, d.template_name, d.editor_state, d.markdown, d.mermaid, d.file_path,
           p.name, p.project_type, p.type, p.path, p.absolute_path
      FROM project_md_documents d
      LEFT JOIN projects p ON p.id = d.project_id
     WHERE LOWER(COALESCE(d.doc_type, '')) = ?
        OR LOWER(COALESCE(d.module_key, '')) = ?
  `, [LEGACY_DOC_TYPE, LEGACY_MODULE_KEY]);

  for (const row of rows) {
    const project = {
      id: row.project_id,
      name: row.name || 'Project',
      projectType: row.project_type || 'general',
      type: row.type || 'folder',
      path: row.path || '',
      absolutePath: row.absolute_path || '',
    };

    const rawEditorState = parseJson(row.editor_state, null);
    const renamedEditorState = deepRenameExperienceDesign(rawEditorState || {});
    const normalizedEditorState = normalizeDocumentEditorStateForStorage(project, NEXT_DOC_TYPE, renamedEditorState);
    const nextMarkdown = renderModuleDocumentEditorStateMarkdown(project, NEXT_DOC_TYPE, normalizedEditorState);
    const nextEditorStateJson = JSON.stringify(normalizedEditorState);
    const nextDocPath = getProjectDocPath(project, NEXT_DOC_TYPE);
    const legacyDocPath = row.file_path && String(row.file_path || '').trim()
      ? row.file_path
      : getProjectDocPath(project, LEGACY_DOC_TYPE);

    const existingNext = await dbAll(
      'SELECT project_id FROM project_md_documents WHERE project_id = ? AND doc_type = ?',
      [row.project_id, NEXT_DOC_TYPE]
    );

    if (existingNext.length && String(row.doc_type || '').trim().toLowerCase() !== NEXT_DOC_TYPE) {
      await dbRun(
        'DELETE FROM project_md_documents WHERE project_id = ? AND doc_type = ?',
        [row.project_id, row.doc_type]
      );
    } else {
      await dbRun(
        `UPDATE project_md_documents
            SET doc_type = ?,
                title = 'Experience Design',
                module_key = ?,
                template_name = ?,
                markdown = ?,
                editor_state = ?,
                file_path = ?,
                updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ? AND doc_type = ?`,
        [
          NEXT_DOC_TYPE,
          NEXT_MODULE_KEY,
          NEXT_TEMPLATE_NAME,
          nextMarkdown,
          nextEditorStateJson,
          nextDocPath || row.file_path || '',
          row.project_id,
          row.doc_type,
        ]
      );
    }

    if (legacyDocPath && nextDocPath) {
      renameProjectFileIfPresent(legacyDocPath, nextDocPath);
      ensureProjectFileUpdate(nextDocPath, nextMarkdown);
    }

    const projectTemplatesDir = getProjectTemplatesDir(project);
    if (projectTemplatesDir && fs.existsSync(projectTemplatesDir)) {
      renameProjectFileIfPresent(
        path.join(projectTemplatesDir, LEGACY_TEMPLATE_NAME),
        path.join(projectTemplatesDir, NEXT_TEMPLATE_NAME)
      );
      renameProjectFileIfPresent(
        path.join(projectTemplatesDir, LEGACY_FRAGMENT_TEMPLATE_NAME),
        path.join(projectTemplatesDir, NEXT_FRAGMENT_TEMPLATE_NAME)
      );
    }
  }
}

async function rewriteChangelogReferences() {
  const rows = await dbAll(`
    SELECT d.project_id, d.doc_type, d.editor_state, p.name, p.project_type, p.type, p.path, p.absolute_path
      FROM project_md_documents d
      LEFT JOIN projects p ON p.id = d.project_id
     WHERE LOWER(COALESCE(d.doc_type, '')) = 'changelog'
       AND COALESCE(d.editor_state, '') <> ''
  `);

  for (const row of rows) {
    const editorState = parseJson(row.editor_state, null);
    if (!editorState || typeof editorState !== 'object') continue;

    const renamedEditorState = deepRenameExperienceDesign(editorState);
    const project = {
      id: row.project_id,
      name: row.name || 'Project',
      projectType: row.project_type || 'general',
      type: row.type || 'folder',
      path: row.path || '',
      absolutePath: row.absolute_path || '',
    };
    const normalizedEditorState = normalizeDocumentEditorStateForStorage(project, 'changelog', renamedEditorState);
    const nextEditorStateJson = JSON.stringify(normalizedEditorState);
    const nextMarkdown = renderModuleDocumentEditorStateMarkdown(project, 'changelog', normalizedEditorState);

    if (nextEditorStateJson === row.editor_state) continue;

    await dbRun(
      `UPDATE project_md_documents
          SET editor_state = ?,
              markdown = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND doc_type = ?`,
      [nextEditorStateJson, nextMarkdown, row.project_id, row.doc_type]
    );
  }
}

async function up() {
  await renameProjectModules();
  await renameAffectedModuleKeys('feature_items');
  await renameAffectedModuleKeys('bug_items');
  await rewriteExperienceDesignDocuments();
  await rewriteChangelogReferences();
}

module.exports = { up };
