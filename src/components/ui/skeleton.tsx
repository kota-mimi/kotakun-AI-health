import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

// カード用スケルトンコンポーネント
function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
      {children}
    </div>
  );
}

// 体重カード用スケルトン
function WeightCardSkeleton() {
  return (
    <CardSkeleton>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-6" />
          <Skeleton className="w-5 h-4" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-15 h-3" />
          <Skeleton className="w-15 h-3" />
        </div>
      </div>
    </CardSkeleton>
  );
}

// カロリーカード用スケルトン
function CalorieCardSkeleton() {
  return (
    <CardSkeleton>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-20 h-5" />
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-full h-2" />
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <Skeleton className="w-10 h-4 mx-auto" />
            <Skeleton className="w-15 h-3 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="w-10 h-4 mx-auto" />
            <Skeleton className="w-15 h-3 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="w-10 h-4 mx-auto" />
            <Skeleton className="w-15 h-3 mx-auto" />
          </div>
        </div>
      </div>
    </CardSkeleton>
  );
}

// 食事カード用スケルトン
function MealCardSkeleton() {
  return (
    <CardSkeleton>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-10 h-8" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <Skeleton className="w-10 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}

// 運動カード用スケルトン
function WorkoutCardSkeleton() {
  return (
    <CardSkeleton>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-10 h-8" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-4/5 h-3" />
      </div>
    </CardSkeleton>
  );
}

// ヘッダー週間カレンダー用スケルトン
function HeaderCalendarSkeleton() {
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-8 h-8 rounded-lg" />
        
        <div className="grid grid-cols-7 gap-1 flex-1 mx-3">
          {[1, 2, 3, 4, 5, 6, 7].map((index) => (
            <div key={index} className="h-12 flex flex-col p-1 rounded-xl animate-pulse">
              <Skeleton className="w-4 h-3 mx-auto mb-1" />
              <Skeleton className="w-5 h-4 mx-auto" />
            </div>
          ))}
        </div>
        
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export { Skeleton, CardSkeleton, WeightCardSkeleton, CalorieCardSkeleton, MealCardSkeleton, WorkoutCardSkeleton, HeaderCalendarSkeleton };
