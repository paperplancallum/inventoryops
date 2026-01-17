# Inbox

## Overview

A centralized inbox that aggregates all messages across Purchase Orders and Shipping Agents. Users can view supplier communications, logistics partner messages, internal notes, and sent messages in one place. Provides quick filtering, search, and navigation to the source entity.

## User Flows

- View all messages across POs and Shipping Agents in reverse chronological order
- Filter by source type (All, Purchase Orders, Shipping Agents)
- Filter by message type (All, Inbound, Sent, Notes)
- Filter by entity (supplier or shipping agent name)
- Filter by status (to focus on active orders/shipments)
- Search by PO#/Transfer#, entity name, or message content
- Expand message row to read full content and view attachments
- Navigate to source PO or Shipping Agent detail
- Mark messages as read/unread
- Clear messages from inbox without deleting from source

## Design Decisions

- Unified inbox across multiple entity types (PO and Shipping Agent)
- Source type indicated by icon (package for PO, truck for Shipping Agent)
- Visual distinction for inbound, outbound, and internal notes
- Unread messages shown with bold text and filled dot indicator
- Clear from inbox is soft-delete (message remains on source entity)
- "Show Cleared" toggle to reveal cleared messages

## Data Used

**Entities:** `InboxMessage`, `InboxSummary`

**From global model:**
- PurchaseOrder (PO messages)
- Supplier (sender info for PO messages)
- ShippingAgent (agent messages)
- Transfer (context for shipping agent messages)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `InboxView` - Main inbox view with filters and message list
- `InboxRow` - Individual message row with expand/collapse
- `InboxSummaryCards` - Summary statistics (Total, Unread, Awaiting Reply)

## Callback Props

| Callback | Description |
|----------|-------------|
| `onViewPO` | Called when user clicks PO number to navigate |
| `onViewTransfer` | Called when user clicks transfer number to navigate |
| `onMarkRead` | Called when user marks a message as read |
| `onMarkUnread` | Called when user marks a message as unread |
| `onClearMessage` | Called when user clears message from inbox |
