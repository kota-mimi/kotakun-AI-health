// 運動・スポーツの包括的データベース（METs値付き）
export interface ExerciseData {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'daily' | 'water' | 'winter' | 'martial_arts' | 'dance';
  mets: number;
  keywords: string[];
  minDuration?: number; // 最小記録時間（分）
  description?: string;
}

export const EXERCISE_DATABASE: ExerciseData[] = [
  // 有酸素運動
  { id: 'running_light', name: 'ランニング（軽め）', category: 'cardio', mets: 6.0, keywords: ['ランニング', 'ジョギング', 'ランキング', 'らんにんぐ', 'じょぎんぐ'] },
  { id: 'running_moderate', name: 'ランニング（中程度）', category: 'cardio', mets: 8.3, keywords: ['ランニング', '中程度', '普通'] },
  { id: 'running_fast', name: 'ランニング（速い）', category: 'cardio', mets: 11.0, keywords: ['ランニング', 'ダッシュ', '全力', '速い'] },
  { id: 'walking_slow', name: 'ウォーキング（ゆっくり）', category: 'cardio', mets: 2.5, keywords: ['ウォーキング', '散歩', '歩く', 'うぉーきんぐ', 'さんぽ'] },
  { id: 'walking_moderate', name: 'ウォーキング（普通）', category: 'cardio', mets: 3.5, keywords: ['ウォーキング', '歩く'] },
  { id: 'walking_fast', name: 'ウォーキング（速歩）', category: 'cardio', mets: 4.5, keywords: ['速歩', '早歩き', 'ウォーキング'] },
  
  // サイクリング
  { id: 'cycling_leisure', name: 'サイクリング（レジャー）', category: 'cardio', mets: 4.0, keywords: ['サイクリング', '自転車', 'じてんしゃ', 'さいくりんぐ'] },
  { id: 'cycling_moderate', name: 'サイクリング（中程度）', category: 'cardio', mets: 6.8, keywords: ['サイクリング', '自転車'] },
  { id: 'cycling_fast', name: 'サイクリング（速い）', category: 'cardio', mets: 10.0, keywords: ['サイクリング', '自転車', '速い'] },
  
  // 水泳・水中運動
  { id: 'swimming_leisure', name: '水泳（レジャー）', category: 'water', mets: 6.0, keywords: ['水泳', 'プール', 'すいえい', 'ぷーる'] },
  { id: 'swimming_moderate', name: '水泳（中程度）', category: 'water', mets: 8.3, keywords: ['水泳', 'クロール'] },
  { id: 'swimming_fast', name: '水泳（速い）', category: 'water', mets: 11.0, keywords: ['水泳', '速い', '競泳'] },
  { id: 'water_aerobics', name: '水中エアロビクス', category: 'water', mets: 5.3, keywords: ['水中エアロ', 'アクアビクス'] },
  
  // 球技スポーツ
  { id: 'tennis_singles', name: 'テニス（シングルス）', category: 'sports', mets: 8.0, keywords: ['テニス', 'てにす'] },
  { id: 'tennis_doubles', name: 'テニス（ダブルス）', category: 'sports', mets: 6.0, keywords: ['テニス', 'ダブルス'] },
  { id: 'badminton_competitive', name: 'バドミントン（競技）', category: 'sports', mets: 7.0, keywords: ['バドミントン', 'ばどみんとん'] },
  { id: 'badminton_social', name: 'バドミントン（レジャー）', category: 'sports', mets: 5.5, keywords: ['バドミントン', 'レジャー'] },
  { id: 'table_tennis', name: '卓球', category: 'sports', mets: 4.0, keywords: ['卓球', '卓球', 'たっきゅう', 'ピンポン'] },
  { id: 'basketball_game', name: 'バスケットボール（試合）', category: 'sports', mets: 8.0, keywords: ['バスケ', 'バスケットボール', 'ばすけ'] },
  { id: 'basketball_shooting', name: 'バスケットボール（シューティング）', category: 'sports', mets: 4.5, keywords: ['バスケ', 'シューティング'] },
  { id: 'soccer_competitive', name: 'サッカー（試合）', category: 'sports', mets: 10.0, keywords: ['サッカー', 'フットボール', 'さっかー'] },
  { id: 'soccer_casual', name: 'サッカー（レジャー）', category: 'sports', mets: 7.0, keywords: ['サッカー', 'レジャー'] },
  { id: 'volleyball', name: 'バレーボール', category: 'sports', mets: 4.0, keywords: ['バレー', 'バレーボール', 'ばれー'] },
  { id: 'softball', name: 'ソフトボール', category: 'sports', mets: 5.0, keywords: ['ソフトボール', 'そふとぼーる'] },
  { id: 'baseball', name: '野球', category: 'sports', mets: 5.0, keywords: ['野球', 'やきゅう', 'ベースボール'] },
  
  // 筋力トレーニング
  { id: 'weight_training_light', name: '筋力トレーニング（軽め）', category: 'strength', mets: 3.0, keywords: ['筋トレ', 'きんとれ', 'ウェイト'] },
  { id: 'weight_training_moderate', name: '筋力トレーニング（中程度）', category: 'strength', mets: 5.0, keywords: ['筋トレ', 'ウェイトトレーニング'] },
  { id: 'weight_training_vigorous', name: '筋力トレーニング（激しい）', category: 'strength', mets: 6.0, keywords: ['筋トレ', '激しい'] },
  { id: 'bodyweight_training', name: '自重トレーニング', category: 'strength', mets: 3.8, keywords: ['自重', '腕立て', '腹筋', 'プッシュアップ'] },
  { id: 'push_ups', name: '腕立て伏せ', category: 'strength', mets: 3.8, keywords: ['腕立て', '腕立て伏せ', 'プッシュアップ', 'うでたて'] },
  { id: 'sit_ups', name: '腹筋運動', category: 'strength', mets: 3.8, keywords: ['腹筋', 'ふっきん', 'シットアップ'] },
  { id: 'squats', name: 'スクワット', category: 'strength', mets: 5.0, keywords: ['スクワット', 'すくわっと'] },
  { id: 'pull_ups', name: '懸垂', category: 'strength', mets: 4.3, keywords: ['懸垂', 'けんすい', 'プルアップ'] },
  
  // 胸筋トレーニング（詳細）
  { id: 'bench_press', name: 'ベンチプレス', category: 'strength', mets: 6.0, keywords: ['ベンチプレス', 'べんちぷれす'] },
  { id: 'dumbbell_press', name: 'ダンベルプレス', category: 'strength', mets: 6.0, keywords: ['ダンベルプレス', 'だんべるぷれす'] },
  { id: 'incline_bench_press', name: 'インクラインベンチプレス', category: 'strength', mets: 6.5, keywords: ['インクライン', 'いんくらいん'] },
  { id: 'chest_fly', name: 'チェストフライ', category: 'strength', mets: 5.0, keywords: ['フライ', 'ふらい', 'チェストフライ'] },
  { id: 'cable_crossover', name: 'ケーブルクロスオーバー', category: 'strength', mets: 5.0, keywords: ['ケーブルクロス', 'クロスオーバー', 'けーぶるくろす'] },
  
  // 柔軟性・ストレッチ
  { id: 'yoga_hatha', name: 'ヨガ（ハタヨガ）', category: 'flexibility', mets: 2.5, keywords: ['ヨガ', 'よが', 'ハタヨガ'] },
  { id: 'yoga_power', name: 'ヨガ（パワーヨガ）', category: 'flexibility', mets: 4.0, keywords: ['ヨガ', 'パワーヨガ'] },
  { id: 'pilates', name: 'ピラティス', category: 'flexibility', mets: 3.0, keywords: ['ピラティス', 'ぴらてぃす'] },
  { id: 'stretching', name: 'ストレッチ', category: 'flexibility', mets: 2.3, keywords: ['ストレッチ', 'すとれっち', '柔軟'] },
  { id: 'tai_chi', name: '太極拳', category: 'flexibility', mets: 3.0, keywords: ['太極拳', 'たいきょくけん'] },
  
  // 格闘技
  { id: 'karate', name: '空手', category: 'martial_arts', mets: 10.3, keywords: ['空手', 'からて', 'カラテ'] },
  { id: 'judo', name: '柔道', category: 'martial_arts', mets: 10.3, keywords: ['柔道', 'じゅうどう'] },
  { id: 'kendo', name: '剣道', category: 'martial_arts', mets: 10.3, keywords: ['剣道', 'けんどう'] },
  { id: 'boxing', name: 'ボクシング', category: 'martial_arts', mets: 12.8, keywords: ['ボクシング', 'ぼくしんぐ'] },
  { id: 'kickboxing', name: 'キックボクシング', category: 'martial_arts', mets: 10.3, keywords: ['キックボクシング', 'きっくぼくしんぐ'] },
  
  // ダンス
  { id: 'dance_ballroom', name: '社交ダンス', category: 'dance', mets: 3.0, keywords: ['社交ダンス', 'しゃこうだんす'] },
  { id: 'dance_modern', name: 'モダンダンス', category: 'dance', mets: 4.8, keywords: ['モダンダンス', 'もだんだんす'] },
  { id: 'dance_hip_hop', name: 'ヒップホップダンス', category: 'dance', mets: 5.0, keywords: ['ヒップホップ', 'ひっぷほっぷ', 'ダンス'] },
  { id: 'dance_aerobic', name: 'エアロビクスダンス', category: 'dance', mets: 6.8, keywords: ['エアロビクス', 'えあろびくす'] },
  
  // ウィンタースポーツ
  { id: 'skiing_downhill', name: 'スキー（ダウンヒル）', category: 'winter', mets: 6.0, keywords: ['スキー', 'すきー'] },
  { id: 'skiing_cross_country', name: 'スキー（クロスカントリー）', category: 'winter', mets: 9.0, keywords: ['スキー', 'クロスカントリー'] },
  { id: 'snowboarding', name: 'スノーボード', category: 'winter', mets: 5.3, keywords: ['スノーボード', 'すのーぼーど'] },
  { id: 'ice_skating', name: 'アイススケート', category: 'winter', mets: 7.0, keywords: ['スケート', 'すけーと', 'アイススケート'] },
  
  // 日常活動
  { id: 'housework_light', name: '軽い家事', category: 'daily', mets: 2.5, keywords: ['家事', 'かじ', '掃除', '洗濯'] },
  { id: 'housework_moderate', name: '重い家事', category: 'daily', mets: 3.8, keywords: ['家事', '重い', '掃除機'] },
  { id: 'gardening', name: 'ガーデニング', category: 'daily', mets: 4.0, keywords: ['ガーデニング', '庭仕事', '草むしり'] },
  { id: 'stairs_climbing', name: '階段昇降', category: 'daily', mets: 8.8, keywords: ['階段', 'かいだん', '昇降'] },
  
  // その他のスポーツ
  { id: 'golf_walking', name: 'ゴルフ（歩き）', category: 'sports', mets: 4.8, keywords: ['ゴルフ', 'ごるふ'] },
  { id: 'golf_cart', name: 'ゴルフ（カート使用）', category: 'sports', mets: 3.5, keywords: ['ゴルフ', 'カート'] },
  { id: 'bowling', name: 'ボウリング', category: 'sports', mets: 3.0, keywords: ['ボウリング', 'ぼうりんぐ'] },
  { id: 'rock_climbing', name: 'ロッククライミング', category: 'sports', mets: 11.0, keywords: ['クライミング', 'くらいみんぐ', 'ボルダリング'] },
  { id: 'hiking', name: 'ハイキング', category: 'cardio', mets: 6.0, keywords: ['ハイキング', 'はいきんぐ', '登山', 'とざん'] },
  { id: 'frisbee', name: 'フリスビー', category: 'sports', mets: 3.0, keywords: ['フリスビー', 'ふりすびー'] },
  { id: 'roller_skating', name: 'ローラースケート', category: 'sports', mets: 7.0, keywords: ['ローラースケート', 'ろーらーすけーと'] },
  
  // マリンスポーツ
  { id: 'surfing', name: 'サーフィン', category: 'water', mets: 3.0, keywords: ['サーフィン', 'さーふぃん', 'surf'] },
  { id: 'windsurfing', name: 'ウィンドサーフィン', category: 'water', mets: 4.5, keywords: ['ウィンドサーフィン', 'うぃんどさーふぃん'] },
  { id: 'kitesurfing', name: 'カイトサーフィン', category: 'water', mets: 6.0, keywords: ['カイトサーフィン', 'かいとさーふぃん'] },
  { id: 'jet_ski', name: 'ジェットスキー', category: 'water', mets: 4.0, keywords: ['ジェットスキー', 'じぇっとすきー', 'マリンジェット'] },
  { id: 'waterskiing', name: '水上スキー', category: 'water', mets: 6.0, keywords: ['水上スキー', 'すいじょうすきー'] },
  { id: 'wakeboarding', name: 'ウェイクボード', category: 'water', mets: 6.0, keywords: ['ウェイクボード', 'うぇいくぼーど'] },
  { id: 'sailing', name: 'ヨットセーリング', category: 'water', mets: 3.0, keywords: ['ヨット', 'セーリング', 'よっと', 'せーりんぐ'] },
  { id: 'kayaking', name: 'カヤック', category: 'water', mets: 5.0, keywords: ['カヤック', 'かやっく'] },
  { id: 'canoeing', name: 'カヌー', category: 'water', mets: 5.0, keywords: ['カヌー', 'かぬー'] },
  { id: 'stand_up_paddle', name: 'SUP（スタンドアップパドル）', category: 'water', mets: 4.0, keywords: ['SUP', 'サップ', 'スタンドアップパドル', 'すたんどあっぷぱどる'] },
  { id: 'diving_scuba', name: 'スキューバダイビング', category: 'water', mets: 7.0, keywords: ['ダイビング', 'スキューバ', 'だいびんぐ'] },
  { id: 'snorkeling', name: 'シュノーケリング', category: 'water', mets: 5.0, keywords: ['シュノーケル', 'しゅのーける'] }
];

