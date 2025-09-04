const Message = require('./models/Message');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // Auto-join personal room for direct messages
    const personalRoom = `user:${user.id}`;
    socket.join(personalRoom);

    // Join/leave rooms (group channels)
    socket.on('join', (roomId) => {
      socket.join(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('system', { type: 'join', userId: user.id });
    });

    socket.on('leave', (roomId) => {
      socket.leave(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('system', { type: 'leave', userId: user.id });
    });

    // Typing indicators
    socket.on('typing', (payload) => {
      const { roomId, toUserId, isTyping } = payload || {};
      if (roomId) {
        socket.to(`room:${roomId}`).emit('typing', { userId: user.id, isTyping });
      } else if (toUserId) {
        socket.to(`user:${toUserId}`).emit('typing', { userId: user.id, isTyping });
      }
    });

    // Read receipts
    socket.on('read', async (payload) => {
      const { messageIds } = payload || {};
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: user.id }, $set: { status: 'read' } }
      );
      for (const id of messageIds) {
        io.emit('read', { messageId: id, userId: user.id });
      }
    });

    // Messages (private or room)
    socket.on('message', async (payload, ack) => {
      try {
        const { content, toUserId, roomId, type } = payload || {};
        if (!content || (!toUserId && !roomId)) return;

        const doc = await Message.create({
          sender: user.id,
          receiver: toUserId || undefined,
          roomId: roomId || undefined,
          content,
          type: type || 'text',
          status: 'sent',
        });

        const message = doc.toObject();
        if (toUserId) {
          // private: deliver to recipient's personal room and back to sender
          io.to(`user:${toUserId}`).emit('message', message);
          io.to(personalRoom).emit('message', message);
        } else if (roomId) {
          // room broadcast
          io.to(`room:${roomId}`).emit('message', message);
        }
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: 'failed' });
      }
    });
  });
}

module.exports = { registerSocketHandlers };


