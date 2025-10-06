/**
 * シンプルなメモリキャッシュ実装
 * Firebase API呼び出しを削減してコスト最適化
 */

interface CacheItem {
  data: any;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();
  
  /**
   * キャッシュからデータを取得
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (item && Date.now() < item.expires) {
      console.log(`🎯 Cache HIT: ${key}`);
      return item.data;
    }
    
    if (item) {
      console.log(`⏰ Cache EXPIRED: ${key}`);
      this.cache.delete(key);
    } else {
      console.log(`❌ Cache MISS: ${key}`);
    }
    
    return null;
  }
  
  /**
   * データをキャッシュに保存
   * @param key キャッシュキー
   * @param data 保存するデータ
   * @param ttlMs 有効期限（ミリ秒）デフォルト5分
   */
  set(key: string, data: any, ttlMs = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
    console.log(`💾 Cache SET: ${key} (TTL: ${ttlMs/1000}s)`);
  }
  
  /**
   * 特定のキーのキャッシュを削除
   */
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
  }
  
  /**
   * 全キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
    console.log(`🧹 Cache CLEAR ALL`);
  }
  
  /**
   * キャッシュの状態を確認
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
  
  /**
   * 期限切れのキャッシュを自動削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// グローバルキャッシュインスタンス
export const apiCache = new SimpleCache();

// 定期的なクリーンアップ（5分毎）
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * キャッシュキー生成ヘルパー
 */
export const createCacheKey = (...parts: (string | number | undefined)[]): string => {
  return parts.filter(Boolean).join('_');
};