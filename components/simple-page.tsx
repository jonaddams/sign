import AppShell from '@/components/app-shell';
import PageContent from '@/components/page-content';

interface SimplePageProps {
  title: string;
  description?: string;
}

export default function SimplePage({ title, description }: SimplePageProps) {
  return (
    <AppShell>
      <PageContent title={title} description={description}>
        {/* Page content goes here */}
      </PageContent>
    </AppShell>
  );
}
