import {
	ArrowLeft,
	Camera,
	Plus,
	Settings,
	Target,
	TrendingDown,
	TrendingUp,
	Upload,
	X,
} from "lucide-react";
import { useState } from "react";
import { CompactHeader } from "./CompactHeader";
import { ImageViewModal } from "./ImageViewModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { WeightEntryModal } from "./WeightEntryModal";

interface WeightDetailPageProps {
	onBack: () => void;
	onNavigateToSettings?: () => void;
	hideHeader?: boolean;
	weightData?: Array<{
		date: string;
		weight: number;
		morningWeight?: number;
		eveningWeight?: number;
		note?: string;
	}>;
	currentWeight?: number;
	targetWeight?: number;
	onOpenWeightEntry?: () => void;
	onOpenWeightSettings?: () => void;
}

export function WeightDetailPage({
	onBack,
	onNavigateToSettings,
	hideHeader = false,
	weightData: propWeightData,
	currentWeight: propCurrentWeight,
	targetWeight: propTargetWeight,
	onOpenWeightEntry,
	onOpenWeightSettings,
}: WeightDetailPageProps) {
	const [selectedPeriod, setSelectedPeriod] = useState<
		"week" | "month" | "6months" | "year"
	>("month");
	const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [progressPhotos, setProgressPhotos] = useState<string[]>([]);
	const [isImageViewOpen, setIsImageViewOpen] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);

	// ダミーデータは削除 - 実際のデータのみ使用
	const defaultWeightData = [];

	const weightData = propWeightData || defaultWeightData;
	const currentWeight = propCurrentWeight || 72.5;
	const targetWeight = propTargetWeight || 68.0;
	const initialWeight = weightData.length > 0 ? weightData[0].weight : 75.2;
	const height = 175; // cm

	const calculateBMI = (weight: number, height: number) => {
		const heightInM = height / 100;
		return Number((weight / (heightInM * heightInM)).toFixed(1));
	};

	const calculateProgress = () => {
		const totalLoss = initialWeight - currentWeight;
		const targetLoss = initialWeight - targetWeight;
		return Math.round((totalLoss / targetLoss) * 100);
	};

	const getWeightTrend = () => {
		if (weightData.length < 2) return { trend: "stable", change: 0 };

		const recent = weightData.slice(-7); // 直近7日
		const firstWeight = recent[0].weight;
		const lastWeight = recent[recent.length - 1].weight;
		const change = lastWeight - firstWeight;

		if (change > 0.2) return { trend: "up", change };
		if (change < -0.2) return { trend: "down", change };
		return { trend: "stable", change };
	};

	const periodOptions = [
		{ key: "week", label: "7日", days: 7 },
		{ key: "month", label: "1ヶ月", days: 30 },
		{ key: "6months", label: "半年", days: 180 },
		{ key: "year", label: "1年", days: 365 },
	];

	const trend = getWeightTrend();
	const progress = calculateProgress();
	const currentBMI = calculateBMI(currentWeight, height);

	const handleAddWeight = (data: { weight: number; note?: string }) => {
		// ここで���際のデータ更新処理
	};

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
	};

	const handleCalendar = () => {};

	const handlePhotoUpload = () => {
		// プレースホルダー: 実際のファイルアップロード処理
		const mockPhotos = [
			"https://images.unsplash.com/photo-1669504243706-1df1f8d5dacd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwdHJhbnNmb3JtYXRpb24lMjBib2R5JTIwcHJvZ3Jlc3N8ZW58MXx8fHwxNzU2NTU5MjQ3fDA&ixlib=rb-4.1.0&q=80&w=400",
			"https://images.unsplash.com/photo-1604281019483-6f66cb10f725?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGglMjBib2R5JTIwbWVhc3VyZW1lbnQlMjBzY2FsZXxlbnwxfHx8fDE3NTY1NTkyNTF8MA&ixlib=rb-4.1.0&q=80&w=400",
		];
		const randomPhoto =
			mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
		setProgressPhotos((prev) => [...prev, randomPhoto]);
	};

	const removePhoto = (index: number) => {
		setProgressPhotos((prev) => prev.filter((_, i) => i !== index));
	};

	const handleImageClick = (index: number) => {
		setSelectedImageIndex(index);
		setIsImageViewOpen(true);
	};

	return (
		<div className={hideHeader ? "min-h-screen bg-white relative" : ""}>
			{!hideHeader && (
				<>
					{/* 戻るボタン */}
					<div className="absolute top-4 left-4 z-10">
						<Button
							variant="ghost"
							size="sm"
							onClick={onBack}
							className="p-2 rounded-xl bg-white hover:bg-white  shadow-sm border border-gray-200"
						>
							<ArrowLeft size={20} style={{ color: "#4682B4" }} />
						</Button>
					</div>

					{/* ホーム画面と同じヘッダー */}
					<CompactHeader
						currentDate={selectedDate}
						onDateSelect={handleDateSelect}
						onCalendar={handleCalendar}
					/>
				</>
			)}

			<div
				className={`relative space-y-4 ${hideHeader ? "" : "px-4 py-4 pb-20"}`}
			>
				{/* ここに残りのコンテンツが続く */}

				{/* 体重記録カード */}
				<Card className="bg-white/80 backdrop-blur-xl border border-white/20/50 rounded-xl p-3">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-slate-800">体重記録</h4>
						{onNavigateToSettings && (
							<Button
								size="sm"
								onClick={onNavigateToSettings}
								variant="outline"
								className="rounded-md border-slate-200 hover:bg-gray-100 p-1"
							>
								<Settings size={12} className="text-slate-600" />
							</Button>
						)}
					</div>

					<div className="flex justify-between">
						{/* 現在の体重 */}
						<div className="text-center flex-1">
							<div className="text-xs text-slate-500 mb-0.5">現在</div>
							<div className="text-slate-800">
								{currentWeight}
								<span className="text-xs">kg</span>
							</div>
						</div>

						{/* BMI */}
						<div className="text-center flex-1">
							<div className="text-xs text-slate-500 mb-0.5">BMI</div>
							<div className="text-slate-800">{currentBMI}</div>
						</div>

						{/* 目標まで */}
						<div className="text-center flex-1">
							<div className="text-xs text-slate-500 mb-0.5">目標まで</div>
							<div className="text-[rgba(241,13,9,1)]">
								{Math.abs(currentWeight - targetWeight).toFixed(1)}
								<span className="text-xs">kg</span>
							</div>
						</div>
					</div>
				</Card>


				{/* 進捗写真 */}

				{/* 体重入力モーダル */}
				<WeightEntryModal
					isOpen={isEntryModalOpen}
					onClose={() => setIsEntryModalOpen(false)}
					onSubmit={handleAddWeight}
					currentWeight={currentWeight}
				/>

				{/* 画像表示モーダル */}
				<ImageViewModal
					isOpen={isImageViewOpen}
					onClose={() => setIsImageViewOpen(false)}
					images={progressPhotos}
					initialIndex={selectedImageIndex}
					mealName={`記��� #${selectedImageIndex + 1}`}
				/>
			</div>
		</div>
	);
}
