import mongoose from 'mongoose';
import { maskCredentials } from './secrets.js';

let mongoMemoryServerInstance = null;

export async function connectDB() {
  const isProduction = process.env.NODE_ENV === 'production';
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pinposter';

  // Production Database Security Pre-checks
  if (isProduction) {
    if (!process.env.MONGODB_URI) {
      throw new Error('DATABASE SECURITY ERROR: MONGODB_URI must be configured in production.');
    }
    if (primaryUri.includes('<db_password>') || primaryUri.includes('<password>')) {
      throw new Error('DATABASE SECURITY ERROR: MONGODB_URI contains unpopulated placeholder credentials (<db_password>).');
    }
    if (primaryUri.includes('127.0.0.1') || primaryUri.includes('localhost')) {
      throw new Error('DATABASE SECURITY ERROR: Production database cannot point to unauthenticated local loopback without TLS.');
    }
  }

  // Connection options: Enforce TLS/SSL in production
  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    ...(isProduction && {
      tls: true,
      tlsAllowInvalidCertificates: false,
    }),
  };

  try {
    console.log(`Connecting to MongoDB at: ${maskCredentials(primaryUri)}...`);
    await mongoose.connect(primaryUri, connectionOptions);
    console.log('MongoDB successfully connected.');
  } catch (err) {
    console.warn(`Standard MongoDB connection failed: ${err.message}.`);

    // In production, fallback to in-memory database is strictly forbidden
    if (isProduction) {
      console.error('DATABASE SECURITY ERROR: Production connection failed. In-memory database fallback is prohibited in production.');
      throw err;
    }

    console.log('Attempting fallback to in-memory MongoDB server for seamless zero-config local operation...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'pinposter',
          launchTimeout: 60000,
        },
      });
      const memoryUri = mongoMemoryServerInstance.getUri();
      console.log(`Embedded MongoMemoryServer initialized at: ${memoryUri}`);

      await mongoose.connect(memoryUri);
      console.log('Connected to embedded MongoDB database.');
    } catch (fallbackErr) {
      console.error('Fatal: Could not connect to primary MongoDB or initialize in-memory fallback:', fallbackErr.message);
      console.error('TIP: Make sure a local MongoDB service is running (e.g. mongodb://localhost:27017) or supply a valid MONGODB_URI in server/.env.');
      throw fallbackErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
    console.log('MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('Error during DB disconnect:', err);
  }
}
