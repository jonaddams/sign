# Sign Application - Memory File

This file serves as a memory document to maintain context throughout the development of the Sign electronic signature application.

## Current Status Update (April 16, 2025)

- Project plan is fully documented
- Component structure for the documents route has been designed and initial implementation is complete
- DocumentFlowContext and basic multi-step navigation is implemented
- Step 1 (Document Selection/Upload) with template saving functionality is complete
- Currently working on Step 2 (Recipient Configuration)
- API endpoint requirements are identified
- Implementation schedule is being followed according to plan

## Current Status Update (April 23, 2025)

- Project plan is fully documented
- Component structure for the documents route has been designed and initial implementation is complete
- DocumentFlowContext and basic multi-step navigation is implemented
- Step 1 (Document Selection/Upload) with template saving functionality is complete
- Step 2 (Recipient Configuration) with signer order functionality is implemented
- Working on adding document expiration dates feature to DocumentSelection step
- Database modifications for document expiration are in progress
- API endpoint requirements are identified and being implemented
- Implementation schedule is being followed according to plan

## Nutrient.io SDK Integration

### Key Features

1. **Document Viewing**: The application uses Nutrient.io Web SDK for document viewing functionality.

2. **Electronic Signatures**: The SDK provides tools for capturing and applying electronic signatures to documents.

3. **Digital Signatures**: Nutrient's API will be used for cryptographic digital signatures.

4. **Co-Pilot Integration**: The Nutrient.io SDK includes an AI co-pilot that can be accessed by mentioning `@nutrient-copilot` within the application. This
   feature allows users to ask questions about document handling, signature requirements, or get assistance with using the application.

## Implementation Notes

- The templates route is already functional, allowing users to upload documents that can be reused.
- We need to ensure the Co-Pilot feature is properly integrated throughout the signature workflow.

## Compliance Requirements

- The application must comply with ESIGN Act, eIDAS, and other electronic signature regulations.
- Nutrient.io's signature API provides the cryptographic verification needed for legal compliance.

## Development Timeline

- Focus on signature workflow implementation as the next priority.
- Ensure proper integration of all Nutrient.io SDK features.

## Documents Route Implementation Requirements

### Multi-Step Flow

- Implement a multi-step UI with progress indicator at the top
- Allow forward navigation only when requirements are met
- Allow backward navigation at any time

### Steps:

1. **Document Selection/Upload**

   - Choose from existing templates
   - Upload a new document
   - Option to save new uploads as templates
   - Set document expiration date

2. **Recipient Configuration**

   - Add recipient name and email
   - Specify recipient type (signer, viewer, copy recipient)
   - Option for sender to also sign
   - Option to be the only signer
   - Set signing order (sequential or parallel)
   - Set deadlines for individual signers

3. **Field Placement via Nutrient Viewer**

   - Drag and drop interface for field placement
   - Field types from Nutrient Viewer:
     - Signature fields
     - Date fields
     - Initial fields
     - Text fields
     - Checkboxes
     - Dropdown menus
   - Include field validation rules
   - Field labels for signer context

4. **Email Customization**

   - Subject line input
   - Email message body input
   - Email preview functionality

5. **Review & Send**
   - Document preview with fields
   - Recipient summary
   - Send functionality

### Future Enhancements (Post-Initial Release)

- Reminder scheduling for unsigned documents
- Document tags/categories for organization
- Search/filter functionality for templates
- Template thumbnails in grid view
- "Required" vs "optional" field designation
- Email templates for common scenarios
- Dynamic placeholders in email templates (e.g., {{recipient_name}})
- Branding customization in emails
- Multiple language support
- Scheduled email sending
- Real-time notifications for signature events
- Integration with document storage systems
- Field grouping for complex forms
- Conditional fields

## Implementation Progress and Resume Points

### Current Status (as of April 16, 2025)

- Basic multi-step framework set up and functional
- `DocumentFlowContext.tsx` implemented with state management
- `StepIndicator.tsx` and `NavigationControls.tsx` implemented
- `DocumentFlow.tsx` container component with next/back navigation logic
- Document Selection (Step 1) completed with template saving functionality
- Currently working on Step 2: Recipient Configuration

### Next Implementation Steps

1. ✅ Create the `DocumentFlowContext.tsx` file with state management
2. ✅ Implement the basic multi-step navigation framework
3. ✅ Build the step indicator component
4. ✅ Create the document selection step
5. ✅ Integrate with existing file upload functionality
6. 🔄 Implement the Recipient Configuration component
7. Create the field placement integration with Nutrient Viewer
8. Build the email customization step
9. Implement the review and send functionality

### Today's Tasks (April 16, 2025)

- Complete the `RecipientConfig.tsx` component
- Implement recipient type selection (signer, viewer, copy recipient)
- Add functionality for setting signing order (sequential or parallel)
- Implement deadline setting for signatures
- Ensure proper validation for recipient information

### Today's Tasks (April 23, 2025)

- Add document expiration date field to DocumentSelection component
- Modify database schema to add expires_at column to documents table
- Create migration for the new column
- Implement API endpoints for managing document expiration
- Complete validation for expiration dates
- Create background job for processing expired documents
- Update document status API to include expiration information
- Ensure proper integration with the signer order functionality

### Resume Points

- After completing the state management setup, we can pause and resume with the UI components
- After completing the document selection step, we can pause and resume with recipient configuration
- After completing recipient configuration, we can pause and resume with field placement
- After completing field placement integration with Nutrient Viewer, we can pause and resume with email customization
- After completing the email customization step, we can pause and resume with the review and send functionality

### Component Dependencies

- Need to implement `DocumentFlowContext` before any step components
- Need to implement `StepIndicator` and `NavigationControls` before working on individual steps
- Field placement step depends on proper integration with Nutrient Viewer SDK

## Feature Implementation Details

### Signer Order Implementation

The signer order feature allows documents to be signed in sequential order (one after another) or in parallel (all at once). This feature is already supported
by the current database structure:

- The `document_participants` table has a `signing_order` column (integer field)
- The UI for configuring signing order is implemented in `RecipientConfig.tsx`
- Sequential signing requires:
  - Only sending to the first signer initially
  - Upon completion, sending to the next signer in order
  - Tracking progress through the signing workflow

### Document Expiration Implementation

Document expiration allows setting a date after which the document can no longer be signed. Implementation includes:

- Adding an `expires_at` timestamp column to the `documents` table
- Adding expiration date field to the Document Selection UI
- Creating validation to ensure expiration date is after all signer deadlines
- Implementing backend logic to:
  - Check document status against expiration date
  - Mark documents as expired when the date passes
  - Prevent further signing of expired documents
  - Send notifications when documents are approaching expiration

Both features enhance the document signing workflow and improve user control over the signing process.
