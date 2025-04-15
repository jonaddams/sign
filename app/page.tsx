import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/server/auth/is-authenticated';
import { LandingPage } from '@/components/layout/landing-page';
import { headers } from 'next/headers';

export default async function HomePage() {
  // Get headers to ensure we're on the server side
  headers();

  try {
    const authenticated = await isAuthenticated();
    console.log('Server authentication check:', authenticated);

    if (authenticated) {
      redirect('/dashboard');
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LandingPage />
      </Suspense>
    );
  } catch (error) {
    // Check if it's a redirect error
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // Let Next.js handle the redirect
      throw error;
    }

    console.error('Authentication check failed:', error);
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
