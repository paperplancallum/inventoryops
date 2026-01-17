# Milestone 11: Magic Links

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Purchase Orders section, Transfers section

---

## Goal

Implement secure tokenized URLs that enable external stakeholders (suppliers, shipping partners) to interact with your system without requiring user accounts.

## Overview

Magic Links serve two primary purposes: (1) allowing suppliers to submit invoices with actual pricing for Purchase Orders, and (2) allowing shipping partners to upload transfer documents. Each link has full lifecycle tracking with events, expiration, and revocation capabilities.

**Key Functionality:**

- Generate magic links from PO or Transfer detail pages
- Manage all links from dedicated Magic Links page
- Send reminders and revoke/regenerate links
- Track link events (created, sent, viewed, submitted)
- External forms for invoice submission and document upload
- Automatic entity creation upon form submission

## Recommended Approach: Test-Driven Development

Before implementing, write tests based on `product-plan/sections/magic-links/tests.md`:

1. Write tests for link generation and token security
2. Write tests for link status transitions
3. Write tests for external form validation and submission
4. Write tests for expiration and revocation
5. Implement components to pass tests

## What to Implement

### Components

Copy from `product-plan/sections/magic-links/components/`:

- Magic Links list page with stats bar and filters
- Magic Link detail panel with event timeline
- Generate Magic Link modal
- External forms: Supplier Invoice Form, Transfer Document Form
- Confirmation pages for successful submissions

### Data Layer

Create API endpoints and database schema for:

- **MagicLink**: tokenHash, linkedEntityType, linkedEntityId, purpose, status, expiration, recipient info, submission data
- **MagicLinkEvent**: eventType, timestamp, IP address, user agent, metadata
- Token generation (32-byte random, URL-safe base64)
- Rate limiting on token lookup

### Callbacks

Wire up these callback props:

- `onGenerateLink(entityType, entityId, config)` - Create new magic link
- `onSendReminder(linkId)` - Send reminder email
- `onRevokeLink(linkId)` - Revoke link access
- `onRegenerateLink(linkId)` - Create fresh link from expired/revoked
- `onViewDetails(linkId)` - Open detail panel
- `onNavigateToEntity(entityType, entityId)` - Navigate to linked entity

### External Form Callbacks

- `onSubmitInvoice(token, invoiceData)` - Submit supplier invoice
- `onSubmitDocuments(token, documents)` - Submit transfer documents
- `onValidateToken(token)` - Verify token validity

### Security Implementation

- Store only token hash in database (not raw token)
- Implement rate limiting on token lookup endpoints
- Log IP addresses (anonymized) for audit trail
- Enforce one-time submission (link unusable after submit)
- Validate expiration on every access

### Empty States

Implement empty states for:

- No magic links created yet
- No links matching current filters
- Link expired or revoked (external user view)

## Files to Reference

- `product-plan/sections/magic-links/README.md` - Design intent
- `product-plan/sections/magic-links/components/` - React components
- `product-plan/sections/magic-links/types.ts` - TypeScript interfaces
- `product-plan/sections/magic-links/data.json` - Sample data
- `product-plan/sections/magic-links/tests.md` - Test specifications

## Expected User Flows

### 1. Generate Magic Link from PO
From PO detail, user clicks "Generate Magic Link". Modal opens with pre-filled supplier info. User configures expiration (7/14/30 days), optional message, and "Send immediately" checkbox. User clicks "Generate". System creates link and optionally sends email. User sees confirmation with link URL.

### 2. View All Links and Filter
User navigates to Magic Links page. Stats bar shows Active, Pending, Submitted, Expiring Soon counts. User filters by status (Active) and entity type (Purchase Order). Table shows filtered links with status badges and actions.

### 3. Send Reminder
From link row, user clicks "Send Reminder". System sends reminder email with the same link. Event logged in link timeline. Toast confirms reminder sent.

### 4. Revoke Link
From link detail, user clicks "Revoke". Confirmation dialog appears. User confirms. Link marked as revoked and can no longer be accessed. Event logged in timeline.

### 5. View Submission Data
User opens a "Submitted" link detail. Timeline shows full event history (created, sent, viewed, submitted). Submission Data section displays the submitted invoice or document details. User can navigate to the created SupplierInvoice or Transfer documents.

### 6. External: Submit Supplier Invoice (External User)
Supplier receives email with magic link. Clicks link, arrives at branded invoice form. Sees read-only PO info (products, quantities). Fills in unit price for each line item. Adds optional additional costs. Enters name, email, notes. Clicks "Submit Invoice". Sees confirmation page. Pending SupplierInvoice created for internal review.

## Done When

- [ ] Magic links generate with secure random tokens
- [ ] Only token hash stored in database
- [ ] Links page shows all links with correct status badges
- [ ] Stats bar shows accurate counts
- [ ] Filters work for status and entity type
- [ ] Generate modal pre-fills recipient from linked entity
- [ ] Send reminder logs event and sends email
- [ ] Revoke marks link unusable
- [ ] Regenerate creates fresh link from expired/revoked
- [ ] Detail panel shows full event timeline
- [ ] External invoice form loads PO data correctly
- [ ] External invoice form validates and submits
- [ ] External document form uploads files correctly
- [ ] Submission creates appropriate entity (SupplierInvoice or documents)
- [ ] Expired/revoked links show appropriate error page
- [ ] Rate limiting prevents brute force token guessing
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
