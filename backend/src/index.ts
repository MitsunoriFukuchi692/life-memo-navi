import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db/db.js';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import timelinesRoutes from './routes/timelines.js';
import photosRoutes from './routes/photos.js';
import pdfRoutes from './routes/pdf.js';
import adminRoutes from './routes/admin.js';
import orgRoutes, { initOrganizationTables } from './routes/organization.js';
import aiInterviewRoutes from './routes/aiInterview.js';
import paymentRoutes, { initPaymentTables } from './routes/payment.js'; // ← 追加
import shukatsuRoutes, { initShukatsuTables } from './routes/shukatsu.js'; // ← 追加
import ttsRoutes from './routes/tts.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ========================================
// Stripe Webhookは raw body が必要なので先に設定
// ========================================
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// ミドルウェア
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静的ファイル（アップロード写真）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ヘルスチェック
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API ルート
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/timelines', timelinesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai-interview', aiInterviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/payment', paymentRoutes); // ← 追加
app.use('/api/shukatsu', shukatsuRoutes); // ← 追加
app.use('/api/tts', ttsRoutes);

// ルートエンドポイント
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ライフメモナビ - バックエンド API',
    version: '1.0.0',
    database: 'PostgreSQL',
    endpoints: {
      health: '/health',
      auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login' },
      interviews: { get: 'GET /api/interviews/:user_id', save: 'POST /api/interviews' },
      timelines: { list: 'GET /api/timelines/user/:user_id', create: 'POST /api/timelines' },
      photos: { upload: 'POST /api/photos/upload', list: 'GET /api/photos/:user_id' },
      pdf: { generate: 'GET /api/pdf/generate/:user_id' },
      admin: { users: 'GET /api/admin/users?key=SECRET' },
      payment: {
        checkout: 'POST /api/payment/create-checkout-session',
        status: 'GET /api/payment/status/:userId',
        cancel: 'POST /api/payment/cancel',
        webhook: 'POST /api/payment/webhook',
      }
    }
  });
});

// エラーハンドリング
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404ハンドリング
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ========================================
// Renderのスリープ防止（14分ごとに自己ping）
// ========================================
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || 'https://life-memo-navi-backend.onrender.com';
setInterval(async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    console.log(`💓 Keep-alive ping: ${res.status}`);
  } catch (e) {
    console.log('Keep-alive失敗:', e);
  }
}, 14 * 60 * 1000); // 14分ごと

// サーバー起動
app.listen(PORT, async () => {
  await initOrganizationTables();
  await initPaymentTables(); // ← 追加
  await initShukatsuTables(); // ← 追加
  console.log(`
╔═════════════════════════════════════════╗
║   🌸 ライフメモナビ バックエンド       ║
║   ポート: ${PORT}                          ║
║   DB: PostgreSQL                       ║
╚═════════════════════════════════════════╝
  `);
  console.log(`✅ サーバーが起動しました: http://localhost:${PORT}`);
});

export default app;
