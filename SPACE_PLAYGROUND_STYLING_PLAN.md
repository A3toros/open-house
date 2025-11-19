# Space Playground - Styling Plan

## Color Palette

### Primary Colors
- **Main Background**: `#10152A` (space night)
- **Secondary Background**: `#1C2340` (soft star glow)
- **Cards**: `#1E2A49` with white text
- **Text**: White (`#FFFFFF`)

### Accent Colors
- **Primary Button/AI Cyan**: `#11E0FF` (bright AI cyan)
- **Secondary Button**: `#FFB743` (warm future orange)
- **Accent/Purple**: `#9B5BFF` (cosmic purple)

### Design Vibe
- Space adventure + tech wonder
- Darker, more expressive UI
- Neon glow effects
- Futuristic aesthetic

---

## Components to Update

### 1. Global Styles (`src/index.css`)

#### Background Colors
- Update root background to `#10152A`
- Update secondary backgrounds to `#1C2340`
- Update card backgrounds to `#1E2A49`

#### Text Colors
- Primary text: White (`#FFFFFF`)
- Secondary text: White with opacity (`rgba(255, 255, 255, 0.7)`)
- Accent text: Use accent colors

#### Button Styles
- Primary buttons: `#11E0FF` with glow effect
- Secondary buttons: `#FFB743` with glow effect
- Hover states: Lighter shades with increased glow
- Active states: Scale down slightly

#### Border Colors
- Use accent colors with opacity for borders
- Glow effects on hover

---

### 2. Home Page (`src/routes/Home.tsx`)

#### Banner Section
- Background: `#10152A` or gradient from `#10152A` to `#1C2340`
- Text overlay: White with cyan glow (`#11E0FF`)
- Banner image: Add dark overlay if needed

#### Activity Carousel
- Card background: `#1E2A49`
- Card border: `#11E0FF` with opacity
- "Launch now" button: `#11E0FF` with glow
- Hover effects: Increase glow, slight scale

---

### 3. Activity Layout (`src/routes/ActivityLayout.tsx`)

#### Header
- Background: `#1C2340`
- Title: White with cyan glow (`#11E0FF`)
- Subtitle: White with reduced opacity
- Back button: `#11E0FF` or `#FFB743`

#### Main Container
- Background: `#10152A` or `#1C2340`
- Card backgrounds: `#1E2A49`

---

### 4. Activity Components

#### AI Story Maker (`src/routes/activities/StoryForge.tsx`)
- Sliders: Use `#11E0FF` for active states
- Generate button: `#11E0FF` with glow
- Story container: `#1E2A49` background
- Ending buttons: Mix of `#11E0FF`, `#FFB743`, `#9B5BFF`
- Writing tips: `#9B5BFF` accent

#### Build Your AI Persona (`src/routes/activities/PersonaBuilder.tsx`)
- Sliders: `#11E0FF` for active track
- Chat container: `#1E2A49` background
- Send button: `#11E0FF`
- AI messages: `#1C2340` background with `#11E0FF` border
- User messages: `#1E2A49` background

#### AI Riddles (`src/routes/activities/Riddles.tsx`)
- Riddle text: White with larger font
- Score display: `#11E0FF` with glow
- Correct answer: `#FFB743` with glow
- Feedback boxes: `#1E2A49` with accent borders
- Buttons: `#11E0FF` (primary), `#FFB743` (secondary)

#### AI Culture Translator (`src/routes/activities/CultureTranslator.tsx`)
- Match container: `#1E2A49` background
- Tradition name: `#11E0FF` with glow
- Narration button: `#11E0FF` with glow
- History cards: `#1E2A49` with `#11E0FF` borders

#### Future Profession (`src/routes/activities/FutureProfession.tsx`)
- Voice challenge section: `#1E2A49` background
- Photo booth section: `#1E2A49` background
- Profession input: `#1C2340` background
- Generate button: `#11E0FF` with glow
- Email button: `#FFB743` with glow

#### AI Debate Arena (`src/routes/activities/DebateArena.tsx`)
- Prompt selector: `#1E2A49` background
- Randomize button: `#11E0FF` with glow
- Start recording: `#11E0FF` or `#FFB743` with glow
- Stop button: `#FFB743` or red variant
- Debate turns: `#1E2A49` background
- AI rebuttal: `#1C2340` background with `#11E0FF` border

