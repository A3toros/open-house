# Android Universal Anti-Cheating Hook Plan

## Overview
Create a universal `useAntiCheatingDetection` hook to replace all scattered anti-cheating code across 8 test types. The hook will track when users minimize the app or navigate back to cabinet during a test, and only clear the cheating attempt keys on successful test submission.

## Existing Unused Components
**Note:** The following components exist but are NOT used anywhere in the app:
- `MWSExpo/src/components/AntiCheatingSystem.tsx` - Component wrapper (unused)
- `MWSExpo/src/utils/antiCheating.ts` - `AntiCheatingManager` class (unused)
- `MWSExpo/src/hooks/useAntiCheating.ts` - React hook (unused)

**Decision:** We will NOT use these existing components. They are over-engineered for our needs (include rapid clicks, timeout detection, warning system, blocking, etc.). However, we WILL include copy/paste blocking since it's simple and effective.

We're creating a simpler, focused hook that:
- Tracks app state changes (background/inactive)
- Tracks navigation away from test
- **Blocks copy/paste in TextInput components** (using `contextMenuHidden` and clipboard clearing)
- Uses simple AsyncStorage key format
- Clears keys only on successful submission

These existing components can be removed later if not needed elsewhere.

## Key Format
```
{student_id}-{test_type}_{test_id}_cheating_attempt
```

Example: `12345-multiple_choice_17_cheating_attempt`

## Test Types (All 8)
1. `multiple-choice` → `multiple_choice`
2. `true-false` → `true_false`
3. `input`
4. `drawing`
5. `matching`
6. `word-matching` → `word_matching`
7. `fill-blanks` → `fill_blanks`
8. `speaking`

## Phase 0: Install Dependencies

**Required Packages:**
```bash
npx expo install expo-clipboard
npm install react-native-background-fetch
```

**Packages:**
- `expo-clipboard` - For clearing clipboard when TextInput gains focus
- `react-native-background-fetch` - For background tasks (will be used for notifications later)

**Note:** We removed `react-native-background-actions` as it was causing crashes. The anti-cheating system now relies solely on timestamp-based detection using AppState monitoring, which is sufficient and more stable.

## Phase 1: Create Universal Hook

### File: `MWSExpo/src/hooks/useAntiCheatingDetection.ts`

**Hook Interface:**
```typescript
interface UseAntiCheatingDetectionOptions {
  studentId: string;
  testType: string;
  testId: string | number;
  enabled?: boolean; // Default: true
}

interface UseAntiCheatingDetectionReturn {
  caughtCheating: boolean;
  visibilityChangeTimes: number;
  clearCheatingKeys: () => Promise<void>; // Call on successful submission
  isMonitoring: boolean;
  // Props to apply to TextInput components to block copy/paste and autofill
  textInputProps: {
    contextMenuHidden: boolean;
    onFocus: () => void; // Clears clipboard
    textContentType?: 'none'; // iOS: Disable autofill
    autoComplete?: 'off'; // Android: Disable autofill
    autoCorrect?: boolean; // Disable autocorrect
    spellCheck?: boolean; // Disable spell check
  };
}
```

**Hook Logic:**
1. **On Mount:**
   - Generate key: `{studentId}-{testType}_{testId}_cheating_attempt`
   - Generate pending timestamp key: `{studentId}-{testType}_{testId}_background_timestamp`
   - Check if cheating key exists in AsyncStorage
   - **Check for pending background timestamp:**
     - If pending timestamp exists, check if it's > 5 seconds old
     - If > 5 seconds: **App was closed during test - serious violation**
     - **Automatically set `visibilityChangeTimes` to 2** (triggers `caught_cheating = true`)
     - Mark as cheating: Write cheating key to AsyncStorage
     - Clear pending timestamp after checking
   - If cheating key exists: Set `caughtCheating = true`, load `visibilityChangeTimes`
   - If not exists: Initialize `caughtCheating = false`, `visibilityChangeTimes = 0`

