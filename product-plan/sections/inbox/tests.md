# Test Instructions: Inbox

These test-writing instructions are **framework-agnostic**.

## Overview

Test the unified inbox's ability to aggregate and display messages from multiple sources, support filtering and search, and provide navigation to source entities. Focus on read/unread states, clearing behavior, and source type differentiation.

## User Flow Tests

### Flow 1: View Inbox

**Scenario:** User views the aggregated inbox

#### Success Path

**Setup:** Messages exist from both POs and Shipping Agents

**Steps:**
1. Navigate to Inbox section
2. View summary cards (Total, Unread, Awaiting Reply)
3. Review message list sorted by newest first
4. Note source type icons (package vs truck)
5. Identify unread messages (bold text, filled dot)

**Expected Results:**
- [ ] Summary cards show accurate counts
- [ ] Messages sorted reverse chronologically
- [ ] Package icon for PO messages, truck icon for Shipping Agent
- [ ] Unread messages visually distinct (bold, dot indicator)
- [ ] Each row shows: read indicator, source icon, sender, entity ref, preview, date

---

### Flow 2: Filter by Source Type

**Scenario:** User filters to view only PO messages

#### Success Path

**Setup:** Messages from both POs and Shipping Agents

**Steps:**
1. Click "Purchase Orders" source filter tab
2. Observe filtered results
3. Click "Shipping Agents" tab
4. Observe filtered results
5. Click "All" to reset

**Expected Results:**
- [ ] "Purchase Orders" shows only PO-related messages
- [ ] "Shipping Agents" shows only shipping-related messages
- [ ] "All" shows combined messages from both sources
- [ ] Filter selection is visually indicated

---

### Flow 3: Filter by Message Type

**Scenario:** User filters to view only inbound messages

#### Success Path

**Setup:** Mix of inbound, outbound, and note messages

**Steps:**
1. Select "Inbound" from message type dropdown
2. Observe filtered results
3. Select "Sent" to view outbound messages
4. Select "Notes" to view internal notes

**Expected Results:**
- [ ] "Inbound" shows messages received from external parties
- [ ] "Sent" shows messages sent by the user (sender shows "You")
- [ ] "Notes" shows internal notes (amber styling)
- [ ] Filters can be combined with source type filter

---

### Flow 4: Search Messages

**Scenario:** User searches for messages by content or reference

#### Success Path

**Setup:** Messages with various content

**Steps:**
1. Enter PO number in search field
2. Observe matching results
3. Clear and enter supplier name
4. Observe matching results
5. Enter text from message content

**Expected Results:**
- [ ] Search matches PO numbers and transfer numbers
- [ ] Search matches entity names (supplier, shipping agent)
- [ ] Search matches message content
- [ ] Search is case-insensitive

---

### Flow 5: Expand Message

**Scenario:** User expands a message to read full content

#### Success Path

**Setup:** Message with long content and attachments

**Steps:**
1. Click on message row
2. Row expands to show full content
3. View attachments if present
4. Click again to collapse

**Expected Results:**
- [ ] Expansion animation is smooth
- [ ] Full message content displays
- [ ] Attachments show with download links/icons
- [ ] Collapse returns to preview state

---

### Flow 6: Navigate to Source Entity

**Scenario:** User navigates to the source PO or Transfer

#### Success Path - PO Message

**Setup:** Inbox message linked to a PO

**Steps:**
1. Click PO number link in message row

**Expected Results:**
- [ ] `onViewPO` callback fires with poId
- [ ] PO number is styled as clickable link

#### Success Path - Shipping Agent Message

**Setup:** Inbox message linked to a Transfer

**Steps:**
1. Click Transfer number link in message row

**Expected Results:**
- [ ] `onViewTransfer` callback fires with transferId
- [ ] Transfer number is styled as clickable link

---

### Flow 7: Mark Read/Unread

**Scenario:** User manages read status of messages

#### Success Path

**Setup:** Mix of read and unread messages

**Steps:**
1. Locate unread message (bold, filled dot)
2. Click to expand (may auto-mark read)
3. Or use action menu to mark as read
4. Observe visual change
5. Mark a read message as unread

