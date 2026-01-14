# Next Session Plan - Document Signing Workflow Completion

## Session Date: January 14, 2026

---

## What Was Accomplished Today (January 13, 2026)

### ✅ Infrastructure Migration
- Migrated AWS S3 from personal to company bucket (`nutrient-sign-app`)
- Migrated database from AWS RDS to Vercel Postgres (Neon)
- All 12 database tables created and tested
- User account created via Google OAuth

### ✅ Security Hardening (Phase 1)
- **Fixed 5 critical vulnerabilities**:
  1. Authorization bypass in template/document routes
  2. Dangerous email account linking removed
  3. File upload security (50MB limit, type whitelist)
  4. Open redirect vulnerability in middleware
  5. Environment variable standardization
- Removed unused dependencies (net, perf_hooks, tls, @types packages)

### ✅ Application Cleanup
- Removed 12 demo pages (chat, meetings, invoices, etc.)
- Simplified auth to Google and Microsoft OAuth only
- Streamlined navigation to core features
- 18 pages (down from 32)

### ✅ Next.js 16 Migration (Phase 2)
- Created layout-based authentication
- Moved protected routes to (protected) route group
- Simplified middleware to cache headers only
- Fixed Next.js 15+ async params
- Consolidated next.config.mjs

### ✅ Code Quality (Phase 3)
- Fixed React hooks infinite loop in RecipientConfig
- Created centralized logger utility
- Improved useEffect dependency arrays

### ✅ File Upload System
- Implemented presigned URL uploads (bypasses Vercel 4.5MB limit)
- Configured S3 CORS for direct browser uploads
- Template upload and viewing working end-to-end

### ✅ Core APIs Implemented
- **POST/GET /api/documents** - Document CRUD
- **POST/GET /api/documents/[id]/fields** - Field annotations
- **POST/GET /api/documents/[id]/recipients** - Participant management
- **Email Service** - SendGrid wrapper (ready to activate)

---

## Current Application Status

### What's Working
- ✅ Authentication (Google/Microsoft OAuth)
- ✅ Template management (upload, view, download, delete)
- ✅ 5-step document workflow UI (all steps complete)
- ✅ Secure file uploads to S3
- ✅ Database with proper schema

### What's Incomplete
- ❌ Document workflow not connected to backend APIs
- ❌ Email notifications not sending (SendGrid needs activation)
- ❌ Recipient signing interface doesn't exist
- ❌ Document status tracking not implemented
- ❌ Audit logging not populated

---

## Tomorrow's Implementation Plan

### Priority 1: Connect UI to Backend APIs

#### 1.1 Update DocumentFlowContext to Save Document
**File**: `app/(protected)/documents/context/DocumentFlowContext.tsx`

**What to do**:
- When user completes Step 1 (DocumentSelection), call POST /api/documents
- Save document ID to context state
- Use this ID for subsequent API calls

**API Call**:
```typescript
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: state.document.name,
    documentFilePath: state.document.url,
    templateId: state.selectedTemplate?.id,
    expiresAt: state.document.expirationDate,
    size: state.document.size,
  }),
});
const { document } = await response.json();
// Save document.id to state
```

#### 1.2 Save Recipients When Step 2 Completes
**File**: `app/(protected)/documents/components/steps/RecipientConfig.tsx` or DocumentFlowContext

**What to do**:
- When navigating from Step 2 to Step 3, save recipients
- Call POST /api/documents/[id]/recipients with state.recipients

**API Call**:
```typescript
await fetch(`/api/documents/${documentId}/recipients`, {
  method: 'POST',
  body: JSON.stringify({ recipients: state.recipients }),
});
```

#### 1.3 Save Field Annotations When Step 3 Completes
**File**: `app/(protected)/documents/context/FormPlacementContext.tsx`

**What to do**:
- When user finishes placing fields, save to database
- Call POST /api/documents/[id]/fields with field data

**API Call**:
```typescript
await fetch(`/api/documents/${documentId}/fields`, {
  method: 'POST',
  body: JSON.stringify({
    annotationData: {
      fields: state.fields,
      recipientFieldCounts: state.recipientFieldCounts,
    },
  }),
});
```

### Priority 2: Complete Document Sending Workflow

#### 2.1 Update /api/documents/[id]/send
**File**: `app/api/documents/[id]/send/route.ts` (lines 48-52 have TODOs)

