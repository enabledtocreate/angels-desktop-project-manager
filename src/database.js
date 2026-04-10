const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { getDbPath } = require('./app-state');

let db = null;
let currentDbPath = null;
let openingPromise = null;

function getCurrentDbPath() {
  return path.resolve(getDbPath());
}

async function openDatabase(targetPath = getCurrentDbPath()) {
  const resolvedPath = path.resolve(targetPath);
  if (db && currentDbPath === resolvedPath) return db;
  if (openingPromise) return openingPromise;

  openingPromise = (async () => {
    if (db && currentDbPath !== resolvedPath) {
      await closeDatabase();
    }

    const dataDir = path.dirname(resolvedPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const nextDb = await new Promise((resolve, reject) => {
      const instance = new sqlite3.Database(resolvedPath, (err) => {
        if (err) reject(err);
        else resolve(instance);
      });
    });

    await new Promise((resolve, reject) => {
      nextDb.run('PRAGMA foreign_keys = ON', (err) => (err ? reject(err) : resolve()));
    });

    db = nextDb;
    currentDbPath = resolvedPath;
    return db;
  })();

  try {
    return await openingPromise;
  } finally {
    openingPromise = null;
  }
}

async function withDatabase(callback) {
  const activeDb = await openDatabase();
  return callback(activeDb);
}

const dbRun = (sql, params = []) => withDatabase((activeDb) => new Promise((resolve, reject) => {
  activeDb.run(sql, params, function onRun(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
}));

const dbGet = (sql, params = []) => withDatabase((activeDb) => new Promise((resolve, reject) => {
  activeDb.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
}));

const dbAll = (sql, params = []) => withDatabase((activeDb) => new Promise((resolve, reject) => {
  activeDb.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
}));

const dbExec = (sql) => withDatabase((activeDb) => new Promise((resolve, reject) => {
  activeDb.exec(sql, (err) => {
    if (err) reject(err);
    else resolve();
  });
}));

async function closeDatabase() {
  if (!db) return;
  const activeDb = db;
  db = null;
  currentDbPath = null;
  await new Promise((resolve, reject) => {
    activeDb.close((err) => (err ? reject(err) : resolve()));
  });
}

async function reopenDatabase() {
  await closeDatabase();
  return openDatabase();
}

const exported = {
  openDatabase,
  reopenDatabase,
  dbRun,
  dbGet,
  dbAll,
  dbExec,
  closeDatabase,
};

Object.defineProperties(exported, {
  DB_PATH: { enumerable: true, get: getCurrentDbPath },
  db: { enumerable: true, get: () => db },
});

module.exports = exported;
