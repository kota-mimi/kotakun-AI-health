import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportData: () => string | null;
  onImportData: (data: string) => boolean;
  onClearAllData: () => void;
}

export function DataManagementModal({ 
  isOpen, 
  onClose, 
  onExportData, 
  onImportData, 
  onClearAllData 
}: DataManagementModalProps) {
  const [importText, setImportText] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    const data = onExportData();
    if (data) {
      // データをダウンロード
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('success', 'データをエクスポートしました');
    } else {
      showNotification('error', 'エクスポートに失敗しました');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      showNotification('error', 'インポートするデータを入力してください');
      return;
    }

    const success = onImportData(importText);
    if (success) {
      showNotification('success', 'データをインポートしました');
      setImportText('');
    } else {
      showNotification('error', 'インポートに失敗しました。データ形式を確認してください');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (window.confirm('すべてのデータを削除してもよろしいですか？\nこの操作は取り消せません。')) {
      onClearAllData();
      showNotification('success', 'すべてのデータを削除しました');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
           onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">データ管理</h2>
            <p className="text-sm text-gray-600 mt-1">データのバックアップ・復元・削除</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 通知 */}
        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* データエクスポート */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Download className="h-5 w-5 text-health-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">データエクスポート</h3>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  すべてのデータをJSONファイルとしてダウンロードします
                </p>
                <Button onClick={handleExport} size="sm" className="bg-health-primary hover:bg-health-primary-dark">
                  エクスポート
                </Button>
              </div>
            </div>
          </Card>

          {/* データインポート */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">データインポート</h3>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  バックアップファイルからデータを復元します
                </p>
                
                {/* ファイル選択 */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>

                {/* テキスト入力 */}
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="またはバックアップデータ（JSON）を貼り付けてください..."
                  className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-health-primary/20 focus:border-health-primary"
                />
                
                <Button 
                  onClick={handleImport} 
                  size="sm" 
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  disabled={!importText.trim()}
                >
                  インポート
                </Button>
              </div>
            </div>
          </Card>

          {/* データ削除 */}
          <Card className="p-4 border-red-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">すべてのデータを削除</h3>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  ⚠️ この操作は取り消せません。必要に応じて事前にエクスポートしてください。
                </p>
                <Button 
                  onClick={handleClearData} 
                  size="sm" 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  すべてのデータを削除
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-gray-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}