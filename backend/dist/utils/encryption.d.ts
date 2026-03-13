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
/**
 * テキストを暗号化する
 * @param plainText 暗号化するテキスト
 * @returns 暗号化されたデータ (iv:tag:encryptedData の形式、Base64)
 */
export declare function encrypt(plainText: string): string;
/**
 * 暗号化されたテキストを復号する
 * @param encryptedData 暗号化されたデータ (encrypt()の戻り値)
 * @returns 復号されたテキスト
 */
export declare function decrypt(encryptedData: string): string;
/**
 * 暗号化されたデータかどうか判定する
 */
export declare function isEncrypted(data: string): boolean;
/**
 * 新しい暗号化キーを生成する（初回設定時に使用）
 * node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
 */
export declare function generateKey(): string;