**What to implement**:
```typescript
// 1. Get email customization from request body
const { emailSubject, emailMessage } = await request.json();

// 2. Fetch document with participants
const participants = await db.query.documentParticipants.findMany({
  where: eq(documentParticipants.documentId, documentId),
  orderBy: asc(documentParticipants.signingOrder),
});

// 3. Create signature requests for each signer
for (const participant of participants) {
  if (participant.accessLevel === 'SIGNER') {
    await db.insert(signatureRequests).values({
      id: crypto.randomUUID(),
      documentId,
      participantId: participant.id,
      status: 'PENDING',
      signatureType: 'ELECTRONIC',
      requestedAt: new Date(),
    });
  }
}

// 4. Generate secure access tokens for each participant
// Use crypto.randomUUID() or JWT

// 5. Send emails to recipients (if SendGrid configured)
import { sendEmail, generateSigningEmail } from '@/lib/email-service';

for (const participant of participants.filter(p => p.signingOrder === 0)) {
  const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${accessToken}`;
  const emailHtml = generateSigningEmail({
    recipientName: participant.name,
    senderName: session.user.name,
    documentName: document.name,
    signingUrl,
    message: emailMessage,
    expiresAt: document.expiresAt,
  });

  await sendEmail({
    to: participant.email,
    subject: emailSubject,
    html: emailHtml,
  });
}

// 6. Update document status to PENDING
await db.update(documents)
  .set({ status: 'PENDING', updatedAt: new Date() })
  .where(eq(documents.id, documentId));

// 7. Create audit log entry
await db.insert(documentAuditLog).values({
  id: crypto.randomUUID(),
  documentId,
  userId: session.user.id,
  action: 'DOCUMENT_SENT',
  details: { recipientCount: participants.length },
  createdAt: new Date(),
});
```

### Priority 3: Create Recipient Signing Interface

#### 3.1 Create /sign/[token] Route
**Create**: `app/sign/[token]/page.tsx`

**What to do**:
- Verify access token
- Display document in Nutrient Viewer
- Show signature fields for this recipient
- Allow signature capture
- Submit signed document

**Structure**:
```typescript
export default async function SignDocumentPage({ params }) {
  const { token } = await params;

  // Verify token and get participant info
  // Load document from S3
  // Show Nutrient Viewer with signing tools enabled
  // On sign, update signature_requests table
  // Mark document as SIGNED for this participant
  // Check if all required signatures complete
}
```

### Priority 4: Dashboard & Inbox

#### 4.1 Update Dashboard
**File**: `app/(protected)/dashboard/page.tsx`

**What to do**:
- Replace mock data with real documents from database
- Show document status (DRAFT, PENDING, COMPLETED)
- Display recent activity from audit log

#### 4.2 Update Inbox
**File**: `app/(protected)/inbox/page.tsx`

**What to do**:
- Show documents user needs to sign
- Query documentParticipants where userId = session.user.id
- Filter by PENDING status
- Link to signing interface

---

## Technical Notes for Tomorrow

### Environment Variables Needed
- Add to Vercel: `NEXT_PUBLIC_APP_URL` (e.g., `https://sign-sage.vercel.app`)
- SendGrid: Reactivate account and update `AUTH_SENDGRID_KEY`

### Database Schema Reminders
```
documents:
  - id, name, ownerId, documentFilePath, expiresAt, size

documentParticipants:
  - id, documentId, userId, accessLevel, signingOrder, isRequired

documentAnnotations:
  - id, documentId, creatorId, annotationData (JSONB), isFinalized

signatureRequests:
  - id, documentId, participantId, status, signatureType, requestedAt, signedAt

documentAuditLog:
  - id, documentId, userId, action, details (JSONB), createdAt, ipAddress
```

### API Endpoints Available
- ✅ POST /api/documents - Create document
- ✅ GET /api/documents - List user's documents
- ✅ POST /api/documents/[id]/fields - Save field placements
- ✅ GET /api/documents/[id]/fields - Get field placements
- ✅ POST /api/documents/[id]/recipients - Add recipients
- ✅ GET /api/documents/[id]/recipients - Get recipients
- ⚠️ POST /api/documents/[id]/send - Partially complete (needs email integration)
- ❌ POST /api/sign - Sign document (needs to be created)

### Current Workflow State
The 5-step UI workflow is complete:
1. ✅ Document Selection - UI done
2. ✅ Recipient Configuration - UI done
3. ✅ Field Placement - UI done (Nutrient Viewer integration)
4. ✅ Email Customization - UI done
5. ✅ Review & Send - UI done

**Gap**: Steps don't persist data to database as user progresses

---

## Implementation Checklist for Tomorrow

### Phase 1: Backend Integration (2-3 hours)
- [ ] Update DocumentFlowContext to call POST /api/documents
- [ ] Save document ID to context state
- [ ] Call POST /api/documents/[id]/recipients after Step 2
- [ ] Call POST /api/documents/[id]/fields after Step 3
- [ ] Complete /api/documents/[id]/send with all TODOs
- [ ] Add audit logging to send endpoint

### Phase 2: Email Integration (1 hour)
- [ ] Reactivate SendGrid account or create new one
- [ ] Update AUTH_SENDGRID_KEY in Vercel
- [ ] Test email sending locally
- [ ] Verify email delivery in production

