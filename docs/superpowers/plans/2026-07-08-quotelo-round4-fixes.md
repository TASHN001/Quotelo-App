# Quotelo Round 4 Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 independent bugs in the Quotelo invoice app: logo/grid layout in templates, duplicate nav, Document Defaults accessibility, per-type document numbering, and client picker on + buttons.

**Architecture:** All changes are in `Quotelo/src/`. No new files, no schema changes. Each task is a self-contained diff touching 1–4 files, verified with `npx tsc --noEmit` before committing.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS 3, Supabase (Postgres), Vite, html2pdf.js

---

## File Map

| File | Tasks | What changes |
|------|-------|-------------|
| `src/templates/invoice/Minimal.tsx` | 1 | Fix `logoContainer` + `metaRow` styles |
| `src/templates/invoice/Modern.tsx` | 1 | Fix `logoContainer` + `metaRow` styles |
| `src/components/TemplatesList.tsx` | 2, 3 | Remove internal nav; add Defaults button + modal |
| `src/components/TemplatePreview.tsx` | 3 | Export `DefaultsModal`; fix scroll padding |
| `src/lib/database.ts` | 4 | Add `documentType` param to `getNextDocumentNumber` |
| `src/components/InvoiceDataPreview.tsx` | 4 | Update `getNextDocumentNumber` call |
| `src/components/DocumentPreview.tsx` | 4 | Update `getNextDocumentNumber` call |
| `src/components/Home.tsx` | 4, 5 | Update numbering call; add client picker |
| `src/components/InvoicesList.tsx` | 6 | Add client picker |

---

## Task 1 — Fix Template Logo Size + From/Bill To Grid

**Files:**
- Modify: `src/templates/invoice/Minimal.tsx`
- Modify: `src/templates/invoice/Modern.tsx`

**Root cause:** Both templates pass `logoContainer: 'flex items-center justify-center flex-shrink-0'` — no `width`/`height`. `InvoiceLayout` only applies its 64×64 inline style when `styles.logoContainer` is **not** set, so the logo renders at full natural image size. Both also use `grid-cols-1 md:grid-cols-2` which collapses the From/Bill To sections to a single column inside html2pdf's 520 px window.

- [ ] **Step 1.1 — Edit Minimal.tsx**

Replace lines 15 and 18 in `src/templates/invoice/Minimal.tsx`:

```tsx
// BEFORE (line 15):
logoContainer: 'flex items-center justify-center flex-shrink-0',
// AFTER:
logoContainer: 'flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg',

// BEFORE (line 18):
metaRow: 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8',
// AFTER:
metaRow: 'grid grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8',
```

Full updated styles object for `Minimal.tsx` (replace the entire `styles={{...}}` prop):
```tsx
styles={{
  container: 'bg-white p-4 sm:p-6 md:p-8 w-full max-w-full box-border',
  header: 'flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-900 gap-4',
  logoContainer: 'flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg',
  invoiceTitle: 'text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900',
  invoiceNumber: 'text-xs sm:text-sm text-gray-600 font-medium',
  metaRow: 'grid grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8',
  infoLabel: 'text-xs font-semibold text-gray-500 uppercase mb-2',
  infoText: 'text-xs sm:text-sm text-gray-900',
  dateRow: 'mt-4 sm:mt-6 space-y-2',
  dateLabel: 'text-xs font-semibold text-gray-500 uppercase',
  dateValue: 'text-xs sm:text-sm text-gray-900 mt-1',
  tableContainer: 'w-full overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0',
  tableHeader: 'border-b-2 border-gray-900',
  tableHeaderCell: 'text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900',
  tableRow: 'border-b border-gray-200',
  tableCell: 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900',
  totalsContainer: 'flex justify-end mb-6 sm:mb-8',
  totalRow: 'flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm',
  totalLabel: 'text-gray-600',
  totalValue: 'text-gray-900',
  grandTotalRow: 'flex justify-between py-2 sm:py-3 border-t-2 border-gray-900',
  grandTotalLabel: 'text-base sm:text-lg font-bold text-gray-900',
  grandTotalValue: 'text-lg sm:text-xl font-bold text-gray-900',
  footer: 'space-y-3 sm:space-y-4 mt-6 sm:mt-8',
  footerLabel: 'text-xs font-semibold text-gray-500 uppercase mb-1',
  footerText: 'text-xs sm:text-sm text-gray-700'
}}
```

