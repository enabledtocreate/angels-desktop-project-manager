const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { exec, execSync, spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const { Client } = require('ssh2');

const app = express();
const PORT = 3847;

// Root that this app manages (the Projects folder - parent of this app's folder)
const APP_DIR = __dirname;
const PROJECTS_ROOT = path.resolve(APP_DIR, '..');
const DATA_DIR = path.join(APP_DIR, 'data');
const PROJECT_IMAGES_DIR = path.join(DATA_DIR, 'project-images');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
const LOG_FILE = path.join(DATA_DIR, 'app.log');

function log(msg, err) {
  ensureDataDir();
  const ts = new Date().toISOString();
  let line = `${ts} ${msg}`;
  if (err) {
    if (err.code != null) line += ` [code=${err.code}]`;
    line += ` ${err.stack || err.message || String(err)}`;
  }
  line += '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf8');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(APP_DIR, 'public')));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function resolveSafe(userPath) {
  const resolved = path.resolve(PROJECTS_ROOT, userPath);
  const normalized = path.normalize(resolved);
  if (!normalized.startsWith(path.normalize(PROJECTS_ROOT))) return null;
  return normalized;
}

function readProjects() {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function yesterdayISO() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function ensureDateAdded(projects) {
  let changed = false;
  for (const p of projects) {
    if (!p.dateAdded) {
      p.dateAdded = yesterdayISO();
      changed = true;
    }
  }
  if (changed) writeProjects(projects);
}

function ensurePinned(projects) {
  for (const p of projects) {
    if (p.pinned === undefined) p.pinned = false;
  }
}

function ensureOpenInCursorAdmin(projects) {
  let changed = false;
  for (const p of projects) {
    if (p.openInCursor && p.openInCursorAdmin === undefined) {
      p.openInCursorAdmin = true;
      changed = true;
    }
  }
  if (changed) writeProjects(projects);
}

function ensureProjectType(projects) {
  let changed = false;
  for (const p of projects) {
    if (!p.type) {
      p.type = (p.url && /^https?:\/\//i.test(String(p.url))) ? 'url' : 'folder';
      if (p.type === 'url' && !p.url) p.url = null;
      if (p.type === 'folder' && !p.path) p.path = null;
      changed = true;
    }
  }
  if (changed) writeProjects(projects);
}

function ensureUploadMappings(projects) {
  let changed = false;
  for (const p of projects) {
    if (!Array.isArray(p.uploadMappings)) {
      p.uploadMappings = [];
      changed = true;
    }
  }
  if (changed) writeProjects(projects);
}

function ensureMappingGroups(projects) {
  let changed = false;
  for (const p of projects) {
    if (!Array.isArray(p.mappingGroups) || p.mappingGroups.length === 0) {
      p.mappingGroups = [{
        id: 'default',
        name: 'Default',
        uploadMappings: Array.isArray(p.uploadMappings) ? p.uploadMappings.slice() : [],
        downloadMappings: [],
      }];
      changed = true;
    }
  }
  if (changed) writeProjects(projects);
}

function getCredentialById(id) {
  const creds = readCredentials();
  return creds.find(c => c.id === id) || null;
}

function createSshConfig(cred) {
  const config = {
    host: (cred.host || '').trim(),
    port: parseInt(cred.port, 10) || 22,
    username: (cred.user || '').trim(),
    readyTimeout: 20000,
    connectTimeout: 20000,
  };
  if (cred.keyPath && cred.keyPath.trim()) {
    const keyFile = path.resolve(cred.keyPath.trim());
    if (fs.existsSync(keyFile)) {
      const keyContent = fs.readFileSync(keyFile, 'utf8');
      if (keyContent.includes('-----BEGIN')) config.privateKey = keyContent;
    }
  }
  if (!config.privateKey && cred.password) config.password = cred.password;
  return config;
}

function writeProjects(projects) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

function readCredentials() {
  ensureDataDir();
  if (!fs.existsSync(CREDENTIALS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeCredentials(creds) {
  ensureDataDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf8');
}

// --- Routes ---

app.get('/api/roots', (req, res) => {
  res.json({ projectsRoot: PROJECTS_ROOT });
});

app.get('/api/browse', (req, res) => {
  let reqPath = req.query.path;
  if (!reqPath || reqPath === '') reqPath = '.';
  const resolved = resolveSafe(reqPath);
  if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });
  try {
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const dirs = entries
      .filter(d => d.isDirectory())
      .map(d => ({
        name: d.name,
        path: path.relative(PROJECTS_ROOT, path.join(resolved, d.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      path: path.relative(PROJECTS_ROOT, resolved),
      absolute: resolved,
      dirs,
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message) });
  }
});

app.get('/api/projects', (req, res) => {
  const projects = readProjects();
  ensureDateAdded(projects);
  ensureProjectType(projects);
  ensurePinned(projects);
  ensureOpenInCursorAdmin(projects);
  ensureUploadMappings(projects);
  ensureMappingGroups(projects);
  for (const p of projects) {
    if (Array.isArray(p.mappingGroups) && p.mappingGroups[0]) {
      p.uploadMappings = p.mappingGroups[0].uploadMappings || [];
    }
  }
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { type: projectType, path: projectPath, url: projectUrl, name, description, parentId, category, tags, links } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const isUrl = projectType === 'url';
  const projects = readProjects();
  const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 9);
  if (isUrl) {
    if (!projectUrl || !projectUrl.trim()) return res.status(400).json({ error: 'URL is required for URL projects' });
    if (!/^https?:\/\//i.test(projectUrl.trim())) return res.status(400).json({ error: 'Invalid URL' });
    projects.push({
      id,
      type: 'url',
      path: null,
      absolutePath: null,
      url: projectUrl.trim(),
      name: name.trim(),
      description: description || '',
      parentId: parentId || null,
      serverId: null,
      openInCursor: false,
      openInCursorAdmin: false,
      pinned: false,
      imagePath: null,
      imageUrl: null,
      category: category && String(category).trim() ? String(category).trim() : null,
      tags: Array.isArray(tags) ? tags.filter(t => t != null && String(t).trim()) : [],
      links: normalizeLinks(links),
      dateAdded: new Date().toISOString(),
    });
  } else {
    if (!projectPath || !projectPath.trim()) {
      return res.status(400).json({ error: 'Folder path is required' });
    }
    const resolved = resolveSafe(projectPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return res.status(400).json({ error: 'Path is not an existing directory' });
    }
    projects.push({
      id,
      type: 'folder',
      path: projectPath,
      absolutePath: resolved,
      url: null,
      name: name.trim(),
      description: description || '',
      parentId: parentId || null,
      serverId: null,
      openInCursor: false,
    openInCursorAdmin: false,
    pinned: false,
    imagePath: null,
    imageUrl: null,
    category: category && String(category).trim() ? String(category).trim() : null,
    tags: Array.isArray(tags) ? tags.filter(t => t != null && String(t).trim()) : [],
    links: normalizeLinks(links),
    dateAdded: new Date().toISOString(),
    });
  }
  writeProjects(projects);
  res.json(projects.find(p => p.id === id));
});

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .filter(l => l && ((l.url != null && String(l.url).trim()) || (l.path != null && String(l.path).trim())))
    .map(l => {
      const type = (l.type === 'file') ? 'file' : 'url';
      const value = type === 'file'
        ? (l.path != null ? String(l.path).trim() : String(l.url || '').trim())
        : (l.url != null ? String(l.url).trim() : String(l.path || '').trim());
      if (!value) return null;
      return {
        type,
        description: l.description ? String(l.description).trim() : '',
        url: value,
      };
    })
    .filter(Boolean);
}

function normalizeMappingGroup(g) {
  if (!g || typeof g !== 'object') return null;
  const id = (g.id != null && String(g.id).trim()) ? String(g.id).trim() : 'default';
  const name = (g.name != null && String(g.name).trim()) ? String(g.name).trim() : 'Unnamed';
  const uploadMappings = Array.isArray(g.uploadMappings)
    ? g.uploadMappings.filter(m => m && (m.localPath != null || m.remotePath != null)).map(m => ({
        localPath: String(m.localPath ?? ''),
        remotePath: String(m.remotePath ?? ''),
        overwrite: !!m.overwrite,
        askBeforeOverwrite: !!m.askBeforeOverwrite,
      }))
    : [];
  const downloadMappings = Array.isArray(g.downloadMappings)
    ? g.downloadMappings.filter(m => m && (m.remotePath != null && m.localPath != null)).map(m => ({
        remotePath: String(m.remotePath ?? ''),
        localPath: String(m.localPath ?? ''),
      }))
    : [];
  return { id, name, uploadMappings, downloadMappings };
}

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, serverId, path: projectPath, url: projectUrl, openInCursor, openInCursorAdmin, pinned, imagePath, imageUrl, category, tags, links, uploadMappings, mappingGroups } = req.body || {};
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  if (name !== undefined) projects[idx].name = name.trim();
  if (description !== undefined) projects[idx].description = description;
  if (serverId !== undefined) projects[idx].serverId = serverId || null;
  if (openInCursor !== undefined) projects[idx].openInCursor = !!openInCursor;
  if (openInCursorAdmin !== undefined) projects[idx].openInCursorAdmin = !!openInCursorAdmin;
  if (pinned !== undefined) projects[idx].pinned = !!pinned;
  if (imagePath !== undefined) projects[idx].imagePath = imagePath || null;
  if (imageUrl !== undefined) {
    projects[idx].imageUrl = (imageUrl && String(imageUrl).trim()) || null;
    if (projects[idx].imageUrl) projects[idx].imagePath = null;
  }
  if (category !== undefined) projects[idx].category = category && String(category).trim() ? String(category).trim() : null;
  if (tags !== undefined) projects[idx].tags = Array.isArray(tags) ? tags.filter(t => t != null && String(t).trim()) : [];
  if (links !== undefined) projects[idx].links = normalizeLinks(links);
  if (mappingGroups !== undefined) {
    const groups = Array.isArray(mappingGroups)
      ? mappingGroups.map(normalizeMappingGroup).filter(Boolean)
      : [];
    projects[idx].mappingGroups = groups.length ? groups : [{ id: 'default', name: 'Default', uploadMappings: [], downloadMappings: [] }];
    projects[idx].uploadMappings = (projects[idx].mappingGroups[0] && projects[idx].mappingGroups[0].uploadMappings) || [];
  } else if (uploadMappings !== undefined) {
    projects[idx].uploadMappings = Array.isArray(uploadMappings)
      ? uploadMappings.filter(m => m && (m.localPath != null || m.remotePath != null)).map(m => ({
          localPath: String(m.localPath ?? ''),
          remotePath: String(m.remotePath ?? ''),
          overwrite: !!m.overwrite,
          askBeforeOverwrite: !!m.askBeforeOverwrite,
        }))
      : [];
    ensureMappingGroups(projects);
    const first = projects[idx].mappingGroups && projects[idx].mappingGroups[0];
    if (first) first.uploadMappings = projects[idx].uploadMappings.slice();
  }
  if (projectPath !== undefined && projectPath !== '') {
    const resolved = resolveSafe(projectPath);
    if (resolved && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      projects[idx].path = projectPath;
      projects[idx].absolutePath = resolved;
      projects[idx].type = 'folder';
      projects[idx].url = null;
    }
  }
  if (projectUrl !== undefined && projects[idx].type === 'url') {
    const u = String(projectUrl || '').trim();
    if (u && /^https?:\/\//i.test(u)) projects[idx].url = u;
  }
  writeProjects(projects);
  res.json(projects[idx]);
});

app.delete('/api/projects/:id', (req, res) => {
  const projects = readProjects().filter(p => p.id !== req.params.id);
  writeProjects(projects);
  res.json({ ok: true });
});

app.put('/api/projects/:id/image', (req, res) => {
  const { id } = req.params;
  const { imageData } = req.body || {};
  if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
    return res.status(400).json({ error: 'imageData (data URL) required' });
  }
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  ensureDataDir();
  if (!fs.existsSync(PROJECT_IMAGES_DIR)) fs.mkdirSync(PROJECT_IMAGES_DIR, { recursive: true });
  const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid image data' });
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const filename = `${id}.${ext}`;
  const filePath = path.join(PROJECT_IMAGES_DIR, filename);
  const buf = Buffer.from(match[2], 'base64');
  fs.writeFileSync(filePath, buf);
  projects[idx].imagePath = `project-images/${filename}`;
  projects[idx].imageUrl = null;
  writeProjects(projects);
  res.json(projects[idx]);
});

app.get('/api/project-image/:id', (req, res) => {
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project || !project.imagePath) return res.status(404).send('Not found');
  const filePath = path.join(DATA_DIR, project.imagePath);
  if (!path.resolve(filePath).startsWith(path.resolve(DATA_DIR)) || !fs.existsSync(filePath)) {
    return res.status(404).send('Not found');
  }
  const ext = path.extname(project.imagePath).toLowerCase();
  const ct = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
  res.setHeader('Content-Type', ct);
  res.sendFile(path.resolve(filePath));
});

