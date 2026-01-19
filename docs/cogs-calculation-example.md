# COGS Calculation Simulation

This document walks through how COGS is calculated with realistic examples covering multiple POs, products, and split shipments.

---

## Scenario Setup

### Purchase Orders

**PO-001** (Supplier: Shenzhen Widgets)
| Product | SKU | Qty | Unit Cost | Total |
|---------|-----|-----|-----------|-------|
| Widget A | WGT-A | 500 | $5.00 | $2,500 |
| Widget B | WGT-B | 300 | $8.00 | $2,400 |
| **Total** | | **800** | | **$4,900** |

**PO-002** (Supplier: Guangzhou Parts)
| Product | SKU | Qty | Unit Cost | Total |
|---------|-----|-----|-----------|-------|
| Widget A | WGT-A | 1000 | $4.50 | $4,500 |
| Gadget C | GDG-C | 200 | $15.00 | $3,000 |
| **Total** | | **1200** | | **$7,500** |

---

## Batches Created

When POs are received, batches are created:

| Batch # | PO | SKU | Qty | Unit Cost | Ordered Date | Stage |
|---------|-----|-----|-----|-----------|--------------|-------|
| B-001 | PO-001 | WGT-A | 500 | $5.00 | Jan 5 | factory |
| B-002 | PO-001 | WGT-B | 300 | $8.00 | Jan 5 | factory |
| B-003 | PO-002 | WGT-A | 1000 | $4.50 | Jan 10 | factory |
| B-004 | PO-002 | GDG-C | 200 | $15.00 | Jan 10 | factory |

---

## Transfers & Shipping Cost Allocation

### Transfer T-001: Split Shipment (Air Freight)
Ships some of PO-001 to Amazon FBA

| From | To | Total Shipping Cost |
|------|----|---------------------|
| Factory | Amazon FBA | **$800** |

**Line Items:**
| Batch | SKU | Qty Shipped |
|-------|-----|-------------|
| B-001 | WGT-A | 200 |
| B-002 | WGT-B | 150 |
| **Total** | | **350 units** |

**Shipping Cost Allocation (by quantity):**
```
B-001 (WGT-A): $800 × (200/350) = $457.14
B-002 (WGT-B): $800 × (150/350) = $342.86
```

### Transfer T-002: Remaining PO-001 (Ocean Freight)
| From | To | Total Shipping Cost |
|------|----|---------------------|
| Factory | Amazon FBA | **$400** |

**Line Items:**
| Batch | SKU | Qty Shipped |
|-------|-----|-------------|
| B-001 | WGT-A | 300 |
| B-002 | WGT-B | 150 |
| **Total** | | **450 units** |

**Shipping Cost Allocation:**
```
B-001 (WGT-A): $400 × (300/450) = $266.67
B-002 (WGT-B): $400 × (150/450) = $133.33
```

### Transfer T-003: Full PO-002 (Ocean Freight)
| From | To | Total Shipping Cost |
|------|----|---------------------|
| Factory | Amazon FBA | **$1,200** |

**Line Items:**
| Batch | SKU | Qty Shipped |
|-------|-----|-------------|
| B-003 | WGT-A | 1000 |
| B-004 | GDG-C | 200 |
| **Total** | | **1200 units** |

**Shipping Cost Allocation:**
```
B-003 (WGT-A): $1,200 × (1000/1200) = $1,000.00
B-004 (GDG-C): $1,200 × (200/1200)  = $200.00
```

---

## Volumetric Weight-Based Allocation

**NEW: Transfer costs are now allocated by volumetric weight, not just quantity.**

### Why Volumetric Weight?
Shipping carriers charge based on dimensional weight (whichever is greater: actual weight or volumetric weight). A large, light item costs more to ship than a small, heavy one.

### How It Works

**Formula:**
```
Volumetric Weight = (Length × Width × Height) / Dim Factor
Billable Weight = MAX(Actual Weight, Volumetric Weight)
```

Default dim factor: 5000 (for cm/kg), or 139 (for inches/lbs)

**Example Product Dimensions:**
| Product | L × W × H (cm) | Actual Weight | Volumetric Weight | Billable Weight |
|---------|----------------|---------------|-------------------|-----------------|
| Widget A | 10 × 10 × 5 | 0.3 kg | 0.1 kg | 0.3 kg |
| Widget B | 30 × 20 × 15 | 0.5 kg | 1.8 kg | 1.8 kg |
| Gadget C | 40 × 30 × 25 | 2.0 kg | 6.0 kg | 6.0 kg |