- [ ] **Step 1.2 — Edit Modern.tsx**

Full updated styles object for `Modern.tsx` (replace the entire `styles={{...}}` prop):
```tsx
styles={{
  container: 'bg-white p-4 sm:p-6 md:p-8 w-full max-w-full box-border',
  header: 'flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 gap-4',
  logoContainer: 'flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg',
  invoiceTitle: 'text-3xl sm:text-5xl md:text-6xl font-bold text-orange-600',
  invoiceNumber: 'text-xs sm:text-sm text-gray-600 font-medium',
  metaRow: 'grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8',
  infoBlock: 'bg-orange-50 p-3 sm:p-4 rounded-xl',
  infoLabel: 'text-xs font-semibold text-orange-700 uppercase mb-2',
  infoText: 'text-xs sm:text-sm text-gray-900',
  dateRow: 'mt-3 sm:mt-4 space-y-2',
  dateLabel: 'text-xs font-semibold text-orange-700 uppercase',
  dateValue: 'text-xs sm:text-sm text-gray-900 mt-1',
  tableContainer: 'w-full overflow-x-auto mb-6 sm:mb-8 rounded-xl overflow-hidden shadow-sm -mx-4 sm:mx-0',
  tableHeader: 'bg-gradient-to-r from-orange-500 to-orange-600',
  tableHeaderCell: 'text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-white',
  tableRow: 'border-b border-gray-200 hover:bg-orange-50 transition-colors',
  tableCell: 'py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900',
  totalsContainer: 'flex justify-end mb-6 sm:mb-8',
  totalRow: 'flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm border-b border-gray-200',
  totalLabel: 'text-gray-600',
  totalValue: 'text-gray-900 font-medium',
  grandTotalRow: 'flex justify-between py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg mt-2',
  grandTotalLabel: 'text-base sm:text-lg font-bold',
  grandTotalValue: 'text-lg sm:text-xl font-bold',
  footer: 'space-y-3 sm:space-y-4 mt-6 sm:mt-8',
  footerLabel: 'text-xs font-semibold text-orange-700 uppercase mb-1',
  footerText: 'text-xs sm:text-sm text-gray-700'
}}
```

- [ ] **Step 1.3 — Type-check**

```bash
cd "c:\Users\mogam\Documents\NOVIFY\Tash CC\Quotelo"
npx tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 1.4 — Commit**

```bash
git add src/templates/invoice/Minimal.tsx src/templates/invoice/Modern.tsx
git commit -m "fix: constrain logo size and remove md: breakpoint from grid in templates

Both Minimal and Modern were passing logoContainer without width/height,
causing logos to render at full natural size. metaRow used md:grid-cols-2
which never triggers at html2pdf's 520px render width."
```

---

## Task 2 — Remove Duplicate Navigation from TemplatesList

**Files:**
- Modify: `src/components/TemplatesList.tsx`

**Root cause:** `TemplatesList` has a hardcoded `sticky bottom-0` nav (Home / + / Profile) that predates the global `BottomTabBar`. Both render simultaneously.

- [ ] **Step 2.1 — Delete the internal nav block**

In `src/components/TemplatesList.tsx`, delete this entire block (currently the last block before the closing `</div>` of the outer container):

```tsx
      <div className="sticky bottom-0 bg-white border-t border-[#f2f2f7] px-6 py-4">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <HomeIcon className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setCurrentScreen('ai-generator')}
              className="w-14 h-14 bg-[#f97316] rounded-full flex items-center justify-center shadow-lg absolute -top-8 left-1/2 -translate-x-1/2"
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <User className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
```

- [ ] **Step 2.2 — Remove unused imports**

In the same file, change the first import line from:
```tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Home as HomeIcon, User, Briefcase } from 'lucide-react';
```
To:
```tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase } from 'lucide-react';
```

(`Plus`, `Home as HomeIcon`, and `User` were only used in the deleted nav block.)

- [ ] **Step 2.3 — Type-check**

```bash
cd "c:\Users\mogam\Documents\NOVIFY\Tash CC\Quotelo"
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 2.4 — Commit**

