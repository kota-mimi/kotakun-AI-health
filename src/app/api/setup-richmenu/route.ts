import { NextResponse } from 'next/server'

export async function POST() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  
  if (!channelAccessToken) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not found' }, { status: 500 })
  }

  try {
    // 既存のリッチメニューを削除
    const currentMenuResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
      headers: { 'Authorization': `Bearer ${channelAccessToken}` }
    })
    
    if (currentMenuResponse.ok) {
      const currentMenu = await currentMenuResponse.json()
      if (currentMenu.richMenuId) {
        await fetch(`https://api.line.me/v2/bot/richmenu/${currentMenu.richMenuId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${channelAccessToken}` }
        })
      }
    }

    // 3ボタンリッチメニュー作成
    const richMenuData = {
      size: { width: 2500, height: 843 },
      selected: false,
      name: "3ボタンメニュー",
      chatBarText: "メニュー",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: {
            type: "uri",
            uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          }
        },
        {
          bounds: { x: 833, y: 0, width: 833, height: 843 },
          action: {
            type: "postback", 
            data: "action=daily_feedback"
          }
        },
        {
          bounds: { x: 1666, y: 0, width: 834, height: 843 },
          action: {
            type: "uri",
            uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/guide` : `${process.env.NEXT_PUBLIC_APP_URL}/guide`
          }
        }
      ]
    }

    // リッチメニュー作成
    const createResponse = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(richMenuData)
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      return NextResponse.json({ error: `リッチメニュー作成失敗: ${error}` }, { status: 500 })
    }

    const { richMenuId } = await createResponse.json()

    // 画像をアップロード
    const fs = await import('fs')
    const imagePath = '/Users/toshimitsukotarou/Desktop/kotakun-good/richmenu-3buttons-combined.png'
    const imageBuffer = fs.readFileSync(imagePath)

    const uploadResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'image/png'
      },
      body: imageBuffer
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      return NextResponse.json({ error: `画像アップロード失敗: ${error}` }, { status: 500 })
    }

    // 全ユーザーに適用
    const setResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ richMenuId })
    })

    if (!setResponse.ok) {
      const error = await setResponse.text()
      return NextResponse.json({ error: `リッチメニュー設定失敗: ${error}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      richMenuId,
      message: '3ボタンリッチメニューを設定しました'
    })

  } catch (error) {
    console.error('リッチメニュー設定エラー:', error)
    return NextResponse.json({ 
      error: `エラー: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 })
  }
}