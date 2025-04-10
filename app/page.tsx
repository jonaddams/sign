'use client';
import AppShell from '@/components/app-shell';
import PageContent from '@/components/page-content';

export default function HomePage() {
  return (
    <AppShell>
      <PageContent title='Home' description='Welcome to Nutrient Sign'>
        <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
          <h1 className='text-4xl font-bold tracking-tight'>Welcome to Nutrient Sign</h1>
          <p className='mt-4 text-lg text-zinc-600 dark:text-zinc-400'>Your digital document signing solution</p>
        </div>
      </PageContent>
    </AppShell>
  );
}