```bash
git add src/components/TemplatesList.tsx
git commit -m "fix: remove duplicate nav bar from TemplatesList

Internal Home/+/Profile nav predated BottomTabBar and caused a double
navigation bar at the bottom of the Templates screen."
```

---

## Task 3 — Document Defaults Button on TemplatesList + Scroll Fix

**Files:**
- Modify: `src/components/TemplatePreview.tsx` (export `DefaultsModal`; fix scroll padding)
- Modify: `src/components/TemplatesList.tsx` (import; add button; render modal)

- [ ] **Step 3.1 — Export DefaultsModal from TemplatePreview.tsx**

In `src/components/TemplatePreview.tsx`, find the line:
```tsx
function DefaultsModal({ onClose }: { onClose: () => void }) {
```
Change to:
```tsx
export function DefaultsModal({ onClose }: { onClose: () => void }) {
```

- [ ] **Step 3.2 — Fix scroll padding inside DefaultsModal**

In the same file, inside `DefaultsModal`, find the fields scroll container:
```tsx
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
```
Change to:
```tsx
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-20 flex flex-col gap-4">
```
(`pb-20` = 80px — enough clearance so the last textarea scrolls fully above the fixed Save button bar.)

- [ ] **Step 3.3 — Update TemplatesList.tsx**

Add to imports at the top of `src/components/TemplatesList.tsx`:
```tsx
import { SlidersHorizontal } from 'lucide-react';
import { DefaultsModal } from './TemplatePreview';
```

Add state inside the `TemplatesList` function body, after the existing `useState` calls:
```tsx
const [showDefaults, setShowDefaults] = useState(false);
```

In the header `<div className="flex items-center gap-2 sm:gap-4">`, add a Defaults button after the title `<div>`:
```tsx
          <button
            onClick={() => setShowDefaults(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Defaults</span>
          </button>
```

At the very end of the `return (...)`, before the final closing `</div>`, add:
```tsx
      {showDefaults && <DefaultsModal onClose={() => setShowDefaults(false)} />}
```

- [ ] **Step 3.4 — Type-check**

```bash
cd "c:\Users\mogam\Documents\NOVIFY\Tash CC\Quotelo"
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3.5 — Commit**

```bash
git add src/components/TemplatePreview.tsx src/components/TemplatesList.tsx
git commit -m "feat: add Document Defaults button to TemplatesList; fix modal scroll

Defaults button now visible on the Templates screen without needing to
open a specific template first. Fixed scroll padding so Save button is
always reachable at the bottom of the sheet."
```

---

## Task 4 — Per-Type Document Numbering (INV / QUO / REC)

**Files:**
- Modify: `src/lib/database.ts`
- Modify: `src/components/InvoiceDataPreview.tsx`
- Modify: `src/components/DocumentPreview.tsx`
- Modify: `src/components/Home.tsx`

**Root cause:** `getNextDocumentNumber` counts all user documents regardless of type and always returns `INV-XXX`. Creating a Quote after INV-005 produces INV-006, not QUO-001.

- [ ] **Step 4.1 — Update getNextDocumentNumber in database.ts**

Find the current function (around line 645):
```typescript
  async getNextDocumentNumber(userId: string, clientId?: string | null): Promise<string> {
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[DB] Error counting documents for number generation:', error);
      return `INV-${Date.now().toString().slice(-6)}`;
    }

    return `INV-${String((count || 0) + 1).padStart(3, '0')}`;
  },
```

Replace with:
```typescript
  async getNextDocumentNumber(
    userId: string,
    documentType: 'invoice' | 'quote' | 'receipt'
  ): Promise<string> {
    const prefix = documentType === 'quote' ? 'QUO' : documentType === 'receipt' ? 'REC' : 'INV';

    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('document_type', documentType);

    if (error) {
      console.error('[DB] Error counting documents for number generation:', error);
      return `${prefix}-${Date.now().toString().slice(-6)}`;
    }

    return `${prefix}-${String((count || 0) + 1).padStart(3, '0')}`;
  },
```

- [ ] **Step 4.2 — Update caller in InvoiceDataPreview.tsx**

Find line ~38 in `src/components/InvoiceDataPreview.tsx`:
```typescript
    const invoiceNumber = await db.getNextDocumentNumber(authUser.id, selectedClient?.id ?? null);
