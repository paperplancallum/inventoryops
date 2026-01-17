# Transfers

## Overview
Track and manage the physical movement of inventory batches between named locations (factories, 3PL warehouses, Amazon FBA/AWD centers). Capture detailed logistics information including carriers, shipping methods, tracking numbers, costs, customs data, and shipping documents. Three tabbed views: Transfers (main list), Shipping Agents (freight forwarders), and Amazon Shipments (SP-API inbound).

## User Flows
- View all transfers in a filterable table sorted by date
- Create a new transfer: select source/destination locations, add line items with quantities, set carrier and shipping details
- View transfer detail with full timeline, documents, costs, and customs info
- Edit transfer details (dates, costs, tracking numbers)
- Update transfer status (mark as departed, arrived, completed)
- Cancel a transfer (returns stock to source location)
- Upload shipping documents (BOL, customs forms, packing lists)
- Add/edit multiple tracking numbers per transfer
- Record customs broker and clearance status
- Track Amazon receiving progress (check-in, receiving, received, closed)
- Generate shipping manifest PDF
- Manage shipping agents with contact info and service offerings
- Message shipping agents within context
- View Amazon SP-API shipments and link to internal transfers

## Design Decisions
- Three tabs: Transfers, Shipping Agents, Amazon Shipments
- Line items support partial transfers (transfer 500 of 1000 units)
- Status workflow: Draft > Booked > In Transit > Delivered > Completed
- Stock ledger entries created when transfer processes
- Amazon Shipment ID links internal transfer to Amazon inbound shipment
- Shipping agents have service types (ocean, air, trucking, rail, courier)
- Document history tracks all generated manifests

## Data Used
**Entities:** Transfer, TransferLineItem, Location, ShippingAgent, TransferDocument, TrackingNumber, TransferCosts, CustomsInfo, AmazonReceiving, AmazonShipment, AmazonShipmentItem, StatusHistoryEntry

**From global model:** Transfers, Locations, Stock, Shipping Agents, Amazon Shipments, Invoices

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `TransfersView` - Main tabbed view
- `TransferTable` - List of all transfers
- `TransferDetailPanel` - Full transfer details with timeline, costs, documents
- `TransferForm` - Form for creating/editing transfers with line item selector
- `DocumentUpload` - Document upload and management
- `TrackingNumberList` - List of tracking numbers with external links
- `CustomsSection` - Customs information display and edit
- `AmazonReceivingProgress` - Progress tracker for Amazon receiving
- `ShippingAgentsView` - Table of shipping agents
- `ShippingAgentForm` - Form for add/edit agents
- `AmazonShipmentsView` - Amazon SP-API shipments list
- `ManifestGenerator` - Shipping manifest PDF generation

## Callback Props
| Callback | Description |
|----------|-------------|
| `onViewTransfer` | Called when user views transfer detail (receives id) |
| `onEditTransfer` | Called when user edits transfer (receives id) |
| `onDeleteTransfer` | Called when user deletes transfer (receives id) |
| `onCreateTransfer` | Called when user creates new transfer |
| `onUpdateStatus` | Called when status changes (receives id, newStatus) |
| `onAddDocument` | Called when user uploads document (receives transferId, file) |
| `onRemoveDocument` | Called when user removes document (receives transferId, documentId) |
| `onManageLocations` | Called when user opens locations management |
| `onViewAgent` | Called when user views agent detail (receives id) |
| `onEditAgent` | Called when user edits agent (receives id) |
| `onDeleteAgent` | Called when user deletes agent (receives id) |
| `onCreateAgent` | Called when user creates new agent |
| `onToggleAgentActive` | Called when user toggles agent status (receives id) |
| `onGenerateManifest` | Called when user generates manifest PDF (receives id) |
| `onViewDocumentHistory` | Called when user views past documents (receives id) |
