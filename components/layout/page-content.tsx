import type { ReactNode } from 'react';

interface PageContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PageContent({ title, description, children }: PageContentProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex w-full flex-col items-start justify-start bg-transparent p-2 sm:p-4">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">{title}</h1>
        {description && <p className="mb-6 text-zinc-600 dark:text-zinc-400">{description}</p>}
        <div className="w-full">
          {children || (
            <div className="rounded-xl border-2 border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="text-zinc-600 dark:text-zinc-400">This page is under construction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