2. **App State Monitoring with 5-Second Timer:**
   - Listen to `AppState.addEventListener('change')`
   - When app goes to `background` or `inactive`:
     - Write a **pending timestamp** to AsyncStorage: `{studentId}-{testType}_{testId}_background_timestamp` with current timestamp
     - Start a 5-second timer
     - If app returns to `active` within 5 seconds: Clear the pending timestamp and timer (no cheating)
     - If app does NOT return within 5 seconds: Timer fires, mark as **1 cheating attempt**, clear pending timestamp
   
   **Handling App Closure (Using Timestamp-Based Detection):**
   - **Note:** JavaScript-based background services cannot detect app closure in real-time (when app is killed, the service is also killed)
   - **Timestamp-based detection:** We use a fallback approach that detects app closure on app resume
   - **Detection logic:**
     - When app goes to background, write a pending timestamp to AsyncStorage
     - Start a 5-second timer
     - If app returns within 5 seconds: Clear timestamp (no cheating)
     - If app does NOT return within 5 seconds: Timer fires, mark as 1 attempt (minimization)
     - **If app is killed:** Timer never fires, timestamp remains in AsyncStorage
     - On app resume, check if timestamp exists and is > 5 seconds old → Mark as 2 attempts (app closure)
   
   **Background Service (react-native-background-actions):**
   - **Purpose:** Keep app process alive longer when in background (helps with detection window)
   - **Limitation:** Cannot detect app closure in real-time (service is killed when app is killed)
   - **Implementation:**
     - Start background service on test start
     - Service runs while app is in background
     - Helps extend the detection window
     - Service automatically stops when app is killed
   
   - This handles three scenarios:
     - App minimized and returned within 5s: No cheating (timer cleared on return)
     - App minimized and NOT returned within 5s: 1 attempt (timer fires, timestamp cleared)
     - **App closed completely (killed): 2 attempts (timestamp remains, detected on resume)**

3. **Navigation Monitoring:**
   - Detect when user navigates away from test (using `useFocusEffect` or navigation listener)
   - When navigating back to cabinet/dashboard:
     - Write same cheating key to AsyncStorage
     - Increment `visibilityChangeTimes`
     - Set `caughtCheating = true`

4. **Copy/Paste Blocking & Autofill Disabling:**
   - Provide `textInputProps` object with:
     - `contextMenuHidden: true` - Hides context menu (copy/paste options)
     - `onFocus: () => Clipboard.setString('')` - Clears clipboard when input gains focus
     - `textContentType: 'none'` - iOS: Disables autofill suggestions
     - `autoComplete: 'off'` - Android: Disables autofill suggestions
     - `autoCorrect: false` - Disables autocorrect
     - `spellCheck: false` - Disables spell check
   - Apply these props to all TextInput components in test screens
   - This prevents users from:
     - Copying questions/answers or pasting from clipboard
     - Using autofill suggestions (prevents cheating with saved passwords/answers)
   - **Note:** Login page should NOT use these props - keep autofill enabled for login convenience

5. **Clear Function:**
   - `clearCheatingKeys()`:
     - Remove key: `{studentId}-{testType}_{testId}_cheating_attempt`
     - Reset `caughtCheating = false`
     - Reset `visibilityChangeTimes = 0`
     - Only call this on successful test submission

6. **Cleanup:**
   - Remove AppState listener on unmount
   - Remove navigation listener on unmount
   - Do NOT clear keys on unmount (only on successful submission)

## Phase 2: Update All 8 Test Files

### Files to Update:
1. `MWSExpo/app/tests/multiple-choice/[testId]/index.tsx`
2. `MWSExpo/app/tests/true-false/[testId]/index.tsx`
3. `MWSExpo/app/tests/input/[testId]/index.tsx`
4. `MWSExpo/app/tests/drawing/[testId]/index.tsx`
5. `MWSExpo/app/tests/matching/[testId]/index.tsx`
6. `MWSExpo/app/tests/word-matching/[testId]/index.tsx`
7. `MWSExpo/app/tests/fill-blanks/[testId]/index.tsx`
8. `MWSExpo/app/tests/speaking/[testId]/index.tsx`

### Changes Per File:

1. **Remove:**
   - All `useState` for `caughtCheating` and `visibilityChangeTimes`
   - All `useEffect` hooks that load anti-cheating data from AsyncStorage
   - All `useEffect` hooks that monitor `AppState` for anti-cheating
   - All AsyncStorage read/write operations for anti-cheating
   - All manual anti-cheating logic

