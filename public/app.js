const API = '/api';

const COLOR_SCHEME_KEY = 'colorScheme';
const SCHEMES = {
  'cyan-glow': { label: 'Cyan Glow', backgroundColor: '#0c1222' },
  'dark-blue': { label: 'Dark Blue', backgroundColor: '#0a0f1a' },
  'app-icon': { label: 'App Icon', backgroundColor: '#16122a' },
};

let projectsRoot = '';
let projects = [];
let credentials = [];
let contextMenuProjectId = null;
let browseState = { path: '', absolute: '', dirs: [] };
let browseStateSettings = { path: '', absolute: '', dirs: [] };
let pendingTestConnection = null;

const sftpState = {
  project: null,
  credId: null,
  status: 'disconnected',
  localSelected: null,
  remoteSelected: null,
  mappings: [],
  downloadMappings: [],
  mappingGroups: [],
  selectedGroupId: null,
  localCurrentPath: null,
  remoteCurrentPath: '/',
  localListing: null,
  remoteListing: null,
  overwriteResolve: null,
  editingMappingIndex: null,
  editingDownloadMappingIndex: null,
  downloadRemotePath: null,
  downloadRemoteType: null,
  groupNameModalResolve: null,
};

function setSftpStatus(status) {
  sftpState.status = status;
  const wrap = el.sftpStatus;
  if (!wrap) return;
  const dot = wrap.querySelector('.sftp-status-dot');
  if (dot) {
    dot.className = 'sftp-status-dot sftp-status-' + status;
    wrap.title = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected';
  }
}

const el = {
  projectsList: document.getElementById('projects-list'),
  projectsRoot: document.getElementById('projects-root'),
  toolbarSearch: document.getElementById('toolbar-search'),
  toolbarSort: document.getElementById('toolbar-sort'),
  toolbarView: document.getElementById('toolbar-view'),
  toolbarGroup: document.getElementById('toolbar-group'),
  btnAddProject: document.getElementById('btn-add-project'),
  modalProject: document.getElementById('modal-project'),
  modalProjectTitle: document.getElementById('modal-project-title'),
  formProject: document.getElementById('form-project'),
  projectId: document.getElementById('project-id'),
  projectParentId: document.getElementById('project-parent-id'),
  projectPath: document.getElementById('project-path'),
  projectUrl: document.getElementById('project-url'),
  projectTypeFolder: document.querySelector('input[name="project-type"][value="folder"]'),
  projectTypeUrl: document.querySelector('input[name="project-type"][value="url"]'),
  fieldProjectType: document.getElementById('field-project-type'),
  fieldProjectPath: document.getElementById('field-project-path'),
  fieldProjectUrl: document.getElementById('field-project-url'),
  projectName: document.getElementById('project-name'),
  projectDescription: document.getElementById('project-description'),
  projectCategory: document.getElementById('project-category'),
  projectCategoryList: document.getElementById('project-category-list'),
  projectTagsChips: document.getElementById('project-tags-chips'),
  projectTagsInput: document.getElementById('project-tags-input'),
  projectTagsSuggestions: document.getElementById('project-tags-suggestions'),
  btnBrowse: document.getElementById('btn-browse'),
  browsePanel: document.getElementById('browse-panel'),
  browseCurrent: document.getElementById('browse-current'),
  browseDirs: document.getElementById('browse-dirs'),
  browseUp: document.getElementById('browse-up'),
  browseSelect: document.getElementById('browse-select'),
  btnCancelProject: document.getElementById('btn-cancel-project'),
  modalProjectSettings: document.getElementById('modal-project-settings'),
  formProjectSettings: document.getElementById('form-project-settings'),
  projectSettingsId: document.getElementById('project-settings-id'),
  projectSettingsOpenCursor: document.getElementById('project-settings-open-cursor'),
  projectSettingsOpenCursorAdmin: document.getElementById('project-settings-open-cursor-admin'),
  projectSettingsPath: document.getElementById('project-settings-path'),
  projectSettingsUrl: document.getElementById('project-settings-url'),
  fieldProjectSettingsCursor: document.getElementById('field-project-settings-cursor'),
  fieldProjectSettingsPath: document.getElementById('field-project-settings-path'),
  fieldProjectSettingsUrl: document.getElementById('field-project-settings-url'),
  projectSettingsImageFile: document.getElementById('project-settings-image-file'),
  projectSettingsImageUrl: document.getElementById('project-settings-image-url'),
  projectSettingsImageSourceLocal: document.querySelector('input[name="project-image-source"][value="local"]'),
  projectSettingsImageSourceUrl: document.querySelector('input[name="project-image-source"][value="url"]'),
  fieldProjectSettingsImageLocal: document.getElementById('field-project-settings-image-local'),
  fieldProjectSettingsImageUrl: document.getElementById('field-project-settings-image-url'),
  btnProjectSettingsImage: document.getElementById('btn-project-settings-image'),
  btnProjectSettingsRemoveImage: document.getElementById('btn-project-settings-remove-image'),
  modalCropImage: document.getElementById('modal-crop-image'),
  cropViewport: document.getElementById('crop-viewport'),
  cropImage: document.getElementById('crop-image'),
  cropZoom: document.getElementById('crop-zoom'),
  cropZoomValue: document.getElementById('crop-zoom-value'),
  cropPanX: document.getElementById('crop-pan-x'),
  cropPanY: document.getElementById('crop-pan-y'),
  btnCropCancel: document.getElementById('btn-crop-cancel'),
  btnCropApply: document.getElementById('btn-crop-apply'),
  projectSettingsDescription: document.getElementById('project-settings-description'),
  projectSettingsCategory: document.getElementById('project-settings-category'),
  projectSettingsCategoryList: document.getElementById('project-settings-category-list'),
  projectSettingsTagsChips: document.getElementById('project-settings-tags-chips'),
  projectSettingsTagsInput: document.getElementById('project-settings-tags-input'),
  projectSettingsTagsSuggestions: document.getElementById('project-settings-tags-suggestions'),
  projectSettingsLinksList: document.getElementById('project-settings-links-list'),
  btnProjectSettingsAddLink: document.getElementById('btn-project-settings-add-link'),
  modalLink: document.getElementById('modal-link'),
  linkDescription: document.getElementById('link-description'),
  linkTypeUrl: document.querySelector('input[name="link-type"][value="url"]'),
  linkTypeFile: document.querySelector('input[name="link-type"][value="file"]'),
  linkUrl: document.getElementById('link-url'),
  linkPath: document.getElementById('link-path'),
  fieldLinkUrl: document.getElementById('field-link-url'),
  fieldLinkPath: document.getElementById('field-link-path'),
  btnLinkCancel: document.getElementById('btn-link-cancel'),
  btnLinkSave: document.getElementById('btn-link-save'),
  projectSettingsServer: document.getElementById('project-settings-server'),
  btnProjectSettingsBrowse: document.getElementById('btn-project-settings-browse'),
  projectSettingsBrowsePanel: document.getElementById('project-settings-browse-panel'),
  projectSettingsBrowseCurrent: document.getElementById('project-settings-browse-current'),
  projectSettingsBrowseDirs: document.getElementById('project-settings-browse-dirs'),
  projectSettingsBrowseUp: document.getElementById('project-settings-browse-up'),
  projectSettingsBrowseSelect: document.getElementById('project-settings-browse-select'),
  btnCancelProjectSettings: document.getElementById('btn-cancel-project-settings'),
  projectContextMenu: document.getElementById('project-context-menu'),
  projectContextPin: document.getElementById('project-context-pin'),
  projectContextUnpin: document.getElementById('project-context-unpin'),
  projectContextOpenCursor: document.getElementById('project-context-open-cursor'),
  projectContextOpenExplorer: document.getElementById('project-context-open-explorer'),
  projectContextSettings: document.getElementById('project-context-settings'),
  projectContextSftp: document.getElementById('project-context-sftp'),
  projectContextAddSubproject: document.getElementById('project-context-add-subproject'),
  projectContextRemove: document.getElementById('project-context-remove'),
  menuSettings: document.getElementById('menu-settings'),
  menuViewLogs: document.getElementById('menu-view-logs'),
  menuRestartApp: document.getElementById('menu-restart-app'),
  modalSettings: document.getElementById('modal-settings'),
  settingsColorScheme: document.getElementById('settings-color-scheme'),
  titleBar: document.getElementById('title-bar'),
  titleBarMinimize: document.getElementById('title-bar-minimize'),
  titleBarMaximize: document.getElementById('title-bar-maximize'),
  titleBarClose: document.getElementById('title-bar-close'),
  settingsServersList: document.getElementById('settings-servers-list'),
  modalSettingsServer: document.getElementById('modal-settings-server'),
  modalSettingsServerTitle: document.getElementById('modal-settings-server-title'),
  btnSettingsAddServer: document.getElementById('btn-settings-add-server'),
  btnSettingsServerCancel: document.getElementById('btn-settings-server-cancel'),
  btnSettingsTestConnection: document.getElementById('btn-settings-test-connection'),
  modalTestConnectionPassword: document.getElementById('modal-test-connection-password'),
  testConnectionLabel: document.getElementById('test-connection-label'),
  testConnectionPasswordInput: document.getElementById('test-connection-password-input'),
  btnTestConnectionCancel: document.getElementById('btn-test-connection-cancel'),
  btnTestConnectionSubmit: document.getElementById('btn-test-connection-submit'),
  settingsCredId: document.getElementById('settings-cred-id'),
  settingsCredName: document.getElementById('settings-cred-name'),
  settingsCredHost: document.getElementById('settings-cred-host'),
  settingsCredPort: document.getElementById('settings-cred-port'),
  settingsCredUser: document.getElementById('settings-cred-user'),
  settingsCredPassword: document.getElementById('settings-cred-password'),
  settingsCredKey: document.getElementById('settings-cred-key'),
  btnSettingsSaveServer: document.getElementById('btn-settings-save-server'),
  btnSettingsClearServer: document.getElementById('btn-settings-clear-server'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  modalCredentials: document.getElementById('modal-credentials'),
  credentialsList: document.getElementById('credentials-list'),
  formCredential: document.getElementById('form-credential'),
  btnCloseCredentials: document.getElementById('btn-close-credentials'),
  modalSftp: document.getElementById('modal-sftp'),
  sftpStatus: document.getElementById('sftp-status'),
  sftpModalTitle: document.getElementById('sftp-modal-title'),
  sftpLocalPathbar: document.getElementById('sftp-local-pathbar'),
  sftpRemotePathbar: document.getElementById('sftp-remote-pathbar'),
  sftpListLocalBody: document.getElementById('sftp-list-local-body'),
  sftpListRemoteBody: document.getElementById('sftp-list-remote-body'),
  sftpLocalActions: document.getElementById('sftp-local-actions'),
  sftpRemoteActions: document.getElementById('sftp-remote-actions'),
  sftpBtnSend: document.getElementById('sftp-btn-send'),
  sftpBtnAddDownloadMapping: document.getElementById('sftp-btn-add-download-mapping'),
  sftpDestOptions: document.getElementById('sftp-dest-options'),
  sftpOverwrite: document.getElementById('sftp-overwrite'),
  sftpAskOverwrite: document.getElementById('sftp-ask-overwrite'),
  sftpMappingsList: document.getElementById('sftp-mappings-list'),
  sftpBtnCancel: document.getElementById('sftp-btn-cancel'),
  sftpBtnSaveMappings: document.getElementById('sftp-btn-save-mappings'),
  sftpBtnUpdateMapping: document.getElementById('sftp-btn-update-mapping'),
  sftpBtnRun: document.getElementById('sftp-btn-run'),
  modalSftpProgress: document.getElementById('modal-sftp-progress'),
  sftpProgressLog: document.getElementById('sftp-progress-log'),
  sftpProgressClose: document.getElementById('sftp-progress-close'),
  modalSftpOverwrite: document.getElementById('modal-sftp-overwrite'),
  sftpOverwriteMessage: document.getElementById('sftp-overwrite-message'),
  sftpOverwriteNo: document.getElementById('sftp-overwrite-no'),
  sftpOverwriteYes: document.getElementById('sftp-overwrite-yes'),
  sftpRemoteContextMenu: document.getElementById('sftp-remote-context-menu'),
  sftpRemoteContextDownload: document.getElementById('sftp-remote-context-download'),
  sftpRemoteContextAddDownloadMapping: document.getElementById('sftp-remote-context-add-download-mapping'),
  modalSftpDownload: document.getElementById('modal-sftp-download'),
  sftpDownloadLocalPath: document.getElementById('sftp-download-local-path'),
  sftpDownloadBrowse: document.getElementById('sftp-download-browse'),
  sftpDownloadRemotePath: document.getElementById('sftp-download-remote-path'),
  sftpDownloadCancel: document.getElementById('sftp-download-cancel'),
  sftpDownloadRun: document.getElementById('sftp-download-run'),
  sftpDownloadBrowsePanel: document.getElementById('sftp-download-browse-panel'),
  sftpDownloadBrowseDirs: document.getElementById('sftp-download-browse-dirs'),
  sftpGroupSelect: document.getElementById('sftp-group-select'),
  sftpGroupAdd: document.getElementById('sftp-group-add'),
  sftpGroupEdit: document.getElementById('sftp-group-edit'),
  sftpGroupDelete: document.getElementById('sftp-group-delete'),
  sftpBtnRunDownload: document.getElementById('sftp-btn-run-download'),
  modalMappingGroupName: document.getElementById('modal-mapping-group-name'),
  mappingGroupNameTitle: document.getElementById('modal-mapping-group-name-title'),
  mappingGroupNameInput: document.getElementById('mapping-group-name-input'),
  mappingGroupNameCancel: document.getElementById('mapping-group-name-cancel'),
  mappingGroupNameOk: document.getElementById('mapping-group-name-ok'),
};

// Log every error to console and to the app log file (View → View Logs to open)
function logClientError(type, message, stack, source, lineno, colno) {
  const payload = { type, message: String(message || ''), stack: stack ? String(stack) : '', source: source || '', lineno: lineno ?? '', colno: colno ?? '' };
  console.error(`[${type}]`, message, stack || '');
  try {
    fetch(API + '/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to send error to log:', e);
  }
}
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    logClientError('error', message, error && error.stack, source, lineno, colno);
    return false;
  };
  window.onunhandledrejection = function(event) {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logClientError('unhandledrejection', message, stack, '', '', '');
  };
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function loadRoot() {
  try {
    const data = await fetchJSON(`${API}/roots`);
    projectsRoot = (data && data.projectsRoot != null) ? String(data.projectsRoot) : '';
    if (el.projectsRoot) el.projectsRoot.textContent = projectsRoot;
  } catch (e) {
    if (el.projectsRoot) el.projectsRoot.textContent = '(load failed)';
    throw e;
  }
}