function parseGitRemoteUrl(url) {
  if (!url || typeof url !== 'string') return {};
  const u = url.trim();
  let host = '';
  let account = '';
  let repo = '';
  const sshMatch = u.match(/^git@([^:]+):([^/]+)\/([^/]+?)(\.git)?$/);
  const httpsMatch = u.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(\.git)?$/);
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

app.get('/api/git-info', (req, res) => {
  const reqPath = req.query.path;
  if (!reqPath) return res.status(400).json({ error: 'path required' });
  const resolved = resolveSafe(reqPath);
  if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
  const gitDir = path.join(resolved, '.git');
  if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) {
    return res.json({ isRepo: false });
  }
  const out = { isRepo: true };
  try {
    out.branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: resolved, encoding: 'utf8' }).trim();
  } catch (_) {}
  try {
    out.remote = execSync('git remote get-url origin', { cwd: resolved, encoding: 'utf8' }).trim();
  } catch (_) {}
  if (out.remote) {
    const parsed = parseGitRemoteUrl(out.remote);
    out.remoteHost = parsed.host || null;
    out.remoteAccount = parsed.account || null;
    out.remoteRepo = parsed.repo || null;
  }
  try {
    const remoteOut = execSync('git remote -v', { cwd: resolved, encoding: 'utf8' }).trim();
    out.remotes = remoteOut.split('\n').filter(Boolean).map(line => {
      const parts = line.split(/\s+/);
      return { name: parts[0], url: parts[1], type: parts[2] === '(fetch)' ? 'fetch' : 'push' };
    });
  } catch (_) {}
  try {
    out.userName = execSync('git config user.name', { cwd: resolved, encoding: 'utf8' }).trim();
  } catch (_) {}
  try {
    out.userEmail = execSync('git config user.email', { cwd: resolved, encoding: 'utf8' }).trim();
  } catch (_) {}
  try {
    out.upstream = execSync('git rev-parse --abbrev-ref HEAD@{upstream}', { cwd: resolved, encoding: 'utf8' }).trim();
  } catch (_) {}
  try {
    out.status = execSync('git status --short', { cwd: resolved, encoding: 'utf8' }).trim() || null;
  } catch (_) {}
  try {
    out.lastCommit = execSync('git', ['log', '-1', '--format=%h %s'], { cwd: resolved, encoding: 'utf8' }).trim() || null;
  } catch (_) {}
  try {
    out.lastCommitHash = execSync('git', ['log', '-1', '--format=%H'], { cwd: resolved, encoding: 'utf8' }).trim();
    out.lastCommitSubject = execSync('git', ['log', '-1', '--format=%s'], { cwd: resolved, encoding: 'utf8' }).trim();
    out.lastCommitDate = execSync('git', ['log', '-1', '--format=%ci'], { cwd: resolved, encoding: 'utf8' }).trim();
    out.lastCommitAuthor = execSync('git', ['log', '-1', '--format=%an <%ae>'], { cwd: resolved, encoding: 'utf8' }).trim();
  } catch (_) {}
  res.json(out);
});

