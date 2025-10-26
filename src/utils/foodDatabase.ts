// 食品・食事の包括的データベース（100gあたりの栄養価）
export interface FoodData {
  id: string;
  name: string;
  category: 'grains' | 'meat' | 'fish' | 'dairy' | 'vegetables' | 'fruits' | 'sweets' | 'beverages' | 'prepared' | 'fast_food' | 'snacks' | 'seasonings' | 'nuts' | 'legumes';
  calories: number; // 100gあたりのカロリー
  protein: number;  // 100gあたりのタンパク質(g)
  fat: number;      // 100gあたりの脂質(g)
  carbs: number;    // 100gあたりの炭水化物(g)
  keywords: string[]; // 検索キーワード
  commonServing?: number; // 一般的な1人前のグラム数
  description?: string;
}

export const FOOD_DATABASE: FoodData[] = [
  // === 穀類・主食 ===
  { id: 'rice_white_cooked', name: 'ご飯（白米）', category: 'grains', calories: 156, protein: 2.5, fat: 0.3, carbs: 35.6, keywords: ['ご飯', '白米', 'めし', 'ごはん'], commonServing: 150 },
  { id: 'rice_brown_cooked', name: 'ご飯（玄米）', category: 'grains', calories: 152, protein: 2.8, fat: 1.0, carbs: 32.1, keywords: ['玄米', 'げんまい', '玄米ご飯'], commonServing: 150 },
  { id: 'bread_white', name: '食パン', category: 'grains', calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7, keywords: ['食パン', 'パン', 'しょくぱん'], commonServing: 60 },
  { id: 'bread_whole_wheat', name: '全粒粉パン', category: 'grains', calories: 247, protein: 13.2, fat: 4.2, carbs: 41.0, keywords: ['全粒粉', 'ぜんりゅうふん', '全粒粉パン'], commonServing: 60 },
  { id: 'pasta_cooked', name: 'パスタ（茹で）', category: 'grains', calories: 165, protein: 5.8, fat: 1.1, carbs: 32.0, keywords: ['パスタ', 'スパゲッティ', 'スパゲティ'], commonServing: 80 },
  { id: 'udon_cooked', name: 'うどん（茹で）', category: 'grains', calories: 105, protein: 2.6, fat: 0.4, carbs: 21.6, keywords: ['うどん', 'ウドン'], commonServing: 200 },
  { id: 'soba_cooked', name: 'そば（茹で）', category: 'grains', calories: 132, protein: 4.8, fat: 0.7, carbs: 26.0, keywords: ['そば', 'ソバ', '蕎麦'], commonServing: 170 },
  { id: 'ramen_noodles', name: 'ラーメン（麺のみ）', category: 'grains', calories: 281, protein: 9.7, fat: 1.5, carbs: 56.8, keywords: ['ラーメン', 'らーめん', '中華麺'], commonServing: 110 },

  // === 肉類 ===
  { id: 'chicken_breast', name: '鶏むね肉（皮なし）', category: 'meat', calories: 108, protein: 22.3, fat: 1.5, carbs: 0.0, keywords: ['鶏胸肉', '鶏むね肉', 'とりむね', 'チキン'], commonServing: 100 },
  { id: 'chicken_thigh', name: '鶏もも肉（皮なし）', category: 'meat', calories: 116, protein: 18.8, fat: 3.9, carbs: 0.0, keywords: ['鶏もも肉', 'とりもも', 'チキンもも'], commonServing: 100 },
  { id: 'chicken_thigh_skin', name: '鶏もも肉（皮付き）', category: 'meat', calories: 200, protein: 16.2, fat: 14.0, carbs: 0.0, keywords: ['鶏もも肉', '皮付き', 'とりもも'], commonServing: 100 },
  { id: 'pork_loin', name: '豚ロース', category: 'meat', calories: 263, protein: 19.3, fat: 19.2, carbs: 0.2, keywords: ['豚ロース', '豚肉', 'ぶたにく', 'ポーク'], commonServing: 100 },
  { id: 'pork_belly', name: '豚バラ肉', category: 'meat', calories: 386, protein: 14.2, fat: 34.6, carbs: 0.1, keywords: ['豚バラ', 'ぶたばら', '豚バラ肉'], commonServing: 100 },
  { id: 'beef_sirloin', name: '牛サーロイン', category: 'meat', calories: 334, protein: 17.4, fat: 27.9, carbs: 0.3, keywords: ['牛肉', '牛サーロイン', 'ぎゅうにく', 'ビーフ'], commonServing: 100 },
  { id: 'beef_round', name: '牛もも肉', category: 'meat', calories: 165, protein: 21.2, fat: 7.5, carbs: 0.5, keywords: ['牛もも', '牛もも肉', 'ぎゅうもも'], commonServing: 100 },
  { id: 'ground_beef', name: '牛ひき肉', category: 'meat', calories: 224, protein: 19.0, fat: 15.1, carbs: 0.3, keywords: ['牛ひき肉', 'ぎゅうひき', 'ひき肉'], commonServing: 80 },
  { id: 'ground_pork', name: '豚ひき肉', category: 'meat', calories: 221, protein: 18.6, fat: 15.1, carbs: 0.0, keywords: ['豚ひき肉', 'ぶたひき', 'ひき肉'], commonServing: 80 },
  { id: 'ham', name: 'ハム', category: 'meat', calories: 196, protein: 16.5, fat: 13.6, carbs: 1.3, keywords: ['ハム', 'はむ'], commonServing: 50 },
  { id: 'bacon', name: 'ベーコン', category: 'meat', calories: 405, protein: 12.9, fat: 39.1, carbs: 0.3, keywords: ['ベーコン', 'べーこん'], commonServing: 30 },
  { id: 'sausage', name: 'ソーセージ', category: 'meat', calories: 321, protein: 13.2, fat: 28.5, carbs: 3.0, keywords: ['ソーセージ', 'そーせーじ', 'ウインナー'], commonServing: 60 },

  // === 魚類・海鮮 ===
  { id: 'salmon', name: '鮭（生）', category: 'fish', calories: 133, protein: 22.3, fat: 4.1, carbs: 0.1, keywords: ['鮭', 'さけ', 'シャケ', 'サーモン'], commonServing: 80 },
  { id: 'tuna', name: 'まぐろ（赤身）', category: 'fish', calories: 125, protein: 26.4, fat: 1.4, carbs: 0.1, keywords: ['まぐろ', 'マグロ', '鮪', 'ツナ'], commonServing: 80 },
  { id: 'mackerel', name: 'さば', category: 'fish', calories: 202, protein: 20.7, fat: 12.1, carbs: 0.3, keywords: ['さば', 'サバ', '鯖'], commonServing: 80 },
  { id: 'sardine', name: 'いわし', category: 'fish', calories: 169, protein: 19.2, fat: 9.2, carbs: 0.2, keywords: ['いわし', 'イワシ', '鰯'], commonServing: 70 },
  { id: 'sea_bream', name: 'たい（鯛）', category: 'fish', calories: 142, protein: 20.6, fat: 5.8, carbs: 0.1, keywords: ['たい', 'タイ', '鯛'], commonServing: 80 },
  { id: 'yellowtail', name: 'ぶり', category: 'fish', calories: 257, protein: 21.4, fat: 17.6, carbs: 0.3, keywords: ['ぶり', 'ブリ', '鰤'], commonServing: 80 },
  { id: 'shrimp', name: 'えび', category: 'fish', calories: 91, protein: 18.4, fat: 0.6, carbs: 0.3, keywords: ['えび', 'エビ', '海老'], commonServing: 60 },
  { id: 'squid', name: 'いか', category: 'fish', calories: 88, protein: 18.1, fat: 1.2, carbs: 0.2, keywords: ['いか', 'イカ', '烏賊'], commonServing: 80 },
  { id: 'octopus', name: 'たこ', category: 'fish', calories: 76, protein: 16.4, fat: 0.7, carbs: 0.1, keywords: ['たこ', 'タコ', '蛸'], commonServing: 70 },
  { id: 'crab', name: 'かに', category: 'fish', calories: 90, protein: 18.3, fat: 0.5, carbs: 0.2, keywords: ['かに', 'カニ', '蟹'], commonServing: 60 },

  // === 乳製品・卵 ===
  { id: 'egg_whole', name: '鶏卵（全卵）', category: 'dairy', calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3, keywords: ['卵', 'たまご', '鶏卵'], commonServing: 50 },
  { id: 'egg_white', name: '卵白', category: 'dairy', calories: 47, protein: 10.5, fat: 0.0, carbs: 0.4, keywords: ['卵白', 'らんぱく'], commonServing: 30 },
  { id: 'egg_yolk', name: '卵黄', category: 'dairy', calories: 387, protein: 16.5, fat: 33.5, carbs: 0.1, keywords: ['卵黄', 'らんおう'], commonServing: 20 },
  { id: 'milk_whole', name: '牛乳（普通）', category: 'dairy', calories: 67, protein: 3.3, fat: 3.8, carbs: 4.8, keywords: ['牛乳', 'ぎゅうにゅう', 'ミルク'], commonServing: 200 },
  { id: 'milk_low_fat', name: '低脂肪牛乳', category: 'dairy', calories: 46, protein: 3.8, fat: 1.0, carbs: 5.5, keywords: ['低脂肪牛乳', '低脂肪', 'ていしぼう'], commonServing: 200 },
  { id: 'yogurt_plain', name: 'ヨーグルト（プレーン）', category: 'dairy', calories: 62, protein: 3.6, fat: 3.0, carbs: 4.9, keywords: ['ヨーグルト', 'よーぐると', 'プレーン'], commonServing: 100 },
  { id: 'cheese_process', name: 'プロセスチーズ', category: 'dairy', calories: 339, protein: 22.7, fat: 26.0, carbs: 1.3, keywords: ['チーズ', 'ちーず', 'プロセス'], commonServing: 20 },
  { id: 'cheese_cottage', name: 'カッテージチーズ', category: 'dairy', calories: 105, protein: 13.3, fat: 4.5, carbs: 1.9, keywords: ['カッテージ', 'かってーじ'], commonServing: 50 },
  { id: 'butter', name: 'バター', category: 'dairy', calories: 745, protein: 0.6, fat: 81.0, carbs: 0.2, keywords: ['バター', 'ばたー'], commonServing: 10 },

  // === 野菜類 ===
  { id: 'cabbage', name: 'キャベツ', category: 'vegetables', calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2, keywords: ['キャベツ', 'きゃべつ'], commonServing: 100 },
  { id: 'lettuce', name: 'レタス', category: 'vegetables', calories: 12, protein: 0.6, fat: 0.1, carbs: 2.8, keywords: ['レタス', 'れたす'], commonServing: 80 },
  { id: 'tomato', name: 'トマト', category: 'vegetables', calories: 19, protein: 0.7, fat: 0.1, carbs: 4.7, keywords: ['トマト', 'とまと'], commonServing: 150 },
  { id: 'cucumber', name: 'きゅうり', category: 'vegetables', calories: 14, protein: 1.0, fat: 0.1, carbs: 3.0, keywords: ['きゅうり', 'キュウリ', '胡瓜'], commonServing: 100 },
  { id: 'carrot', name: 'にんじん', category: 'vegetables', calories: 39, protein: 0.8, fat: 0.2, carbs: 9.3, keywords: ['にんじん', 'ニンジン', '人参'], commonServing: 100 },
  { id: 'onion', name: 'たまねぎ', category: 'vegetables', calories: 37, protein: 1.0, fat: 0.1, carbs: 8.8, keywords: ['たまねぎ', 'タマネギ', '玉ねぎ'], commonServing: 100 },
  { id: 'potato', name: 'じゃがいも', category: 'vegetables', calories: 76, protein: 1.6, fat: 0.1, carbs: 17.6, keywords: ['じゃがいも', 'ジャガイモ', 'ポテト'], commonServing: 100 },
  { id: 'sweet_potato', name: 'さつまいも', category: 'vegetables', calories: 132, protein: 1.2, fat: 0.2, carbs: 31.5, keywords: ['さつまいも', 'サツマイモ', '薩摩芋'], commonServing: 100 },
  { id: 'broccoli', name: 'ブロッコリー', category: 'vegetables', calories: 33, protein: 4.3, fat: 0.5, carbs: 5.2, keywords: ['ブロッコリー', 'ぶろっこりー'], commonServing: 100 },
  { id: 'spinach', name: 'ほうれん草', category: 'vegetables', calories: 20, protein: 2.2, fat: 0.4, carbs: 3.1, keywords: ['ほうれん草', 'ホウレンソウ', 'ほうれんそう'], commonServing: 80 },
  { id: 'chinese_cabbage', name: '白菜', category: 'vegetables', calories: 14, protein: 0.8, fat: 0.1, carbs: 3.2, keywords: ['白菜', 'はくさい', 'ハクサイ'], commonServing: 100 },
  { id: 'eggplant', name: 'なす', category: 'vegetables', calories: 22, protein: 1.1, fat: 0.1, carbs: 5.1, keywords: ['なす', 'ナス', '茄子'], commonServing: 80 },
  { id: 'bell_pepper', name: 'ピーマン', category: 'vegetables', calories: 22, protein: 0.9, fat: 0.2, carbs: 5.1, keywords: ['ピーマン', 'ぴーまん'], commonServing: 30 },
  { id: 'mushroom_shiitake', name: 'しいたけ', category: 'vegetables', calories: 18, protein: 3.0, fat: 0.4, carbs: 2.1, keywords: ['しいたけ', 'シイタケ', '椎茸'], commonServing: 20 },
  { id: 'bean_sprouts', name: 'もやし', category: 'vegetables', calories: 14, protein: 1.7, fat: 0.1, carbs: 2.6, keywords: ['もやし', 'モヤシ'], commonServing: 100 },

  // === 果物類 ===
  { id: 'apple', name: 'りんご', category: 'fruits', calories: 54, protein: 0.2, fat: 0.1, carbs: 14.6, keywords: ['りんご', 'リンゴ', '林檎', 'アップル'], commonServing: 200 },
  { id: 'banana', name: 'バナナ', category: 'fruits', calories: 86, protein: 1.1, fat: 0.2, carbs: 22.5, keywords: ['バナナ', 'ばなな'], commonServing: 100 },
  { id: 'orange', name: 'オレンジ', category: 'fruits', calories: 39, protein: 0.9, fat: 0.1, carbs: 10.4, keywords: ['オレンジ', 'おれんじ'], commonServing: 150 },
  { id: 'grape', name: 'ぶどう', category: 'fruits', calories: 59, protein: 0.4, fat: 0.2, carbs: 15.2, keywords: ['ぶどう', 'ブドウ', '葡萄'], commonServing: 100 },
  { id: 'strawberry', name: 'いちご', category: 'fruits', calories: 34, protein: 0.9, fat: 0.1, carbs: 8.5, keywords: ['いちご', 'イチゴ', '苺'], commonServing: 100 },
  { id: 'kiwi', name: 'キウイ', category: 'fruits', calories: 53, protein: 1.0, fat: 0.1, carbs: 13.5, keywords: ['キウイ', 'きうい'], commonServing: 100 },
  { id: 'watermelon', name: 'すいか', category: 'fruits', calories: 37, protein: 0.6, fat: 0.1, carbs: 9.5, keywords: ['すいか', 'スイカ', '西瓜'], commonServing: 200 },
  { id: 'melon', name: 'メロン', category: 'fruits', calories: 42, protein: 1.0, fat: 0.1, carbs: 10.3, keywords: ['メロン', 'めろん'], commonServing: 150 },
  { id: 'peach', name: 'もも', category: 'fruits', calories: 40, protein: 0.6, fat: 0.1, carbs: 10.2, keywords: ['もも', 'モモ', '桃'], commonServing: 150 },
  { id: 'pineapple', name: 'パイナップル', category: 'fruits', calories: 51, protein: 0.6, fat: 0.1, carbs: 13.4, keywords: ['パイナップル', 'ぱいなっぷる'], commonServing: 100 },

  // === 豆類・ナッツ ===
  { id: 'tofu_silken', name: '絹ごし豆腐', category: 'legumes', calories: 56, protein: 4.9, fat: 3.0, carbs: 1.7, keywords: ['豆腐', 'とうふ', '絹ごし'], commonServing: 100 },
  { id: 'tofu_firm', name: '木綿豆腐', category: 'legumes', calories: 72, protein: 6.6, fat: 4.2, carbs: 1.6, keywords: ['豆腐', 'とうふ', '木綿'], commonServing: 100 },
  { id: 'natto', name: '納豆', category: 'legumes', calories: 200, protein: 16.5, fat: 10.0, carbs: 12.1, keywords: ['納豆', 'なっとう', 'なっと'], commonServing: 50 },
  { id: 'edamame', name: '枝豆', category: 'legumes', calories: 135, protein: 11.7, fat: 6.2, carbs: 8.8, keywords: ['枝豆', 'えだまめ', 'エダマメ'], commonServing: 80 },
  { id: 'red_beans', name: 'あずき（ゆで）', category: 'legumes', calories: 143, protein: 8.9, fat: 0.5, carbs: 24.2, keywords: ['あずき', 'アズキ', '小豆'], commonServing: 50 },
  { id: 'almonds', name: 'アーモンド', category: 'nuts', calories: 598, protein: 18.6, fat: 54.2, carbs: 9.7, keywords: ['アーモンド', 'あーもんど'], commonServing: 20 },
  { id: 'walnuts', name: 'くるみ', category: 'nuts', calories: 674, protein: 14.6, fat: 68.8, carbs: 11.7, keywords: ['くるみ', 'クルミ', '胡桃'], commonServing: 20 },
  { id: 'peanuts', name: '落花生', category: 'nuts', calories: 562, protein: 25.4, fat: 47.5, carbs: 18.8, keywords: ['落花生', 'らっかせい', 'ピーナッツ'], commonServing: 20 },

  // === 調理済み料理 ===
  { id: 'karaage', name: '唐揚げ', category: 'prepared', calories: 290, protein: 16.6, fat: 21.1, carbs: 6.9, keywords: ['唐揚げ', 'から揚げ', 'からあげ', 'カラアゲ', 'からあげ'], commonServing: 80 },
  { id: 'tempura', name: '天ぷら', category: 'prepared', calories: 174, protein: 7.3, fat: 10.5, carbs: 11.2, keywords: ['天ぷら', 'てんぷら', 'テンプラ'], commonServing: 60 },
  { id: 'hamburger_patty', name: 'ハンバーグ', category: 'prepared', calories: 223, protein: 13.3, fat: 15.8, carbs: 7.5, keywords: ['ハンバーグ', 'はんばーぐ'], commonServing: 100 },
  { id: 'gyoza', name: '餃子', category: 'prepared', calories: 200, protein: 9.5, fat: 10.4, carbs: 19.1, keywords: ['餃子', 'ギョーザ', 'ぎょうざ', 'ギョウザ'], commonServing: 60 },
  { id: 'yakitori', name: '焼き鳥', category: 'prepared', calories: 199, protein: 18.1, fat: 12.2, carbs: 0.1, keywords: ['焼き鳥', 'やきとり', 'ヤキトリ'], commonServing: 60 },
  
  // ラーメン各種
  { id: 'ramen_tonkotsu', name: 'とんこつラーメン', category: 'prepared', calories: 500, protein: 15.4, fat: 25.8, carbs: 52.7, keywords: ['とんこつ', 'ラーメン', 'らーめん', 'トンコツ', '豚骨'], commonServing: 600 },
  { id: 'ramen_shoyu', name: '醤油ラーメン', category: 'prepared', calories: 416, protein: 14.8, fat: 8.2, carbs: 65.4, keywords: ['醤油ラーメン', 'しょうゆ', 'ラーメン', 'らーめん'], commonServing: 600 },
  { id: 'ramen_miso', name: '味噌ラーメン', category: 'prepared', calories: 560, protein: 16.2, fat: 18.5, carbs: 72.1, keywords: ['味噌ラーメン', 'みそ', 'ラーメン', 'らーめん'], commonServing: 600 },
  { id: 'ramen_shio', name: '塩ラーメン', category: 'prepared', calories: 387, protein: 13.9, fat: 7.1, carbs: 61.8, keywords: ['塩ラーメン', 'しお', 'ラーメン', 'らーめん'], commonServing: 600 },
  { id: 'ramen_tsukemen', name: 'つけ麺', category: 'prepared', calories: 531, protein: 18.7, fat: 12.4, carbs: 78.9, keywords: ['つけ麺', 'つけめん', 'ツケメン'], commonServing: 400 },
  
  // カレー各種
  { id: 'curry_rice', name: 'カレーライス', category: 'prepared', calories: 124, protein: 2.4, fat: 3.5, carbs: 20.2, keywords: ['カレー', 'カレーライス', 'かれー'], commonServing: 300 },
  { id: 'curry_chicken', name: 'チキンカレー', category: 'prepared', calories: 136, protein: 4.8, fat: 3.5, carbs: 20.5, keywords: ['チキンカレー', 'ちきんかれー', 'カレー'], commonServing: 300 },
  { id: 'curry_beef', name: 'ビーフカレー', category: 'prepared', calories: 143, protein: 3.2, fat: 4.9, carbs: 20.8, keywords: ['ビーフカレー', 'びーふかれー', 'カレー'], commonServing: 300 },
  { id: 'curry_pork', name: 'ポークカレー', category: 'prepared', calories: 141, protein: 3.1, fat: 4.7, carbs: 20.6, keywords: ['ポークカレー', 'ぽーくかれー', 'カレー'], commonServing: 300 },
  { id: 'curry_vegetable', name: '野菜カレー', category: 'prepared', calories: 118, protein: 2.1, fat: 2.8, carbs: 21.4, keywords: ['野菜カレー', 'やさいかれー', 'カレー'], commonServing: 300 },
  
  // 丼物
  { id: 'gyudon', name: '牛丼', category: 'prepared', calories: 131, protein: 4.0, fat: 4.4, carbs: 18.8, keywords: ['牛丼', 'ぎゅうどん', 'ギュウドン'], commonServing: 500 },
  { id: 'oyakodon', name: '親子丼', category: 'prepared', calories: 146, protein: 4.8, fat: 4.2, carbs: 21.0, keywords: ['親子丼', 'おやこどん', 'オヤコドン'], commonServing: 500 },
  { id: 'katsudon', name: 'カツ丼', category: 'prepared', calories: 178, protein: 5.9, fat: 5.6, carbs: 26.1, keywords: ['カツ丼', 'かつどん', 'カツドン'], commonServing: 500 },
  { id: 'tendon', name: '天丼', category: 'prepared', calories: 161, protein: 4.1, fat: 4.6, carbs: 24.8, keywords: ['天丼', 'てんどん', 'テンドン'], commonServing: 500 },
  { id: 'unadon', name: 'うな丼', category: 'prepared', calories: 293, protein: 11.7, fat: 10.8, carbs: 35.2, keywords: ['うな丼', 'うなどん', 'ウナドン', '鰻丼'], commonServing: 400 },
  { id: 'kaisendon', name: '海鮮丼', category: 'prepared', calories: 109, protein: 4.9, fat: 0.8, carbs: 19.3, keywords: ['海鮮丼', 'かいせんどん', 'カイセンドン'], commonServing: 500 },
  { id: 'butadon', name: '豚丼', category: 'prepared', calories: 137, protein: 4.2, fat: 4.8, carbs: 18.5, keywords: ['豚丼', 'ぶたどん', 'ブタドン'], commonServing: 500 },
  
  // チャーハン・炒飯
  { id: 'fried_rice', name: 'チャーハン', category: 'prepared', calories: 172, protein: 3.8, fat: 4.9, carbs: 27.2, keywords: ['チャーハン', 'ちゃーはん', '炒飯', 'いためし'], commonServing: 250 },
  { id: 'fried_rice_shrimp', name: 'エビチャーハン', category: 'prepared', calories: 176, protein: 4.5, fat: 5.1, carbs: 26.8, keywords: ['エビチャーハン', 'えびちゃーはん', 'エビ炒飯'], commonServing: 250 },
  { id: 'fried_rice_crab', name: 'カニチャーハン', category: 'prepared', calories: 174, protein: 4.3, fat: 4.9, carbs: 27.1, keywords: ['カニチャーハン', 'かにちゃーはん', 'カニ炒飯'], commonServing: 250 },
  { id: 'kimchi_fried_rice', name: 'キムチチャーハン', category: 'prepared', calories: 178, protein: 4.1, fat: 5.3, carbs: 26.9, keywords: ['キムチチャーハン', 'きむちちゃーはん'], commonServing: 250 },
  
  // オムライス
  { id: 'omelet_rice', name: 'オムライス', category: 'prepared', calories: 134, protein: 2.8, fat: 4.5, carbs: 20.0, keywords: ['オムライス', 'おむらいす', 'オムレツライス'], commonServing: 500 },
  { id: 'omelet_rice_chicken', name: 'チキンオムライス', category: 'prepared', calories: 142, protein: 3.5, fat: 4.8, carbs: 20.3, keywords: ['チキンオムライス', 'ちきんおむらいす'], commonServing: 500 },
  
  // 寿司各種
  { id: 'sushi_tuna', name: 'まぐろ寿司', category: 'prepared', calories: 156, protein: 10.5, fat: 0.6, carbs: 28.2, keywords: ['寿司', 'すし', 'まぐろ', 'マグロ'], commonServing: 20 },
  { id: 'sushi_salmon', name: 'サーモン寿司', category: 'prepared', calories: 161, protein: 9.8, fat: 1.4, carbs: 28.0, keywords: ['寿司', 'すし', 'サーモン', 'さーもん', '鮭'], commonServing: 20 },
  { id: 'sushi_shrimp', name: 'えび寿司', category: 'prepared', calories: 152, protein: 9.2, fat: 0.3, carbs: 28.4, keywords: ['寿司', 'すし', 'えび', 'エビ', '海老'], commonServing: 20 },
  { id: 'sushi_squid', name: 'いか寿司', category: 'prepared', calories: 151, protein: 9.1, fat: 0.5, carbs: 28.2, keywords: ['寿司', 'すし', 'いか', 'イカ'], commonServing: 20 },
  { id: 'chirashi_sushi', name: 'ちらし寿司', category: 'prepared', calories: 231, protein: 9.6, fat: 2.4, carbs: 42.8, keywords: ['ちらし寿司', 'ちらし', 'チラシ'], commonServing: 200 },
  
  // 定食系
  { id: 'grilled_fish_set', name: '焼き魚定食', category: 'prepared', calories: 89, protein: 7.2, fat: 2.1, carbs: 8.4, keywords: ['焼き魚定食', 'やきざかな', '定食'], commonServing: 400 },
  { id: 'karaage_set', name: '唐揚げ定食', category: 'prepared', calories: 156, protein: 6.8, fat: 7.2, carbs: 16.8, keywords: ['唐揚げ定食', 'からあげ定食', '定食'], commonServing: 400 },
  { id: 'tonkatsu_set', name: 'とんかつ定食', category: 'prepared', calories: 201, protein: 8.9, fat: 9.3, carbs: 21.2, keywords: ['とんかつ定食', 'トンカツ', '定食'], commonServing: 400 },
  { id: 'ginger_pork_set', name: '生姜焼き定食', category: 'prepared', calories: 178, protein: 7.1, fat: 8.7, carbs: 16.4, keywords: ['生姜焼き', 'しょうがやき', '定食'], commonServing: 400 },
  
  // 麺類（詳細）
  { id: 'yakisoba', name: '焼きそば', category: 'prepared', calories: 198, protein: 4.4, fat: 8.6, carbs: 25.8, keywords: ['焼きそば', 'やきそば', 'ヤキソバ'], commonServing: 300 },
  { id: 'yakiudon', name: '焼きうどん', category: 'prepared', calories: 198, protein: 4.3, fat: 8.7, carbs: 25.9, keywords: ['焼きうどん', 'やきうどん', 'ヤキウドン'], commonServing: 300 },
  { id: 'pasta_carbonara', name: 'カルボナーラ', category: 'prepared', calories: 195, protein: 5.5, fat: 11.2, carbs: 17.0, keywords: ['カルボナーラ', 'かるぼなーら'], commonServing: 400 },
  { id: 'pasta_napolitan', name: 'ナポリタン', category: 'prepared', calories: 143, protein: 4.1, fat: 4.1, carbs: 20.9, keywords: ['ナポリタン', 'なぽりたん'], commonServing: 400 },
  { id: 'pasta_arrabiata', name: 'アラビアータ', category: 'prepared', calories: 137, protein: 4.2, fat: 3.5, carbs: 22.1, keywords: ['アラビアータ', 'あらびあーた'], commonServing: 400 },
  { id: 'pasta_peperoncino', name: 'ペペロンチーノ', category: 'prepared', calories: 127, protein: 3.3, fat: 4.9, carbs: 16.7, keywords: ['ペペロンチーノ', 'ぺぺろんちーの'], commonServing: 400 },
  { id: 'pasta_meat_sauce', name: 'ミートソース', category: 'prepared', calories: 148, protein: 4.8, fat: 4.2, carbs: 20.3, keywords: ['ミートソース', 'みーとそーす'], commonServing: 400 },
  
  // 中華料理
  { id: 'mapo_tofu', name: '麻婆豆腐', category: 'prepared', calories: 195, protein: 14.6, fat: 12.3, carbs: 6.8, keywords: ['麻婆豆腐', 'まーぼーどうふ', 'マーボー'], commonServing: 200 },
  { id: 'sweet_sour_pork', name: '酢豚', category: 'prepared', calories: 274, protein: 11.8, fat: 16.8, carbs: 20.3, keywords: ['酢豚', 'すぶた', 'スブタ'], commonServing: 200 },
  { id: 'ebi_chili', name: 'エビチリ', category: 'prepared', calories: 210, protein: 12.5, fat: 11.2, carbs: 14.2, keywords: ['エビチリ', 'えびちり'], commonServing: 150 },
  { id: 'spring_roll', name: '春巻き', category: 'prepared', calories: 124, protein: 4.6, fat: 6.2, carbs: 12.8, keywords: ['春巻き', 'はるまき', 'ハルマキ'], commonServing: 80 },
  { id: 'xiaolongbao', name: '小籠包', category: 'prepared', calories: 167, protein: 7.2, fat: 7.8, carbs: 16.9, keywords: ['小籠包', 'しょうろんぽう', 'ショウロンポウ'], commonServing: 100 },
  { id: 'dan_dan_noodles', name: '担々麺', category: 'prepared', calories: 224, protein: 6.8, fat: 12.4, carbs: 21.8, keywords: ['担々麺', 'たんたんめん', 'タンタンメン'], commonServing: 500 },
  
  // 和食・煮物
  { id: 'nikujaga', name: '肉じゃが', category: 'prepared', calories: 176, protein: 9.8, fat: 6.8, carbs: 19.2, keywords: ['肉じゃが', 'にくじゃが', 'ニクジャガ'], commonServing: 200 },
  { id: 'chikuzenni', name: '筑前煮', category: 'prepared', calories: 96, protein: 6.8, fat: 3.2, carbs: 10.4, keywords: ['筑前煮', 'ちくぜんに'], commonServing: 150 },
  { id: 'hijiki_nimono', name: 'ひじきの煮物', category: 'prepared', calories: 84, protein: 3.2, fat: 2.8, carbs: 12.4, keywords: ['ひじき', 'ヒジキ', '煮物'], commonServing: 80 },
  { id: 'kinpira_gobo', name: 'きんぴらごぼう', category: 'prepared', calories: 94, protein: 2.1, fat: 3.8, carbs: 13.6, keywords: ['きんぴら', 'キンピラ', 'ごぼう'], commonServing: 80 },
  { id: 'kabocha_nimono', name: 'かぼちゃの煮物', category: 'prepared', calories: 93, protein: 1.9, fat: 0.3, carbs: 20.6, keywords: ['かぼちゃ', 'カボチャ', '煮物'], commonServing: 100 },
  { id: 'tamagoyaki', name: '卵焼き', category: 'prepared', calories: 128, protein: 8.8, fat: 8.8, carbs: 2.6, keywords: ['卵焼き', 'たまごやき', 'タマゴヤキ'], commonServing: 60 },
  { id: 'chawanmushi', name: '茶碗蒸し', category: 'prepared', calories: 79, protein: 6.4, fat: 4.1, carbs: 4.2, keywords: ['茶碗蒸し', 'ちゃわんむし'], commonServing: 120 },
  
  // 揚げ物各種
  { id: 'tonkatsu', name: 'とんかつ', category: 'prepared', calories: 344, protein: 22.3, fat: 23.4, carbs: 10.8, keywords: ['とんかつ', 'トンカツ', '豚カツ'], commonServing: 120 },
  { id: 'chicken_katsu', name: 'チキンカツ', category: 'prepared', calories: 344, protein: 22.3, fat: 23.4, carbs: 10.8, keywords: ['チキンカツ', 'ちきんかつ'], commonServing: 120 },
  { id: 'ebi_fry', name: 'エビフライ', category: 'prepared', calories: 210, protein: 12.5, fat: 11.2, carbs: 14.2, keywords: ['エビフライ', 'えびふらい', '海老フライ'], commonServing: 60 },
  { id: 'croquette', name: 'コロッケ', category: 'prepared', calories: 164, protein: 3.8, fat: 9.8, carbs: 15.8, keywords: ['コロッケ', 'ころっけ'], commonServing: 80 },
  { id: 'menchi_katsu', name: 'メンチカツ', category: 'prepared', calories: 273, protein: 10.4, fat: 19.8, carbs: 12.8, keywords: ['メンチカツ', 'めんちかつ'], commonServing: 100 },
  { id: 'agedashi_tofu', name: '揚げ出し豆腐', category: 'prepared', calories: 98, protein: 4.8, fat: 6.2, carbs: 6.4, keywords: ['揚げ出し豆腐', 'あげだし', 'アゲダシ'], commonServing: 150 },
  
  // スープ・汁物
  { id: 'miso_soup', name: '味噌汁', category: 'prepared', calories: 34, protein: 2.2, fat: 1.2, carbs: 3.8, keywords: ['味噌汁', 'みそしる', 'ミソシル', 'お味噌汁'], commonServing: 150 },
  { id: 'clear_soup', name: 'すまし汁', category: 'prepared', calories: 8, protein: 1.4, fat: 0.0, carbs: 0.8, keywords: ['すまし汁', 'すましじる', 'お吸い物'], commonServing: 150 },
  { id: 'wakame_soup', name: 'わかめスープ', category: 'prepared', calories: 11, protein: 0.7, fat: 0.1, carbs: 2.0, keywords: ['わかめ', 'ワカメ', 'スープ'], commonServing: 150 },
  { id: 'corn_soup', name: 'コーンスープ', category: 'prepared', calories: 87, protein: 1.8, fat: 4.1, carbs: 11.2, keywords: ['コーンスープ', 'こーんすーぷ'], commonServing: 150 },
  { id: 'onion_soup', name: 'オニオンスープ', category: 'prepared', calories: 37, protein: 1.4, fat: 1.2, carbs: 5.1, keywords: ['オニオンスープ', 'おにおんすーぷ'], commonServing: 150 },
  { id: 'tomato_soup', name: 'トマトスープ', category: 'prepared', calories: 42, protein: 1.1, fat: 1.8, carbs: 5.8, keywords: ['トマトスープ', 'とまとすーぷ'], commonServing: 150 },
  
  // おつまみ・居酒屋メニュー
  { id: 'edamame_boiled', name: '茹で枝豆', category: 'prepared', calories: 135, protein: 11.7, fat: 6.2, carbs: 8.8, keywords: ['枝豆', 'えだまめ', 'エダマメ'], commonServing: 80 },
  { id: 'hiyayakko', name: '冷奴', category: 'prepared', calories: 56, protein: 4.9, fat: 3.0, carbs: 1.6, keywords: ['冷奴', 'ひややっこ', 'ヒヤヤッコ'], commonServing: 150 },
  { id: 'oden', name: 'おでん', category: 'prepared', calories: 13, protein: 1.1, fat: 0.1, carbs: 2.5, keywords: ['おでん', 'オデン'], commonServing: 200 },
  { id: 'chicken_nanban', name: 'チキン南蛮', category: 'prepared', calories: 278, protein: 15.8, fat: 19.2, carbs: 11.4, keywords: ['チキン南蛮', 'ちきんなんばん'], commonServing: 150 },
  { id: 'tako_wasabi', name: 'たこわさび', category: 'prepared', calories: 76, protein: 16.4, fat: 0.7, carbs: 0.1, keywords: ['たこわさび', 'タコワサビ'], commonServing: 50 },
  
  // パン・サンドイッチ類
  { id: 'sandwich_ham', name: 'ハムサンド', category: 'prepared', calories: 177, protein: 7.4, fat: 6.7, carbs: 22.3, keywords: ['サンドイッチ', 'さんどいっち', 'ハムサンド', 'サンド'], commonServing: 150 },
  { id: 'sandwich_tuna', name: 'ツナサンド', category: 'prepared', calories: 189, protein: 8.2, fat: 7.9, carbs: 21.8, keywords: ['ツナサンド', 'つなさんど', 'サンドイッチ'], commonServing: 150 },
  { id: 'sandwich_egg', name: 'たまごサンド', category: 'prepared', calories: 201, protein: 8.9, fat: 9.2, carbs: 20.4, keywords: ['たまごサンド', 'タマゴサンド', '卵サンド'], commonServing: 150 },
  { id: 'sandwich_katsu', name: 'カツサンド', category: 'prepared', calories: 298, protein: 12.8, fat: 15.4, carbs: 28.9, keywords: ['カツサンド', 'かつさんど'], commonServing: 200 },
  { id: 'hot_dog', name: 'ホットドッグ', category: 'prepared', calories: 290, protein: 10.4, fat: 18.0, carbs: 24.0, keywords: ['ホットドッグ', 'ほっとどっぐ'], commonServing: 100 },
  { id: 'croissant_plain', name: 'クロワッサン', category: 'grains', calories: 448, protein: 7.9, fat: 26.8, carbs: 43.9, keywords: ['クロワッサン', 'くろわっさん'], commonServing: 40 },
  { id: 'melon_pan', name: 'メロンパン', category: 'grains', calories: 350, protein: 6.8, fat: 13.1, carbs: 52.2, keywords: ['メロンパン', 'めろんぱん'], commonServing: 100 },
  { id: 'anpan', name: 'あんぱん', category: 'grains', calories: 266, protein: 7.4, fat: 4.2, carbs: 50.8, keywords: ['あんぱん', 'アンパン', 'あんパン'], commonServing: 80 },
  { id: 'curry_pan', name: 'カレーパン', category: 'grains', calories: 321, protein: 8.1, fat: 15.2, carbs: 37.8, keywords: ['カレーパン', 'かれーぱん'], commonServing: 120 },
  
  // おにぎり各種
  { id: 'onigiri_salmon', name: '鮭おにぎり', category: 'prepared', calories: 179, protein: 6.0, fat: 2.0, carbs: 35.0, keywords: ['おにぎり', 'オニギリ', '鮭', 'さけ'], commonServing: 110 },
  { id: 'onigiri_tuna', name: 'ツナおにぎり', category: 'prepared', calories: 185, protein: 7.2, fat: 3.8, carbs: 32.1, keywords: ['おにぎり', 'オニギリ', 'ツナ', 'つな'], commonServing: 110 },
  { id: 'onigiri_umeboshi', name: '梅おにぎり', category: 'prepared', calories: 171, protein: 2.8, fat: 0.4, carbs: 38.7, keywords: ['おにぎり', 'オニギリ', '梅', 'うめ'], commonServing: 110 },
  { id: 'onigiri_konbu', name: '昆布おにぎり', category: 'prepared', calories: 168, protein: 3.2, fat: 0.3, carbs: 38.1, keywords: ['おにぎり', 'オニギリ', '昆布', 'こんぶ'], commonServing: 110 },
  { id: 'onigiri_okaka', name: 'おかかおにぎり', category: 'prepared', calories: 174, protein: 4.1, fat: 0.8, carbs: 36.9, keywords: ['おにぎり', 'オニギリ', 'おかか', 'オカカ'], commonServing: 110 },
  
  // 弁当類
  { id: 'bento_karaage', name: '唐揚げ弁当', category: 'prepared', calories: 156, protein: 6.8, fat: 7.2, carbs: 16.8, keywords: ['弁当', 'べんとう', '唐揚げ', 'からあげ'], commonServing: 400 },
  { id: 'bento_tonkatsu', name: 'とんかつ弁当', category: 'prepared', calories: 201, protein: 8.9, fat: 9.3, carbs: 21.2, keywords: ['弁当', 'べんとう', 'とんかつ', 'トンカツ'], commonServing: 400 },
  { id: 'bento_yakitori', name: '焼き鳥弁当', category: 'prepared', calories: 142, protein: 7.8, fat: 5.1, carbs: 17.2, keywords: ['弁当', 'べんとう', '焼き鳥', 'やきとり'], commonServing: 400 },
  { id: 'bento_hamburg', name: 'ハンバーグ弁当', category: 'prepared', calories: 167, protein: 6.9, fat: 7.8, carbs: 18.4, keywords: ['弁当', 'べんとう', 'ハンバーグ'], commonServing: 400 },
  { id: 'bento_nori', name: 'のり弁当', category: 'prepared', calories: 134, protein: 4.2, fat: 3.8, carbs: 21.8, keywords: ['弁当', 'べんとう', 'のり弁', 'ノリ弁'], commonServing: 400 },
  
  // 鍋料理
  { id: 'nabe_shabu', name: 'しゃぶしゃぶ', category: 'prepared', calories: 89, protein: 8.9, fat: 4.2, carbs: 2.1, keywords: ['鍋', 'なべ', 'しゃぶしゃぶ', 'シャブシャブ'], commonServing: 300 },
  { id: 'nabe_sukiyaki', name: 'すき焼き', category: 'prepared', calories: 156, protein: 9.8, fat: 8.9, carbs: 8.4, keywords: ['鍋', 'なべ', 'すき焼き', 'スキヤキ'], commonServing: 300 },
  { id: 'nabe_kimchi', name: 'キムチ鍋', category: 'prepared', calories: 67, protein: 4.8, fat: 2.9, carbs: 6.2, keywords: ['鍋', 'なべ', 'キムチ', 'きむち'], commonServing: 300 },
  { id: 'nabe_yosenabe', name: '寄せ鍋', category: 'prepared', calories: 54, protein: 4.2, fat: 2.1, carbs: 4.8, keywords: ['鍋', 'なべ', '寄せ鍋', 'よせなべ'], commonServing: 300 },
  { id: 'nabe_chanko', name: 'ちゃんこ鍋', category: 'prepared', calories: 78, protein: 6.4, fat: 3.2, carbs: 5.9, keywords: ['鍋', 'なべ', 'ちゃんこ', 'チャンコ'], commonServing: 300 },
  
  // お好み焼き・たこ焼き
  { id: 'okonomiyaki', name: 'お好み焼き', category: 'prepared', calories: 545, protein: 17.0, fat: 30.8, carbs: 50.1, keywords: ['お好み焼き', 'おこのみやき', 'オコノミヤキ'], commonServing: 200 },
  { id: 'takoyaki', name: 'たこ焼き', category: 'prepared', calories: 417, protein: 12.3, fat: 20.5, carbs: 46.8, keywords: ['たこ焼き', 'たこやき', 'タコヤキ'], commonServing: 120 },
  { id: 'monjayaki', name: 'もんじゃ焼き', category: 'prepared', calories: 89, protein: 3.2, fat: 2.1, carbs: 14.8, keywords: ['もんじゃ', 'モンジャ', 'もんじゃ焼き'], commonServing: 300 },
  
  // デザート・スイーツ拡張
  { id: 'donut', name: 'ドーナツ', category: 'sweets', calories: 375, protein: 6.1, fat: 20.5, carbs: 42.2, keywords: ['ドーナツ', 'どーなつ'], commonServing: 60 },
  { id: 'pancake', name: 'パンケーキ', category: 'sweets', calories: 227, protein: 6.2, fat: 7.8, carbs: 34.2, keywords: ['パンケーキ', 'ぱんけーき', 'ホットケーキ'], commonServing: 120 },
  { id: 'waffle', name: 'ワッフル', category: 'sweets', calories: 291, protein: 7.0, fat: 9.1, carbs: 48.7, keywords: ['ワッフル', 'わっふる'], commonServing: 80 },
  { id: 'crepe', name: 'クレープ', category: 'sweets', calories: 196, protein: 4.2, fat: 4.8, carbs: 35.2, keywords: ['クレープ', 'くれーぷ'], commonServing: 100 },
  { id: 'parfait', name: 'パフェ', category: 'sweets', calories: 168, protein: 3.8, fat: 7.2, carbs: 23.4, keywords: ['パフェ', 'ぱふぇ'], commonServing: 150 },
  { id: 'pudding', name: 'プリン', category: 'sweets', calories: 126, protein: 4.3, fat: 4.9, carbs: 16.8, keywords: ['プリン', 'ぷりん'], commonServing: 90 },
  { id: 'jelly', name: 'ゼリー', category: 'sweets', calories: 70, protein: 1.6, fat: 0.0, carbs: 17.8, keywords: ['ゼリー', 'ぜりー', 'ジェリー'], commonServing: 100 },
  { id: 'mochi', name: 'もち', category: 'sweets', calories: 235, protein: 4.0, fat: 0.6, carbs: 50.8, keywords: ['もち', 'モチ', '餅'], commonServing: 50 },
  { id: 'dango', name: 'だんご', category: 'sweets', calories: 201, protein: 3.2, fat: 0.4, carbs: 44.9, keywords: ['だんご', 'ダンゴ', '団子'], commonServing: 60 },
  { id: 'taiyaki', name: 'たい焼き', category: 'sweets', calories: 188, protein: 4.2, fat: 2.1, carbs: 38.7, keywords: ['たい焼き', 'たいやき', 'タイヤキ'], commonServing: 80 },
  
  // スナック・おつまみ拡張
  { id: 'nuts_mixed', name: 'ミックスナッツ', category: 'snacks', calories: 585, protein: 19.3, fat: 51.8, carbs: 15.2, keywords: ['ナッツ', 'なっつ', 'ミックス'], commonServing: 30 },
  { id: 'dried_squid', name: 'さきいか', category: 'snacks', calories: 334, protein: 45.5, fat: 2.8, carbs: 29.5, keywords: ['さきいか', 'サキイカ'], commonServing: 20 },
  { id: 'jerky', name: 'ビーフジャーキー', category: 'snacks', calories: 315, protein: 54.8, fat: 7.8, carbs: 6.4, keywords: ['ジャーキー', 'じゃーきー'], commonServing: 20 },
  { id: 'pretz', name: 'プリッツ', category: 'snacks', calories: 486, protein: 9.8, fat: 20.1, carbs: 68.2, keywords: ['プリッツ', 'ぷりっつ'], commonServing: 30 },
  { id: 'pocky', name: 'ポッキー', category: 'snacks', calories: 512, protein: 5.9, fat: 26.8, carbs: 62.1, keywords: ['ポッキー', 'ぽっきー'], commonServing: 30 },
  
  // 韓国料理
  { id: 'kimchi', name: 'キムチ', category: 'vegetables', calories: 46, protein: 2.8, fat: 0.5, carbs: 7.9, keywords: ['キムチ', 'きむち'], commonServing: 50 },
  { id: 'bibimbap', name: 'ビビンバ', category: 'prepared', calories: 121, protein: 4.2, fat: 3.8, carbs: 17.9, keywords: ['ビビンバ', 'びびんば'], commonServing: 400 },
  { id: 'bulgogi', name: 'プルコギ', category: 'prepared', calories: 189, protein: 12.8, fat: 11.2, carbs: 8.4, keywords: ['プルコギ', 'ぷるこぎ'], commonServing: 150 },
  { id: 'korean_bbq', name: '焼肉', category: 'prepared', calories: 334, protein: 17.4, fat: 27.9, carbs: 0.3, keywords: ['焼肉', 'やきにく', 'ヤキニク'], commonServing: 100 },
  
  // インド・エスニック料理
  { id: 'naan', name: 'ナン', category: 'grains', calories: 262, protein: 9.7, fat: 5.1, carbs: 45.6, keywords: ['ナン', 'なん'], commonServing: 100 },
  { id: 'tandoori_chicken', name: 'タンドリーチキン', category: 'prepared', calories: 119, protein: 20.1, fat: 3.2, carbs: 2.1, keywords: ['タンドリー', 'たんどりー'], commonServing: 150 },
  { id: 'pad_thai', name: 'パッタイ', category: 'prepared', calories: 181, protein: 4.8, fat: 6.9, carbs: 26.2, keywords: ['パッタイ', 'ぱったい'], commonServing: 300 },
  { id: 'green_curry', name: 'グリーンカレー', category: 'prepared', calories: 98, protein: 2.1, fat: 7.8, carbs: 4.9, keywords: ['グリーンカレー', 'ぐりーんかれー'], commonServing: 250 },
  { id: 'tom_yum', name: 'トムヤムクン', category: 'prepared', calories: 67, protein: 4.2, fat: 3.1, carbs: 6.8, keywords: ['トムヤムクン', 'とむやむくん'], commonServing: 200 },
  
  // 洋食拡張
  { id: 'gratin', name: 'グラタン', category: 'prepared', calories: 142, protein: 6.8, fat: 8.9, carbs: 9.2, keywords: ['グラタン', 'ぐらたん'], commonServing: 200 },
  { id: 'doria', name: 'ドリア', category: 'prepared', calories: 124, protein: 4.2, fat: 4.8, carbs: 16.9, keywords: ['ドリア', 'どりあ'], commonServing: 300 },
  { id: 'risotto', name: 'リゾット', category: 'prepared', calories: 131, protein: 3.8, fat: 4.2, carbs: 19.8, keywords: ['リゾット', 'りぞっと'], commonServing: 250 },
  { id: 'quiche', name: 'キッシュ', category: 'prepared', calories: 276, protein: 9.8, fat: 22.1, carbs: 8.9, keywords: ['キッシュ', 'きっしゅ'], commonServing: 120 },
  { id: 'omelet', name: 'オムレツ', category: 'prepared', calories: 182, protein: 12.8, fat: 13.4, carbs: 0.5, keywords: ['オムレツ', 'おむれつ'], commonServing: 120 },
  
  // 追加の調味料・ソース
  { id: 'tonkatsu_sauce', name: 'とんかつソース', category: 'seasonings', calories: 132, protein: 1.2, fat: 0.1, carbs: 32.8, keywords: ['ソース', 'そーす', 'とんかつ'], commonServing: 15 },
  { id: 'worcestershire', name: 'ウスターソース', category: 'seasonings', calories: 117, protein: 0.8, fat: 0.0, carbs: 26.3, keywords: ['ウスター', 'うすたー', 'ソース'], commonServing: 15 },
  { id: 'oyster_sauce', name: 'オイスターソース', category: 'seasonings', calories: 107, protein: 3.2, fat: 0.6, carbs: 18.4, keywords: ['オイスター', 'おいすたー'], commonServing: 15 },

  // === 菓子・スナック ===
  { id: 'chocolate', name: 'チョコレート', category: 'sweets', calories: 558, protein: 7.3, fat: 34.1, carbs: 51.9, keywords: ['チョコレート', 'ちょこれーと', 'チョコ'], commonServing: 20 },
  { id: 'ice_cream', name: 'アイスクリーム', category: 'sweets', calories: 180, protein: 3.2, fat: 8.0, carbs: 23.2, keywords: ['アイス', 'アイスクリーム', 'あいす'], commonServing: 100 },
  { id: 'cake_sponge', name: 'スポンジケーキ', category: 'sweets', calories: 298, protein: 6.2, fat: 8.6, carbs: 47.8, keywords: ['ケーキ', 'スポンジ', 'けーき'], commonServing: 80 },
  { id: 'cookies', name: 'クッキー', category: 'snacks', calories: 432, protein: 6.9, fat: 17.2, carbs: 62.6, keywords: ['クッキー', 'くっきー', 'ビスケット'], commonServing: 30 },
  { id: 'potato_chips', name: 'ポテトチップス', category: 'snacks', calories: 554, protein: 4.7, fat: 35.2, carbs: 54.7, keywords: ['ポテチ', 'ポテトチップス', 'ぽてち'], commonServing: 60 },
  { id: 'rice_crackers', name: 'せんべい', category: 'snacks', calories: 373, protein: 8.1, fat: 2.5, carbs: 83.1, keywords: ['せんべい', 'センベイ', '煎餅'], commonServing: 20 },

  // === 飲み物 ===
  { id: 'coffee_black', name: 'コーヒー（ブラック）', category: 'beverages', calories: 4, protein: 0.2, fat: 0.0, carbs: 0.7, keywords: ['コーヒー', 'こーひー', 'ブラック'], commonServing: 150 },
  { id: 'tea_green', name: '緑茶', category: 'beverages', calories: 0, protein: 0.0, fat: 0.0, carbs: 0.1, keywords: ['緑茶', 'りょくちゃ', 'お茶'], commonServing: 150 },
  { id: 'cola', name: 'コーラ', category: 'beverages', calories: 46, protein: 0.0, fat: 0.0, carbs: 11.4, keywords: ['コーラ', 'こーら'], commonServing: 350 },
  { id: 'orange_juice', name: 'オレンジジュース', category: 'beverages', calories: 41, protein: 0.2, fat: 0.1, carbs: 10.2, keywords: ['オレンジジュース', 'おれんじ', 'ジュース'], commonServing: 200 },
  { id: 'beer', name: 'ビール', category: 'beverages', calories: 40, protein: 0.3, fat: 0.0, carbs: 3.1, keywords: ['ビール', 'びーる'], commonServing: 350 },
  { id: 'sake', name: '日本酒', category: 'beverages', calories: 103, protein: 0.4, fat: 0.0, carbs: 4.9, keywords: ['日本酒', 'にほんしゅ', '酒'], commonServing: 180 },

  // === ファストフード ===
  { id: 'hamburger', name: 'ハンバーガー', category: 'fast_food', calories: 293, protein: 12.0, fat: 15.4, carbs: 28.0, keywords: ['ハンバーガー', 'はんばーがー'], commonServing: 120 },
  { id: 'french_fries', name: 'フライドポテト', category: 'fast_food', calories: 237, protein: 3.0, fat: 11.3, carbs: 31.2, keywords: ['フライドポテト', 'ポテト', 'フライ'], commonServing: 100 },
  { id: 'pizza_margherita', name: 'ピザ（マルゲリータ）', category: 'fast_food', calories: 268, protein: 10.1, fat: 11.5, carbs: 31.4, keywords: ['ピザ', 'ぴざ'], commonServing: 100 },
  { id: 'chicken_nuggets', name: 'チキンナゲット', category: 'fast_food', calories: 245, protein: 15.5, fat: 15.7, carbs: 9.9, keywords: ['ナゲット', 'チキンナゲット'], commonServing: 80 },

  // === 調味料 ===
  { id: 'soy_sauce', name: '醤油', category: 'seasonings', calories: 71, protein: 10.1, fat: 0.0, carbs: 10.1, keywords: ['醤油', 'しょうゆ', 'しょーゆ'], commonServing: 18 },
  { id: 'miso', name: '味噌', category: 'seasonings', calories: 217, protein: 12.9, fat: 6.0, carbs: 23.5, keywords: ['味噌', 'みそ', 'ミソ'], commonServing: 18 },
  { id: 'mayonnaise', name: 'マヨネーズ', category: 'seasonings', calories: 703, protein: 1.5, fat: 75.3, carbs: 4.5, keywords: ['マヨネーズ', 'まよねーず', 'マヨ'], commonServing: 12 },
  { id: 'ketchup', name: 'ケチャップ', category: 'seasonings', calories: 119, protein: 1.6, fat: 0.2, carbs: 27.4, keywords: ['ケチャップ', 'けちゃっぷ'], commonServing: 15 },
];

