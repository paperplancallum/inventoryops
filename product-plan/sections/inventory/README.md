# Inventory

## Overview
Track inventory batches through pipeline stages (ordered > factory > inspected > in-transit > warehouse > Amazon). Users can view batches in either a visual kanban board or table view, move items between stages, and reconcile quantities with Amazon. Includes stock ledger for movement tracking and Amazon SP-API integration.

## User Flows
- View all batches in pipeline (kanban) or table view, toggle between them
- Create batches manually or have them auto-generated from Purchase Orders
- Move batches between stages via drag-drop (pipeline) or dropdown (table)
- Open batch detail to view full stage history/timeline
- Edit batch info (quantities, dates, notes, costs)
- Split a batch into multiple batches or merge batches together
- Attach documents and photos to batches
- Import Amazon inventory data and compare against expected quantities
- Track and flag discrepancies between batch quantities and Amazon
- Multi-select stock items to initiate transfers
- View stock ledger entries for audit trail

## Design Decisions
- Two tabbed views: Pipeline (kanban/table of batches) and Amazon (SP-API inventory)
- Pipeline view toggleable between kanban and table modes
- Stock ledger provides immutable audit trail of all movements
- Amazon SKU mapping enables reconciliation with internal catalog
- Stock positions derived from ledger entries (computed, not stored)
- Aggregation views available by Product or by Location

## Data Used
**Entities:** Batch, Stock, StockLedgerEntry, PipelineStage, AmazonReconciliation, AmazonInventoryItem, AmazonInventorySummary, AmazonSkuMapping, ProductStockGroup, LocationStockGroup

**From global model:** Batches/Stock, Products, Locations, Purchase Orders, Transfers, Amazon Inventory

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `InventoryView` - Main tabbed view with Pipeline and Amazon tabs
- `PipelineView` - Kanban/table view of batches by stage
- `BatchCard` - Individual batch card in kanban
- `BatchDetailPanel` - Full batch details with timeline and ledger
- `StockTable` - Table of current stock positions
- `AmazonInventoryView` - Amazon SP-API inventory display
- `SKUMappingModal` - Map Amazon SKUs to internal catalog
- `TransferInitiationBar` - Floating bar for multi-select transfer

## Callback Props
| Callback | Description |
|----------|-------------|
| `onViewBatch` | Called when user clicks batch to view details |
| `onEditBatch` | Called when user wants to edit batch (receives id) |
| `onDeleteBatch` | Called when user wants to delete batch (receives id) |
| `onMoveBatch` | Called when batch moved to new stage (receives batchId, newStage) |
| `onSplitBatch` | Called when user splits a batch (receives id) |
| `onMergeBatches` | Called when user merges batches (receives batchIds array) |
| `onAddAttachment` | Called when user uploads file (receives batchId, file) |
| `onRemoveAttachment` | Called when user removes file (receives batchId, attachmentId) |
| `onImportAmazonData` | Called when user imports Amazon data |
| `onReconcileBatch` | Called when user reconciles with Amazon (receives batchId) |
| `onInitiateTransfer` | Called when user starts transfer (receives selectedStockIds) |
| `onViewStockHistory` | Called when user views ledger (receives batchId) |
| `onSyncAmazonInventory` | Called when user triggers Amazon sync |
| `onMapSku` | Called when user maps Amazon to internal SKU |
| `onUnmapSku` | Called when user removes SKU mapping |
| `onViewAmazonItem` | Called when user views Amazon item detail |
