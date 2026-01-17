# Milestone 7: Inspections

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Milestone 4 (Purchase Orders) recommended

---

## Goal

Implement pre-shipment quality control inspection management for batches at factories, including defect tracking, rework requests, and a roster of inspection agents.

## Overview

Users can schedule inspections for batches, record detailed QC results (pass/fail, defect rates, measurements, photos), manage rework requests when batches fail, schedule re-inspections, and maintain a roster of inspection agents with their rates and specialties.

**Key Functionality:**
- View inspections list with summary stats
- Schedule new inspections for batches
- Record inspection results with line-item level detail
- Upload defect photos and inspection reports
- Create rework requests for failed inspections
- Manage inspection agents (add, edit, toggle active)

---

## Recommended Approach: Test-Driven Development

Before implementing each component, write tests based on the user flows below:

1. **Write failing tests** for the expected behavior
2. **Implement** the minimum code to pass tests
3. **Refactor** while keeping tests green

Focus tests on:
- Inspection scheduling and status transitions
- Defect rate calculations
- Pass/fail determination based on line items
- Rework request workflow
- Agent assignment and filtering

---

## What to Implement

### 1. Components

Copy the provided components from `product-plan/sections/inspections/components/`:
- `Inspections.tsx` — Main view with tabs for Inspections and Agents
- `InspectionDetailPanel.tsx` — Slide-over with full inspection data
- `InspectionLineItemRow.tsx` — Expandable row for line item results
- `InspectionAgentsTab.tsx` — Agent management table
- `InspectionAgentForm.tsx` — Add/edit agent modal
- `ReworkRequestForm.tsx` — Create rework request

### 2. Data Layer

**API Endpoints:**
```
GET    /api/inspections                  # List inspections with filters
GET    /api/inspections/:id              # Get inspection details
POST   /api/inspections                  # Schedule new inspection
PATCH  /api/inspections/:id              # Update inspection (record results)
POST   /api/inspections/:id/rework       # Create rework request
POST   /api/inspections/:id/reinspect    # Schedule re-inspection
POST   /api/inspections/:id/report       # Generate inspection report PDF

GET    /api/inspection-agents            # List agents
POST   /api/inspection-agents            # Create agent
PATCH  /api/inspection-agents/:id        # Update agent
DELETE /api/inspection-agents/:id        # Delete agent (soft delete)
```

**Database Schema:**
- `inspections` table with PO link, agent, status, dates
- `inspection_line_items` table for per-product results
- `inspection_defects` table for defect records
- `inspection_measurements` table for dimension checks
- `inspection_photos` table for photo attachments
- `rework_requests` table linked to inspections
- `inspection_agents` table for agent roster

### 3. Callbacks

Wire up these callback props:
- `onScheduleInspection` — Open scheduling form
- `onStartInspection` — Transition to in-progress, open recording UI
- `onViewInspection` — Open detail panel
- `onEditInspection` — Open edit form
- `onCreateRework` — Open rework request form
- `onScheduleReinspection` — Schedule follow-up inspection
- `onGenerateReport` — Generate PDF report
- `onAddAgent`, `onEditAgent`, `onDeleteAgent` — Agent CRUD
- `onToggleAgentStatus` — Toggle active/inactive
- `onSendMessage`, `onAddNote` — Communication with agent

### 4. Empty States

Handle these empty states:
- No inspections yet
- No inspections matching current filters
- No agents configured
- No defects found (good result!)
- No photos uploaded

---

## Files to Reference

- `product-plan/sections/inspections/README.md` — Section overview
- `product-plan/sections/inspections/spec.md` — Detailed specification
- `product-plan/sections/inspections/types.ts` — TypeScript interfaces
- `product-plan/sections/inspections/data.json` — Sample data
- `product-plan/sections/inspections/components/` — React components

---

## Expected User Flows

### View Inspections List
1. User navigates to Inspections
2. Summary stats show Total, Scheduled, Passed, Failed, Pending Rework
3. Table displays inspections with batch, product, date, agent, status, defect rate
4. User can filter by status (Scheduled, Passed, Failed, etc.)
5. Status badges indicate inspection state

### Create Inspection for Batch
1. User clicks "Schedule Inspection"
2. Form opens to select batch/PO
3. User sets inspection date
4. User assigns agent from active agents list
5. User saves inspection
6. Inspection appears in list as "Scheduled"

### Record Inspection Results
1. User clicks on scheduled inspection
2. Detail panel opens
3. User clicks "Start Inspection" to begin recording
4. For each line item:
   - Enter sample size inspected
   - Record defects found (type, quantity, severity)
   - Enter measurement checks (spec vs actual)
   - Note packaging condition
   - Upload photos
5. User marks inspection complete
6. System calculates overall defect rate and pass/fail

### Upload Inspection Report
1. From inspection detail, user clicks "Generate Report"
2. System generates PDF with inspection data snapshot
3. Report appears in Document History
4. User can download or share report
5. Multiple reports can be generated (e.g., before and after rework)

### Manage Inspection Agents
1. User clicks "Agents" tab
2. Table shows all agents with name, company, location, rate, status
3. User can search/filter agents
4. User clicks "Add Agent" to create new
5. Form collects: name, email, phone, company, location, hourly rate, specialties
6. User can toggle agent active/inactive
7. Only active agents appear in inspection assignment dropdown

---

## Done When

- [ ] Inspections list displays with summary stats
- [ ] Filters work for status, date range, agent
- [ ] New inspections can be scheduled for batches
- [ ] Inspection results can be recorded with defects, measurements, photos
- [ ] Overall defect rate calculates correctly from line items
- [ ] Pass/fail determination works based on defect thresholds
- [ ] Rework requests can be created for failed inspections
- [ ] Re-inspections can be scheduled after rework
- [ ] Inspection reports can be generated as PDF
- [ ] Agents tab shows all inspection agents
- [ ] Agents can be added, edited, toggled active/inactive
- [ ] Only active agents available for assignment
- [ ] Message thread works for agent communication
- [ ] Empty states display appropriately
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
