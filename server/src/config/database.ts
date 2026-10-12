import mongoose from 'mongoose';
import dns from 'dns';
import config from './index.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(): Promise<void> {
  try {
    // Ensure reliable DNS resolution for MongoDB Atlas SRV records on Windows/local environments
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {
      // Fallback to default system resolvers if custom DNS cannot be configured
    }

    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error({ err: error }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting from MongoDB');
  }
}
