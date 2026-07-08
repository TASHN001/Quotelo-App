# Quotelo Round 4 Fixes — Design Spec

**Date:** 2026-07-08  
**Status:** Approved  
**Scope:** 5 bugs/features across 8 files in `Quotelo/src/`

---

## Overview

Five independent fixes to the Quotelo invoice app. Each fix is self-contained with no shared data-flow changes across fixes.

---

## Fix 1 — + Button Client Selection Flow (Home & Invoices)

### Problem
`Home.tsx` and `InvoicesList.tsx` both navigate directly to `ai-generator` when the + button is tapped, bypassing client selection. The user wants a client picker to appear first, matching the screenshot of the "Select Client" bottom sheet (with search, client list, "Continue without client", and "New" button).

### Affected Files
- `src/components/Home.tsx`
- `src/components/InvoicesList.tsx`

### Design
Both files get the same pattern already used inside `AIGenerator.tsx`:

1. Add `showClientPicker` state (`useState(false)`).
2. Change `handleCreateInvoice` (Home) and the + button handler (InvoicesList) to `setShowClientPicker(true)` instead of navigating.
3. Render `<ClientPickerModal>` conditionally at the bottom of the return, wired to:
   - `onClose`: `setShowClientPicker(false)`
   - `onSelectClient`: `(client) => { setSelectedClient(client); setCurrentScreen('ai-generator'); }`
   - `onAddClient`: navigate to `clients` screen (create new client flow)
   - `userId`: `authUser?.id ?? ''`
4. Import `ClientPickerModal`, `Client` type, and `setSelectedClient` from context.

`ClientPickerModal` already has search, "Continue without client", and "New" / "Add Client" button — no changes to the modal itself.

### Context dependency
`setSelectedClient` must be available in `useApp()` for both screens. It already exists in `AppContext`.

---

## Fix 2 — Document Defaults Button on TemplatesList + Scroll Fix

### Problem
The Document Defaults button (`SlidersHorizontal` icon) only appears inside `TemplatePreview.tsx`. Users must open a specific template to find it. The user wants it on the main `TemplatesList` screen. Additionally, the Save button in the `DefaultsModal` bottom sheet is clipped — users can't scroll to it.

### Affected Files
- `src/components/TemplatePreview.tsx` (add exports)
- `src/components/TemplatesList.tsx` (add button + render modal)

### Design

**TemplatePreview.tsx** — export the modal and helpers:
```tsx
export function DefaultsModal({ onClose }: { onClose: () => void }) { ... }
// loadDocumentDefaults and saveDocumentDefaults are already exported
```
`DefaultsModal` is currently an unexported function in that file — just add `export`.

**TemplatesList.tsx** — add to header:
```tsx
import { DefaultsModal, loadDocumentDefaults } from './TemplatePreview';
// Add: const [showDefaults, setShowDefaults] = useState(false);
// In header row, add button next to the title:
<button onClick={() => setShowDefaults(true)} ...>
  <SlidersHorizontal className="w-4 h-4" />
  <span className="hidden sm:inline">Defaults</span>
</button>
// At bottom of return:
{showDefaults && <DefaultsModal onClose={() => setShowDefaults(false)} />}
```

**Scroll fix** — `DefaultsModal`'s fields container is `<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">`. Change `py-4` to `pt-4 pb-20` so the last textarea has 80px of clearance below it, preventing the fixed Save button bar from covering it. The Save button div sits outside the scroll container so it stays pinned and always tappable — the scroll padding is purely to reveal the last field fully.

---

## Fix 3 — Remove Duplicate Navigation from TemplatesList

### Problem
`TemplatesList.tsx` has its own `sticky bottom-0` nav bar (Home / + / Profile) that was built before `BottomTabBar` was introduced globally. It duplicates the real bottom nav and appears on top of it.

### Affected Files
- `src/components/TemplatesList.tsx`