async function loadProjects() {
  try {
    const data = await fetchJSON(`${API}/projects`);
    projects = Array.isArray(data) ? data : [];
  } catch (e) {
    projects = [];
    if (el.projectsList) {
      el.projectsList.innerHTML = `<div class="empty-state"><p>Could not load projects: ${escapeHtml(e.message)}</p><p>Make sure the server is running.</p></div>`;
    }
    throw e;
  }
  renderProjects();
}

function getViewState() {
  return {
    search: (el.toolbarSearch && el.toolbarSearch.value) ? el.toolbarSearch.value.trim() : '',
    sortBy: (el.toolbarSort && el.toolbarSort.value) || 'alphabetical',
    viewMode: (el.toolbarView && el.toolbarView.value) || 'list',
    groupBy: (el.toolbarGroup && el.toolbarGroup.value) || 'none',
  };
}

function wildcardToRegex(q) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(escaped, 'i');
}

function projectMatchesSearch(project, regex) {
  if (regex.test(project.name || '')) return true;
  if (regex.test(project.description || '')) return true;
  const tags = project.tags || [];
  if (tags.some(t => regex.test(String(t).trim()))) return true;
  return false;
}

function filterProjects(projectList, searchQuery) {
  if (!searchQuery) return projectList;
  const regex = wildcardToRegex(searchQuery);
  return projectList.filter(p => projectMatchesSearch(p, regex));
}

function sortProjects(projectList, sortBy) {
  const sortFn = (a, b) => {
    if (sortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'dateAdded') {
      const ta = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const tb = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return tb - ta;
    }
    if (sortBy === 'category') {
      return (a.category || '').localeCompare(b.category || '', undefined, { sensitivity: 'base' });
    }
    return 0;
  };
  const pinned = projectList.filter(p => p.pinned === true).sort(sortFn);
  const unpinned = projectList.filter(p => !p.pinned).sort(sortFn);
  return [...pinned, ...unpinned];
}

function groupProjects(projectList, groupBy) {
  if (!groupBy || groupBy === 'none') return { '': projectList };
  const groups = {};
  for (const p of projectList) {
    let key;
    if (groupBy === 'name') {
      const n = (p.name || '').trim();
      key = n.charAt(0).toUpperCase() || '—';
    } else if (groupBy === 'dateAdded') {
      if (p.dateAdded) {
        const d = new Date(p.dateAdded);
        key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } else key = 'No date';
    } else if (groupBy === 'category') {
      key = (p.category && p.category.trim()) ? p.category.trim() : 'Uncategorized';
    } else key = '—';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

async function loadCredentials() {
  credentials = await fetchJSON(`${API}/credentials`);
}

function renderProjects() {
  if (!el.projectsList) return;
  const projs = Array.isArray(projects) ? projects : [];
  const view = getViewState();
  const roots = projs.filter(p => p && !p.parentId);
  const filtered = filterProjects(roots, view.search);
  const sorted = sortProjects(filtered, view.sortBy);
  const byParent = projs.reduce((acc, p) => {
    if (!p || !p.parentId) return acc;
    (acc[p.parentId] = acc[p.parentId] || []).push(p);
    return acc;
  }, {});

  if (roots.length === 0) {
    el.projectsList.innerHTML = `
      <div class="empty-state">
        <p>No projects yet.</p>
        <p>Click <strong>+ Add project</strong> and choose a folder to get started.</p>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    el.projectsList.innerHTML = `<div class="empty-state"><p>No projects match your search.</p></div>`;
    return;
  }

  const pinned = sorted.filter(p => p.pinned === true);
  const unpinned = sorted.filter(p => !p.pinned);
  const parts = [];

  if (view.groupBy === 'none') {
    const combined = [...pinned, ...unpinned];
    if (view.viewMode === 'grid') {
      parts.push(`<div class="projects-grid">${combined.map(p => renderGridCard(p)).join('')}</div>`);
    } else {
      parts.push(combined.map(p => renderProjectCard(p, byParent[p.id])).join(''));
    }
  } else {
    const groupedPinned = groupProjects(pinned, view.groupBy);
    const groupedUnpinned = groupProjects(unpinned, view.groupBy);
    const renderSection = (grouped, sectionLabel) => {
      const keys = Object.keys(grouped).sort();
      for (const key of keys) {
        const items = grouped[key];
        if (items.length === 0) continue;
        const header = sectionLabel ? (key ? `${sectionLabel} — ${key}` : sectionLabel) : key;
        parts.push(`<div class="project-group-header">${escapeHtml(header)}</div><div class="project-group-line"></div>`);
        if (view.viewMode === 'grid') {
          parts.push(`<div class="projects-grid">${items.map(p => renderGridCard(p)).join('')}</div>`);
        } else {
          parts.push(items.map(p => renderProjectCard(p, byParent[p.id])).join(''));
        }
      }
    };
    if (pinned.length > 0) renderSection(groupedPinned, 'Pinned');
    if (unpinned.length > 0) renderSection(groupedUnpinned, 'Unpinned');
  }

  el.projectsList.innerHTML = parts.join('');

  el.projectsList.querySelectorAll('.project-name-link').forEach(a => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const { type, path, url } = a.dataset;
      if (type === 'url' && url) {
        try {
          await fetchJSON(`${API}/open-url`, { method: 'POST', body: JSON.stringify({ url }) });
        } catch (err) {
          console.error(err);
        }
      } else if (path) {
        openInExplorer(path);
      }
    });
  });
  el.projectsList.querySelectorAll('.project-open-cursor-link').forEach(a => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const path = a.dataset.path;
      const admin = a.dataset.admin === 'true';
      if (admin) {
        await openInCursorAdmin(path);
      } else {
        await openInCursor(path);
      }
    });
  });
  el.projectsList.querySelectorAll('.btn-gear').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const proj = projects.find(p => p.id === e.target.dataset.id);
      if (proj) openProjectSettingsModal(proj);
    });
  });
  el.projectsList.querySelectorAll('.project-description').forEach(desc => {
    desc.addEventListener('blur', (e) => saveDescription(e.target));
  });
  el.projectsList.querySelectorAll('.btn-remove-project').forEach(btn => {
    btn.addEventListener('click', (e) => removeProject(e.target.dataset.id));
  });
  el.projectsList.querySelectorAll('.btn-add-subproject').forEach(btn => {
    btn.addEventListener('click', (e) => openAddProject(e.target.dataset.parentId));
  });
  el.projectsList.querySelectorAll('.btn-sftp-upload').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const b = e.currentTarget;
      const proj = projects.find(p => p.id === b.dataset.id);
      if (proj) openSFTPModal(proj);
    });
  });
  el.projectsList.querySelectorAll('.git-toggle').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.git-section').classList.toggle('collapsed'));
  });
  el.projectsList.querySelectorAll('.project-link-icon').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const { type, url, path: projectPath } = e.currentTarget.dataset;
      if (!url) return;
      try {
        if (type === 'file') {
          const isRelativeToProject = url.startsWith('.') || ((!url.includes('/') && !url.includes('\\')) && !/^[a-zA-Z]:/.test(url));
          const pathToOpen = isRelativeToProject && projectPath
            ? `${projectPath.replace(/\\/g, '/')}/${url}`.replace(/\/+/g, '/').replace(/^\//, '')
            : url.replace(/\\/g, '/');
          await fetchJSON(`${API}/open-explorer`, { method: 'POST', body: JSON.stringify({ path: pathToOpen }) });
        } else {
          await fetchJSON(`${API}/open-url`, { method: 'POST', body: JSON.stringify({ url }) });
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  el.projectsList.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.project-card, .grid-card');
    if (!card) return;
    e.preventDefault();
    const id = card.dataset.id;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    contextMenuProjectId = id;
    const isUrl = project.type === 'url';
    const hasPath = project.type === 'folder' && project.path;
    const hasSftp = hasPath && project.serverId;
    if (el.projectContextPin) el.projectContextPin.hidden = project.pinned === true;
    if (el.projectContextUnpin) el.projectContextUnpin.hidden = !project.pinned;
    if (el.projectContextOpenCursor) el.projectContextOpenCursor.hidden = isUrl || !hasPath;
    if (el.projectContextOpenExplorer) el.projectContextOpenExplorer.hidden = isUrl || !hasPath;
    if (el.projectContextSftp) el.projectContextSftp.hidden = !hasSftp;
    if (el.projectContextAddSubproject) el.projectContextAddSubproject.hidden = isUrl;
    if (el.projectContextMenu) {
      el.projectContextMenu.style.left = e.clientX + 'px';
      el.projectContextMenu.style.top = e.clientY + 'px';
      el.projectContextMenu.hidden = false;
    }
  });
}

function closeProjectContextMenu() {
  contextMenuProjectId = null;
  if (el.projectContextMenu) el.projectContextMenu.hidden = true;
}

async function loadLocalListing(path) {
  const base = (sftpState.project && sftpState.project.path) ? sftpState.project.path : '.';
  const reqPath = path != null && path !== '' ? path : base;
  const res = await fetch(`${API}/sftp/local-list?path=${encodeURIComponent(reqPath)}`);
  if (!res.ok) throw new Error((await res.json()).error || 'List failed');
  const data = await res.json();
  sftpState.localCurrentPath = data.path;
  sftpState.localListing = data;
  return data;
}

async function loadRemoteListing(path) {
  path = path == null || path === '' ? '/' : path.replace(/\\/g, '/');
  if (!path.startsWith('/')) path = '/' + path;
  const res = await fetch(`${API}/sftp/list?credId=${encodeURIComponent(sftpState.credId)}&path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error((await res.json()).error || 'List failed');
  const data = await res.json();
  sftpState.remoteCurrentPath = data.path;
  sftpState.remoteListing = data;
  return data;
}

function renderPathbar(elBar, currentPath, isLocal) {
  if (!elBar) return;
  const base = (sftpState.project && sftpState.project.path) ? sftpState.project.path : '.';
  const parts = currentPath == null || currentPath === '' ? [] : String(currentPath).replace(/\\/g, '/').split('/').filter(Boolean);
  const segs = isLocal ? (parts.length ? parts : [base || 'Project']) : (currentPath === '/' ? ['/'] : ['/', ...parts]);
  elBar.innerHTML = segs.map((seg, i) => {
    const pathUp = isLocal ? (parts.length ? parts.slice(0, i + 1).join('/') : base) : (i === 0 ? '/' : '/' + parts.slice(0, i).join('/'));
    const label = seg === '/' ? 'Root' : seg;
    return `<span class="sftp-path-seg" data-path="${escapeAttr(pathUp)}">${escapeHtml(label)}</span>${i < segs.length - 1 ? '<span class="sftp-path-sep">/</span>' : ''}`;
  }).join('');
  elBar.querySelectorAll('.sftp-path-seg').forEach(seg => {
    seg.addEventListener('click', async () => {
      const p = seg.dataset.path;
      if (isLocal) {
        try {
          await loadLocalListing(p);
          renderLocalList();
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          await loadRemoteListing(p);
          renderRemoteList();
        } catch (err) {
          console.error(err);
        }
      }
    });
  });
}

function renderLocalList() {
  if (!el.sftpListLocalBody) return;
  renderPathbar(el.sftpLocalPathbar, sftpState.localCurrentPath, true);
  const list = sftpState.localListing;
  if (!list) {
    el.sftpListLocalBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Loading…</td></tr>';
    return;
  }
  const base = (sftpState.project && sftpState.project.path) || '.';
  const isRoot = !list.path || list.path === base || list.path === '.';
  const parentPath = isRoot ? null : list.path.replace(/\/[^/]+$/, '') || null;
  const rows = [];
  if (!isRoot && parentPath !== null) {
    rows.push(`<tr class="sftp-row sftp-row-parent" data-path="${escapeAttr(parentPath)}" data-type="dir"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-dir" title="Parent folder">↩</span></td><td class="sftp-col-name">..</td></tr>`);
  }
  (list.dirs || []).forEach(d => {
    rows.push(`<tr class="sftp-row sftp-row-dir" data-path="${escapeAttr(d.path)}" data-type="dir"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-dir" title="Directory">📁</span></td><td class="sftp-col-name">${escapeHtml(d.name)}</td></tr>`);
  });
  (list.files || []).forEach(f => {
    rows.push(`<tr class="sftp-row sftp-row-file" data-path="${escapeAttr(f.path)}" data-type="file"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-file" title="File">📄</span></td><td class="sftp-col-name">${escapeHtml(f.name)}</td></tr>`);
  });
  el.sftpListLocalBody.innerHTML = rows.join('');
  el.sftpListLocalBody.querySelectorAll('.sftp-row').forEach(row => {
    row.addEventListener('click', () => {
      el.sftpListLocalBody.querySelectorAll('.sftp-row.selected').forEach(s => s.classList.remove('selected'));
      row.classList.add('selected');
      sftpState.localSelected = { path: row.dataset.path, type: row.dataset.type };
      if (el.sftpLocalActions) el.sftpLocalActions.hidden = false;
      if (row.dataset.type === 'file' && el.sftpDestOptions) {
        el.sftpDestOptions.hidden = false;
        const destLabel = el.sftpDestOptions.querySelector('.sftp-dest-label');
        if (destLabel) destLabel.textContent = `Copy to current server directory: ${sftpState.remoteCurrentPath || '/'}`;
      }
    });
    row.addEventListener('dblclick', async () => {
      if (row.classList.contains('sftp-row-parent')) {
        try {
          await loadLocalListing(row.dataset.path);
          renderLocalList();
        } catch (err) {
          console.error(err);
        }
        return;
      }
      if (row.dataset.type !== 'dir') return;
      try {
        await loadLocalListing(row.dataset.path);
        renderLocalList();
      } catch (err) {
        console.error(err);
      }
    });
  });
}

function renderRemoteList() {
  if (!el.sftpListRemoteBody) return;
  renderPathbar(el.sftpRemotePathbar, sftpState.remoteCurrentPath, false);
  const list = sftpState.remoteListing;
  if (!list) {
    el.sftpListRemoteBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Loading…</td></tr>';
    return;
  }
  const isRoot = list.path === '/';
  const parentPath = isRoot ? null : (list.path.replace(/\/[^/]+$/, '') || '/');
  const rows = [];
  if (!isRoot && parentPath !== null) {
    rows.push(`<tr class="sftp-row sftp-row-parent" data-path="${escapeAttr(parentPath)}" data-type="dir"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-dir" title="Parent folder">↩</span></td><td class="sftp-col-name">..</td></tr>`);
  }
  const entries = (list.entries || []).slice().sort((a, b) => {
    const aDir = (a.type || 'file') === 'dir' ? 0 : 1;
    const bDir = (b.type || 'file') === 'dir' ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return (a.name || '').localeCompare(b.name || '');
  });
  entries.forEach(e => {
    const type = e.type || 'file';
    const icon = type === 'dir' ? '📁' : '📄';
    const cls = type === 'dir' ? 'sftp-row-dir' : 'sftp-row-file';
    rows.push(`<tr class="sftp-row ${cls}" data-path="${escapeAttr(e.path)}" data-type="${escapeAttr(type)}"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-${type}" title="${type === 'dir' ? 'Directory' : 'File'}">${icon}</span></td><td class="sftp-col-name">${escapeHtml(e.name)}</td></tr>`);
  });
  el.sftpListRemoteBody.innerHTML = rows.join('');
  el.sftpListRemoteBody.querySelectorAll('.sftp-row').forEach(row => {
    row.addEventListener('click', () => {
      el.sftpListRemoteBody.querySelectorAll('.sftp-row.selected').forEach(s => s.classList.remove('selected'));
      row.classList.add('selected');
      sftpState.remoteSelected = { path: row.dataset.path, type: row.dataset.type };
      if (el.sftpRemoteActions) el.sftpRemoteActions.hidden = row.classList.contains('sftp-row-parent');
      if (el.sftpDestOptions) {
        el.sftpDestOptions.hidden = false;
        const destLabel = el.sftpDestOptions.querySelector('.sftp-dest-label');
        if (destLabel) destLabel.textContent = '↓ Save here';
      }
    });
    row.addEventListener('contextmenu', (e) => {
      if (row.classList.contains('sftp-row-parent')) return;
      e.preventDefault();
      e.stopPropagation();
      sftpState.downloadRemotePath = row.dataset.path;
      sftpState.downloadRemoteType = row.dataset.type || 'file';
      if (el.sftpRemoteContextMenu) {
        el.sftpRemoteContextMenu.style.left = e.clientX + 'px';
        el.sftpRemoteContextMenu.style.top = e.clientY + 'px';
        el.sftpRemoteContextMenu.hidden = false;
      }
    });
    row.addEventListener('dblclick', async () => {
      if (row.classList.contains('sftp-row-parent')) {
        try {
          await loadRemoteListing(row.dataset.path);
          renderRemoteList();
        } catch (err) {
          console.error(err);
        }
        return;
      }
      if (row.dataset.type !== 'dir') return;
      try {
        await loadRemoteListing(row.dataset.path);
        renderRemoteList();
      } catch (err) {
        console.error(err);
      }
    });
  });
  if (sftpState.localSelected && sftpState.localSelected.type === 'file' && el.sftpDestOptions && !el.sftpDestOptions.hidden) {
    const destLabel = el.sftpDestOptions.querySelector('.sftp-dest-label');
    if (destLabel) destLabel.textContent = `Copy to current server directory: ${sftpState.remoteCurrentPath || '/'}`;
  }
}

function closeSftpRemoteContextMenu() {
  if (el.sftpRemoteContextMenu) el.sftpRemoteContextMenu.hidden = true;
}

function openSftpDownloadModal() {
  const remotePath = sftpState.downloadRemotePath;
  const baseDir = (sftpState.project && sftpState.project.path) ? sftpState.project.path : '.';
  closeSftpRemoteContextMenu();
  if (!remotePath || !el.modalSftpDownload) return;
  if (el.sftpDownloadLocalPath) el.sftpDownloadLocalPath.value = baseDir;
  if (el.sftpDownloadRemotePath) el.sftpDownloadRemotePath.textContent = remotePath;
  if (el.sftpDownloadBrowsePanel) el.sftpDownloadBrowsePanel.hidden = true;
  el.modalSftpDownload.showModal();
}

async function runSftpDownloadOne(remotePath, localPath) {
  const res = await fetch(`${API}/sftp/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credId: sftpState.credId,
      remotePath,
      localPath,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Download failed');
  return data;
}

function renderSftpGroupSelect() {
  if (!el.sftpGroupSelect) return;
  const groups = sftpState.mappingGroups || [];
  el.sftpGroupSelect.innerHTML = groups.map(g => `<option value="${escapeAttr(g.id)}" ${g.id === sftpState.selectedGroupId ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('');
}

function renderSftpMappings() {
  if (!el.sftpMappingsList) return;
  const uploadRows = (sftpState.mappings || []).map((m, i) => {
    const ov = m.overwrite ? '<span class="sftp-mapping-ico sftp-mapping-ico-on" title="Overwrite if present">O</span>' : '<span class="sftp-mapping-ico" title="Overwrite if present">O</span>';
    const ask = m.askBeforeOverwrite ? '<span class="sftp-mapping-ico sftp-mapping-ico-on" title="Ask before overwriting">A</span>' : '<span class="sftp-mapping-ico" title="Ask before overwriting">A</span>';
    const selected = sftpState.editingMappingIndex === i ? ' sftp-mapping-item-selected' : '';
    return `<div class="sftp-mapping-item sftp-mapping-upload${selected}" data-index="${i}" data-type="upload"><span class="sftp-mapping-clickable"><span class="sftp-mapping-badge sftp-mapping-badge-upload">↑</span> <span class="sftp-mapping-local">${escapeHtml(m.localPath)}</span> → <span class="sftp-mapping-remote">${escapeHtml(m.remotePath)}</span> <span class="sftp-mapping-icos">${ov}${ask}</span></span><button type="button" class="btn btn-ghost btn-small sftp-mapping-remove" data-index="${i}" data-type="upload" aria-label="Remove">×</button></div>`;
  });
  const downloadRows = (sftpState.downloadMappings || []).map((m, i) => {
    const selected = sftpState.editingDownloadMappingIndex === i ? ' sftp-mapping-item-selected' : '';
    return `<div class="sftp-mapping-item sftp-mapping-download${selected}" data-index="${i}" data-type="download"><span class="sftp-mapping-clickable"><span class="sftp-mapping-badge sftp-mapping-badge-download">↓</span> <span class="sftp-mapping-remote">${escapeHtml(m.remotePath)}</span> → <span class="sftp-mapping-local">${escapeHtml(m.localPath)}</span></span><button type="button" class="btn btn-ghost btn-small sftp-mapping-remove" data-index="${i}" data-type="download" aria-label="Remove">×</button></div>`;
  });
  el.sftpMappingsList.innerHTML = uploadRows.join('') + downloadRows.join('');
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-item[data-type="upload"] .sftp-mapping-clickable').forEach((clickable, i) => {
    clickable.addEventListener('click', () => selectMappingForEdit(parseInt(clickable.closest('.sftp-mapping-item').dataset.index, 10)));
  });
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-item[data-type="download"] .sftp-mapping-clickable').forEach((clickable) => {
    const item = clickable.closest('.sftp-mapping-item');
    const idx = parseInt(item.dataset.index, 10);
    clickable.addEventListener('click', () => {
      sftpState.editingMappingIndex = null;
      sftpState.editingDownloadMappingIndex = idx;
      if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
      renderSftpMappings();
    });
  });
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-remove[data-type="upload"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      sftpState.mappings.splice(idx, 1);
      if (sftpState.editingMappingIndex !== null && sftpState.editingMappingIndex >= sftpState.mappings.length) sftpState.editingMappingIndex = null;
      if (sftpState.editingMappingIndex !== null && sftpState.editingMappingIndex > idx) sftpState.editingMappingIndex--;
      renderSftpMappings();
      if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = sftpState.editingMappingIndex == null;
    });
  });
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-remove[data-type="download"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      sftpState.downloadMappings.splice(idx, 1);
      if (sftpState.editingDownloadMappingIndex !== null && sftpState.editingDownloadMappingIndex >= sftpState.downloadMappings.length) sftpState.editingDownloadMappingIndex = null;
      if (sftpState.editingDownloadMappingIndex !== null && sftpState.editingDownloadMappingIndex > idx) sftpState.editingDownloadMappingIndex--;
      renderSftpMappings();
    });
  });
}

