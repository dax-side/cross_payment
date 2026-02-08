import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info('WebSocket client connected', { id: socket.id });

    socket.on('join', (userId: string) => {
      if (userId) {
        void socket.join(`user:${userId}`);
        logger.info('User joined room', { userId, socketId: socket.id });
      }
    });

    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { id: socket.id });
    });
  });

  return io;
};

export const getIO = (): Server | null => io;

export const emitTransactionUpdate = (userId: string, transaction: Record<string, unknown>): void => {
  if (io) {
    io.to(`user:${userId}`).emit('transaction:update', transaction);
  }
};

export const emitBalanceUpdate = (userId: string, balance: Record<string, unknown>): void => {
  if (io) {
    io.to(`user:${userId}`).emit('balance:update', balance);
  }
};
