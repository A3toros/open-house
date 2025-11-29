# Presentation Feature Implementation Plan

## Overview
Add a fullscreen presentation feature accessible via a button above the activities tab. The presentation displays text slides with images on a space sky background with stars overlay and shooting stars animation.

## Requirements

### 1. Button Placement
- **Location**: Above the activities tab section in `Home.tsx`
- **Position**: Between the ActivityCarousel section and the "All activities" heading
- **Style**: Should match the existing design system (cyan/blue theme, rounded, with hover effects)

### 2. Presentation Modal/Fullscreen Component
- **Fullscreen overlay**: Covers entire viewport
- **Close button**: 
  - Appears on mouse hover or tap
  - Positioned at top-right corner
  - Styled to match the space theme
  - Should be visible but subtle when not hovered

### 3. Background & Visual Effects
- **Space sky background**: Dark blue/black gradient (#0a0e27 to #1a1f3a)
- **Stars overlay**: Use existing `StarsBackground` component
- **Shooting stars**: Use existing `ShootingStars` component (1 at a time)
- **Layering**: Background → Stars → Shooting Stars → Content

### 4. Text Animation
- **Display duration**: 3 seconds per line
- **Animation library**: Framer Motion
- **Transition effect**: 
  - Text erases from right to left
  - Disappears completely
  - Next line appears (fade in or slide in)
- **Text styling**: 
  - Large, readable font
  - White/cyan color matching theme
  - Centered on screen
  - Responsive sizing

### 5. Image Slides
- **Display timing**: Show image for 3 seconds after text
- **Image positioning**: Centered, responsive
- **Transition**: Smooth fade in/out between images
- **Image sources**:
  - Factory: `/pics/Factory.mp4` (video)
  - Kids: `/pics/kids.jpg`
  - Teacher-student: `/pics/teacher-student.jpg`
  - Student: `/pics/student.png`

## Slide Content Structure

### Slide 1: Industrial World
- **Text**: "In industrial world"
- **Image**: Factory.mp4 (3 seconds)
- **Duration**: Text (3s) + Image (3s) = 6s total

### Slide 2: Ecology Risk
- **Text**: "Ecology and nature are at risk"
- **Image**: Factory.mp4 (3 seconds)
- **Duration**: Text (3s) + Image (3s) = 6s total

### Slide 3: We Care
- **Text**: "That's why we care about environment"
- **Duration**: 3s (no image)

### Slide 4: Reduce Paper
- **Text**: "And try to reduce the use of paper"
- **Duration**: 3s (no image)

### Slide 5: Reduce Plastic
- **Text**: "And non-recyclable plastic"
- **Duration**: 3s (no image)

### Slide 6: World Belief
- **Text**: "We believe in the world"
- **Duration**: 3s (no image)

### Slide 7: Free of Pollution
- **Text**: "Free of pollution"
- **Duration**: 3s (no image)

### Slide 8: Green Trees
- **Text**: "Full of green trees"
- **Duration**: 3s (no image)

### Slide 9: Future of Education
- **Text**: "Future of education"
- **Duration**: 3s (no image)

### Slide 10: Paper-Free Education
- **Text**: "Is free of paper"
- **Image**: kids.jpg (3 seconds)
- **Duration**: Text (3s) + Image (3s) = 6s total

### Slide 11: Future of Education (repeat)
- **Text**: "Future of education"
- **Duration**: 3s (no image)

### Slide 12: AI Usage
- **Text**: "Is using AI only where necessary"
- **Duration**: 3s (no image)

### Slide 13: Human Contact
- **Text**: "Nothing can replace human contact"
- **Image**: teacher-student.jpg (3 seconds)
- **Duration**: Text (3s) + Image (3s) = 6s total

### Slide 14: AI Help
- **Text**: "But AI can help"
- **Duration**: 3s (no image)

### Slide 15: When Students Struggle
- **Text**: "When students struggle"
- **Duration**: 3s (no image)

### Slide 16: Lighten Load
- **Text**: "It can lighten the load"
- **Image**: student.png (3 seconds)
- **Duration**: Text (3s) + Image (3s) = 6s total

## Implementation Steps

### Step 1: Create Presentation Component
**File**: `src/components/presentation/PresentationModal.tsx`

**Features**:
- Fullscreen overlay with dark space background
- State management for current slide index
- Auto-advance logic with timing
- Close button with hover/tap visibility
- Integration of StarsBackground and ShootingStars

**State**:
```typescript
const [isOpen, setIsOpen] = useState(false)
const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
const [showImage, setShowImage] = useState(false)
```

### Step 2: Create Slide Data Structure
**File**: `src/components/presentation/presentationSlides.ts`

**Structure**:
```typescript
interface Slide {
  text: string
  image?: string
  imageType?: 'image' | 'video'
  imageDuration?: number // defaults to 3000ms
}

export const presentationSlides: Slide[] = [
  { text: "In industrial world", image: "/pics/Factory.mp4", imageType: "video" },
  // ... rest of slides
]
```

### Step 3: Implement Text Animation
- Use Framer Motion's `AnimatePresence` for transitions
- Create custom animation variants:
  - **Enter**: Fade in from center
  - **Exit**: Erase from right (clip-path or mask animation)
- Timing: 3 seconds display, 0.5s transition

**Animation Variants**:
```typescript
const textVariants = {
  enter: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  center: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
  exit: { opacity: 0, clipPath: 'inset(0 0% 0 100%)' }
}
```

### Step 4: Implement Image Display
- Show image after text completes
- Fade in/out transitions
- Handle both image and video types
- Responsive sizing (max-width: 80vw, max-height: 60vh)

### Step 5: Add Button to Home Page
**File**: `src/routes/Home.tsx`

**Location**: After ActivityCarousel, before "All activities" section

**Button**:
```tsx
<motion.button
  onClick={() => setShowPresentation(true)}
  className="w-full py-4 px-6 rounded-xl bg-[#1E2A49] border border-[#11E0FF]/30 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]/80 transition"
>
  Watch Presentation
</motion.button>
```

### Step 6: Close Button Implementation
- Position: `fixed top-4 right-4`
- Visibility: 
  - Default: `opacity-30` or `opacity-0`
  - On hover/tap: `opacity-100`
- Use Framer Motion for smooth transitions
- Support both mouse and touch events

### Step 7: Auto-advance Logic
- Use `useEffect` with `setTimeout` for timing
- Calculate total duration per slide:
  - Text: 3000ms
  - Image (if present): 3000ms
  - Transition: 500ms
- Reset on close/reopen

### Step 8: Keyboard Support
- ESC key closes presentation
- Space/Arrow keys for navigation (optional enhancement)

## Technical Details

### Component Structure
```
PresentationModal
├── Background (space gradient)
├── StarsBackground
├── ShootingStars
├── Content Container
│   ├── Text Display (Framer Motion animated)
│   ├── Image Display (conditional, Framer Motion animated)
│   └── Close Button (hover/tap visible)
```

### Styling
- Use Tailwind CSS classes
- Match existing color scheme:
  - Primary: `#11E0FF` (cyan)
  - Background: `#0a0e27` to `#1a1f3a` (dark blue gradient)
  - Text: `#FFFFFF` with optional glow effects

### Performance Considerations
- Preload images/videos when presentation opens
- Use `will-change` CSS property for animations
- Optimize ShootingStars to show only 1 at a time (modify props)

## File Structure
```
src/
├── components/
│   └── presentation/
│       ├── PresentationModal.tsx
│       └── presentationSlides.ts
└── routes/
    └── Home.tsx (modified)
```

## Testing Checklist
- [ ] Button appears above activities section
- [ ] Presentation opens in fullscreen
- [ ] Close button appears on hover/tap
- [ ] Text displays for 3 seconds
- [ ] Text erases from right correctly
- [ ] Images display after text (3 seconds)
- [ ] Stars background renders correctly
- [ ] Shooting stars appear (1 at a time)
- [ ] Auto-advance works correctly
- [ ] ESC key closes presentation
- [ ] Responsive on mobile devices
- [ ] Video plays correctly (Factory.mp4)
- [ ] All images load correctly
- [ ] Smooth transitions between slides
- [ ] Presentation loops or ends gracefully

## Future Enhancements (Optional)
- Add progress indicator
- Add pause/play controls
- Add manual navigation (prev/next buttons)
- Add sound effects or background music
- Add transition effects between slides
- Add subtitle support
- Add multiple language support

