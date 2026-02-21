/**
 * encryption.ts
 * ライフメモナビ - 人生の出来事・メモ内容の暗号化/復号ユーティリティ
 * 
 * アルゴリズム: AES-256-GCM (認証付き暗号化)
 * 暗号化キー: 環境変数 ENCRYPTION_KEY (32バイトのランダム文字列)
 * 
 * 使い方:
 *   import { encrypt, decrypt } from './encryption';
 *   const encrypted = encrypt("保存したいテキスト");
 *   const original  = decrypt(encrypted);
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;    // 初期化ベクトルの長さ
const TAG_LENGTH = 16;   // 認証タグの長さ

/**
 * 環境変数から暗号化キーを取得
 * ENCRYPTION_KEY は32バイト(64文字のhex)で設定すること
 */
function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('環境変数 ENCRYPTION_KEY が設定されていません');
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY は64文字のhex文字列(32バイト)である必要があります');
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * テキストを暗号化する
 * @param plainText 暗号化するテキスト
 * @returns 暗号化されたデータ (iv:tag:encryptedData の形式、Base64)
 */
export function encrypt(plainText: string): string {
  if (!plainText) return plainText;
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  // iv:tag:encryptedData をBase64で結合して返す
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

/**
 * 暗号化されたテキストを復号する
 * @param encryptedData 暗号化されたデータ (encrypt()の戻り値)
 * @returns 復号されたテキスト
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  // 暗号化されていない古いデータはそのまま返す（移行期間対応）
  if (!encryptedData.includes(':')) return encryptedData;
  
  const key = getKey();
  const parts = encryptedData.split(':');
  if (parts.length !== 3) return encryptedData;
  
  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) .toString('utf8') + decipher.final('utf8');
}

/**
 * 暗号化されたデータかどうか判定する
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(':');
  return parts.length === 3;
}

/**
 * 新しい暗号化キーを生成する（初回設定時に使用）
 * node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
