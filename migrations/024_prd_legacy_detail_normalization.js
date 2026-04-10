const { dbAll, dbRun } = require('../src/database');
const { parseJson } = require('../src/model-utils');
const { normalizeDocumentEditorStateForStorage, backfillDocumentEditorStateFromChangelog } = require('../src/workspace-docs');

async function up() {
  const rows = await dbAll(`
    SELECT d.project_id, d.doc_type, d.editor_state, p.name, p.project_type, p.type, p.path, p.absolute_path
      FROM project_md_documents d
      LEFT JOIN projects p ON p.id = d.project_id
     WHERE LOWER(COALESCE(d.doc_type, '')) = 'prd'
       AND COALESCE(d.editor_state, '') <> ''
  `);

  const changelogRows = await dbAll(`
    SELECT d.project_id, d.editor_state
      FROM project_md_documents d
     WHERE LOWER(COALESCE(d.doc_type, '')) = 'changelog'
       AND COALESCE(d.editor_state, '') <> ''
  `);
  const changelogByProject = new Map(
    changelogRows.map((row) => [row.project_id, parseJson(row.editor_state, null)])
  );

  for (const row of rows) {
    const editorState = parseJson(row.editor_state, null);
    if (!editorState || typeof editorState !== 'object') continue;

    const project = {
      id: row.project_id,
      name: row.name || 'Project',
      projectType: row.project_type || 'general',
      type: row.type || 'folder',
      path: row.path || '',
      absolutePath: row.absolute_path || '',
    };

    const withBackfill = backfillDocumentEditorStateFromChangelog(
      project,
      'prd',
      editorState,
      changelogByProject.get(row.project_id) || null
    );
    const normalized = normalizeDocumentEditorStateForStorage(project, 'prd', withBackfill);
    const nextJson = JSON.stringify(normalized);
    if (nextJson === row.editor_state) continue;

    await dbRun(
      `UPDATE project_md_documents
          SET editor_state = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND doc_type = ?`,
      [nextJson, row.project_id, row.doc_type]
    );
  }
}

module.exports = { up };
