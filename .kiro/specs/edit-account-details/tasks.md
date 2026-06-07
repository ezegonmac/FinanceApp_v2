# Implementation Plan: Edit Account Details

## Overview

Add account editing capabilities (name, icon, active status) following the existing expense-editing pattern. The implementation adds a PATCH handler to the accounts API route, creates an `EditAccountForm` client component, and integrates it into the account detail page via a new `AccountHeader` wrapper component.

## Tasks

- [x] 1. Add PATCH handler to the accounts API route
  - [x] 1.1 Add the PATCH handler to `apps/web/app/api/accounts/[id]/route.ts`
    - Import `z` from `zod` at the top of the file
    - Define `updateAccountSchema` with optional `name` (string, min 1, trimmed), optional `icon` (string or null), optional `active` (boolean), and a refine rule rejecting whitespace-only names
    - Implement the `PATCH` function: parse `id` from params (400 if non-numeric), parse body with Zod (400 on ZodError), check existence via `findUnique` (404 if not found), call `prisma.account.update` with provided fields, return updated account with 200
    - Update the existing `OPTIONS` handler to include PATCH in the Allow header
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.2_

  - [ ]* 1.2 Write property tests for the PATCH handler validation
    - **Property 2: Validation rejects invalid field types**
    - **Property 3: Whitespace-only names are rejected**
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.7, 3.2**

  - [ ]* 1.3 Write property test for partial update invariant
    - **Property 1: Partial update preserves untouched fields**
    - **Validates: Requirements 1.8**

- [x] 2. Create the EditAccountForm component
  - [x] 2.1 Create `apps/web/components/accounts/EditAccountForm.tsx`
    - Add `'use client'` directive
    - Define Props type with `account` object (id, name, icon, active) and `onClose` callback
    - Add local `useState` for name, icon, active, saving, error
    - Pre-populate state from `account` prop
    - Client-side validation: reject whitespace-only name with inline error
    - On save: compute diff of changed fields vs original props, send PATCH to `/api/accounts/${account.id}` with only changed fields
    - On success: call `onClose()` and `router.refresh()`
    - On failure: set error message, re-enable form
    - Disable all inputs and buttons while `saving` is true
    - Use existing `IconPicker` component for icon selection
    - Use shadcn `Switch` component for active toggle
    - Use shadcn `Input` for name field
    - Use shadcn `Button` for save and cancel actions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1_

  - [ ]* 2.2 Write property test for changed-fields-only logic
    - **Property 4: Only changed fields are sent in PATCH body**
    - **Validates: Requirements 2.2**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate edit form into the account detail page
  - [x] 4.1 Create `apps/web/components/accounts/AccountHeader.tsx`
    - Add `'use client'` directive
    - Define Props type with account data (id, name, icon, balance, createdAtIso, active)
    - Render `AccountSummary` with an edit button (Pencil icon from lucide-react)
    - Manage `editing` state toggle
    - When `editing` is true, render `EditAccountForm` inline below the summary
    - Pass `onClose` to set `editing` back to false
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.2 Update `apps/web/app/accounts/[id]/page.tsx` to use `AccountHeader`
    - Replace the inline `AccountSummary` usage with the new `AccountHeader` component
    - Pass the account's id, name, icon, balance (as string), createdAtIso, and active status
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1.1"]
    },
    {
      "wave": 2,
      "tasks": ["1.2", "1.3", "2.1"]
    },
    {
      "wave": 3,
      "tasks": ["2.2", "3"]
    },
    {
      "wave": 4,
      "tasks": ["4.1"]
    },
    {
      "wave": 5,
      "tasks": ["4.2"]
    },
    {
      "wave": 6,
      "tasks": ["5"]
    }
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- No database migration needed — the Account model already has all required fields
- No snapshot recalculation is needed since name, icon, and active status don't affect balance
- Property tests use `fast-check` with Vitest, minimum 100 iterations
