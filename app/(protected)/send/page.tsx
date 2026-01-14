'use client';

import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import DocumentFlow from './components/DocumentFlow';
import DocumentSelection from './components/steps/DocumentSelection';
import EmailCustomization from './components/steps/EmailCustomization';
import FieldPlacement from './components/steps/FieldPlacement';
import RecipientConfig from './components/steps/RecipientConfig';
import ReviewAndSend from './components/steps/ReviewAndSend';

// Send for Signature workflow page
export default function SendPage() {
  return (
    <PageLayout>
      <PageContent
        title="Send for Signature"
        description="Upload a document or use a template to send for electronic signature"
      >
        <DocumentFlow>
          {/* The Step content will be rendered by DocumentFlow based on the current step */}
          {(state) => {
            // Render the appropriate component based on the current step
            switch (state.currentStep) {
              case 1:
                return <DocumentSelection />;
              case 2:
                return <RecipientConfig />;
              case 3:
                return <FieldPlacement />;
              case 4:
                return <EmailCustomization />;
              case 5:
                return <ReviewAndSend />;
              default:
                return <DocumentSelection />;
            }
          }}
        </DocumentFlow>
      </PageContent>
    </PageLayout>
  );
}