async function selectMappingForEdit(index) {
  const m = sftpState.mappings[index];
  if (!m) return;
  sftpState.editingMappingIndex = index;
  const base = (sftpState.project && sftpState.project.path) || '.';
  const localParent = m.localPath.replace(/\/[^/]+$/, '') || base;
  const remoteParent = m.remotePath === '/' || !m.remotePath ? '/' : m.remotePath.replace(/\/[^/]+$/, '') || '/';
  try {
    await loadLocalListing(localParent);
    renderLocalList();
  } catch (err) {
    console.error(err);
  }
  try {
    await loadRemoteListing(remoteParent);
    renderRemoteList();
  } catch (err) {
    console.error(err);
  }
  if (el.sftpListLocalBody) {
    el.sftpListLocalBody.querySelectorAll('tr.sftp-row.selected').forEach(r => r.classList.remove('selected'));
    for (const row of el.sftpListLocalBody.querySelectorAll('tr.sftp-row')) {
      if (row.dataset.path === m.localPath) {
        row.classList.add('selected');
        sftpState.localSelected = { path: m.localPath, type: row.dataset.type || 'file' };
        break;
      }
    }
  }
  if (el.sftpListRemoteBody) {
    el.sftpListRemoteBody.querySelectorAll('tr.sftp-row.selected').forEach(r => r.classList.remove('selected'));
    const normRemote = m.remotePath.startsWith('/') ? m.remotePath : '/' + m.remotePath;
    for (const row of el.sftpListRemoteBody.querySelectorAll('tr.sftp-row')) {
      if (row.dataset.path === normRemote) {
        row.classList.add('selected');
        sftpState.remoteSelected = { path: row.dataset.path, type: row.dataset.type || 'dir' };
        break;
      }
    }
  }
  if (el.sftpOverwrite) el.sftpOverwrite.checked = !!m.overwrite;
  if (el.sftpAskOverwrite) { el.sftpAskOverwrite.disabled = !m.overwrite; el.sftpAskOverwrite.checked = !!m.askBeforeOverwrite; }
  if (el.sftpLocalActions) el.sftpLocalActions.hidden = false;
  if (el.sftpDestOptions) el.sftpDestOptions.hidden = false;
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = false;
  renderSftpMappings();
}

function addSftpMapping() {
  if (!sftpState.localSelected) return;
  const localName = sftpState.localSelected.path.split('/').pop();
  let dest;
  if (sftpState.localSelected.type === 'file') {
    const base = (sftpState.remoteCurrentPath || '/').replace(/\\/g, '/').replace(/\/$/, '') || '';
    dest = base ? base + '/' + localName : '/' + localName;
    if (!dest.startsWith('/')) dest = '/' + dest;
  } else {
    if (!sftpState.remoteSelected) return;
    const remotePath = sftpState.remoteSelected.type === 'dir' ? sftpState.remoteSelected.path : sftpState.remoteSelected.path.replace(/\/[^/]+$/, '') || '/';
    const normRemote = remotePath.replace(/\/$/, '') || '/';
    const remoteEndsWithLocal = normRemote === '/' + localName || normRemote.endsWith('/' + localName);
    dest = remotePath === '/' ? localName : (remoteEndsWithLocal ? normRemote : (normRemote === '/' ? localName : normRemote + '/' + localName));
    if (!dest.startsWith('/')) dest = '/' + dest;
  }
  const overwrite = el.sftpOverwrite && el.sftpOverwrite.checked;
  const askBeforeOverwrite = el.sftpAskOverwrite && el.sftpAskOverwrite.checked;
  sftpState.editingMappingIndex = null;
  sftpState.mappings.push({ localPath: sftpState.localSelected.path, remotePath: dest, overwrite, askBeforeOverwrite });
  renderSftpMappings();
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
}

function getCurrentGroup() {
  const id = sftpState.selectedGroupId;
  return (sftpState.mappingGroups || []).find(g => g.id === id) || sftpState.mappingGroups[0];
}

function setCurrentGroupMappings() {
  const g = getCurrentGroup();
  if (g) {
    sftpState.mappings = Array.isArray(g.uploadMappings) ? g.uploadMappings.slice() : [];
    sftpState.downloadMappings = Array.isArray(g.downloadMappings) ? g.downloadMappings.slice() : [];
  } else {
    sftpState.mappings = [];
    sftpState.downloadMappings = [];
  }
}

function syncCurrentGroupFromState() {
  const g = getCurrentGroup();
  if (g) {
    g.uploadMappings = (sftpState.mappings || []).slice();
    g.downloadMappings = (sftpState.downloadMappings || []).slice();
  }
}

