import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { connectDatabase } from './config/db';
import { logger } from './config/logger';
import { initSocket } from './config/socket';

const PORT = process.env.PORT ?? 4000;

const startServer = async (): Promise<void> => {
  try {
    logger.info('Starting server...');
    
    logger.info('Connecting to database...');
    await connectDatabase();

    const app = createApp();
    const httpServer = http.createServer(app);

    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV ?? 'development',
        apiDocs: `http://localhost:${PORT}/api-docs`,
        websocket: 'enabled'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { 
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

void startServer();