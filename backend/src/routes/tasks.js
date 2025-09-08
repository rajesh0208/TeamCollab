const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const Task = require('../models/Task');

function tasksRouter(io) {
  const router = express.Router();
  router.use(authenticateJWT);

  // Get all tasks (for current team/project scope; simplified to all for now)
  router.get('/', async (_req, res) => {
    const tasks = await Task.find({}).populate('assignee', '-password').populate('createdBy', '-password').lean();
    res.json(tasks);
  });

  // Create task
  router.post('/', async (req, res) => {
    const payload = req.body || {};
    const doc = await Task.create({
      title: payload.title,
      description: payload.description || '',
      status: payload.status || 'todo',
      priority: payload.priority || 'medium',
      dueDate: payload.dueDate || undefined,
      assignee: payload.assignee || undefined,
      createdBy: req.user.id,
    });
    const task = await Task.findById(doc._id).populate('assignee', '-password').populate('createdBy', '-password').lean();
    io.emit('taskCreated', task);
    res.status(201).json(task);
  });

  // Update task
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const update = req.body || {};
    const task = await Task.findByIdAndUpdate(id, update, { new: true })
      .populate('assignee', '-password')
      .populate('createdBy', '-password')
      .lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });
    io.emit('taskUpdated', task);
    res.json(task);
  });

  // Delete task (only creator or admin; simplified check)
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const task = await Task.findById(id).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (String(task.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await Task.findByIdAndDelete(id);
    io.emit('taskDeleted', { id });
    res.json({ ok: true });
  });

  return router;
}

module.exports = { tasksRouter };