// 食品パターンマッチング関数
export function findFoodMatch(text: string): { food: FoodData; confidence: 'high' | 'medium' | 'low' } | null {
  const normalizedText = text.toLowerCase().replace(/\s/g, '');
  
  // 完全一致をチェック
  for (const food of FOOD_DATABASE) {
    if (food.keywords.some(keyword => keyword === text || keyword === normalizedText)) {
      return { food, confidence: 'high' };
    }
  }
  
  // 部分一致をチェック
  for (const food of FOOD_DATABASE) {
    if (food.keywords.some(keyword => 
      text.includes(keyword) || keyword.includes(text) ||
      normalizedText.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(normalizedText)
    )) {
      return { food, confidence: 'medium' };
    }
  }
  
  // より柔軟なマッチング
  for (const food of FOOD_DATABASE) {
    if (food.keywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s/g, '');
      return normalizedText.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedText);
    })) {
      return { food, confidence: 'low' };
    }
  }
  
  return null;
}

// カテゴリ別食品取得
export function getFoodsByCategory(category: FoodData['category']): FoodData[] {
  return FOOD_DATABASE.filter(food => food.category === category);
}

// 食品検索（複数キーワード対応）
export function searchFoods(query: string): FoodData[] {
  const normalizedQuery = query.toLowerCase();
  return FOOD_DATABASE.filter(food => 
    food.keywords.some(keyword => 
      keyword.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(keyword.toLowerCase())
    )
  );
}