/**
 * カウンセリング完了状態をチェックし、未完了の場合はカウンセリングページに誘導する
 */

interface CounselingResult {
  aiAnalysis?: {
    nutritionPlan?: {
      dailyCalories?: number;
    };
  };
  answers?: any;
}

/**
 * カウンセリングが完了しているかどうかをチェック
 */
export function isCounselingCompleted(counselingResult: CounselingResult | null): boolean {
  if (!counselingResult) return false;
  
  // aiAnalysisと栄養プランが存在し、カロリー目標が設定されているかチェック
  return !!(
    counselingResult.aiAnalysis?.nutritionPlan?.dailyCalories &&
    counselingResult.answers
  );
}

/**
 * カウンセリング未完了時の誘導メッセージを表示し、カウンセリングページに遷移
 */
export function handleCounselingRequired(
  onNavigateToCounseling: () => void,
  actionName: string = 'この機能'
): boolean {
  const shouldProceed = confirm(
    `${actionName}を利用するには、まず初期設定（カウンセリング）を完了する必要があります。\n\n今すぐ設定を開始しますか？`
  );
  
  if (shouldProceed) {
    onNavigateToCounseling();
  }
  
  return false; // 元の処理は実行しない
}

/**
 * カウンセリング状態をチェックして、必要に応じて誘導する高階関数
 */
export function withCounselingGuard<T extends any[]>(
  counselingResult: CounselingResult | null,
  onNavigateToCounseling: () => void,
  actionName: string,
  originalHandler: (...args: T) => void
) {
  return (...args: T) => {
    if (!isCounselingCompleted(counselingResult)) {
      handleCounselingRequired(onNavigateToCounseling, actionName);
      return;
    }
    
    // カウンセリング完了済みなら元の処理を実行
    originalHandler(...args);
  };
}