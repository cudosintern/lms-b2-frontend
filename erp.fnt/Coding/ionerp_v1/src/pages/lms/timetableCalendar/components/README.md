# Timetable Options Components

This directory contains React components for managing timetable operations including copying class days, resetting timetable dates, and deleting timetables.

## Components

### TimetableOptionsManager
The main component that manages all timetable operations and provides a unified interface.

**Props:**
- `semTimeTableId?: number` - The ID of the timetable to operate on
- `curriculumId?: number` - The curriculum ID for filtering operations
- `termId?: number` - The term ID for filtering operations  
- `sectionId?: number` - The section ID for filtering operations
- `onOperationComplete?: (operation: string, success: boolean, message?: string) => void` - Callback for operation completion

**Usage:**
```tsx
import { TimetableOptionsManager } from './TimetableOptions';

<TimetableOptionsManager
  semTimeTableId={123}
  curriculumId={456}
  termId={789}
  sectionId={101}
  onOperationComplete={(operation, success, message) => {
    console.log(`${operation} ${success ? 'succeeded' : 'failed'}: ${message}`);
  }}
/>
```

### TimetableOptionsDropdown
A dropdown menu that provides access to timetable operations.

**Props:**
- `onCopyClassDay: () => void` - Handler for copy class day action
- `onResetTimetableDate: () => void` - Handler for reset timetable date action
- `onDeleteTimetable: () => void` - Handler for delete timetable action

### CopyClassDayModal
A modal for copying scheduled classes from one day to another.

**Props:**
- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Handler for closing the modal
- `curriculumId?: number` - Optional curriculum ID for filtering
- `termId?: number` - Optional term ID for filtering
- `sectionId?: number` - Optional section ID for filtering
- `onCopyComplete?: (success: boolean, message?: string) => void` - Callback for copy completion

### ConfirmationModal
A reusable confirmation modal for dangerous operations.

**Props:**
- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Handler for closing the modal
- `onConfirm: () => void` - Handler for confirmation
- `title: string` - Modal title
- `message: string` - Confirmation message
- `confirmText: string` - Text for confirm button
- `cancelText?: string` - Text for cancel button (default: "Cancel")
- `type?: 'danger' | 'warning' | 'info'` - Modal type (default: "danger")
- `isSubmitting?: boolean` - Whether operation is in progress

## API Integration

The components integrate with the following FastAPI endpoints:

### Copy Day Operation
- **Endpoint:** `POST /api/v1/timetable/copy-day`
- **Request Body:**
```typescript
{
  sourceDate: string;        // Format: YYYY-MM-DD
  targetDate: string;        // Format: YYYY-MM-DD
  curriculumId?: number;
  termId?: number;
  sectionId?: number;
}
```

### Reset Timetable Dates
- **Endpoint:** `PATCH /api/v1/timetable/{sem_time_table_id}/reset-dates`
- **Params:** `sem_time_table_id` (number)

### Delete Timetable
- **Endpoint:** `DELETE /api/v1/timetable/{sem_time_table_id}`
- **Params:** `sem_time_table_id` (number)

### Get Scheduled Classes
- **Endpoint:** `GET /api/v1/timetable/scheduled-classes`
- **Query Params:**
  - `curriculumId?: number`
  - `termId?: number`
  - `sectionId?: number`
  - `startDate?: string`
  - `endDate?: string`

### Update Scheduled Class
- **Endpoint:** `PUT /api/v1/timetable/scheduled-classes/{class_id}`
- **Params:** `class_id` (number)

### Delete Scheduled Class
- **Endpoint:** `DELETE /api/v1/timetable/scheduled-classes/{class_id}`
- **Params:** `class_id` (number)

### Sync Date Range
- **Endpoint:** `PATCH /api/v1/timetable/{sem_time_table_id}/sync-range`
- **Params:** `sem_time_table_id` (number)
- **Request Body:**
```typescript
{
  startDate: string;  // Format: YYYY-MM-DD
  endDate: string;    // Format: YYYY-MM-DD
}
```

### Export Timetable PDF
- **Endpoint:** `GET /api/v1/comman_function/timetable/export-pdf`
- **Query Params:**
  - `semTimeTableId?: number`
  - `curriculumId?: number`
  - `termId?: number`
  - `sectionId?: number`

## Error Handling

The API integration includes comprehensive error handling:

1. **HTTP Status Codes:**
   - 400: Bad request with validation details
   - 401: Authentication required
   - 403: Permission denied
   - 404: Resource not found
   - 409: Conflict with existing data
   - 422: Validation errors with detailed messages
   - 500: Server error

2. **Error Display:**
   - Toast notifications for all errors
   - Detailed validation error messages
   - Network error handling
   - User-friendly error messages

3. **Offline Support:**
   - Fallback to localStorage for basic operations
   - Data deduplication and cleanup
   - Sync when connection is restored

## Styling

The components use Tailwind CSS for styling with the following design patterns:

- **Modal Design:** Consistent modal container with proper spacing
- **Button States:** Loading states, disabled states, hover effects
- **Form Validation:** Real-time validation with error messages
- **Responsive Design:** Mobile-friendly layouts
- **Color Coding:** 
  - Red for dangerous operations (delete)
  - Yellow for warning operations (reset)
  - Blue for informational operations (copy)

## Best Practices

1. **Always provide required IDs** for operations that need them
2. **Handle operation completion callbacks** to update UI state
3. **Show loading states** during async operations
4. **Validate user input** before making API calls
5. **Use confirmation modals** for destructive operations
6. **Provide meaningful error messages** to users
7. **Test offline scenarios** and error conditions
