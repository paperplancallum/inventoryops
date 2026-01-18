# Inbox Feature - Task Plan

## Overview
Implement a centralized inbox that aggregates messages from Purchase Orders and Shipping Agents, providing a unified communication hub with filtering, search, read/unread tracking, and navigation to source entities.

## Implementation Tasks

### Task 1: Database Migration - Add is_read and is_cleared to po_messages
**Files:** `supabase/migrations/YYYYMMDD_add_inbox_fields_to_messages.sql`

Add `is_read` (BOOLEAN DEFAULT FALSE) and `is_cleared` (BOOLEAN DEFAULT FALSE) columns to the existing `po_messages` table. Create an index on `is_read` and `is_cleared` for efficient inbox queries.

**Acceptance Criteria:**
- [ ] Migration adds is_read BOOLEAN DEFAULT FALSE to po_messages
- [ ] Migration adds is_cleared BOOLEAN DEFAULT FALSE to po_messages
- [ ] Index created on (is_read, is_cleared, created_at DESC)
- [ ] Migration runs successfully with `supabase db push`

---

### Task 2: Database Migration - Create shipping_agent_messages table
**Files:** `supabase/migrations/YYYYMMDD_create_shipping_agent_messages.sql`

Create `shipping_agent_messages` and `shipping_agent_attachments` tables mirroring the PO messages structure. Include is_read and is_cleared fields. Add unread_count to shipping_agents table.

**Acceptance Criteria:**
- [ ] shipping_agent_messages table created with: id, shipping_agent_id, transfer_id (nullable), direction, sender_name, sender_email, content, is_read, is_cleared, created_at
- [ ] shipping_agent_attachments table created with: id, message_id, name, type, url, size, storage_path, created_at
- [ ] Foreign key to shipping_agents(id) with ON DELETE CASCADE
- [ ] Optional foreign key to transfers(id) with ON DELETE SET NULL
- [ ] RLS policies match po_messages pattern
- [ ] Index on (is_read, is_cleared, created_at DESC)
- [ ] unread_count INT DEFAULT 0 added to shipping_agents table
- [ ] Migration runs successfully

---

### Task 3: Update database.types.ts with new types
**Files:** `src/lib/supabase/database.types.ts`

Add TypeScript types for the new shipping_agent_messages and shipping_agent_attachments tables. Run `supabase gen types typescript` or manually add types matching the existing pattern.

**Acceptance Criteria:**
- [ ] DbShippingAgentMessage type exported
- [ ] DbShippingAgentAttachment type exported
- [ ] Types match database schema exactly
- [ ] TypeScript compiles without errors

---

### Task 4: Create inbox section types
**Files:** `src/sections/inbox/types.ts`

Create TypeScript interfaces for the inbox feature: InboxMessage (flattened message with source context), InboxSummary, InboxViewProps, InboxRowProps, InboxSummaryCardsProps. Import from product-plan/sections/inbox/types.ts as reference.

**Acceptance Criteria:**
- [ ] InboxSourceType = 'purchase-order' | 'shipping-agent'
- [ ] InboxMessage interface with all fields from spec
- [ ] InboxSummary interface (totalMessages, unreadCount, awaitingReply)
- [ ] Component props interfaces defined
- [ ] TypeScript compiles without errors

---

### Task 5: Create useInboxMessages hook
**Files:** `src/lib/supabase/hooks/useInboxMessages.ts`

Create hook that fetches and aggregates messages from both po_messages and shipping_agent_messages. Include functions: fetchMessages, markAsRead, markAsUnread, clearMessage, restoreMessage. Transform database rows to InboxMessage format.

**Acceptance Criteria:**
- [ ] Hook queries po_messages with PO/supplier context
- [ ] Hook queries shipping_agent_messages with agent/transfer context
- [ ] Messages merged and sorted by timestamp DESC
- [ ] Summary stats calculated (total, unread, awaiting reply)
- [ ] markAsRead updates is_read=true and decrements parent unread_count
- [ ] markAsUnread updates is_read=false and increments parent unread_count
- [ ] clearMessage updates is_cleared=true
- [ ] restoreMessage updates is_cleared=false
- [ ] Supports filtering by sourceType, search query
- [ ] Hook exported from hooks/index.ts