**Expected Results:**
- [ ] `onMarkRead` callback fires with messageId
- [ ] Message loses bold styling and filled dot
- [ ] `onMarkUnread` callback fires when marking unread
- [ ] Message gains bold styling and filled dot

---

### Flow 8: Clear from Inbox

**Scenario:** User clears a message from inbox view

#### Success Path

**Setup:** Message that user wants to hide from inbox

**Steps:**
1. Click actions menu on message row
2. Select "Clear"
3. Observe message removed from list
4. Enable "Show Cleared" toggle
5. Observe cleared message reappears (grayed out)
6. Click "Restore" on cleared message

**Expected Results:**
- [ ] `onClearMessage` callback fires with messageId
- [ ] Message hidden from default inbox view
- [ ] Message still exists on source entity
- [ ] "Show Cleared" reveals cleared messages
- [ ] Restore returns message to normal inbox view

## Empty State Tests

### No Messages

**Scenario:** Inbox is empty (no messages from any source)

**Steps:**
1. Navigate to Inbox with no messages

**Expected Results:**
- [ ] Empty state message displays
- [ ] "No messages yet" or similar text
- [ ] Summary cards show zeros

### No Messages Match Filter

**Scenario:** Filters produce no results

**Steps:**
1. Apply filters that match no messages

**Expected Results:**
- [ ] "No messages match your filters" displays
- [ ] Option to clear filters

### All Messages Cleared

**Scenario:** User has cleared all messages

**Steps:**
1. Clear all messages, keep "Show Cleared" off

**Expected Results:**
- [ ] Empty state shows
- [ ] "Show Cleared" toggle visible to reveal hidden messages

## Component Interaction Tests

### Source Type Icons

**Test:** Icons correctly indicate message source

**Expected Results:**
- [ ] Package icon for PO messages
- [ ] Truck icon for Shipping Agent messages

### Message Direction Styling

**Test:** Visual distinction by message direction

**Expected Results:**
- [ ] Inbound: Normal styling
- [ ] Outbound: "You" as sender, possibly different styling
- [ ] Note: Amber/yellow accent styling

### Awaiting Reply Count

**Test:** Awaiting Reply accurately counts

**Expected Results:**
- [ ] Counts inbound messages without subsequent outbound reply
- [ ] Excludes messages already replied to
- [ ] Excludes cleared messages

## Edge Cases

- Message with no attachments (attachment icon should not show)
- Very long message preview (should truncate with ellipsis)
- Message from deleted PO (should show reference but disable navigation)
- Message with multiple attachments (show attachment count)
- Concurrent mark read/unread actions (handle race conditions)

## Sample Test Data

```typescript
const sampleMessage: InboxMessage = {
  messageId: 'msg-001',
  direction: 'inbound',
  senderName: 'Wang Wei',
  senderEmail: 'wang@supplier.com',
  timestamp: '2026-01-15T14:30:00Z',
  content: 'Hi, just wanted to confirm we received your purchase order PO-2024-042. Production will begin next week. Expected completion is February 15th. Please let me know if you have any questions.',
  attachments: [
    { id: 'att-1', fileName: 'production_schedule.pdf', fileUrl: 'https://...', fileSize: 125000 },
  ],
  isRead: false,
  isCleared: false,
  sourceType: 'purchase-order',
  poId: 'po-042',
  poNumber: 'PO-2024-042',
  supplierId: 'sup-001',
  supplierName: 'Acme Manufacturing',
  poStatus: 'confirmed',
}

const sampleShippingMessage: InboxMessage = {
  messageId: 'msg-002',
  direction: 'inbound',
  senderName: 'Sarah Johnson',
  senderEmail: 'sarah@freightco.com',
  timestamp: '2026-01-15T10:00:00Z',
  content: 'Shipment T-154 has departed Shenzhen port. ETA Los Angeles is January 28th. Tracking number: MSKU123456789.',
  attachments: [],
  isRead: true,
  isCleared: false,
  sourceType: 'shipping-agent',
  agentId: 'agent-001',
  agentName: 'FreightCo Logistics',
  transferId: 'trf-154',
  transferNumber: 'T-154',
}

const sampleSummary: InboxSummary = {
  totalMessages: 45,
  unreadCount: 8,
  awaitingReply: 5,
}
```
