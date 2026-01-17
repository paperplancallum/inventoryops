# Data Model

## Core Entities

### Brand
An organizational grouping for products representing an internal brand, product line, or business unit.

### AmazonConnection
A connected Amazon Seller Central account that provides API access to one or more marketplaces.

### Product
A SKU you sell on Amazon with core product details, Amazon identifiers (ASIN, FNSKU), and pricing information.

### Supplier
A manufacturer or vendor you purchase from with contact information, lead times, and payment terms.

### PurchaseOrder
An order placed with a supplier, containing one or more products with quantities ordered.

### Shipment
A physical movement of goods (container, air freight, etc.) with its own logistics and costs.

### Batch
A trackable lot of units for a specific product, linking a PurchaseOrder to a Shipment.

### Cost
An expense record linked to a PurchaseOrder, Shipment, or Batch for landed cost calculation.

### Payment
A payment made toward a cost with date, amount, and method.

### Inspection
A quality control record tied to a batch with results, defect rates, and pass/fail decisions.

### InspectionAgent
A third-party inspector or inspection agency that performs pre-shipment quality control.

### Location
A named physical location where inventory can reside (factories, warehouses, Amazon FCs).

### Transfer
A physical movement of inventory from one Location to another with logistics details.

### TransferLineItem
A line item within a Transfer specifying a source Batch and quantity to move.

### StockLedgerEntry
An immutable record of a stock movement using double-entry accounting.

### Stock
A computed view representing current stock position for a Batch at a Location.

### ShippingAgent
A freight forwarder, logistics company, or carrier that handles shipment logistics.

### MagicLink
A secure, tokenized URL for external stakeholders to interact without user accounts.

### MagicLinkEvent
An immutable audit record tracking magic link activity.

### SupplierInvoice
A price submission from a supplier in response to a PurchaseOrder.

### GeneratedDocument
A PDF document generated from a record with immutable data snapshot.

## Relationships

See `types.ts` for TypeScript interface definitions and the full relationship diagram in the product spec.