function showMappingGroupNameModal(title, initialValue) {
  return new Promise((resolve) => {
    if (el.mappingGroupNameTitle) el.mappingGroupNameTitle.textContent = title;
    if (el.mappingGroupNameInput) {
      el.mappingGroupNameInput.value = initialValue || '';
      el.mappingGroupNameInput.select();
    }
    sftpState.groupNameModalResolve = resolve;
    if (el.modalMappingGroupName) el.modalMappingGroupName.showModal();
    setTimeout(() => el.mappingGroupNameInput && el.mappingGroupNameInput.focus(), 50);
  });
}

async function openSFTPModal(project) {
  if (!project || !project.serverId || !project.path || el.modalSftp == null) return;
  sftpState.project = project;
  sftpState.credId = project.serverId;
  if (Array.isArray(project.mappingGroups) && project.mappingGroups.length) {
    sftpState.mappingGroups = project.mappingGroups.map(g => ({
      id: g.id,
      name: g.name || 'Unnamed',
      uploadMappings: (g.uploadMappings || []).slice(),
      downloadMappings: (g.downloadMappings || []).slice(),
    }));
  } else {
    sftpState.mappingGroups = [{
      id: 'default',
      name: 'Default',
      uploadMappings: Array.isArray(project.uploadMappings) ? project.uploadMappings.slice() : [],
      downloadMappings: [],
    }];
  }
  sftpState.selectedGroupId = sftpState.mappingGroups[0] ? sftpState.mappingGroups[0].id : null;
  setCurrentGroupMappings();
  sftpState.localCurrentPath = project.path || '.';
  sftpState.remoteCurrentPath = '/';
  sftpState.localListing = null;
  sftpState.remoteListing = null;
  sftpState.localSelected = null;
  sftpState.remoteSelected = null;
  sftpState.editingMappingIndex = null;
  sftpState.editingDownloadMappingIndex = null;
  if (el.sftpModalTitle) el.sftpModalTitle.textContent = 'SFTP upload — ' + (project.name || 'Project');
  if (el.sftpLocalActions) el.sftpLocalActions.hidden = true;
  if (el.sftpRemoteActions) el.sftpRemoteActions.hidden = true;
  if (el.sftpDestOptions) el.sftpDestOptions.hidden = true;
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  if (el.sftpOverwrite) el.sftpOverwrite.checked = false;
  if (el.sftpAskOverwrite) { el.sftpAskOverwrite.disabled = true; el.sftpAskOverwrite.checked = false; }
  setSftpStatus('connecting');
  renderSftpGroupSelect();
  renderSftpMappings();
  el.modalSftp.showModal();
  try {
    await loadLocalListing(project.path);
    renderLocalList();
  } catch (err) {
    console.error(err);
    if (el.sftpListLocalBody) el.sftpListLocalBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Error: ' + escapeHtml(err.message) + '</td></tr>';
    if (el.sftpLocalPathbar) el.sftpLocalPathbar.textContent = project.path || '';
  }
  try {
    await loadRemoteListing('/');
    setSftpStatus('connected');
    renderRemoteList();
  } catch (err) {
    console.error(err);
    setSftpStatus('disconnected');
    if (el.sftpListRemoteBody) el.sftpListRemoteBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Error: ' + escapeHtml(err.message) + '</td></tr>';
    if (el.sftpRemotePathbar) el.sftpRemotePathbar.textContent = '/';
  }
}

function sftpLog(msg) {
  if (!el.sftpProgressLog) return;
  const line = document.createElement('div');
  line.textContent = msg;
  el.sftpProgressLog.appendChild(line);
  el.sftpProgressLog.scrollTop = el.sftpProgressLog.scrollHeight;
}

async function runSftpUpload() {
  if (!sftpState.project || !sftpState.credId || sftpState.mappings.length === 0) return;
  if (el.modalSftpProgress) el.modalSftpProgress.showModal();
  const titleEl = document.getElementById('sftp-progress-title');
  if (titleEl) titleEl.textContent = 'Upload progress';
  if (el.sftpProgressLog) el.sftpProgressLog.innerHTML = '';
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = true;
  for (const m of sftpState.mappings) {
    let overwrite = m.askBeforeOverwrite ? false : m.overwrite;
    const o = m.overwrite ? 'O' : 'o';
    const a = m.askBeforeOverwrite ? 'A' : 'a';
    const settingsTag = `(${o} ${a})`;
    sftpLog(`Uploading ${m.localPath} → ${m.remotePath} ${settingsTag}…`);
    for (;;) {
      try {
        const res = await fetch(`${API}/sftp/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credId: sftpState.credId,
            localPath: m.localPath,
            remotePath: m.remotePath,
            overwrite,
            askBeforeOverwrite: !!m.askBeforeOverwrite,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.needOverwriteConfirm && m.askBeforeOverwrite) {
          if (el.sftpOverwriteMessage) el.sftpOverwriteMessage.textContent = `Overwrite ${data.path || m.remotePath} on server?`;
          if (el.modalSftpOverwrite) el.modalSftpOverwrite.showModal();
          const choice = await new Promise((resolve) => {
            sftpState.overwriteResolve = resolve;
          });
          sftpState.overwriteResolve = null;
          if (el.modalSftpOverwrite) el.modalSftpOverwrite.close();
          if (choice) overwrite = true;
          else { sftpLog(`Skipped (no overwrite): ${m.remotePath}`); break; }
          continue;
        }
        if (!res.ok) {
          const errMsg = data.error || 'Upload failed';
          const verbose = data.verbose || errMsg;
          throw new Error(verbose);
        }
        if (data.skipped) {
          sftpLog(`No changes made, skipping: ${m.remotePath}`);
        } else {
          sftpLog(`Done: ${m.remotePath}`);
        }
        break;
      } catch (err) {
        const errMsg = err.message || 'Upload failed';
        sftpLog(`Error ${settingsTag}: ${errMsg}`);
        const logMessage = `sftp-upload ${settingsTag} ${m.localPath} → ${m.remotePath}: ${errMsg}`;
        try {
          fetch(API + '/log-client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'sftp-upload', message: logMessage }),
          }).catch(() => {});
        } catch (e) {}
        break;
      }
    }
  }
  sftpLog('Upload run finished.');
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = false;
}

async function runSftpDownload() {
  const list = sftpState.downloadMappings || [];
  if (!sftpState.project || !sftpState.credId || list.length === 0) return;
  if (el.modalSftpProgress) el.modalSftpProgress.showModal();
  const titleEl = document.getElementById('sftp-progress-title');
  if (titleEl) titleEl.textContent = 'Download progress';
  if (el.sftpProgressLog) el.sftpProgressLog.innerHTML = '';
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = true;
  for (const m of list) {
    sftpLog(`Downloading ${m.remotePath} → ${m.localPath}…`);
    try {
      await runSftpDownloadOne(m.remotePath, m.localPath);
      sftpLog(`Done: ${m.localPath}`);
    } catch (err) {
      sftpLog(`Error: ${err.message || 'Download failed'}`);
    }
  }
  sftpLog('Download run finished.');
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = false;
}

function addSftpDownloadMapping() {
  if (!sftpState.remoteSelected) return;
  const baseDir = (sftpState.project && sftpState.project.path) || '.';
  const remotePath = sftpState.remoteSelected.path;
  const remoteName = remotePath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'download';
  const localPath = baseDir.replace(/\/$/, '') + '/' + remoteName;
  sftpState.downloadMappings.push({ remotePath, localPath });
  sftpState.editingDownloadMappingIndex = null;
  renderSftpMappings();
}

async function setProjectPinned(projectId, pinned) {
  if (!projectId) return;
  try {
    await fetchJSON(`${API}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ pinned }),
    });
    await loadProjects();
    if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
  } catch (err) {
    alert(err.message || 'Failed to update pin');
  }
}

function renderProjectCard(project, subprojects = [], isSub = false) {
  const isUrlProject = project.type === 'url';
  const git = project.git || null;
  const useCursor = project.openInCursor === true && !isUrlProject;
  const useAdmin = project.openInCursorAdmin === true;
  const cursorLinkHtml = useCursor
    ? `<a href="#" class="project-open-cursor-link" data-path="${escapeAttr(project.path)}" data-admin="${useAdmin}" title="Open in Cursor${useAdmin ? ' (Admin)' : ''}">&lt;/&gt;</a>`
    : '';
  const subCards = (subprojects || []).map(sp => renderProjectCard(sp, null, true)).join('');

  function statusCodeClass(code) {
    if (!code || code === '  ') return '';
    const c = (code[0] !== ' ' ? code[0] : code[1]).toUpperCase();
    if (c === '?' || code.trim() === '??') return 'status-untracked';
    if (c === '!') return 'status-ignored';
    return 'status-' + c;
  }
  let gitBlock = '';
  if (git && git.isRepo) {
    if (git.error) {
      gitBlock = `<div class="git-section collapsed"><button type="button" class="git-toggle">Git</button><div class="git-body"><table class="git-table"><tr class="git-row-error"><th></th><td>${escapeHtml(git.error)}</td></tr></table></div></div>`;
    } else {
      const rows = [];
      if (git.branch) rows.push(['Branch', git.branch]);
      if (git.upstream) rows.push(['Tracking', git.upstream]);
      if (git.remoteHost) rows.push(['Host', git.remoteHost]);
      if (git.remoteAccount) rows.push(['Account', git.remoteAccount]);
      if (git.remoteRepo) rows.push(['Repo', git.remoteRepo]);
      if (git.remote) rows.push(['Origin URL', git.remote]);
      if (git.remotes && git.remotes.length) {
        const unique = [...new Map(git.remotes.map(r => [r.name, r.url])).entries()];
        rows.push(['Remotes', unique.map(([n, u]) => n + ' = ' + u).join(' | ')]);
      }
      if (git.userName) rows.push(['Config user', git.userName]);
      if (git.userEmail) rows.push(['Config email', git.userEmail]);
      if (git.lastCommit) rows.push(['Last commit', git.lastCommit]);
      if (git.lastCommitAuthor) rows.push(['Author', git.lastCommitAuthor]);
      if (git.lastCommitDate) rows.push(['Date', git.lastCommitDate]);
      let tableRows = rows.length
        ? rows.map(([k, v]) => '<tr><th>' + escapeHtml(k) + '</th><td>' + escapeHtml(v) + '</td></tr>').join('')
        : '<tr class="git-row-muted"><th></th><td>No git details available.</td></tr>';
      let statusRows = '';
      if (git.status) {
        const statusLines = git.status.split('\n').filter(Boolean);
        statusRows = '<table class="git-status-table"><thead><tr><th>Status</th><th>Path</th></tr></thead><tbody>' +
          statusLines.map(line => {
            const code = line.slice(0, 2);
            const path = line.slice(2).trim();
            const cls = statusCodeClass(code);
            const codeDisplay = code.trim() || '??';
            return '<tr><td><span class="git-status-code ' + cls + '">' + escapeHtml(codeDisplay) + '</span></td><td>' + escapeHtml(path) + '</td></tr>';
          }).join('') +
          '</tbody></table>';
      }
      gitBlock = `<div class="git-section collapsed"><button type="button" class="git-toggle">Git</button><div class="git-body"><table class="git-table">${tableRows}</table>${statusRows}</div></div>`;
    }
  }

  const hasImage = project.imagePath || project.imageUrl;
  const imageSrc = project.imagePath ? `${API}/project-image/${project.id}` : (project.imageUrl || '');
  const imageHtml = hasImage
    ? `<div class="project-card-image"><img src="${escapeAttr(imageSrc)}" alt="" /></div>`
    : '';

  const tagList = (project.tags || []).filter(t => t != null && String(t).trim());
  const tagsHtml = tagList.length
    ? tagList.map((t, i) => {
        const colorClass = 'tag-color-' + (Math.abs(hashCode(String(t).trim())) % 8);
        return `<span class="project-tag ${colorClass}">${escapeHtml(String(t).trim())}</span>`;
      }).join('')
    : '';

  const linksList = project.links || [];
  const linksHtml = linksList.length
    ? linksList.map(l => {
        const type = l.type === 'file' ? 'file' : 'url';
        const title = l.description || l.url || (type === 'file' ? 'Open folder' : 'Open link');
        return `<button type="button" class="project-link-icon" title="${escapeAttr(title)}" data-type="${escapeAttr(type)}" data-url="${escapeAttr(l.url)}" data-path="${escapeAttr(project.path)}" aria-label="Open link">&#128279;</button>`;
      }).join('')
    : '';

  const pinIndicator = project.pinned ? '<span class="project-pin-indicator" title="Pinned">&#128204;</span>' : '';
  return `
    <div class="project-card ${isSub ? 'subproject' : ''} ${project.pinned ? 'is-pinned' : ''}" data-id="${project.id}">
      <div class="project-card-top">
        ${hasImage ? `<div class="project-card-top-left">${imageHtml}</div>` : ''}
        <div class="project-card-top-right">
          <div class="project-card-header">
            ${pinIndicator}
            <a href="#" class="project-name-link" data-type="${escapeAttr(project.type || 'folder')}" data-path="${escapeAttr(project.path || '')}" data-url="${escapeAttr(project.url || '')}" data-id="${project.id}" title="${isUrlProject ? 'Open URL' : 'Open in File Explorer'}">${escapeHtml(project.name)}</a>
            ${cursorLinkHtml}
            ${linksHtml}
            <div class="project-actions">
              ${project.serverId && project.type === 'folder' && project.path ? `<button type="button" class="btn-sftp-upload" data-id="${project.id}" title="SFTP upload" aria-label="SFTP upload"><span class="sftp-arrow">↑</span>${!(project.uploadMappings && project.uploadMappings.length) ? '<sup class="sftp-new">+</sup>' : ''}</button>` : ''}
              <button type="button" class="btn-gear" data-id="${project.id}" title="Project settings" aria-label="Project settings">&#x2699;</button>
              <button type="button" class="btn-remove-x btn-remove-project" data-id="${project.id}" title="Remove from list" aria-label="Remove from list">&#x2715;</button>
            </div>
          </div>
          <div class="project-description" contenteditable="true" data-id="${project.id}">${escapeHtml(project.description || '')}</div>
          ${tagsHtml ? `<div class="project-tags">${tagsHtml}</div>` : ''}
          <div class="project-card-footer">
            <button type="button" class="btn btn-small btn-add-subproject" data-parent-id="${project.id}">+ Add subproject</button>
          </div>
        </div>
      </div>
      ${gitBlock || subCards ? `<div class="project-card-bottom">${gitBlock}${subCards ? `<div class="subprojects-list">${subCards}</div>` : ''}</div>` : ''}
    </div>`;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return h;
}

