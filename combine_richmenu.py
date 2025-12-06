#!/usr/bin/env python3
from PIL import Image
import os

def combine_richmenu():
    print("🎨 3ボタンリッチメニュー画像結合開始")
    
    # LINEリッチメニューの仕様
    total_width = 2500
    total_height = 843
    button_width = total_width // 3  # 833px each
    
    print(f"📏 サイズ: {total_width}x{total_height}px")
    print(f"🔲 ボタン幅: {button_width}px")
    
    # 画像パス
    image_paths = [
        "/Users/toshimitsukotarou/Downloads/マイページ (1)/1.png",  # マイページ
        "/Users/toshimitsukotarou/Downloads/マイページ (1)/2.png",  # フィードバック
        "/Users/toshimitsukotarou/Downloads/マイページ (1)/3.png"   # 使い方
    ]
    
    try:
        # 新しいキャンバス作成
        canvas = Image.new('RGB', (total_width, total_height), 'white')
        
        print("📂 画像読み込み・配置中...")
        
        for i, path in enumerate(image_paths):
            if not os.path.exists(path):
                print(f"❌ 画像が見つかりません: {path}")
                return False
                
            # 画像読み込み
            img = Image.open(path)
            
            # 配置位置計算
            x = i * button_width
            width = total_width - (button_width * 2) if i == 2 else button_width  # 最後は残り幅
            
            print(f"🖼️ 画像{i+1}: x={x}, width={width}")
            
            # 画像をリサイズしてキャンバスに貼り付け
            img_resized = img.resize((width, total_height), Image.Resampling.LANCZOS)
            canvas.paste(img_resized, (x, 0))
        
        # PNG形式で保存
        output_path = "richmenu-3buttons-combined.png"
        canvas.save(output_path, "PNG", optimize=True)
        
        # ファイル情報
        file_size = os.path.getsize(output_path)
        print(f"✅ 結合完了!")
        print(f"📦 ファイルサイズ: {file_size // 1024}KB")
        print(f"💾 保存先: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

if __name__ == "__main__":
    success = combine_richmenu()
    if success:
        print("🎉 画像結合成功！")
    else:
        print("😞 画像結合失敗")