# Android Notification System Plan
## Using react-native-background-fetch for Test & Retest Notifications

**Created:** 2025-01-09  
**Status:** Planning  
**Library:** `react-native-background-fetch` (v4.2.8 - already installed)

---

## 📋 Overview

Implement a background notification system that:
1. **Periodically checks for new tests and retests** using `react-native-background-fetch`
2. **Sends local notifications** when new tests/retests are available
3. **Provides a toggle in Settings** to enable/disable notifications
4. **Stores notification preferences** in AsyncStorage
5. **Tracks last checked timestamp** to avoid duplicate notifications

---

## 🎯 Requirements

### Functional Requirements
1. **Background Fetch Configuration**
   - Minimum fetch interval: 15 minutes (configurable)
   - Headless task support for when app is closed
   - Works on Android (primary) and iOS (if needed)

2. **Notification Types**
   - **New Test Available**: Notify when a new test is assigned
   - **Retest Available**: Notify when a retest becomes available
   - **Retest Deadline Reminder**: Optional - notify before retest deadline (future enhancement)

3. **Settings Integration**
   - Toggle switch in SettingsView to enable/disable notifications
   - Persist preference in AsyncStorage
   - Show current notification status

4. **Smart Notification Logic**
   - **Only notify when app is in background or closed** - Skip notifications if app is active/foreground (user can see tests in dashboard)
   - Only notify for tests/retests not seen before
   - Track last notification timestamp per test/retest
   - Avoid duplicate notifications for same test/retest
   - Respect user's notification preference

5. **Data Persistence**
   - Store notification preference: `notification_enabled` (boolean)
   - Store last fetch timestamp: `last_notification_fetch` (ISO string)
   - Store notified test IDs: `notified_tests` (array of test IDs)
   - Store notified retest IDs: `notified_retests` (array of retest assignment IDs)
   - Store last app version: `last_app_version` (string) - For detecting updates

6. **App Update Detection**
   - Detect when app is updated from Google Play
   - Compare stored `last_app_version` with current app version
   - Handle version migrations (clear old state if needed)
   - Reset notification state on major version updates (optional)
   - Preserve user preferences across updates

---

## 🏗️ Architecture

### Components

1. **NotificationService** (`MWSExpo/src/services/notificationService.ts`)
   - Manages background fetch configuration
   - Handles notification scheduling
   - Tracks notification state
   - Provides API to enable/disable notifications

2. **Background Fetch Task** (Headless JS task)
   - Runs periodically in background
   - Fetches new tests and retests from API
   - Compares with last known state
   - Triggers notifications for new items

3. **Settings Integration** (`MWSExpo/src/components/dashboard/SettingsView.tsx`)
   - Add notification toggle switch
   - Display current notification status
   - Save preference to AsyncStorage

4. **Notification Permission Handler**
   - Request notification permissions on first launch
   - Handle permission denial gracefully
   - Show permission request UI if needed

---

## 📦 Dependencies

### Already Installed
- ✅ `react-native-background-fetch` (v4.2.8)
- ✅ `@react-native-async-storage/async-storage` (v1.23.1)
- ✅ `expo-notifications` (SDK 51.0.0) - **INSTALLED** - Required for local notifications
- ✅ `expo-device` (SDK 51.0.0) - **INSTALLED** - Required for device info

### Installation Status
All required dependencies are now installed. No additional packages needed.

---

## 🔧 Implementation Phases

### Phase 0: Setup & Dependencies
- [x] Check if `expo-notifications` is installed - **INSTALLED** ✅
- [x] Install `expo-notifications` if missing - **COMPLETED** ✅
- [x] Install `expo-device` if missing - **COMPLETED** ✅
- [ ] Configure Android permissions in `app.json`:
  - `RECEIVE_BOOT_COMPLETED` (already present from anti-cheating)
  - `VIBRATE` (for notifications)
- [ ] Configure iOS permissions in `app.json` (if iOS support needed)

