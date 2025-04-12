import PageLayout from '@/components/layout/page-layout';
import PageContent from '@/components/layout/page-content';

interface SimplePageProps {
  title: string;
  description?: string;
}

export default function SimplePage({ title, description }: SimplePageProps) {
  return (
    <PageLayout>
      <PageContent title={title} description={description}>
        {/* Page content goes here */}
      </PageContent>
    </PageLayout>
  );
}
