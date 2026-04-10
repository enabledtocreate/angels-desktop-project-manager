const { dbRun, dbAll } = require('../src/database');

async function up() {
  const bugColumns = await dbAll('PRAGMA table_info(bug_items)');
  if (!bugColumns.some((column) => column.name === 'current_behavior')) {
    await dbRun(`ALTER TABLE bug_items ADD COLUMN current_behavior TEXT DEFAULT ''`);
  }
  if (!bugColumns.some((column) => column.name === 'expected_behavior')) {
    await dbRun(`ALTER TABLE bug_items ADD COLUMN expected_behavior TEXT DEFAULT ''`);
  }

  await dbRun(`
    UPDATE bug_items
    SET current_behavior = CASE
      WHEN COALESCE(TRIM(current_behavior), '') = '' THEN COALESCE(summary, '')
      ELSE current_behavior
    END
  `);
}

module.exports = { up };
