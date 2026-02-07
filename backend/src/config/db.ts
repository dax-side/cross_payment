import mongoose from 'mongoose';
import { logger } from './logger';

interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

const connectDatabase = async (config?: DatabaseConfig): Promise<typeof mongoose> => {
  const uri = config?.uri ?? process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    ...config?.options
  };

  try {
    const connection = await mongoose.connect(uri, options);
    logger.info('MongoDB connected successfully', { 
      host: connection.connection.host,
      name: connection.connection.name 
    });
    return connection;
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('MongoDB disconnection failed', { error });
    throw error;
  }
};

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', { error });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

export { connectDatabase, disconnectDatabase };