### Phase 1: Create NotificationService
- [ ] Create `MWSExpo/src/services/notificationService.ts`
- [ ] Implement notification permission request
- [ ] Implement background fetch configuration
- [ ] Implement headless task handler
- [ ] Implement notification scheduling
- [ ] Implement state management (enabled/disabled)
- [ ] Implement AsyncStorage persistence
- [ ] **Implement app update detection** - Compare stored version with current version using `expo-constants`
- [ ] **Implement app update handler** - Clear old notification state, preserve user preferences

**Key Functions:**
```typescript
interface NotificationService {
  // Initialization
  initialize(): Promise<void>;
  configureBackgroundFetch(): Promise<void>;
  
  // Permission Management
  requestPermissions(): Promise<boolean>;
  checkPermissions(): Promise<boolean>;
  
  // Settings
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
  
  // Background Fetch
  startBackgroundFetch(): Promise<void>;
  stopBackgroundFetch(): Promise<void>;
  
  // Notification Management
  scheduleNotification(title: string, body: string, data?: any): Promise<string>;
  cancelNotification(notificationId: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  
  // State Tracking
  getLastFetchTimestamp(): Promise<string | null>;
  setLastFetchTimestamp(timestamp: string): Promise<void>;
  getNotifiedTests(): Promise<number[]>;
  addNotifiedTest(testId: number): Promise<void>;
  getNotifiedRetests(): Promise<number[]>;
  addNotifiedRetest(retestId: number): Promise<void>;
  
  // App Update Detection
  checkAppUpdate(): Promise<boolean>;
  handleAppUpdate(): Promise<void>; // Called when update is detected
  getCurrentAppVersion(): string;
}
```

### Phase 2: Background Fetch Implementation
- [ ] Create headless task handler
- [ ] **Add app state checking** - Skip notifications if app is active
- [ ] Implement test fetching logic
- [ ] Implement retest fetching logic
- [ ] Implement comparison logic (new vs. notified)
- [ ] Implement notification triggering (only when app is background/closed)
- [ ] Handle errors gracefully
- [ ] Add logging for debugging

**Headless Task Flow:**
1. **Check app state** - If app is `active` (foreground), skip notifications and finish task
2. Get student ID from AsyncStorage (from `auth_token` JWT or `auth_user` object)
3. Fetch current active tests from API: `GET /api/get-student-active-tests`
   - Response: `{ tests: ActiveTest[] }` or `{ data: ActiveTest[] }`
4. Load last known state from AsyncStorage:
   - `notified_tests` (array of test IDs)
   - `notified_retests` (array of retest assignment IDs)
5. Filter new tests:
   - Tests where `test_id` not in `notified_tests` array
   - Tests where `retest_available === false` (regular new tests, not retests)
6. Filter new retests:
   - Tests where `retest_available === true`
   - Tests where `retest_assignment_id` not in `notified_retests` array
7. **Only if app is NOT active** (background/inactive/closed):
   - For each new test:
     - Schedule notification: "📝 New Test Available: [test_name]"
     - Add `test_id` to `notified_tests` array in AsyncStorage
   - For each new retest:
     - Schedule notification: "🔄 Retest Available: [test_name]"
     - Add `retest_assignment_id` to `notified_retests` array in AsyncStorage
8. Update `last_notification_fetch` timestamp in AsyncStorage
9. Call `BackgroundFetch.finish(taskId)`

### Phase 3: Settings Integration
- [ ] Update `SettingsView.tsx` to add notification toggle
- [ ] Add notification section in Preferences
- [ ] Implement toggle switch UI
- [ ] Connect to NotificationService
- [ ] Show current status (enabled/disabled)
- [ ] Handle permission requests from settings

**UI Structure:**
```
Preferences Section:
  - Notifications (with toggle)
    - Title: "Test Notifications"
    - Description: "Get notified about new tests and retests"
    - Toggle: Enable/Disable
    - Status: "Enabled" / "Disabled" / "Permissions Required"
```

### Phase 4: App Initialization
- [ ] Initialize NotificationService on app startup
- [ ] **Check for app update** - Compare stored version with current version
- [ ] **Handle app update** - Clear old notification state if needed (optional)
- [ ] Request permissions on first launch
- [ ] Start background fetch if enabled
- [ ] Handle app state changes (foreground/background)
- [ ] Re-register background fetch on app resume

