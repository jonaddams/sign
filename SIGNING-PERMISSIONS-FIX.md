# Signing Page - Permissions & Rendering Fix

**Date:** January 20, 2026 (Evening Update)
**Reference Implementation:** `/Users/jonaddamsnutrient/SE/code/nutrient-sdk-samples/app/web-sdk/simple-signing-demo`

---

## Issues Fixed

### 1. ✅ All Form Fields Were Editable (Permissions Not Working)
**Problem:** All signers could edit all fields regardless of ownership.

**Root Cause:** `readOnly` property wasn't being set correctly on FormField creation.

**Solution:** Set `readOnly` property directly on the FormField instance after creation:
```typescript
formField.readOnly = !isCurrentRecipientField;
```

---

### 2. ✅ Date Fields Appeared as Generic Text Fields
**Problem:** Date fields looked like plain text inputs without date formatting.

**Root Cause:** Missing JavaScript action for date formatting and missing border styling.

**Solution:** Added proper date field configuration matching reference implementation:
```typescript
// Add border styling to widget
widget.borderColor = Color.fromHex(signerColor);
widget.borderWidth = 2;

// Add JavaScript action for date formatting
widget.additionalActions = {
  onFormat: new Actions.JavaScriptAction({
    script: 'AFDate_FormatEx("mm/dd/yyyy")',
  }),
};

// Use TextFormField (not SignatureFormField)
formField = new PSPDFKit.FormFields.TextFormField({
  annotationIds: new PSPDFKit.Immutable.List([widgetId]),
  name: field.label,
  defaultValue: '', // Empty, user fills it in
});
formField.readOnly = !isCurrentRecipientField;
```

---

### 3. ✅ Custom Data Structure Mismatch
**Problem:** Using `recipientId`, `recipientName`, etc. which doesn't match Nutrient conventions.

**Root Cause:** Our app used custom naming that didn't align with the reference implementation.

**Solution:** Updated customData to use Nutrient naming conventions:
```typescript
// Before
widget.customData = {
  recipientId: field.recipientId,
  recipientName: recipientName,
  recipientEmail: recipientEmail,
  fieldType: field.type,
  isCurrentRecipient: isCurrentRecipientField,
};

// After (matching reference implementation)
widget.customData = {
  signerID: field.recipientId || signingData.recipient.id,
  signerName: signerName,
  signerEmail: signerEmail,
  signerColor: signerColor,
  type: field.type,
};
```

---

### 4. ✅ Custom Renderer Not Showing Correct Signer Names/Colors
**Problem:** Custom overlays didn't distinguish between signers properly.

**Root Cause:** Renderer was using old property names (`recipientName`) instead of new names (`signerName`).

**Solution:** Updated custom renderer to use correct property names:
```typescript
// Extract from customData using both old and new property names for compatibility
const signerId = annotation.customData?.signerID || annotation.customData?.recipientId;
const signerName = annotation.customData?.signerName || annotation.customData?.recipientName || 'Unknown';
const signerEmail = annotation.customData?.signerEmail || annotation.customData?.recipientEmail || '';
const signerColor = annotation.customData?.signerColor || '#4A90E2';
const fieldType = annotation.customData?.type || annotation.customData?.fieldType || 'signature';
```

---

## Key Learnings from Reference Implementation

### 1. **Field Creation Pattern**
```typescript
// 1. Create WidgetAnnotation
const widget = new NV.Annotations.WidgetAnnotation({
  id: widgetId,
  pageIndex: pageIndex,
  boundingBox: bbox,
  formFieldName: fieldName,
});

// 2. Add customData (not in constructor)
widget.customData = { signerID, signerName, signerEmail, signerColor, type };

// 3. For date fields, add border and formatting
if (type === 'date') {
  widget.borderColor = NV.Color.fromHex(color);
  widget.borderWidth = 2;
  widget.additionalActions = {
    onFormat: new NV.Actions.JavaScriptAction({
      script: 'AFDate_FormatEx("mm/dd/yyyy")',
    }),
  };
}

// 4. Create FormField
const formField = new NV.FormFields.TextFormField({
  annotationIds: new NV.Immutable.List([widgetId]),
  name: fieldName,
  defaultValue: '',
});

// 5. Set readOnly AFTER creation
formField.readOnly = !isCurrentUser;

// 6. Create both together
await instance.create([widget, formField]);
```

### 2. **Dynamic Permission Updates**
The reference implementation has a useEffect that updates permissions when the current user changes:
```typescript
useEffect(() => {
  const updateFieldPermissions = async () => {
    const formFields = await instance.getFormFields();
    for (const field of formFields) {
      const widget = allAnnotations.find(ann => ann.formFieldName === field.name);
      if (widget?.customData) {
        const isUserField = currentUser.role === "Editor" ||
                           widget.customData.signerID === currentUser.id;
        const newReadOnly = !isUserField;

        if (field.readOnly !== newReadOnly) {
          const updatedField = field.set("readOnly", newReadOnly);
          await instance.update(updatedField);
        }
      }
    }
  };

  updateFieldPermissions();
}, [currentUser.id]);
```

