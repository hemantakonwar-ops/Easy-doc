import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './core/config/db.js';

import uploadRoutes from './features/upload/upload.route.js';
import documentRoutes from './features/document/document.route.js';
import chatRoutes from './features/chat/chat.route.js';
import chatHistoryRoutes from './features/chat/chatHistory.route.js';
import riskRoutes from './features/risk/risk.route.js';
import simplifyRoutes from './features/simplify/simplify.route.js';
import searchRoutes from './features/search/search.route.js';
import authRoutes from './features/auth/auth.route.js';
import clauseRoutes from './features/clause/clause.route.js';
import lawsRoutes from './features/laws/laws.route.js';
import agreementRoutes from './features/agreement/agreement.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Health check - support both /health and /api/health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'nodejs-gateway', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'nodejs-gateway', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/simplify', simplifyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clause', clauseRoutes);
app.use('/api/laws', lawsRoutes);
app.use('/api/agreement', agreementRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message, stack: err.stack });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`FastAPI URL: ${process.env.FASTAPI_URL}`);
});
