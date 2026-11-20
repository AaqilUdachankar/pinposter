import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { validateEnvironment } from './config/envValidator.js';
import { connectDB, disconnectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { startScheduleWorker, stopScheduleWorker } from './workers/scheduleWorker.js';
import { seedDemoData } from './utils/seedDemoData.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import pinRoutes from './routes/pinRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import apiConfigRoutes from './routes/apiConfigRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import feedRoutes from './routes/feedRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// 4. Security Headers (Helmet)
// Strict-Transport-Security: max-age 1 year, X-Content-Type-Options: nosniff,
// X-Frame-Options: DENY, and strict Content-Security-Policy
// =========================================================================
app.use(
  helmet({
    noSniff: true, // X-Content-Type-Options: nosniff
    frameguard: {
      action: 'deny', // X-Frame-Options: DENY
    },
    hsts: {
      maxAge: 31536000, // 1 year (365 days in seconds)
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : ['http://localhost:5173']),
          'https://*.googleapis.com',
          'https://api.cloudinary.com',
        ],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"], // Disallow embedding inside iframes
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// =========================================================================
// 6. CORS Configuration
// Restrict strictly to configured frontend domains; disallow wildcard *
// =========================================================================
const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = configuredClientUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser agents (crawlers, Pinterest RSS bots, curl, internal jobs) with no origin header
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
        (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin));

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error(`CORS Error: Origin ${origin} is not allowed access by security policy.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-correlation-id'],
    maxAge: 86400, // 24 hours
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve locally generated uploads statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// =========================================================================
// 5. Global API Rate Limiting
// =========================================================================
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PinPoster SaaS API',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/api-configurations', apiConfigRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/feed', feedRoutes);

// =========================================================================
// 3. Central Error Handling (Generic client messages, Correlation IDs)
// =========================================================================
app.use(errorHandler);

// =========================================================================
// Bootstrap Server & Background Services
// =========================================================================
async function bootstrap() {
  try {
    // 1. Run Pre-flight Environment Validation (Halts immediately if critical vars missing)
    validateEnvironment();

    // 2. Connect to Database with TLS & Security Enforcement
    await connectDB();

    // In development ONLY, conditionally seed demo data if explicitly requested
    if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA === 'true') {
      await seedDemoData();
    }

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`PinPoster SaaS Backend running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });

    // Start background queue scheduler
    startScheduleWorker();

    // Clean shutdown handlers
    const cleanup = async () => {
      stopScheduleWorker();
      server.close(async () => {
        await disconnectDB();
      });
    };

    process.once('SIGUSR2', async () => {
      await cleanup();
      process.kill(process.pid, 'SIGUSR2');
    });
    process.on('SIGINT', async () => {
      await cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await cleanup();
      process.exit(0);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err.message);
    process.exit(1);
  }
}

bootstrap();
