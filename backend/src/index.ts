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

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://memo.robostudy.jp',
  'https://life-memo-navi.onrender.com',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: ' + origin));
    }
  },
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
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/timelines', timelinesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/pdf', pdfRoutes);

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
      pdf: { generate: 'GET /api/pdf/generate/:user_id' }
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

// サーバー起動
app.listen(PORT, () => {
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
