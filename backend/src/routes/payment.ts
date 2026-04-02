import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Pool } from 'pg';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 価格ID
const PRICE_ID_STANDARD = process.env.STRIPE_PRICE_ID || '';          // ¥380/月
const PRICE_ID_GAKKAI   = process.env.STRIPE_PRICE_ID_GAKKAI || '';   // ¥220/月（120学会会員）

// 学会コード一覧（将来的に複数対応できるよう配列で管理）
const GAKKAI_CODES = ['120-4967'];

// ========================================
// テーブル初期化
// ========================================
export async function initPaymentTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      stripe_customer_id VARCHAR(100),
      stripe_subscription_id VARCHAR(100),
      plan_type VARCHAR(20) DEFAULT 'standard',
      status VARCHAR(30) DEFAULT 'inactive',
      trial_end TIMESTAMP,
      current_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ サブスクリプションテーブル初期化完了');
}

// ========================================
// POST /api/payment/create-checkout-session
// サブスクリプション開始（Stripe Checkout）
// ========================================
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { userId, userEmail, orgCode } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'ユーザー情報が必要です' });
    }

    // 学会コードで価格・プランを決定
    const isGakkai = orgCode && GAKKAI_CODES.includes(orgCode.trim());
    const priceId  = isGakkai ? PRICE_ID_GAKKAI : PRICE_ID_STANDARD;
    const planType = isGakkai ? 'gakkai' : 'standard';

    if (!priceId) {
      return res.status(500).json({ error: '価格設定が見つかりません' });
    }

    // Stripe Checkoutセッション作成
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_collection: 'if_required',
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: isGakkai ? 14 : 30,
        metadata: {
          user_id: String(userId),
          plan_type: planType,
        },
      },
      metadata: {
        user_id: String(userId),
        plan_type: planType,
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout session作成エラー:', err);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
});

// ========================================
// GET /api/payment/status/:userId
// サブスクリプション状態確認
// ========================================
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'inactive', planType: null });
    }

    const sub = result.rows[0];

    // トライアル中か確認
    const now = new Date();
    const isTrial = sub.trial_end && new Date(sub.trial_end) > now;
    const isActive = sub.status === 'active' || sub.status === 'trialing' || isTrial;

    res.json({
      status: sub.status,
      planType: sub.plan_type,
      isActive,
      isTrial,
      trialEnd: sub.trial_end,
      currentPeriodEnd: sub.current_period_end,
    });
  } catch (err) {
    console.error('ステータス取得エラー:', err);
    res.status(500).json({ error: 'ステータスの取得に失敗しました' });
  }
});

// ========================================
// POST /api/payment/webhook
// Stripeウェブフック（支払い完了・失敗など）
// ========================================
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook署名検証エラー:', err);
    return res.status(400).send('Webhook Error');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId   = session.metadata?.user_id;
        const planType = session.metadata?.plan_type || 'standard';

        if (!userId) break;

        // サブスクリプション詳細取得
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null;
        const periodEnd = new Date((subscription.current_period_end as number) * 1000);

        await pool.query(`
          INSERT INTO subscriptions
            (user_id, stripe_customer_id, stripe_subscription_id, plan_type, status, trial_end, current_period_end)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id) DO UPDATE SET
            stripe_customer_id     = EXCLUDED.stripe_customer_id,
            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
            plan_type              = EXCLUDED.plan_type,
            status                 = EXCLUDED.status,
            trial_end              = EXCLUDED.trial_end,
            current_period_end     = EXCLUDED.current_period_end,
            updated_at             = NOW()
        `, [
          userId,
          session.customer,
          subscriptionId,
          planType,
          subscription.status,
          trialEnd,
          periodEnd,
        ]);

        console.log(`✅ サブスクリプション登録完了: user_id=${userId}, plan=${planType}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null;
        const periodEnd = new Date((subscription.current_period_end as number) * 1000);

        await pool.query(`
          UPDATE subscriptions SET
            status             = $1,
            trial_end          = $2,
            current_period_end = $3,
            updated_at         = NOW()
          WHERE user_id = $4
        `, [subscription.status, trialEnd, periodEnd, userId]);

        console.log(`✅ サブスクリプション更新: user_id=${userId}, status=${subscription.status}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook処理エラー:', err);
    res.status(500).json({ error: 'Webhook処理に失敗しました' });
  }
});

// ========================================
// POST /api/payment/cancel
// サブスクリプションキャンセル
// ========================================
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const result = await pool.query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'サブスクリプションが見つかりません' });
    }

    const subscriptionId = result.rows[0].stripe_subscription_id;

    // 期間末でキャンセル（即時停止ではなく次回更新時に停止）
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await pool.query(
      `UPDATE subscriptions SET status = 'cancel_at_period_end', updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true, message: '次回更新日にキャンセルされます' });
  } catch (err) {
    console.error('キャンセルエラー:', err);
    res.status(500).json({ error: 'キャンセルに失敗しました' });
  }
});

export default router;
