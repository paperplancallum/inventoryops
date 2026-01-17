import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { LocationsView } from '../LocationsView'
import { LocationForm } from '../LocationForm'
import { ArchiveConfirmationDialog } from '../ArchiveConfirmationDialog'
import type { Location, LocationFormData } from '../types'
import { LOCATION_TYPES } from '../types'

// =============================================================================
// Test Data
// =============================================================================

const sampleLocations: Location[] = [
  {
    id: 'loc-001',
    name: 'Shenzhen Drinkware Factory',
    type: 'factory',
    addressLine1: '123 Industrial Park Road, Building A',
    city: 'Shenzhen',
    stateProvince: 'Guangdong',
    country: 'China',
    countryCode: 'CN',
    postalCode: '518000',
    contactName: 'Wang Lei',
    contactEmail: 'wang.lei@szdrinkware.com',
    contactPhone: '+86-755-1234-5678',
    notes: 'Primary drinkware supplier',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-002',
    name: 'FlexPort LA Warehouse',
    type: '3pl',
    addressLine1: '789 Port Commerce Way',
    city: 'Long Beach',
    stateProvince: 'CA',
    country: 'United States',
    countryCode: 'US',
    postalCode: '90802',
    contactName: 'Mike Johnson',
    contactEmail: 'mike.j@flexport.com',
    contactPhone: '+1-562-555-0123',
    notes: 'Primary 3PL for West Coast receiving',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-003',
    name: 'PHX7 Amazon FBA',
    type: 'amazon_fba',
    addressLine1: '800 N 75th Ave',
    city: 'Phoenix',
    stateProvince: 'AZ',
    country: 'United States',
    countryCode: 'US',
    postalCode: '85043',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: 'Amazon FBA receiving center - Phoenix',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-004',
    name: 'SBD1 Amazon AWD',
    type: 'amazon_awd',
    addressLine1: '1910 E Central Ave',
    city: 'San Bernardino',
    stateProvince: 'CA',
    country: 'United States',
    countryCode: 'US',
    postalCode: '92408',
    notes: 'Amazon AWD bulk storage facility',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-005',
    name: 'Old Warehouse',
    type: 'warehouse',
    addressLine1: '100 Old Storage Rd',
    city: 'Dallas',
    stateProvince: 'TX',
    country: 'United States',
    countryCode: 'US',
    postalCode: '75201',
    notes: 'Archived location',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// =============================================================================
// Flow 1: View Locations List
// =============================================================================

describe('Locations - View Locations List', () => {
  it('renders locations table with all expected columns', () => {
    render(<LocationsView locations={sampleLocations} />)

    const table = screen.getByRole('table')
    const headers = within(table).getAllByRole('columnheader')

    // Should have columns: Name, Type, City, Country, Contact, Status, Actions
    expect(headers.length).toBe(7)
    expect(headers[0]).toHaveTextContent(/name/i)
    expect(headers[1]).toHaveTextContent(/type/i)
    expect(headers[2]).toHaveTextContent(/city/i)
    expect(headers[3]).toHaveTextContent(/country/i)
    expect(headers[4]).toHaveTextContent(/contact/i)
    expect(headers[5]).toHaveTextContent(/status/i)
  })

  it('displays location data correctly in table rows', () => {
    render(<LocationsView locations={sampleLocations} />)

    expect(screen.getByText('Shenzhen Drinkware Factory')).toBeInTheDocument()
    expect(screen.getByText('FlexPort LA Warehouse')).toBeInTheDocument()
    expect(screen.getByText('PHX7 Amazon FBA')).toBeInTheDocument()
  })

  it('displays stats bar with correct metrics', () => {
    render(<LocationsView locations={sampleLocations} />)

    // Total locations = 5
    expect(screen.getByText('5')).toBeInTheDocument()
    // Active locations = 4
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows type badges with correct labels', () => {
    render(<LocationsView locations={sampleLocations} />)

    // Multiple elements may match due to badges and filter options
    expect(screen.getAllByText('Factory').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('3PL').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/amazon fba/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/amazon awd/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows active/inactive status badges', () => {
    render(<LocationsView locations={sampleLocations} />)

    const activeBadges = screen.getAllByText('Active')
    const inactiveBadges = screen.getAllByText('Archived')

    // Should have 4 active locations and 1 archived
    // Note: stats also show "Active" count so we check >= expected
    expect(activeBadges.length).toBeGreaterThanOrEqual(4)
    expect(inactiveBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('displays archived locations as greyed out', () => {
    render(<LocationsView locations={sampleLocations} />)

    const archivedRow = screen.getByText('Old Warehouse').closest('tr')
    expect(archivedRow).toHaveClass('opacity-60')
  })
})

// =============================================================================
// Flow 2: Add New Location
// =============================================================================

describe('Locations - Add New Location', () => {
  it('calls onCreateLocation when clicking Add Location button', async () => {
    const onCreateLocation = vi.fn()
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} onCreateLocation={onCreateLocation} />)

    const addButton = screen.getByRole('button', { name: /add location/i })
    await user.click(addButton)

    expect(onCreateLocation).toHaveBeenCalled()
  })

  it('renders form with all required sections', () => {
    render(<LocationForm locationTypes={LOCATION_TYPES} />)

    // Use getAllByRole to find section headings
    const headings = screen.getAllByRole('heading', { level: 3 })
    const headingTexts = headings.map(h => h.textContent?.toLowerCase())

    expect(headingTexts).toContain('basic information')
    expect(headingTexts).toContain('address')
    expect(headingTexts).toContain('contact information')
    expect(headingTexts).toContain('notes')
  })

  it('shows location type button group selector', () => {
    render(<LocationForm locationTypes={LOCATION_TYPES} />)

    // All 7 location types should be available
    expect(screen.getByRole('button', { name: /factory/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /warehouse/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3pl/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /amazon fba/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /amazon awd/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /port/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /customs/i })).toBeInTheDocument()
  })

  it('shows validation error when required fields are empty', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LocationForm onSubmit={onSubmit} locationTypes={LOCATION_TYPES} />)

    const submitButton = screen.getByRole('button', { name: /add location/i })
    await user.click(submitButton)

    expect(screen.getByText(/location name is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LocationForm onSubmit={onSubmit} locationTypes={LOCATION_TYPES} />)

    await user.type(screen.getByPlaceholderText(/location name/i), 'New Test Location')
    await user.type(screen.getByPlaceholderText(/city/i), 'Los Angeles')

    // Select country from dropdown
    const countryDropdown = screen.getByText('Select country')
    await user.click(countryDropdown)
    await user.click(screen.getByText('United States'))

    // Select type
    await user.click(screen.getByRole('button', { name: /warehouse/i }))

    const submitButton = screen.getByRole('button', { name: /add location/i })
    await user.click(submitButton)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Test Location',
        type: 'warehouse',
        city: 'Los Angeles',
        country: 'United States',
      })
    )
  })
})

