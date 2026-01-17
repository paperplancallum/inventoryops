# Magic Links

## Overview

Magic links enable external stakeholders (suppliers, shipping partners) to interact with your system via secure, tokenized URLs without requiring user accounts. Each link is tied to a specific entity (Purchase Order or Transfer) and purpose (invoice submission or document upload), with full lifecycle tracking.

## User Flows

- Generate magic link from PO or Transfer detail
- Configure recipient email, name, expiration, and custom message
- View all magic links with status, recipient, entity, and expiration
- Filter by status (active, submitted, expired, revoked) and entity type
- Send reminder emails for pending submissions
- Revoke active links
- Regenerate expired or revoked links
- View event timeline for each link
- External users: Submit invoices with actual prices via supplier form
- External users: Upload shipping documents via transfer document form

## Design Decisions

- Token-based security with hash storage (raw token shown only once)
- One-time submission model (link unusable after form submitted)
- Event timeline tracks all link activity (created, sent, viewed, submitted)
- Separate form experiences for invoice submission vs document upload
- Rate limiting on token lookup for security
- IP logging (anonymized) for audit trail

## Data Used

**Entities:** `MagicLink`, `MagicLinkEvent`, `MagicLinksSummary`

**From global model:**
- PurchaseOrder (for invoice submission links)
- Transfer (for document upload links)
- Supplier (recipient info for PO links)
- ShippingAgent (recipient info for transfer links)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `MagicLinksView` - Main list view with filters and stats
- `GenerateMagicLinkModal` - Modal for creating new links
- `MagicLinkDetail` - Detail panel with timeline and actions
- `SupplierInvoiceForm` - External form for supplier price submission
- `TransferDocumentForm` - External form for shipping partner document upload

## Callback Props

| Callback | Description |
|----------|-------------|
| `onViewLink` | Called when user clicks to view link details |
| `onRevokeLink` | Called when user revokes an active link |
| `onRegenerateLink` | Called when user regenerates an expired/revoked link |
| `onSendReminder` | Called when user sends reminder email |
| `onViewEntity` | Called when user clicks to view linked PO or Transfer |
| `onGenerate` | Called when user generates a new magic link |
| `onSubmit` | Called when external user submits invoice or documents |
