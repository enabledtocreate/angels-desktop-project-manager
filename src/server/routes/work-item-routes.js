module.exports = function registerWorkItemRoutes(app, ctx) {
  const {
    normalizeTaskPayload,
    getProjectById,
    readProjectTasks,
    readProjectWorkItems,
    getTaskById,
    getWorkItemById,
    nextTaskSortOrder,
    saveTask,
    deleteTask,
    syncRoadmapDependentDocuments,
  } = ctx;

  app.get('/api/projects/:id/tasks', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      res.json(await readProjectTasks(req.params.id));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.get('/api/projects/:id/work-items', async (req, res) => {
    try {
      if (!(await getProjectById(req.params.id))) return res.status(404).json({ error: 'Project not found' });
      res.json(await readProjectWorkItems(req.params.id));
    } catch (error) {
      console.error('Error fetching work items:', error);
      res.status(500).json({ error: 'Failed to fetch work items' });
    }
  });

  app.get('/api/projects/:projectId/work-items/:workItemId', async (req, res) => {
    try {
      const item = await getWorkItemById(req.params.projectId, req.params.workItemId);
      if (!item) return res.status(404).json({ error: 'Work item not found' });
      res.json(item);
    } catch (error) {
      console.error('Error fetching work item:', error);
      res.status(500).json({ error: 'Failed to fetch work item' });
    }
  });

  app.post('/api/projects/:id/tasks', async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await getProjectById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const task = normalizeTaskPayload({
        ...req.body,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        projectId,
        sortOrder: req.body && req.body.sortOrder !== undefined ? req.body.sortOrder : await nextTaskSortOrder(projectId),
      });
      if (!task.title) return res.status(400).json({ error: 'Task title is required' });
      const savedTask = await saveTask(task);
      if (project.type === 'folder') await syncRoadmapDependentDocuments(project);
      res.json(savedTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.put('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    try {
      const task = await getTaskById(req.params.projectId, req.params.taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      const updated = normalizeTaskPayload({ ...task, ...req.body, id: task.id, projectId: task.projectId }, task);
      if (!updated.title) return res.status(400).json({ error: 'Task title is required' });
      const savedTask = await saveTask(updated);
      const project = await getProjectById(req.params.projectId);
      if (project && project.type === 'folder') await syncRoadmapDependentDocuments(project);
      res.json(savedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.delete('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    try {
      if (!(await getTaskById(req.params.projectId, req.params.taskId))) {
        return res.status(404).json({ error: 'Task not found' });
      }
      await deleteTask(req.params.projectId, req.params.taskId);
      const project = await getProjectById(req.params.projectId);
      if (project && project.type === 'folder') await syncRoadmapDependentDocuments(project);
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });
};
