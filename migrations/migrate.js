const fs = require('fs');
const path = require('path');
const { dbRun, dbAll, dbExec } = require('../src/database');

async function ensureMigrationsTable() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function runSqlMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await dbExec(sql);
}

async function runJsMigration(filePath) {
  delete require.cache[require.resolve(filePath)];
  const migration = require(filePath);
  if (!migration || typeof migration.up !== 'function') {
    throw new Error(`JavaScript migration ${path.basename(filePath)} must export an "up" function.`);
  }
  await migration.up();
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const executedRows = await dbAll('SELECT name FROM migrations');
    const executed = new Set(executedRows.map((row) => row.name));

    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql') || file.endsWith('.js'))
      .filter((file) => file !== 'migrate.js')
      .sort();

    for (const file of files) {
      if (executed.has(file)) continue;

      const filePath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}`);

      await dbRun('BEGIN TRANSACTION');
      try {
        if (file.endsWith('.sql')) await runSqlMigration(filePath);
        else await runJsMigration(filePath);

        await dbRun('INSERT INTO migrations (name) VALUES (?)', [file]);
        await dbRun('COMMIT');
        console.log(`Migration ${file} completed`);
      } catch (error) {
        await dbRun('ROLLBACK');
        throw error;
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => console.log('All migrations completed'))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