**Note:** We don't need this in our `/sign` route because the current user never changes during signing. But this pattern could be useful for the `/send` route where admins can switch between signers.

### 3. **Custom Renderer for Unsigned Fields**
```typescript
// Show signer name on unsigned fields
if (annotation instanceof NV.Annotations.WidgetAnnotation) {
  const { signerName, signerColor, type } = annotation.customData;

  const node = document.createElement('div');
  node.style.cssText = `
    border: 2px solid ${signerColor};
    background-color: ${signerColor}15;
    ...
  `;

  // Display name or initials
  let displayText = '';
  if (type === 'initial') {
    displayText = signerName.split(' ').map(n => n[0]).join('').toUpperCase();
  } else if (type === 'date') {
    displayText = ''; // Empty, let input show
  } else {
    displayText = signerName;
  }

  node.textContent = displayText;
  return { node, append: true };
}
```

---

## Files Modified

### 1. [app/sign/[token]/page.tsx](app/sign/[token]/page.tsx)
**Changes:**
- Updated customData to use `signerID`, `signerName`, `signerEmail`, `signerColor`, `type`
- Added date field border styling with `borderColor` and `borderWidth`
- Added JavaScript action for date formatting: `AFDate_FormatEx("mm/dd/yyyy")`
- Set `readOnly` property after FormField creation
- Used `(PSPDFKit as any).Color` and `(PSPDFKit as any).Actions` for TypeScript compatibility

**Lines Modified:** 227-285

### 2. [lib/signature-field-renderer.ts](lib/signature-field-renderer.ts)
**Changes:**
- Updated to read `signerID`, `signerName`, `signerEmail`, `signerColor`, `type` from customData
- Added fallback to old property names for compatibility
- Use `signerColor` from customData if available
- Changed date field displayText from `'mm/dd/yyyy'` to empty string
- Use `displayColor` variable consistently throughout styling

**Lines Modified:** 42-124

---

## Testing Checklist

### ✅ Permissions
- [ ] Current signer can edit their own fields
- [ ] Current signer cannot edit other signers' fields
- [ ] Date fields are editable only by field owner
- [ ] Signature fields are editable only by field owner
- [ ] Initial fields are editable only by field owner

### ✅ Date Fields
- [ ] Date fields show border with signer's color
- [ ] Date fields accept mm/dd/yyyy format
- [ ] Date fields auto-format on blur
- [ ] Date picker appears when clicking date field (browser-dependent)

### ✅ Visual Rendering
- [ ] Current signer's fields show with bright colored borders
- [ ] Other signers' fields show grayed out
- [ ] Signer names display correctly on signature fields
- [ ] Initials display correctly on initial fields (uppercase letters)
- [ ] Date fields show empty (no placeholder text)

### ✅ Multi-Signer Scenarios
- [ ] Document with 2 signers: each sees only their fields as editable
- [ ] Document with 3+ signers: colors cycle correctly
- [ ] Fields with empty recipientId default to current signer (fallback)

---

## Known Issues & Future Work

### 1. Dynamic Permission Updates Not Implemented
**Current State:** Permissions are set once when fields are created.

**Future Enhancement:** Add a useEffect (like the reference implementation) to dynamically update permissions if we ever need to switch users during signing (unlikely in our use case).

### 2. Field Placement in /send Route
**Current State:** The `/send` route might not be storing `signerColor` in the field annotations.

**Next Step:** Update the field placement workflow in `/send` to include `signerColor` in the saved field data. This ensures the signing page has all the data it needs.

### 3. Viewer Re-render Loop Fix
**Status:** ✅ Fixed by removing `isViewerLoaded` from useEffect dependencies

**Details:** The viewer was unmounting immediately after loading because `setIsViewerLoaded(true)` triggered a re-render. Fixed by removing `isViewerLoaded` from the dependency array.

---

## Success Metrics

After these fixes, the signing experience should match DocuSign/reference implementation:

✅ **Permissions Working**: Only field owners can edit their fields
✅ **Date Fields Correct**: Proper formatting and visual styling
✅ **Visual Distinction**: Clear color-coding per signer
✅ **Custom Renderers**: Signer names displayed on unsigned fields
✅ **TypeScript Clean**: No compilation errors

---

## Next Steps

1. **Test the fixes**: Refresh the signing page and verify all permissions work
2. **Update /send route**: Ensure field placement stores `signerColor` in annotations
3. **End-to-end testing**: Test complete workflow with multiple signers
4. **Consider dynamic permissions**: If needed, implement the useEffect pattern from reference

---

**Status:** ✅ Implementation complete - ready for testing
**Reference:** Simple signing demo at `/Users/jonaddamsnutrient/SE/code/nutrient-sdk-samples/app/web-sdk/simple-signing-demo/viewer.tsx`