app.post('/api/open-explorer', (req, res) => {
  const { path: targetPath } = req.body || {};
  if (!targetPath) return res.status(400).json({ error: 'path required' });
  const resolved = resolveSafe(targetPath);
  if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
  log('open-explorer: opening ' + resolved);
  try {
    const child = process.platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '', resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      : spawn('xdg-open', [resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => log('open-explorer stdout:', d.toString().trim()));
    child.stderr.on('data', (d) => log('open-explorer stderr:', d.toString().trim()));
    child.on('close', (code, signal) => log('open-explorer closed code=' + code + ' signal=' + signal));
    child.on('error', (e) => log('open-explorer spawn error:', e));
  } catch (e) {
    log('open-explorer exception:', e);
  }
  res.json({ ok: true });
});

app.post('/api/open-url', (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url required' });
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return res.status(400).json({ error: 'Invalid URL' });
  try {
    const child = process.platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '', trimmed], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      : spawn('xdg-open', [trimmed], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (e) => log('open-url spawn error:', e));
  } catch (e) {
    log('open-url exception:', e);
  }
  res.json({ ok: true });
});

function getCursorPath() {
  if (process.platform !== 'win32') return 'cursor';
  const pf = process.env.PROGRAMFILES || 'C:\\Program Files';
  const cursorExe = path.join(pf, 'cursor', 'Cursor.exe');
  if (fs.existsSync(cursorExe)) return cursorExe;
  return 'cursor';
}

