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
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 指定日の食事データを取得（Admin SDK使用）
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(targetDate);
    const recordDoc = await recordRef.get();
    const dailyRecord = recordDoc.exists ? recordDoc.data() : null;
    
    // Firestoreデータを変換してInstagramLikeFeed形式に合わせる
    const convertFirestoreMealToDisplay = (meal: any) => ({
      id: meal.id,
      name: meal.name || meal.description || (meal.items ? meal.items.join(', ') : '食事'),
      mealTime: meal.type,
      time: meal.time || (meal.timestamp ? 
        new Date(meal.timestamp.seconds * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) :
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
    });

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
      time: mealData.time,
      images: mealData.images || [],
      image: mealData.images?.[0] || mealData.image,
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
    const { lineUserId, date, mealType, mealData } = await request.json();

    console.log('🔧 PATCH API called with:', { lineUserId, date, mealType, mealId: mealData.id });

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

    // 食事データをFirestore形式に変換
    const updatedMealData = {
      id: mealData.id,
      name: mealData.name,
      type: mealType,
      calories: mealData.calories || 0,
      protein: mealData.protein || 0,
      fat: mealData.fat || 0,
      carbs: mealData.carbs || 0,
      time: mealData.time,
      images: mealData.images || [],
      image: mealData.images?.[0] || mealData.image,
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
    
    // 複数食事の個別削除かチェック（仮想IDの場合）
    if (mealId.includes('_') && individualMealIndex !== undefined) {
      // 仮想IDから元のIDを取得 (例: meal_xxx_0 -> meal_xxx)
      const originalMealId = mealId.split('_').slice(0, -1).join('_');
      console.log('🚨 Individual meal deletion:', { originalMealId, individualMealIndex });
      
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

      // 対象の複数食事を見つける
      const targetMealIndex = existingRecord.meals.findIndex((meal: any) => meal.id === originalMealId);
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

      // 個別食事を削除
      const updatedIndividualMeals = targetMeal.meals.filter((_: any, index: number) => index !== individualMealIndex);
      
      if (updatedIndividualMeals.length === 0) {
        // 全て削除された場合は食事全体を削除
        const updatedMeals = existingRecord.meals.filter((meal: any) => meal.id !== originalMealId);
        await recordRef.update({ 
          meals: updatedMeals,
          updatedAt: new Date()
        });
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
      }
    } else {
      // 通常の削除（Admin SDK）
      const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
      const recordDoc = await recordRef.get();
      
      if (recordDoc.exists) {
        const existingRecord = recordDoc.data();
        if (existingRecord && existingRecord.meals) {
          const updatedMeals = existingRecord.meals.filter((meal: any) => meal.id !== mealId);
          await recordRef.update({ 
            meals: updatedMeals,
            updatedAt: new Date()
          });
        }
      }
    }

    console.log('🚨 DELETE SUCCESS!');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🚨 DELETE ERROR:', error);
    return NextResponse.json(
      { error: error.message || '食事記録の削除に失敗しました' },
      { status: 500 }
    );
  }
}