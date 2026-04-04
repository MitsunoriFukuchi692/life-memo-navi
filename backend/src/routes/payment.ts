import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

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
// メール送信設定（Nodemailer + Gmail）
// ========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || '',       // 送信元Gmailアドレス
    pass: process.env.GMAIL_APP_PASSWORD || '', // Googleアプリパスワード
  },
});

// ----------------------------------------
// メール送信ヘルパー関数
// ----------------------------------------
async function sendTrialWillEndEmail(
  toEmail: string,
  userName: string,
  planType: 'gakkai' | 'standard'
) {
  const isGakkai = planType === 'gakkai';
  const trialDays = isGakkai ? 14 : 30;
  const price = isGakkai ? '¥220' : '¥380';
  const planLabel = isGakkai ? '120学会会員プラン' : '通常プラン';

  const subject = `【ライフメモナビ】無料体験期間終了のお知らせ（3日後に課金が始まります）`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #FAF6F0;">
      <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 16px rgba(92,64,51,0.1);">
        <h1 style="font-size: 20px; color: #5C4033; margin-bottom: 8px;">ライフメモナビ</h1>
        <p style="color: #7A6A5A; font-size: 13px; margin-bottom: 32px;">人生の大切な記録を未来へ</p>

        <p style="color: #3A2A1A; font-size: 16px; margin-bottom: 24px;">
          ${userName} 様
        </p>

        <p style="color: #3A2A1A; line-height: 1.8; margin-bottom: 24px;">
          いつもライフメモナビをご利用いただきありがとうございます。<br>
          ${trialDays}日間の無料体験期間が、<strong>3日後に終了</strong>します。
        </p>

        <div style="background: #FFF8F0; border: 1px solid #E8C9A0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #5C4033; font-weight: bold; margin: 0 0 12px 0;">📋 ご契約プランの内容</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #7A6A5A; padding: 6px 0;">プラン</td>
              <td style="color: #3A2A1A; font-weight: bold; text-align: right;">${planLabel}</td>
            </tr>
            <tr>
              <td style="color: #7A6A5A; padding: 6px 0;">無料体験期間</td>
              <td style="color: #3A2A1A; font-weight: bold; text-align: right;">${trialDays}日間</td>
            </tr>
            <tr>
              <td style="color: #7A6A5A; padding: 6px 0;">体験終了後の月額料金</td>
              <td style="color: #C0392B; font-weight: bold; text-align: right; font-size: 18px;">${price}/月</td>
            </tr>
          </table>
        </div>

        <p style="color: #3A2A1A; line-height: 1.8; margin-bottom: 24px;">
          無料体験期間終了後は、自動的に月額${price}の課金が始まります。<br>
          引き続きすべての機能をお使いいただけます。
        </p>

        <div style="background: #F0F7FF; border: 1px solid #90CAF9; border-radius: 12px; padding: 16px; margin-bottom: 32px;">
          <p style="color: #1565C0; font-size: 13px; margin: 0;">
            ℹ️ 継続をご希望でない場合は、無料体験終了前にアプリ内の「設定 → サブスクリプション管理」からキャンセルしてください。
          </p>
        </div>

        <p style="color: #7A6A5A; font-size: 13px; line-height: 1.6;">
          ご不明な点がございましたら、お気軽にサポートまでお問い合わせください。<br>
          引き続きライフメモナビをよろしくお願いいたします。
        </p>

        <hr style="border: none; border-top: 1px solid #E8D8C8; margin: 32px 0;">
        <p style="color: #B0A090; font-size: 11px; text-align: center; margin: 0;">
          ライフメモナビ | このメールは自動送信です
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"ライフメモナビ" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });

  console.log(`✅ トライアル終了メール送信完了: ${toEmail} (${planLabel})`);
}

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

      // ----------------------------------------
      // 決済完了 → DBに保存
      // ----------------------------------------
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

      // ----------------------------------------
      // トライアル終了3日前 → メール送信
      // ----------------------------------------
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.user_id;
        const planType = (subscription.metadata?.plan_type || 'standard') as 'gakkai' | 'standard';

        if (!userId) break;

        // DBからユーザーのメールアドレスと名前を取得
        const userResult = await pool.query(
          'SELECT email, name FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length === 0) {
          console.error(`ユーザーが見つかりません: user_id=${userId}`);
          break;
        }

        const { email, name } = userResult.rows[0];

        // プランに応じたメールを送信
        await sendTrialWillEndEmail(email, name || 'お客様', planType);

        console.log(`✅ トライアル終了3日前メール送信: user_id=${userId}, plan=${planType}`);
        break;
      }

      // ----------------------------------------
      // サブスクリプション更新・削除 → DB更新
      // ----------------------------------------
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
