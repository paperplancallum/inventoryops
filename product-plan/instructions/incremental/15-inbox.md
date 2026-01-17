# Milestone 15: Inbox

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Purchase Orders and Transfers sections recommended

---

## Goal

Implement a centralized inbox that aggregates all messages across Purchase Orders and Shipping Agents, providing a unified communication hub.

## Overview

The Inbox aggregates messages from two sources: Purchase Order communications (supplier messages, sent messages, internal notes) and Shipping Agent communications (logistics partner messages, sent messages, notes). Users can view, filter, search, and manage all messages from a single location.

**Key Functionality:**
- View all messages in reverse chronological order
- Filter by source type (All, Purchase Orders, Shipping Agents)
- Filter by message type (All, Inbound, Sent, Notes)
- Search by PO#, Transfer#, entity name, or message content
- Expand message rows to read full content
- Mark messages as read/unread
- Navigate to source entity (PO or Shipping Agent)
- Clear messages from inbox (soft-delete)

## Recommended Approach: Test-Driven Development

1. Read `product-plan/sections/inbox/tests.md` for test specifications
2. Write tests first for: message listing, filtering, read/unread toggle, expand, clear
3. Implement API endpoints to make tests pass
4. Wire up UI components with real data

## What to Implement

### Components

Copy components from `product-plan/sections/inbox/components/`:
- Summary stat cards (Total Messages, Unread, Awaiting Reply)
- Source filter tabs (All, Purchase Orders, Shipping Agents)
- Search bar with message type and entity filter dropdowns
- Message list with expandable rows
- Read/unread indicator (dot)
- Source type icon (package for PO, truck for Shipping Agent)
- Visual distinction for inbound, outbound, and notes
- Expanded message view with full content and attachments
- Empty state

### Data Layer

- API endpoint: `GET /api/inbox/messages` with filters (sourceType, messageType, entity, search, showCleared)
- API endpoint: `PATCH /api/inbox/messages/:id/read` to toggle read status
- API endpoint: `PATCH /api/inbox/messages/:id/clear` to clear from inbox
- API endpoint: `PATCH /api/inbox/messages/:id/restore` to restore cleared message
- Aggregation query combining PO messages and Shipping Agent messages
- Summary statistics (total, unread, awaiting reply)

### Callbacks to Wire Up

| Callback | Action |
|----------|--------|
| `onSourceFilterChange` | Filter by source type (All, PO, Shipping) |
| `onTypeFilterChange` | Filter by message type (Inbound, Sent, Notes) |
| `onEntityFilterChange` | Filter by specific supplier or shipping agent |
| `onSearch` | Search messages by content |
| `onMessageClick` | Expand message to show full content |
| `onToggleRead` | Mark message as read/unread |
| `onClear` | Clear message from inbox |
| `onRestore` | Restore cleared message |
| `onNavigateToSource` | Navigate to PO or Shipping Agent detail |
| `onToggleShowCleared` | Show/hide cleared messages |

### Empty States

- **No messages**: "No messages yet. Messages from suppliers and shipping agents will appear here."
- **No results**: "No messages match your filters." with clear filters button
- **All caught up**: "All messages read!" when inbox is empty after clearing

## Files to Reference

- `product-plan/sections/inbox/README.md` — Section overview
- `product-plan/sections/inbox/components/` — React components
- `product-plan/sections/inbox/tests.md` — Test specifications
- `product/sections/inbox/spec.md` — Full specification
- `product/sections/inbox/types.ts` — TypeScript interfaces
- `product/sections/inbox/data.json` — Sample data

## Expected User Flows

### View All Messages
1. User navigates to Inbox page
2. Sees summary cards with message counts
3. Views message list sorted by newest first
4. Unread messages appear with bold text and filled dot

### Filter and Search Messages
1. User clicks "Purchase Orders" tab to filter by source
2. User selects "Inbound" from type dropdown
3. User types supplier name in search
4. Message list updates to show matching messages

### Read Message and Navigate to Source
1. User clicks on a message row
2. Row expands to show full message content
3. Message is marked as read (dot becomes hollow)
4. User clicks entity reference link
5. App navigates to PO or Shipping Agent detail page

### Clear and Restore Message
1. User clicks Clear button on a message
2. Message is removed from default view
3. User toggles "Show Cleared" to see cleared messages
4. User clicks Restore to bring message back

## Done When

- [ ] Message list displays with all required columns
- [ ] Summary cards show correct counts (Total, Unread, Awaiting Reply)
- [ ] Source filter tabs work (All, Purchase Orders, Shipping Agents)
- [ ] Message type filter works (All, Inbound, Sent, Notes)
- [ ] Entity filter works (filter by specific supplier or agent)
- [ ] Search filters messages by content
- [ ] Clicking message expands to show full content
- [ ] Read/unread toggle works with visual indicator
- [ ] Source navigation links to correct PO or Shipping Agent
- [ ] Clear removes message from default view
- [ ] Show Cleared toggle reveals cleared messages
- [ ] Restore brings cleared messages back
- [ ] Empty state displays when no messages
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