function renderGridCard(project) {
  const isUrlProject = project.type === 'url';
  const useCursor = project.openInCursor === true && !isUrlProject;
  const useAdmin = project.openInCursorAdmin === true;
  const cursorLinkHtml = useCursor
    ? `<a href="#" class="project-open-cursor-link" data-path="${escapeAttr(project.path)}" data-admin="${useAdmin}" title="Open in Cursor${useAdmin ? ' (Admin)' : ''}">&lt;/&gt;</a>`
    : '';
  const hasImage = project.imagePath || project.imageUrl;
  const imageSrc = hasImage
    ? (project.imagePath ? `${API}/project-image/${project.id}` : (project.imageUrl || ''))
    : '';
  const bgStyle = imageSrc ? ` style="background-image: url('${escapeAttr(imageSrc).replace(/'/g, '&#39;')}');"` : '';
  const linksList = project.links || [];
  const linksHtml = linksList.length
    ? linksList.map(l => {
        const type = l.type === 'file' ? 'file' : 'url';
        const title = l.description || l.url || (type === 'file' ? 'Open folder' : 'Open link');
        return `<button type="button" class="project-link-icon" title="${escapeAttr(title)}" data-type="${escapeAttr(type)}" data-url="${escapeAttr(l.url)}" data-path="${escapeAttr(project.path)}" aria-label="Open link">&#128279;</button>`;
      }).join('')
    : '';
  const pinIndicator = project.pinned ? '<span class="project-pin-indicator" title="Pinned">&#128204;</span>' : '';
  return `
    <div class="grid-card ${project.pinned ? 'is-pinned' : ''}" data-id="${project.id}">
      <div class="grid-card-bg"${bgStyle}></div>
      <div class="grid-card-top-panel">
        ${pinIndicator}
        <a href="#" class="project-name-link" data-type="${escapeAttr(project.type || 'folder')}" data-path="${escapeAttr(project.path || '')}" data-url="${escapeAttr(project.url || '')}" data-id="${project.id}" title="${isUrlProject ? 'Open URL' : 'Open in File Explorer'}">${escapeHtml(project.name)}</a>
        ${cursorLinkHtml}
        ${linksHtml}
        <div class="grid-card-actions">
          ${project.serverId && project.type === 'folder' && project.path ? `<button type="button" class="btn-sftp-upload" data-id="${project.id}" title="SFTP upload" aria-label="SFTP upload"><span class="sftp-arrow">↑</span>${!(project.uploadMappings && project.uploadMappings.length) ? '<sup class="sftp-new">+</sup>' : ''}</button>` : ''}
          <button type="button" class="btn-gear" data-id="${project.id}" title="Project settings" aria-label="Project settings">&#x2699;</button>
          <button type="button" class="btn-remove-x btn-remove-project" data-id="${project.id}" title="Remove from list" aria-label="Remove from list">&#x2715;</button>
        </div>
      </div>
      <div class="grid-card-bottom-panel">
        <span class="grid-card-description">${escapeHtml((project.description || '').slice(0, 80))}${(project.description || '').length > 80 ? '…' : ''}</span>
      </div>
    </div>`;
}

function escapeHtml(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function openInExplorer(path) {
  await fetchJSON(`${API}/open-explorer`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function openInCursor(path) {
  await fetchJSON(`${API}/open-cursor`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function openInCursorAdmin(path) {
  await fetchJSON(`${API}/open-cursor-admin`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function saveDescription(el) {
  const id = el.dataset.id;
  const description = el.textContent.trim();
  await fetchJSON(`${API}/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  });
}

async function removeProject(id) {
  if (!confirm('Remove this project from the list? (The folder is not deleted.)')) return;
  await fetchJSON(`${API}/projects/${id}`, { method: 'DELETE' });
  await loadProjects();
}

async function associateServer(projectId, serverId) {
  await fetchJSON(`${API}/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ serverId: serverId || null }),
  });
  await loadProjects();
}

function updateAddProjectFieldsVisibility() {
  const isEdit = !!el.projectId.value;
  const isUrl = el.projectTypeUrl && el.projectTypeUrl.checked;
  if (el.fieldProjectType) el.fieldProjectType.hidden = isEdit;
  if (el.fieldProjectPath) el.fieldProjectPath.hidden = isEdit || isUrl;
  if (el.fieldProjectUrl) el.fieldProjectUrl.hidden = isEdit || !isUrl;
  if (el.browsePanel) el.browsePanel.hidden = true;
}

function openAddProject(parentId = null) {
  el.projectId.value = '';
  el.projectParentId.value = parentId || '';
  el.projectPath.value = '';
  if (el.projectUrl) el.projectUrl.value = '';
  if (el.projectTypeFolder) el.projectTypeFolder.checked = true;
  if (el.projectTypeUrl) el.projectTypeUrl.checked = false;
  el.projectName.value = '';
  el.projectDescription.value = '';
  if (el.projectCategory) { el.projectCategory.value = ''; populateCategoryDatalist(el.projectCategoryList, ''); }
  projectTagsArray = [];
  if (el.projectTagsChips) renderTagsChips(el.projectTagsChips, [], () => {});
  if (el.projectTagsInput) el.projectTagsInput.value = '';
  if (el.projectTagsSuggestions) { el.projectTagsSuggestions.hidden = true; el.projectTagsSuggestions.innerHTML = ''; }
  el.modalProjectTitle.textContent = parentId ? 'Add subproject' : 'Add project';
  el.browsePanel.hidden = true;
  updateAddProjectFieldsVisibility();
  el.modalProject.showModal();
}

function openEditProject(project) {
  el.projectId.value = project.id;
  el.projectParentId.value = project.parentId || '';
  el.projectPath.value = project.path || '';
  if (el.projectUrl) el.projectUrl.value = project.url || '';
  el.projectName.value = project.name;
  el.projectDescription.value = project.description || '';
  el.modalProjectTitle.textContent = 'Edit project';
  el.browsePanel.hidden = true;
  updateAddProjectFieldsVisibility();
  el.modalProject.showModal();
}

async function openProjectSettingsModal(project) {
  await loadCredentials();
  el.projectSettingsId.value = project.id;
  const isUrlProject = project.type === 'url';
  el.projectSettingsOpenCursor.checked = project.openInCursor === true;
  el.projectSettingsOpenCursorAdmin.checked = project.openInCursorAdmin === true;
  el.projectSettingsOpenCursorAdmin.disabled = !project.openInCursor;
  el.projectSettingsPath.value = project.path || '';
  if (el.projectSettingsUrl) el.projectSettingsUrl.value = project.url || '';
  if (el.fieldProjectSettingsCursor) el.fieldProjectSettingsCursor.hidden = isUrlProject;
  if (el.fieldProjectSettingsPath) el.fieldProjectSettingsPath.hidden = isUrlProject;
  if (el.fieldProjectSettingsUrl) el.fieldProjectSettingsUrl.hidden = !isUrlProject;
  const imageFromUrl = !!project.imageUrl;
  if (el.projectSettingsImageSourceLocal) el.projectSettingsImageSourceLocal.checked = !imageFromUrl;
  if (el.projectSettingsImageSourceUrl) el.projectSettingsImageSourceUrl.checked = imageFromUrl;
  if (el.projectSettingsImageUrl) el.projectSettingsImageUrl.value = project.imageUrl || '';
  updateProjectSettingsImageFieldsVisibility();
  el.projectSettingsDescription.value = project.description || '';
  if (el.projectSettingsCategory) { el.projectSettingsCategory.value = project.category || ''; populateCategoryDatalist(el.projectSettingsCategoryList, project.category || ''); }
  projectSettingsTagsArray = [...(project.tags || [])];
  if (el.projectSettingsTagsChips) renderTagsChips(el.projectSettingsTagsChips, projectSettingsTagsArray, makeTagsRemoveFn(el.projectSettingsTagsChips, projectSettingsTagsArray));
  if (el.projectSettingsTagsInput) el.projectSettingsTagsInput.value = '';
  projectSettingsLinks = (project.links || []).map(l => ({
    type: l.type === 'file' ? 'file' : 'url',
    description: l.description || '',
    url: l.url || '',
  }));
  renderSettingsLinksList();
  el.projectSettingsServer.innerHTML = '<option value="">— No server —</option>' +
    credentials.map(c => `<option value="${c.id}" ${project.serverId === c.id ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.host)})</option>`).join('');
  el.projectSettingsBrowsePanel.hidden = true;
  el.modalProjectSettings.showModal();
}

async function loadBrowseForProjectSettings(dirPath) {
  const normalized = dirPath.replace(/\\/g, '/');
  const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(normalized)}`);
  browseStateSettings = data;
  el.projectSettingsBrowseCurrent.textContent = data.absolute || data.path || dirPath;
  const sep = '/';
  el.projectSettingsBrowseDirs.innerHTML = data.dirs.map(d => {
    const subPath = data.path ? data.path + sep + d.name : d.name;
    return `<li data-path="${escapeAttr(subPath)}">${escapeHtml(d.name)}</li>`;
  }).join('');
  el.projectSettingsBrowseDirs.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', async () => loadBrowseForProjectSettings(li.dataset.path));
  });
}

function initEventListeners() {
  if (el.projectContextPin) el.projectContextPin.addEventListener('click', async (e) => {
    e.stopPropagation();
    await setProjectPinned(contextMenuProjectId, true);
    closeProjectContextMenu();
  });
  if (el.projectContextUnpin) el.projectContextUnpin.addEventListener('click', async (e) => {
    e.stopPropagation();
    await setProjectPinned(contextMenuProjectId, false);
    closeProjectContextMenu();
  });
  if (el.projectContextOpenCursor) el.projectContextOpenCursor.addEventListener('click', async (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj && proj.path) {
      const admin = proj.openInCursorAdmin === true;
      if (admin) await openInCursorAdmin(proj.path);
      else await openInCursor(proj.path);
    }
    closeProjectContextMenu();
  });
  if (el.projectContextOpenExplorer) el.projectContextOpenExplorer.addEventListener('click', async (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj && proj.path) openInExplorer(proj.path);
    closeProjectContextMenu();
  });
  if (el.projectContextSettings) el.projectContextSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj) openProjectSettingsModal(proj);
    closeProjectContextMenu();
  });
  if (el.projectContextSftp) el.projectContextSftp.addEventListener('click', (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj) openSFTPModal(proj);
    closeProjectContextMenu();
  });
  if (el.projectContextAddSubproject) el.projectContextAddSubproject.addEventListener('click', (e) => {
    e.stopPropagation();
    if (contextMenuProjectId) openAddProject(contextMenuProjectId);
    closeProjectContextMenu();
  });
  if (el.projectContextRemove) el.projectContextRemove.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (contextMenuProjectId) await removeProject(contextMenuProjectId);
    closeProjectContextMenu();
  });
  document.addEventListener('click', () => closeProjectContextMenu());

  if (el.btnAddProject) el.btnAddProject.addEventListener('click', () => openAddProject());

  function attachToolbarListeners() {
    if (el.toolbarSearch) el.toolbarSearch.addEventListener('input', () => renderProjects());
    if (el.toolbarSearch) el.toolbarSearch.addEventListener('change', () => renderProjects());
    if (el.toolbarSort) el.toolbarSort.addEventListener('change', () => renderProjects());
    if (el.toolbarView) el.toolbarView.addEventListener('change', () => renderProjects());
    if (el.toolbarGroup) el.toolbarGroup.addEventListener('change', () => renderProjects());
  }
  attachToolbarListeners();

  setupCategoryInput(el.projectCategory, el.projectCategoryList);
  setupTagsInput(el.projectTagsChips, el.projectTagsInput, el.projectTagsSuggestions, projectTagsArray);
  setupCategoryInput(el.projectSettingsCategory, el.projectSettingsCategoryList);
  setupTagsInput(el.projectSettingsTagsChips, el.projectSettingsTagsInput, el.projectSettingsTagsSuggestions, projectSettingsTagsArray);

  if (el.btnCancelProject) el.btnCancelProject.addEventListener('click', () => el.modalProject && el.modalProject.close());

  if (el.btnProjectSettingsBrowse) el.btnProjectSettingsBrowse.addEventListener('click', async () => {
    if (el.projectSettingsBrowsePanel) el.projectSettingsBrowsePanel.hidden = false;
    await loadBrowseForProjectSettings('.');
  });

  if (el.projectSettingsBrowseUp) el.projectSettingsBrowseUp.addEventListener('click', async () => {
    if (!browseStateSettings.path) return;
    const parts = browseStateSettings.path.replace(/\\/g, '/').split('/').filter(Boolean);
    const up = parts.length ? parts.slice(0, -1).join('/') : '.';
    await loadBrowseForProjectSettings(up);
  });

  if (el.projectSettingsBrowseSelect) el.projectSettingsBrowseSelect.addEventListener('click', () => {
    if (el.projectSettingsPath) el.projectSettingsPath.value = browseStateSettings.path || browseStateSettings.absolute || '';
    if (el.projectSettingsBrowsePanel) el.projectSettingsBrowsePanel.hidden = true;
  });
}

function updateProjectSettingsImageFieldsVisibility() {
  const useUrl = el.projectSettingsImageSourceUrl && el.projectSettingsImageSourceUrl.checked;
  if (el.fieldProjectSettingsImageLocal) el.fieldProjectSettingsImageLocal.hidden = useUrl;
  if (el.fieldProjectSettingsImageUrl) el.fieldProjectSettingsImageUrl.hidden = !useUrl;
}

// Crop modal state: which project we're setting the image for
const CROP_VIEWPORT = 300;
let cropModalProjectId = null;

function openCropModal(dataUrl, projectId) {
  cropModalProjectId = projectId;
  el.cropZoom.min = '0.1';
  el.cropZoom.max = '4';
  el.cropZoom.value = '1';
  el.cropZoomValue.textContent = '100%';
  el.cropPanX.value = '0';
  el.cropPanY.value = '0';
  function setCropZoomRange() {
    const nw = el.cropImage.naturalWidth;
    const nh = el.cropImage.naturalHeight;
    if (!nw || !nh) return;
    // Min scale = zoom all the way out so image fits, but not past 1:1 (crop source must be at least VIEWPORT px)
    const fitScale = Math.min(CROP_VIEWPORT / nw, CROP_VIEWPORT / nh);
    const scaleMin = Math.min(1, fitScale);
    const scaleMinRounded = Math.max(0.01, Math.round(scaleMin * 100) / 100);
    el.cropZoom.min = String(scaleMinRounded);
    el.cropZoom.value = String(scaleMinRounded);
    el.cropZoomValue.textContent = Math.round(scaleMinRounded * 100) + '%';
    applyCropTransform();
  }
  el.cropImage.onload = setCropZoomRange;
  el.cropImage.src = dataUrl;
  if (el.cropImage.complete && el.cropImage.naturalWidth) setCropZoomRange();
  applyCropTransform();
  el.modalCropImage.showModal();
}

function applyCropTransform() {
  const scale = parseFloat(el.cropZoom.value) || 1;
  const panX = parseInt(el.cropPanX.value, 10) || 0;
  const panY = parseInt(el.cropPanY.value, 10) || 0;
  el.cropImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

  if (el.cropZoom) el.cropZoom.addEventListener('input', () => {
    if (el.cropZoomValue) el.cropZoomValue.textContent = Math.round(parseFloat(el.cropZoom.value) * 100) + '%';
    applyCropTransform();
  });
  if (el.cropPanX) el.cropPanX.addEventListener('input', applyCropTransform);
  if (el.cropPanY) el.cropPanY.addEventListener('input', applyCropTransform);
  if (el.btnCropCancel) el.btnCropCancel.addEventListener('click', () => el.modalCropImage && el.modalCropImage.close());
  if (el.btnCropApply) el.btnCropApply.addEventListener('click', async () => {
    if (!cropModalProjectId || !el.cropImage.complete || !el.cropImage.naturalWidth) return;
    const scale = parseFloat(el.cropZoom.value) || 1;
    const panX = parseInt(el.cropPanX.value, 10) || 0;
    const panY = parseInt(el.cropPanY.value, 10) || 0;
    const srcX = Math.max(0, -panX / scale);
    const srcY = Math.max(0, -panY / scale);
    const srcW = Math.min(el.cropImage.naturalWidth - srcX, CROP_VIEWPORT / scale);
    const srcH = Math.min(el.cropImage.naturalHeight - srcY, CROP_VIEWPORT / scale);
    if (srcW <= 0 || srcH <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = CROP_VIEWPORT;
    canvas.height = CROP_VIEWPORT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(el.cropImage, srcX, srcY, srcW, srcH, 0, 0, CROP_VIEWPORT, CROP_VIEWPORT);
    const imageData = canvas.toDataURL('image/png');
    try {
      await fetchJSON(`${API}/projects/${cropModalProjectId}/image`, {
        method: 'PUT',
        body: JSON.stringify({ imageData }),
      });
      if (el.modalCropImage) el.modalCropImage.close();
      await loadProjects();
      if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to save image');
    }
  });

  document.querySelectorAll('input[name="project-image-source"]').forEach(radio => {
    radio.addEventListener('change', updateProjectSettingsImageFieldsVisibility);
  });
  if (el.btnProjectSettingsImage) el.btnProjectSettingsImage.addEventListener('click', () => el.projectSettingsImageFile && el.projectSettingsImageFile.click());
  if (el.projectSettingsImageFile) el.projectSettingsImageFile.addEventListener('change', () => {
    const file = el.projectSettingsImageFile.files[0];
    el.projectSettingsImageFile.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const projectId = el.projectSettingsId ? el.projectSettingsId.value : '';
    if (!projectId) return;
    const reader = new FileReader();
    reader.onload = () => openCropModal(reader.result, projectId);
    reader.readAsDataURL(file);
  });
  if (el.btnProjectSettingsRemoveImage) el.btnProjectSettingsRemoveImage.addEventListener('click', async () => {
    const id = el.projectSettingsId ? el.projectSettingsId.value : '';
    if (!id) return;
    try {
      await fetchJSON(`${API}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ imagePath: null, imageUrl: null }),
      });
      if (el.projectSettingsImageUrl) el.projectSettingsImageUrl.value = '';
      await loadProjects();
      if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to remove image');
    }
  });

  if (el.projectSettingsOpenCursor) el.projectSettingsOpenCursor.addEventListener('change', () => {
    const enabled = el.projectSettingsOpenCursor.checked;
    el.projectSettingsOpenCursorAdmin.disabled = !enabled;
    if (!enabled) el.projectSettingsOpenCursorAdmin.checked = false;
  });
  if (el.btnProjectSettingsAddLink) el.btnProjectSettingsAddLink.addEventListener('click', () => openLinkModal());
  if (el.btnLinkCancel) el.btnLinkCancel.addEventListener('click', () => el.modalLink && el.modalLink.close());
  if (el.btnLinkSave) el.btnLinkSave.addEventListener('click', () => saveLinkFromModal());
  document.querySelectorAll('input[name="link-type"]').forEach(radio => {
    radio.addEventListener('change', updateLinkModalFieldsVisibility);
  });

  if (el.formProjectSettings) el.formProjectSettings.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = el.projectSettingsId ? el.projectSettingsId.value : '';
    const path = el.projectSettingsPath ? el.projectSettingsPath.value.trim() : '';
    const url = el.projectSettingsUrl ? el.projectSettingsUrl.value.trim() : '';
    const description = el.projectSettingsDescription ? el.projectSettingsDescription.value.trim() : '';
    const openInCursor = el.projectSettingsOpenCursor ? el.projectSettingsOpenCursor.checked : false;
    const openInCursorAdmin = el.projectSettingsOpenCursorAdmin ? el.projectSettingsOpenCursorAdmin.checked : false;
    const serverId = el.projectSettingsServer ? el.projectSettingsServer.value || null : null;
    const category = el.projectSettingsCategory ? el.projectSettingsCategory.value.trim() || null : null;
    const tags = getTagsFromChips(el.projectSettingsTagsChips);
    const payload = { description, openInCursor, openInCursorAdmin, serverId, category, tags, links: projectSettingsLinks };
    if (el.fieldProjectSettingsPath && !el.fieldProjectSettingsPath.hidden) {
      payload.path = path || undefined;
    }
    if (el.fieldProjectSettingsUrl && !el.fieldProjectSettingsUrl.hidden && url) {
      payload.url = url;
    }
    const useImageUrl = el.projectSettingsImageSourceUrl && el.projectSettingsImageSourceUrl.checked;
    if (useImageUrl && el.projectSettingsImageUrl) {
      const imageUrl = el.projectSettingsImageUrl.value.trim();
      payload.imageUrl = imageUrl || null;
      payload.imagePath = null;
    } else {
      payload.imageUrl = null;
    }
    try {
      await fetchJSON(`${API}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (el.modalProjectSettings) el.modalProjectSettings.close();
      await loadProjects();
      await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to save');
    }
  });

  if (el.btnCancelProjectSettings) el.btnCancelProjectSettings.addEventListener('click', () => el.modalProjectSettings && el.modalProjectSettings.close());

  // --- Menu File / View ---
  document.querySelectorAll('.menu-dropdown .menu-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = trigger.closest('.menu-dropdown');
      if (parent) {
        document.querySelectorAll('.menu-dropdown').forEach(d => {
          if (d !== parent) d.classList.remove('open');
        });
        parent.classList.toggle('open');
      }
    });
  });
  if (el.menuSettings) el.menuSettings.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    openSettingsModal();
  });
  if (el.menuViewLogs) el.menuViewLogs.addEventListener('click', async () => {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    try {
      await fetchJSON(`${API}/view-logs`, { method: 'POST' });
    } catch (e) {
      alert(e.message || 'Failed to open logs');
    }
  });
  if (el.menuRestartApp) el.menuRestartApp.addEventListener('click', async () => {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.restartApp) {
      await window.electronAPI.restartApp();
    } else {
      alert('Restart is only available in the desktop app.');
    }
  });
  document.addEventListener('click', () => document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open')));

// --- Color scheme ---
function getSavedScheme() {
  try {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    return saved && SCHEMES[saved] ? saved : 'cyan-glow';
  } catch {
    return 'cyan-glow';
  }
}

function applyScheme(schemeId) {
  const scheme = SCHEMES[schemeId] || SCHEMES['cyan-glow'];
  document.documentElement.dataset.scheme = schemeId;
  try {
    localStorage.setItem(COLOR_SCHEME_KEY, schemeId);
  } catch (e) {}
  if (typeof window.electronAPI !== 'undefined' && window.electronAPI.setTheme) {
    window.electronAPI.setTheme({ scheme: schemeId, backgroundColor: scheme.backgroundColor });
  }
}

// --- Test connection (no window.prompt in Electron) ---
async function runTestConnection(host, port, user, password, keyPath, btn) {
  const origTitle = btn ? btn.title : '';
  if (btn) {
    btn.title = 'Testing…';
    btn.disabled = true;
  }
  try {
    const result = await fetch(`${API}/credentials/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, user, password: password || undefined, keyPath: keyPath || undefined }),
    });
    const data = await result.json().catch(() => ({}));
    if (result.ok && data.ok) {
      alert('Connection successful.');
    } else {
      alert(data.error || 'Connection failed.');
    }
  } catch (err) {
    alert(err.message || 'Connection test failed.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.title = origTitle;
    }
  }
}