### Design
Delete the entire `<div className="sticky bottom-0 ...">` block (lines 186–213 in current file). `BottomTabBar` already handles navigation for the `templates-list` screen (it's listed in `TAB_SCREENS['invoices-list']`).

Also remove unused imports: `Home as HomeIcon`, `User`, `Plus` — only needed by the deleted nav block.

---

## Fix 4 — Invoice Editor Preview Rendering (Logo Too Large)

### Problem
The EditorPreview (in `InvoiceEditor`) shows the logo at full natural image size. Root cause: both `Minimal.tsx` and `Modern.tsx` pass `logoContainer: 'flex items-center justify-center flex-shrink-0'` — a class with no width/height constraint. `InvoiceLayout` only applies its `{ width: 64, height: 64 }` inline style when `styles.logoContainer` is **not** set. Since both templates set it, the size override never applies.

The secondary issue: both templates set `metaRow: 'grid grid-cols-1 md:grid-cols-2 ...'`. The `md:` breakpoint (768px) never triggers inside `html2pdf`'s 520px render window or the EditorPreview's scaled container, so From and Bill To are stacked vertically instead of side-by-side.

### Affected Files
- `src/templates/invoice/Minimal.tsx`
- `src/templates/invoice/Modern.tsx`

### Design
In both template files, change two style keys:

| Key | Old | New |
|-----|-----|-----|
| `logoContainer` | `'flex items-center justify-center flex-shrink-0'` | `'flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg'` |
| `metaRow` | `'grid grid-cols-1 md:grid-cols-2 gap-... mb-...'` | `'grid grid-cols-2 gap-... mb-...'` (drop `grid-cols-1` and the `md:` prefix) |

The `w-16 h-16` Tailwind classes (64×64px) match the existing fallback size in `InvoiceLayout`. `overflow-hidden` ensures the logo crops rather than bleeds. `rounded-lg` preserves the visual radius that the current inline style's `borderRadius: 8` was providing.

No changes needed to `EditorPreview.tsx` or `InvoiceLayout.tsx` — the scaling approach there is fine once the templates stop sending unconstrained styles.

---

## Fix 5 — Separate Document Numbering Per Type (INV / QUO / REC)

### Problem
`db.getNextDocumentNumber(userId, clientId?)` counts all documents for the user (regardless of type) and always returns `INV-XXX`. Creating a Quote after INV-005 produces INV-006, not QUO-001.

### Affected Files
- `src/lib/database.ts` (`getNextDocumentNumber`)
- `src/components/InvoiceDataPreview.tsx` (caller)
- `src/components/DocumentPreview.tsx` (caller)
- `src/components/Home.tsx` (caller — used for duplicate)

### Design

**`database.ts`** — update signature and logic:
```typescript
async getNextDocumentNumber(
  userId: string,
  documentType: 'invoice' | 'quote' | 'receipt',
  clientId?: string | null
): Promise<string> {
  const prefix = documentType === 'quote' ? 'QUO' : documentType === 'receipt' ? 'REC' : 'INV';
  
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('document_type', documentType);   // ← filter by type
  
  // clientId filter removed — count per type globally, not per client
  
  const { count, error } = await query;
  
  if (error) {
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }
  return `${prefix}-${String((count || 0) + 1).padStart(3, '0')}`;
}
```

Note: the `clientId` parameter is **dropped** — it was used to generate per-client numbering which was unintuitive (e.g. INV-001 for every client). Per-user, per-type counting matches standard invoicing expectations.

**Callers — update to pass document type:**

- `InvoiceDataPreview.tsx` line 38:  
  `db.getNextDocumentNumber(authUser.id, selectedClient?.id ?? null)`  
  → `db.getNextDocumentNumber(authUser.id, (invoiceDraft.documentType?.toLowerCase() || 'invoice') as 'invoice' | 'quote' | 'receipt')`

- `DocumentPreview.tsx` line 95:  
  `db.getNextDocumentNumber(authUser.id, selectedClient?.id ?? null)`  
  → `db.getNextDocumentNumber(authUser.id, (invoiceDraft?.documentType?.toLowerCase() || 'invoice') as 'invoice' | 'quote' | 'receipt')`

- `Home.tsx` (duplicate handler, line 107):  
  `db.getNextDocumentNumber(localStorage.getItem('quotelo_user_id') || '', originalDoc?.client_id ?? null)`  
  → `db.getNextDocumentNumber(localStorage.getItem('quotelo_user_id') || '', (originalDoc?.document_type || 'invoice') as 'invoice' | 'quote' | 'receipt')`

---

## File Change Summary

| File | Fix | Change |
|------|-----|--------|
| `src/components/Home.tsx` | 1, 5 | Add client picker flow; update `getNextDocumentNumber` call |
| `src/components/InvoicesList.tsx` | 1 | Add client picker flow |
| `src/components/TemplatePreview.tsx` | 2 | Export `DefaultsModal` |
| `src/components/TemplatesList.tsx` | 2, 3 | Add Defaults button; delete duplicate nav block |
| `src/templates/invoice/Minimal.tsx` | 4 | Fix `logoContainer` + `metaRow` |
| `src/templates/invoice/Modern.tsx` | 4 | Fix `logoContainer` + `metaRow` |
| `src/lib/database.ts` | 5 | Add `documentType` param, filter count by type |
| `src/components/InvoiceDataPreview.tsx` | 5 | Update `getNextDocumentNumber` call |
| `src/components/DocumentPreview.tsx` | 5 | Update `getNextDocumentNumber` call |

---

## Out of Scope
- No changes to `BottomTabBar.tsx`, `AppContext.tsx`, `InvoiceLayout.tsx`, or `EditorPreview.tsx`
- No database schema changes (document_type column already exists)
- No new UI components — `ClientPickerModal` and `DefaultsModal` are reused as-is