```
Replace with:
```typescript
    const invoiceNumber = await db.getNextDocumentNumber(
      authUser.id,
      (invoiceDraft.documentType?.toLowerCase() || 'invoice') as 'invoice' | 'quote' | 'receipt'
    );
```

- [ ] **Step 4.3 — Update caller in DocumentPreview.tsx**

Find line ~95 in `src/components/DocumentPreview.tsx`:
```typescript
    const invoiceNumber = await db.getNextDocumentNumber(authUser.id, selectedClient?.id ?? null);
```
Replace with:
```typescript
    const invoiceNumber = await db.getNextDocumentNumber(
      authUser.id,
      (invoiceDraft?.documentType?.toLowerCase() || 'invoice') as 'invoice' | 'quote' | 'receipt'
    );
```

- [ ] **Step 4.4 — Update caller in Home.tsx (duplicate handler)**

Find lines ~107–110 in `src/components/Home.tsx`:
```typescript
    const newDocNumber = await db.getNextDocumentNumber(
      localStorage.getItem('quotelo_user_id') || '',
      originalDoc?.client_id ?? null
    );
```
Replace with:
```typescript
    const newDocNumber = await db.getNextDocumentNumber(
      localStorage.getItem('quotelo_user_id') || '',
      (originalDoc?.document_type || 'invoice') as 'invoice' | 'quote' | 'receipt'
    );
```

- [ ] **Step 4.5 — Type-check**

```bash
cd "c:\Users\mogam\Documents\NOVIFY\Tash CC\Quotelo"
npx tsc --noEmit
```
Expected: no output. If TypeScript complains about `document_type` not existing on the originalDoc type, check `src/lib/types.ts` — `Document.document_type` should already be typed as `'invoice' | 'quote' | 'receipt'`.

- [ ] **Step 4.6 — Commit**

```bash
git add src/lib/database.ts src/components/InvoiceDataPreview.tsx src/components/DocumentPreview.tsx src/components/Home.tsx
git commit -m "feat: separate document numbering per type (INV/QUO/REC)

getNextDocumentNumber now counts only documents of the requested type,
so quotes start at QUO-001 and receipts at REC-001 independently of
invoice numbering. clientId param removed — per-type global count
matches standard invoicing expectations."
```

---

## Task 5 — Client Picker on Home Screen + Button

**Files:**
- Modify: `src/components/Home.tsx`

- [ ] **Step 5.1 — Add imports to Home.tsx**

At the top of `src/components/Home.tsx`, add these two imports (if not already present):
```tsx
import { ClientPickerModal } from './ClientPickerModal';
import type { Client } from '../lib/types';
```

- [ ] **Step 5.2 — Add setSelectedClient to the useApp destructure**

Find the `useApp()` destructure line in `Home.tsx`:
```tsx
const { userProfile, recentInvoices, isLoading, setCurrentScreen, setPreviousScreen, setSavedDocumentId, formatCurrency, showToast, refreshDocuments } = useApp();
```
Add `setSelectedClient` and `authUser`:
```tsx
const { userProfile, recentInvoices, isLoading, setCurrentScreen, setPreviousScreen, setSavedDocumentId, formatCurrency, showToast, refreshDocuments, setSelectedClient, authUser } = useApp();
```

- [ ] **Step 5.3 — Add showClientPicker state**

After the existing `useState` calls in `Home.tsx`, add:
```tsx
const [showClientPicker, setShowClientPicker] = useState(false);
```

- [ ] **Step 5.4 — Update handleCreateInvoice**

Find:
```tsx
  const handleCreateInvoice = () => {
    setCurrentScreen('ai-generator');
  };
```
Replace with:
```tsx
  const handleCreateInvoice = () => {
    setShowClientPicker(true);
  };
```

- [ ] **Step 5.5 — Add ClientPickerModal to the return**

At the very end of the `return (...)` in `Home.tsx`, before the final closing `</div>`, add:
```tsx
      {showClientPicker && (
        <ClientPickerModal
          userId={authUser?.id ?? ''}
          onClose={() => setShowClientPicker(false)}
          onSelectClient={(client: Client | null) => {
            setSelectedClient(client);
            setShowClientPicker(false);
            setCurrentScreen('ai-generator');
          }}
          onAddClient={() => {
            setShowClientPicker(false);
            setCurrentScreen('clients');
          }}
        />
      )}
