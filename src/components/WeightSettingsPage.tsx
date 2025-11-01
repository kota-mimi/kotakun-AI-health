import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";

interface WeightSettingsPageProps {
	onBack: () => void;
}

interface WeightSettings {
	morningWeight: boolean;
	eveningWeight: boolean;
}

export function WeightSettingsPage({ onBack }: WeightSettingsPageProps) {
	const [settings, setSettings] = useState<WeightSettings>({
		morningWeight: false,
		eveningWeight: false,
	});

	const handleSettingChange = (key: keyof WeightSettings, value: boolean) => {
		setSettings((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const settingItems = [
		{
			key: "morningWeight" as const,
			label: "朝の体重",
			description: "起床時の体重を別途記録する",
			color: "#10B981",
		},
		{
			key: "eveningWeight" as const,
			label: "夜の体重",
			description: "就寝前の体重を別途記録する",
			color: "#8B5CF6",
		},
	];

	return (
		<div className="min-h-screen bg-white overflow-y-auto">
			{/* ヘッダー */}
			<div className="bg-white border-b border-gray-200 sticky top-0 z-10">
				<div className="flex items-center justify-between p-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={onBack}
						className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
					>
						<ArrowLeft size={20} />
						<span>戻る</span>
					</Button>
					<h1 className="text-lg font-semibold text-gray-800">体重記録設定</h1>
					<div className="w-16"></div> {/* スペーサー */}
				</div>
			</div>

			<div className="p-4 pb-20 space-y-6">
				{/* 設定項目 */}
				<Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
					<div className="space-y-4">
						{settingItems.map((item) => (
							<div
								key={item.key}
								className="flex items-center justify-between py-3"
							>
								<div className="flex items-center space-x-3">
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center"
										style={{ backgroundColor: `${item.color}15` }}
									>
										<div
											className="w-4 h-4 rounded-full"
											style={{ backgroundColor: item.color }}
										></div>
									</div>
									<div>
										<h3 className="font-medium text-slate-800">{item.label}</h3>
										<p className="text-sm text-slate-600">{item.description}</p>
									</div>
								</div>

								<Switch
									checked={settings[item.key]}
									onCheckedChange={(checked) =>
										handleSettingChange(item.key, checked)
									}
								/>
							</div>
						))}
					</div>
				</Card>

				{/* プレビュー */}
				<Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
					<h3 className="font-semibold text-slate-800 mb-4">記録プレビュー</h3>

					<div className="space-y-3">
						<div className="p-3 bg-gray-100 rounded-lg">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-slate-700">
									基本体重
								</span>
								<span className="text-sm text-slate-800">72.5kg</span>
							</div>
							<div className="text-xs text-slate-500">常に記録されます</div>
						</div>

						{settings.morningWeight && (
							<div className="p-3 bg-green-50 rounded-lg border border-green-100">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium text-green-700">
										朝の体重
									</span>
									<span className="text-sm text-green-800">72.1kg</span>
								</div>
								<div className="text-xs text-green-600">
									有効 - 別ラインで表示されます
								</div>
							</div>
						)}

						{settings.eveningWeight && (
							<div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium text-purple-700">
										夜の体重
									</span>
									<span className="text-sm text-purple-800">72.9kg</span>
								</div>
								<div className="text-xs text-purple-600">
									有効 - 別ラインで表示されます
								</div>
							</div>
						)}
					</div>
				</Card>

				{/* 注意事項 */}
				<Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
					<h3 className="font-medium text-blue-800 mb-2">💡 使い方のヒント</h3>
					<div className="text-sm text-blue-700 space-y-2">
						<p>
							• <strong>朝の体重</strong>: より正確な体重変化を把握したい場合
						</p>
						<p>
							• <strong>夜の体重</strong>: 1日の体重変動を確認したい場合
						</p>
					</div>
				</Card>
			</div>
		</div>
	);
}
