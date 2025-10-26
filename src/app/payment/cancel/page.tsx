'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2 text-orange-600">
          決済がキャンセルされました
        </h1>
        <p className="text-gray-600 mb-6">
          お支払い手続きがキャンセルされました。
          <br />
          いつでも再度お試しいただけます。
        </p>
        <div className="space-y-2">
          <Button 
            onClick={() => window.location.href = '/settings'}
            className="w-full"
          >
            プラン選択に戻る
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            ホームに戻る
          </Button>
        </div>
      </Card>
    </div>
  );
}