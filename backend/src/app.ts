import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { morganStream } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { correlationId } from './middleware/correlationId';
import { generalLimiter, authLimiter, paymentLimiter } from './middleware/rateLimiter';
import { blockchainService } from './services/blockchain.service';
import { handleStripeWebhook } from './controllers/payment.controller';
import { asyncHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import paymentRoutes from './routes/payment.routes';
import ratesRoutes from './routes/rates.routes';
import analyticsRoutes from './routes/analytics.routes';

const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  app.use(cors(corsOptions));
  
  app.post(
    '/api/payment/topup/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(handleStripeWebhook)
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(correlationId);
  app.use(generalLimiter);

  app.use(morgan('combined', { stream: morganStream }));

  // Temporary Stripe diagnostic — remove after confirming Stripe works in prod
  app.get('/api/stripe-diag', async (_req, res) => {
    try {
      const { getStripe } = await import('./config/stripe');
      const s = getStripe();
      // Retrieve a non-existent intent — will throw a 'no such' error but proves auth works
      await s.paymentIntents.retrieve('pi_diagnostic_test').catch((err: any) => {
        if (err?.code === 'resource_missing') {
          res.json({ stripe: 'connected', keyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 12) + '...' });
        } else {
          res.json({ stripe: 'error', errorType: err?.constructor?.name, errorMessage: err?.message, keyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 12) + '...' });
        }
      });
    } catch (err: any) {
      res.json({ stripe: 'init_failed', errorType: err?.constructor?.name, errorMessage: err?.message });
    }
  });

  app.get('/health', async (_req, res) => {
    let dbStatus = 'disconnected';
    let rpcStatus = 'unreachable';
    let treasuryBalance = null;

    try {
      const mongoose = await import('mongoose');
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch { /* ignore */ }

    try {
      const valid = await blockchainService.isValidChain();
      rpcStatus = valid ? 'connected' : 'wrong_chain';
      const balance = await blockchainService.getMasterWalletBalance();
      treasuryBalance = balance;
    } catch { /* ignore */ }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cross-payment-api',
      uptime: process.uptime(),
      database: dbStatus,
      blockchain: {
        rpc: rpcStatus,
        treasury: treasuryBalance
      }
    });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Cross-Border Payment API'
  }));

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/payment', paymentLimiter, paymentRoutes);
  app.use('/api/rates', ratesRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};

export { createApp };
