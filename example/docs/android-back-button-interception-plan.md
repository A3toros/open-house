# Android Back Button Interception Plan

## Overview
Implement Android hardware back button interception to show the `NavigationModal` when users attempt to navigate away from test screens. This prevents accidental navigation and ensures users confirm before leaving a test.

**Key Insight**: Reuse existing "back to cabinet" handlers instead of creating new ones.

## Goals
1. Intercept Android back button presses during tests
2. Show themed `NavigationModal` when back button is pressed (replacing current `Alert.alert` in `TestHeader`)
3. Reuse existing `handleBackToCabinet` functions and `onExit` callbacks
4. Work consistently across all test types
5. Integrate with existing navigation system

## Current State
- ✅ `NavigationModal` component exists and is themed
- ✅ `BackHandler` is already imported in `app/_layout.tsx`
- ✅ `BackHandler` is used in `TermsOfServiceModal.tsx` for preventing dismissal
- ✅ `TestHeader` component has `handleBackPress` that shows `Alert.alert` (needs to be replaced with `NavigationModal`)
- ✅ Test screens have `handleBackToCabinet` functions or use `onExit` prop
- ✅ `TestHeader` accepts `onExit` prop for custom navigation
- ❌ `TestHeader` uses `Alert.alert` instead of themed `NavigationModal`
- ❌ No Android back button interception (only header button works)

## Implementation Plan

### Phase 1: Update TestHeader to Use NavigationModal
**File**: `MWSExpo/src/components/TestHeader.tsx`

**Purpose**: Replace `Alert.alert` with themed `NavigationModal` for consistent UX.

**Changes**:
1. Import `NavigationModal` component
2. Add state for modal visibility: `const [showExitModal, setShowExitModal] = useState(false)`
3. Replace `Alert.alert` in `handleBackPress` with `setShowExitModal(true)`
4. Add `NavigationModal` component at the end of the JSX
5. Use existing `onExit` prop for confirm action
6. Use themed messages based on `themeMode`

**Updated `handleBackPress`**:
```typescript
const handleBackPress = () => {
  setShowExitModal(true);
};
```

**NavigationModal Integration**:
```typescript
<NavigationModal
  visible={showExitModal}
  onConfirm={() => {
    setShowExitModal(false);
    if (onExit) {
      onExit();
    } else {
      router.back();
    }
  }}
  onCancel={() => setShowExitModal(false)}
  title={themeMode === 'cyberpunk' ? 'EXIT TEST' : 'Exit Test'}
  message={themeMode === 'cyberpunk' 
    ? 'ARE YOU SURE YOU WANT TO GO BACK TO CABINET? YOUR PROGRESS WILL BE SAVED BUT YOU WILL EXIT THE TEST.'
    : 'Are you sure you want to go back to cabinet? Your progress will be saved but you will exit the test.'}
/>
```

### Phase 2: Create Simple Android Back Button Hook
**File**: `MWSExpo/src/hooks/useAndroidBackButton.ts`

**Purpose**: Simple hook that intercepts Android back button and calls a callback.

**Features**:
- Accept `enabled` boolean to enable/disable interception
- Accept `onBackPress` callback (same signature as `TestHeader.handleBackPress`)
- Use `BackHandler.addEventListener('hardwareBackPress', ...)`
- Return `true` from handler to prevent default back behavior
- Clean up listener on unmount or when disabled
- Platform check: Only enable on Android

**API**:
```typescript
useAndroidBackButton(
  enabled: boolean,
  onBackPress: () => void
)
```

**Implementation Details**:
- Use `useEffect` to add/remove `BackHandler` listener
- Check `Platform.OS === 'android'` before adding listener
- When back button is pressed and `enabled` is true:
  - Call `onBackPress()` callback
  - Return `true` to prevent default navigation
- Clean up listener when `enabled` changes to false or component unmounts

### Phase 3: Integrate into TestHeader
**File**: `MWSExpo/src/components/TestHeader.tsx`

**Purpose**: Add Android back button interception to `TestHeader` component.

**Changes**:
1. Import `useAndroidBackButton` hook
2. Import `Platform` from `react-native`
3. Call hook with `handleBackPress` as callback
4. Enable when test is active (accept `enabled` prop or determine from context)

