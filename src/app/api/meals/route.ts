import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestoreService';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, date } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID が必要です' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 指定日の食事データを取得
    const dailyRecord = await firestoreService.getDailyRecord(lineUserId, targetDate);
    
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
      carbs: meal.carbs || (meal.analysis ? meal.analysis.carbohydrates : 0),
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

export async function DELETE(request: NextRequest) {
  try {
    const { lineUserId, date, mealType, mealId } = await request.json();

    console.log('🚨 DELETE API called with:', { lineUserId, date, mealType, mealId });

    if (!lineUserId || !date || !mealType || !mealId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    await firestoreService.deleteMeal(lineUserId, date, mealType, mealId);

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