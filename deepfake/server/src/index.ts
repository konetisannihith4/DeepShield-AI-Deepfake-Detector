import express from 'express';
import http from 'http';
import { ENV } from './config/env';
import { securityMiddleware, sanitizeInput } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes/api';
import { SocketService } from './services/socketService';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Real-time Audio Detection Stream Server
const socketService = new SocketService(server);

// Security & Parsing Middleware
app.use(securityMiddleware);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(sanitizeInput);

import path from 'path';

// Mount Static Media Uploads Directory & API Router
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root & Health check routes for Cloud monitoring
app.get('/', (_req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'DeepShield AI Enterprise API Server',
    version: '2.0.0',
    documentation: '/api/health',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'DeepShield AI API Server',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);

// Centralized Error Handler
app.use(errorHandler);

const PORT = parseInt(ENV.PORT, 10);

server.timeout = 300000; // 5 minutes socket timeout for large video media uploads
server.keepAliveTimeout = 300000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 DeepShield Enterprise AI Detection Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Environment: ${ENV.NODE_ENV}`);
  console.log(`🛢️ Database: MySQL 8 (Prisma ORM)`);
  console.log(`🎙️ Realtime Socket.IO Audio Stream Server Active`);
  console.log(`=======================================================`);
});

// Process Signal Termination Handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown() {
  console.log('\n[Server]: Initiating graceful shutdown...');
  server.close(() => {
    console.log('[Server]: Closed HTTP & Socket.IO connections.');
    process.exit(0);
  });
}
