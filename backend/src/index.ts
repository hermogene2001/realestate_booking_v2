import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { FraudService } from './services/fraud.service';
import { BookingTimeoutWorker } from './workers/bookingTimeout.worker';
import { EventListenerService } from './services/eventListener.service';
// Temporarily disabled GraphQL due to Apollo version issue
// import { createApolloServer, getApolloMiddleware } from './graphql/apollo';

import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import bookingRoutes from './routes/booking.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import priceRoutes from './routes/price.routes';
import kycRoutes from './routes/kyc.routes';
import twoFactorRoutes from './routes/twoFactor.routes';
import wishlistRoutes from './routes/wishlist.routes';
import searchRoutes from './routes/search.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import messagingRoutes from './routes/messaging.routes';
import aiRoutes from './routes/ai.routes';
import propertyDocumentsRoutes from './routes/propertyDocuments.routes';
import cmsRoutes from './routes/cms.routes';
import extrasRoutes from './routes/extras.routes';
import tokenRoutes from './routes/token.routes';
import reputationRoutes from './routes/reputation.routes';
import trainingRoutes from './routes/training.routes';

const app = express();

// Security & Tracking Middleware (must be first)
app.use(requestIdMiddleware);

// CORS & Body Parsing Middleware - support multiple origins (comma-separated or single)
const allowedOrigins = env.FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // In development, allow all origins
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', propertyDocumentsRoutes);
app.use('/api', cmsRoutes);
app.use('/api/extras', extrasRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/training', trainingRoutes);

// Error handler
app.use(errorHandler);

// Fraud detection cron - runs every hour
cron.schedule('0 * * * *', async () => {
  try {
    const alerts = await FraudService.runChecks();
    if (alerts.length > 0) {
      console.log(`[Fraud] Detected ${alerts.length} new alert(s)`);
    }
  } catch (error) {
    console.error('[Fraud] Check failed:', error);
  }
});

// Start server
app.listen(env.PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);

  // GraphQL temporarily disabled
  // try {
  //   const apolloServer = await createApolloServer();
  //   app.use('/graphql', getApolloMiddleware());
  //   console.log('GraphQL endpoint: http://localhost:' + env.PORT + '/graphql');
  // } catch (error) {
  //   console.error('Failed to initialize GraphQL:', error);
  // }

  // Start booking timeout worker
  BookingTimeoutWorker.start();

  // Start blockchain event listener
  EventListenerService.start();

  // Run initial fraud check on startup
  try {
    const alerts = await FraudService.runChecks();
    console.log(`[Fraud] Initial scan complete: ${alerts.length} alert(s) detected`);
  } catch (error) {
    console.error('[Fraud] Initial scan failed:', error);
  }
});

export default app;
