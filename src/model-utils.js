const { normalizeLegacyWorkspacePlugins } = require('./project-profiles');

function parseJson(value, fallback) {
  if (value == null || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .filter((link) => link && ((link.url != null && String(link.url).trim()) || (link.path != null && String(link.path).trim())))
    .map((link) => {
      const type = link.type === 'file' ? 'file' : 'url';
      const value = type === 'file'
        ? (link.path != null ? String(link.path).trim() : String(link.url || '').trim())
        : (link.url != null ? String(link.url).trim() : String(link.path || '').trim());
      if (!value) return null;
      return {
        type,
        description: link.description ? String(link.description).trim() : '',
        url: value,
        action: normalizeProjectPrimaryAction(link.action),
      };
    })
    .filter(Boolean);
}

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

function normalizeMappingGroupKind(value, uploadMappings = [], downloadMappings = []) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['upload', 'download', 'both'].includes(normalized)) return normalized;
  const hasUploads = Array.isArray(uploadMappings) && uploadMappings.length > 0;
  const hasDownloads = Array.isArray(downloadMappings) && downloadMappings.length > 0;
  if (hasUploads && !hasDownloads) return 'upload';
  if (hasDownloads && !hasUploads) return 'download';
  return 'both';
}

function defaultMappingGroups(uploadMappings = []) {
  return [{
    id: 'default',
    name: 'Default',
    uploadMappings: normalizeUploadMappings(uploadMappings),
    downloadMappings: [],
    kind: normalizeMappingGroupKind('upload', uploadMappings, []),
    serverId: '',
  }];
}

function normalizeMappingGroup(group) {
  if (!group || typeof group !== 'object') return null;
  const uploadMappings = normalizeUploadMappings(group.uploadMappings);
  const downloadMappings = normalizeDownloadMappings(group.downloadMappings);
  return {
    id: (group.id != null && String(group.id).trim()) ? String(group.id).trim() : `group-${Date.now()}`,
    name: (group.name != null && String(group.name).trim()) ? String(group.name).trim() : 'Unnamed',
    uploadMappings,
    downloadMappings,
    kind: normalizeMappingGroupKind(group.kind, uploadMappings, downloadMappings),
    serverId: group.serverId != null ? String(group.serverId).trim() : '',
  };
}

function normalizeMappingGroups(mappingGroups, uploadMappings = []) {
  const groups = Array.isArray(mappingGroups)
    ? mappingGroups.map(normalizeMappingGroup).filter(Boolean)
    : [];
  return groups.length ? groups : defaultMappingGroups(uploadMappings);
}

function normalizeProjectPrimaryAction(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['auto', 'explorer', 'cursor', 'vscode', 'chrome'].includes(normalized)
    ? normalized
    : 'auto';
}

function normalizeWorkItemType(value, fallback = 'core_task') {
  const normalized = String(value || '').trim().toLowerCase();
  if (['core_task', 'software_feature', 'software_bug'].includes(normalized)) return normalized;
  if (normalized === 'task') return 'core_task';
  if (normalized === 'feature') return 'software_feature';
  if (normalized === 'bug') return 'software_bug';
  return fallback;
}

function legacyItemTypeFromWorkItemType(value) {
  const normalized = normalizeWorkItemType(value);
  if (normalized === 'software_feature') return 'feature';
  if (normalized === 'software_bug') return 'bug';
  return 'task';
}

function normalizeWorkspacePlugins(value) {
  return normalizeLegacyWorkspacePlugins(value);
}

function normalizeGitHubIntegration(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    enabled: source.enabled !== false,
    owner: source.owner ? String(source.owner).trim() : '',
    repo: source.repo ? String(source.repo).trim() : '',
  };
}

function normalizeWebhookEndpoint(endpoint, fallbackId = 'default') {
  const source = endpoint && typeof endpoint === 'object' ? endpoint : {};
  return {
    id: source.id ? String(source.id).trim() : fallbackId,
    name: source.name ? String(source.name).trim() : 'Default webhook',
  };
}

function normalizeWebhookIntegration(value) {
  const source = value && typeof value === 'object' ? value : {};
  const endpointsSource = Array.isArray(source.endpoints) && source.endpoints.length
    ? source.endpoints
    : [{ id: 'default', name: 'Default webhook' }];
  return {
    autoCreateTasks: !!source.autoCreateTasks,
    taskStatus: ['todo', 'in_progress', 'done'].includes(String(source.taskStatus || '').trim())
      ? String(source.taskStatus).trim()
      : 'todo',
    taskPrefix: source.taskPrefix ? String(source.taskPrefix).trim() : 'Webhook',
    endpoints: endpointsSource.map((endpoint, index) => normalizeWebhookEndpoint(endpoint, index === 0 ? 'default' : `endpoint-${index + 1}`)),
  };
}

function normalizeIntegrationPlugin(plugin, index = 0) {
  const source = plugin && typeof plugin === 'object' ? plugin : {};
  const type = source.type === 'open_url' ? 'open_url' : 'webhook_forward';
  const headers = source.headers && typeof source.headers === 'object' && !Array.isArray(source.headers)
    ? Object.fromEntries(
        Object.entries(source.headers)
          .map(([key, value]) => [String(key).trim(), String(value ?? '').trim()])
          .filter(([key, value]) => key && value)
      )
    : {};

  return {
    id: source.id ? String(source.id).trim() : `plugin-${index + 1}`,
    name: source.name ? String(source.name).trim() : `Plugin ${index + 1}`,
    type,
    targetUrl: source.targetUrl ? String(source.targetUrl).trim() : '',
    method: String(source.method || 'POST').trim().toUpperCase() || 'POST',
    headers,
    includeProjectContext: source.includeProjectContext !== false,
  };
}