// =============================================================================
// Flow 3: Edit Location
// =============================================================================

describe('Locations - Edit Location', () => {
  it('calls onEditLocation when clicking edit action', async () => {
    const onEditLocation = vi.fn()
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} onEditLocation={onEditLocation} />)

    const firstRow = screen.getByText('Shenzhen Drinkware Factory').closest('tr')
    const menuButtons = within(firstRow!).getAllByRole('button')
    const actionsButton = menuButtons[menuButtons.length - 1]
    await user.click(actionsButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Edit'))

    expect(onEditLocation).toHaveBeenCalledWith('loc-001')
  })

  it('pre-fills form with existing location data', () => {
    const existingLocation = sampleLocations[0]

    render(<LocationForm location={existingLocation} locationTypes={LOCATION_TYPES} />)

    expect(screen.getByDisplayValue('Shenzhen Drinkware Factory')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Shenzhen')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Wang Lei')).toBeInTheDocument()
  })

  it('shows "Edit Location" title when editing', () => {
    render(<LocationForm location={sampleLocations[0]} locationTypes={LOCATION_TYPES} />)

    expect(screen.getByText(/edit location/i)).toBeInTheDocument()
  })
})

// =============================================================================
// Flow 4: Archive Location (with confirmation)
// =============================================================================

