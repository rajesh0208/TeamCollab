const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const router = express.Router();

router.use(authenticateJWT);

// List users (basic directory)
router.get('/users', async (_req, res) => {
  const users = await User.find({}, { password: 0 }).limit(100).lean();
  res.json(users);
});

// Rooms CRUD (minimal)
router.get('/rooms', async (req, res) => {
  const rooms = await Room.find({ members: req.user.id }).lean();
  res.json(rooms);
});

router.post('/rooms', async (req, res) => {
  const { name, memberIds } = req.body;
  const room = await Room.create({ name, members: [req.user.id, ...(memberIds || [])] });
  res.status(201).json(room);
});

// Fetch messages (private or room)
router.get('/messages', async (req, res) => {
  const { withUserId, roomId, limit = 50, before } = req.query;
  const query = {};
  if (withUserId) {
    query.$or = [
      { sender: req.user.id, receiver: withUserId },
      { sender: withUserId, receiver: req.user.id },
    ];
  }
  if (roomId) query.roomId = roomId;
  if (before) query.createdAt = { $lt: new Date(before) };
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();
  res.json(messages.reverse());
});

module.exports = router;