// --- Settings modal (File → Settings) ---
function openSettingsModal() {
  if (el.settingsColorScheme) el.settingsColorScheme.value = getSavedScheme();
  const navItems = document.querySelectorAll('[data-settings-view-nav]');
  const views = document.querySelectorAll('[data-settings-view]');
  navItems.forEach(btn => btn.classList.remove('is-active'));
  views.forEach(view => view.classList.remove('is-active'));
  const firstNav = document.querySelector('[data-settings-view-nav="appearance"]');
  const firstView = document.querySelector('[data-settings-view="appearance"]');
  if (firstNav) firstNav.classList.add('is-active');
  if (firstView) firstView.classList.add('is-active');
  renderSettingsServersList();
  clearSettingsServerForm();
  el.modalSettings.showModal();
}

function renderSettingsServersList() {
  el.settingsServersList.innerHTML = credentials.map(c =>
    `<li>
      <div class="settings-server-main">
        <div class="settings-server-name">${escapeHtml(c.name)}</div>
        <div class="settings-server-meta">${escapeHtml(c.user)}@${escapeHtml(c.host)}:${c.port}</div>
      </div>
      <div class="settings-server-actions">
        <button type="button" class="btn-icon btn-test-server" data-id="${c.id}" title="Test Connection" aria-label="Test Connection">⏱</button>
        <button type="button" class="btn-icon btn-edit-server" data-id="${c.id}" aria-label="Edit server">✎</button>
        <button type="button" class="btn-icon btn-icon-danger btn-delete-server" data-id="${c.id}" aria-label="Delete server">🗑</button>
      </div>
    </li>`
  ).join('');
  el.settingsServersList.querySelectorAll('.btn-test-server').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = credentials.find(x => x.id === btn.dataset.id);
      if (!c) return;
      const host = (c.host || '').trim();
      const port = c.port || 22;
      const user = (c.user || '').trim();
      const keyPath = (c.keyPath || '').trim();
      if (!host || !user) {
        alert('Host and username are required to test this server.');
        return;
      }
      if (keyPath) {
        runTestConnection(host, port, user, '', keyPath, btn);
      } else {
        pendingTestConnection = { host, port, user, keyPath: '', btn };
        if (el.testConnectionLabel) el.testConnectionLabel.textContent = `Enter password for ${user}@${host} (not saved; used only for this test).`;
        if (el.testConnectionPasswordInput) {
          el.testConnectionPasswordInput.value = '';
          el.testConnectionPasswordInput.focus();
        }
        if (el.modalTestConnectionPassword) el.modalTestConnectionPassword.showModal();
      }
    });
  });
  el.settingsServersList.querySelectorAll('.btn-edit-server').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = credentials.find(x => x.id === btn.dataset.id);
      if (c) {
        el.settingsCredId.value = c.id;
        el.settingsCredName.value = c.name;
        el.settingsCredHost.value = c.host;
        el.settingsCredPort.value = String(c.port);
        el.settingsCredUser.value = c.user;
        el.settingsCredPassword.value = '';
        el.settingsCredKey.value = c.keyPath || '';
        if (el.modalSettingsServerTitle) el.modalSettingsServerTitle.textContent = 'Edit SFTP server';
        if (el.btnSettingsSaveServer) el.btnSettingsSaveServer.textContent = 'Save server';
        if (el.modalSettingsServer) el.modalSettingsServer.showModal();
      }
    });
  });
  el.settingsServersList.querySelectorAll('.btn-delete-server').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this server?')) return;
      await fetchJSON(`${API}/credentials/${btn.dataset.id}`, { method: 'DELETE' });
      await loadCredentials();
      renderSettingsServersList();
    });
  });
}