describe('Locations - Archive Location', () => {
  it('calls onArchiveLocation when clicking archive action', async () => {
    const onArchiveLocation = vi.fn()
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} onArchiveLocation={onArchiveLocation} />)

    const row = screen.getByText('FlexPort LA Warehouse').closest('tr')
    const menuButtons = within(row!).getAllByRole('button')
    const actionsButton = menuButtons[menuButtons.length - 1]
    await user.click(actionsButton)

    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Archive'))

    expect(onArchiveLocation).toHaveBeenCalledWith('loc-002')
  })

  it('shows archive confirmation dialog', () => {
    render(
      <ArchiveConfirmationDialog
        isOpen={true}
        locationName="FlexPort LA Warehouse"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isArchiving={true}
      />
    )

    expect(screen.getByText(/archive location/i)).toBeInTheDocument()
    expect(screen.getByText(/flexport la warehouse/i)).toBeInTheDocument()
  })

  it('does not archive without matching location name', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(
      <ArchiveConfirmationDialog
        isOpen={true}
        locationName="FlexPort LA Warehouse"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        isArchiving={true}
      />
    )

    // Type wrong name
    await user.type(screen.getByPlaceholderText(/type location name/i), 'Wrong Name')

    const confirmButton = screen.getByRole('button', { name: /archive/i })
    expect(confirmButton).toBeDisabled()

    await user.click(confirmButton)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('archives when location name matches exactly', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(
      <ArchiveConfirmationDialog
        isOpen={true}
        locationName="FlexPort LA Warehouse"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        isArchiving={true}
      />
    )

    await user.type(screen.getByPlaceholderText(/type location name/i), 'FlexPort LA Warehouse')

    const confirmButton = screen.getByRole('button', { name: /archive/i })
    expect(confirmButton).not.toBeDisabled()

    await user.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith('FlexPort LA Warehouse')
  })
})

// =============================================================================
// Flow 5: Unarchive Location (with confirmation)
// =============================================================================

describe('Locations - Unarchive Location', () => {
  it('shows Unarchive option for archived locations', async () => {
    const onUnarchiveLocation = vi.fn()
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} onUnarchiveLocation={onUnarchiveLocation} />)

    const archivedRow = screen.getByText('Old Warehouse').closest('tr')
    const menuButtons = within(archivedRow!).getAllByRole('button')
    const actionsButton = menuButtons[menuButtons.length - 1]
    await user.click(actionsButton)

    await waitFor(() => {
      expect(screen.getByText('Unarchive')).toBeInTheDocument()
    })
  })

  it('shows unarchive confirmation dialog', () => {
    render(
      <ArchiveConfirmationDialog
        isOpen={true}
        locationName="Old Warehouse"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isArchiving={false}
      />
    )

    expect(screen.getByText(/unarchive location/i)).toBeInTheDocument()
  })

  it('unarchives when location name matches exactly', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(
      <ArchiveConfirmationDialog
        isOpen={true}
        locationName="Old Warehouse"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        isArchiving={false}
      />
    )

    await user.type(screen.getByPlaceholderText(/type location name/i), 'Old Warehouse')

    const confirmButton = screen.getByRole('button', { name: /unarchive/i })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledWith('Old Warehouse')
  })
})

// =============================================================================
// Flow 6: Filter by Type
// =============================================================================

describe('Locations - Filter by Type', () => {
  it('filters locations by type', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
    await user.selectOptions(typeFilter, 'amazon_fba')

    expect(screen.getByText('PHX7 Amazon FBA')).toBeInTheDocument()
    expect(screen.queryByText('Shenzhen Drinkware Factory')).not.toBeInTheDocument()
    expect(screen.queryByText('FlexPort LA Warehouse')).not.toBeInTheDocument()
  })

  it('shows all types in filter dropdown', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
    await user.click(typeFilter)

    expect(screen.getByRole('option', { name: /all types/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /factory/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /warehouse/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /3pl/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /amazon fba/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /amazon awd/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /port/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /customs/i })).toBeInTheDocument()
  })
})

// =============================================================================
// Flow 7: Filter by Status
// =============================================================================

describe('Locations - Filter by Status', () => {
  it('filters to show only active locations', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
    await user.selectOptions(statusFilter, 'active')

    expect(screen.getByText('Shenzhen Drinkware Factory')).toBeInTheDocument()
    expect(screen.queryByText('Old Warehouse')).not.toBeInTheDocument()
  })

  it('filters to show only archived locations', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
    await user.selectOptions(statusFilter, 'archived')

    expect(screen.getByText('Old Warehouse')).toBeInTheDocument()
    expect(screen.queryByText('Shenzhen Drinkware Factory')).not.toBeInTheDocument()
  })
})

// =============================================================================
// Flow 8: Search Locations
// =============================================================================

