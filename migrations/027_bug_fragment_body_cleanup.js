const { dbAll, dbRun } = require('../src/database');

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
  return fallback;
}

function looksLikeBugFragmentBody(value) {
  const text = String(value || '').trim();
  return /^#\s+Bug Fragment:/i.test(text) || /##\s+Expected vs Current Behavior/i.test(text);
}

async function up() {
  const rows = await dbAll(`
    SELECT id, summary, current_behavior, expected_behavior
      FROM bug_items
     WHERE current_behavior LIKE '# Bug Fragment:%'
        OR current_behavior LIKE '%## Expected vs Current Behavior%'
        OR summary LIKE '# Bug Fragment:%'
        OR summary LIKE '%## Expected vs Current Behavior%'
  `);

  for (const row of rows) {
    const source = looksLikeBugFragmentBody(row.current_behavior)
      ? row.current_behavior
      : row.summary;
    const currentBehavior = stripMarkdownHeadingSyntax(
      extractMarkdownSectionAnyLevel(source, 'Current Behavior')
      || summarizeBugFragmentBody(source, row.current_behavior || row.summary || '')
    );
    const extractedExpected = stripMarkdownHeadingSyntax(extractMarkdownSectionAnyLevel(source, 'Expected Behavior'));
    const expectedBehavior = extractedExpected
      || (/^Review expected behavior/i.test(String(row.expected_behavior || '').trim()) ? '' : String(row.expected_behavior || '').trim())
      || 'No expected behavior recorded yet.';
    const summary = summarizeBugFragmentBody(source, row.summary || currentBehavior);

    await dbRun(
      `UPDATE bug_items
          SET summary = ?,
              current_behavior = ?,
              expected_behavior = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [summary, currentBehavior, expectedBehavior, row.id]
    );
  }
}

module.exports = { up };
