const { port } = require('./config/env');
const app = require('./app');
const { connectToDatabase } = require('./utils/db');

async function bootstrap() {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