2. **Add:**
   - Import: `import { useAntiCheatingDetection } from '../../../../src/hooks/useAntiCheatingDetection';`
   - Import Clipboard: `import * as Clipboard from 'expo-clipboard';` (if not already imported)
   - Call hook: `const { caughtCheating, visibilityChangeTimes, clearCheatingKeys, textInputProps } = useAntiCheatingDetection({ studentId: user.student_id, testType: 'multiple_choice', testId });`
   - Apply `textInputProps` to all TextInput components in test screens: `<TextInput {...textInputProps} ... />`
   - **Important:** Do NOT apply these props to login page TextInputs - keep autofill enabled there for user convenience
   - In submission success handler: Call `await clearCheatingKeys();` after successful API response

3. **Update Submission Payload:**
   - Keep existing `caught_cheating` and `visibility_change_times` fields
   - Use values from hook instead of local state

## Phase 3: Navigation Detection

### Option A: Using `useFocusEffect` (Recommended)
- Use `useFocusEffect` from `@react-navigation/native` or `expo-router`
- Detect when screen loses focus (user navigates away)
- Write cheating key when focus is lost

### Option B: Using Navigation Listener
- Use `useEffect` with navigation listener
- Detect `beforeRemove` or `blur` events
- Write cheating key when navigating away

### Option C: Using Router Events (Expo Router)
- Use `useSegments()` or `usePathname()` to detect route changes
- Write cheating key when route changes away from test

**Implementation Note:** Choose the method that works best with Expo Router. `useFocusEffect` is likely the most reliable.

## Phase 4: Key Storage Format

### AsyncStorage Key Structure:
```typescript
const key = `${studentId}-${testType}_${testId}_cheating_attempt`;
const value = JSON.stringify({
  timestamp: new Date().toISOString(),
  visibilityChangeTimes: number,
  caughtCheating: boolean
});
```

**OR simpler:**
```typescript
const key = `${studentId}-${testType}_${testId}_cheating_attempt`;
// Just store "true" or timestamp string - existence of key = cheating detected
await AsyncStorage.setItem(key, new Date().toISOString());
```

**Recommendation:** Use simple string value (timestamp) - existence of key = cheating detected. Count occurrences by checking how many times key was written (or store count separately).

## Phase 5: Implementation Details

### Hook Implementation Steps:

1. **State Management:**
   ```typescript
   const [caughtCheating, setCaughtCheating] = useState(false);
   const [visibilityChangeTimes, setVisibilityChangeTimes] = useState(0);
   const [isMonitoring, setIsMonitoring] = useState(false);
   ```

2. **Key Generation:**
   ```typescript
   const getCheatingKey = useCallback(() => {
     const testIdStr = Array.isArray(testId) ? testId[0] : String(testId || '');
     return `${studentId}-${testType}_${testIdStr}_cheating_attempt`;
   }, [studentId, testType, testId]);
   
   const getBackgroundTimestampKey = useCallback(() => {
     const testIdStr = Array.isArray(testId) ? testId[0] : String(testId || '');
     return `${studentId}-${testType}_${testIdStr}_background_timestamp`;
   }, [studentId, testType, testId]);
   ```

3. **Load Existing Data & Check Background Service Detection:**
   ```typescript
   useEffect(() => {
     const loadCheatingData = async () => {
       const cheatingKey = getCheatingKey();
       const backgroundTimestampKey = getBackgroundTimestampKey();
       
       // Check for existing cheating key (written by background service or timer)
       const cheatingData = await AsyncStorage.getItem(cheatingKey);
       if (cheatingData) {
         try {
           const parsed = JSON.parse(cheatingData);
           if (parsed.reason === 'app_killed') {
             // Background service detected app was killed
             setVisibilityChangeTimes(2);
             setCaughtCheating(true);
           } else {
             // Timer-based detection or legacy format
             setCaughtCheating(true);
             if (parsed.visibilityChangeTimes) {
               setVisibilityChangeTimes(parsed.visibilityChangeTimes);
             }
           }
         } catch (e) {
           // Legacy format - just timestamp string
           setCaughtCheating(true);
         }
       }
       
       // Check for pending background timestamp (fallback if service didn't catch it)
       const pendingTimestamp = await AsyncStorage.getItem(backgroundTimestampKey);
       if (pendingTimestamp) {
         const timestamp = parseInt(pendingTimestamp, 10);
         const now = Date.now();
         const timeDiff = (now - timestamp) / 1000; // seconds
         
         if (timeDiff > 5) {
           // App was closed/killed during test - serious violation
           // Timer never fired (app was killed, not just minimized)
           await AsyncStorage.setItem(cheatingKey, JSON.stringify({
             timestamp: new Date().toISOString(),
             visibilityChangeTimes: 2,
             caughtCheating: true,
             reason: 'app_killed_fallback'
           }));
           setVisibilityChangeTimes(2);
           setCaughtCheating(true);
         }
         
         // Clear pending timestamp after checking
         await AsyncStorage.removeItem(backgroundTimestampKey);
       }
     };
     loadCheatingData();
   }, [getCheatingKey, getBackgroundTimestampKey]);
   ```

