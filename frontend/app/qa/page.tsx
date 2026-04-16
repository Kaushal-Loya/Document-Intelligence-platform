import { Suspense } from 'react';
import QAPage from '@/app/qa/QAClient';
import { Loader2 } from 'lucide-react';

export default function QARoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    }>
      <QAPage />
    </Suspense>
  );
}
