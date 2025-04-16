'use client';

import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import DocumentFlow from './components/DocumentFlow';
import DocumentSelection from './components/steps/DocumentSelection';
import { useDocumentFlow } from './context/DocumentFlowContext';

// Step renderer that shows the appropriate step based on the current step number
function StepRenderer() {
  const { state } = useDocumentFlow();
  
  switch (state.currentStep) {
    case 1:
      return <DocumentSelection />;
    case 2:
      // We'll implement this in the next increment
      return <div>Recipients step will go here</div>;
    case 3:
      // We'll implement this in a future increment
      return <div>Field placement step will go here</div>;
    case 4:
      // We'll implement this in a future increment
      return <div>Email customization step will go here</div>;
    case 5:
      // We'll implement this in a future increment
      return <div>Review and send step will go here</div>;
    default:
      return <DocumentSelection />;
  }
}

export default function DocumentsPage() {
  return (
    <PageLayout>
      <PageContent 
        title="Send for Signature" 
        description="Upload a document or use a template to send for electronic signature"
      >
        <DocumentFlow>
          <StepRenderer />
        </DocumentFlow>
      </PageContent>
    </PageLayout>
  );
}
