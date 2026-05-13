import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ===== 設定 =====
GMAIL_USER = "mfukuchi6@gmail.com"
GMAIL_APP_PASSWORD = "hgmjbfmsqsjzsblj"
APP_URL = "https://memo.robostudy.jp"

# ===== 登録者リスト（テストアカウント・ご自身を除く）=====
users = [
    {"name": "片岡映子", "email": "kyokoktok@gmail.com"},
    {"name": "樋地仁巳", "email": "test010@gmail.com"},
    {"name": "齊木　英夫", "email": "hidechansaiki@gmail.com"},
    {"name": "杉　浩子", "email": "hirokosugi.0@gmail.com"},
    {"name": "虫生恕", "email": "arcsky2@gmail.com"},
    {"name": "樋地太郎", "email": "test01@gmail.com"},
    {"name": "中村英穂", "email": "nakamura01112@gmail.com"},
    {"name": "樋地道也", "email": "siab07fukuda@gmail.com"},
    {"name": "神島一成", "email": "kotajima@admin.com"},
    {"name": "齊木英夫", "email": "saikihideo@gmail.com"},
    {"name": "前田祐子", "email": "akiko.maeda2788@gmail.com"},
    {"name": "平野好央", "email": "48douzu@gmail.com"},
    {"name": "中村英穂", "email": "nakamura0120@gmail.com"},
    {"name": "白鳥午黒", "email": "tsts315@gmail.com"},
    {"name": "立石務本", "email": "tomohiko5753@gmail.com"},
    {"name": "立石務本", "email": "tomohiko-t@my.tokai.or.jp"},
    {"name": "岡田　秀彦", "email": "okadu-hidehiku@prof.kagoshima.lg.jp"},
    {"name": "田中", "email": "takahide1027@gmail.com"},
    {"name": "高山仲弘", "email": "h.takayama@gmail.com"},
    {"name": "笠井勇人", "email": "kachapo0421@gmail.com"},
    {"name": "前田浩", "email": "syuupannosusume@gmail.com"},
    {"name": "前田浩", "email": "info@avoide-bin.jp"},
    {"name": "武田圭司", "email": "takofive.keiji10913@gmail.com"},
    {"name": "三浦八郎", "email": "sanpu8301@gmail.com"},
    {"name": "菅野　ヒリユキ", "email": "sgn7sharry@gmail.com"},
    {"name": "点野ら天野", "email": "kidmitushin@gmail.com"},
    {"name": "鈴木克美", "email": "katsumi443@yahoo.co.jp"},
    {"name": "大場", "email": "ohb@datawisdos.jp"},
    {"name": "本住良夫", "email": "honjyo.hamanako@gmail.com"},
    {"name": "松田健", "email": "d-matsuda@hannan-u.ac.jp"},
    {"name": "鈴木德生", "email": "kasuzuki5@icloud.com"},
    {"name": "細川慎顕", "email": "gh.hosokawa.g@docomo.ne.jp"},
    {"name": "野口桃子", "email": "eeikohermes37@gmail.com"},
]

def make_html(name):
    return f"""
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #333;">

  <div style="background: linear-gradient(135deg, #2E75B6, #1a5a9e); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">📖 ライフメモナビ</h1>
    <p style="color: #cde; margin: 8px 0 0; font-size: 14px;">あなたの人生を、丁寧に記録する</p>
  </div>

  <div style="background: #fff; padding: 32px 28px; border: 1px solid #e0e0e0;">

    <p style="font-size: 16px;">{name} 様</p>

    <p>ライフメモナビをご登録いただき、ありがとうございます。</p>

    <p>実は、一部のお客様でログインや<strong>パスワードのリセットがうまくできない不具合</strong>が
    発生しておりました。大変ご不便をおかけして申し訳ございませんでした。</p>

    <p>先日修正が完了し、快適にお使いいただける状態になりました。<br>
    ぜひもう一度アプリを開いてみてください。</p>

    <div style="background: #f0f7ff; border-left: 4px solid #2E75B6; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 10px; font-weight: bold; color: #2E75B6;">✨ 新しく追加された機能</p>
      <ul style="margin: 0; padding-left: 20px; line-height: 2.2;">
        <li><strong>日記帳・自分史</strong>：AIが質問しながら、あなたの人生を一緒に記録します</li>
        <li><strong>年表</strong>：人生の出来事を時系列で整理できます</li>
        <li><strong>終活ノート</strong>：医療・介護の希望をAIが優しくお聞きします</li>
        <li><strong>営業日報メモ</strong>：訪問先・商談内容をスマートに記録できます</li>
        <li><strong>写真アルバム</strong>：思い出の写真を整理・保存できます</li>
        <li><strong>PDF出力</strong>：記録した内容をPDFで書き出せます</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{APP_URL}"
         style="background-color: #2E75B6; color: white; padding: 16px 40px;
                text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;
                display: inline-block;">
        ライフメモナビを開く →
      </a>
    </div>

    <p style="font-size: 13px; color: #888;">
      パスワードをお忘れの場合は、ログイン画面の「パスワードをお忘れの方」からリセットできます。<br>
      ご不明な点はお気軽にご返信ください。
    </p>

  </div>

  <div style="background: #f5f5f5; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999;">
      ライフメモナビ運営事務局　福地三則<br>
      <a href="mailto:lifememornavi.info@gmail.com" style="color: #2E75B6;">lifememornavi.info@gmail.com</a>
    </p>
  </div>

</div>
"""

def send_email(to_email, to_name):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "【ライフメモナビ】ご不便をおかけしていました＆機能追加のお知らせ"
    msg["From"] = f"ライフメモナビ <{GMAIL_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(make_html(to_name), "html", "utf-8"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())

# ===== テスト送信（自分宛）=====
import sys
if len(sys.argv) > 1 and sys.argv[1] == "--test":
    print("テスト送信中... mitsunorif@robostudy.jp")
    send_email("mitsunorif@robostudy.jp", "福地三則（テスト）")
    print("✅ テスト送信完了！メールを確認してください。")
    sys.exit(0)

# ===== 本番送信 =====
print(f"送信対象: {len(users)}名")
print("本当に送信しますか？ (yes と入力してEnter)")
if input().strip() != "yes":
    print("キャンセルしました。")
    sys.exit(0)

print("-" * 40)
success = 0
failed = 0

for user in users:
    try:
        send_email(user["email"], user["name"])
        print(f"✅ {user['name']} <{user['email']}>")
        success += 1
        time.sleep(2)
    except Exception as e:
        print(f"❌ {user['name']} <{user['email']}> → {e}")
        failed += 1

print("-" * 40)
print(f"完了: 成功 {success}件 / 失敗 {failed}件")