app.post('/api/open-cursor', (req, res) => {
  const { path: targetPath } = req.body || {};
  if (!targetPath) return res.status(400).json({ error: 'path required' });
  const resolved = resolveSafe(targetPath);
  if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
  const cursorExe = getCursorPath();
  log('open-cursor: path=' + resolved);
  try {
    const child = process.platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '', cursorExe, resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      : spawn('xdg-open', [resolved], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', (e) => log('open-cursor spawn error:', e));
  } catch (e) {
    log('open-cursor exception:', e);
  }
  res.json({ ok: true });
});

app.post('/api/open-cursor-admin', (req, res) => {
  const { path: targetPath } = req.body || {};
  if (!targetPath) return res.status(400).json({ error: 'path required' });
  const resolved = resolveSafe(targetPath);
  if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
  const cursorExe = getCursorPath();
  const argForPs = resolved.replace(/'/g, "''");
  // Output to stdout/stderr so Node captures and logs it; use full path to Cursor.exe
  const exeForPs = cursorExe.replace(/'/g, "''");
  const psScript = `try {
  Start-Process -FilePath '${exeForPs}' -ArgumentList '${argForPs}' -Verb RunAs
  Write-Output '[PowerShell] Start-Process completed.'
} catch {
  Write-Error ('[PowerShell] Error: ' + \$_.Exception.Message)
}`;
  log('open-cursor-admin: path=' + resolved + ' exe=' + cursorExe);
  try {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('close', (code, signal) => {
      log('open-cursor-admin process closed code=' + code + ' signal=' + signal + (out ? ' stdout=' + out.trim() : '') + (err ? ' stderr=' + err.trim() : ''));
    });
    child.on('error', (e) => log('open-cursor-admin spawn error:', e));
  } catch (e) {
    log('open-cursor-admin exception:', e);
  }
  res.json({ ok: true });
});

app.post('/api/log-client-error', (req, res) => {
  const { message, stack, source, lineno, colno, type } = req.body || {};
  ensureDataDir();
  const ts = new Date().toISOString();
  const line = `[Renderer] ${ts} ${type || 'error'} ${message || 'unknown'}` +
    (source ? ` at ${source}` : '') +
    (lineno != null ? `:${lineno}` : '') +
    (colno != null ? `:${colno}` : '') +
    (stack ? `\n  ${String(stack).replace(/\n/g, '\n  ')}` : '') +
    '\n';
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('Failed to write client error log:', e);
  }
  res.json({ ok: true });
});

app.post('/api/view-logs', (req, res) => {
  ensureDataDir();
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '', 'utf8');
  log('Log view requested — app log opened in Notepad');
  spawn('notepad', [LOG_FILE], { detached: true, stdio: 'ignore' });
  res.json({ ok: true });
});

// --- Credentials (SFTP) ---
app.get('/api/credentials', (req, res) => {
  const creds = readCredentials();
  // Don't send password to frontend for display; send masked
  res.json(creds.map(c => ({
    id: c.id,
    name: c.name,
    host: c.host,
    port: c.port,
    user: c.user,
    passwordMasked: c.password ? '••••••••' : null,
    keyPath: c.keyPath || null,
  })));
});

app.post('/api/credentials', (req, res) => {
  const { name, host, port, user, password, keyPath } = req.body || {};
  if (!name || !host || !user) {
    return res.status(400).json({ error: 'name, host, and user are required' });
  }
  const creds = readCredentials();
  const id = 'cred-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
  creds.push({
    id,
    name: name.trim(),
    host: host.trim(),
    port: port || 22,
    user: user.trim(),
    password: password || null,
    keyPath: keyPath || null,
  });
  writeCredentials(creds);
  res.json(creds.find(c => c.id === id));
});

app.put('/api/credentials/:id', (req, res) => {
  const { id } = req.params;
  const { name, host, port, user, password, keyPath } = req.body || {};
  const creds = readCredentials();
  const idx = creds.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Credential not found' });
  if (name !== undefined) creds[idx].name = name.trim();
  if (host !== undefined) creds[idx].host = host.trim();
  if (port !== undefined) creds[idx].port = port || 22;
  if (user !== undefined) creds[idx].user = user.trim();
  if (password !== undefined) creds[idx].password = password || null;
  if (keyPath !== undefined) creds[idx].keyPath = keyPath || null;
  writeCredentials(creds);
  res.json(creds[idx]);
});

app.delete('/api/credentials/:id', (req, res) => {
  const creds = readCredentials().filter(c => c.id !== req.params.id);
  writeCredentials(creds);
  res.json({ ok: true });
});

// --- SFTP list and upload (use stored credential; no .ppk for key auth) ---
app.get('/api/sftp/list', (req, res) => {
  const credId = req.query.credId;
  let remotePath = (req.query.path != null && String(req.query.path)) ? String(req.query.path).replace(/\\/g, '/') : '/';
  if (!remotePath.startsWith('/')) remotePath = '/' + remotePath;
  if (!credId) return res.status(400).json({ error: 'credId is required' });
  const cred = getCredentialById(credId);
  if (!cred) return res.status(404).json({ error: 'Credential not found' });
  if (!cred.host || !cred.user) return res.status(400).json({ error: 'Invalid credential' });
  const config = createSshConfig(cred);
  if (!config.privateKey && !config.password) return res.status(400).json({ error: 'Credential has no password or key' });
  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        return res.status(500).json({ error: err.message });
      }
      sftp.readdir(remotePath, (readErr, list) => {
        conn.end();
        if (readErr) {
          return res.status(400).json({ error: readErr.message || 'List failed' });
        }
        const entries = (list || []).map(e => ({
          name: e.filename,
          type: (e.attrs && e.attrs.isDirectory && e.attrs.isDirectory()) ? 'dir' : 'file',
          path: remotePath === '/' ? '/' + e.filename : remotePath.replace(/\/$/, '') + '/' + e.filename,
        })).filter(e => e.name !== '.' && e.name !== '..');
        res.json({ path: remotePath, entries });
      });
    });
  }).on('error', (err) => {
    log('SFTP list failed', err);
    res.status(500).json({ error: err.message || 'Connection failed' });
  }).connect(config);
});

