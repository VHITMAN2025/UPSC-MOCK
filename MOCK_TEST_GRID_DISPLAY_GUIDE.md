# 🎨 GROUP 1 MOCK TEST - GRID DISPLAY GUIDE

## Visual Layout of Your 200-Question Grid

```
┌─────────────────────────────────────────────────────────────────┐
│                    Question Palette                   200 Total │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│    │    40     │  │    25     │  │   135     │                │
│    │ Answered  │  │  Review   │  │ Remaining │                │
│    └───────────┘  └───────────┘  └───────────┘                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    ◄─── Row 1 (Q1-Q5)         │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │                                │
│  └───┘ └───┘ └───┘ └───┘ └───┘                                │
│    🔵   🟢   🟢   🟠   ⚪                                        │
│                                                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    ◄─── Row 2 (Q6-Q10)        │
│  │ 6 │ │ 7 │ │ 8 │ │ 9 │ │ 10│                                │
│  └───┘ └───┘ └───┘ └───┘ └───┘                                │
│    ⚪   ⚪   ⚪   ⚪   ⚪                                          │
│                                                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    ◄─── Row 3 (Q11-Q15)       │
│  │11 │ │12 │ │13 │ │14 │ │15 │                                │
│  └───┘ └───┘ └───┘ └───┘ └───┘                                │
│                                                                 │
│               ... (35 more rows) ...                            │
│                                                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    ◄─── Row 40 (Q196-Q200)    │
│  │196│ │197│ │198│ │199│ │200│                                │
│  └───┘ └───┘ └───┘ └───┘ └───┘                                │
│    ⚪   ⚪   ⚪   ⚪   ⚪                                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Legend:                                                        │
│  🟢 Answered   🟠 Marked for Review   ⚪ Not Answered           │
│  🔵 Current Question                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│               ┌─────────────────────┐                          │
│               │   SUBMIT EXAM       │                          │
│               └─────────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Color Coding System

### Question Status Colors

| Status | Color | Background Class | Description |
|--------|-------|------------------|-------------|
| **Current** | 🔵 Blue | `bg-primary ring-2 ring-primary` | The question you're currently viewing |
| **Answered** | 🟢 Green | `bg-emerald-600` | You've selected an answer (A/B/C/D) |
| **Marked** | 🟠 Amber | `bg-amber-400` | Flagged for review later |
| **Unanswered** | ⚪ Gray | `bg-slate-100` | Not yet attempted |

### Interactive Behavior

```javascript
// When user clicks a question button:
onClick={() => onSelectQuestion(index)}  // Jump to that question

// Real-time status updates:
- Select answer → Button turns GREEN 🟢
- Mark for review → Button turns AMBER 🟠
- Clear answer → Button turns GRAY ⚪
- Navigate to question → Blue ring 🔵 moves
```

## Grid Layout Specifications

```css
/* Grid Container */
.grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem; /* 8px */
}

/* Each Button */
.button {
  height: 2.25rem; /* 36px */
  width: 100%;
  border-radius: 0.5rem; /* 8px */
  font-size: 0.75rem; /* 12px */
  font-weight: 600;
}

/* Scrollable Container */
.container {
  max-height: 15rem; /* 240px - shows ~8 rows */
  overflow-y: auto;
}
```

## Unit Distribution Visualization

Your 200 questions are distributed across units like this:

```
PART A: GENERAL STUDIES (175 Questions)
┌─────────────────────────────────────────┐
│ Unit 1: General Science (Q1-Q10)        │ ■■■■■ (5%)
│ Unit 2: Geography (Q11-Q20)             │ ■■■■■ (5%)
│ Unit 3: History & Culture (Q21-Q45)     │ ■■■■■■■■■■■■■ (12.5%)
│ Unit 4: Indian Polity (Q46-Q85)         │ ■■■■■■■■■■■■■■■■■■■■ (20%)
│ Unit 5: Economy & TN Dev (Q86-Q135)     │ ■■■■■■■■■■■■■■■■■■■■■■■■■ (25%)
│ Unit 6: TN Heritage (Q136-Q175)         │ ■■■■■■■■■■■■■■■■■■■■ (20%)
└─────────────────────────────────────────┘

PART B: APTITUDE & MENTAL ABILITY (25 Questions)
┌─────────────────────────────────────────┐
│ Unit 7: Aptitude (Q176-Q190)            │ ■■■■■■■■ (7.5%)
│ Unit 8: Reasoning (Q191-Q200)           │ ■■■■■ (5%)
└─────────────────────────────────────────┘
```

## Difficulty Distribution in Grid

Questions are **randomly shuffled**, but the overall distribution is:

```
Row-by-Row Difficulty Distribution (Approximate):

Rows 1-8   (Q1-Q40)    →  8 Easy, 20 Medium, 12 Hard
Rows 9-16  (Q41-Q80)   →  8 Easy, 20 Medium, 12 Hard
Rows 17-24 (Q81-Q120)  →  8 Easy, 20 Medium, 12 Hard
Rows 25-32 (Q121-Q160) →  8 Easy, 20 Medium, 12 Hard
Rows 33-40 (Q161-Q200) →  8 Easy, 20 Medium, 12 Hard