4. **App State Monitoring with 5-Second Timer & Background Service:**
   ```typescript
   import BackgroundService from 'react-native-background-actions';
   
   useEffect(() => {
     if (!enabled) return;
     
     let backgroundTimer: NodeJS.Timeout | null = null;
     const cheatingKey = getCheatingKey();
     const backgroundTimestampKey = getBackgroundTimestampKey();
     
     // Start background service for app closure detection
     const startBackgroundService = async () => {
       try {
         await BackgroundService.start({
           taskName: `antiCheating_${studentId}_${testType}_${testId}`,
           delay: 1000, // Check every second
         });
         
         BackgroundService.on('expiration', async () => {
           // Service expired - app was likely killed
           await AsyncStorage.setItem(cheatingKey, JSON.stringify({
             timestamp: new Date().toISOString(),
             visibilityChangeTimes: 2,
             caughtCheating: true,
             reason: 'app_killed'
           }));
         });
       } catch (error) {
         console.warn('Failed to start background service:', error);
       }
     };
     
     startBackgroundService();
     
     const handleAppStateChange = async (nextAppState: AppStateStatus) => {
       if (nextAppState === 'background' || nextAppState === 'inactive') {
         // Write pending timestamp
         const timestamp = Date.now();
         await AsyncStorage.setItem(backgroundTimestampKey, timestamp.toString());
         
         // Start 5-second timer
         backgroundTimer = setTimeout(async () => {
           // 5 seconds passed - app was minimized too long
           // Mark as 1 cheating attempt
           await AsyncStorage.setItem(cheatingKey, new Date().toISOString());
           setVisibilityChangeTimes(prev => prev + 1);
           setCaughtCheating(true);
           // Clear pending timestamp (indicates timer fired, not app closure)
           await AsyncStorage.removeItem(backgroundTimestampKey);
         }, 5000);
         
       } else if (nextAppState === 'active') {
         // App returned to foreground
         if (backgroundTimer) {
           clearTimeout(backgroundTimer);
           backgroundTimer = null;
         }
         
         // Check if background service detected app closure
         const cheatingData = await AsyncStorage.getItem(cheatingKey);
         if (cheatingData) {
           try {
             const parsed = JSON.parse(cheatingData);
             if (parsed.reason === 'app_killed') {
               // Background service detected app was killed
               setVisibilityChangeTimes(2);
               setCaughtCheating(true);
             }
           } catch (e) {
             // Legacy format or parsing error
             setCaughtCheating(true);
           }
         }
         
         // Check if pending timestamp exists (fallback if service didn't catch it)
         const pendingTimestamp = await AsyncStorage.getItem(backgroundTimestampKey);
         if (pendingTimestamp) {
           const timestamp = parseInt(pendingTimestamp, 10);
           const now = Date.now();
           const timeDiff = (now - timestamp) / 1000; // seconds
           
           if (timeDiff > 5) {
             // App was closed/killed during test - serious violation
             // Timer never fired, so this is app closure, not just minimization
             await AsyncStorage.setItem(cheatingKey, JSON.stringify({
               timestamp: new Date().toISOString(),
               visibilityChangeTimes: 2,
               caughtCheating: true,
               reason: 'app_killed_fallback'
             }));
             setVisibilityChangeTimes(2);
             setCaughtCheating(true);
           }
           
           // Clear pending timestamp after checking
           await AsyncStorage.removeItem(backgroundTimestampKey);
         }
       }
     };
     
     const subscription = AppState.addEventListener('change', handleAppStateChange);
     return () => {
       subscription?.remove();
       if (backgroundTimer) {
         clearTimeout(backgroundTimer);
       }
       // Stop background service on cleanup
       BackgroundService.stop().catch(() => {
         // Ignore errors
       });
     };
   }, [enabled, getCheatingKey, getBackgroundTimestampKey, studentId, testType, testId]);
   ```

