import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { sanitizeInput } from './middlewares/sanitize.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (debe ser el último middleware)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
🚀 Server ready at: http://localhost:${PORT}
📊 Environment: ${process.env.NODE_ENV || 'development'}
🔐 API Base: http://localhost:${PORT}/api
  `);
});

export default app;