**Initialization Flow:**
1. App starts → **Check for app update** (compare stored version with current)
2. If update detected → **Handle update** (clear old state if needed, preserve preferences)
3. Check if notifications enabled
4. If enabled → Request permissions (if not granted)
5. If permissions granted → Configure and start background fetch
6. If disabled → Do nothing (background fetch not started)
7. Store current app version for next update check

### Phase 5: Notification Content
- [ ] Design notification titles and bodies
- [ ] Add test/retest metadata to notification data
- [ ] Handle notification tap (navigate to test/retest)
- [ ] Add notification icons (optional)
- [ ] Support notification actions (optional, future)

**Notification Examples:**
- **New Test**: "📝 New Test Available" - "You have a new [test_type] test: [test_name]"
- **New Retest**: "🔄 Retest Available" - "A retest is available for: [test_name]"

### Phase 6: Testing & Edge Cases
- [ ] Test background fetch on device (not emulator)
- [ ] Test notification delivery
- [ ] Test permission handling
- [ ] Test enable/disable toggle
- [ ] Test duplicate notification prevention
- [ ] Test app restart behavior
- [ ] Test battery optimization impact
- [ ] Test network failure handling
- [ ] Test API error handling

---

## 📝 Technical Details

### Background Fetch Configuration

```typescript
import BackgroundFetch from 'react-native-background-fetch';

const config = {
  minimumFetchInterval: 15, // minutes
  stopOnTerminate: false, // Continue when app is closed
  startOnBoot: true, // Start on device boot
  enableHeadless: true, // Enable headless task
  requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
  requiresBatteryNotLow: false,
  requiresCharging: false,
  requiresDeviceIdle: false,
  requiresStorageNotLow: false,
};
```

### Headless Task Handler

```typescript
import { AppState } from 'react-native';

// Register headless task
BackgroundFetch.registerHeadlessTask(async (taskId) => {
  console.log('[BackgroundFetch] Headless task started:', taskId);
  
  try {
    // Check app state - only send notifications if app is NOT active
    const appState = AppState.currentState;
    console.log('[BackgroundFetch] Current app state:', appState);
    
    if (appState === 'active') {
      console.log('[BackgroundFetch] App is active (foreground) - skipping notifications');
      // Still update fetch timestamp but don't send notifications
      await setLastFetchTimestamp(new Date().toISOString());
      BackgroundFetch.finish(taskId);
      return;
    }
    
    // App is in background/inactive/closed - proceed with notifications
    console.log('[BackgroundFetch] App is in background - checking for new tests/retests');
    
    // Fetch tests and retests
    const newTests = await fetchNewTests();
    const newRetests = await fetchNewRetests();
    
    // Check against notified items
    const notifiedTests = await getNotifiedTests();
    const notifiedRetests = await getNotifiedRetests();
    
    // Filter new items
    const testsToNotify = newTests.filter(t => !notifiedTests.includes(t.test_id));
    const retestsToNotify = newRetests.filter(r => !notifiedRetests.includes(r.retest_assignment_id));
    
    // Schedule notifications (only if app is not active)
    for (const test of testsToNotify) {
      await scheduleTestNotification(test);
      await addNotifiedTest(test.test_id);
    }
    
    for (const retest of retestsToNotify) {
      await scheduleRetestNotification(retest);
      await addNotifiedRetest(retest.retest_assignment_id);
    }
    
    // Update last fetch timestamp
    await setLastFetchTimestamp(new Date().toISOString());
    
  } catch (error) {
    console.error('[BackgroundFetch] Error in headless task:', error);
  } finally {
    BackgroundFetch.finish(taskId);
  }
});
```

### AsyncStorage Keys