app.get('/api/sftp/local-list', (req, res) => {
  let reqPath = req.query.path;
  if (reqPath == null || reqPath === '') reqPath = '.';
  const resolved = resolveSafe(reqPath);
  if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });
  try {
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const dirs = [];
    const files = [];
    for (const e of entries) {
      const rel = path.relative(PROJECTS_ROOT, path.join(resolved, e.name));
      const item = { name: e.name, path: rel.replace(/\\/g, '/') };
      if (e.isDirectory()) dirs.push(item);
      else files.push(item);
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      path: path.relative(PROJECTS_ROOT, resolved).replace(/\\/g, '/'),
      dirs,
      files,
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message) });
  }
});

const SFTP_MANIFEST = '.sftp-manifest';

function computeDirHashSync(dirAbs) {
  const entries = [];
  function walk(base) {
    const names = fs.readdirSync(path.join(dirAbs, base));
    for (const name of names) {
      const rel = base ? base + '/' + name : name;
      const full = path.join(dirAbs, rel);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(rel);
      else {
        const buf = fs.readFileSync(full);
        const hash = crypto.createHash('md5').update(buf).digest('hex');
        entries.push({ rel, hash });
      }
    }
  }
  walk('');
  entries.sort((a, b) => a.rel.localeCompare(b.rel));
  const combined = entries.map(e => e.rel + ':' + e.hash).join('\n');
  return crypto.createHash('md5').update(combined, 'utf8').digest('hex');
}

