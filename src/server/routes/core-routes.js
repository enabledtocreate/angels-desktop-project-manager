module.exports = function registerCoreRoutes(app, ctx) {
  const {
    fs,
    path,
    config,
    listProjectTypes,
    buildSettingsResponse,
    fileWatcherService,
    updateProjectRoot,
    updateDataDir,
    updateLogsDir,
    saveAppSettings,
  } = ctx;

  function resolveWatchPath(inputPath) {
    const incoming = String(inputPath || '').trim();
    if (!incoming) throw new Error('Watch path is required');

    const allowedRoots = [
      path.resolve(config.getProjectsRoot()),
      path.resolve(config.getDataDir()),
      path.resolve(config.getLogsDir()),
      path.resolve(config.APP_DIR),
    ];

    const resolved = path.resolve(path.isAbsolute(incoming) ? incoming : path.join(config.getProjectsRoot(), incoming));
    const allowed = allowedRoots.some((root) => resolved === root || resolved.startsWith(`${root}${path.sep}`));
    if (!allowed) throw new Error('Watch path is not allowed');
    return resolved;
  }

  app.get('/api/roots', (req, res) => {
    res.json({
      projectsRoot: config.getProjectsRoot(),
      dataDir: config.getDataDir(),
    });
  });

  app.get('/api/project-types', (req, res) => {
    res.json(listProjectTypes());
  });

  app.get('/api/settings', async (req, res) => {
    try {
      res.json(await buildSettingsResponse());
    } catch (error) {
      console.error('Error loading settings:', error);
      res.status(500).json({ error: error.message || 'Failed to load settings' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    try {
      let movedDataDir = false;
      if (req.body && req.body.projects && req.body.projects.projectRoot !== undefined) {
        const result = await updateProjectRoot(req.body.projects.projectRoot);
        movedDataDir = result.movedDataDir;
      }
      if (req.body && req.body.projects && req.body.projects.dataDir !== undefined) {
        const result = await updateDataDir(req.body.projects.dataDir);
        movedDataDir = movedDataDir || result.movedDataDir;
      }
      if (req.body && req.body.projects && req.body.projects.logsDir !== undefined) {
        await updateLogsDir(req.body.projects.logsDir);
      }

      if (req.body && req.body.integrations) {
        await saveAppSettings({
          integrations: req.body.integrations,
        });
      }

      if (req.body && req.body.ui) {
        await saveAppSettings({
          ui: req.body.ui,
        });
      }

      if (req.body && req.body.ai) {
        await saveAppSettings({
          ai: req.body.ai,
        });
      }

      const response = await buildSettingsResponse();
      response.ok = true;
      response.projects.movedDataDir = movedDataDir;
      res.json(response);
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(400).json({ error: error.message || 'Failed to save settings' });
    }
  });

  app.get('/api/browse', (req, res) => {
    let reqPath = req.query.path;
    const includeFiles = String(req.query.includeFiles || '').trim() === '1';
    if (!reqPath || reqPath === '') reqPath = '.';
    const resolved = config.resolveSafe(reqPath);
    if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });

    try {
      const projectsRoot = config.getProjectsRoot();
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const dirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
          name: entry.name,
          path: path.relative(projectsRoot, path.join(resolved, entry.name)).replace(/\\/g, '/'),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
      const files = includeFiles
        ? entries
          .filter((entry) => entry.isFile())
          .map((entry) => ({
            name: entry.name,
            path: path.relative(projectsRoot, path.join(resolved, entry.name)).replace(/\\/g, '/'),
          }))
          .sort((left, right) => left.name.localeCompare(right.name))
        : [];
      res.json({
        path: path.relative(projectsRoot, resolved).replace(/\\/g, '/'),
        absolute: resolved,
        dirs,
        files,
      });
    } catch (err) {
      res.status(500).json({ error: String(err.message) });
    }
  });

  app.get('/api/fs/browse', (req, res) => {
    const includeFiles = String(req.query.includeFiles || '').trim() === '1';
    const incomingPath = String(req.query.path || '').trim();
    const fallbackRoot = config.getProjectsRoot();
    const resolved = incomingPath
      ? path.resolve(path.isAbsolute(incomingPath) ? incomingPath : path.join(fallbackRoot, incomingPath))
      : path.resolve(fallbackRoot);

    try {
      if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });

      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const listing = entries
        .filter((entry) => includeFiles || entry.isDirectory())
        .map((entry) => {
          const absolutePath = path.join(resolved, entry.name);
          const relativePath = path.relative(fallbackRoot, absolutePath).replace(/\\/g, '/');
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'dir' : 'file',
            absolutePath,
            relativePath: relativePath.startsWith('..') ? '' : relativePath,
            path: relativePath.startsWith('..') ? absolutePath : relativePath,
          };
        })
        .sort((left, right) => {
          if (left.type !== right.type) return left.type === 'dir' ? -1 : 1;
          return left.name.localeCompare(right.name);
        });

      const rootInfo = path.parse(resolved);
      const parentPath = path.dirname(resolved);
      res.json({
        absolutePath: resolved,
        relativePath: (() => {
          const relative = path.relative(fallbackRoot, resolved).replace(/\\/g, '/');
          return relative.startsWith('..') ? '' : relative;
        })(),
        path: (() => {
          const relative = path.relative(fallbackRoot, resolved).replace(/\\/g, '/');
          return relative.startsWith('..') ? resolved : relative;
        })(),
        name: path.basename(resolved) || resolved,
        parentPath: parentPath && parentPath !== resolved ? parentPath : (resolved !== rootInfo.root ? rootInfo.root : ''),
        entries: listing,
      });
    } catch (err) {
      res.status(500).json({ error: String(err.message) });
    }
  });

  app.get('/api/file-watcher/watches', (req, res) => {
    try {
      res.json({
        watches: fileWatcherService.listWatches(),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to list file watches' });
    }
  });

  app.post('/api/file-watcher/watches', async (req, res) => {
    try {
      const watchId = String(req.body && req.body.watchId || '').trim();
      const incomingPaths = Array.isArray(req.body && req.body.paths)
        ? req.body.paths
        : [req.body && req.body.path];
      const paths = incomingPaths.map((value) => resolveWatchPath(value));
      const ignored = Array.isArray(req.body && req.body.ignored)
        ? req.body.ignored.map((value) => String(value || '').trim()).filter(Boolean)
        : [];
      const watch = await fileWatcherService.watch(watchId, paths, { ignored });
      res.json({ watch });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to register file watch' });
    }
  });

  app.delete('/api/file-watcher/watches/:watchId', async (req, res) => {
    try {
      const removed = await fileWatcherService.unwatch(req.params.watchId);
      res.json({ ok: removed });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to remove file watch' });
    }
  });

  app.get('/api/file-watcher/stream', (req, res) => {
    const watchId = String(req.query.watchId || '').trim();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: ready\ndata: ${JSON.stringify({ watchId, timestamp: new Date().toISOString() })}\n\n`);

    const unsubscribe = fileWatcherService.subscribe((event) => {
      res.write(`event: file\ndata: ${JSON.stringify(event)}\n\n`);
    }, watchId);

    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  });
};
