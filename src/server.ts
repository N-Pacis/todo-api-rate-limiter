import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });
import { Server } from 'http';
import app from './app';
import { connectDB } from './utils/database';

const PORT = process.env.PORT || 5000;

const server = new Server(app);

process.on('SIGINT' || 'SIGTERM', () => {
  server.close(() => {
    console.log('Server Stopped.');
    process.exit(0);
  });
});

server.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);
  await connectDB();
});