function uploadLocalToRemote(sftp, localAbs, remotePath, overwrite, cb) {
  let called = false;
  const once = (err) => {
    if (called) return;
    called = true;
    cb(err);
  };
  const stat = fs.statSync(localAbs);
  if (stat.isFile()) {
    sftp.stat(remotePath, (errExist) => {
      if (!errExist && !overwrite) return once({ needOverwriteConfirm: true, path: remotePath });
      const rs = fs.createReadStream(localAbs);
      const ws = sftp.createWriteStream(remotePath, { flags: 'w' });
      rs.on('error', (e) => once(e));
      ws.on('error', (e) => once(e));
      ws.on('close', () => once(null));
      rs.pipe(ws);
    });
    return;
  }
  if (stat.isDirectory()) {
    sftp.mkdir(remotePath, { mode: 0o755 }, (errMk) => {
      if (!errMk) {
        return uploadDirContents();
      }
      sftp.stat(remotePath, (errStat, stat) => {
        if (!errStat && stat && stat.isDirectory && stat.isDirectory()) {
          return uploadDirContents();
        }
        const isFile = !errStat && stat && (!stat.isDirectory || (typeof stat.isDirectory === 'function' && !stat.isDirectory()));
        const hint = ' Try enabling "Delete before copy" for this mapping to remove the remote path first.';
        const err = isFile
          ? Object.assign(new Error('Remote path exists as a file; use "Delete before copy" or remove it on the server.'), { code: errMk.code })
          : Object.assign(new Error((errMk.message || 'Cannot create directory on server.') + hint), { code: errMk.code });
        return once(err);
      });

      function uploadDirContents() {
        const entries = fs.readdirSync(localAbs, { withFileTypes: true });
        let pending = entries.length;
        if (pending === 0) return once(null);
        let done = false;
        const next = (err) => {
          if (done) return;
          if (err) {
            done = true;
            return once(err);
          }
          pending--;
          if (pending === 0) once(null);
        };
        for (const e of entries) {
          const localChild = path.join(localAbs, e.name);
          const remoteChild = (remotePath === '/' ? '' : remotePath) + '/' + e.name;
          uploadLocalToRemote(sftp, localChild, remoteChild, overwrite, next);
        }
      }
    });
    return;
  }
  once(null);
}