```

- [ ] **Step 5.6 — Type-check**

```bash
cd "c:\Users\mogam\Documents\NOVIFY\Tash CC\Quotelo"
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 5.7 — Commit**

```bash
git add src/components/Home.tsx
git commit -m "feat: show client picker when tapping + on Home screen

+ button now opens the Select Client bottom sheet before navigating to
ai-generator, matching the flow in the Invoices screen."
```

---

## Task 6 — Client Picker on Invoices Screen + Button

**Files:**
- Modify: `src/components/InvoicesList.tsx`

- [ ] **Step 6.1 — Add imports to InvoicesList.tsx**

At the top of `src/components/InvoicesList.tsx`, add:
```tsx
import { ClientPickerModal } from './ClientPickerModal';
import type { Client } from '../lib/types';
```

- [ ] **Step 6.2 — Add setSelectedClient to useApp destructure**

Find the `useApp()` destructure line in `InvoicesList.tsx`:
```tsx
const { setCurrentScreen, setPreviousScreen, authUser, formatCurrency, setSavedDocumentId, showToast } = useApp();
```
Add `setSelectedClient`:
```tsx
const { setCurrentScreen, setPreviousScreen, authUser, formatCurrency, setSavedDocumentId, showToast, setSelectedClient } = useApp();
```

- [ ] **Step 6.3 — Add showClientPicker state**

After the existing `useState` calls in `InvoicesList.tsx`, add:
```tsx
const [showClientPicker, setShowClientPicker] = useState(false);
```

- [ ] **Step 6.4 — Update the + button onClick**

Find the + button in the header area of `InvoicesList.tsx`:
```tsx
          <button
            onClick={() => setCurrentScreen('ai-generator')}
            className={`w-9 h-9 bg-[#f97316] rounded-full flex items-center justify-center ${ds.shadowOrange} ${ds.press} ${ds.transition} mb-1`}
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
```
Change `onClick` only:
```tsx
          <button
            onClick={() => setShowClientPicker(true)}
            className={`w-9 h-9 bg-[#f97316] rounded-full flex items-center justify-center ${ds.shadowOrange} ${ds.press} ${ds.transition} mb-1`}
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
```

- [ ] **Step 6.5 — Add ClientPickerModal to the return**

At the very end of the `return (...)` in `InvoicesList.tsx`, before the final closing `</div>`, add:
```tsx
      {showClientPicker && (
        <ClientPickerModal
          userId={authUser?.id ?? ''}
          onClose={() => setShowClientPicker(false)}
          onSelectClient={(client: Client | null) => {
            setSelectedClient(client);
            setShowClientPicker(false);
            setCurrentScreen('ai-generator');
          }}
          onAddClient={() => {
            setShowClientPicker(false);
            setCurrentScreen('clients');
          }}
        />
      )}
```

- [ ] **Step 6.6 — Type-check**

```bash
cd "c:\Users\mogam\Documents\NOVIFY\Tash CC\Quotelo"
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 6.7 — Commit and push**

```bash
git add src/components/InvoicesList.tsx
git commit -m "feat: show client picker when tapping + on Invoices screen

Mirrors the Home screen + button behaviour added in the previous commit.
Both entry points to ai-generator now collect a client selection first."
git push
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Fix 1 (+ button client picker on Home + Invoices) → Tasks 5 & 6
- [x] Fix 2 (Defaults button on TemplatesList + scroll fix) → Task 3
- [x] Fix 3 (remove duplicate nav) → Task 2
- [x] Fix 4 (logo size + grid layout) → Task 1
- [x] Fix 5 (per-type numbering INV/QUO/REC) → Task 4

**Placeholder scan:** All steps contain exact code. No TBDs.

**Type consistency:**
- `getNextDocumentNumber(userId, documentType)` — defined in Task 4.1, called identically in 4.2, 4.3, 4.4 ✓
- `ClientPickerModal` props (`userId`, `onClose`, `onSelectClient`, `onAddClient`) — identical between Tasks 5 and 6 ✓
- `DefaultsModal` export in Task 3.1, imported in Task 3.3 ✓
