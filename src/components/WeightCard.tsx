import React from "react";
import { Card } from "./ui/card";

interface WeightData {
	current: number;
	previous: number;
	target: number;
}

interface CounselingResult {
	answers: {
		weight: number;
		targetWeight: number;
	};
	firstCompletedAt?: any;
	completedAt?: any;
	createdAt?: any;
}

interface WeightCardProps {
	data: WeightData;
	onNavigateToWeight?: () => void;
	counselingResult?: CounselingResult | null;
	selectedDate?: Date;
	sharedProfile?: { latestProfile: any } | null;
}

export function WeightCard({
	data,
	onNavigateToWeight,
	counselingResult,
	selectedDate,
	sharedProfile,
}: WeightCardProps) {
	// 未来日付かどうかの判定
	const today = new Date().toLocaleDateString("sv-SE", {
		timeZone: "Asia/Tokyo",
	});
	const selectedDateKey =
		selectedDate?.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }) ||
		today;
	const isFutureDate = selectedDateKey > today;

	// シンプルな表示ロジック
	const hasCurrentData = data.current > 0;
	const hasPreviousData = data.previous > 0;
	const hasTargetData = data.target > 0;

	// 健康維持モードチェック
	const isMaintenanceMode =
		counselingResult?.answers?.primaryGoal === "maintenance";
	const shouldShowTarget = hasTargetData && !isMaintenanceMode;

	// 現在の体重表示（useWeightDataの結果 + プロフィール + カウンセリング体重フォールバック）
	const currentWeight = data.current > 0 ? data.current : 
	                      (sharedProfile?.latestProfile?.weight ||
	                       counselingResult?.answers?.weight || 
	                       counselingResult?.userProfile?.weight || 0);
	const shouldShowWeight = !isFutureDate && currentWeight > 0;

	// 前日比計算
	const difference =
		hasCurrentData && hasPreviousData ? currentWeight - data.previous : 0;
	const shouldShowDifference = hasCurrentData && hasPreviousData;
	const isDecrease = difference < 0;

	// 目標体重取得（useWeightDataの結果 + プロフィール + カウンセリング結果フォールバック）
	const targetWeight = data.target > 0 ? data.target : 
	                     (sharedProfile?.latestProfile?.targetWeight ||
	                      counselingResult?.answers?.targetWeight || 0);
	
	// 目標までの計算
	const canCalculateRemaining =
		!isFutureDate && currentWeight > 0 && targetWeight > 0 && !isMaintenanceMode;
	const remaining = canCalculateRemaining
		? Math.abs(currentWeight - targetWeight)
		: 0;

	return (
		<Card className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
			<div className="p-2">
				<div className="grid grid-cols-3 gap-1.5">
					{/* 現在の体重 */}
					<div
						className="text-center p-2 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl border border-slate-200/50 cursor-pointer hover:shadow-sm transition-shadow"
						onClick={onNavigateToWeight}
					>
						<div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
							現在
						</div>
						<div className="text-lg font-bold text-slate-900">
							{shouldShowWeight
								? currentWeight % 1 === 0
									? currentWeight.toString()
									: currentWeight.toFixed(1)
								: "--"}
							{shouldShowWeight && (
								<span className="text-sm font-medium text-slate-600 ml-1">
									kg
								</span>
							)}
						</div>
					</div>

					{/* 前日比 */}
					<div
						className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 cursor-pointer hover:shadow-sm transition-shadow"
						onClick={onNavigateToWeight}
					>
						<div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">
							前回比
						</div>
						<div
							className={`text-lg font-bold ${
								shouldShowDifference && isDecrease
									? "text-green-600"
									: shouldShowDifference
										? "text-orange-600"
										: "text-slate-900"
							}`}
						>
							{shouldShowDifference ? (
								<>
									{isDecrease ? "" : "+"}
									{difference.toFixed(1)}
									<span className="text-sm font-medium text-slate-600 ml-1">
										kg
									</span>
								</>
							) : (
								"--"
							)}
						</div>
					</div>

					{/* 目標まで */}
					<div
						className="text-center p-2 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:shadow-sm transition-shadow"
						onClick={onNavigateToWeight}
					>
						<div className="text-xs font-medium text-orange-700 mb-1 uppercase tracking-wide">
							目標まで
						</div>
						<div className="text-lg font-bold">
							{canCalculateRemaining ? (
								currentWeight === targetWeight ? (
									<span className="text-green-600">🎉 達成</span>
								) : currentWeight > targetWeight ? (
									<span className="text-red-600">
										-{remaining.toFixed(1)}
										<span className="text-sm font-medium text-slate-600 ml-1">
											kg
										</span>
									</span>
								) : (
									<span className="text-green-600">
										+{remaining.toFixed(1)}
										<span className="text-sm font-medium text-slate-600 ml-1">
											kg
										</span>
									</span>
								)
							) : (
								<span className="text-slate-900">--</span>
							)}
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
