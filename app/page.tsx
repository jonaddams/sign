'use client';
import AppShell from '@/components/app-shell';
import PageContent from '@/components/page-content';
import Link from 'next/link';
import { HomeIcon, DocumentTextIcon, DocumentDuplicateIcon, InboxIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <AppShell>
      <PageContent title='Home'>
        <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
          <h1 className='text-4xl font-bold tracking-tight'>Welcome to Nutrient Sign</h1>
          <p className='mt-4 text-lg text-zinc-600 dark:text-zinc-400'>Your digital document signing solution</p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 w-full max-w-4xl'>
            <Link href='/dashboard' className='p-6 border rounded-lg hover:border-blue-500 transition-colors'>
              <HomeIcon className='h-6 w-6 mb-2 mx-auto text-blue-500' />
              <h2 className='text-xl font-semibold mb-2'>Dashboard</h2>
              <p className='text-sm text-zinc-600 dark:text-zinc-400'>View your signing activity</p>
            </Link>
            <Link href='/documents' className='p-6 border rounded-lg hover:border-blue-500 transition-colors'>
              <DocumentTextIcon className='h-6 w-6 mb-2 mx-auto text-green-500' />
              <h2 className='text-xl font-semibold mb-2'>Documents</h2>
              <p className='text-sm text-zinc-600 dark:text-zinc-400'>Manage your documents</p>
            </Link>
            <Link href='/templates' className='p-6 border rounded-lg hover:border-blue-500 transition-colors'>
              <DocumentDuplicateIcon className='h-6 w-6 mb-2 mx-auto text-purple-500' />
              <h2 className='text-xl font-semibold mb-2'>Templates</h2>
              <p className='text-sm text-zinc-600 dark:text-zinc-400'>Create templates</p>
            </Link>
            <Link href='/inbox' className='p-6 border rounded-lg hover:border-blue-500 transition-colors'>
              <InboxIcon className='h-6 w-6 mb-2 mx-auto text-orange-500' />
              <h2 className='text-xl font-semibold mb-2'>Inbox</h2>
              <p className='text-sm text-zinc-600 dark:text-zinc-400'>Review pending documents</p>
            </Link>
          </div>
        </div>
      </PageContent>
    </AppShell>
  );
}