function clearSettingsServerForm() {
  el.settingsCredId.value = '';
  el.settingsCredName.value = '';
  el.settingsCredHost.value = '';
  el.settingsCredPort.value = '22';
  el.settingsCredUser.value = '';
  el.settingsCredPassword.value = '';
  el.settingsCredKey.value = '';
  if (el.btnSettingsSaveServer) el.btnSettingsSaveServer.textContent = 'Save server';
  if (el.modalSettingsServerTitle) el.modalSettingsServerTitle.textContent = 'Add SFTP server';
}

  if (el.btnSettingsSaveServer) el.btnSettingsSaveServer.addEventListener('click', async () => {
    const id = el.settingsCredId ? el.settingsCredId.value : '';
    const name = el.settingsCredName ? el.settingsCredName.value.trim() : '';
    const host = el.settingsCredHost ? el.settingsCredHost.value.trim() : '';
    const port = parseInt(el.settingsCredPort ? el.settingsCredPort.value : '22', 10) || 22;
    const user = el.settingsCredUser ? el.settingsCredUser.value.trim() : '';
    const passwordVal = el.settingsCredPassword ? el.settingsCredPassword.value : '';
    const keyPath = el.settingsCredKey ? el.settingsCredKey.value.trim() || null : null;
    if (!name || !host || !user) {
      alert('Short name, host, and username are required.');
      return;
    }
    const body = { name, host, port, user, keyPath };
    if (id) {
      if (passwordVal !== '') body.password = passwordVal;
    } else {
      body.password = passwordVal || null;
    }
    try {
      if (id) {
        await fetchJSON(`${API}/credentials/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await fetchJSON(`${API}/credentials`, { method: 'POST', body: JSON.stringify(body) });
      }
      await loadCredentials();
      renderSettingsServersList();
      clearSettingsServerForm();
      if (el.modalSettingsServer) el.modalSettingsServer.close();
    } catch (err) {
      alert(err.message || 'Failed to save server');
    }
  });

  if (el.btnSettingsClearServer) el.btnSettingsClearServer.addEventListener('click', clearSettingsServerForm);
  if (el.settingsColorScheme) el.settingsColorScheme.addEventListener('change', () => {
    const schemeId = el.settingsColorScheme.value;
    if (SCHEMES[schemeId]) applyScheme(schemeId);
  });
  document.querySelectorAll('[data-settings-view-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-settings-view-nav');
      document.querySelectorAll('[data-settings-view-nav]').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('[data-settings-view]').forEach(view => view.classList.remove('is-active'));
      btn.classList.add('is-active');
      const view = document.querySelector(`[data-settings-view="${target}"]`);
      if (view) view.classList.add('is-active');
    });
  });
  if (el.btnSettingsAddServer) {
    el.btnSettingsAddServer.addEventListener('click', () => {
      clearSettingsServerForm();
      if (el.modalSettingsServer) el.modalSettingsServer.showModal();
    });
  }
  if (el.btnSettingsServerCancel) {
    el.btnSettingsServerCancel.addEventListener('click', () => {
      clearSettingsServerForm();
      if (el.modalSettingsServer) el.modalSettingsServer.close();
    });
  }
  if (el.btnTestConnectionCancel) {
    el.btnTestConnectionCancel.addEventListener('click', () => {
      pendingTestConnection = null;
      if (el.modalTestConnectionPassword) el.modalTestConnectionPassword.close();
    });
  }
  if (el.btnTestConnectionSubmit && el.testConnectionPasswordInput) {
    el.btnTestConnectionSubmit.addEventListener('click', async () => {
      if (!pendingTestConnection) return;
      const password = el.testConnectionPasswordInput.value || '';
      if (!password && !pendingTestConnection.keyPath) {
        alert('Password is required when no key path is configured.');
        return;
      }
      const { host, port, user, keyPath, btn } = pendingTestConnection;
      pendingTestConnection = null;
      if (el.modalTestConnectionPassword) el.modalTestConnectionPassword.close();
      await runTestConnection(host, port, user, password, keyPath, btn);
    });
  }
  if (el.btnSettingsTestConnection) {
    el.btnSettingsTestConnection.addEventListener('click', async () => {
      const host = (el.settingsCredHost && el.settingsCredHost.value) ? el.settingsCredHost.value.trim() : '';
      const port = parseInt((el.settingsCredPort && el.settingsCredPort.value) ? el.settingsCredPort.value : '22', 10) || 22;
      const user = (el.settingsCredUser && el.settingsCredUser.value) ? el.settingsCredUser.value.trim() : '';
      const password = (el.settingsCredPassword && el.settingsCredPassword.value) ? el.settingsCredPassword.value : '';
      const keyPath = (el.settingsCredKey && el.settingsCredKey.value) ? el.settingsCredKey.value.trim() : '';
      if (!host || !user) {
        alert('Host and username are required to test the connection.');
        return;
      }
      if (!password && !keyPath) {
        alert('Enter a password or private key path to test the connection.');
        return;
      }
      const origLabel = el.btnSettingsTestConnection.textContent;
      el.btnSettingsTestConnection.textContent = 'Testing…';
      el.btnSettingsTestConnection.disabled = true;
      try {
        const result = await fetch(`${API}/credentials/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, user, password: password || undefined, keyPath: keyPath || undefined }),
        });
        const data = await result.json().catch(() => ({}));
        if (result.ok && data.ok) {
          alert('Connection successful.');
        } else {
          alert(data.error || 'Connection failed.');
        }
      } catch (err) {
        alert(err.message || 'Connection test failed.');
      } finally {
        el.btnSettingsTestConnection.textContent = origLabel;
        el.btnSettingsTestConnection.disabled = false;
      }
    });
  }
  if (el.btnSaveSettings) el.btnSaveSettings.addEventListener('click', () => el.modalSettings && el.modalSettings.close());
  if (el.btnCancelSettings) el.btnCancelSettings.addEventListener('click', () => el.modalSettings && el.modalSettings.close());

function getAllCategories() {
  const set = new Set();
  projects.forEach(p => { if (p.category && p.category.trim()) set.add(p.category.trim()); });
  return [...set].sort();
}

function getAllTags() {
  const set = new Set();
  projects.forEach(p => { (p.tags || []).forEach(t => { if (t != null && String(t).trim()) set.add(String(t).trim()); }); });
  return [...set].sort();
}

function populateCategoryDatalist(datalistEl, inputValue) {
  if (!datalistEl) return;
  const all = getAllCategories();
  const val = (inputValue || '').toLowerCase();
  const filtered = val ? all.filter(c => c.toLowerCase().includes(val)) : all;
  datalistEl.innerHTML = filtered.map(c => `<option value="${escapeAttr(c)}">`).join('');
}

function renderTagsChips(container, tags, onRemove) {
  if (!container) return;
  container.innerHTML = tags.map((t, i) =>
    `<span class="tag-chip" data-index="${i}">${escapeHtml(String(t))}<button type="button" class="tag-chip-x" aria-label="Remove tag">×</button></span>`
  ).join('');
  container.querySelectorAll('.tag-chip-x').forEach(btn => {
    btn.addEventListener('click', () => { onRemove(parseInt(btn.closest('.tag-chip').dataset.index, 10)); });
  });
}

let projectTagsArray = [];
let projectSettingsTagsArray = [];
let projectSettingsLinks = [];

function getTagsFromChips(container) {
  if (!container) return [];
  return [...container.querySelectorAll('.tag-chip')].map(chip => chip.textContent.replace(/\s*×\s*$/, '').trim()).filter(Boolean);
}

function makeTagsRemoveFn(container, arr) {
  return function(i) {
    arr.splice(i, 1);
    renderTagsChips(container, arr, makeTagsRemoveFn(container, arr));
  };
}

function setupTagsInput(container, inputEl, suggestionsEl, arr) {
  if (!inputEl || !container) return;
  const updateChips = () => renderTagsChips(container, arr, makeTagsRemoveFn(container, arr));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputEl.value.trim();
      if (val && !arr.includes(val)) {
        arr.push(val);
        updateChips();
        inputEl.value = '';
        if (suggestionsEl) { suggestionsEl.hidden = true; suggestionsEl.innerHTML = ''; }
      }
    }
  });
  inputEl.addEventListener('input', () => {
    const val = inputEl.value.trim().toLowerCase();
    if (!suggestionsEl) return;
    if (!val) { suggestionsEl.hidden = true; suggestionsEl.innerHTML = ''; return; }
    const all = getAllTags().filter(t => !arr.includes(t));
    const filtered = all.filter(t => t.toLowerCase().includes(val));
    suggestionsEl.innerHTML = filtered.slice(0, 10).map(t =>
      `<div class="tags-suggestions-item" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</div>`
    ).join('');
    suggestionsEl.hidden = filtered.length === 0;
    suggestionsEl.querySelectorAll('.tags-suggestions-item').forEach(item => {
      item.addEventListener('click', () => {
        const tag = item.dataset.tag;
        if (tag && !arr.includes(tag)) {
          arr.push(tag);
          updateChips();
          inputEl.value = '';
          suggestionsEl.hidden = true;
          suggestionsEl.innerHTML = '';
        }
      });
    });
  });
  inputEl.addEventListener('blur', () => {
    setTimeout(() => { if (suggestionsEl) suggestionsEl.hidden = true; }, 150);
  });
}

function setupCategoryInput(inputEl, datalistEl) {
  if (!inputEl || !datalistEl) return;
  inputEl.addEventListener('focus', () => populateCategoryDatalist(datalistEl, inputEl.value));
  inputEl.addEventListener('input', () => populateCategoryDatalist(datalistEl, inputEl.value));
}

function renderSettingsLinksList() {
  if (!el.projectSettingsLinksList) return;
  el.projectSettingsLinksList.innerHTML = projectSettingsLinks.map((link, i) => {
    const type = link.type === 'file' ? 'file' : 'url';
    const typeLabel = type === 'file' ? 'file' : 'url';
    return `<li data-index="${i}" class="link-item">
      <span class="link-desc">${escapeHtml(link.description || 'Link')}</span>
      <span class="link-type-badge">${typeLabel}</span>
      <span class="link-url" title="${escapeAttr(link.url)}">${escapeHtml(link.url)}</span>
      <button type="button" class="btn btn-ghost btn-small btn-remove-link" data-index="${i}" aria-label="Remove link">×</button>
    </li>`;
  }).join('');
  el.projectSettingsLinksList.querySelectorAll('.link-item').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-link')) return;
      const i = parseInt(li.dataset.index, 10);
      openLinkModal(i);
    });
  });
  el.projectSettingsLinksList.querySelectorAll('.btn-remove-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.index, 10);
      projectSettingsLinks.splice(i, 1);
      renderSettingsLinksList();
    });
  });
}

function updateLinkModalFieldsVisibility() {
  const isFile = el.linkTypeFile && el.linkTypeFile.checked;
  if (el.fieldLinkUrl) el.fieldLinkUrl.hidden = isFile;
  if (el.fieldLinkPath) el.fieldLinkPath.hidden = !isFile;
}

function openLinkModal(editIndex = null) {
  const isEdit = editIndex != null && projectSettingsLinks[editIndex];
  if (isEdit) {
    const link = projectSettingsLinks[editIndex];
    el.linkDescription.value = link.description;
    const isFile = link.type === 'file';
    if (el.linkTypeUrl) el.linkTypeUrl.checked = !isFile;
    if (el.linkTypeFile) el.linkTypeFile.checked = isFile;
    el.linkUrl.value = isFile ? '' : link.url;
    if (el.linkPath) el.linkPath.value = isFile ? link.url : '';
    el.modalLink.dataset.editIndex = String(editIndex);
  } else {
    el.linkDescription.value = '';
    if (el.linkTypeUrl) el.linkTypeUrl.checked = true;
    if (el.linkTypeFile) el.linkTypeFile.checked = false;
    el.linkUrl.value = '';
    if (el.linkPath) el.linkPath.value = '';
    delete el.modalLink.dataset.editIndex;
  }
  updateLinkModalFieldsVisibility();
  document.getElementById('modal-link-title').textContent = isEdit ? 'Edit link' : 'Add link';
  el.modalLink.showModal();
}

function saveLinkFromModal() {
  const desc = el.linkDescription.value.trim();
  const isFile = el.linkTypeFile && el.linkTypeFile.checked;
  const value = isFile ? (el.linkPath && el.linkPath.value.trim()) : (el.linkUrl && el.linkUrl.value.trim());
  if (!value) return;
  const link = {
    type: isFile ? 'file' : 'url',
    description: desc,
    url: value,
  };
  const editIndex = el.modalLink.dataset.editIndex != null ? parseInt(el.modalLink.dataset.editIndex, 10) : null;
  if (editIndex != null && projectSettingsLinks[editIndex] != null) {
    projectSettingsLinks[editIndex] = link;
  } else {
    projectSettingsLinks.push(link);
  }
  renderSettingsLinksList();
  el.modalLink.close();
}

  document.querySelectorAll('input[name="project-type"]').forEach(radio => {
    radio.addEventListener('change', updateAddProjectFieldsVisibility);
  });

  if (el.formProject) el.formProject.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = el.projectId.value;
  const name = el.projectName.value.trim();
  const description = el.projectDescription.value.trim();
  const parentId = el.projectParentId.value || null;
  const category = el.projectCategory ? el.projectCategory.value.trim() || null : null;
  const tags = getTagsFromChips(el.projectTagsChips);
  try {
    if (id) {
      await fetchJSON(`${API}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description, category, tags }),
      });
    } else {
      const isUrl = el.projectTypeUrl && el.projectTypeUrl.checked;
      const path = el.projectPath ? el.projectPath.value.trim() : '';
      const url = el.projectUrl ? el.projectUrl.value.trim() : '';
      if (isUrl) {
        if (!url || !/^https?:\/\//i.test(url)) {
          alert('Please enter a valid URL (e.g. https://…).');
          return;
        }
        await fetchJSON(`${API}/projects`, {
          method: 'POST',
          body: JSON.stringify({ type: 'url', url, name, description, parentId, category, tags }),
        });
      } else {
        if (!path) {
          alert('Please select a folder first.');
          return;
        }
        await fetchJSON(`${API}/projects`, {
          method: 'POST',
          body: JSON.stringify({ type: 'folder', path, name, description, parentId, category, tags }),
        });
      }
    }
    el.modalProject.close();
    await loadProjects();
  } catch (err) {
    alert(err.message || 'Failed to save');
  }
});

// Browse folder
  if (el.btnBrowse) el.btnBrowse.addEventListener('click', async () => {
    if (el.browsePanel) el.browsePanel.hidden = false;
    await loadBrowse('.');
  });

  if (el.browseUp) el.browseUp.addEventListener('click', async () => {
  if (!browseState.path) return;
  const parts = browseState.path.replace(/\\/g, '/').split('/').filter(Boolean);
  const up = parts.length ? parts.slice(0, -1).join('/') : '.';
  await loadBrowse(up);
});

  if (el.browseSelect) el.browseSelect.addEventListener('click', () => {
    if (el.projectPath) el.projectPath.value = browseState.path || browseState.absolute || '';
    if (el.browsePanel) el.browsePanel.hidden = true;
  });

async function loadBrowse(dirPath) {
  const normalized = dirPath.replace(/\\/g, '/');
  const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(normalized)}`);
  browseState = data;
  el.browseCurrent.textContent = data.absolute || data.path || dirPath;
  const sep = '/';
  el.browseDirs.innerHTML = data.dirs.map(d => {
    const subPath = data.path ? data.path + sep + d.name : d.name;
    return `<li data-path="${escapeAttr(subPath)}">${escapeHtml(d.name)}</li>`;
  }).join('');
  el.browseDirs.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', async () => {
      await loadBrowse(li.dataset.path);
    });
  });
}

