import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    console.log('🔧 Firebase Admin初期化開始...');
    
    // 環境変数から認証情報を取得
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kotakun';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-kotakun@kotakun.iam.gserviceaccount.com';
    
    // Private Key をBase64デコードまたは直接使用
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && privateKey.startsWith('LS0t')) {
      // Base64エンコードされている場合はデコード
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    } else if (privateKey) {
      // 通常の文字列の場合は改行を変換
      privateKey = privateKey.replace(/\\n/g, '\n');
    } else {
      // フォールバック: 固定の認証情報
      privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDpjnpMRFWvlGl4
DLpLxUnSMoM6gfCWwsVwSdOjbymwsP8lO6LVv+FYAPbMg4pfwXUD7I4ndT7W+1a5
dwcWG81HGoDeohD3P2R8wX77gZrqto5GCqbZnifbCTJxnyj5VhyNt7pX6XMlHxlK
59fDdhosQyO6oBxsdjoJr3WuthLO6MSidMNkyebOH3hxTN9njAcQh2azn30OWdu4
5IWrRv6eMNPbb4rDin0JbBx1HVkMhysexZlnkc/Dag/O647SHdLkPum4vF1yqOPZ
Gt41uaUZziGlW/q7W1hbULGUFQ+LSjIpBtzBW1QDB66707Rl2BY5Oe9H1gzgX1Cg
jMWuQC2RAgMBAAECggEACRAicohxz0QJ8jLDPWq41j9nzHrLmlwRQ43X2LcY9e5u
XjRh2ZvOK6cw7Id7tILKLsZsjz8rWrYK29xQsfTO+s/+WXVORXvoIzeyfOG/AFXo
cDMcXaQ3nXYuRw6zLTbAWab8JApu8Y0zAu87dg4kjpxl2+l35OUTFDpi7Y5K7Uyz
y9SvLw3VXo3B8v8MyM/8qqiPa3NXFpcI5hZlnEWobtCw2CbE5sfZsaEWUgqqp8yX
o14acjwTobgucYP5vLjG8pg2LgFPkaED1NAkxLQjmD6b/YUWrvyQE4+AsYBESfQT
MQd2FllAoS+xRcscaLNN6kp/gFeeeID6Dp8lyZvpaQKBgQD+NgntdtW8e2T1GqBt
ugHPrVt7bda41+uH2Y6Rw42ifqThqBjMJqaqhzVBadGlv4XOar4iYDZNvelLa52c
L2l1lVvS7k1i+mpq7zeFVn6lyWVIjT4C9Px5WuoIuPVj8OOq/aXt7pznjOVv9e5W
o59dKwCw8uzlT6jPc460CbkkmQKBgQDrMzrUi+sWkROs7MAe5V5HYNVdnNtyvr4B
A5UmSGjYm+du5pv1QWygawIZtPC0s3F7gqRXueHIB0Ic45u8O3KNHHBHoOXuG1K4
5xJv2erNJSD9BKF23h1u9pQO91a0QCggjsGFO9PayESZzKorFLtMCjfnyii61haE
1w41mqRzuQKBgQCqBAw5tCuYplJMFyXKnQePFNtFPp3H/Ci7L8bJOCdm0RqHDTyg
dQ0sqcb1W8dp+iCMgBlvtjc7YVNBLNU5WwBGMsE53kUFeINpx1mzpLiJOpuxnT0n
DyA4LZSuhr0fvUEW4BN0gQyRVEsyySFA8qen0RXiQmYrq040iI2dXY9kqQKBgCmv
H6sRzS1nsuP/5aDUJ9xgpg/8P8xbT9NgLivlw2c4YlD+X/+cg8L+lBW4QrzT3LX2
FmhR0lkgKDB0imJW6ttlgeS/+GA1yXhpw5O9PGb1QJ53FqK5hN/opZ7taRlzEWmL
w3J4gviQa9ASPMp71yIH4Zab9pH+ZWlPr/4CFUlJAoGBANIXt6+wDQt4Cfu265fg
X5RJDKxcYGdbkH3p4F2xDvywcjMToBoA7pF7ESsDQX9orLFquwNlrXD2FqEBd3Rt
3JEq9xANiZohqlAeozINXi8bHJquIssGy1QatrMyBQd//2Zae4ktPwnrEaM+B1BS
a7aXDtGZFyBIKzVMDFfMTbB5
-----END PRIVATE KEY-----`;
    }
    
    console.log('🔍 環境変数確認:');
    console.log('  - projectId:', projectId);
    console.log('  - clientEmail:', clientEmail);
    console.log('  - privateKey:', privateKey ? `設定済み (${privateKey.length}文字)` : '未設定');
    
    // 正式な認証情報で初期化
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    
    console.log('✅ Firebase Admin初期化成功（認証情報あり）');
    
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    // フォールバック: 簡易設定（読み取り専用）
    try {
      initializeApp({
        projectId: 'kotakun',
      });
      console.log('⚠️ Firebase Admin初期化成功（簡易設定 - 読み取り専用）');
    } catch (fallbackError) {
      console.error('❌ フォールバック初期化も失敗:', fallbackError);
    }
  }
}

export const admin = {
  firestore: () => getFirestore(),
};