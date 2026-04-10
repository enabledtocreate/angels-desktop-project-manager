function normalizeSlashPath(value, { leadingSlash = false, defaultValue = '' } = {}) {
  const raw = String(value == null ? '' : value).trim().replace(/\\/g, '/');
  if (!raw) return defaultValue;
  const collapsed = raw.replace(/\/+/g, '/');
  if (leadingSlash) {
    const prefixed = collapsed.startsWith('/') ? collapsed : `/${collapsed}`;
    return prefixed === '/' ? '/' : prefixed.replace(/\/$/, '');
  }
  return collapsed.replace(/^\/+/, '').replace(/\/$/, '');
}

function basenameForPath(value) {
  const normalized = normalizeSlashPath(value, { leadingSlash: String(value || '').trim().startsWith('/'), defaultValue: '' });
  if (!normalized || normalized === '/') return '';
  const parts = normalized.split('/');
  return parts[parts.length - 1] || normalized;
}

function joinSlashPath(basePath, name, { leadingSlash = false } = {}) {
  const base = normalizeSlashPath(basePath, { leadingSlash, defaultValue: leadingSlash ? '/' : '' });
  const child = normalizeSlashPath(name, { leadingSlash: false, defaultValue: '' });
  if (!child) return base;
  if (!base || base === '.') return child;
  if (base === '/') return `/${child}`;
  return `${base}/${child}`;
}

function buildUploadMappingFromSelection({ sourceSelection, targetSelection, currentRemotePath }) {
  if (!sourceSelection?.path) {
    throw new Error('Select a local file or folder first.');
  }

  const sourceType = sourceSelection.type === 'dir' ? 'dir' : 'file';
  const sourcePath = normalizeSlashPath(sourceSelection.path, { leadingSlash: false, defaultValue: '' });
  const sourceName = basenameForPath(sourcePath);
  if (!sourceName) {
    throw new Error('Could not determine the selected local item name.');
  }

  let remoteTarget;
  if (targetSelection?.type === 'file') {
    if (sourceType === 'dir') {
      throw new Error('Folder-to-file upload mappings are not supported. Select a remote folder target instead.');
    }
    remoteTarget = normalizeSlashPath(targetSelection.path, { leadingSlash: true, defaultValue: '/' });
  } else if (targetSelection?.type === 'dir') {
    remoteTarget = sourceType === 'dir'
      ? normalizeSlashPath(targetSelection.path, { leadingSlash: true, defaultValue: '/' })
      : joinSlashPath(targetSelection.path, sourceName, { leadingSlash: true });
  } else {
    remoteTarget = joinSlashPath(currentRemotePath || '/', sourceName, { leadingSlash: true });
  }

  return {
    localPath: sourcePath,
    remotePath: remoteTarget,
    overwrite: true,
    askBeforeOverwrite: false,
  };
}

function buildDownloadMappingFromSelection({ sourceSelection, targetSelection, currentLocalPath }) {
  if (!sourceSelection?.path) {
    throw new Error('Select a remote file or folder first.');
  }

  const sourceType = sourceSelection.type === 'dir' ? 'dir' : 'file';
  const sourcePath = normalizeSlashPath(sourceSelection.path, { leadingSlash: true, defaultValue: '/' });
  const sourceName = basenameForPath(sourcePath);
  if (!sourceName) {
    throw new Error('Could not determine the selected remote item name.');
  }

  let localTarget;
  if (targetSelection?.type === 'file') {
    if (sourceType === 'dir') {
      throw new Error('Folder-to-file download mappings are not supported. Select a local folder target instead.');
    }
    localTarget = normalizeSlashPath(targetSelection.path, { leadingSlash: false, defaultValue: '' });
  } else if (targetSelection?.type === 'dir') {
    localTarget = sourceType === 'dir'
      ? normalizeSlashPath(targetSelection.path, { leadingSlash: false, defaultValue: '' })
      : joinSlashPath(targetSelection.path, sourceName, { leadingSlash: false });
  } else {
    localTarget = joinSlashPath(currentLocalPath || '.', sourceName, { leadingSlash: false });
  }

  return {
    remotePath: sourcePath,
    localPath: localTarget,
  };
}

module.exports = {
  basenameForPath,
  buildDownloadMappingFromSelection,
  buildUploadMappingFromSelection,
  joinSlashPath,
  normalizeSlashPath,
};