```typescript
import Constants from 'expo-constants';

const STORAGE_KEYS = {
  NOTIFICATION_ENABLED: 'notification_enabled',
  LAST_FETCH_TIMESTAMP: 'last_notification_fetch',
  NOTIFIED_TESTS: 'notified_tests',
  NOTIFIED_RETESTS: 'notified_retests',
  LAST_APP_VERSION: 'last_app_version', // For detecting updates
};

// Get current app version
const getCurrentAppVersion = (): string => {
  return Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0';
};

// Check if app was updated
const checkAppUpdate = async (): Promise<boolean> => {
  const currentVersion = getCurrentAppVersion();
  const lastVersion = await AsyncStorage.getItem(STORAGE_KEYS.LAST_APP_VERSION);
  
  if (lastVersion && lastVersion !== currentVersion) {
    console.log('[NotificationService] App updated:', { from: lastVersion, to: currentVersion });
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_APP_VERSION, currentVersion);
    return true; // App was updated
  }
  
  // First time or same version
  if (!lastVersion) {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_APP_VERSION, currentVersion);
  }
  
  return false; // No update
};
```

### API Endpoints

**Verified endpoints:**
- Get student active tests: `GET /api/get-student-active-tests`
  - Returns: `{ tests: ActiveTest[] }` or `{ data: ActiveTest[] }`
  - Includes tests with `retest_available: true` flag
  - Test structure: `{ test_id, test_name, test_type, retest_available, retest_assignment_id, ... }`
- Get student test results: `GET /api/get-student-test-results?student_id={studentId}&limit=5`
  - Used for reference, not needed for notifications

**Note:** Retests are included in the active tests response with `retest_available: true` flag, so we only need one endpoint.

---

## 🔐 Permissions

### Android (`app.json`)
```json
{
  "android": {
    "permissions": [
      "android.permission.RECEIVE_BOOT_COMPLETED", // Already present
      "android.permission.VIBRATE",
    ]
  }
}
```

