# Inspections

## Overview
Manage pre-shipment quality control inspections for batches at the factory. Capture detailed QC data including defect rates, measurements, packaging condition, and photos. Track rework requests and re-inspections when batches fail. Maintain a roster of inspection agents to assign to inspections.

## User Flows
- View all inspections in a list, filterable by batch, status, or date range
- Schedule a new inspection for a batch (select batch, set date, assign agent)
- Record inspection results: pass/fail, defect rate, sample size, defect types found
- Add detailed checks: measurements, weight, packaging condition, labeling accuracy
- Attach photos documenting defects or product condition
- If failed: create rework request with instructions for supplier
- Schedule re-inspection after rework is complete
- View inspection history for any batch
- Generate inspection report PDF with immutable snapshot
- Manage inspection agents (add, edit, toggle active status)
- Message inspection agents within inspection context

## Design Decisions
- Two tabs: Inspections (QC records) and Agents (inspector roster)
- Per-line-item results allow individual product pass/fail within a PO
- Photo gallery grouped by type (defect, product, packaging)
- Rework workflow integrated into inspection detail
- Document history tracks all generated reports
- Inspection agents have specialties and hourly rates
- Payment terms configurable per agent

## Data Used
**Entities:** Inspection, InspectionLineItem, InspectionAgent, Defect, MeasurementCheck, PackagingCheck, InspectionPhoto, ReworkRequest, InspectionMessage, InspectionSummary

**From global model:** Inspections, Inspection Agents, Purchase Orders, Products, Payment Terms Templates

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `InspectionsView` - Main tabbed view with Inspections and Agents tabs
- `InspectionTable` - List of all inspections with status badges
- `InspectionDetailPanel` - Full inspection details with line items, photos, rework
- `InspectionForm` - Form for scheduling inspections
- `DefectChecklist` - Checklist UI for recording defects
- `PhotoGallery` - Gallery of inspection photos
- `ReworkForm` - Form for creating rework requests
- `AgentsTable` - Table of inspection agents
- `AgentForm` - Form for add/edit agents
- `MessageThread` - Messaging component for agent communication

## Callback Props
| Callback | Description |
|----------|-------------|
| `onViewInspection` | Called when user views inspection detail (receives id) |
| `onEditInspection` | Called when user edits inspection (receives id) |
| `onDeleteInspection` | Called when user deletes inspection (receives id) |
| `onScheduleInspection` | Called when user schedules new inspection |
| `onStartInspection` | Called when user begins recording results (receives id) |
| `onCreateRework` | Called when user creates rework request (receives id) |
| `onScheduleReinspection` | Called when user schedules re-inspection (receives id) |
| `onViewBatch` | Called when user navigates to batch (receives batchId) |
| `onGenerateReport` | Called when user generates report PDF (receives id) |
| `onViewDocumentHistory` | Called when user views past reports (receives id) |
| `onAddAgent` | Called when user adds new agent |
| `onEditAgent` | Called when user edits agent (receives id) |
| `onDeleteAgent` | Called when user deletes agent (receives id) |
| `onToggleAgentStatus` | Called when user toggles agent active state (receives id) |
| `onSendMessage` | Called when user sends message (receives inspectionId, content) |
| `onAddNote` | Called when user adds internal note (receives inspectionId, content) |
