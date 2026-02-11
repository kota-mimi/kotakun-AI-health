// トライアル期限切れ状態に設定するスクリプト
const admin = require('firebase-admin');

// Firebase Admin SDK初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: "kotakun",
      client_email: "firebase-adminsdk-fbsvc@kotakun.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJQIvq4Vrd6jEv\nia9ATZEwja5OxYYGl4bUYwBWc00w65WQDG7nOHHVOesBuRckMc/pyP4I2GMZT+1o\ndhCdM3zUXIDnA9ftERvVH3o/zkiguqHqKWo0Oost5KLF5ToRQe6b4GHIrC6cM4tp\nz2sV+OlL7OmhPz4BYXkufbo6UEbhKqVM61+qs0V5vzMZqMIgVglEqkeF1gA6NhDf\nNvtyGge5DQjzbWBnAnn4yS4WHTmVMqW/bhHJq4wjx4NAvdiQXEvjIgV7paDdjW6H\nQi5UoxJfXCLjY0eAa/LfU095a8JiPTeQddQk25bnWF2Ce9XEegpVTjVNDBe9ePI7\noTAPkeHhAgMBAAECggEAC90DcnTW1aqKvDXmUAjShHVxn0CbCjPv9YChgjcZR4c3\noY5uEjC8WxinLwqRX+eUzT/1I6HX06Pnx4bgK1gf5WfPjG6oUZf2100b+HtpQhpG\nVaab1VjXH/0wkDBXSDGmBmfHc9wcgkYyk2nv8tNhs0FTs1bmSZAMo+4y5mGZkAfI\nA0plJw3SCo6QVYQomNodCvcWbvWaeVDIa/7mtf6Iwi1E84G4HrwptrotjI/Nf/M5\n4bhn4HGZ7CyuS+oJgEF5Hyl2kGlKl0CSPJFXnHhdybWU2OS8Fr3Gz3va5JB9TwwL\nbiFnZGsC7hvB/ycJuYOz2qGrz2KcqQXSlqW9+Ct+3QKBgQDnaDVfQ+MISf+T2Ssy\n6hM8rxqz6AgRyeyenyY1yR86O8bjZPYBEiEyLfpL0J1yiaBcyv6H20JZ0Fk6qqMK\nUprtaG33GjnVRruBgCJJAvFCTQtLByGxZTtjMvuH41dylSDm7ZIBcUZ1neBBzTLJ\n8tY79/jefKZOvlqG6C3RFbAKXQKBgQDeo+0OK/A466dgS2ADm0THC7yT3J8ixvHx\nj5RHXXQ3pjDqrYzRQu+6zZ1yttsjDfmjGJB/2jOQRaQG2D+no4YzvubEdASi6nPt\n2ND+sdSmu8PkkYUYb3SDVKEtQmTVKHNfax86gGYbsjjvCNw/FpxG8hCCfu3sq+x2\n26/lkSslVQKBgQC+moIjtsohALqIMD+5zz4LJPvspblH1beVq+cQNFoJYEVg9b7/\ngMxhBaf9nJajSiMRa46dnocXbVqhzP1AOmwsEnFJMIvkVT+K2lzjII5SGx2rLfOd\np5F0EwFFm4di9NzF+Xbiw0fTBzg5WuhzmRbHDGgr8iYWBAqSxlk+uAtpbQKBgA5Z\ngm3nZxREHAWY1hdlaolpuD3PenJDYFSxbF0tKNBtZbm6ddkG92yS1BMQtg8MV4qr\niqSy65/g3TGTvoaPg5bSNw1ybNoTQmWSE+ZWj94vO/D/cBSjGl9clQbVwKn8cXM0\n9E5Q+EPQuNqvN4LZcjkgYPAIPk2Cxzrh7fRd5uoBAoGAEuI2pcBkvBYHdDYPGulU\nrK62lWDmXm7EIk2+W7F9dJxbwCGcmZpnLb3IF19vN3NVdrQNcfFOTpejDWu8gmwE\nJj9Cqqsxv7DRMib4xMG6ijVL04HOxkucCfxc1NDx/LQ07hkoq7xBJQdtROwj9A7R\nUM3E7x6xIQDadupQwtrFs4Q=\n-----END PRIVATE KEY-----\n",
      client_id: "123456789012345678901"
    })
  });
}

async function setTrialExpired(userId) {
  try {
    console.log(`🔧 トライアル期限切れ状態に設定開始 - userId: ${userId}`);
    
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    
    // 現在のユーザー情報を確認
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.log('❌ ユーザーが見つかりません');
      return;
    }
    
    const currentData = userDoc.data();
    console.log('📊 現在の状態:', currentData);
    
    // 3日前の日付を計算（期限切れ状態）
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // トライアル期限切れ状態に更新
    await userRef.update({
      subscriptionStatus: 'trial', // トライアル状態のまま
      trialEndDate: threeDaysAgo, // 3日前に期限切れ
      hasUsedTrial: true,
      currentPlan: '月額プラン', // トライアルは月額プラン扱い
      updatedAt: new Date(),
    });
    
    console.log('✅ トライアル期限切れ状態に設定完了');
    console.log(`   - トライアル終了日: ${threeDaysAgo.toISOString()}`);
    console.log('   - ステータス: trial (期限切れ)');
    
    // 更新後の状態を確認
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();
    console.log('📊 更新後の状態:', updatedData);
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 使用方法: node set-trial-expired.js [USER_ID]
const userId = process.argv[2];
if (!userId) {
  console.log('❌ ユーザーIDを指定してください');
  console.log('使用方法: node set-trial-expired.js [USER_ID]');
  process.exit(1);
}

setTrialExpired(userId);