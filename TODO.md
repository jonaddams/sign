Multiple Toast UIs

Integrations:
Teams
GDrive



Create a document upload service for an AWS S3 bucket in my Next.js React application. The implementation should include:

API Component:
- Create a Next.js API route handler for file uploads to AWS S3
- Implement AWS S3 authentication using environment variables from .env.local (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME)
- Add server-side validation for:
  - File size limit of 200MB
  - Appropriate file types (common document formats)
  - Malformed requests
- Return appropriate status codes and error messages
- Structure the response to include the file URL, name, and metadata

UI Components:
1. Upload Component:
- Create a React component for file selection and upload
- Use the "Upload Document" button in the /app/documents/page.tsx file to initiate the upload
- Add client-side validation mirroring server-side checks
- Show upload progress
- Display success/error messages
- Follow the application's existing design patterns

2. Document Listing Component:
- Extend the existing /app/documents/page.tsx to display uploaded files
- Include functionality to preview and download documents using the "lucide-eye" and "lucide-download" icons that already exist in /app/documents/page.tsx 
- Display relevant metadata (file name, upload date, size)
- Implement UI for potential delete functionality

Technical Requirements:
- Use React hooks for state management
- Follow Next.js 13+ App Router conventions
- Implement proper error handling throughout
- Use TypeScript for type safety
- Ensure the solution is responsive and accessible
- Files should be private and associated with the current user

Notes:
- The database integration for associating files with users will be implemented separately
- For now, focus on the upload, storage, and retrieval functionality
- Follow best practices for secure file handling

