module.exports = function registerProjectRoutes(app, ctx) {
  const {
    fs,
    path,
    config,
    normalizeLinks,
    defaultMappingGroups,
    normalizeMappingGroups,
    normalizeProjectPrimaryAction,
    normalizeWorkspacePlugins,
    normalizeProjectIntegrations,
    normalizeProjectType,
    buildModuleRegistry,
    moduleKeysToLegacyWorkspacePlugins,
    resolveEnabledModuleSelection,
    readProjects,
    getProjectById,
    saveProject,
    deleteProject,
    readProjectModules,
    syncProjectModules,
    saveProjectDocument,
    readEntityRelationships,
    saveEntityRelationship,
    deleteEntityRelationship,
    syncBugsDocument,
    syncFeaturesDocument,
    syncPrdDocument,
    syncRoadmapDocument,
    syncArchitectureDocument,
    syncAiEnvironmentDocument,
    syncDatabaseSchemaDocument,
    ensureWorkspaceProject,
    sanitizeProject,
    normalizeRequestedProjectType,
    removeWorkspacePluginArtifacts,
    removeProjectModuleArtifacts,
    isProjectModuleEnabled,
  } = ctx;

  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await readProjects();
      for (const project of projects) {
        if (project?.type !== 'folder') continue;
        try {
          ensureWorkspaceProject(project);
        } catch (error) {
          config.log(`phase5: startup workspace reconciliation skipped for project ${project?.id || 'unknown'}: ${error.message || 'unknown error'}`);
        }
      }
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const {
        type: sourceType,
        path: projectPath,
        url: projectUrl,
        name,
        description,
        parentId,
        category,
        tags,
        links,
        primaryAction,
        workspacePlugins,
        integrations,
        enabledModules,
      } = req.body || {};
      const projectType = normalizeRequestedProjectType(req.body || {}, 'general');
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      let project;
      if (sourceType === 'url') {
        const url = String(projectUrl || '').trim();
        if (!url) return res.status(400).json({ error: 'URL is required for URL projects' });
        if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Invalid URL' });
        project = {
          id,
          type: 'url',
          path: null,
          absolutePath: null,
          url,
          name: String(name).trim(),
          description: description || '',
          parentId: parentId || null,
          serverId: null,
          openInCursor: false,
          openInCursorAdmin: false,
          pinned: false,
          imagePath: null,
          imageUrl: null,
          primaryAction: normalizeProjectPrimaryAction(primaryAction),
          projectType,
          workspacePlugins: normalizeWorkspacePlugins(workspacePlugins),
          enabledModules: Array.isArray(enabledModules) ? enabledModules : buildModuleRegistry(projectType, { enabledModuleKeys: workspacePlugins }).filter((module) => module.enabled).map((module) => module.moduleKey),
          category: category && String(category).trim() ? String(category).trim() : null,
          tags: Array.isArray(tags) ? tags.filter((tag) => tag != null && String(tag).trim()) : [],
          links: normalizeLinks(links),
          dateAdded: new Date().toISOString(),
          mappingGroups: defaultMappingGroups([]),
          integrations: normalizeProjectIntegrations(integrations),
        };
      } else {
        const requestedPath = String(projectPath || '').trim();
        if (!requestedPath) return res.status(400).json({ error: 'Folder path is required' });
        const resolved = config.resolveSafe(requestedPath);
        if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          return res.status(400).json({ error: 'Path is not an existing directory' });
        }
        project = {
          id,
          type: 'folder',
          path: requestedPath.replace(/\\/g, '/'),
          absolutePath: resolved,
          url: null,
          name: String(name).trim(),
          description: description || '',
          parentId: parentId || null,
          serverId: null,
          openInCursor: false,
          openInCursorAdmin: false,
          pinned: false,
          imagePath: null,
          imageUrl: null,
          primaryAction: normalizeProjectPrimaryAction(primaryAction),
          projectType,
          workspacePlugins: normalizeWorkspacePlugins(workspacePlugins),
          enabledModules: Array.isArray(enabledModules) ? enabledModules : buildModuleRegistry(projectType, { enabledModuleKeys: workspacePlugins }).filter((module) => module.enabled).map((module) => module.moduleKey),
          category: category && String(category).trim() ? String(category).trim() : null,
          tags: Array.isArray(tags) ? tags.filter((tag) => tag != null && String(tag).trim()) : [],
          links: normalizeLinks(links),
          dateAdded: new Date().toISOString(),
          mappingGroups: defaultMappingGroups([]),
          integrations: normalizeProjectIntegrations(integrations),
        };
      }

      res.json(sanitizeProject(await saveProject(project)));
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const {
        name,
        description,
        parentId,
        serverId,
        category,
        tags,
        links,
        openInCursor,
        openInCursorAdmin,
        pinned,
        primaryAction,
        workspacePlugins,
        uploadMappings,
        mappingGroups,
        integrations,
        imagePath,
        imageUrl,
        path: nextProjectPath,
        projectPath,
        url: nextProjectUrl,
        projectUrl,
        projectType,
        enabledModules,
      } = req.body || {};

      if (name !== undefined) project.name = String(name || '').trim() || project.name;
      if (description !== undefined) project.description = String(description || '');
      if (parentId !== undefined) project.parentId = parentId || null;
      if (serverId !== undefined) project.serverId = serverId || null;
      if (category !== undefined) project.category = category && String(category).trim() ? String(category).trim() : null;
      if (tags !== undefined) project.tags = Array.isArray(tags) ? tags.filter((tag) => tag != null && String(tag).trim()) : [];
      if (links !== undefined) project.links = normalizeLinks(links);
      if (openInCursor !== undefined) project.openInCursor = !!openInCursor;
      if (openInCursorAdmin !== undefined) project.openInCursorAdmin = !!openInCursorAdmin;
      if (pinned !== undefined) project.pinned = !!pinned;
      if (primaryAction !== undefined) project.primaryAction = normalizeProjectPrimaryAction(primaryAction);
      if (projectType !== undefined) project.projectType = normalizeProjectType(projectType);
      if (workspacePlugins !== undefined) project.workspacePlugins = normalizeWorkspacePlugins(workspacePlugins);
      if (enabledModules !== undefined) project.enabledModules = Array.isArray(enabledModules) ? enabledModules : project.enabledModules;
      if (imagePath !== undefined) project.imagePath = imagePath || null;
      if (imageUrl !== undefined) {
        project.imageUrl = (imageUrl && String(imageUrl).trim()) || null;
        if (project.imageUrl) project.imagePath = null;
      }
      if (mappingGroups !== undefined) project.mappingGroups = normalizeMappingGroups(mappingGroups, project.uploadMappings);
      else if (uploadMappings !== undefined) project.mappingGroups = defaultMappingGroups(uploadMappings);
      if (integrations !== undefined) project.integrations = normalizeProjectIntegrations(integrations);

      const updatedPath = projectPath ?? nextProjectPath;
      if (updatedPath !== undefined && updatedPath !== '') {
        const resolved = config.resolveSafe(updatedPath);
        if (!resolved) return res.status(403).json({ error: 'Path not allowed' });
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          return res.status(400).json({ error: 'Path is not an existing directory' });
        }
        project.path = String(updatedPath).replace(/\\/g, '/');
        project.absolutePath = resolved;
        project.type = 'folder';
        project.url = null;
      }

      const updatedUrl = projectUrl ?? nextProjectUrl;
      if (updatedUrl !== undefined) {
        const value = String(updatedUrl || '').trim();
        if (value) {
          if (!/^https?:\/\//i.test(value)) return res.status(400).json({ error: 'Invalid URL' });
          project.url = value;
          if (!updatedPath) {
            project.type = 'url';
            project.path = null;
            project.absolutePath = null;
          }
        } else if (project.type === 'url') {
          project.url = null;
        }
      }

      res.json(sanitizeProject(await saveProject(project)));
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      await deleteProject(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  app.put('/api/projects/:id/image', async (req, res) => {
    try {
      const { imageData } = req.body || {};
      if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ error: 'imageData (data URL) required' });
      }
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      config.ensureDataDir();
      const projectImagesDir = config.getProjectImagesDir();
      if (!fs.existsSync(projectImagesDir)) fs.mkdirSync(projectImagesDir, { recursive: true });
      const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: 'Invalid image data' });
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const filename = `${req.params.id}.${ext}`;
      fs.writeFileSync(path.join(projectImagesDir, filename), Buffer.from(match[2], 'base64'));
      project.imagePath = `project-images/${filename}`;
      project.imageUrl = null;
      res.json(sanitizeProject(await saveProject(project)));
    } catch (error) {
      console.error('Error saving project image:', error);
      res.status(500).json({ error: 'Failed to save project image' });
    }
  });

  app.get('/api/project-image/:id', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project || !project.imagePath) return res.status(404).send('Not found');
      const dataDir = config.getDataDir();
      const filePath = path.join(dataDir, project.imagePath);
      if (!path.resolve(filePath).startsWith(path.resolve(dataDir)) || !fs.existsSync(filePath)) {
        return res.status(404).send('Not found');
      }
      const ext = path.extname(project.imagePath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Error loading project image:', error);
      res.status(500).send('Failed to load image');
    }
  });

  app.put('/api/projects/:id/workspace-plugins', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      const enabledPlugins = normalizeWorkspacePlugins(req.body && req.body.enabledPlugins);
      const currentPlugins = normalizeWorkspacePlugins(project.workspacePlugins);
      const removedPlugins = currentPlugins.filter((plugin) => !enabledPlugins.includes(plugin));
      const cleanupPlugins = Array.isArray(req.body && req.body.cleanupPlugins)
        ? req.body.cleanupPlugins.map((plugin) => String(plugin || '').trim().toLowerCase())
        : [];

      for (const plugin of removedPlugins) {
        await removeWorkspacePluginArtifacts(project, plugin, cleanupPlugins.includes(plugin));
      }

      project.workspacePlugins = enabledPlugins;
      const savedProject = await saveProject(project);

      if (enabledPlugins.includes('bugs')) await syncBugsDocument(savedProject);
      if (enabledPlugins.includes('features')) await syncFeaturesDocument(savedProject);
      if (enabledPlugins.includes('prd')) await syncPrdDocument(savedProject);
      await syncRoadmapDocument(savedProject);

      res.json({ workspacePlugins: savedProject.workspacePlugins || [] });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update workspace plugins' });
    }
  });

  app.get('/api/projects/:id/modules', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json({
        projectId: project.id,
        projectType: project.projectType || 'general',
        modules: typeof syncProjectModules === 'function'
          ? await syncProjectModules(project)
          : await readProjectModules(project.id),
        dependencies: await readEntityRelationships(project.id, {
          sourceEntityType: 'module',
          relationshipType: 'depends_on',
          targetEntityType: 'module',
        }),
      });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to load project modules' });
    }
  });

  app.get('/api/projects/:id/ai-environment', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'ai_environment')) {
        return res.status(400).json({ error: 'AI Environment module is not enabled for this project' });
      }
      res.json(await syncAiEnvironmentDocument(project));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to load AI Environment' });
    }
  });

  app.put('/api/projects/:id/ai-environment', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      ensureWorkspaceProject(project);
      if (!isProjectModuleEnabled(project, 'ai_environment')) {
        return res.status(400).json({ error: 'AI Environment module is not enabled for this project' });
      }
      const nextEditorState = req.body && req.body.editorState && typeof req.body.editorState === 'object'
        ? req.body.editorState
        : null;
      await saveProjectDocument(project.id, 'ai_environment', {
        markdown: '',
        mermaid: req.body && typeof req.body.mermaid === 'string'
          ? req.body.mermaid
          : 'flowchart TD\n  ai["AI Environment"] --> brief["Project Brief"]\n  ai --> modules["Affected Modules"]\n  ai --> fragments["Managed Fragments"]',
        editorState: nextEditorState,
      });
      res.json(await syncAiEnvironmentDocument(project, { skipImport: true }));
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save AI Environment' });
    }
  });

  app.put('/api/projects/:id/modules', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const currentEnabledModules = Array.isArray(project.enabledModules)
        ? project.enabledModules.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
        : [];
      const projectType = normalizeRequestedProjectType(req.body || {}, project.projectType || 'general');
      const requestedEnabledModuleKeys = Array.isArray(req.body && req.body.enabledModules)
        ? req.body.enabledModules.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
        : project.enabledModules || [];
      const enabledModuleKeys = resolveEnabledModuleSelection(projectType, currentEnabledModules, requestedEnabledModuleKeys);
      const cleanupModules = Array.isArray(req.body && req.body.cleanupModules)
        ? req.body.cleanupModules.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
        : [];
      const registry = buildModuleRegistry(projectType, { enabledModuleKeys, existingModules: project.modules || [] });
      const nextEnabledModules = registry.filter((module) => module.enabled).map((module) => module.moduleKey);
      const removedModules = currentEnabledModules.filter((moduleKey) => !nextEnabledModules.includes(moduleKey));
      for (const moduleKey of removedModules) {
        await removeProjectModuleArtifacts(project, moduleKey, cleanupModules.includes(moduleKey));
      }
      project.projectType = projectType;
      project.enabledModules = nextEnabledModules;
      project.workspacePlugins = moduleKeysToLegacyWorkspacePlugins(project.enabledModules);
      project.modules = registry;

      const savedProject = await saveProject(project);
      if (savedProject.type === 'folder') {
        if (project.enabledModules.includes('ai_environment')) await syncAiEnvironmentDocument(savedProject);
        if (project.enabledModules.includes('architecture')) await syncArchitectureDocument(savedProject);
        if (project.enabledModules.includes('database_schema')) await syncDatabaseSchemaDocument(savedProject);
      }
      res.json({
        projectId: savedProject.id,
        projectType: savedProject.projectType,
        enabledModules: savedProject.enabledModules || [],
        workspacePlugins: savedProject.workspacePlugins || [],
        modules: savedProject.modules || [],
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to update project modules' });
    }
  });

  app.get('/api/projects/:id/relationships', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      res.json(await readEntityRelationships(req.params.id, req.query || {}));
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to load relationships' });
    }
  });

  app.post('/api/projects/:id/relationships', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      const saved = await saveEntityRelationship({
        ...req.body,
        projectId: req.params.id,
      });
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to save relationship' });
    }
  });

  app.delete('/api/projects/:id/relationships/:relationshipId', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      await deleteEntityRelationship(req.params.id, req.params.relationshipId);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to delete relationship' });
    }
  });
};