#### AI Vocabulary RPG (`src/routes/activities/VocabularyRPG.tsx`)
- Card background: `#1E2A49`
- XP bar: `#11E0FF` gradient
- Answer input: `#1C2340` background
- Submit button: `#11E0FF` with glow
- Correct/incorrect feedback: Use accent colors

#### Parent Corner (`src/routes/activities/ParentCorner.tsx`)
- Video cards: `#1E2A49` background
- Play buttons: `#11E0FF` with glow
- Category tabs: `#1C2340` background

---

### 5. UI Components

#### Confetti Overlay (`src/components/ui/ConfettiOverlay.tsx`)
- Keep existing colors but ensure they pop against dark background
- Add more vibrant colors if needed

#### Activity Carousel (`src/components/home/ActivityCarousel.tsx`)
- Card backgrounds: `#1E2A49`
- Card borders: `#11E0FF` with opacity
- Hover glow: `#11E0FF`
- Launch button: `#11E0FF` with glow

---

## Implementation Steps

### Phase 1: Global Styles
1. Update `src/index.css` with new color variables
2. Create CSS custom properties for easy theming
3. Update root background and text colors
4. Update button base styles

### Phase 2: Layout Components
1. Update `ActivityLayout.tsx` header and container
2. Update `Home.tsx` banner and carousel
3. Ensure consistent spacing and typography

### Phase 3: Activity Components
1. Update each activity component systematically
2. Apply new color scheme to buttons, cards, and inputs
3. Add glow effects where appropriate
4. Test hover and active states

### Phase 4: Polish
1. Review all components for consistency
2. Add subtle animations and transitions
3. Ensure accessibility (contrast ratios)
4. Test on different screen sizes

---

## CSS Custom Properties (Recommended)

```css
:root {
  /* Backgrounds */
  --space-night: #10152A;
  --star-glow: #1C2340;
  --card-bg: #1E2A49;
  
  /* Accents */
  --ai-cyan: #11E0FF;
  --future-orange: #FFB743;
  --cosmic-purple: #9B5BFF;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  
  /* Glow effects */
  --glow-cyan: 0 0 20px rgba(17, 224, 255, 0.5);
  --glow-orange: 0 0 20px rgba(255, 183, 67, 0.5);
  --glow-purple: 0 0 20px rgba(155, 91, 255, 0.5);
}
```

---

## Button Style Examples

### Primary Button (AI Cyan)
```css
background: rgba(17, 224, 255, 0.1);
border: 2px solid rgba(17, 224, 255, 0.5);
color: #11E0FF;
text-shadow: 0 0 8px rgba(17, 224, 255, 0.6);
transition: all 0.2s;
```

### Secondary Button (Future Orange)
```css
background: rgba(255, 183, 67, 0.1);
border: 2px solid rgba(255, 183, 67, 0.5);
color: #FFB743;
text-shadow: 0 0 8px rgba(255, 183, 67, 0.6);
transition: all 0.2s;
```

### Hover State
```css
border-color: [accent-color];
background: rgba([accent-rgb], 0.2);
box-shadow: 0 0 20px rgba([accent-rgb], 0.4);
transform: scale(1.02);
```

### Active State
```css
transform: scale(0.98);
```

---

## Notes

- Maintain existing functionality while updating styles
- Ensure text remains readable (contrast ratios)
- Test glow effects don't cause performance issues
- Keep animations smooth and subtle
- Maintain responsive design principles
- Consider dark mode preferences (already dark theme)

---

## Files to Modify

### Core Styles
- `src/index.css`

### Layout Components
- `src/routes/Home.tsx`
- `src/routes/ActivityLayout.tsx`

### Activity Components
- `src/routes/activities/StoryForge.tsx`
- `src/routes/activities/PersonaBuilder.tsx`
- `src/routes/activities/Riddles.tsx`
- `src/routes/activities/CultureTranslator.tsx`
- `src/routes/activities/FutureProfession.tsx`
- `src/routes/activities/DebateArena.tsx`
- `src/routes/activities/VocabularyRPG.tsx`
- `src/routes/activities/ParentCorner.tsx`

### UI Components
- `src/components/home/ActivityCarousel.tsx`
- `src/components/ui/ConfettiOverlay.tsx`

---

## Testing Checklist

- [ ] All pages load with new color scheme
- [ ] Buttons have proper hover/active states
- [ ] Text is readable on all backgrounds
- [ ] Glow effects work consistently
- [ ] Responsive design maintained
- [ ] No broken styles or layout issues
- [ ] Accessibility standards met
- [ ] Performance not impacted