app.post('/api/sftp/upload', (req, res) => {
  const { credId, localPath, remotePath, overwrite, askBeforeOverwrite } = req.body || {};
  if (!credId || localPath == null || remotePath == null) {
    return res.status(400).json({ error: 'credId, localPath, and remotePath are required' });
  }
  const o = overwrite ? 'O' : 'o';
  const a = askBeforeOverwrite ? 'A' : 'a';
  const settingsTag = `sftp-upload (${o} ${a})`;
  const resolved = resolveSafe(String(localPath));
  if (!resolved) return res.status(403).json({ error: 'Local path not allowed' });
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Local path not found' });
  let remote = String(remotePath).replace(/\\/g, '/');
  if (!remote.startsWith('/')) remote = '/' + remote;
  const localStat = fs.statSync(resolved);
  const isDir = localStat.isDirectory();
  let localDirHash = null;
  if (isDir) {
    try {
      localDirHash = computeDirHashSync(resolved);
    } catch (hashErr) {
      log(`${settingsTag} ${String(localPath)} → ${remote} (hash failed)`, hashErr);
    }
  }
  log(`${settingsTag} ${String(localPath)} → ${remote} (starting)`);
  const cred = getCredentialById(credId);
  if (!cred) return res.status(404).json({ error: 'Credential not found' });
  const config = createSshConfig(cred);
  if (!config.privateKey && !config.password) return res.status(400).json({ error: 'Credential has no password or key' });
  let responseSent = false;
  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        if (!responseSent) {
          responseSent = true;
          log(`${settingsTag} ${String(localPath)} → ${remote} (sftp session failed)`, err);
          res.status(500).json({ error: err.message, code: err.code, verbose: err.stack || err.message });
        }
        return;
      }
      const send = (status, body) => {
        if (responseSent) return;
        responseSent = true;
        conn.end();
        if (status === 200) res.json(body);
        else res.status(status).json(body);
      };
      const doUpload = () => {
        uploadLocalToRemote(sftp, resolved, remote, !!overwrite, (uploadErr) => {
          if (uploadErr && uploadErr.needOverwriteConfirm) {
            return send(409, { needOverwriteConfirm: true, path: uploadErr.path });
          }
          if (uploadErr) {
            const msg = uploadErr.message || uploadErr.msg || 'Upload failed';
            const verboseMsg = [msg, uploadErr.code != null && `code=${uploadErr.code}`, uploadErr.stack].filter(Boolean).join(' | ') || msg;
            log(`${settingsTag} ${String(localPath)} → ${remote} (upload error)`, uploadErr);
            return send(500, {
              error: msg,
              code: uploadErr.code,
              verbose: verboseMsg,
            });
          }
          if (isDir && localDirHash) {
            const manifestPath = (remote === '/' ? '' : remote) + '/' + SFTP_MANIFEST;
            sftp.writeFile(manifestPath, localDirHash, (writeErr) => {
              if (writeErr) log(`${settingsTag} ${String(localPath)} → ${remote} (manifest write failed)`, writeErr);
              log(`${settingsTag} ${String(localPath)} → ${remote} (done)`);
              send(200, { ok: true });
            });
          } else {
            log(`${settingsTag} ${String(localPath)} → ${remote} (done)`);
            send(200, { ok: true });
          }
        });
      };
      if (isDir && localDirHash != null) {
        const manifestPath = (remote === '/' ? '' : remote) + '/' + SFTP_MANIFEST;
        sftp.readFile(manifestPath, (readErr, data) => {
          if (!readErr && data) {
            const remoteHash = data.toString().trim();
            if (remoteHash === localDirHash) {
              log(`${settingsTag} ${String(localPath)} → ${remote} (no changes made, skipping copy)`);
              return send(200, { ok: true, skipped: true });
            }
          }
          sftp.stat(remote, (statErr, stat) => {
            if (statErr) return doUpload();
            const rm = (rpath, done) => {
              sftp.readdir(rpath, (reErr, list) => {
                if (reErr) {
                  sftp.unlink(rpath, () => done());
                  return;
                }
                const entries = (list || []).filter(e => e.filename !== '.' && e.filename !== '..');
                let n = entries.length;
                if (n === 0) return sftp.rmdir(rpath, done);
                const next = () => {
                  n--;
                  if (n === 0) sftp.rmdir(rpath, done);
                };
                for (const e of entries) {
                  const child = (rpath === '/' ? '' : rpath) + '/' + e.filename;
                  if (e.attrs && e.attrs.isDirectory && e.attrs.isDirectory()) rm(child, next);
                  else sftp.unlink(child, next);
                }
              });
            };
            if (stat.isDirectory && stat.isDirectory()) rm(remote, doUpload);
            else sftp.unlink(remote, doUpload);
          });
        });
      } else {
        sftp.stat(remote, (statErr, stat) => {
          if (statErr) return doUpload();
          const rm = (rpath, done) => {
            sftp.readdir(rpath, (reErr, list) => {
              if (reErr) {
                sftp.unlink(rpath, () => done());
                return;
              }
              const entries = (list || []).filter(e => e.filename !== '.' && e.filename !== '..');
              let n = entries.length;
              if (n === 0) return sftp.rmdir(rpath, done);
              const next = () => {
                n--;
                if (n === 0) sftp.rmdir(rpath, done);
              };
              for (const e of entries) {
                const child = (rpath === '/' ? '' : rpath) + '/' + e.filename;
                if (e.attrs && e.attrs.isDirectory && e.attrs.isDirectory()) rm(child, next);
                else sftp.unlink(child, next);
              }
            });
          };
          if (stat.isDirectory && stat.isDirectory()) rm(remote, doUpload);
          else sftp.unlink(remote, doUpload);
        });
      }
    });
  }).on('error', (err) => {
    if (!responseSent) {
      responseSent = true;
      log(`${settingsTag} ${String(localPath)} → ${remote} (connection failed)`, err);
      res.status(500).json({ error: err.message || 'Connection failed', code: err.code, verbose: err.stack || err.message });
    }
  }).connect(config);
});

