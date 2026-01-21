# InstantJSON Refactor Implementation Plan

**Date:** January 20, 2026
**Reference:** `/Users/jonaddamsnutrient/SE/code/signing-demo-localhost`
**Goal:** Use Nutrient's InstantJSON for perfect field placement fidelity

---

## Current vs. Proposed Architecture

### Current Approach (Manual Field Creation)
```
/send route:
1. User places fields in viewer
2. Extract coordinates, size, type from each field
3. Save to database as JSON array: { fields: [{ position, size, type, ... }] }

/sign route:
1. Load field data from database
2. Manually create WidgetAnnotation for each field
3. Manually create FormField for each field
4. Set permissions via separate useEffect
```

**Problems:**
- ❌ Coordinate mismatches due to viewport scaling
- ❌ Complex manual field recreation logic
- ❌ Potential property loss
- ❌ RecipientId assignment issues

### Proposed Approach (InstantJSON)
```
/send route:
1. User places fields in viewer
2. Call instance.exportInstantJSON()
3. Save InstantJSON to database

/sign route:
1. Load InstantJSON from database
2. Pass instantJSON to viewer load config
3. Viewer recreates all annotations automatically
4. Set permissions via separate useEffect (keep existing logic)
```

**Benefits:**
- ✅ Perfect position fidelity (Nutrient handles all transformations)
- ✅ Simpler code (no manual field creation)
- ✅ All annotation properties preserved
- ✅ Future-proof (works with any Nutrient annotation type)

---

## Implementation Steps

### Step 1: Update Database Schema (Optional - current schema works)

The `document_annotations` table already has `annotation_data` as JSONB.

**Current structure:**
```sql
document_annotations (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  annotation_data JSONB,  -- Currently: { fields: [...] }
  created_at TIMESTAMP,
  is_finalized BOOLEAN
)
```

**New structure (keep same schema, change content):**
```typescript
annotation_data: {
  instantJSON: any,      // Full InstantJSON from exportInstantJSON()
  fields: any[]          // Keep for backwards compatibility (optional)
}
```

**OR** (cleaner approach):
```typescript
annotation_data: any  // Just store the InstantJSON directly
```

---

### Step 2: Export InstantJSON in `/send` Route

**File:** `app/(protected)/send/components/DocumentFlow.tsx`

