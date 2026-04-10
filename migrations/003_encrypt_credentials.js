const { dbAll, dbRun } = require('../src/database');
const { encryptSecret, isEncryptedSecret } = require('../src/secrets');

async function up() {
  const rows = await dbAll('SELECT id, password FROM credentials WHERE password IS NOT NULL AND password != ""');
  for (const row of rows) {
    if (isEncryptedSecret(row.password)) continue;
    await dbRun('UPDATE credentials SET password = ? WHERE id = ?', [
      encryptSecret(row.password),
      row.id,
    ]);
  }
}

module.exports = { up };
