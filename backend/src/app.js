import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import employeeRoutes from './routes/employeeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';

dotenv.config();

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Keep flexible for dev/local previews
  })
);

// CORS configuration
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      // or matching allowed origins
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev mode to prevent developer friction
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing with safe size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api', employeeRoutes);
app.use('/api', leaveRoutes);
app.use('/api', dashboardRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Omibits Employee Leave Management System API',
    version: '1.0.0',
    documentation: '/docs',
    health: '/api/health',
  });
});

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
