import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: "'Noto Sans JP', sans-serif",
      fontSize: '16px',
      lineHeight: '1.8',
      color: '#333',
    }}>
      <h1 style={{ fontSize: '24px', borderBottom: '2px solid #4a90d9', paddingBottom: '12px', marginBottom: '32px' }}>
        プライバシーポリシー
      </h1>

      <p style={{ marginBottom: '32px', color: '#555' }}>
        ロボスタディ株式会社（以下「当社」）は、ライフメモナビ（以下「本サービス」）における
        利用者の個人情報・プライバシーの保護を最重要事項として位置付けています。
        本ポリシーは、当社がどのようにお客様の情報を取り扱うかを明示するものです。
      </p>

      {/* Section 1 */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第1条　収集する情報
        </h2>
        <p>本サービスでは、以下の情報を収集します：</p>
        <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
          <li>お名前・メールアドレス等の登録情報</li>
          <li>人生の出来事・思い出・メモ等の入力内容</li>
          <li>サービス利用状況に関するログ情報</li>
        </ul>
      </section>

      {/* Section 2 - Most important */}
      <section style={{
        marginBottom: '36px',
        backgroundColor: '#f0f7ff',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #4a90d9',
      }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第2条　管理者によるデータアクセスについて（重要）
        </h2>
        <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>
          当社は、以下の原則を厳守します：
        </p>
        <ul style={{ paddingLeft: '24px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>閲覧禁止：</strong>
            サービス運営者・管理者は、利用者が入力した人生の出来事・メモ・思い出等の
            個人的な内容を閲覧しません。
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>暗号化保存：</strong>
            入力内容はシステム上で暗号化して保存されるため、
            技術的にも内容を容易に読み取ることができない仕組みにしています。
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>第三者提供禁止：</strong>
            利用者の個人情報・入力内容を、法令に基づく場合を除き、
            第三者に提供・開示しません。
          </li>
          <li>
            <strong>目的外利用禁止：</strong>
            収集した情報は、本サービスの提供・改善目的のみに使用します。
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第3条　情報の利用目的
        </h2>
        <p>収集した情報は以下の目的のみに使用します：</p>
        <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
          <li>本サービスの提供・運営</li>
          <li>サービスの品質向上・機能改善</li>
          <li>お問い合わせ対応</li>
          <li>システム障害対応・セキュリティ確保</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第4条　セキュリティ対策
        </h2>
        <p>
          当社は、利用者の情報を保護するため、以下のセキュリティ対策を実施しています：
        </p>
        <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
          <li>SSL/TLS による通信の暗号化</li>
          <li>個人的な記録内容のデータベース暗号化</li>
          <li>アクセス権限の厳格な管理</li>
          <li>定期的なセキュリティ点検</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第5条　利用者の権利
        </h2>
        <p>利用者は以下の権利を有します：</p>
        <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
          <li>自身のデータの確認・修正・削除の請求</li>
          <li>サービスの退会・データの完全削除の請求</li>
          <li>個人情報の利用停止の請求</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          これらの請求については、下記お問い合わせ先までご連絡ください。
        </p>
      </section>

      {/* Section 6 */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第6条　Cookie・ログについて
        </h2>
        <p>
          本サービスでは、ログイン状態の維持のためにセッション情報を使用します。
          これらはサービス提供に必要な最小限の情報のみを収集し、
          行動追跡・広告目的では使用しません。
        </p>
      </section>

      {/* Section 7 */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第7条　ポリシーの変更
        </h2>
        <p>
          本ポリシーを変更する場合は、本サービス上で事前に告知します。
          変更後もサービスを継続してご利用いただいた場合、
          変更後のポリシーに同意したものとみなします。
        </p>
      </section>

      {/* Section 8 */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', color: '#4a90d9', marginBottom: '12px' }}>
          第8条　お問い合わせ
        </h2>
        <p>プライバシーに関するご質問・ご不明点は以下までお問い合わせください：</p>
        <div style={{
          marginTop: '12px',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          border: '1px solid #ddd',
        }}>
          <p style={{ margin: '4px 0' }}><strong>ロボスタディ株式会社</strong></p>
          <p style={{ margin: '4px 0' }}>代表：福地三則</p>
          <p style={{ margin: '4px 0' }}>所在地：静岡県浜松市</p>
          <p style={{ margin: '4px 0' }}>メール:mitsunorif@robostudy.jp</p>
        </div>
      </section>

      <div style={{
        borderTop: '1px solid #ddd',
        paddingTop: '16px',
        textAlign: 'right',
        color: '#888',
        fontSize: '14px',
      }}>
        <p>制定日：2026年2月21日</p>
        <p>最終改定：{dateStr}</p>
        <p style={{ marginTop: '8px' }}>ロボスタディ株式会社　代表取締役　福地三則</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
