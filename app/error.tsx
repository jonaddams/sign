'use client';
import PageLayout from '@/components/layout/page-layout';
import PageContent from '@/components/layout/page-content';

export default function ErrorPage() {
  return (
    <PageLayout>
      <PageContent title='Error' description='Something went wrong'>
        <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
          <h1 className='text-4xl font-bold tracking-tight text-red-600'>Error</h1>
          <p className='mt-4 text-lg text-zinc-600 dark:text-zinc-400'>Something went wrong. Please try again later.</p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
