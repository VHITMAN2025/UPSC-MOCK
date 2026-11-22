# Practice Test Unit Dropdown Implementation

## Overview
Implemented unit selection dropdown functionality in the Practice Test page, allowing users to filter practice questions by specific syllabus units within a subject.

## Changes Made

### 1. State Management (`PracticePage.jsx`)
Added new state variables:
- `units` - Array to store available units for the selected subject
- `unitsLoading` - Loading state for units fetch operation

### 2. Unit Loading Function
Created `loadUnits(subject)` function that:
- Fetches units from `syllabus_units` table based on selected exam and subject
- Filters units by subject name
- Orders units by `unit_number`
- Returns unit data with `unit_code`, `unit_name`, and `subject`

### 3. UseEffect Hook
Added useEffect to automatically load units when:
- Subject changes (and is not "All Subjects")
- Ensures units are cleared when "All Subjects" is selected
- Resets unit selection to null when subject changes

### 4. UI Component
Added unit selection dropdown that:
- Only displays when a specific subject is selected (not "All Subjects")
- Shows "All Units" option as default
- Lists all available units as clickable buttons
- Highlights selected unit with brand color
- Shows loading state while fetching units
- Hides during Fix Test mode (locked to mistake questions)

### 5. Integration with Existing Service
The implementation integrates seamlessly with existing backend:
- `practiceService.createSession()` already supports `config.unit` parameter
- `matchesPracticeCriteria()` function handles unit filtering via `targetUnit`
- `getAvailableQuestionCount()` includes unit filtering in question count
- Unit codes are passed to the service (e.g., "G4_GS_U1", "G4_TA_U2")

## User Flow

1. User selects a subject (e.g., "General Studies")
2. Unit dropdown appears below subject selection
3. Units are loaded from database for that subject
4. User selects a specific unit (e.g., "Unit I: General Science")
5. Available question count updates based on unit filter
6. Practice session generates questions filtered by selected unit
7. Questions maintain proper metadata (unit_name, unit_code)

## Technical Details

### Database Schema
Uses existing `syllabus_units` table:
- `exam_id` - Links to exam
- `subject` - Subject name
- `unit_code` - Unique unit identifier (e.g., "G4_GS_U1")
- `unit_name` - Display name
- `unit_number` - Ordering

### Service Layer
`practiceService.createSession()` processes:
```javascript
{
  ...config,
  unit: "G4_GS_U1"  // unit_code from selected unit
}
```

### Filtering Logic
`matchesPracticeCriteria()` checks:
- `targetUnit` against question's `unit_code` or `unit_number`
- Normalizes unit codes for comparison
- Special handling for language units (Unit 11)

## Benefits

1. **Granular Practice**: Users can focus on specific syllabus units
2. **Better Preparation**: Targeted revision for weak units
3. **Accurate Counts**: Real-time question availability per unit
4. **Seamless UX**: Optional selection (defaults to all units)
5. **Mobile Friendly**: Responsive button layout

## Testing Checklist

- [x] Units load when subject is selected
- [x] Unit dropdown hides for "All Subjects"
- [x] Unit dropdown hides during Fix Test mode
- [x] Unit selection updates config state
- [x] Available question count updates with unit filter
- [x] Practice session generates filtered questions
- [x] Unit metadata preserved in questions
- [x] Loading states work correctly
- [x] No console errors or warnings

## Files Modified

1. `src/pages/user/PracticePage.jsx`
   - Added units state and loading state
   - Added loadUnits() function
   - Added useEffect for unit loading
   - Added unit dropdown UI component

## Dependencies

No new dependencies added. Uses existing:
- `@supabase/supabase-js` for database queries
- React hooks (useState, useEffect)
- Existing `practiceService` methods

## Future Enhancements

Potential improvements:
1. Add macro/micro topic dropdowns below unit selection
2. Show question count per unit in the dropdown
3. Add "Recently practiced units" quick selection
4. Store last selected unit in localStorage
5. Add unit progress indicators
