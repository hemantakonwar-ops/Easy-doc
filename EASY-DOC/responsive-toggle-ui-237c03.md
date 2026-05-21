# Responsive Toggle UI with Slide Animations

Add toggle buttons to the document page header for showing/hiding side panels (Chat, Risk, Clauses, Summary) with smooth slide animations, and a bottom error/feature panel.

## Requirements
- Header toggle buttons for all panels: Chat, Risk, Clauses, Summary
- Smooth slide-in/out animations for panels
- Bottom area for errors and additional features
- Fully responsive layout

## Implementation Plan

### Phase 1: Update Document Page State Management
**File:** `client/app/document/[id]/page.tsx`
- Add state for each panel visibility: `showChat`, `showRisk`, `showClauses`, `showSummary`
- Add toggle functions for each panel
- Add bottom panel state: `showBottomPanel`

### Phase 2: Create Toggle Header Component
**File:** `client/components/PanelToggles.tsx` (new)
- Create toggle button group for header
- Icons: MessageSquare (Chat), ShieldAlert (Risk), Scissors (Clauses), FileText (Summary)
- Active state styling (purple when panel is open)
- Responsive: horizontal on desktop, vertical dropdown on mobile

### Phase 3: Create Slide Panel Wrapper
**File:** `client/components/SlidePanel.tsx` (new)
- Reusable slide panel component
- Props: `isOpen`, `onClose`, `position` (left/right), `children`
- CSS transitions for smooth slide animation
- Backdrop overlay on mobile

### Phase 4: Create Bottom Panel Component
**File:** `client/components/BottomPanel.tsx` (new)
- Collapsible bottom panel for errors and features
- Props: `isOpen`, `onToggle`, `errors`, `children`
- Slide up/down animation
- Error display with dismiss buttons

### Phase 5: Update Document Page Layout
**File:** `client/app/document/[id]/page.tsx`
- Replace static panels with toggle-able panels
- Header includes PanelToggles component
- Main content area adjusts based on visible panels
- BottomPanel at the bottom for errors
- Responsive grid: 1-3 columns based on visible panels

### Phase 6: Update Header Component
**File:** `client/components/Header.tsx`
- Add slot for right-side toggle buttons
- Ensure toggle buttons are visible on all screen sizes
- Mobile: compact toggle button with dropdown menu

## Files to Create/Modify
1. `client/components/PanelToggles.tsx` - NEW
2. `client/components/SlidePanel.tsx` - NEW  
3. `client/components/BottomPanel.tsx` - NEW
4. `client/app/document/[id]/page.tsx` - UPDATE
5. `client/components/Header.tsx` - UPDATE

## Panel Layout Logic
- Desktop (>1024px): Up to 3 panels side by side
- Tablet (768-1024px): Max 2 panels, others toggled
- Mobile (<768px): 1 panel at a time, full-screen toggle
- Bottom panel: Always available, slides up when active

## Animations
- Panel slide: 300ms ease-out transform
- Bottom panel: 300ms ease-out translateY
- Toggle button: 150ms scale on active state
- Backdrop fade: 200ms opacity

## Icons Needed
- MessageSquare - Chat toggle
- ShieldAlert - Risk toggle  
- Scissors - Clauses toggle
- FileText - Summary toggle
- ChevronUp/ChevronDown - Bottom panel toggle
