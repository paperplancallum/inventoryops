# Data Model

## Entities

### Brand
An organizational grouping for products representing an internal brand, product line, or business unit. Enables users managing multiple brands to filter and organize their catalog while keeping a unified view. Contains name, description, and optional logo.

### AmazonConnection
A connected Amazon Seller Central account that provides API access to one or more marketplaces. Contains OAuth credentials (refresh token, client ID, client secret), the seller ID, and the list of enabled marketplaces (e.g., US, CA, UK, DE). One account can sell products from multiple internal Brands. Tracks connection status (connected, disconnected, expired, pending) and last sync timestamp.

### Product
A SKU you sell on Amazon. Contains core product details, Amazon identifiers (ASIN, FNSKU), and pricing information. Belongs to a Brand for organizational purposes.

### Supplier
A manufacturer or vendor you purchase from. Contains contact information, lead times, payment terms, and optionally references a factory Location where they manufacture.

### PurchaseOrder
An order placed with a supplier, containing one or more products with quantities ordered. Tracks order status and expected dates.

### Shipment
A physical movement of goods (container, air freight, etc.) with its own logistics and costs. Can contain units from one or multiple purchase orders, including partial quantities from each.

### Batch
A trackable lot of units for a specific product, linking a PurchaseOrder to a Shipment. Represents "X units of Product Y from PO Z in Shipment W." The `quantity` field is immutable and represents the original ordered amount. Current quantities at locations are derived from the Stock Ledger. Batches provide provenance/lineage tracking for FIFO and cost allocation.

### Cost
An expense record that can be linked to a PurchaseOrder (product cost), Shipment (freight, duties), or Batch (inspection). Used to calculate true landed cost per unit by distributing costs across the relevant batches.

### Payment
A payment made toward a cost. Tracks payment date, amount, and method.

### Inspection
A quality control record tied to a batch. Contains inspection results, defect rates, and pass/fail decisions. Assigned to an InspectionAgent who performs the on-site inspection.

### InspectionAgent
A third-party inspector or inspection agency that performs pre-shipment quality control at supplier facilities. Contains contact information, location/region of operation, hourly rate, and areas of expertise (specialties).

### Location
A named physical location where inventory can reside. Includes factories, 3PL warehouses, ports, and Amazon fulfillment centers (FBA and AWD). Contains address information, contact details, and location type.

### Transfer
A physical movement of inventory from one Location to another. Contains TransferLineItems that specify which batches and quantities to move. Captures carrier, shipping method, tracking numbers, costs, documents, and customs information. When a transfer completes, stock ledger entries are created to update quantities. For Amazon destinations, also tracks receiving status through the check-in process.

### TransferLineItem
A line item within a Transfer that specifies a source Batch and quantity to move. Enables partial transfers (e.g., transferring 500 of 1000 units from a batch). Tracks per-line receiving status and discrepancies. Links to the debit/credit StockLedgerEntries created when the transfer is processed.

### StockLedgerEntry
An immutable record of a stock movement. Uses double-entry accounting: every movement creates a debit (negative quantity at source) and credit (positive quantity at destination). Movement types include: initial_receipt (from PO), transfer_out, transfer_in, adjustment_add, adjustment_remove, and amazon_reconcile. The sum of all confirmed entries for a batch at a location equals the current stock quantity.

### Stock
A computed view representing the current stock position for a Batch at a Location. Derived from summing StockLedgerEntries. Tracks total quantity, available quantity (not reserved), and reserved quantity (held for pending transfers). Used for FIFO prioritization via firstReceivedAt timestamp.

### ShippingAgent
A freight forwarder, logistics company, or carrier that handles shipment logistics. Contains contact information, supported shipping modes (ocean, air, ground, rail, courier, multimodal), service regions, payment terms, and credit limit. Referenced by Transfers when arranging shipments through a logistics partner. Can receive magic links for document collection.

### MagicLink
A secure, tokenized URL that allows external stakeholders to interact with specific records without requiring user accounts. Links to a PurchaseOrder or Transfer with a specific purpose (invoice-submission, document-upload). Tracks lifecycle events including when the link was sent, viewed, and submitted. Has configurable expiration.

### MagicLinkEvent
An immutable audit record tracking magic link activity. Events include: created, sent, viewed, form_started, validation_error, submitted, expired, revoked, regenerated. Captures request context (IP, user agent) for security monitoring.

### SupplierInvoice
A price submission from a supplier in response to a PurchaseOrder, created when a magic link is generated. Contains line items with original quoted prices vs supplier-submitted actual prices, plus additional costs (handling, rush fees, etc.). Goes through a review workflow: pending -> approved/rejected. On approval, updates the linked PO's line item prices and creates Cost records for additional costs. Supports revision chains when supplier resubmits.

