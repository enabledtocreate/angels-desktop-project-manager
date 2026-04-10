const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getStateDir, ensureStateDir } = require('./app-state');

const ENCRYPTION_PREFIX = 'enc:v1';

let cachedMasterKey = null;

function getMasterKeyFile() {
  return path.join(getStateDir(), 'credentials.key');
}

function getMasterKey() {
  if (cachedMasterKey) return cachedMasterKey;

  ensureStateDir();
  const masterKeyFile = getMasterKeyFile();
  if (fs.existsSync(masterKeyFile)) {
    cachedMasterKey = Buffer.from(fs.readFileSync(masterKeyFile, 'utf8'), 'base64');
    return cachedMasterKey;
  }

  cachedMasterKey = crypto.randomBytes(32);
  fs.writeFileSync(masterKeyFile, cachedMasterKey.toString('base64'), { mode: 0o600 });
  return cachedMasterKey;
}

function isEncryptedSecret(value) {
  return typeof value === 'string' && value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

function encryptSecret(value) {
  if (value == null || value === '') return null;
  if (isEncryptedSecret(value)) return value;

  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decryptSecret(value) {
  if (value == null || value === '') return null;
  if (!isEncryptedSecret(value)) return value;

  const [, , ivBase64, authTagBase64, ciphertextBase64] = value.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getMasterKey(),
    Buffer.from(ivBase64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextBase64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

module.exports = {
  ENCRYPTION_PREFIX,
  getMasterKeyFile,
  isEncryptedSecret,
  encryptSecret,
  decryptSecret,
};