**Transfer T-003 Reallocation (with volumetric weight):**
```
Total billable weight: (1000 × 0.3) + (200 × 6.0) = 300 + 1200 = 1500 kg-equiv

B-003 (WGT-A): $1,200 × (300 / 1500) = $240.00  (was $1,000 by quantity)
B-004 (GDG-C): $1,200 × (1200 / 1500) = $960.00  (was $200 by quantity)
```

**Impact:** Bulky items (Gadget C) now bear proportionally more shipping cost, reflecting true freight economics.

**Fallback:** If a product has no dimensions set, the system falls back to quantity-based allocation (treats each unit as 1 kg equivalent).

---

## Batch Cost Summary (After Transfers)

| Batch | SKU | Qty | Product Cost | Transfer Cost | Total Cost | Unit Cost |
|-------|-----|-----|--------------|---------------|------------|-----------|
| B-001 | WGT-A | 500 | $2,500 | $723.81 | $3,223.81 | **$6.45** |
| B-002 | WGT-B | 300 | $2,400 | $476.19 | $2,876.19 | **$9.59** |
| B-003 | WGT-A | 1000 | $4,500 | $1,000.00 | $5,500.00 | **$5.50** |
| B-004 | GDG-C | 200 | $3,000 | $200.00 | $3,200.00 | **$16.00** |

**Note:** B-001 has higher unit cost ($6.45) than B-003 ($5.50) for the same SKU because:
- B-001 used expensive air freight (split shipment)
- B-003 used cheaper ocean freight

---

## Sales & FIFO Attribution

### January Sales

| Order Date | SKU | Qty Sold | Ship Date |
|------------|-----|----------|-----------|
| Jan 20 | WGT-A | 400 | Jan 22 |
| Jan 25 | WGT-B | 200 | Jan 27 |
| Jan 28 | WGT-A | 800 | Jan 30 |

### FIFO Attribution Process

**Sale 1: 400 units of WGT-A**
```
Available batches (oldest first):
  B-001: 500 units @ $6.45 (ordered Jan 5) ✓ OLDEST
  B-003: 1000 units @ $5.50 (ordered Jan 10)

Attribution:
  B-001: 400 units × $6.45 = $2,580.00

Remaining after sale:
  B-001: 100 units
  B-003: 1000 units
```

**Sale 2: 200 units of WGT-B**
```
Available batches:
  B-002: 300 units @ $9.59 (only batch)

Attribution:
  B-002: 200 units × $9.59 = $1,918.00

Remaining: B-002: 100 units
```

**Sale 3: 800 units of WGT-A**
```
Available batches (oldest first):
  B-001: 100 units @ $6.45 ✓ DEPLETED FIRST
  B-003: 1000 units @ $5.50

Attribution (spans two batches!):
  B-001: 100 units × $6.45 = $645.00
  B-003: 700 units × $5.50 = $3,850.00
  Total: $4,495.00

Remaining: B-003: 300 units
```

---

## COGS Report: January 2026

### By Product (Using Default Profile)

| SKU | Units Sold | Product Cost | Transfer Cost | Inbound Fees | Losses | Total COGS | Avg/Unit |
|-----|------------|--------------|---------------|--------------|--------|------------|----------|
| WGT-A | 1200 | $7,075.00 | $1,423.81 | $0 | $0 | $8,498.81 | $7.08 |
| WGT-B | 200 | $1,918.00 | $317.46 | $0 | $0 | $2,235.46 | $11.18 |
| **Total** | **1400** | **$8,993.00** | **$1,741.27** | **$0** | **$0** | **$10,734.27** | **$7.67** |

*Transfer costs are included when `include_shipping_to_amazon` is enabled (default profile has this ON)*

### Breakdown of WGT-A Product Cost
```
Sale 1: 400 × $6.45 (B-001) = $2,580
Sale 3: 100 × $6.45 (B-001) + 700 × $5.50 (B-003) = $645 + $3,850 = $4,495
Total: $7,075
Average: $7,075 / 1200 = $5.90/unit
```

**Key Insight:** Even though B-003 had a lower unit cost ($5.50), the weighted average COGS is $5.90 because older, more expensive B-001 inventory was sold first (FIFO).

### Breakdown of WGT-A Transfer Cost
```
Transfer cost per unit from batches:
  B-001: $723.81 / 500 units = $1.4476/unit
  B-003: $1,000 / 1000 units = $1.00/unit

FIFO attribution (same as product cost):
  Sale 1 (400 units): 400 from B-001 → 400 × $1.4476 = $579.05
  Sale 3 (800 units): 100 from B-001 + 700 from B-003
    → 100 × $1.4476 + 700 × $1.00 = $144.76 + $700.00 = $844.76

Total WGT-A transfer: $579.05 + $844.76 = $1,423.81
```

