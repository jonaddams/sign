import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';

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