---

### Task 6: Copy and adapt inbox UI components
**Files:** `src/sections/inbox/InboxView.tsx`, `src/sections/inbox/InboxRow.tsx`, `src/sections/inbox/InboxSummaryCards.tsx`, `src/sections/inbox/index.ts`

Copy components from product-plan/sections/inbox/components/ and adapt imports to use local types and hooks. Fix import paths from @/../product to local paths.

**Acceptance Criteria:**
- [ ] InboxView component renders summary cards, filters, message list
- [ ] InboxRow component handles expand/collapse, read indicator, source icons
- [ ] InboxSummaryCards displays Total, Unread, Awaiting Reply
- [ ] All imports use src/sections/inbox/types
- [ ] Components exported from index.ts
- [ ] TypeScript compiles without errors

---

### Task 7: Create inbox page route
**Files:** `src/app/(app)/inbox/page.tsx`

Create the inbox page that uses useInboxMessages hook, useSuppliers hook, and renders InboxView. Wire up all callbacks: onViewPO (router.push to /purchase-orders/[id]), onViewTransfer (router.push to /transfers/[id]), onMarkRead, onMarkUnread, onClearMessage.

**Acceptance Criteria:**
- [ ] Page fetches messages on mount
- [ ] Loading state shown while fetching
- [ ] InboxView receives all required props
- [ ] onViewPO navigates to /purchase-orders?selected=[poId]
- [ ] onViewTransfer navigates to /transfers/[transferId]
- [ ] Read/unread/clear callbacks wired to hook functions
- [ ] Page renders without errors

---

### Task 8: Add inbox to navigation
**Files:** `src/components/shell/app-sidebar.tsx` or navigation config

Add Inbox to the sidebar navigation with an inbox icon. Show unread badge count if > 0.

**Acceptance Criteria:**
- [ ] Inbox link added to sidebar
- [ ] Uses inbox/mail icon
- [ ] Links to /inbox route
- [ ] Unread count badge displayed (optional enhancement)

---

### Task 9: Write integration tests
**Files:** `src/sections/inbox/__tests__/InboxView.test.tsx`

Write tests per tests.md spec: view inbox, filter by source, filter by type, search, expand message, navigate to source, mark read/unread, clear/restore.

**Acceptance Criteria:**
- [ ] Test: renders message list sorted by newest
- [ ] Test: source filter shows only matching messages
- [ ] Test: search filters by content/PO#/sender
- [ ] Test: click expands message and marks read
- [ ] Test: clear removes from default view
- [ ] Test: empty state shows when no messages
- [ ] All tests pass

---

### Task 10: Create useShippingAgentMessages hook (for future use)
**Files:** `src/lib/supabase/hooks/useShippingAgentMessages.ts`

Create hook mirroring usePOMessages pattern for sending/receiving messages on a specific shipping agent. This enables messaging from the shipping agent detail page.

**Acceptance Criteria:**
- [ ] Hook takes shippingAgentId and optional transferId
- [ ] fetchMessages queries shipping_agent_messages with attachments
- [ ] sendMessage creates message and uploads attachments
- [ ] addNote creates internal note
- [ ] markAsRead resets unread_count on shipping_agents
- [ ] Hook exported from hooks/index.ts

---

## Dependencies
- Task 2 depends on Task 1 (message_direction enum exists)
- Task 3 depends on Tasks 1, 2 (tables must exist to generate types)
- Task 4 has no dependencies
- Task 5 depends on Tasks 3, 4
- Task 6 depends on Task 4
- Task 7 depends on Tasks 5, 6
- Task 8 has no dependencies (can run in parallel with others)
- Task 9 depends on Tasks 6, 7
- Task 10 depends on Tasks 2, 3

## Recommended Order
1. Tasks 1, 4, 8 (parallel - no dependencies)
2. Task 2 (after Task 1)
3. Task 3 (after Task 2)
4. Tasks 5, 6 (parallel - after Tasks 3, 4)
5. Task 7 (after Tasks 5, 6)
6. Tasks 9, 10 (parallel - after Task 7)
