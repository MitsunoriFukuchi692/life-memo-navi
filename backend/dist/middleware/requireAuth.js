import jwt from 'jsonwebtoken';
// 認証ミドルウェア：Authorization ヘッダーの JWT を検証し req.user に載せる。
// これを通過したハンドラは (req as any).user.id を「本人のID」として信頼できる。
// 各ハンドラは、クライアントが送ってくる user_id を信用せず req.user.id を owner として使うこと。
export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: '認証が必要です' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        next();
    }
    catch {
        return res.status(401).json({ error: 'トークンが無効です' });
    }
}
//# sourceMappingURL=requireAuth.js.map