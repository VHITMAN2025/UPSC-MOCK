# Navigation Blocker Implementation

## Overview
Added confirmation dialogs when users attempt to leave active test/practice sessions in progress.

## Implementation Details

### Files Modified

1. **ExamPage.jsx** (`src/pages/user/ExamPage.jsx`)
   - Added `useBlocker` from react-router-dom
   - Added `AlertTriangle` icon import
   - Blocks navigation when `attempt?.status === 'in_progress' && !submitting`
   - Shows browser warning for browser back/close/refresh
   - Shows custom modal for in-app navigation

2. **PracticePage.jsx** (`src/pages/user/PracticePage.jsx`)
   - Added `useBlocker` from react-router-dom
   - Added `AlertTriangle` icon import
   - Modified `PracticeSession` component
   - Blocks navigation when session is active (`!submitted && !saving`)
   - Shows browser warning for browser back/close/refresh
   - Shows custom modal for in-app navigation

## Features

### Browser Navigation Protection
- Intercepts browser back button
- Warns on page refresh (Ctrl+R / F5)
- Warns on tab/window close
- Uses native browser `beforeunload` event

### In-App Navigation Protection
- Intercepts React Router navigation
- Shows custom modal with:
  - Warning icon
  - Clear explanation of consequences
  - Two action buttons:
    - **"Stay on Test"** / **"Stay in Session"** (primary) - cancels navigation
    - **"Leave Test"** / **"Leave Session"** (secondary) - proceeds with navigation

## User Experience

### ExamPage (Mock Tests, PYQ Papers, Full Tests)
**When blocked:**
- **Modal Title:** "Leave Exam?"
- **Message:** "Your test is in progress. If you leave now, your answers will be saved but the timer will continue running. Are you sure you want to leave?"
- **Primary Action:** "Stay on Test" (blue button)
- **Secondary Action:** "Leave Test" (gray button)

### PracticePage (Practice Sessions)
**When blocked:**
- **Modal Title:** "Leave Practice Session?"
- **Message:** "Your practice session is in progress. If you leave now, your progress will be lost and you'll need to start over. Are you sure you want to leave?"
- **Primary Action:** "Stay in Session" (blue button)
- **Secondary Action:** "Leave Session" (gray button)

## Test Coverage

### Covered Scenarios
✅ ExamPage (all test types that use ExamPage):
  - Mock Tests (200-question official tests)
  - Previous Year Papers (PYQ)
  - Generated Full Tests
  - BYOP (Bring Your Own Paper)

✅ PracticePage:
  - Standard Practice Sessions
  - Fix Test Mode (mistake revision)
  - Adaptive Practice
  - Targeted Topic Practice

### Navigation Triggers Protected
✅ Browser back button
✅ Browser forward button
✅ Page refresh (Ctrl+R, F5)
✅ Tab/window close
✅ In-app route navigation (clicking links)
✅ Programmatic navigation

## Technical Implementation

### React Router v6 useBlocker
```javascript
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    shouldBlockNavigation && currentLocation.pathname !== nextLocation.pathname
)
```

### Browser beforeunload Event
```javascript
useEffect(() => {
  if (!shouldBlockNavigation) return
  
  const handleBeforeUnload = (e) => {
    e.preventDefault()
    e.returnValue = 'Warning message'
    return e.returnValue
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [shouldBlockNavigation])
```

### Modal Rendering
```javascript
{blocker.state === 'blocked' && (
  <div className="fixed inset-0 z-50 ...">
    {/* Modal content */}
    <button onClick={() => blocker.reset()}>Stay</button>
    <button onClick={() => blocker.proceed()}>Leave</button>
  </div>
)}
```

## Edge Cases Handled

1. **After submission:** Navigation is NOT blocked once test/session is submitted
2. **During submission:** Navigation is blocked while submitting to prevent data loss
3. **Timer expiry (ExamPage):** Auto-submits and then allows navigation
4. **Practice completion:** Allows navigation after completing practice session

## Notes

- Modal uses Tailwind CSS utility classes
- Z-index of 50 ensures modal appears above all content
- Backdrop blur effect for better focus
- Mobile responsive design
- Consistent with existing app design system