### Breakdown of WGT-B Transfer Cost
```
Transfer cost per unit:
  B-002: $476.19 / 300 units = $1.587/unit

Sale 2 (200 units): 200 from B-002 → 200 × $1.587 = $317.46
```

---

## Adding Amazon Fees

### Inbound Placement Fees (January)

| Fee ID | Type | Amount | Allocation |
|--------|------|--------|------------|
| F-001 | inbound_placement | $150 | WGT-A: $100, WGT-B: $50 |

### COGS with Fees (Default Profile)

| SKU | Units | Product Cost | Inbound | Total COGS | Avg/Unit |
|-----|-------|--------------|---------|------------|----------|
| WGT-A | 1200 | $7,075 | $100 | $7,175 | $5.98 |
| WGT-B | 200 | $1,918 | $50 | $1,968 | $9.84 |

### COGS with Fees (SellerBoard Profile)
SellerBoard profile excludes inbound fees (they track separately):

| SKU | Units | Product Cost | Inbound | Total COGS | Avg/Unit |
|-----|-------|--------------|---------|------------|----------|
| WGT-A | 1200 | $7,075 | $0 | $7,075 | $5.90 |
| WGT-B | 200 | $1,918 | $0 | $1,918 | $9.59 |

---

## Inventory Loss Example

### Damaged Inventory (Jan 28)

| Product | Batch | Qty Lost | Unit Cost | Gross Loss | Reimbursement | Net Loss |
|---------|-------|----------|-----------|------------|---------------|----------|
| GDG-C | B-004 | 10 | $16.00 | $160.00 | $50.00 | $110.00 |

### COGS Impact (Default Profile)
Net loss of $110 is included in COGS for GDG-C:

| SKU | Units Sold | Product Cost | Losses | Total COGS |
|-----|------------|--------------|--------|------------|
| GDG-C | 0 | $0 | $110 | $110 |

### COGS Impact (SellerBoard Profile)
Losses excluded (SellerBoard tracks reimbursements):

| SKU | Units Sold | Product Cost | Losses | Total COGS |
|-----|------------|--------------|--------|------------|
| GDG-C | 0 | $0 | $0 | $0 |

---

## Summary: Where Costs Come From

```
┌─────────────────────────────────────────────────────────────────┐
│                         COGS COMPONENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │  PO Line Item │───▶│    Batch      │───▶│ Sale (FIFO)   │   │
│  │  (unit_cost)  │    │ (unit_cost +  │    │ Attribution   │   │
│  └───────────────┘    │  transfer)    │    └───────────────┘   │
│                       └───────────────┘            │            │
│                              │                     │            │
│                              ▼                     ▼            │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │   Transfer    │───▶│  batch_cogs   │    │ Product Cost  │   │
│  │ (total_cost)  │    │    (view)     │    │  (from FIFO)  │   │
│  └───────────────┘    └───────────────┘    └───────────────┘   │
│                                                    │            │
│  ┌───────────────┐                                 │            │
│  │  Amazon Fees  │─────────────────────────────────┤            │
│  │ (allocated)   │                                 │            │
│  └───────────────┘                                 │            │
│                                                    │            │
│  ┌───────────────┐                                 │            │
│  │   Inventory   │─────────────────────────────────┤            │
│  │    Losses     │                                 │            │
│  └───────────────┘                                 ▼            │
│                                            ┌───────────────┐   │
│                                            │  Total COGS   │   │
│                                            │  (by period)  │   │
│                                            └───────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Product Cost (FIFO) | ✅ Working | `sales_batch_attributions` table |
| Transfer Cost Tracking | ✅ Working | `batch_cogs` view calculates it |
| Transfer Cost in COGS | ✅ Working | Included in `calculate_product_cogs()` |
| Volumetric Weight Allocation | ✅ Working | Prorates by billable weight; falls back to quantity |
| Product Dimensions | ✅ Working | `length_cm`, `width_cm`, `height_cm`, `weight_kg` on products |
| Amazon Fee Allocation | ✅ Working | `amazon_fee_allocations` table |
| Inventory Losses | ✅ Working | `inventory_losses` table |
| Settings Profiles | ✅ Working | 4 profiles: default, sellerboard, full, quickbooks |
| Monthly Reports | ✅ Working | By product, by month |
| Batch FIFO Report | ✅ Working | Shows depletion over time |
