import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/server/auth/is-authenticated';
import { LandingPage } from '@/components/layout/landing-page';

export default async function HomePage() {
  try {
    const authenticated = await isAuthenticated();

    // Handle authentication check
    if (authenticated) {
      // Use return before redirect to prevent React state updates
      return redirect('/dashboard');
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LandingPage />
      </Suspense>
    );
  } catch (error) {
    // Only log non-redirect errors
    if (!(error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      console.error('Authentication check failed:', error);
    }
    return <ErrorComponent />;
  }
}

function LoadingSpinner() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent' />
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Something went wrong</h2>
      <p className='mt-2 text-gray-600 dark:text-gray-300'>Please try refreshing the page</p>
    </div>
  );
}