5. **Navigation Monitoring:**
   ```typescript
   // Using useFocusEffect from expo-router or @react-navigation/native
   useFocusEffect(
     useCallback(() => {
       // Screen is focused (user is on test screen)
       setIsMonitoring(true);
       
       return () => {
         // Screen lost focus (user navigated away)
         if (isMonitoring) {
           const key = getCheatingKey();
           AsyncStorage.setItem(key, new Date().toISOString());
           setVisibilityChangeTimes(prev => prev + 1);
           setCaughtCheating(true);
         }
         setIsMonitoring(false);
       };
     }, [isMonitoring, getCheatingKey])
   );
   ```

6. **Copy/Paste Blocking & Autofill Disabling:**
   ```typescript
   import * as Clipboard from 'expo-clipboard';
   import { Platform } from 'react-native';
   
   const clearClipboard = useCallback(() => {
     Clipboard.setStringAsync('').catch(() => {
       // Ignore errors
     });
   }, []);
   
   const textInputProps = useMemo(() => ({
     contextMenuHidden: true,
     onFocus: clearClipboard,
     // Disable autofill
     textContentType: 'none' as const, // iOS
     autoComplete: 'off' as const, // Android
     autoCorrect: false,
     spellCheck: false,
   }), [clearClipboard]);
   ```

7. **Clear Function:**
   ```typescript
   const clearCheatingKeys = useCallback(async () => {
     const cheatingKey = getCheatingKey();
     const backgroundTimestampKey = getBackgroundTimestampKey();
     
     // Clear both keys
     await AsyncStorage.removeItem(cheatingKey);
     await AsyncStorage.removeItem(backgroundTimestampKey);
     
     setCaughtCheating(false);
     setVisibilityChangeTimes(0);
   }, [getCheatingKey, getBackgroundTimestampKey]);
   ```

## Phase 6: Testing Checklist

### For Each Test Type:
- [ ] Hook is imported and called correctly
- [ ] Old anti-cheating code is removed
- [ ] `caughtCheating` and `visibilityChangeTimes` come from hook
- [ ] Submission payload includes hook values
- [ ] `clearCheatingKeys()` is called on successful submission
- [ ] 5-second timer starts when app goes to background
- [ ] If app returns within 5 seconds: No cheating detected
- [ ] If app does NOT return within 5 seconds: Cheating detected
- [ ] If app is closed completely: Timestamp-based detection marks as 2 attempts on resume (serious violation, triggers cheating flag)
- [ ] Background service starts when test begins
- [ ] Background service stops when test ends or app resumes
- [ ] Timestamp-based detection writes cheating key to AsyncStorage on resume when app was killed (timestamp > 5 seconds old)
- [ ] Key is written when navigating back to cabinet
- [ ] Key is NOT cleared on component unmount
- [ ] Key IS cleared on successful submission
- [ ] Key persists if user closes app and reopens test
- [ ] Copy/paste is blocked in TextInput components (context menu hidden)
- [ ] Clipboard is cleared when TextInput gains focus
- [ ] Autofill is disabled in test TextInputs (`textContentType: 'none'`, `autoComplete: 'off'`)
- [ ] Autofill remains enabled on login page (not using hook props)

### Edge Cases:
- [ ] Test with no student ID (should handle gracefully)
- [ ] Test with invalid test ID (should handle gracefully)
- [ ] Multiple rapid app state changes (should not duplicate keys)
- [ ] App minimized for 3 seconds then returned (should NOT mark as cheating)
- [ ] App minimized for 6 seconds then returned (should mark as 1 attempt, timer fires)
- [ ] App closed completely (killed) and reopened after 10 seconds (background service should detect and mark as 2 attempts immediately)
- [ ] Background service fallback: If service fails, timestamp-based detection should still work
- [ ] App minimized for 6 seconds (timer fires, 1 attempt, timestamp cleared), then app closed: Should NOT double-count (only 1 attempt, not 3)
- [ ] App closed during test (killed): `visibilityChangeTimes` should be set to 2, `caughtCheating` should be true
- [ ] Edge case: App minimized for exactly 5 seconds then killed - may be detected as minimization (1 attempt) rather than closure (2 attempts) - acceptable limitation
- [ ] Navigation away and back multiple times
- [ ] Test submission failure (key should NOT be cleared)
- [ ] Test submission success (key SHOULD be cleared)

## Phase 7: Migration Order

1. **Install dependencies:**
   - `npx expo install expo-clipboard`
   - `npm install react-native-background-fetch`
   - `npm install react-native-background-actions`