### iOS (`app.json`) - If iOS support needed
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["fetch", "processing"]
    }
  }
}
```

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Notifications enabled → Background fetch starts
- [ ] Notifications disabled → Background fetch stops
- [ ] **App active (foreground) → No notifications sent** (user can see tests in dashboard)
- [ ] **App background → Notifications sent** for new tests/retests
- [ ] **App closed → Notifications sent** for new tests/retests
- [ ] New test assigned → Notification received (only if app not active)
- [ ] New retest available → Notification received (only if app not active)
- [ ] Same test/retest → No duplicate notification
- [ ] App closed → Background fetch continues
- [ ] Device reboot → Background fetch restarts
- [ ] Notification tap → Navigates to test/retest

### Edge Cases
- [ ] No internet connection → Graceful failure
- [ ] API error → No crash, logs error
- [ ] Permission denied → Shows appropriate message
- [ ] Battery optimization enabled → Background fetch may be limited
- [ ] Multiple rapid fetches → No duplicate notifications
- [ ] App uninstalled/reinstalled → State resets correctly
- [ ] **App updated from Google Play → Detects update, handles migration**
- [ ] **App updated → Preserves user preferences (notification_enabled)**
- [ ] **App updated → Clears old notification state (notified_tests/retests) if needed**
- [ ] **App updated → Re-initializes background fetch with new version**

### Performance
- [ ] Background fetch doesn't drain battery excessively
- [ ] Notifications delivered within reasonable time (15-30 min)
- [ ] AsyncStorage operations are fast
- [ ] No memory leaks

---

## 🚨 Known Limitations

1. **Battery Optimization**
   - Android battery optimization may limit background fetch frequency
   - Users may need to whitelist app from battery optimization
   - Document this in settings or FAQ

2. **Minimum Fetch Interval**
   - Android: Minimum 15 minutes (enforced by OS)
   - iOS: Minimum varies, typically 15 minutes
   - Cannot guarantee exact timing

3. **App State Detection**
   - Headless tasks may not always have accurate app state
   - When app is closed, `AppState.currentState` may return `'background'` or `'inactive'`
   - When app is truly closed (killed), headless task runs but app state may be unreliable
   - **Solution**: Default to sending notifications in headless task (assumes app is not active)

4. **Network Dependency**
   - Requires internet connection to fetch tests
   - Will fail silently if no network (should log error)

5. **Headless Task Limitations**
   - Limited execution time (typically 30 seconds)
   - Should complete quickly or risk being killed

6. **Notification Delivery**
   - Not guaranteed to be instant
   - Depends on OS scheduling
   - May be delayed if device is in deep sleep

7. **App Update Detection**
   - Uses `expo-constants` to get current app version
   - Compares with stored version in AsyncStorage
   - Detects updates when version changes (e.g., 1.0.0 → 1.0.1)
   - **Note**: Update is detected on next app launch after Google Play update
   - **Recommendation**: Clear `notified_tests` and `notified_retests` on major version updates to avoid stale state

---

## 🔄 App Update Handling

### Update Detection Strategy

**When app is updated from Google Play:**
1. User installs update from Google Play
2. App launches with new version
3. NotificationService checks stored `last_app_version`
4. If version differs → Update detected
5. Handle update (clear state, preserve preferences)
6. Store new version

### Update Handling Options

**Option 1: Clear All Notification State (Recommended)**
```typescript
const handleAppUpdate = async (): Promise<void> => {
  console.log('[NotificationService] Handling app update...');
  
  // Clear notification tracking (user will see tests as "new" again)
  await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFIED_TESTS);
  await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFIED_RETESTS);
  await AsyncStorage.removeItem(STORAGE_KEYS.LAST_FETCH_TIMESTAMP);
  
  // Preserve user preferences
  // notification_enabled stays as-is
  
  console.log('[NotificationService] Cleared notification state after update');
};
```

**Option 2: Preserve State (Alternative)**
```typescript
const handleAppUpdate = async (): Promise<void> => {
  console.log('[NotificationService] App updated, preserving state');
  // Do nothing - keep all notification state
  // User won't get duplicate notifications for tests they already saw
};
```

**Option 3: Major Version Only (Hybrid)**
```typescript
const handleAppUpdate = async (oldVersion: string, newVersion: string): Promise<void> => {
  const [oldMajor] = oldVersion.split('.');
  const [newMajor] = newVersion.split('.');
  
  if (oldMajor !== newMajor) {
    // Major version update (e.g., 1.0.0 → 2.0.0)
    // Clear state for major changes
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFIED_TESTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFIED_RETESTS);
  }
  // Minor/patch updates preserve state
};
```

**Recommendation**: Use **Option 1** (clear all state) to ensure users don't miss notifications after updates, especially if notification logic changes between versions.

---

## 📚 References

- [react-native-background-fetch Documentation](https://github.com/transistorsoft/react-native-background-fetch)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android Background Execution Limits](https://developer.android.com/about/versions/oreo/background)
- [iOS Background Fetch](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing-your-ui-to-run-in-the-background/updating-your-app-with-background-app-refresh)

---

## 🔄 Future Enhancements

1. **Notification Categories**
   - Different notification types (new test, retest, deadline reminder)
   - User can enable/disable per category

2. **Scheduled Notifications**
   - Remind user about upcoming test deadlines
   - Remind user about retest deadlines

3. **Notification Actions**
   - "View Test" button in notification
   - "Dismiss" button in notification

4. **Notification History**
   - Show list of recent notifications in settings
   - Allow user to clear notification history

5. **Custom Fetch Intervals**
   - Allow user to set custom fetch interval (15, 30, 60 minutes)
   - Store preference in AsyncStorage

6. **Quiet Hours**
   - Allow user to set quiet hours (e.g., 10 PM - 7 AM)
   - Don't send notifications during quiet hours

---

## ✅ Implementation Checklist

### Phase 0: Setup
- [ ] Check dependencies
- [ ] Install missing packages
- [ ] Configure permissions in app.json

### Phase 1: NotificationService
- [ ] Create service file
- [ ] Implement permission handling
- [ ] Implement background fetch configuration
- [ ] Implement headless task
- [ ] Implement notification scheduling
- [ ] Implement state management
- [ ] Add error handling
- [ ] Add logging

### Phase 2: Settings Integration
- [ ] Add notification toggle to SettingsView
- [ ] Connect to NotificationService
- [ ] Show current status
- [ ] Handle permission requests

### Phase 3: App Integration
- [ ] Initialize on app startup
- [ ] Handle app state changes
- [ ] Test on device

### Phase 4: Testing
- [ ] Test all functional requirements
- [ ] Test edge cases
- [ ] Test on different Android versions
- [ ] Document any issues

---

**End of Plan**