function downloadRemoteToLocal(sftp, remotePath, localAbs, once) {
  let remote = String(remotePath).replace(/\\/g, '/');
  if (!remote.startsWith('/')) remote = '/' + remote;
  sftp.stat(remote, (err, stat) => {
    if (err) return once(err);
    if (stat.isDirectory && stat.isDirectory()) {
      try {
        if (!fs.existsSync(localAbs)) fs.mkdirSync(localAbs, { recursive: true });
      } catch (e) {
        return once(e);
      }
      sftp.readdir(remote, (readErr, list) => {
        if (readErr) return once(readErr);
        const entries = (list || []).filter(e => e.filename !== '.' && e.filename !== '..');
        if (entries.length === 0) return once(null);
        let pending = entries.length;
        let done = false;
        const next = (e) => {
          if (done) return;
          if (e) {
            done = true;
            return once(e);
          }
          pending--;
          if (pending === 0) once(null);
        };
        for (const e of entries) {
          const childRemote = (remote === '/' ? '' : remote) + '/' + e.filename;
          const childLocal = path.join(localAbs, e.filename);
          if (e.attrs && e.attrs.isDirectory && e.attrs.isDirectory()) {
            downloadRemoteToLocal(sftp, childRemote, childLocal, next);
          } else {
            sftp.readFile(childRemote, (readErr, data) => {
              if (readErr) return next(readErr);
              try {
                fs.writeFileSync(childLocal, data);
                next(null);
              } catch (writeErr) {
                next(writeErr);
              }
            });
          }
        }
      });
      return;
    }
    sftp.readFile(remote, (readErr, data) => {
      if (readErr) return once(readErr);
      try {
        const dir = path.dirname(localAbs);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localAbs, data);
        once(null);
      } catch (e) {
        once(e);
      }
    });
  });
}

app.post('/api/sftp/download', (req, res) => {
  const { credId, remotePath, localPath } = req.body || {};
  if (!credId || remotePath == null || localPath == null) {
    return res.status(400).json({ error: 'credId, remotePath, and localPath are required' });
  }
  const resolved = resolveSafe(String(localPath));
  if (!resolved) return res.status(403).json({ error: 'Local path not allowed' });
  let remote = String(remotePath).replace(/\\/g, '/');
  if (!remote.startsWith('/')) remote = '/' + remote;
  const cred = getCredentialById(credId);
  if (!cred) return res.status(404).json({ error: 'Credential not found' });
  const config = createSshConfig(cred);
  if (!config.privateKey && !config.password) return res.status(400).json({ error: 'Credential has no password or key' });
  log(`sftp-download ${remote} → ${String(localPath)} (starting)`);
  let responseSent = false;
  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        if (!responseSent) {
          responseSent = true;
          log(`sftp-download ${remote} → ${String(localPath)} (sftp session failed)`, err);
          res.status(500).json({ error: err.message, code: err.code, verbose: err.stack || err.message });
        }
        return;
      }
      downloadRemoteToLocal(sftp, remote, resolved, (downloadErr) => {
        conn.end();
        if (responseSent) return;
        responseSent = true;
        if (downloadErr) {
          log(`sftp-download ${remote} → ${String(localPath)} (error)`, downloadErr);
          return res.status(500).json({
            error: downloadErr.message || 'Download failed',
            code: downloadErr.code,
            verbose: downloadErr.stack || downloadErr.message,
          });
        }
        log(`sftp-download ${remote} → ${String(localPath)} (done)`);
        res.json({ ok: true });
      });
    });
  }).on('error', (err) => {
    if (!responseSent) {
      responseSent = true;
      log(`sftp-download ${remote} → ${String(localPath)} (connection failed)`, err);
      res.status(500).json({ error: err.message || 'Connection failed', code: err.code });
    }
  }).connect(config);
});

// Test SFTP/SSH connection (password or PEM key; .ppk not supported for test)
app.post('/api/credentials/test', (req, res) => {
  const { host, port, user, password, keyPath } = req.body || {};
  if (!host || !host.trim() || !user || !user.trim()) {
    return res.status(400).json({ error: 'Host and username are required.' });
  }
  const portNum = parseInt(port, 10) || 22;
  let privateKey = null;
  if (keyPath && keyPath.trim()) {
    const keyFile = path.resolve(keyPath.trim());
    if (!fs.existsSync(keyFile)) {
      return res.status(400).json({ error: 'Private key file not found.' });
    }
    const keyContent = fs.readFileSync(keyFile, 'utf8');
    if (keyContent.includes('-----BEGIN')) {
      privateKey = keyContent;
    } else {
      return res.status(400).json({ error: 'Connection test requires an OpenSSH PEM key. .ppk keys are not supported for testing; use password or convert the key to PEM.' });
    }
  }
  if (!password && !privateKey) {
    return res.status(400).json({ error: 'Enter a password or a path to an OpenSSH PEM private key to test.' });
  }
  const config = {
    host: host.trim(),
    port: portNum,
    username: user.trim(),
    readyTimeout: 15000,
    connectTimeout: 15000,
  };
  if (privateKey) config.privateKey = privateKey;
  else config.password = password;
  const conn = new Client();
  conn.on('ready', () => {
    conn.end();
    res.json({ ok: true, message: 'Connection successful.' });
  }).on('error', (err) => {
    const msg = err.message || String(err);
    log('Credentials test failed', err);
    res.status(400).json({ error: msg });
  }).connect(config);
});

// --- Serve SPA ---
app.get('*', (req, res) => {
  res.sendFile(path.join(APP_DIR, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Angel's Project Manager running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other app or run the launcher again to free it.`);
    process.exit(1);
  }
  throw err;
});