### Phase 3: Recipient Signing (2-3 hours)
- [ ] Create /sign/[token] route
- [ ] Implement token generation and verification
- [ ] Build Nutrient Viewer signing interface
- [ ] Implement signature capture (draw/type/upload)
- [ ] Save signatures to signatureRequests table
- [ ] Update document status when complete

### Phase 4: Dashboard & Inbox (1-2 hours)
- [ ] Connect dashboard to real document data
- [ ] Show document status and metrics
- [ ] Implement inbox with documents to sign
- [ ] Add filtering and search

### Phase 5: Testing & Polish (1-2 hours)
- [ ] Test complete workflow end-to-end
- [ ] Verify multi-user scenarios
- [ ] Test signing order (sequential vs parallel)
- [ ] Check audit logging
- [ ] Test email notifications

**Total Estimated Time: 7-11 hours**

---

## Quick Start Commands for Tomorrow

```bash
# Start development server
pnpm dev

# Check git status
git status

# View recent commits
git log --oneline -10

# Check database tables
node -e "
const postgres = require('postgres');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = postgres(process.env.DATABASE_URL);
(async () => {
  const tables = await client\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name\`;
  console.table(tables);
  await client.end();
})();
"

# Test API endpoints
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Doc","documentFilePath":"https://..."}'
```

---

## Important Files to Reference

### Context & State Management
- `app/(protected)/documents/context/DocumentFlowContext.tsx` - Main workflow state
- `app/(protected)/documents/context/FormPlacementContext.tsx` - Field placement state

### API Routes to Complete
- `app/api/documents/[id]/send/route.ts` - Lines 48-52 have TODOs

### Database Schema
- `database/drizzle/document-signing-schema.ts` - All table definitions

### Configuration
- `.env.local` - Local environment variables
- Vercel Dashboard - Production environment variables

---

## Known Issues to Address

1. **SendGrid Account**: Trial expired - need to reactivate or create new account
2. **Access Tokens**: Need to implement secure token generation for signing URLs
3. **Document Status Enum**: Not being used yet (DRAFT, PENDING, IN_PROGRESS, COMPLETED, DECLINED)
4. **Audit Logging**: Table exists but not being populated
5. **Notification Tracking**: Table exists but email delivery not tracked

---

## Success Criteria

When tomorrow's work is complete, the application should:
- ✅ Allow users to create and send documents through the 5-step flow
- ✅ Save all data (documents, fields, recipients) to database
- ✅ Send email notifications to recipients (when SendGrid active)
- ✅ Allow recipients to view and sign documents
- ✅ Track signing status and completion
- ✅ Create audit trail for compliance
- ✅ Work end-to-end as a DocuSign alternative

---

## Resources

- [Project Plan](./project-plan.md) - Original project vision
- [Memory File](./memory.md) - Development history
- [Security Review Plan](../.claude/plans/declarative-puzzling-shamir.md) - Security audit details
- [Nutrient SDK Docs](https://nutrient.io/docs/) - For signing implementation

---

## Git Status

**Current Branch**: main
**Last Commit**: 1003ecb - feat: implement core document signing workflow APIs
**Commits Today**: 20
**Files Changed**: ~150

**Recent Commits**:
```
1003ecb feat: implement core document signing workflow APIs
e85ffb9 refactor: fix React hooks and add logging utility (Phase 3)
1dc11d9 refactor: migrate to layout-based authentication (Phase 2)
326741d fix: update .env.sample with correct S3 bucket variable name
d73e203 refactor: standardize S3 bucket environment variable name
72f0c63 feat: implement presigned URL uploads to bypass Vercel limits
90f4c0a security: fix critical security vulnerabilities (Phase 1)
1b5d930 refactor: remove demo pages and focus on document signing
31a7a4a refactor: simplify authentication to enterprise OAuth only
61fdd5d chore: migrate infrastructure and update dependencies
```

---

## Developer Notes

### S3 Configuration
- Bucket: `nutrient-sign-app`
- Region: `us-east-1`
- CORS: Configured for all origins (*)
- URL Style: Virtual-hosted (bucket-name.s3.region.amazonaws.com)

### Database
- Type: Vercel Postgres (Neon)
- Connection: Pooled via DATABASE_URL
- User: neondb_owner
- Endpoint: ep-snowy-union-ah4y87es

### Vercel Deployment
- Project: sign-sage
- URL: https://sign-sage.vercel.app
- Auto-deploys on git push to main
- Environment variables configured

---

## Questions to Address Tomorrow

1. Should we make the old /api/upload route a fallback, or remove it entirely?
2. Do we want to implement document drafts (save partial progress)?
3. Should archive/trash be soft deletes or hard deletes?
4. Do we need document version history?
5. Should we add rate limiting to prevent abuse?

---

## End of Session Summary

**Time Spent**: ~4 hours
**Lines Added**: ~1,500
**Lines Removed**: ~1,500
**Net Change**: Security hardening, infrastructure migration, code cleanup

**Application is now**: Secure, clean, and ready for feature completion!
