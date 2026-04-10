const { dbAll, dbRun } = require('../src/database');
const { parseJson } = require('../src/model-utils');
const { normalizeDocumentEditorStateForStorage } = require('../src/workspace-docs');

async function up() {
  const rows = await dbAll(`
    SELECT d.project_id, d.doc_type, d.editor_state, p.name, p.project_type, p.type, p.path, p.absolute_path
      FROM project_md_documents d
      LEFT JOIN projects p ON p.id = d.project_id
     WHERE COALESCE(d.editor_state, '') <> ''
  `);

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

    const normalized = normalizeDocumentEditorStateForStorage(project, row.doc_type, editorState);
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