**Current code (line ~177-203):**
```typescript
const saveFieldAnnotations = async () => {
  // ... validation ...

  const response = await fetch(`/api/documents/${state.document.id}/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      annotationData: {
        fields: state.fields,  // ← Current approach
      },
    }),
  });
};
```

**New code:**
```typescript
const saveFieldAnnotations = async () => {
  if (!state.document.id) {
    console.error('Cannot save fields: document ID is missing');
    return;
  }

  try {
    // Get viewer instance from FieldPlacement component
    // Need to pass instance ref from FieldPlacement to DocumentFlow
    const viewerInstance = viewerInstanceRef.current;

    if (!viewerInstance) {
      console.error('Viewer instance not available');
      return;
    }

    // Export InstantJSON from viewer
    const instantJSON = await viewerInstance.exportInstantJSON();

    console.log('=== EXPORTING INSTANT JSON ===');
    console.log('Annotations count:', instantJSON?.annotations?.length || 0);
    console.log('Form fields count:', instantJSON?.formFields?.length || 0);
    console.log('============================');

    const response = await fetch(`/api/documents/${state.document.id}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annotationData: instantJSON,  // ← Save full InstantJSON
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save field annotations');
    }
  } catch (error) {
    console.error('Error saving field annotations:', error);
    toast({
      title: 'Error',
      description: 'Failed to save field placements. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};
```

**Challenge:** Need to pass viewer instance from FieldPlacement to DocumentFlow.

**Solution Options:**
1. Store instance in context
2. Pass instance ref via props
3. Store in window object (like old implementation: `document.pspdfkitInstance`)

**Recommended:** Use context (cleaner than window object).

---

### Step 3: Import InstantJSON in `/sign` Route

**File:** `app/sign/[token]/page.tsx`

**Current code (line ~148-166):**
```typescript
const instance = await safeLoadViewer({
  container: containerRef.current,
  document: proxyUrl,
  licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
  useCDN: true,
  toolbarItems: [...],
  styleSheets: ['/styles/viewer.css'],
  customRenderers: {
    Annotation: createSignatureFieldRenderer({...}),
  },
});

// Then manually create fields (lines 187-318)
for (const field of recipientFields) {
  // Manual widget creation...
  // Manual form field creation...
}
```

**New code:**
```typescript
// Check if we have InstantJSON
const instantJSON = signingData.annotations?.instantJSON || signingData.annotations;

const instance = await safeLoadViewer({
  container: containerRef.current,
  document: proxyUrl,
  licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
  useCDN: true,
  instantJSON: instantJSON,  // ← Load annotations automatically
  toolbarItems: [...],
  styleSheets: ['/styles/viewer.css'],
  customRenderers: {
    Annotation: createSignatureFieldRenderer({...}),
  },
});

// Fields are already created by instantJSON!
// Just need to update permissions (keep existing useEffect)
```

**Remove:** Lines 183-324 (manual field creation loop)

**Keep:** Lines 354-424 (permission update useEffect) - Still needed to set readOnly based on current user

---

### Step 4: Update safeLoadViewer to Support InstantJSON

**File:** `lib/nutrient-viewer.ts`

**Current signature:**
```typescript
export function safeLoadViewer(options: {
  container: HTMLElement;
  document: string;
  toolbarItems?: any[];
  licenseKey?: string;
  [key: string]: any;
}): Promise<any>
```

**No changes needed!** The `[key: string]: any` already allows `instantJSON` to be passed through.

---

### Step 5: Create Viewer Instance Context (Optional but Recommended)

**File:** `app/(protected)/send/context/ViewerInstanceContext.tsx` (new file)

```typescript
'use client';

import { createContext, useContext, useRef } from 'react';

interface ViewerInstanceContextType {
  viewerInstanceRef: React.MutableRefObject<any>;
}

const ViewerInstanceContext = createContext<ViewerInstanceContextType | null>(null);

export function ViewerInstanceProvider({ children }: { children: React.ReactNode }) {
  const viewerInstanceRef = useRef<any>(null);

  return (
    <ViewerInstanceContext.Provider value={{ viewerInstanceRef }}>
      {children}
    </ViewerInstanceContext.Provider>
  );
}

export function useViewerInstance() {
  const context = useContext(ViewerInstanceContext);
  if (!context) {
    throw new Error('useViewerInstance must be used within ViewerInstanceProvider');
  }
  return context;
}
```

**Usage in FieldPlacement.tsx:**
```typescript
const { viewerInstanceRef } = useViewerInstance();

// When creating viewer:
viewerInstanceRef.current = instance;
```

**Usage in DocumentFlow.tsx:**
```typescript
const { viewerInstanceRef } = useViewerInstance();

// In saveFieldAnnotations:
const instantJSON = await viewerInstanceRef.current?.exportInstantJSON();
```

---

## Migration Strategy

### Phase 1: Add InstantJSON Export (No Breaking Changes)
1. Export InstantJSON in `/send` route
2. Save BOTH old format AND InstantJSON to database:
   ```typescript
   annotationData: {
     fields: state.fields,        // Keep for backwards compatibility
     instantJSON: instantJSON,     // Add new format
   }
   ```
3. Test that saving works
4. Verify InstantJSON is in database

### Phase 2: Add InstantJSON Import in `/sign` Route
1. Check if `instantJSON` exists in database
2. If yes, use `instantJSON` in viewer load config
3. If no, fall back to manual field creation (current approach)
4. Test with new documents (should use InstantJSON)
5. Test with old documents (should fall back to manual creation)

### Phase 3: Remove Manual Field Creation (After Testing)
1. Once confident InstantJSON works, remove manual field creation code
2. Remove old `fields` array from save (keep only `instantJSON`)
3. Simplify `/sign` route code significantly

---

## Code Changes Summary

### Files to Modify

1. **app/(protected)/send/context/ViewerInstanceContext.tsx** (NEW)
   - Create context for sharing viewer instance

2. **app/(protected)/send/components/DocumentFlow.tsx**
   - Import useViewerInstance hook
   - In `saveFieldAnnotations()`: Export and save InstantJSON

3. **app/(protected)/send/components/steps/FieldPlacement.tsx**
   - Import useViewerInstance hook
   - Store instance in context ref: `viewerInstanceRef.current = instance`

4. **app/(protected)/send/page.tsx**
   - Wrap with `<ViewerInstanceProvider>`

5. **app/sign/[token]/page.tsx**
   - Add `instantJSON` to viewer load config
   - Remove manual field creation loop (lines 183-324)
   - Keep permission update useEffect

6. **app/api/documents/[id]/fields/route.ts** (NO CHANGES NEEDED)
   - Already accepts any JSONB data in `annotationData`

---

## Testing Plan

### Test 1: Export InstantJSON
1. Place fields in `/send` route
2. Navigate to Step 4
3. Check console for "EXPORTING INSTANT JSON"
4. Verify annotations and formFields counts
5. Check database - should have `instantJSON` in `annotation_data`

### Test 2: Import InstantJSON
1. Send document with fields
2. Navigate to `/sign` as recipient
3. Viewer should load with all fields in correct positions
4. Verify custom renderers still work
5. Verify permissions still work
6. Compare visual positions to `/send` - should match exactly

### Test 3: Backwards Compatibility
1. Load old document (created before InstantJSON)
2. Should fall back to manual field creation
3. Should still work (may have minor position differences)

### Test 4: Multi-Signer
1. Create document with 2 signers
2. Place fields for both signers
3. Sign as first signer
4. Export InstantJSON (should include first signature)
5. Sign as second signer
6. Both signatures should be preserved

---

## Reference Implementation Comparison

### Old Implementation (signing-demo-localhost)

**Export (after signing):**
```typescript
const instantJSON = await document.pspdfkitInstance.exportInstantJSON();
await supabaseBrowserClient
  .from("envelopes")
  .update({ instant_json: instantJSON })
  .eq("uuid", envelopeId);
```

**Import (when viewing):**
```typescript
const instance = await PSPDFKit.load({
  container,
  document: docURL?.signedUrl,
  baseUrl: `${window?.location.protocol}//${window?.location.host}/`,
  instantJSON: envelope.instant_json,  // ← Key line
  toolbarItems: TOOLBAR_ITEMS,
});
```

### Our Implementation (Current App)

**Export (after field placement):**
```typescript
const viewerInstance = viewerInstanceRef.current;
const instantJSON = await viewerInstance.exportInstantJSON();

await fetch(`/api/documents/${documentId}/fields`, {
  method: 'POST',
  body: JSON.stringify({ annotationData: instantJSON }),
});
```

**Import (when signing):**
```typescript
const instantJSON = signingData.annotations; // or .instantJSON

const instance = await safeLoadViewer({
  container: containerRef.current,
  document: proxyUrl,
  instantJSON: instantJSON,  // ← Add this
  licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
  // ... other config
});

// No manual field creation needed!
// Permissions update useEffect still runs
```

---

## Key Differences from Reference

### What We Keep:
- ✅ Custom renderers (for styling unsigned fields)
- ✅ Permission update logic (readOnly based on current user)
- ✅ Our database structure (Postgres vs. Supabase)
- ✅ Our authentication flow

### What We Change:
- Replace manual field creation with InstantJSON import
- Export InstantJSON in `/send` instead of field array
- Simplify `/sign` route significantly

---

## Potential Issues & Solutions

### Issue 1: Viewer Instance Access in DocumentFlow
**Problem:** DocumentFlow doesn't have direct access to viewer instance

**Solutions:**
1. **Context approach** (recommended):
   - Create ViewerInstanceContext
   - FieldPlacement stores instance in context
   - DocumentFlow reads from context

2. **Window object** (quick but less clean):
   ```typescript
   // In FieldPlacement
   (window as any).nutrientViewerInstance = instance;

   // In DocumentFlow
   const instance = (window as any).nutrientViewerInstance;
   ```

3. **Callback approach:**
   - Pass `onViewerReady(instance)` callback from DocumentFlow to FieldPlacement
   - Store in DocumentFlow state

### Issue 2: Custom Renderers with InstantJSON
**Problem:** Will custom renderers still work?

**Answer:** YES! Custom renderers are configured in viewer load, they'll apply to annotations loaded from InstantJSON.

**Verify:**
- CustomData should be preserved in InstantJSON
- Renderer will read customData and style appropriately

### Issue 3: Permissions with InstantJSON
**Problem:** Do we still need permission update logic?

**Answer:** YES! The permission update useEffect is still needed because:
- InstantJSON loads annotations as they were created
- We need to update `readOnly` based on current user
- The existing useEffect (lines 354-424 in page.tsx) should work as-is

### Issue 4: Backwards Compatibility
**Problem:** Old documents don't have InstantJSON

**Solution:** Dual approach:
```typescript
// In /sign route
const instantJSON = signingData.annotations?.instantJSON;

if (instantJSON) {
  // New approach: Load with InstantJSON
  const instance = await safeLoadViewer({
    instantJSON: instantJSON,
    // ...
  });
} else if (signingData.annotations?.fields) {
  // Old approach: Manual field creation (current code)
  // Keep existing lines 183-324
}
```

---

## Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Create `ViewerInstanceContext.tsx`
- [ ] Wrap `/send/page.tsx` with `ViewerInstanceProvider`
- [ ] Update FieldPlacement to use `useViewerInstance()`
- [ ] Update DocumentFlow to use `useViewerInstance()`

### Phase 2: Export (30 min)
- [ ] In DocumentFlow.`saveFieldAnnotations()`:
  - [ ] Get viewer instance from context
  - [ ] Call `exportInstantJSON()`
  - [ ] Save to database (modify annotationData structure)
- [ ] Test: Verify InstantJSON appears in database
- [ ] Test: Console log to verify InstantJSON structure

### Phase 3: Import (1 hour)
- [ ] In `/sign/[token]/page.tsx`:
  - [ ] Extract instantJSON from `signingData.annotations`
  - [ ] Pass to `safeLoadViewer()` config
  - [ ] Add fallback for old documents
  - [ ] Remove manual field creation code (or comment out)
- [ ] Test: Load document with InstantJSON
- [ ] Test: Verify fields appear in correct positions
- [ ] Test: Verify custom renderers work
- [ ] Test: Verify permissions work

### Phase 4: Permissions (30 min)
- [ ] Verify permission update useEffect still works
- [ ] Test with multiple signers
- [ ] Verify correct fields are editable/read-only

### Phase 5: Cleanup (30 min)
- [ ] Remove commented-out manual field creation code
- [ ] Remove unused field sync logic
- [ ] Update documentation
- [ ] Remove old migration code

---

## Code Snippets for Quick Reference

### Viewer Instance Context Setup

```typescript
// context/ViewerInstanceContext.tsx
'use client';
import { createContext, useContext, useRef } from 'react';

const ViewerInstanceContext = createContext<{ viewerInstanceRef: React.MutableRefObject<any> } | null>(null);

export function ViewerInstanceProvider({ children }: { children: React.ReactNode }) {
  const viewerInstanceRef = useRef<any>(null);
  return (
    <ViewerInstanceContext.Provider value={{ viewerInstanceRef }}>
      {children}
    </ViewerInstanceContext.Provider>
  );
}

export function useViewerInstance() {
  const context = useContext(ViewerInstanceContext);
  if (!context) throw new Error('useViewerInstance must be used within ViewerInstanceProvider');
  return context;
}
```

### Export InstantJSON

```typescript
// DocumentFlow.tsx
const { viewerInstanceRef } = useViewerInstance();

const saveFieldAnnotations = async () => {
  const instance = viewerInstanceRef.current;
  if (!instance) {
    console.error('Viewer instance not available');
    return;
  }

  const instantJSON = await instance.exportInstantJSON();

  await fetch(`/api/documents/${state.document.id}/fields`, {
    method: 'POST',
    body: JSON.stringify({ annotationData: instantJSON }),
  });
};
```

### Import InstantJSON

```typescript
// app/sign/[token]/page.tsx
const instantJSON = signingData.annotations;

const instance = await safeLoadViewer({
  container: containerRef.current,
  document: proxyUrl,
  instantJSON: instantJSON,  // ← Add this line
  licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
  useCDN: true,
  toolbarItems: [...],
  styleSheets: ['/styles/viewer.css'],
  customRenderers: {
    Annotation: createSignatureFieldRenderer({...}),
  },
});

// Remove all manual field creation code (lines 183-324)
// Keep permission update useEffect (lines 354-424)
```

---

## Expected Results After Refactor

### Before (Current State):
```
/send: Fields at x=319, y=53 (in 80% scaled viewer)
Saved: position: { x: 319, y: 53 }, size: { width: 120, height: 40 }
/sign: Fields at x=319, y=53 (in 100% scaled viewer)
Result: Fields appear offset because scaling differs
```

### After (InstantJSON):
```
/send: Fields at x=319, y=53
Saved: InstantJSON with full Nutrient annotation data
/sign: Load with instantJSON
Result: Fields appear in EXACT same positions regardless of scaling
```

---

## Rollback Plan

If InstantJSON approach has issues:

1. **Database:** Old data still has `fields` array (if we keep both)
2. **Code:** Keep fallback logic for `if (!instantJSON)` case
3. **Git:** Can revert changes to `/sign` route easily

**Recommendation:** Implement in feature branch first, test thoroughly, then merge.

---

## Questions to Resolve

1. **Viewer Instance Sharing:**
   - ✅ Use Context (ViewerInstanceContext)
   - ❌ Use window object (less clean)
   - ❌ Pass via props (too many components)

2. **Database Storage:**
   - Option A: Store only InstantJSON (clean, not backwards compatible)
   - Option B: Store both fields array AND InstantJSON (safe, larger payload)
   - **Recommended:** Option B during migration, then Option A later

3. **Custom Renderers:**
   - Should work automatically with InstantJSON
   - Verify customData is preserved in InstantJSON export

4. **Permissions:**
   - Keep current permission update useEffect
   - May need to adjust timing (ensure annotations loaded first)

---

## Success Criteria

After implementation, verify:

- [ ] Fields in `/send` and `/sign` match exactly (position, size, styling)
- [ ] Initial fields are narrower than signature fields
- [ ] Custom renderers show correct signer names and colors
- [ ] Permissions work (correct fields editable/read-only)
- [ ] Date fields have proper formatting
- [ ] Old documents still work (fallback logic)
- [ ] No console errors
- [ ] Signature capture works when clicking fields

---

## Estimated Time

- **Phase 1 (Setup):** 30 minutes
- **Phase 2 (Export):** 30 minutes
- **Phase 3 (Import):** 1 hour
- **Phase 4 (Permissions):** 30 minutes
- **Phase 5 (Testing & Cleanup):** 1 hour

**Total:** ~3.5 hours

---

## Next Session Priorities

1. Implement ViewerInstanceContext
2. Export InstantJSON in `/send`
3. Import InstantJSON in `/sign`
4. Test end-to-end
5. Remove manual field creation code

---

**Status:** Ready for implementation
**Risk Level:** Low (can roll back easily)
**Impact:** High (solves positioning issues completely)
