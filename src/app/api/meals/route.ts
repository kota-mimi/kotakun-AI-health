import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, date } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID が必要です' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    const targetDate = date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD (日本時間)

    // 指定日の食事データを取得（Admin SDK使用）
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(targetDate);
    const recordDoc = await recordRef.get();
    const dailyRecord = recordDoc.exists ? recordDoc.data() : null;
    
    // Firestoreデータを変換してInstagramLikeFeed形式に合わせる
    const convertFirestoreMealToDisplay = (meal: any) => {
      const convertedMeal = {
        id: meal.id,
        name: meal.name || meal.description || (meal.items ? meal.items.join(', ') : '食事'),
        mealTime: meal.type,
        time: meal.time || (meal.timestamp ? 
          new Date(meal.timestamp.seconds * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) :
          '00:00'),
        calories: meal.calories || (meal.analysis ? meal.analysis.calories : 0),
        protein: meal.protein || (meal.analysis ? meal.analysis.protein : 0),
        fat: meal.fat || (meal.analysis ? meal.analysis.fat : 0),
        carbs: meal.carbs || (meal.analysis ? meal.analysis.carbs : 0),
        images: meal.images || (meal.image ? [meal.image] : []),
        image: meal.image || meal.imageUrl,
        foodItems: meal.foodItems || meal.items || [],
        // 複数食事対応
        isMultipleMeals: meal.isMultipleMeals || false,
        meals: meal.meals || []
      };
      
      // 🔍 デバッグログ: 画像データの変換を確認
      console.log('🔍 Meal conversion debug:', {
        originalMeal: {
          id: meal.id,
          name: meal.name,
          image: meal.image,
          images: meal.images,
          imageUrl: meal.imageUrl
        },
        convertedMeal: {
          id: convertedMeal.id,
          name: convertedMeal.name,
          image: convertedMeal.image,
          images: convertedMeal.images
        }
      });
      
      return convertedMeal;
    };

    const meals = dailyRecord?.meals || [];
    const mealData = {
      breakfast: meals.filter((meal: any) => meal.type === 'breakfast').map(convertFirestoreMealToDisplay),
      lunch: meals.filter((meal: any) => meal.type === 'lunch').map(convertFirestoreMealToDisplay),
      dinner: meals.filter((meal: any) => meal.type === 'dinner').map(convertFirestoreMealToDisplay),
      snack: meals.filter((meal: any) => meal.type === 'snack').map(convertFirestoreMealToDisplay)
    };

    return NextResponse.json({
      success: true,
      mealData,
      date: targetDate
    });

  } catch (error: any) {
    console.error('食事データ取得エラー:', error);
    return NextResponse.json(
      { error: error.message || '食事データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { lineUserId, date, mealType, mealData } = await request.json();

    if (!lineUserId || !date || !mealType || !mealData) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    // 食事データをFirestore形式に変換
    const firestoreMealData = {
      id: mealData.id,
      name: mealData.name,
      type: mealType,
      calories: mealData.calories || 0,
      protein: mealData.protein || 0,
      fat: mealData.fat || 0,
      carbs: mealData.carbs || 0,
      time: mealData.time || '00:00',
      images: mealData.images || [],
      image: mealData.images?.[0] || mealData.image || null,
      foodItems: mealData.foodItems || [],
      timestamp: new Date(),
      createdAt: mealData.createdAt || new Date()
    };

    // Admin SDKで食事データを追加
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingMeals = existingData.meals || [];
    
    // 新しい食事を追加
    const updatedMeals = [...existingMeals, firestoreMealData];
    
    await recordRef.set({
      ...existingData,
      meals: updatedMeals,
      date,
      lineUserId,
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('食事追加エラー:', error);
    return NextResponse.json(
      { error: error.message || '食事の追加に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { lineUserId, date, mealType, mealData, mealId, individualMealIndex } = await request.json();

    console.log('🔧 PATCH API called with:', { lineUserId, date, mealType, mealId: mealData.id, originalMealId: mealId, individualMealIndex });

    if (!lineUserId || !date || !mealType || !mealData) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    // 既存の日次記録を取得（Admin SDK）
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
    const recordDoc = await recordRef.get();
    
    if (!recordDoc.exists) {
      return NextResponse.json(
        { error: '食事記録が見つかりません' },
        { status: 404 }
      );
    }

    const existingRecord = recordDoc.data();
    if (!existingRecord || !existingRecord.meals) {
      return NextResponse.json(
        { error: '食事記録が見つかりません' },
        { status: 404 }
      );
    }

    // 複数食事の個別更新かチェック
    if (mealId && individualMealIndex !== undefined) {
      console.log('🔧 Individual meal update detected:', { mealId, individualMealIndex });
      
      // 対象の複数食事を見つける
      const targetMealIndex = existingRecord.meals.findIndex((meal: any) => meal.id === mealId);
      if (targetMealIndex === -1) {
        return NextResponse.json(
          { error: '食事記録が見つかりません' },
          { status: 404 }
        );
      }

      const targetMeal = existingRecord.meals[targetMealIndex];
      if (!targetMeal.isMultipleMeals || !targetMeal.meals) {
        return NextResponse.json(
          { error: '複数食事記録ではありません' },
          { status: 400 }
        );
      }

      // 個別食事を更新
      const updatedIndividualMeals = targetMeal.meals.map((meal: any, index: number) => {
        if (index === individualMealIndex) {
          return {
            ...meal,
            name: mealData.name,
            calories: mealData.calories || 0,
            protein: mealData.protein || 0,
            fat: mealData.fat || 0,
            carbs: mealData.carbs || 0,
          };
        }
        return meal;
      });

      // 複数食事の栄養価を再計算
      const updatedMeal = {
        ...targetMeal,
        meals: updatedIndividualMeals,
        calories: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0),
        protein: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0),
        fat: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0),
        carbs: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0),
        time: mealData.time || targetMeal.time,
        updatedAt: new Date()
      };
      
      const updatedMeals = existingRecord.meals.map((meal: any) => 
        meal.id === mealId ? updatedMeal : meal
      );

      await recordRef.update({
        meals: updatedMeals,
        updatedAt: new Date()
      });
    } else {
      // 通常の更新
      const updatedMealData = {
        id: mealData.id,
        name: mealData.name,
        type: mealType,
        calories: mealData.calories || 0,
        protein: mealData.protein || 0,
        fat: mealData.fat || 0,
        carbs: mealData.carbs || 0,
        time: mealData.time || '00:00',
        images: mealData.images || [],
        image: mealData.images?.[0] || mealData.image || null,
        foodItems: mealData.foodItems || [],
        timestamp: new Date(),
        updatedAt: new Date()
      };

      // 既存の食事リストを更新
      const updatedMeals = existingRecord.meals.map((meal: any) => 
        meal.id === mealData.id ? updatedMealData : meal
      );

      // 日次記録を更新（Admin SDK）
      await recordRef.update({
        meals: updatedMeals,
        updatedAt: new Date()
      });
    }

    console.log('🔧 PATCH SUCCESS!');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔧 PATCH ERROR:', error);
    return NextResponse.json(
      { error: error.message || '食事記録の更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { lineUserId, date, mealType, mealId, individualMealIndex } = await request.json();

    console.log('🚨 DELETE API called with:', { lineUserId, date, mealType, mealId, individualMealIndex });

    if (!lineUserId || !date || !mealType || !mealId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    console.log('🔍 PRODUCTION DEBUG: Firebase Admin check:', {
      hasAdminDb: !!adminDb,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      environment: process.env.NODE_ENV
    });
    
    // 複数食事の個別削除かチェック（仮想IDまたはindividualMealIndexの場合）
    let originalMealId = mealId;
    let finalIndividualMealIndex = individualMealIndex;
    
    // 仮想IDから元のIDを抽出
    if (mealId.includes('_')) {
      const parts = mealId.split('_');
      const lastPart = parts[parts.length - 1];
      if (!isNaN(Number(lastPart)) && parts.length >= 2 && lastPart.match(/^\d+$/)) {
        originalMealId = parts.slice(0, -1).join('_');
        finalIndividualMealIndex = Number(lastPart);
        console.log('🚨 Virtual ID parsed for deletion:', { mealId, originalMealId, individualMealIndex: finalIndividualMealIndex });
      }
    }
    
    // 複数食事の個別削除処理
    if (finalIndividualMealIndex !== undefined) {
      console.log('🚨 Individual meal deletion:', { originalMealId, individualMealIndex: finalIndividualMealIndex });
      
      // 既存の日次記録を取得（Admin SDK）
      const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
      console.log('🔍 Getting document:', { userId: lineUserId, date });
      
      const recordDoc = await recordRef.get();
      console.log('🔍 Document retrieved:', { exists: recordDoc.exists });
      
      if (!recordDoc.exists) {
        console.log('🔍 Document not found - returning 404');
        return NextResponse.json(
          { error: '食事記録が見つかりません' },
          { status: 404 }
        );
      }
      
      const existingRecord = recordDoc.data();
      console.log('🔍 Document data:', { 
        hasRecord: !!existingRecord, 
        hasMeals: !!existingRecord?.meals,
        mealsCount: existingRecord?.meals?.length || 0
      });
      
      if (!existingRecord || !existingRecord.meals) {
        console.log('🔍 No meals data found - returning 404');
        return NextResponse.json(
          { error: '食事記録が見つかりません' },
          { status: 404 }
        );
      }

      // 対象の複数食事を見つける
      console.log('🔍 Searching for meal:', { 
        originalMealId, 
        availableMealIds: existingRecord.meals.map((m: any) => m.id) 
      });
      
      const targetMealIndex = existingRecord.meals.findIndex((meal: any) => meal.id === originalMealId);
      console.log('🔍 Target meal search result:', { targetMealIndex });
      
      if (targetMealIndex === -1) {
        console.log('🔍 Target meal not found - returning 404');
        return NextResponse.json(
          { error: '食事記録が見つかりません' },
          { status: 404 }
        );
      }

      const targetMeal = existingRecord.meals[targetMealIndex];
      console.log('🔍 Target meal found:', { 
        isMultipleMeals: targetMeal.isMultipleMeals,
        hasMealsArray: !!targetMeal.meals,
        mealsArrayLength: targetMeal.meals?.length || 0
      });
      
      if (!targetMeal.isMultipleMeals || !targetMeal.meals) {
        console.log('🔍 Not a multiple meal record - returning 400');
        return NextResponse.json(
          { error: '複数食事記録ではありません' },
          { status: 400 }
        );
      }

      // 個別食事を削除
      console.log('🔍 Before deletion:', { 
        originalLength: targetMeal.meals.length,
        indexToDelete: finalIndividualMealIndex
      });
      
      const updatedIndividualMeals = targetMeal.meals.filter((_: any, index: number) => index !== finalIndividualMealIndex);
      console.log('🔍 After filtering:', { 
        newLength: updatedIndividualMeals.length,
        willDeleteEntireMeal: updatedIndividualMeals.length === 0
      });
      
      if (updatedIndividualMeals.length === 0) {
        // 全て削除された場合は食事全体を削除
        const updatedMeals = existingRecord.meals.filter((meal: any) => meal.id !== originalMealId);
        console.log('🔍 Deleting entire meal, remaining meals:', updatedMeals.length);
        
        await recordRef.update({ 
          meals: updatedMeals,
          updatedAt: new Date()
        });
        console.log('🔍 Entire meal deletion completed');
      } else {
        // 一部削除の場合は更新
        const updatedMeal = {
          ...targetMeal,
          meals: updatedIndividualMeals,
          // 栄養価を再計算
          calories: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0),
          protein: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0),
          fat: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0),
          carbs: updatedIndividualMeals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0),
        };
        
        const updatedMeals = existingRecord.meals.map((meal: any) => 
          meal.id === originalMealId ? updatedMeal : meal
        );
        await recordRef.update({ 
          meals: updatedMeals,
          updatedAt: new Date()
        });
        console.log('🔍 PRODUCTION DEBUG: Individual meal update successful');
      }
    } else {
      // 通常の削除（Admin SDK）
      const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
      const recordDoc = await recordRef.get();
      
      if (recordDoc.exists) {
        const existingRecord = recordDoc.data();
        if (existingRecord && existingRecord.meals) {
          const updatedMeals = existingRecord.meals.filter((meal: any) => meal.id !== originalMealId);
          await recordRef.update({ 
            meals: updatedMeals,
            updatedAt: new Date()
          });
          console.log('🚨 Normal meal deletion completed:', { originalMealId, remainingMeals: updatedMeals.length });
        }
      }
    }

    console.log('🚨 DELETE SUCCESS!');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🚨 PRODUCTION DELETE ERROR:', error);
    console.error('🚨 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    return NextResponse.json(
      { error: error.message || '食事記録の削除に失敗しました', details: error.code || 'unknown' },
      { status: 500 }
    );
  }
}