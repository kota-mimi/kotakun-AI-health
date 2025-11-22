import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-6">
            <Link 
              href="/privacy" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              利用規約
            </Link>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2025 ヘルシーくん ヘルスケアサービス. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              本サービスは医療行為ではありません。健康上の問題がある場合は医師にご相談ください。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}