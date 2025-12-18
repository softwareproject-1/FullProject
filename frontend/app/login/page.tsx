'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a redirect page - all login should go through /auth/login
export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4" />
        <p className="text-slate-500">Redirecting to login...</p>
      </div>
    </div>
  );
}