TOTAL: 40 Easy (20%) + 100 Medium (50%) + 60 Hard (30%) = 200Q
```

## Mobile Responsive Behavior

### Desktop View (>= 768px)
```
┌─────────────────┬────────────────────────┐
│                 │   Question Palette     │
│                 │  (Fixed Right Sidebar) │
│  Question Area  │                        │
│                 │   [Grid 5×40]          │
│                 │                        │
│                 │   [Submit Button]      │
└─────────────────┴────────────────────────┘
```

### Mobile View (< 768px)
```
┌─────────────────────────────────────┐
│          Question Area              │
│                                     │
│         [Show Palette ☰]            │
│                                     │
└─────────────────────────────────────┘

When palette opens:
┌─────────────────────────────────────┐
│   Question Palette (Drawer)         │
│                                     │
│   [Grid 5×40]           [Close ×]   │
│                                     │
│   [Submit Button]                   │
└─────────────────────────────────────┘
```

## Real-Time Progress Tracking

```javascript
// Progress Calculation
{
  total: 200,
  answered: answers.length,  // Green buttons
  marked: markedForReview.length,  // Amber buttons
  remaining: 200 - answers.length  // Gray buttons
}

// Updates automatically on:
- Answer selection
- Mark for review toggle
- Answer clear
- Navigation between questions
```

## User Interaction Flow

```
1. START TEST
   ↓
2. All 200 buttons are GRAY ⚪
   Button #1 has BLUE RING 🔵
   ↓
3. User selects answer A/B/C/D
   ↓
4. Button #1 turns GREEN 🟢
   Blue ring moves to next question
   ↓
5. User clicks "Mark for Review"
   ↓
6. Button turns AMBER 🟠
   (Answer is saved, but flagged)
   ↓
7. User clicks button #50 in grid
   ↓
8. Jump to Question 50
   Blue ring 🔵 moves to button #50
   ↓
9. User navigates through all 200
   Green/Amber/Gray colors update
   ↓
10. User clicks "SUBMIT EXAM"
    ↓
11. Confirmation modal appears
    Shows: Answered (green), Marked (amber), Unanswered (gray)
    ↓
12. User confirms submission
    ↓
13. Navigate to Results page
```

## Technical Implementation

### React Component Structure

```jsx
<QuestionNavigator
  questions={questions}        // Array[200]
  currentIndex={currentIndex}  // 0-199
  onSelectQuestion={jumpTo}
  answers={userAnswers}        // { questionId: 'A' }
  markedForReview={markedSet}  // { questionId: true }
  onSubmitExam={submitHandler}
/>
```

### Grid Rendering Logic

```javascript
questions.map((q, index) => {
  const isCurrent = currentIndex === index
  const isAnswered = !!answers[q.id]
  const isMarked = !!markedForReview[q.id]

  let btnStyle = "bg-slate-100"  // Default: Unanswered

  if (isCurrent) {
    btnStyle = "ring-2 ring-primary bg-primary text-white"
  } else if (isMarked) {
    btnStyle = "bg-amber-400 text-white"
  } else if (isAnswered) {
    btnStyle = "bg-emerald-600 text-white"
  }

  return (
    <button
      key={q.id}
      onClick={() => onSelectQuestion(index)}
      className={btnStyle}
    >
      {index + 1}
    </button>
  )
})
```

## Accessibility Features

```html
<!-- Screen Reader Support -->
<button
  aria-label="Question 1 of 200, Answered"
  aria-current={isCurrent ? "step" : undefined}
  role="tab"
>
  1
</button>

<!-- Keyboard Navigation -->
Tab       → Focus next button
Shift+Tab → Focus previous button
Enter     → Jump to that question
Arrow Keys → Navigate grid (optional)
```

## Performance Optimization

```javascript
// Virtualization for large grids (optional)
// Currently renders all 200 buttons (lightweight)

// Memoization prevents unnecessary re-renders
const paginatedQuestions = useMemo(() => {
  return questions.slice(0, 200)
}, [questions])

// Debounced scroll updates
const handleScroll = debounce(() => {
  // Update visible range
}, 100)
```

## Common Issues & Solutions

### Issue 1: Grid not showing 200 buttons
**Cause:** Questions array has < 200 items  
**Fix:** Verify mock test generation returned exactly 200 questions

### Issue 2: Colors not updating
**Cause:** State not properly synced  
**Fix:** Ensure answers/markedForReview objects are updated immutably

### Issue 3: Mobile drawer not opening
**Cause:** Click handler not firing  
**Fix:** Check z-index and event propagation

### Issue 4: Blue ring stuck on one button
**Cause:** currentIndex not updating  
**Fix:** Verify onSelectQuestion callback updates parent state

## Testing Checklist

- [ ] All 200 buttons render correctly
- [ ] Click any button jumps to that question
- [ ] Green color appears when answer selected
- [ ] Amber color appears when marked for review
- [ ] Gray color when answer cleared
- [ ] Blue ring follows current question
- [ ] Progress counters update in real-time
- [ ] Submit button triggers confirmation modal
- [ ] Mobile drawer opens/closes smoothly
- [ ] Scroll works for all 40 rows
- [ ] Legend displays correctly

## UI/UX Best Practices

✅ **Clear Visual Hierarchy**
- Current question stands out (blue ring)
- Status colors are distinct and accessible
- Numbers are large enough to tap on mobile

✅ **Instant Feedback**
- Button state changes immediately
- No loading delays for navigation
- Smooth transitions (100ms)

✅ **Easy Navigation**
- One-click jump to any question
- Scroll indicates more questions available
- Submit button always visible

✅ **Progress Transparency**
- Summary chips show counts
- Color legend always visible
- User knows exactly where they stand

---

**Last Updated:** January 2025  
**Component:** `QuestionNavigator.jsx`  
**Service:** `testGeneratorService.js`
