'use client';

import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import DocumentFlow from './components/DocumentFlow';
import DocumentSelection from './components/steps/DocumentSelection';
import RecipientConfig from './components/steps/RecipientConfig';
import FieldPlacement from './components/steps/FieldPlacement';
import { useDocumentFlow } from './context/DocumentFlowContext';

// Step renderer that shows the appropriate step based on the current step number
function StepRenderer() {
  const { state } = useDocumentFlow();

  switch (state.currentStep) {
    case 1:
      return <DocumentSelection />;
    case 2:
      return <RecipientConfig />;
    case 3:
      return <FieldPlacement />;
    case 4:
      // We'll implement this in a future increment
      return (
        <div className='space-y-6'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Email Customization</h2>
            <p className='text-muted-foreground mt-2 text-sm'>Customize the email message that will be sent to recipients.</p>
          </div>
          <div className='rounded-md bg-gray-50 p-8 text-center dark:bg-zinc-800/50'>
            <p className='text-muted-foreground'>Email customization functionality will be implemented in a future update.</p>
          </div>
        </div>
      );
    case 5:
      // We'll implement this in a future increment
      return (
        <div className='space-y-6'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Review & Send</h2>
            <p className='text-muted-foreground mt-2 text-sm'>Review your document and send it to recipients.</p>
          </div>
          <div className='rounded-md bg-gray-50 p-8 text-center dark:bg-zinc-800/50'>
            <p className='text-muted-foreground'>Review and send functionality will be implemented in a future update.</p>
          </div>
        </div>
      );
    default:
      return <DocumentSelection />;
  }
}

export default function DocumentsPage() {
  return (
    <PageLayout>
      <PageContent title='Send for Signature' description='Upload a document or use a template to send for electronic signature'>
        <DocumentFlow>
          <StepRenderer />
        </DocumentFlow>
      </PageContent>
    </PageLayout>
  );
}