// Credentials
function openCredentialsModal() {
  renderCredentialsList();
  el.modalCredentials.showModal();
}

function renderCredentialsList() {
  el.credentialsList.innerHTML = credentials.map(c =>
    `<li>
       <span><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.user)}@${escapeHtml(c.host)}:${c.port}</span>
       <button type="button" class="btn btn-small btn-danger btn-delete-cred" data-id="${c.id}">Delete</button>
     </li>`
  ).join('');
  el.credentialsList.querySelectorAll('.btn-delete-cred').forEach(btn => {
    btn.addEventListener('click', async () => {
      await fetchJSON(`${API}/credentials/${btn.dataset.id}`, { method: 'DELETE' });
      await loadCredentials();
      renderCredentialsList();
    });
  });
}

  if (el.formCredential) el.formCredential.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('cred-name').value.trim();
  const host = document.getElementById('cred-host').value.trim();
  const port = parseInt(document.getElementById('cred-port').value, 10) || 22;
  const user = document.getElementById('cred-user').value.trim();
  const password = document.getElementById('cred-password').value || null;
  const keyPath = document.getElementById('cred-key').value.trim() || null;
  try {
    await fetchJSON(`${API}/credentials`, {
      method: 'POST',
      body: JSON.stringify({ name, host, port, user, password, keyPath }),
    });
    document.getElementById('cred-name').value = '';
    document.getElementById('cred-host').value = '';
    document.getElementById('cred-port').value = '22';
    document.getElementById('cred-user').value = '';
    document.getElementById('cred-password').value = '';
    document.getElementById('cred-key').value = '';
    await loadCredentials();
    renderCredentialsList();
  } catch (err) {
    alert(err.message || 'Failed to save credential');
  }
});

  if (el.btnCloseCredentials) el.btnCloseCredentials.addEventListener('click', () => el.modalCredentials && el.modalCredentials.close());

  if (el.sftpBtnCancel) el.sftpBtnCancel.addEventListener('click', () => el.modalSftp && el.modalSftp.close());
  if (el.sftpBtnSaveMappings) el.sftpBtnSaveMappings.addEventListener('click', async () => {
    if (!sftpState.project) return;
    syncCurrentGroupFromState();
    try {
      await fetchJSON(`${API}/projects/${sftpState.project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ mappingGroups: sftpState.mappingGroups }),
      });
      await loadProjects();
      if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
      if (el.modalSftp) el.modalSftp.close();
    } catch (err) {
      alert(err.message || 'Failed to save mappings');
    }
  });
  if (el.sftpGroupSelect) el.sftpGroupSelect.addEventListener('change', () => {
    syncCurrentGroupFromState();
    sftpState.selectedGroupId = el.sftpGroupSelect.value || null;
    setCurrentGroupMappings();
    sftpState.editingMappingIndex = null;
    sftpState.editingDownloadMappingIndex = null;
    renderSftpMappings();
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  });
  if (el.sftpGroupAdd) el.sftpGroupAdd.addEventListener('click', async () => {
    syncCurrentGroupFromState();
    const name = await showMappingGroupNameModal('Name for the new mapping group', 'New group');
    const groupName = (name != null && name.trim()) ? name.trim() : 'New group';
    const id = 'g-' + Date.now();
    sftpState.mappingGroups.push({ id, name: groupName, uploadMappings: [], downloadMappings: [] });
    sftpState.selectedGroupId = id;
    setCurrentGroupMappings();
    sftpState.editingMappingIndex = null;
    sftpState.editingDownloadMappingIndex = null;
    renderSftpGroupSelect();
    renderSftpMappings();
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  });
  if (el.sftpGroupEdit) el.sftpGroupEdit.addEventListener('click', async () => {
    const g = getCurrentGroup();
    if (!g) return;
    const name = await showMappingGroupNameModal('Rename mapping group', g.name);
    if (name != null && name.trim()) {
      g.name = name.trim();
      renderSftpGroupSelect();
    }
  });
  if (el.mappingGroupNameCancel) el.mappingGroupNameCancel.addEventListener('click', () => {
    if (sftpState.groupNameModalResolve) {
      sftpState.groupNameModalResolve(null);
      sftpState.groupNameModalResolve = null;
    }
    if (el.modalMappingGroupName) el.modalMappingGroupName.close();
  });
  if (el.mappingGroupNameOk) el.mappingGroupNameOk.addEventListener('click', () => {
    const value = el.mappingGroupNameInput ? el.mappingGroupNameInput.value.trim() : '';
    if (sftpState.groupNameModalResolve) {
      sftpState.groupNameModalResolve(value);
      sftpState.groupNameModalResolve = null;
    }
    if (el.modalMappingGroupName) el.modalMappingGroupName.close();
  });
  if (el.mappingGroupNameInput) el.mappingGroupNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (el.mappingGroupNameOk) el.mappingGroupNameOk.click();
    }
    if (e.key === 'Escape') {
      if (el.mappingGroupNameCancel) el.mappingGroupNameCancel.click();
    }
  });
  if (el.modalMappingGroupName) el.modalMappingGroupName.addEventListener('close', () => {
    if (sftpState.groupNameModalResolve) {
      sftpState.groupNameModalResolve(null);
      sftpState.groupNameModalResolve = null;
    }
  });
  if (el.sftpGroupDelete) el.sftpGroupDelete.addEventListener('click', () => {
    const groups = sftpState.mappingGroups || [];
    if (groups.length <= 1) {
      alert('Keep at least one group.');
      return;
    }
    syncCurrentGroupFromState();
    const idx = groups.findIndex(gg => gg.id === sftpState.selectedGroupId);
    groups.splice(idx, 1);
    sftpState.selectedGroupId = groups[0] ? groups[0].id : null;
    setCurrentGroupMappings();
    sftpState.editingMappingIndex = null;
    sftpState.editingDownloadMappingIndex = null;
    renderSftpGroupSelect();
    renderSftpMappings();
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  });
  if (el.sftpBtnRunDownload) el.sftpBtnRunDownload.addEventListener('click', () => runSftpDownload());
  if (el.sftpBtnSend) el.sftpBtnSend.addEventListener('click', () => addSftpMapping());
  if (el.sftpBtnAddDownloadMapping) el.sftpBtnAddDownloadMapping.addEventListener('click', () => addSftpDownloadMapping());
  if (el.sftpOverwrite) el.sftpOverwrite.addEventListener('change', () => {
    if (el.sftpAskOverwrite) { el.sftpAskOverwrite.disabled = !el.sftpOverwrite.checked; if (!el.sftpOverwrite.checked) el.sftpAskOverwrite.checked = false; }
  });
  if (el.sftpBtnRun) el.sftpBtnRun.addEventListener('click', () => runSftpUpload());
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.addEventListener('click', () => {
    if (sftpState.editingMappingIndex == null) return;
    const m = sftpState.mappings[sftpState.editingMappingIndex];
    if (!m) return;
    m.overwrite = !!(el.sftpOverwrite && el.sftpOverwrite.checked);
    m.askBeforeOverwrite = !!(el.sftpAskOverwrite && el.sftpAskOverwrite.checked);
    sftpState.editingMappingIndex = null;
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
    renderSftpMappings();
  });
  if (el.sftpProgressClose) el.sftpProgressClose.addEventListener('click', () => el.modalSftpProgress && el.modalSftpProgress.close());
  if (el.sftpOverwriteNo) el.sftpOverwriteNo.addEventListener('click', () => { if (sftpState.overwriteResolve) sftpState.overwriteResolve(false); });
  if (el.sftpOverwriteYes) el.sftpOverwriteYes.addEventListener('click', () => { if (sftpState.overwriteResolve) sftpState.overwriteResolve(true); });
  document.addEventListener('click', (e) => {
    if (el.sftpRemoteContextMenu && !el.sftpRemoteContextMenu.hidden && !el.sftpRemoteContextMenu.contains(e.target)) closeSftpRemoteContextMenu();
  });
  if (el.sftpRemoteContextDownload) el.sftpRemoteContextDownload.addEventListener('click', (e) => {
    e.stopPropagation();
    openSftpDownloadModal();
  });
  if (el.sftpRemoteContextAddDownloadMapping) el.sftpRemoteContextAddDownloadMapping.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSftpRemoteContextMenu();
    addSftpDownloadMapping();
  });
  if (el.sftpDownloadCancel) el.sftpDownloadCancel.addEventListener('click', () => el.modalSftpDownload && el.modalSftpDownload.close());
  if (el.sftpDownloadRun) el.sftpDownloadRun.addEventListener('click', async () => {
    const remotePath = sftpState.downloadRemotePath;
    const baseDir = (el.sftpDownloadLocalPath && el.sftpDownloadLocalPath.value.trim()) || (sftpState.project && sftpState.project.path) || '.';
    const remoteName = remotePath ? remotePath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'download' : 'download';
    const localPath = baseDir.replace(/\/$/, '') + '/' + remoteName;
    if (!sftpState.credId || !remotePath) return;
    if (el.modalSftpDownload) el.modalSftpDownload.close();
    if (el.modalSftpProgress) el.modalSftpProgress.showModal();
    if (el.sftpProgressLog) el.sftpProgressLog.innerHTML = '';
    if (el.sftpProgressClose) el.sftpProgressClose.disabled = true;
    sftpLog(`Downloading ${remotePath} → ${localPath}…`);
    try {
      await runSftpDownloadOne(remotePath, localPath);
      sftpLog(`Done: ${localPath}`);
    } catch (err) {
      sftpLog(`Error: ${err.message || 'Download failed'}`);
    }
    sftpLog('Download finished.');
    if (el.sftpProgressClose) el.sftpProgressClose.disabled = false;
  });
  if (el.sftpDownloadBrowse) el.sftpDownloadBrowse.addEventListener('click', async () => {
    const base = (el.sftpDownloadLocalPath && el.sftpDownloadLocalPath.value.trim()) || '.';
    const panel = el.sftpDownloadBrowsePanel;
    const dirsEl = el.sftpDownloadBrowseDirs;
    if (!panel || !dirsEl) return;
    panel.hidden = false;
    dirsEl.innerHTML = '<li class="browse-loading">Loading…</li>';
    try {
      const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(base)}`);
      dirsEl.innerHTML = (data.dirs || []).map(d => `<li data-path="${escapeAttr(d.path)}">${escapeHtml(d.name)}</li>`).join('') || '<li class="browse-empty">No subfolders</li>';
      dirsEl.querySelectorAll('li[data-path]').forEach(li => {
        li.addEventListener('click', () => {
          if (el.sftpDownloadLocalPath) el.sftpDownloadLocalPath.value = li.dataset.path;
          panel.hidden = true;
        });
      });
    } catch (err) {
      dirsEl.innerHTML = '<li class="browse-error">' + escapeHtml(err.message || 'Failed to load') + '</li>';
    }
  });

// Load git info for each project and re-render with git
async function enrichProjectsWithGit() {
  for (const p of projects) {
    if (p.type === 'url' || !p.path) {
      p.git = { isRepo: false };
      continue;
    }
    try {
      p.git = await fetchJSON(`${API}/git-info?path=${encodeURIComponent(p.path)}`);
    } catch {
      p.git = { isRepo: false };
    }
  }
  renderProjects();
}

async function init() {
  await loadRoot();
  await loadProjects();
  await loadCredentials();
  await enrichProjectsWithGit();
}

function initElectronTitleBar() {
  if (typeof window.electronAPI === 'undefined' || !el.titleBar) return;
  document.body.classList.add('electron-window');
  el.titleBar.hidden = false;
  if (el.titleBarMinimize) {
    el.titleBarMinimize.addEventListener('click', () => window.electronAPI.windowMinimize());
  }
  if (el.titleBarMaximize) {
    const updateMaximizeIcon = () => {
      window.electronAPI.windowIsMaximized().then((maximized) => {
        el.titleBarMaximize.textContent = maximized ? '❐' : '□';
        el.titleBarMaximize.title = maximized ? 'Restore' : 'Maximize';
      });
    };
    updateMaximizeIcon();
    el.titleBarMaximize.addEventListener('click', () => {
      window.electronAPI.windowMaximize().then(updateMaximizeIcon);
    });
  }
  if (el.titleBarClose) {
    el.titleBarClose.addEventListener('click', () => window.electronAPI.windowClose());
  }
  el.titleBar.addEventListener('dblclick', () => {
    window.electronAPI.windowMaximize().then((maximized) => {
      if (el.titleBarMaximize) {
        el.titleBarMaximize.textContent = maximized ? '❐' : '□';
        el.titleBarMaximize.title = maximized ? 'Restore' : 'Maximize';
      }
    });
  });
}

function startApp() {
  applyScheme(getSavedScheme());
  initElectronTitleBar();
  initEventListeners();
  init().catch(err => {
    console.error(err);
    if (el.projectsList) {
      el.projectsList.innerHTML = `<div class="empty-state"><p>Could not load: ${escapeHtml(err.message)}</p><p>Make sure the server is running (npm start in Angels-Project-Manager).</p></div>`;
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