### SupplierInvoiceLineItem
A line item within a SupplierInvoice corresponding to a PO line item. Captures the original quoted unit price and the supplier's submitted actual price, enabling variance calculation and comparison during review.

### SupplierInvoiceCost
An additional cost submitted by a supplier as part of their invoice (handling fee, rush fee, tooling, shipping, inspection, etc.). Can be a flat amount or per-unit cost.

### POLineItemPriceHistory
An audit trail entry for price changes on PO line items. Created whenever a line item's unit cost changes, capturing the old value, change timestamp, reason for change (initial, supplier_invoice, manual_edit), and optionally linking to the SupplierInvoice that triggered the change.

### GeneratedDocument
A PDF document generated from a record in the system (PurchaseOrder, Inspection, or Transfer). Stores metadata about when and by whom the document was generated, plus an immutable snapshot of the source data at generation time. This enables historical accuracy—you can always see exactly what data was in the document when it was sent, even if the source record has since been updated. The PDF file is stored in the system for later retrieval. Document types include: purchase-order-pdf (PO sent to supplier), inspection-brief (summary sent TO the inspection agency before inspection), shipping-manifest (carrier logistics document), and packing-list (detailed contents list for receiver).

### ProductSpecSheet
A PDF specification document attached to a Product that serves as the single source of truth for product specifications. Contains technical details, dimensions, materials, quality standards, and manufacturing requirements. Can be versioned (e.g., v1.0, v2.1) and is referenced in Inspection Briefs so inspectors know exactly what standards to check against.

## Relationships

- Brand has many Products
- Product belongs to a Brand (required)
- AmazonConnection provides API access for syncing Products to enabled Marketplaces
- Product can have multiple Suppliers (many-to-many)
- Supplier has many PurchaseOrders
- Supplier optionally references a Location (factory type) where they manufacture
- PurchaseOrder belongs to a Supplier and contains multiple Products (with quantities)
- Shipment contains many Batches (from one or multiple PurchaseOrders)
- Batch belongs to a PurchaseOrder, a Product, and a Shipment
- Batch has many StockLedgerEntries (tracking all movements of its units)
- Batch has many Stock records (current quantities at each Location)
- Cost belongs to a PurchaseOrder, Shipment, or Batch (depending on cost type)
- Payment belongs to a Cost
- Inspection belongs to a Batch
- Inspection is assigned to an InspectionAgent
- InspectionAgent can have many Inspections
- Location can be the source or destination for many Transfers
- Location has many Stock records (quantities of various batches at that location)
- Location has many StockLedgerEntries (movements in/out of that location)
- Transfer belongs to a source Location and a destination Location
- Transfer has many TransferLineItems (specifying batches and quantities)
- TransferLineItem belongs to a Transfer and references a Batch
- TransferLineItem links to two StockLedgerEntries (debit at source, credit at destination)
- StockLedgerEntry belongs to a Batch and a Location
- StockLedgerEntry may belong to a Transfer (for transfer_in/transfer_out types)
- Stock is derived from StockLedgerEntries for a Batch at a Location
- Transfer costs can be linked to Cost records for landed cost calculations
- When Transfer completes, StockLedgerEntries are created to update Stock quantities
- ShippingAgent can handle many Transfers (via shippingAgentId)
- Transfer optionally references a ShippingAgent
- MagicLink belongs to a PurchaseOrder or Transfer (polymorphic via linkedEntityType)
- MagicLink has many MagicLinkEvents (audit trail)
- PurchaseOrder may have many SupplierInvoices (revision chain)
- PurchaseOrder has at most one active SupplierInvoice (pending status)
- SupplierInvoice belongs to a PurchaseOrder
- SupplierInvoice has many SupplierInvoiceLineItems
- SupplierInvoiceLineItem references a PO LineItem
- SupplierInvoice has many SupplierInvoiceCosts
- SupplierInvoice may link to a previous SupplierInvoice (revision chain)
- SupplierInvoice approval creates Cost records (for additional costs)
- POLineItemPriceHistory belongs to a PO LineItem
- POLineItemPriceHistory may reference a SupplierInvoice (if change was from invoice approval)
- GeneratedDocument belongs to a PurchaseOrder, Inspection, or Transfer (polymorphic via sourceEntityType)
- GeneratedDocument was created by a User
- PurchaseOrder can have many GeneratedDocuments (document history)
- Inspection can have many GeneratedDocuments (document history)
- Transfer can have many GeneratedDocuments (document history)
- Product has one optional ProductSpecSheet
- ProductSpecSheet belongs to a Product
- ProductSpecSheet is referenced by Inspection Briefs (via specSheetUrl in line items)
