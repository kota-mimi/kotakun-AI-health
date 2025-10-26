import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="space-y-6">
          {/* キャンセルアイコン */}
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle size={32} className="text-orange-600" />
          </div>
          
          {/* メッセージ */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">
              お支払いをキャンセルしました
            </h1>
            <p className="text-gray-600">
              プランのアップグレードはキャンセルされました。<br />
              いつでも再度お申し込みいただけます。
            </p>
          </div>
          
          {/* アクションボタン */}
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => window.history.back()}
            >
              <RefreshCw size={16} className="mr-2" />
              プラン選択に戻る
            </Button>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft size={16} className="mr-2" />
              アプリに戻る
            </Button>
          </div>
          
          {/* サポート情報 */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>ご不明な点やお困りのことがございましたら</p>
            <p>サポートまでお気軽にお問い合わせください</p>
          </div>
        </div>
      </Card>
    </div>
  );
}