**Integration**:
```typescript
// Add prop to TestHeader
interface TestHeaderProps {
  testName: string;
  onExit?: () => void;
  enableBackButton?: boolean; // New prop
}

// In component
useAndroidBackButton(
  enableBackButton ?? true, // Default to enabled
  handleBackPress
);
```

**Alternative**: If we want to control it from parent screens, we can pass `enabled` prop based on test state.

### Phase 4: Update Test Screens (Optional - if needed)
**Files**: Test screen files that use `TestHeader`

**Purpose**: Ensure `TestHeader` receives proper `enableBackButton` prop based on test state.

**Pattern**:
```typescript
<TestHeader
  testName={testData?.test_name || 'Test'}
  onExit={handleBackToCabinet} // Use existing handler
  enableBackButton={!isSubmitting && testStarted} // Enable when test active
/>
```

**Enable/Disable Logic**:
- Enable when: Test has started AND not submitting AND not showing results
- Disable when: Test not started OR submitting OR test completed/showing results

### Phase 4: Edge Cases and Refinements

**Edge Cases to Handle**:
1. **Multiple rapid presses**: Debounce or ignore if modal already visible
2. **Navigation during submission**: Disable guard during submission
3. **Test completion**: Disable guard after test is submitted
4. **App backgrounding**: Disable guard when app goes to background (handled by anti-cheating)
5. **Modal already visible**: Prevent showing duplicate modals

**Refinements**:
- Add `Platform.OS === 'android'` check to only enable on Android
- Add debug logging (wrapped in `__DEV__`) for troubleshooting
- Ensure modal is properly themed (already handled by `NavigationModal`)
- Test with different themes (cyberpunk, dark, light)

## File Structure

```
MWSExpo/
├── src/
│   ├── hooks/
│   │   └── useAndroidBackButton.ts          (NEW - simple hook)
│   └── components/
│       ├── TestHeader.tsx                    (UPDATE - use NavigationModal + hook)
│       └── modals/
│           └── NavigationModal.tsx           (EXISTS - no changes needed)
├── app/
│   └── tests/
│       └── [testId]/index.tsx                (OPTIONAL - update enableBackButton prop)
└── docs/
    └── android-back-button-interception-plan.md  (THIS FILE)
```

**Note**: Most test screens already use `TestHeader`, so updating `TestHeader` will automatically apply to all tests. Only need to update test screens if we want custom `enableBackButton` logic.

## Testing Checklist

- [ ] TestHeader shows NavigationModal instead of Alert.alert
- [ ] Android back button shows same modal as header button
- [ ] "Stay" button keeps user on test
- [ ] "Leave" button calls existing `onExit` or `handleBackToCabinet` handlers
- [ ] Modal is properly themed (cyberpunk, dark, light)
- [ ] Back button interception works on all test types (via TestHeader)
- [ ] Back button can be disabled via `enableBackButton` prop
- [ ] Multiple rapid presses don't cause issues (modal already visible check)
- [ ] Works on Android devices (not just emulator)
- [ ] No interference with Terms of Service modal
- [ ] No interference with other modals
- [ ] Header button and Android back button show same modal

## Dependencies

- `react-native`: For `BackHandler` API
- `expo-router`: For navigation (`router.replace`)
- `NavigationModal`: Already exists, no changes needed
- `useTheme`: Already exists for theming

## Notes

- This only affects Android - iOS doesn't have a hardware back button
- Reusing existing `onExit` and `handleBackToCabinet` handlers means no changes needed to test screens
- `TestHeader` is already used by most test screens, so updating it applies everywhere
- The modal messages match the existing `Alert.alert` messages (just themed now)
- Consider adding analytics/logging for back button presses during tests (for anti-cheating insights)
- Simpler approach: One hook, one component update, works everywhere

## Future Enhancements (Optional)

1. **Custom messages per test type**: Different messages for different test types
2. **Progress saving**: Auto-save progress when back button is pressed (before showing modal)
3. **Analytics**: Track how often users press back button during tests
4. **Accessibility**: Ensure modal is accessible with screen readers