function normalizeProjectIntegrations(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sftpSource = source.sftp && typeof source.sftp === 'object' ? source.sftp : {};
  const projectFamilySource = source.projectFamily && typeof source.projectFamily === 'object' ? source.projectFamily : {};
  const inheritanceKeys = [
    'aiDirectives',
    'standards',
    'templatePolicy',
    'moduleDefaults',
    'uiPreferences',
    'integrationDefaults',
  ];
  const normalizeInheritanceFlags = (flags) => {
    const sourceFlags = flags && typeof flags === 'object' ? flags : {};
    return Object.fromEntries(inheritanceKeys.map((key) => [key, !!sourceFlags[key]]));
  };
  return {
    github: normalizeGitHubIntegration(source.github),
    webhooks: normalizeWebhookIntegration(source.webhooks),
    sftp: {
      serverIds: Array.isArray(sftpSource.serverIds)
        ? [...new Set(sftpSource.serverIds.map((value) => String(value || '').trim()).filter(Boolean))]
        : [],
      defaultServerId: sftpSource.defaultServerId ? String(sftpSource.defaultServerId).trim() : '',
    },
    plugins: Array.isArray(source.plugins)
      ? source.plugins.map(normalizeIntegrationPlugin).filter((plugin) => plugin.targetUrl)
      : [],
    projectFamily: {
      offeredInheritance: normalizeInheritanceFlags(projectFamilySource.offeredInheritance),
      inheritedFromParent: normalizeInheritanceFlags(projectFamilySource.inheritedFromParent),
    },
  };
}

function normalizeTaskPayload(payload = {}, currentTask = {}) {
  const now = new Date().toISOString();
  const sourceDependencies = payload.dependencyIds ?? currentTask.dependencyIds;
  const dependencyIds = Array.isArray(sourceDependencies)
    ? [...new Set(sourceDependencies.map((id) => String(id).trim()).filter(Boolean))]
    : [];

  const sortOrderValue = payload.sortOrder ?? currentTask.sortOrder ?? 0;
  const progressValue = payload.progress ?? currentTask.progress ?? 0;

  return {
    id: payload.id ?? currentTask.id,
    projectId: payload.projectId ?? currentTask.projectId,
    title: String(payload.title ?? currentTask.title ?? '').trim(),
    description: String(payload.description ?? currentTask.description ?? ''),
    category: String(payload.category ?? currentTask.category ?? '').trim() || null,
    status: String(payload.status ?? currentTask.status ?? 'todo').trim() || 'todo',
    priority: String(payload.priority ?? currentTask.priority ?? 'medium').trim() || 'medium',
    createdAt: currentTask.createdAt ?? payload.createdAt ?? now,
    updatedAt: now,
    dueDate: payload.dueDate ?? currentTask.dueDate ?? null,
    assignedTo: payload.assignedTo ?? currentTask.assignedTo ?? null,
    startDate: payload.startDate ?? currentTask.startDate ?? null,
    endDate: payload.endDate ?? currentTask.endDate ?? null,
    roadmapPhaseId: payload.roadmapPhaseId ?? currentTask.roadmapPhaseId ?? null,
    planningBucket: String(payload.planningBucket ?? currentTask.planningBucket ?? 'considered').trim() || 'considered',
    workItemType: normalizeWorkItemType(payload.workItemType ?? payload.itemType ?? currentTask.workItemType ?? currentTask.itemType ?? 'core_task'),
    itemType: legacyItemTypeFromWorkItemType(payload.workItemType ?? payload.itemType ?? currentTask.workItemType ?? currentTask.itemType ?? 'core_task'),
    dependencyIds,
    progress: Math.max(0, Math.min(100, Number.isFinite(Number(progressValue)) ? Number(progressValue) : 0)),
    milestone: payload.milestone !== undefined ? !!payload.milestone : !!currentTask.milestone,
    sortOrder: Number.isFinite(Number(sortOrderValue)) ? Number(sortOrderValue) : 0,
  };
}

function parseGitRemoteUrl(url) {
  if (!url || typeof url !== 'string') return {};
  const value = url.trim();
  let host = '';
  let account = '';
  let repo = '';

  const sshMatch = value.match(/^git@([^:]+):([^/]+)\/([^/]+?)(\.git)?$/);
  const httpsMatch = value.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(\.git)?$/);

  if (sshMatch) {
    host = sshMatch[1];
    account = sshMatch[2];
    repo = sshMatch[3].replace(/\.git$/, '');
  } else if (httpsMatch) {
    host = httpsMatch[1].replace(/^.*@/, '');
    account = httpsMatch[2];
    repo = httpsMatch[3].replace(/\.git$/, '');
  }

  return { host, account, repo };
}

module.exports = {
  parseJson,
  normalizeLinks,
  normalizeUploadMappings,
  normalizeDownloadMappings,
  defaultMappingGroups,
  normalizeMappingGroup,
  normalizeMappingGroups,
  normalizeProjectPrimaryAction,
  normalizeWorkItemType,
  legacyItemTypeFromWorkItemType,
  normalizeWorkspacePlugins,
  normalizeProjectIntegrations,
  normalizeTaskPayload,
  parseGitRemoteUrl,
};