2. **Configure AndroidManifest.xml permissions:**
   - **For Expo:** Add permissions to `MWSExpo/app.json` under `android.permissions` array
   - **Required permissions for background services:**
     ```json
     "android": {
       "permissions": [
         // ... existing permissions ...
         "android.permission.FOREGROUND_SERVICE",
         "android.permission.WAKE_LOCK",
         "android.permission.RECEIVE_BOOT_COMPLETED",
         "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"
       ]
     }
     ```
   - **Note:** `react-native-background-actions` and `react-native-background-fetch` may require these permissions
   - **Alternative:** If using bare workflow, add to `MWSExpo/android/app/src/main/AndroidManifest.xml`:
     ```xml
     <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
     <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
     ```
3. **Create hook** (`useAntiCheatingDetection.ts`) with background service integration
4. **Test hook** in one test file (e.g., `multiple-choice`)
5. **Test background service** - Verify it detects app closure correctly
6. **Migrate remaining 7 test files** one by one
7. **Verify all tests** work correctly
8. **Test on multiple devices** - Verify background service works with different battery optimization settings
9. **Delete unused files:**
   - `MWSExpo/src/components/AntiCheatingSystem.tsx`
   - `MWSExpo/src/utils/antiCheating.ts`
   - `MWSExpo/src/hooks/useAntiCheating.ts`
   
   **Note:** These files are not used anywhere in the codebase and can be safely deleted after migration is complete.

## Key Principles

1. **Single Source of Truth:** Hook manages all anti-cheating state
2. **Persistence:** Keys persist until successful submission
3. **Universal:** Same hook works for all 8 test types
4. **Simple:** Key existence = cheating detected
5. **Clear on Success Only:** Keys cleared only on successful API submission
6. **No False Positives:** Only write key on actual app state change or navigation away
7. **Autofill Control:** Disable autofill in tests, but keep it enabled on login page for user convenience
8. **App Closure Detection (Using Timestamp-Based Detection):** 
   - Using timestamp-based detection to detect app closure on resume
   - When app goes to background, write pending timestamp to AsyncStorage
   - If app is killed, timer never fires and timestamp remains
   - On app resume, check if timestamp exists and is > 5 seconds old → Mark as 2 attempts
   - Background service (`react-native-background-actions`) helps keep app alive longer but cannot detect closure in real-time
   - Falls back to timestamp-based detection (which is the primary method)

## Implementation Notes

- Use `expo-router`'s `useFocusEffect` if available, otherwise use `@react-navigation/native`
- Handle test ID as string, number, or array (normalize to string)
- Normalize test type (e.g., `multiple-choice` → `multiple_choice`)
- Add error handling for AsyncStorage operations
- Add logging for debugging (can remove later)

## Background Service Implementation

**Using `react-native-background-actions`:**

1. **Library Benefits:**
   - Modern, well-maintained library compatible with React Native 0.74+
   - Works with Expo (no need to eject)
   - Keeps app process alive longer when in background
   - Provides continuous background task execution
   - **Note:** Cannot detect app closure in real-time (service is killed when app is killed)

2. **Service Configuration:**
   - Start service when test begins
   - Service runs while app is in background (helps extend detection window)
   - Service automatically stops when app is killed (cannot detect this event)
   - Primary detection method: Timestamp-based detection on app resume
   - Stop service when test ends or app resumes

3. **Implementation Details:**
   - Service task name: `antiCheating_{studentId}_{testType}_{testId}`
   - Service runs continuously while app is in background
   - **Limitation:** When app is killed, service is also killed (cannot write to AsyncStorage)
   - **Solution:** Use timestamp-based detection as primary method
   - Timestamp detection: On app resume, check if pending timestamp is > 5 seconds old

4. **Future Enhancements:**
   - Can start service on system boot (for notifications)
   - Can use same service for other background tasks
   - `react-native-background-fetch` will be used for notifications later

5. **Battery Optimization:**
   - May need to request battery optimization exemption (permission: `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`)
   - Some manufacturers may still kill services aggressively
   - Fallback to timestamp-based detection handles this case
   - Can request exemption programmatically if needed (see library documentation)

6. **Testing:**
   - Test on multiple Android devices
   - Test with different battery optimization settings
   - Verify timestamp-based detection works correctly (detects app closure on resume)
   - Verify fallback works if service fails

