const fs = require('fs');
const path = require('path');
const { dbRun, dbGet } = require('./src/database');
const { getDataDir } = require('./src/app-state');
const { encryptSecret } = require('./src/secrets');
const { normalizeProjectPrimaryAction } = require('./src/model-utils');
const config = require('./src/config');

function normalizeUploadMappings(uploadMappings) {
  if (!Array.isArray(uploadMappings)) return [];
  return uploadMappings
    .filter((mapping) => mapping && (mapping.localPath != null || mapping.remotePath != null))
    .map((mapping) => ({
      localPath: String(mapping.localPath ?? ''),
      remotePath: String(mapping.remotePath ?? ''),
      overwrite: !!mapping.overwrite,
      askBeforeOverwrite: !!mapping.askBeforeOverwrite,
    }));
}

function normalizeDownloadMappings(downloadMappings) {
  if (!Array.isArray(downloadMappings)) return [];
  return downloadMappings
    .filter((mapping) => mapping && mapping.remotePath != null && mapping.localPath != null)
    .map((mapping) => ({
      remotePath: String(mapping.remotePath ?? ''),
      localPath: String(mapping.localPath ?? ''),
    }));
}

function normalizeMappingGroups(mappingGroups, uploadMappings = []) {
  if (!Array.isArray(mappingGroups) || mappingGroups.length === 0) {
    return [{
      id: 'default',
      name: 'Default',
      uploadMappings: normalizeUploadMappings(uploadMappings),
      downloadMappings: [],
    }];
  }

  return mappingGroups
    .filter((group) => group && typeof group === 'object')
    .map((group) => ({
      id: (group.id != null && String(group.id).trim()) ? String(group.id).trim() : `group-${Date.now()}`,
      name: (group.name != null && String(group.name).trim()) ? String(group.name).trim() : 'Unnamed',
      uploadMappings: normalizeUploadMappings(group.uploadMappings),
      downloadMappings: normalizeDownloadMappings(group.downloadMappings),
    }));
}

function resolveImportedProjectAbsolutePath(project) {
  if (project && project.absolutePath) return path.resolve(project.absolutePath);
  if (project && project.path) {
    if (path.isAbsolute(project.path)) return path.resolve(project.path);
    return config.resolveSafe(project.path);
  }
  return null;
}

async function tableCount(tableName) {
  const row = await dbGet(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return row ? row.count : 0;
}

async function migrateData(options = {}) {
  const {
    onlyIfEmpty = false,
    dataDir = getDataDir(),
  } = options;

  try {
    const projectsFile = path.join(path.resolve(dataDir), 'projects.json');
    const credentialsFile = path.join(path.resolve(dataDir), 'credentials.json');

    const canImportProjects = !onlyIfEmpty || (await tableCount('projects')) === 0;
    if (canImportProjects && fs.existsSync(projectsFile)) {
      const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));

      for (const project of projects) {
        const mappingGroups = normalizeMappingGroups(project.mappingGroups, project.uploadMappings);
        const primaryUploadMappings = mappingGroups[0] ? mappingGroups[0].uploadMappings : [];

        await dbRun(`
          INSERT OR REPLACE INTO projects
          (id, path, absolute_path, name, description, parent_id, server_id, image_path,
           open_in_cursor, category, tags, links, date_added, type, open_in_cursor_admin,
           url, pinned, image_url, primary_action, upload_mappings, mapping_groups)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          project.id,
          project.path ?? null,
          (project.type ?? 'folder') !== 'url' ? resolveImportedProjectAbsolutePath(project) : null,
          project.name,
          project.description ?? '',
          project.parentId ?? null,
          project.serverId ?? null,
          project.imagePath ?? null,
          project.openInCursor ? 1 : 0,
          project.category ?? null,
          JSON.stringify(project.tags || []),
          JSON.stringify(project.links || []),
          project.dateAdded ?? new Date().toISOString(),
          project.type ?? ((project.url && /^https?:\/\//i.test(String(project.url))) ? 'url' : 'folder'),
          project.openInCursorAdmin ? 1 : 0,
          project.url ?? null,
          project.pinned ? 1 : 0,
          project.imageUrl ?? null,
          normalizeProjectPrimaryAction(project.primaryAction),
          JSON.stringify(primaryUploadMappings),
          JSON.stringify(mappingGroups),
        ]);
      }

      console.log(`Migrated ${projects.length} projects`);
    }

    const canImportCredentials = !onlyIfEmpty || (await tableCount('credentials')) === 0;
    if (canImportCredentials && fs.existsSync(credentialsFile)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));

      for (const credential of credentials) {
        await dbRun(`
          INSERT OR REPLACE INTO credentials
          (id, name, host, port, user, password, key_path)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          credential.id,
          credential.name,
          credential.host,
          credential.port ?? 22,
          credential.user,
          encryptSecret(credential.password ?? null),
          credential.keyPath ?? credential.key_path ?? null,
        ]);
      }

      console.log(`Migrated ${credentials.length} credentials`);
    }
  } catch (error) {
    console.error('Data migration error:', error);
    throw error;
  }
}

if (require.main === module) {
  migrateData()
    .then(() => console.log('Data migration completed'))
    .catch((err) => {
      console.error('Data migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateData };
