/**
 * 企業レベルのセキュア暗号化ユーティリティ
 * AES-GCM暗号化を使用してデータを保護
 */

// 暗号化キーをソルトと組み合わせて生成
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, // 高いイテレーション数でセキュリティ強化
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// データを暗号化
export async function encryptData(data: any, userId: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // ユニークなソルトとIVを生成
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // ユーザーIDとタイムスタンプを組み合わせた暗号化キー
    const password = `${userId}_${Date.now()}_health_share_secure`;
    const key = await deriveKey(password, salt);
    
    // データをJSON文字列に変換
    const jsonData = JSON.stringify(data);
    const encodedData = encoder.encode(jsonData);
    
    // AES-GCM暗号化
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );
    
    // ソルト、IV、暗号化データを結合
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // Base64エンコードして返す
    return btoa(String.fromCharCode(...combined));
    
  } catch (error) {
    console.error('暗号化エラー:', error);
    throw new Error('データの暗号化に失敗しました');
  }
}

// データを復号化
export async function decryptData(encryptedString: string, userId: string, timestamp: number): Promise<any> {
  try {
    const decoder = new TextDecoder();
    
    // Base64デコード
    const combined = new Uint8Array(
      Array.from(atob(encryptedString), char => char.charCodeAt(0))
    );
    
    // ソルト、IV、暗号化データを分離
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);
    
    // 同じ暗号化キーを再生成
    const password = `${userId}_${timestamp}_health_share_secure`;
    const key = await deriveKey(password, salt);
    
    // AES-GCM復号化
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );
    
    // JSON文字列をパース
    const jsonString = decoder.decode(decryptedData);
    return JSON.parse(jsonString);
    
  } catch (error) {
    console.error('復号化エラー:', error);
    throw new Error('データの復号化に失敗しました。無効なデータまたは期限切れです。');
  }
}

// ユーザーIDのハッシュ化（個人情報保護）
export async function hashUserId(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + '_health_app_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// セッションIDを生成
export function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}