const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { port, jwtSecret } = require('./config/env');
const app = require('./app');
const { connectToDatabase } = require('./utils/db');
const { registerSocketHandlers } = require('./socket');

async function bootstrap() {
  await connectToDatabase();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate socket connections using JWT from auth header or query
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      let token = null;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (typeof authHeader === 'string') {
        token = authHeader;
      } else if (socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded; // { id, email, role }
      next();
    } catch (e) {
      next(new Error('Unauthorized'));
    }
  });

  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`API and WebSocket listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
