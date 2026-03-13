import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import timelinesRoutes from './routes/timelines.js';
import photosRoutes from './routes/photos.js';
import pdfRoutes from './routes/pdf.js';
import adminRoutes from './routes/admin.js';
import orgRoutes, { initOrganizationTables } from './routes/organization.js';
import aiInterviewRoutes from './routes/aiInterview.js';
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
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
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API ルート
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/timelines', timelinesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai-interview', aiInterviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/org', orgRoutes);
// ルートエンドポイント
app.get('/', (req, res) => {
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
            admin: { users: 'GET /api/admin/users?key=SECRET' }
        }
    });
});
// エラーハンドリング
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});
// 404ハンドリング
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});
// サーバー起動
app.listen(PORT, async () => {
    await initOrganizationTables();
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
//# sourceMappingURL=index.js.map