// 運動名から適切なExerciseDataを検索する関数
export function findExerciseByName(name: string): ExerciseData | null {
  const searchName = name.toLowerCase().trim();
  
  // 完全一致を最優先
  const exactMatch = EXERCISE_DATABASE.find(exercise => 
    exercise.name.toLowerCase() === searchName ||
    exercise.keywords.some(keyword => keyword.toLowerCase() === searchName)
  );
  
  if (exactMatch) return exactMatch;
  
  // 部分一致検索
  const partialMatch = EXERCISE_DATABASE.find(exercise => 
    exercise.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchName) || 
      searchName.includes(keyword.toLowerCase())
    )
  );
  
  return partialMatch || null;
}

// カロリー計算関数（厚生労働省基準）
export function calculateCalories(
  exerciseData: ExerciseData,
  durationMinutes: number,
  bodyWeightKg: number = 60 // デフォルト体重
): number {
  // 厚生労働省基準：消費カロリー(kcal) = METs × 時間(h) × 体重(kg) × 1.05
  const durationHours = durationMinutes / 60;
  const calories = exerciseData.mets * durationHours * bodyWeightKg * 1.05;
  return Math.round(calories);
}

// 運動カテゴリーの日本語名
export const CATEGORY_NAMES = {
  cardio: '有酸素運動',
  strength: '筋力トレーニング',
  flexibility: '柔軟性・ストレッチ',
  sports: 'スポーツ・球技',
  daily: '日常活動',
  water: '水中運動',
  winter: 'ウィンタースポーツ',
  martial_arts: '格闘技',
  dance: 'ダンス'
};

// おすすめ運動の取得
export function getRecommendedExercises(limit: number = 20): ExerciseData[] {
  // 人気の高い運動を優先的に返す
  const popular = ['running_moderate', 'walking_moderate', 'cycling_moderate', 'swimming_leisure', 
                   'tennis_singles', 'weight_training_moderate', 'yoga_hatha', 'basketball_game'];
  
  const recommended = popular.map(id => EXERCISE_DATABASE.find(ex => ex.id === id)).filter(Boolean) as ExerciseData[];
  const remaining = EXERCISE_DATABASE.filter(ex => !popular.includes(ex.id)).slice(0, limit - recommended.length);
  
  return [...recommended, ...remaining].slice(0, limit);
}