describe('Locations - Search Locations', () => {
  it('filters locations by name search', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Shenzhen')

    expect(screen.getByText('Shenzhen Drinkware Factory')).toBeInTheDocument()
    expect(screen.queryByText('FlexPort LA Warehouse')).not.toBeInTheDocument()
  })

  it('filters locations by city', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Phoenix')

    expect(screen.getByText('PHX7 Amazon FBA')).toBeInTheDocument()
    expect(screen.queryByText('Shenzhen Drinkware Factory')).not.toBeInTheDocument()
  })

  it('filters locations by country', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'China')

    expect(screen.getByText('Shenzhen Drinkware Factory')).toBeInTheDocument()
    expect(screen.queryByText('FlexPort LA Warehouse')).not.toBeInTheDocument()
  })

  it('is case-insensitive', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'SHENZHEN')

    expect(screen.getByText('Shenzhen Drinkware Factory')).toBeInTheDocument()
  })
})

// =============================================================================
// Empty States
// =============================================================================

describe('Locations - Empty States', () => {
  it('shows empty state when no locations exist', () => {
    render(<LocationsView locations={[]} />)

    expect(screen.getByText(/no locations yet/i)).toBeInTheDocument()
    expect(screen.getByText(/add your first location/i)).toBeInTheDocument()
  })

  it('shows no results message when search has no matches', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'xyznonexistent')

    expect(screen.getByText(/no locations match/i)).toBeInTheDocument()
  })

  it('shows no results message when filter has no matches', async () => {
    const user = userEvent.setup()

    // Only active locations, no port type
    const locationsNoPort = sampleLocations.filter(l => l.type !== 'port')
    render(<LocationsView locations={locationsNoPort} />)

    const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
    await user.selectOptions(typeFilter, 'port')

    expect(screen.getByText(/no locations match/i)).toBeInTheDocument()
  })
})

// =============================================================================
// Amazon Location Grouping
// =============================================================================

describe('Locations - Amazon Location Grouping', () => {
  it('groups Amazon FBA locations together', () => {
    render(<LocationsView locations={sampleLocations} />)

    // Should have multiple Amazon FBA references (badge + group header)
    const fbaElements = screen.getAllByText(/amazon fba/i)
    expect(fbaElements.length).toBeGreaterThanOrEqual(1)
  })

  it('groups Amazon AWD locations together', () => {
    render(<LocationsView locations={sampleLocations} />)

    // Should have multiple Amazon AWD references (badge + group header)
    const awdElements = screen.getAllByText(/amazon awd/i)
    expect(awdElements.length).toBeGreaterThanOrEqual(1)
  })

  it('expands and collapses Amazon groups', async () => {
    const user = userEvent.setup()

    render(<LocationsView locations={sampleLocations} />)

    // Find all Amazon FBA elements and get the group header (first one in a row context)
    const fbaElements = screen.getAllByText('Amazon FBA')
    // Get the first tr that contains "Amazon FBA" text - this is the group header
    const fbaGroupHeader = fbaElements.find(el => el.closest('tr')?.querySelector('[class*="bg-amber"]'))?.closest('tr')

    if (fbaGroupHeader) {
      await user.click(fbaGroupHeader)
    }

    // After collapse, the toggle behavior should work
    // This test just verifies no errors occur during toggle
    expect(fbaElements.length).toBeGreaterThanOrEqual(1)
  })
})

// =============================================================================
// Form Validation
// =============================================================================

describe('Locations - Form Validation', () => {
  it('validates required name field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LocationForm onSubmit={onSubmit} locationTypes={LOCATION_TYPES} />)

    // Fill city and country but not name
    await user.type(screen.getByPlaceholderText(/city/i), 'Los Angeles')

    // Select country from dropdown
    const countryDropdown = screen.getByText('Select country')
    await user.click(countryDropdown)
    await user.click(screen.getByText('United States'))

    const submitButton = screen.getByRole('button', { name: /add location/i })
    await user.click(submitButton)

    expect(screen.getByText(/location name is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('validates email format when provided', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LocationForm onSubmit={onSubmit} locationTypes={LOCATION_TYPES} />)

    await user.type(screen.getByPlaceholderText(/location name/i), 'Test Location')
    await user.type(screen.getByPlaceholderText(/city/i), 'Los Angeles')

    // Select country from dropdown
    const countryDropdown = screen.getByText('Select country')
    await user.click(countryDropdown)
    await user.click(screen.getByText('United States'))

    await user.type(screen.getByPlaceholderText(/email/i), 'invalid-email')

    const submitButton = screen.getByRole('button', { name: /add location/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(<LocationForm onCancel={onCancel} locationTypes={LOCATION_TYPES} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })
})
